-- Additive: existing conversations and immutable documents remain intact.
alter table public.cookbook_skills
  add column if not exists foundation_key text check (foundation_key in ('brand','audience','voice','content','proof','guardrails')),
  add column if not exists scope_reviewed boolean not null default false,
  add column if not exists context_scope text not null default 'brand' check (context_scope in ('brand','task'));
create unique index if not exists cookbook_foundation_identity on public.cookbook_skills(project_id,foundation_key) where foundation_key is not null;
alter table public.cookbook_agent_runs drop constraint if exists cookbook_agent_runs_status_check;
alter table public.cookbook_agent_runs add constraint cookbook_agent_runs_status_check
  check(status in ('queued','running','awaiting_input','completed','failed','cancelled','interrupted'));
alter table public.cookbook_agent_runs add column if not exists workflow_id text,
  add column if not exists draft_version integer not null default 0,
  add column if not exists model_id text, add column if not exists metrics jsonb not null default '{}';
create unique index if not exists cookbook_workflow_identity on public.cookbook_agent_runs(workflow_id) where workflow_id is not null;
create table public.cookbook_brand_proposals (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.cookbook_projects(id) on delete cascade,
  task_id uuid not null references public.cookbook_skills(id) on delete cascade,
  run_id uuid references public.cookbook_agent_runs(id), operation_key text not null,
  items jsonb not null, status text not null default 'pending' check(status in ('pending','kept','skipped')),
  created_at timestamptz not null default now(), unique(user_id,operation_key)
);
alter table public.cookbook_brand_proposals enable row level security;
create policy "Read own proposals" on public.cookbook_brand_proposals for select to authenticated using(user_id=auth.uid());
create index cookbook_proposals_task on public.cookbook_brand_proposals(task_id,created_at desc);

-- Invoker RPCs need insert/update privileges; ownership also applies to writes.
create policy "Write own proposals" on public.cookbook_brand_proposals for insert to authenticated with check(user_id=auth.uid());
create policy "Update own proposals" on public.cookbook_brand_proposals for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

create or replace function public.cookbook_propose_brand(p_task uuid,p_updates jsonb,p_operation text,p_run uuid default null)
returns public.cookbook_brand_proposals language plpgsql security invoker set search_path=public as $$
declare project uuid; item jsonb; foundation uuid; doc cookbook_documents; result cookbook_brand_proposals; saved jsonb:='[]';
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
  select project_id into project from cookbook_skills where id=p_task and user_id=auth.uid() and context_scope='brand' and archived_at is null;
  if project is null then raise exception 'INVALID_TASK'; end if;
  if p_run is not null then
    perform 1 from cookbook_agent_runs where id=p_run and skill_id=p_task and user_id=auth.uid() and status='running' for update;
    if not found then raise exception 'RUN_STOPPED'; end if;
  end if;
  select * into result from cookbook_brand_proposals where user_id=auth.uid() and operation_key=p_operation;
  if result.id is not null then return result; end if;
  if jsonb_typeof(p_updates)<>'array' or jsonb_array_length(p_updates) not between 1 and 6 then raise exception 'INVALID_DOCUMENT'; end if;
  if (select count(distinct x->>'key') from jsonb_array_elements(p_updates) x)<>jsonb_array_length(p_updates) then raise exception 'INVALID_DOCUMENT'; end if;
  for item in select * from jsonb_array_elements(p_updates) loop
    if item->>'key' not in ('brand','audience','voice','content','proof','guardrails') or length(coalesce(item->>'content','')) not between 1 and 20000
      or jsonb_typeof(item->'sources')<>'array' or jsonb_array_length(item->'sources')>20 then raise exception 'INVALID_DOCUMENT'; end if;
    insert into cookbook_skills(user_id,project_id,file_name,title,foundation_key)
      values(auth.uid(),project,item->>'key'||'.md',initcap(item->>'key'),item->>'key')
      on conflict(project_id,foundation_key) where foundation_key is not null do nothing;
    select id into foundation from cookbook_skills where project_id=project and foundation_key=item->>'key' and user_id=auth.uid();
    -- The source run belongs to the conversation, not the foundation. Lock above
    -- makes cancellation and the complete multi-document transaction mutually exclusive.
    doc := cookbook_save_document(foundation,item->>'content',(item->>'expectedVersion')::integer,
      case when p_run is null then 'user' else 'agent' end,p_operation||':'||(item->>'key'),null,
      jsonb_build_object('sources',item->'sources'));
    saved:=saved||jsonb_build_array(jsonb_build_object('key',item->>'key','taskId',foundation,'documentId',doc.id,'version',doc.version,'content',doc.content,'sources',item->'sources'));
  end loop;
  insert into cookbook_brand_proposals(user_id,project_id,task_id,run_id,operation_key,items)
    values(auth.uid(),project,p_task,p_run,p_operation,saved) returning * into result;
  return result;
