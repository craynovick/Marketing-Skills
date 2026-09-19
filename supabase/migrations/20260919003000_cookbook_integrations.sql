-- Additive API/MCP storage. Keys are never stored in plaintext or exposed through RLS.
create table public.cookbook_connections (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 project_id uuid not null references public.cookbook_projects(id) on delete cascade,
 name text not null check(length(name) between 1 and 80), key_hash text not null unique,
 scopes text[] not null check(scopes <@ array['context:read','foundations:write','artifacts:write']),
 expires_at timestamptz not null, revoked_at timestamptz, created_at timestamptz not null default now()
);
create table public.cookbook_integration_operations (
 connection_id uuid not null references public.cookbook_connections(id) on delete cascade,
 request_id uuid not null, action text not null, payload jsonb not null, result jsonb not null,
 created_at timestamptz not null default now(), primary key(connection_id,request_id)
);
create table public.cookbook_rate_windows (
 bucket text primary key, started_at timestamptz not null default now(), count integer not null default 1
);
create table public.cookbook_setup_allowances (
 user_id uuid primary key references auth.users(id) on delete cascade,
 hostname text, successes integer not null default 0, completed_at timestamptz
);
create table public.cookbook_scan_reservations (
 id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
 hostname text not null, status text not null check(status in ('reserved','complete','failed')),
 result jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.cookbook_documents add column integration_metadata jsonb not null default '{}';
alter table public.cookbook_skills add column integration_connection_id uuid references public.cookbook_connections(id) on delete set null;
alter table public.cookbook_brand_proposals add column integration_connection_id uuid references public.cookbook_connections(id) on delete set null;
alter table public.cookbook_connections enable row level security;
alter table public.cookbook_integration_operations enable row level security;
alter table public.cookbook_rate_windows enable row level security;
alter table public.cookbook_setup_allowances enable row level security;
alter table public.cookbook_scan_reservations enable row level security;
-- No client policies: access only through server-owned, narrow RPCs.
revoke all on public.cookbook_connections,public.cookbook_integration_operations,public.cookbook_rate_windows,public.cookbook_setup_allowances,public.cookbook_scan_reservations from anon,authenticated;

-- Preserve already consumed analyses; bind legacy accounts to their saved website when available.
insert into public.cookbook_setup_allowances(user_id,hostname,successes)
 select user_id,nullif(regexp_replace(split_part(regexp_replace(lower(website),'^https?://',''), '/',1),'^www\.',''),''),1
 from public.cookbooks where analysis_used_at is not null on conflict do nothing;

create function public.cookbook_paid(p_user uuid,p_self_hosted boolean default false)
returns boolean language sql security definer set search_path=public as $$
 select p_self_hosted or exists(select 1 from auth.users u where u.id=p_user and (to_jsonb(u)->'raw_app_meta_data'->>'role'='admin' or to_jsonb(u)->'raw_app_meta_data'->>'unlimited'='true')) or exists(select 1 from subscriptions where user_id=p_user and plan in ('pro','team') and status in ('active','trialing'));
$$;
create function public.cookbook_rate_limit(p_bucket text,p_limit integer,p_seconds integer)
returns void language plpgsql security definer set search_path=public as $$
declare n integer;
begin
 insert into cookbook_rate_windows(bucket) values(p_bucket) on conflict(bucket) do update
 set count=case when cookbook_rate_windows.started_at<now()-make_interval(secs=>p_seconds) then 1 else cookbook_rate_windows.count+1 end,
 started_at=case when cookbook_rate_windows.started_at<now()-make_interval(secs=>p_seconds) then now() else cookbook_rate_windows.started_at end
 returning count into n;
 if n>p_limit then raise exception 'RATE_LIMITED'; end if;
end $$;

create function public.cookbook_manage_connection(p_user uuid,p_action text,p_data jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare project uuid; result jsonb; connection uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 if p_action='list' then
   select coalesce(jsonb_agg(to_jsonb(c)-'key_hash'),'[]') into result from cookbook_connections c where user_id=p_user;
   return result;
 elsif p_action='revoke' then
   update cookbook_connections set revoked_at=coalesce(revoked_at,now()) where id=(p_data->>'id')::uuid and user_id=p_user returning id into connection;
   if connection is null then raise exception 'NOT_FOUND'; end if;
   return jsonb_build_object('revoked',true);
 elsif p_action='create' then
   perform cookbook_rate_limit('keys:'||p_user,10,3600);
   select id into project from cookbook_projects where user_id=p_user order by created_at,id limit 1;
   if project is null then insert into cookbook_projects(user_id) values(p_user) returning id into project; end if;
   if (select count(*) from cookbook_connections where user_id=p_user and revoked_at is null and expires_at>now())>=10 then raise exception 'CONNECTION_LIMIT'; end if;
   insert into cookbook_connections(user_id,project_id,name,key_hash,scopes,expires_at)
     values(p_user,project,p_data->>'name',p_data->>'hash',array(select jsonb_array_elements_text(p_data->'scopes')),now()+interval '90 days') returning id into connection;
   select to_jsonb(c)-'key_hash' into result from cookbook_connections c where id=connection;
   return result;
 end if;
 raise exception 'INVALID_ACTION';
end $$;

-- Only the service role may call this. Verified key identity is projected into the
-- transaction for the existing versioned-document RPCs, never supplied by a client.
create function public.cookbook_integration(p_hash text,p_action text,p_payload jsonb default '{}',p_self_hosted boolean default false)
returns jsonb language plpgsql security definer set search_path=public as $$
<<op>>
declare c cookbook_connections; paid boolean; required_scope text; result jsonb; previous cookbook_integration_operations;
 task uuid; proposal cookbook_brand_proposals; doc cookbook_documents; request_id uuid; item jsonb; n integer;
begin
 select * into c from cookbook_connections where key_hash=p_hash and revoked_at is null and expires_at>now();
 if c.id is null then raise exception 'AUTH_REQUIRED'; end if;
 perform 1 from cookbook_projects where id=c.project_id and user_id=c.user_id;
 if not found then raise exception 'AUTH_REQUIRED'; end if;
 perform pg_advisory_xact_lock(hashtextextended(c.user_id::text,0));
 select * into c from cookbook_connections where key_hash=p_hash and revoked_at is null and expires_at>now() for share;
 if c.id is null then raise exception 'AUTH_REQUIRED'; end if;
 perform cookbook_rate_limit('integration:'||c.id,120,60);
 paid:=cookbook_paid(c.user_id,p_self_hosted);
 required_scope:=case when p_action='propose' then 'foundations:write' when p_action='save' then 'artifacts:write' else 'context:read' end;
 if p_action<>'connection' and not(required_scope=any(c.scopes)) then raise exception 'FORBIDDEN'; end if;
 -- Set both JWT conventions used by supported Supabase auth.uid() implementations.
 perform set_config('request.jwt.claim.sub',c.user_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',c.user_id,'role','service_role')::text,true);
 if p_action='connection' then
   return (to_jsonb(c)-'key_hash'-'user_id')||jsonb_build_object('entitlements',jsonb_build_object('foundations',true,'deliverables',paid,'hostedWorkflows',paid));
 elsif p_action='pantry' then
   select coalesce(jsonb_agg(jsonb_build_object('key',s.foundation_key,'approvedContent',a.content,'approvedVersion',coalesce(a.version,0),
    'latestVersion',coalesce(d.version,0),'pending',exists(select 1 from cookbook_brand_proposals bp,jsonb_array_elements(bp.items) i where bp.project_id=c.project_id and bp.status='pending' and i->>'key'=s.foundation_key))),'[]') into result
   from cookbook_skills s
   left join cookbook_documents a on a.id=s.accepted_version_id and a.user_id=c.user_id
   left join lateral(select version from cookbook_documents where skill_id=s.id and user_id=c.user_id order by version desc limit 1) d on true
   where s.project_id=c.project_id and s.user_id=c.user_id and s.foundation_key is not null;
   return jsonb_build_object('sections',result,'projectId',c.project_id);
 elsif p_action='list' then
   n:=least(greatest(coalesce((p_payload->>'limit')::integer,20),1),100);
   select coalesce(jsonb_agg(to_jsonb(t)),'[]') into result from (
     select s.id,s.title,s.skill_slug,s.created_at,s.accepted_version_id from cookbook_skills s
     where s.user_id=c.user_id and s.project_id=c.project_id and s.foundation_key is null and s.archived_at is null
     and exists(select 1 from cookbook_documents d where d.skill_id=s.id and d.user_id=c.user_id)
     and (p_payload->>'before' is null or (s.created_at,s.id)<((p_payload->>'before')::timestamptz,(p_payload->>'beforeId')::uuid))
     order by s.created_at desc,s.id desc limit n+1
   ) t;
   return result;
 elsif p_action='get' then
   select to_jsonb(s)||jsonb_build_object('document',to_jsonb(d)) into result from cookbook_skills s
   join lateral(select id,content,version,status,created_at,integration_metadata from cookbook_documents where skill_id=s.id and user_id=c.user_id order by version desc limit 1) d on true
   where s.id=(p_payload->>'id')::uuid and s.user_id=c.user_id and s.project_id=c.project_id and s.foundation_key is null;
   if result is null then raise exception 'NOT_FOUND'; end if;
   return result;
 elsif p_action not in ('propose','save') then raise exception 'INVALID_ACTION'; end if;
 request_id:=(p_payload->>'requestId')::uuid;
 if request_id is null then raise exception 'INVALID_DOCUMENT'; end if;
 select * into previous from cookbook_integration_operations where connection_id=c.id and cookbook_integration_operations.request_id=op.request_id;
 if previous.request_id is not null then
   if previous.action<>p_action or previous.payload<>p_payload then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
   return previous.result;
 end if;
 if p_action='propose' then
   insert into cookbook_skills(user_id,project_id,file_name,title,skill_slug,skill_version,integration_connection_id,context_scope)
    values(c.user_id,c.project_id,'integration-'||request_id||'.md','Brand updates from '||c.name,'marketing-chat','1.0.0',c.id,'brand') returning id into task;
   insert into cookbook_threads(user_id,skill_id) values(c.user_id,task);
   proposal:=cookbook_propose_brand(task,p_payload->'updates',c.id||':'||request_id);
   update cookbook_brand_proposals set integration_connection_id=c.id where id=proposal.id;
   for item in select * from jsonb_array_elements(proposal.items) loop
     update cookbook_documents set source='agent',integration_metadata=jsonb_build_object('connectionId',c.id,'agentName',p_payload->>'agentName') where id=(item->>'documentId')::uuid and user_id=c.user_id;
   end loop;
   result:=jsonb_build_object('proposalId',proposal.id,'taskId',task,'status','pending_review');
 else
   if not paid then raise exception 'PLAN_REQUIRED'; end if;
   insert into cookbook_skills(user_id,project_id,file_name,title,skill_slug,skill_version,integration_connection_id,context_scope)
    values(c.user_id,c.project_id,'artifact-'||request_id||'.md',p_payload->>'title',p_payload->>'skillSlug',p_payload->>'skillVersion',c.id,'task') returning id into task;
   insert into cookbook_threads(user_id,skill_id) values(c.user_id,task);
   doc:=cookbook_save_document(task,p_payload->>'contentMarkdown',0,'agent',c.id||':'||request_id);
   update cookbook_documents set integration_metadata=jsonb_build_object('connectionId',c.id,'agentName',p_payload->>'agentName','metadata',p_payload->'metadata') where id=doc.id;
   result:=jsonb_build_object('id',task,'documentId',doc.id,'version',doc.version,'status','draft');
 end if;
 insert into cookbook_integration_operations values(c.id,request_id,p_action,p_payload,result,now());
 return result;
end $$;

create function public.cookbook_scan_control(p_user uuid,p_action text,p_data jsonb default '{}',p_self_hosted boolean default false)
returns jsonb language plpgsql security definer set search_path=public as $$
<<scan>>
declare a cookbook_setup_allowances; r cookbook_scan_reservations; paid boolean; id uuid; host text;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 insert into cookbook_setup_allowances(user_id) values(p_user) on conflict do nothing;
 select * into a from cookbook_setup_allowances where user_id=p_user for update;
 paid:=cookbook_paid(p_user,p_self_hosted);
 if p_action='status' then return to_jsonb(a)||jsonb_build_object('paid',paid,'remaining',greatest(0,4-a.successes)); end if;
 if p_action='complete' then
   update cookbook_setup_allowances set completed_at=coalesce(completed_at,now()) where user_id=p_user;
   return jsonb_build_object('completed',true);
 end if;
 id:=(p_data->>'requestId')::uuid;
 if id is null then raise exception 'INVALID_DOCUMENT'; end if;
 select * into r from cookbook_scan_reservations where cookbook_scan_reservations.id=scan.id;
 if r.id is not null and r.user_id<>p_user then raise exception 'NOT_FOUND'; end if;
 if p_action='reserve' then
   host:=p_data->>'hostname';
   if r.id is not null and r.hostname<>host then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
   if r.status='complete' then return jsonb_build_object('cached',r.result); end if;
   if r.status='reserved' and r.updated_at>now()-interval '3 minutes' then raise exception 'SCAN_ACTIVE'; end if;
   perform cookbook_rate_limit('scan:'||p_user,8,3600);
   update cookbook_scan_reservations set status='failed' where user_id=p_user and status='reserved' and updated_at<now()-interval '3 minutes';
   if exists(select 1 from cookbook_scan_reservations where user_id=p_user and status='reserved') then raise exception 'SCAN_ACTIVE'; end if;
   if not paid then
     if a.completed_at is not null or a.successes>=4 then raise exception 'SCAN_LIMIT'; end if;
     if a.hostname is not null and a.hostname<>host then raise exception 'SITE_LOCKED'; end if;
     if a.successes>0 then
       if coalesce(p_data->>'foundation','') not in ('brand','audience','voice','content','proof','guardrails') or length(trim(coalesce(p_data->>'gap','')))<10 then raise exception 'EVIDENCE_GAP_REQUIRED'; end if;
       if exists(select 1 from cookbook_skills where user_id=p_user and foundation_key=p_data->>'foundation' and accepted_version_id is not null) then raise exception 'FOUNDATION_COMPLETE'; end if;
     end if;
   end if;
   insert into cookbook_scan_reservations(id,user_id,hostname,status) values(scan.id,p_user,host,'reserved')
    on conflict on constraint cookbook_scan_reservations_pkey do update set status='reserved',updated_at=now();
   return jsonb_build_object('reserved',true);
 elsif p_action='finish' then
   if r.status='complete' then return jsonb_build_object('complete',true); end if;
   if r.status is distinct from 'reserved' then raise exception 'SCAN_EXPIRED'; end if;
   update cookbook_scan_reservations set status='complete',result=p_data->'result',updated_at=now() where cookbook_scan_reservations.id=r.id;
   update cookbook_setup_allowances set hostname=coalesce(hostname,r.hostname),successes=successes+1 where user_id=p_user;
   return jsonb_build_object('complete',true);
 elsif p_action='fail' then
   update cookbook_scan_reservations set status='failed',updated_at=now() where cookbook_scan_reservations.id=r.id and status='reserved';
   return jsonb_build_object('released',true);
 end if;
 raise exception 'INVALID_ACTION';
end $$;

revoke all on function public.cookbook_paid(uuid,boolean),public.cookbook_rate_limit(text,integer,integer),public.cookbook_manage_connection(uuid,text,jsonb),public.cookbook_integration(text,text,jsonb,boolean),public.cookbook_scan_control(uuid,text,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.cookbook_paid(uuid,boolean),public.cookbook_rate_limit(text,integer,integer),public.cookbook_manage_connection(uuid,text,jsonb),public.cookbook_integration(text,text,jsonb,boolean),public.cookbook_scan_control(uuid,text,jsonb,boolean) to service_role;

grant all on public.cookbook_connections,public.cookbook_integration_operations,public.cookbook_rate_windows,public.cookbook_setup_allowances,public.cookbook_scan_reservations to service_role;
