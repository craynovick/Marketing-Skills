-- Private source files retained with a Cookbook task and available as agent context.
create table if not exists public.cookbook_attachments (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.cookbook_skills(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  message_id uuid references public.cookbook_messages(id) on delete set null,
  file_name text not null,
  mime_type text not null,
  byte_size integer not null check (byte_size > 0 and byte_size <= 10485760),
  storage_path text not null unique,
  extraction_status text not null default 'ready' check (extraction_status in ('ready', 'failed')),
  extracted_text text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists cookbook_attachments_skill_created_idx on public.cookbook_attachments (skill_id, created_at desc);
alter table public.cookbook_attachments enable row level security;
create policy "Cookbook attachment owner" on public.cookbook_attachments for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cookbook-context', 'cookbook-context', false, 10485760,
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Cookbook context upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'cookbook-context' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Cookbook context read" on storage.objects for select to authenticated
  using (bucket_id = 'cookbook-context' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Cookbook context delete" on storage.objects for delete to authenticated
  using (bucket_id = 'cookbook-context' and (storage.foldername(name))[1] = (select auth.uid())::text);
