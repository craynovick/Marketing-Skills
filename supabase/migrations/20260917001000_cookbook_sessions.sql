create table if not exists public.cookbook_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  website text not null,
  draft jsonb not null default '{}'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  next_field text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cookbook_sessions_user_created_idx on public.cookbook_sessions (user_id, created_at desc);
alter table public.cookbook_sessions enable row level security;
create policy "Users manage their own Cookbook sessions" on public.cookbook_sessions for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create trigger cookbook_sessions_updated_at before update on public.cookbook_sessions for each row execute function public.set_cookbook_updated_at();

create table if not exists public.cookbook_evidence (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.cookbook_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  title text,
  excerpt text not null,
  position smallint not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists cookbook_evidence_session_position_idx on public.cookbook_evidence (session_id, position);
alter table public.cookbook_evidence enable row level security;
create policy "Users manage their own Cookbook evidence" on public.cookbook_evidence for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
