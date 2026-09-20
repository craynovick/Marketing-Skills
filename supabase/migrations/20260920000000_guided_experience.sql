-- Additive experience metadata; existing tasks and accepted documents are preserved.
alter table public.cookbook_skills add column if not exists mode text check(mode in ('create','skill-tuning')),
 add column if not exists create_workflow text not null default 'general' check(create_workflow in ('general','analyze','social-post','newsletter'));
update public.cookbook_skills set mode=case when foundation_key is not null or skill_slug in ('customer-interview-synthesizer','ideal-customer-profile-builder','audience-strategy-playbook','brand-claims-confidentiality-guide','brand-positioning-workshop','brand-voice-guide','content-pillar-planner') then 'skill-tuning' else 'create' end where mode is null;
alter table public.cookbook_skills alter column mode set default 'create';
alter table public.cookbook_documents add column if not exists context_versions jsonb not null default '[]';

create table public.cookbook_decisions (
 task_id uuid not null references public.cookbook_skills(id) on delete cascade,
 id text not null, user_id uuid not null references auth.users(id) on delete cascade,
 card jsonb not null, answer jsonb, revision integer not null default 0,
 request_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 primary key(task_id,id), check(length(id) between 1 and 180), check(jsonb_typeof(card)='object')
);
alter table public.cookbook_decisions enable row level security;
create policy "Read own decisions" on public.cookbook_decisions for select to authenticated using(user_id=auth.uid());
create policy "Insert own decisions" on public.cookbook_decisions for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from cookbook_skills where id=task_id and user_id=auth.uid()));
create policy "Update own decisions" on public.cookbook_decisions for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
grant select,insert,update on public.cookbook_decisions to authenticated,service_role;

-- Compare-and-swap answers and save a conversational event in the same transaction.
create or replace function public.cookbook_answer_decision(p_task uuid,p_id text,p_answer jsonb,p_revision integer,p_request uuid)
returns public.cookbook_decisions language plpgsql security invoker set search_path=public as $$
declare d cookbook_decisions; t uuid; selected jsonb; answer_text text; prompt_text text;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 perform 1 from cookbook_skills where id=p_task and user_id=auth.uid() and archived_at is null;
 if not found then raise exception 'INVALID_TASK'; end if;
 select * into d from cookbook_decisions where task_id=p_task and id=p_id and user_id=auth.uid() for update;
 if d.id is null then raise exception 'INVALID_DECISION'; end if;
 if d.request_id=p_request then
   if d.answer is distinct from p_answer then raise exception 'INVALID_DECISION'; end if;
   return d;
 end if;
 if d.revision<>p_revision then raise exception 'STALE_VERSION'; end if;
 if exists(select 1 from cookbook_agent_runs where skill_id=p_task and status in ('queued','running')) then raise exception 'RUN_ACTIVE'; end if;
 if jsonb_typeof(p_answer)<>'object' or length(coalesce(p_answer->>'text',''))>2500 or (p_answer ? 'text' and jsonb_typeof(p_answer->'text')<>'string') or (p_answer ? 'skipped' and jsonb_typeof(p_answer->'skipped')<>'boolean') then raise exception 'INVALID_DECISION'; end if;
 select x into selected from jsonb_array_elements(d.card->'options') x where x->>'id'=p_answer->>'optionId';
 if p_answer ? 'optionId' and selected is null then raise exception 'INVALID_DECISION'; end if;
 if coalesce((p_answer->>'skipped')::boolean,false) then
   if selected is not null or length(trim(coalesce(p_answer->>'text','')))>0 then raise exception 'INVALID_DECISION'; end if;
   answer_text:='Skipped — continue provisionally and mark missing information.';
 else
   answer_text:=concat_ws('. ',selected->>'label',nullif(trim(p_answer->>'text'),''));
   if length(answer_text)=0 then raise exception 'INVALID_DECISION'; end if;
 end if;
 update cookbook_decisions set answer=p_answer,revision=revision+1,request_id=p_request,updated_at=now() where task_id=p_task and id=p_id returning * into d;
 select id into t from cookbook_threads where skill_id=p_task and user_id=auth.uid();
 if t is null then insert into cookbook_threads(user_id,skill_id) values(auth.uid(),p_task) returning id into t; end if;
 prompt_text:=case when p_revision>0 then 'Revised answer. Review affected later work; preserve approved documents. ' else '' end||(d.card->>'prompt')||E'\n'||answer_text;
 insert into cookbook_messages(user_id,thread_id,role,content,parts,message_key,metadata)
 values(auth.uid(),t,'event',prompt_text,'[]','decision:'||p_request::text,jsonb_build_object('decisionId',p_id,'answer',p_answer,'revision',d.revision));
 return d;
end $$;

-- Snapshot the approved context at draft creation; immutable versions retain their provenance.
create or replace function public.cookbook_snapshot_context() returns trigger language plpgsql security invoker set search_path=public as $$
declare task cookbook_skills;
begin
 select * into task from cookbook_skills where id=new.skill_id and user_id=new.user_id;
 if task.context_scope='brand' then
   select coalesce(jsonb_agg(jsonb_build_object('taskId',s.id,'documentId',s.accepted_version_id,'key',coalesce(s.foundation_key,s.skill_slug),'title',s.title)),'[]') into new.context_versions
   from cookbook_skills s where s.user_id=new.user_id and s.project_id=task.project_id and s.id<>task.id and s.accepted_version_id is not null
   and (s.foundation_key is not null or (s.mode='skill-tuning' and s.context_scope='brand'));
 end if;
 return new;
end $$;
create trigger cookbook_document_context before insert on public.cookbook_documents for each row execute function public.cookbook_snapshot_context();

create or replace function public.cookbook_create_experience(p_slug text,p_version text,p_title text,p_key uuid,p_mode text,p_workflow text,p_scope text)
returns uuid language plpgsql security invoker set search_path=public as $$
declare result uuid;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 if p_mode not in ('create','skill-tuning') or p_workflow not in ('general','analyze','social-post','newsletter') or p_scope not in ('brand','task') or (p_mode='skill-tuning' and p_workflow<>'general') then raise exception 'INVALID_TASK'; end if;
 result:=cookbook_create_task(p_slug,p_version,p_title,p_key);
 -- Retry cannot change the identity of an already-used conversation.
 if exists(select 1 from cookbook_messages m join cookbook_threads t on t.id=m.thread_id where t.skill_id=result) then return result; end if;
 update cookbook_skills set mode=p_mode,create_workflow=p_workflow,context_scope=p_scope where id=result and user_id=auth.uid();
 return result;
end $$;
