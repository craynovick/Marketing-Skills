-- Account-synced Create workspace. Each row is constrained by RLS to its owner.
create table if not exists public.cookbook_projects (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Cookbook', active_skill_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.cookbook_skills (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.cookbook_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, file_name text not null, title text not null,
  lifecycle text not null default 'queue' check (lifecycle in ('queue','researching','draft','accepted')),
  accepted_version_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(project_id, file_name)
);
create table if not exists public.cookbook_documents (
  id uuid primary key default gen_random_uuid(), skill_id uuid not null references public.cookbook_skills(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, content text not null default '', version integer not null default 1,
  source text not null default 'user' check (source in ('agent','user','revert')), agent_version text, created_at timestamptz not null default now(),
  unique(skill_id, version)
);
create table if not exists public.cookbook_threads (
  id uuid primary key default gen_random_uuid(), skill_id uuid not null references public.cookbook_skills(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(skill_id)
);
create table if not exists public.cookbook_messages (
  id uuid primary key default gen_random_uuid(), thread_id uuid not null references public.cookbook_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, role text not null check (role in ('user','assistant','event')),
  content text not null, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.cookbook_research_runs (
  id uuid primary key default gen_random_uuid(), skill_id uuid not null references public.cookbook_skills(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, canonical_url text not null, status text not null default 'queued',
  page_count integer not null default 0, failed_pages jsonb not null default '[]'::jsonb, confidence numeric(3,2), agent_version text not null default '2026-09-18', created_at timestamptz not null default now()
);
create table if not exists public.cookbook_workspace_evidence (
  id uuid primary key default gen_random_uuid(), run_id uuid not null references public.cookbook_research_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, url text not null, title text, excerpt text not null,
  crawl_status text not null default 'success', confidence numeric(3,2), created_at timestamptz not null default now()
);
create table if not exists public.cookbook_acceptance_events (
  id uuid primary key default gen_random_uuid(), skill_id uuid not null references public.cookbook_skills(id) on delete cascade,
  document_id uuid not null references public.cookbook_documents(id), user_id uuid not null references auth.users(id) on delete cascade, created_at timestamptz not null default now()
);
alter table public.cookbook_projects enable row level security; alter table public.cookbook_skills enable row level security; alter table public.cookbook_documents enable row level security; alter table public.cookbook_threads enable row level security; alter table public.cookbook_messages enable row level security; alter table public.cookbook_research_runs enable row level security; alter table public.cookbook_workspace_evidence enable row level security; alter table public.cookbook_acceptance_events enable row level security;
create policy "Cookbook project owner" on public.cookbook_projects for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Cookbook skill owner" on public.cookbook_skills for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Cookbook document owner" on public.cookbook_documents for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Cookbook thread owner" on public.cookbook_threads for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Cookbook message owner" on public.cookbook_messages for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Cookbook research owner" on public.cookbook_research_runs for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Cookbook evidence owner" on public.cookbook_workspace_evidence for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Cookbook acceptance owner" on public.cookbook_acceptance_events for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
