-- Additive metadata for agent-produced drafts. Existing document versions remain immutable.
alter table public.cookbook_documents
  add column if not exists status text not null default 'draft' check (status in ('draft', 'review', 'accepted')),
  add column if not exists quality jsonb not null default '{}'::jsonb,
  add column if not exists unanswered_questions jsonb not null default '[]'::jsonb,
  add column if not exists assumptions jsonb not null default '[]'::jsonb,
  add column if not exists evidence_references jsonb not null default '[]'::jsonb,
  add column if not exists research_metadata jsonb not null default '{}'::jsonb,
  add column if not exists validation_checklist jsonb not null default '[]'::jsonb;

alter table public.cookbook_research_runs
  add column if not exists reviewed_pages jsonb not null default '[]'::jsonb,
  add column if not exists skipped_pages jsonb not null default '[]'::jsonb,
  add column if not exists source_category text not null default 'website',
  add column if not exists completed_at timestamptz;