end $$;

create or replace function public.cookbook_review_brand(p_proposal uuid,p_action text)
returns public.cookbook_brand_proposals language plpgsql security invoker set search_path=public as $$
declare result cookbook_brand_proposals; item jsonb; latest uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
  select * into result from cookbook_brand_proposals where id=p_proposal and user_id=auth.uid() for update;
  if result.id is null then raise exception 'INVALID_TASK'; end if;
  if p_action not in ('kept','skipped') then raise exception 'INVALID_ACTION'; end if;
  if result.status=p_action then return result; end if;
  if result.status<>'pending' then raise exception 'STALE_VERSION'; end if;
  if p_action='kept' then
    for item in select * from jsonb_array_elements(result.items) loop
      perform 1 from cookbook_skills where id=(item->>'taskId')::uuid and user_id=auth.uid() for update;
      select id into latest from cookbook_documents where skill_id=(item->>'taskId')::uuid and user_id=auth.uid() order by version desc limit 1;
      if latest is distinct from (item->>'documentId')::uuid then raise exception 'STALE_VERSION'; end if;
      perform cookbook_accept_document((item->>'taskId')::uuid,(item->>'version')::integer);
    end loop;
  end if;
  update cookbook_brand_proposals set status=p_action where id=p_proposal returning * into result;
  return result;
end $$;

-- Queue creation is transactional and request IDs are retry-safe.
create or replace function public.cookbook_queue_run(p_task uuid,p_run uuid,p_input text,p_attachments jsonb)
returns uuid language plpgsql security invoker set search_path=public as $$
declare t uuid; existing cookbook_agent_runs; unlimited boolean;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
  perform 1 from cookbook_skills where id=p_task and user_id=auth.uid() and archived_at is null and foundation_key is null for update;
  if not found then raise exception 'INVALID_TASK'; end if;
  select * into existing from cookbook_agent_runs where id=p_run;
  if existing.id is not null then
    if existing.user_id<>auth.uid() or existing.skill_id<>p_task or existing.input<>p_input or existing.attachment_ids<>p_attachments then raise exception 'INVALID_TASK'; end if;
    return p_run;
  end if;
  if exists(select 1 from cookbook_agent_runs where skill_id=p_task and status in ('queued','running')) then raise exception 'RUN_ACTIVE'; end if;
  unlimited:=coalesce(auth.jwt()->'app_metadata'->>'unlimited','false')='true' or coalesce(auth.jwt()->'app_metadata'->>'role','')='admin';
  if not unlimited and (select count(*) from cookbook_agent_runs where user_id=auth.uid() and created_at>now()-interval '1 hour')>=30 then raise exception 'RATE_LIMITED'; end if;
  if length(trim(p_input)) not between 1 and 4000 or jsonb_typeof(p_attachments)<>'array' or jsonb_array_length(p_attachments)>5 then raise exception 'INVALID_MESSAGE'; end if;
  if exists(select 1 from jsonb_array_elements_text(p_attachments) a where not exists(select 1 from cookbook_attachments where id=a::uuid and skill_id=p_task and user_id=auth.uid())) then raise exception 'INVALID_TASK'; end if;
  select id into t from cookbook_threads where skill_id=p_task and user_id=auth.uid();
  if t is null then insert into cookbook_threads(user_id,skill_id) values(auth.uid(),p_task) returning id into t; end if;
  insert into cookbook_agent_runs(id,user_id,skill_id,input,attachment_ids,status,draft_version)
    values(p_run,auth.uid(),p_task,p_input,p_attachments,'queued',(select coalesce(max(version),0) from cookbook_documents where skill_id=p_task and user_id=auth.uid()));
  insert into cookbook_messages(user_id,thread_id,role,content,parts,message_key,metadata)
    values(auth.uid(),t,'user',p_input,jsonb_build_array(jsonb_build_object('type','text','text',p_input)),p_run::text,jsonb_build_object('runId',p_run,'attachmentIds',p_attachments));
  return p_run;
end $$;

