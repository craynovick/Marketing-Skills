-- Explicit brand boundaries; no existing documents or approvals are rewritten.
alter table public.cookbook_projects add column if not exists offer text not null default '', add column if not exists website text not null default '', add column if not exists creation_key uuid;
create unique index if not exists cookbook_brand_creation on public.cookbook_projects(user_id,creation_key);
alter table public.cookbook_skills add column if not exists source_task_id uuid references public.cookbook_skills(id), add column if not exists source_document_id uuid references public.cookbook_documents(id), add column if not exists platform text check(platform in ('linkedin','instagram','facebook','x','threads','tiktok','youtube-shorts')), add column if not exists voice_direction text not null default '';
-- Legacy profile belongs only to its original project.
update public.cookbook_projects p set name=coalesce(nullif(c.company,''),p.name),offer=coalesce(c.offer,'') from public.cookbooks c where c.user_id=p.user_id and p.id=(select id from public.cookbook_projects where user_id=c.user_id order by created_at,id limit 1);

create or replace function public.cookbook_create_brand(p_name text,p_offer text,p_website text,p_key uuid) returns uuid language plpgsql security invoker set search_path=public as $$
declare result uuid;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 if length(trim(p_name)) not between 1 and 120 or length(trim(p_offer)) not between 1 and 2000 or length(p_website)>2000 or p_key is null then raise exception 'INVALID_BRAND'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select id into result from cookbook_projects where user_id=auth.uid() and creation_key=p_key;
 if result is not null then return result; end if;
 insert into cookbook_projects(user_id,name,offer,website,creation_key) values(auth.uid(),trim(p_name),trim(p_offer),p_website,p_key) returning id into result;
 return result;
end $$;

create or replace function public.cookbook_create_brand_task(p_project uuid,p_slug text,p_version text,p_title text,p_key uuid,p_mode text,p_workflow text,p_scope text) returns uuid language plpgsql security invoker set search_path=public as $$
declare result uuid; existing cookbook_skills;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 perform 1 from cookbook_projects where id=p_project and user_id=auth.uid();
 if not found then raise exception 'INVALID_BRAND'; end if;
 if p_mode not in ('create','skill-tuning') or p_workflow not in ('general','analyze','social-post','newsletter') or p_scope not in ('brand','task') or (p_mode='skill-tuning' and p_workflow<>'general') then raise exception 'INVALID_TASK'; end if;
 select * into existing from cookbook_skills where user_id=auth.uid() and creation_key=p_key;
 if existing.id is not null then
  if existing.project_id<>p_project or existing.skill_slug<>p_slug then raise exception 'INVALID_TASK'; end if;
  return existing.id;
 end if;
 insert into cookbook_skills(user_id,project_id,file_name,title,skill_slug,skill_version,creation_key,mode,create_workflow,context_scope)
 values(auth.uid(),p_project,p_slug||'-'||p_key::text||'.md',p_title,p_slug,p_version,p_key,p_mode,p_workflow,p_scope) returning id into result;
 insert into cookbook_threads(user_id,skill_id) values(auth.uid(),result);
 return result;
end $$;

-- Old clients may choose the sole brand; ambiguity must never choose another brand silently.
create or replace function public.cookbook_create_task(p_slug text,p_version text,p_title text,p_key uuid) returns uuid language plpgsql security invoker set search_path=public as $$
declare project uuid; result uuid;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select id into result from cookbook_skills where user_id=auth.uid() and creation_key=p_key;
 if result is not null then return result; end if;
 if (select count(*) from cookbook_projects where user_id=auth.uid())>1 then raise exception 'BRAND_REQUIRED'; end if;
 select id into project from cookbook_projects where user_id=auth.uid();
 if project is null then insert into cookbook_projects(user_id) values(auth.uid()) returning id into project; end if;
 return cookbook_create_brand_task(project,p_slug,p_version,p_title,p_key,'create','general','brand');
end $$;

create or replace function public.cookbook_list_brand_tasks(p_project uuid,p_before timestamptz default null,p_limit integer default 30,p_archived boolean default false,p_before_id uuid default null) returns jsonb language sql security invoker set search_path=public as $$
 select coalesce(jsonb_agg(to_jsonb(t)),'[]') from (
 select s.*,exists(select 1 from cookbook_documents d where d.skill_id=s.id and d.user_id=auth.uid()) as has_document,
 (select r.status from cookbook_agent_runs r where r.skill_id=s.id and r.user_id=auth.uid() order by r.created_at desc limit 1) as run_status
 from cookbook_skills s where s.user_id=auth.uid() and s.project_id=p_project and s.foundation_key is null and (s.archived_at is not null)=p_archived
 and (p_before is null or s.updated_at<p_before or (s.updated_at=p_before and s.id<p_before_id))
 order by s.updated_at desc,s.id desc limit least(greatest(p_limit,1),100)) t;
$$;

create or replace function public.cookbook_create_adaptation(p_source uuid,p_document uuid,p_platform text,p_voice text,p_key uuid) returns uuid language plpgsql security invoker set search_path=public as $$
declare src cookbook_skills; result uuid;
begin
 select * into src from cookbook_skills where id=p_source and user_id=auth.uid() and archived_at is null;
 if src.id is null or src.mode<>'create' or p_platform not in ('linkedin','instagram','facebook','x','threads','tiktok','youtube-shorts') or length(p_voice)>500 then raise exception 'INVALID_TASK'; end if;
 perform 1 from cookbook_documents where id=p_document and skill_id=src.id and user_id=auth.uid();
 if not found then raise exception 'STALE_VERSION'; end if;
 result:=cookbook_create_brand_task(src.project_id,'marketing-chat','1.0.0',p_platform||' · '||left(src.title,65),p_key,'create','social-post',src.context_scope);
 if exists(select 1 from cookbook_skills where id=result and source_document_id is not null and (source_document_id<>p_document or platform<>p_platform or voice_direction<>p_voice)) then raise exception 'INVALID_TASK'; end if;
 update cookbook_skills set source_task_id=src.id,source_document_id=p_document,platform=p_platform,voice_direction=p_voice where id=result and source_document_id is null;
 return result;
end $$;
revoke all on function public.cookbook_create_brand(text,text,text,uuid),public.cookbook_create_brand_task(uuid,text,text,text,uuid,text,text,text),public.cookbook_list_brand_tasks(uuid,timestamptz,integer,boolean,uuid),public.cookbook_create_adaptation(uuid,uuid,text,text,uuid) from public,anon;
grant execute on function public.cookbook_create_brand(text,text,text,uuid),public.cookbook_create_brand_task(uuid,text,text,text,uuid,text,text,text),public.cookbook_list_brand_tasks(uuid,timestamptz,integer,boolean,uuid),public.cookbook_create_adaptation(uuid,uuid,text,text,uuid) to authenticated;
