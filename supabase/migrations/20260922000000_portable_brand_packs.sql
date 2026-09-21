-- A pack is the website snapshot of one portable brand brief. Existing foundations stay intact.
create table public.cookbook_brand_packs (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 source_project_id uuid references public.cookbook_projects(id) on delete set null,
 brief text not null check(length(brief) between 1 and 8000),
 website text not null default '' check(length(website)<=2000),
 content text not null check(length(content) between 1 and 50000),
 evidence jsonb not null default '[]'::jsonb check(jsonb_typeof(evidence)='array' and jsonb_array_length(evidence)<=24 and octet_length(evidence::text)<=200000),
 coverage text not null default 'User-supplied brief; public research has not run.' check(length(coverage)<=4000),
 status text not null default 'draft' check(status in ('draft','queued','researching','ready','failed','reviewed')),
 stage text not null default '',
 error text,
 revision integer not null default 1,
 research_key uuid,
 research_started_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index cookbook_packs_owner on public.cookbook_brand_packs(user_id,updated_at desc);
alter table public.cookbook_brand_packs enable row level security;
create policy cookbook_pack_owner on public.cookbook_brand_packs for select to authenticated using(user_id=auth.uid());
revoke all on public.cookbook_brand_packs from anon, authenticated;
grant select on public.cookbook_brand_packs to authenticated;
grant all on public.cookbook_brand_packs to service_role;

create table public.cookbook_pack_research_attempts (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 pack_id uuid not null references public.cookbook_brand_packs(id) on delete cascade,
 created_at timestamptz not null default now()
);
create index cookbook_pack_attempt_owner on public.cookbook_pack_research_attempts(user_id,created_at desc);
alter table public.cookbook_pack_research_attempts enable row level security;
revoke all on public.cookbook_pack_research_attempts from anon, authenticated;
grant all on public.cookbook_pack_research_attempts to service_role;

-- All user mutations pass through one transactional, ownership/version checked boundary.
create function public.cookbook_pack_command(p_action text,p_id uuid,p_revision integer,p_payload jsonb default '{}'::jsonb)
returns public.cookbook_brand_packs language plpgsql security definer set search_path=public as $$
declare result cookbook_brand_packs; attempt cookbook_pack_research_attempts; project uuid; run_key uuid;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,42));
 select * into result from cookbook_brand_packs where id=p_id and user_id=auth.uid() for update;
 if p_action='create' then
  if result.id is not null then
   if result.brief is distinct from p_payload->>'brief'
    or result.website is distinct from coalesce(p_payload->>'website','')
    or result.source_project_id is distinct from nullif(p_payload->>'projectId','')::uuid then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
   return result;
  end if;
  if (select count(*) from cookbook_brand_packs where user_id=auth.uid() and created_at>now()-interval '1 day')>=20 then raise exception 'RATE_LIMITED'; end if;
  project:=nullif(p_payload->>'projectId','')::uuid;
  if project is not null and not exists(select 1 from cookbook_projects where id=project and user_id=auth.uid()) then raise exception 'INVALID_BRAND'; end if;
  insert into cookbook_brand_packs(id,user_id,source_project_id,brief,website,content,evidence,coverage)
   values(p_id,auth.uid(),project,p_payload->>'brief',coalesce(p_payload->>'website',''),p_payload->>'content','[]'::jsonb,coalesce(p_payload->>'coverage','User-supplied brief; public research has not run.')) returning * into result;
  return result;
 end if;
 if result.id is null then raise exception 'NOT_FOUND'; end if;
 if p_action='research' then
  run_key:=(p_payload->>'requestId')::uuid;
  if run_key is null then raise exception 'INVALID_REQUEST'; end if;
  select * into attempt from cookbook_pack_research_attempts where id=run_key;
  if attempt.id is not null then
   if attempt.user_id<>auth.uid() or attempt.pack_id<>p_id then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
   return result;
  end if;
 end if;
 if p_revision is null or result.revision<>p_revision then raise exception 'STALE_VERSION'; end if;
 if p_action='save' then
  if result.status in ('queued','researching') then raise exception 'RUN_ACTIVE'; end if;
  update cookbook_brand_packs set content=p_payload->>'content', status=case when p_payload->>'reviewed'='true' then 'reviewed' else 'draft' end,
   revision=revision+1,updated_at=now(),error=null where id=p_id returning * into result;
 elsif p_action='research' then
  if result.status in ('queued','researching') and result.research_started_at>now()-interval '10 minutes' then raise exception 'RUN_ACTIVE'; end if;
  if result.website='' then raise exception 'WEBSITE_REQUIRED'; end if;
  if (select count(*) from cookbook_pack_research_attempts where user_id=auth.uid() and created_at>now()-interval '1 day')>=4 then raise exception 'RATE_LIMITED'; end if;
  insert into cookbook_pack_research_attempts(id,user_id,pack_id) values(run_key,auth.uid(),p_id);
  update cookbook_brand_packs set status='queued',stage='Waiting to start',error=null,research_key=run_key,research_started_at=now(),revision=revision+1,updated_at=now()
   where id=p_id returning * into result;
 elsif p_action='cancel' then
  if result.status not in ('queued','researching') then return result; end if;
  update cookbook_brand_packs set status='draft',stage='',error=null,revision=revision+1,updated_at=now() where id=p_id returning * into result;
 else raise exception 'INVALID_REQUEST'; end if;
 return result;
end $$;
revoke all on function public.cookbook_pack_command(text,uuid,integer,jsonb) from public,anon;
grant execute on function public.cookbook_pack_command(text,uuid,integer,jsonb) to authenticated;
