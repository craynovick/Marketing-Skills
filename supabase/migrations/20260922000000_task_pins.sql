alter table public.cookbook_skills
  add column if not exists pinned_at timestamptz;

create index if not exists cookbook_skills_sidebar_order
  on public.cookbook_skills(user_id,project_id,pinned_at desc,updated_at desc,id desc)
  where foundation_key is null;

drop function if exists public.cookbook_list_brand_tasks(uuid,timestamptz,integer,boolean,uuid);

create function public.cookbook_list_brand_tasks(
  p_project uuid,
  p_before_pin timestamptz default null,
  p_before timestamptz default null,
  p_limit integer default 30,
  p_archived boolean default false,
  p_before_id uuid default null
) returns jsonb language sql security invoker set search_path=public as $$
  select coalesce(jsonb_agg(to_jsonb(t)),'[]') from (
    select s.*,
      exists(select 1 from cookbook_documents d where d.skill_id=s.id and d.user_id=auth.uid()) as has_document,
      (select r.status from cookbook_agent_runs r where r.skill_id=s.id and r.user_id=auth.uid() order by r.created_at desc limit 1) as run_status
    from cookbook_skills s
    where s.user_id=auth.uid()
      and s.project_id=p_project
      and s.foundation_key is null
      and (s.archived_at is not null)=p_archived
      and (
        p_before is null
        or (
          p_before_pin is not null
          and (
            s.pinned_at is null
            or s.pinned_at < p_before_pin
            or (s.pinned_at=p_before_pin and (s.updated_at<p_before or (s.updated_at=p_before and s.id<p_before_id)))
          )
        )
        or (
          p_before_pin is null
          and s.pinned_at is null
          and (s.updated_at<p_before or (s.updated_at=p_before and s.id<p_before_id))
        )
      )
    order by (s.pinned_at is null),s.pinned_at desc,s.updated_at desc,s.id desc
    limit least(greatest(p_limit,1),100)
  ) t;
$$;

revoke all on function public.cookbook_list_brand_tasks(uuid,timestamptz,timestamptz,integer,boolean,uuid) from public,anon;
grant execute on function public.cookbook_list_brand_tasks(uuid,timestamptz,timestamptz,integer,boolean,uuid) to authenticated;
