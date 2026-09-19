-- Agent calls can legitimately run close to the server response limit.  Keep an
-- inactive-run recovery path without cancelling a live stream during refresh.
create or replace function public.cookbook_start_run(p_task uuid, p_run uuid, p_input text, p_attachments jsonb)
returns uuid language plpgsql security invoker set search_path = public as $$
declare thread uuid; existing cookbook_agent_runs; unlimited boolean;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
  perform 1 from cookbook_skills where id=p_task and user_id=auth.uid() and archived_at is null for update;
  if not found then raise exception 'INVALID_TASK'; end if;
  select * into existing from cookbook_agent_runs where id=p_run and user_id=auth.uid();
  if existing.id is not null then raise exception 'DUPLICATE_RUN'; end if;
  update cookbook_agent_runs set status='interrupted',updated_at=now()
    where skill_id=p_task and user_id=auth.uid() and status='running'
      and updated_at < now() - interval '10 minutes';
  if exists(select 1 from cookbook_agent_runs where skill_id=p_task and user_id=auth.uid() and status='running') then raise exception 'RUN_ACTIVE'; end if;
  unlimited := coalesce(auth.jwt()->'app_metadata'->>'unlimited','false')='true' or coalesce(auth.jwt()->'app_metadata'->>'role','')='admin';
  if not unlimited and (select count(*) from cookbook_agent_runs where user_id=auth.uid() and created_at>now()-interval '1 hour') >= 30 then raise exception 'RATE_LIMITED'; end if;
  if length(p_input)>4000 or length(trim(p_input))=0 then raise exception 'INVALID_MESSAGE'; end if;
  select id into thread from cookbook_threads where skill_id=p_task and user_id=auth.uid();
  if thread is null then insert into cookbook_threads(user_id,skill_id) values(auth.uid(),p_task) returning id into thread; end if;
  insert into cookbook_agent_runs(id,user_id,skill_id,input,attachment_ids) values(p_run,auth.uid(),p_task,p_input,p_attachments);
  insert into cookbook_messages(user_id,thread_id,role,content,parts,message_key,metadata)
    values(auth.uid(),thread,'user',p_input,jsonb_build_array(jsonb_build_object('type','text','text',p_input)),p_run::text,jsonb_build_object('runId',p_run,'attachmentIds',p_attachments));
  return thread;
end $$;
