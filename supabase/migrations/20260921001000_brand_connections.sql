create or replace function public.cookbook_manage_connection(p_user uuid,p_action text,p_data jsonb)
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
   if p_data->>'projectId' is not null then
    select id into project from cookbook_projects where user_id=p_user and id=(p_data->>'projectId')::uuid;
    if project is null then raise exception 'INVALID_BRAND'; end if;
   else
    if (select count(*) from cookbook_projects where user_id=p_user)>1 then raise exception 'BRAND_REQUIRED'; end if;
    select id into project from cookbook_projects where user_id=p_user;
   end if;
   if project is null then insert into cookbook_projects(user_id) values(p_user) returning id into project; end if;
   if (select count(*) from cookbook_connections where user_id=p_user and revoked_at is null and expires_at>now())>=10 then raise exception 'CONNECTION_LIMIT'; end if;
   insert into cookbook_connections(user_id,project_id,name,key_hash,scopes,expires_at)
     values(p_user,project,p_data->>'name',p_data->>'hash',array(select jsonb_array_elements_text(p_data->'scopes')),now()+interval '90 days') returning id into connection;
   select to_jsonb(c)-'key_hash' into result from cookbook_connections c where id=connection;
   return result;
 end if;
 raise exception 'INVALID_ACTION';
end $$;

