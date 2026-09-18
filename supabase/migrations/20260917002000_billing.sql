create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text not null default 'free' check (plan in ('free', 'pro', 'team')),
  status text not null default 'none',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
create policy "Users read their own subscription" on public.subscriptions for select using ((select auth.uid()) = user_id);
create or replace function public.set_subscription_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger subscriptions_updated_at before update on public.subscriptions for each row execute function public.set_subscription_updated_at();

create table if not exists public.billing_events (
  stripe_event_id text primary key,
  event_type text not null,
  created_at timestamptz not null default now()
);
alter table public.billing_events enable row level security;