-- Background-only bridge to existing versioned RPCs. The owner is read from the
-- persisted run, never accepted from the model or a client-supplied user ID.
create or replace function public.cookbook_worker_write(p_run uuid,p_action text,p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare r cookbook_agent_runs; d cookbook_documents; proposal cookbook_brand_proposals;
begin
  if auth.role()<>'service_role' then raise exception 'AUTH_REQUIRED'; end if;
  select * into r from cookbook_agent_runs where id=p_run;
  if r.id is null then raise exception 'INVALID_TASK'; end if;
  perform pg_advisory_xact_lock(hashtextextended(r.user_id::text,0));
  select * into r from cookbook_agent_runs where id=p_run for update;
  if r.id is null or r.status<>'running' then raise exception 'RUN_STOPPED'; end if;
  perform 1 from cookbook_skills where id=r.skill_id and user_id=r.user_id and archived_at is null;
  if not found then raise exception 'INVALID_TASK'; end if;
  perform set_config('request.jwt.claim.sub',r.user_id::text,true);
  if p_action='document' then
    d:=cookbook_save_document(r.skill_id,p_payload->>'content',r.draft_version,'agent',p_payload->>'operation',r.id,p_payload->'metadata');
    update cookbook_agent_runs set draft_version=d.version,updated_at=now() where id=r.id;
    return to_jsonb(d);
  elsif p_action='brand' then
    proposal:=cookbook_propose_brand(r.skill_id,p_payload->'updates',p_payload->>'operation',r.id);
    return to_jsonb(proposal);
  elsif p_action='task-scope' then
    update cookbook_skills set context_scope='task' where id=r.skill_id and user_id=r.user_id;
    return jsonb_build_object('scope','task');
  end if;
  raise exception 'INVALID_ACTION';
end $$;
revoke all on function public.cookbook_worker_write(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.cookbook_worker_write(uuid,text,jsonb) to service_role;

-- Metadata only: no per-task document requests or content in the sidebar.
create or replace function public.cookbook_list_tasks(p_before timestamptz default null,p_limit integer default 30,p_archived boolean default false,p_before_id uuid default null)
returns jsonb language sql security invoker set search_path=public as $$
  select coalesce(jsonb_agg(to_jsonb(t)),'[]') from (
    select s.*,exists(select 1 from cookbook_documents d where d.skill_id=s.id and d.user_id=auth.uid()) as has_document,
      (select r.status from cookbook_agent_runs r where r.skill_id=s.id and r.user_id=auth.uid() order by r.created_at desc limit 1) as run_status
    from cookbook_skills s where s.user_id=auth.uid() and s.foundation_key is null and (s.archived_at is not null)=p_archived
      and (p_before is null or s.updated_at<p_before or (s.updated_at=p_before and s.id<p_before_id))
    order by s.updated_at desc,s.id desc limit least(greatest(p_limit,1),100)
  ) t;
$$;

-- Import explicit saved profile fields without rewriting or deleting legacy work.
do $$
declare profile record; project uuid; foundation uuid; doc uuid; k text; fields text[]; field text; body text;
begin
  for profile in select user_id,to_jsonb(c) as value from cookbooks c loop
    select id into project from cookbook_projects where user_id=profile.user_id order by created_at limit 1;
    if project is null then insert into cookbook_projects(user_id) values(profile.user_id) returning id into project; end if;
    foreach k in array array['brand','audience','voice','content','proof','guardrails'] loop
      fields:=case k when 'brand' then array['company','website','offer','positioning'] when 'content' then array['pillars','formats'] when 'guardrails' then array['constraints'] else array[k] end;
      body:='# '||initcap(k)||E'\n';
      foreach field in array fields loop
        if length(trim(coalesce(profile.value->>field,'')))>0 then body:=body||E'\n## '||initcap(field)||E'\n\n'||(profile.value->>field)||E'\n'; end if;
      end loop;
      if body='# '||initcap(k)||E'\n' then continue; end if;
      insert into cookbook_skills(user_id,project_id,file_name,title,foundation_key) values(profile.user_id,project,k||'.md',initcap(k),k)
        on conflict(project_id,foundation_key) where foundation_key is not null do nothing returning id into foundation;
      if foundation is null then continue; end if;
      insert into cookbook_documents(user_id,skill_id,content,version,source,status,operation_key,assumptions)
        values(profile.user_id,foundation,body,1,'user','accepted','profile-import',jsonb_build_array('Imported from user-saved Cookbook profile; not independently verified.')) returning id into doc;
      update cookbook_skills set accepted_version_id=doc,lifecycle='accepted' where id=foundation;
      insert into cookbook_acceptance_events(user_id,skill_id,document_id) values(profile.user_id,foundation,doc);
    end loop;
  end loop;
end $$;

create or replace function public.cookbook_read_foundations(p_project uuid)
returns jsonb language sql security invoker set search_path=public as $$
 select coalesce(jsonb_agg(to_jsonb(s)||jsonb_build_object('document',latest.doc,'confirmed',accepted.doc)),'[]')
 from cookbook_skills s
 left join lateral (select to_jsonb(d) doc from cookbook_documents d where d.skill_id=s.id and d.user_id=auth.uid() order by version desc limit 1) latest on true
 left join lateral (select to_jsonb(d) doc from cookbook_documents d where d.id=s.accepted_version_id and d.user_id=auth.uid()) accepted on true
 where s.project_id=p_project and s.user_id=auth.uid() and s.foundation_key is not null;
$$;

grant execute on function public.cookbook_save_document(uuid,text,integer,text,text,uuid,jsonb), public.cookbook_accept_document(uuid,integer) to service_role;
