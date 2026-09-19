import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const owner='11111111-1111-4111-8111-111111111111', other='22222222-2222-4222-8222-222222222222';
const key='33333333-3333-4333-8333-333333333333', run='44444444-4444-4444-8444-444444444444';

async function database() {
 const db=new PGlite();
 await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create function auth.role() returns text language sql stable as $$ select current_setting('request.jwt.claim.role',true) $$;
 create function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;
 create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid,bucket_id text,name text);
 create function storage.foldername(text) returns text[] language sql as $$ select string_to_array($1,'/') $$;
 grant usage on schema auth,public to authenticated,service_role;
 insert into auth.users values('${owner}'),('${other}');`);
 for(const name of ['20260917000000_cookbooks','20260918000000_durable_cookbook_workspace','20260918001000_workspace_document_metadata','20260918002000_workspace_attachments','20260919000000_agent_experience','20260919001000_agent_run_timeout'])
   await db.exec(await readFile(new URL(`../supabase/migrations/${name}.sql`,import.meta.url),'utf8'));
 await db.exec(`insert into cookbooks(user_id,company,voice) values('${owner}','Paper Harbor','Warm and specific');`);
 await db.exec(await readFile(new URL('../supabase/migrations/20260919002000_guided_brand_agent.sql',import.meta.url),'utf8'));
 await db.exec(`grant select,insert,update,delete on all tables in schema public to authenticated,service_role; grant usage,select on all sequences in schema public to authenticated,service_role;`);
 await login(db,owner);
 return db;
}
async function login(db,id,role='authenticated') {await db.exec(`reset role; set role ${role}; select set_config('request.jwt.claim.sub','${id}',false); select set_config('request.jwt.claim.role','${role}',false);`);}
async function scalar(db,sql,params=[]) {return (await db.query(sql,params)).rows[0].value;}
async function task(db) {return scalar(db,`select cookbook_create_task('marketing-chat','1.0.0','Test brand setup',$1) as value`,[key]);}
async function propose(db,t,operation,updates) {return scalar(db,`select to_jsonb(cookbook_propose_brand($1,$2,$3)) as value`,[t,JSON.stringify(updates),operation]);}
const update=(key,version=0,content=`# ${key}\nUseful brand facts.`)=>({key,expectedVersion:version,content,sources:[]});

test('migration imports explicit profile fields once and preserves confirmed versions',async()=>{
 const db=await database();try{
 const rows=(await db.query('select s.foundation_key,d.content from cookbook_skills s join cookbook_documents d on d.id=s.accepted_version_id')).rows;
 assert.equal(rows.length,2);assert.ok(rows.some(r=>r.foundation_key==='brand'&&r.content.includes('Paper Harbor')));
 assert.ok(rows.some(r=>r.foundation_key==='voice'&&r.content.includes('Warm and specific')));
 }finally{await db.close();}
});

test('multi-document proposals are atomic, retry-safe, versioned, and require exact Keep',async()=>{
 const db=await database();try{
 const t=await task(db);
 const p=await propose(db,t,'proposal-one',[update('audience'),update('content')]);
 assert.equal(p.items.length,2);assert.equal(p.status,'pending');
 assert.equal((await propose(db,t,'proposal-one',[update('audience'),update('content')])).id,p.id);
 assert.equal(await scalar(db,'select count(*)::int as value from cookbook_documents where skill_id=$1',[p.items[0].taskId]),1);
 assert.equal(await scalar(db,'select accepted_version_id as value from cookbook_skills where id=$1',[p.items[0].taskId]),null);
 await propose(db,t,'newer',[update('audience',1,'# Audience\nNewer edit.')]);
 await assert.rejects(scalar(db,`select to_jsonb(cookbook_review_brand($1,'kept')) as value`,[p.id]),/STALE_VERSION/);
 assert.equal(await scalar(db,'select accepted_version_id as value from cookbook_skills where id=$1',[p.items[1].taskId]),null);
 await assert.rejects(propose(db,t,'partial-failure',[update('proof'),update('audience',0)]),/STALE_VERSION/);
 assert.equal(await scalar(db,"select count(*)::int as value from cookbook_skills where foundation_key='proof'"),0);
 const keep=await propose(db,t,'keep',[update('audience',2),update('content',1)]);
 await scalar(db,`select to_jsonb(cookbook_review_brand($1,'kept')) as value`,[keep.id]);
 assert.equal(await scalar(db,'select accepted_version_id as value from cookbook_skills where id=$1',[keep.items[0].taskId]),keep.items[0].documentId);
 const skip=await propose(db,t,'skip',[update('audience',3)]);
 await scalar(db,`select to_jsonb(cookbook_review_brand($1,'skipped')) as value`,[skip.id]);
 assert.equal(await scalar(db,'select accepted_version_id as value from cookbook_skills where id=$1',[keep.items[0].taskId]),keep.items[0].documentId);
 }finally{await db.close();}
});

test('queue retries do not duplicate messages; worker saves respect cancellation and ownership',async()=>{
 const db=await database();try{
 const t=await task(db);
 const queue=()=>scalar(db,'select cookbook_queue_run($1,$2,$3,$4) as value',[t,run,'Build my brand','[]']);
 await queue();await queue();
 assert.equal(await scalar(db,'select count(*)::int as value from cookbook_messages where message_key=$1',[run]),1);
 await assert.rejects(scalar(db,`select cookbook_worker_write($1,'document',$2) as value`,[run,JSON.stringify({content:'# Nope',operation:'nope',metadata:{}})]),/permission denied/);
 await login(db,'', 'service_role');
 await db.query("update cookbook_agent_runs set status='running' where id=$1",[run]);
 const payload=JSON.stringify({content:'# Draft\nSaved work',operation:'save-1',metadata:{}});
 const doc=await scalar(db,`select cookbook_worker_write($1,'document',$2) as value`,[run,payload]);
 assert.equal(doc.version,1);
 assert.equal((await scalar(db,`select cookbook_worker_write($1,'document',$2) as value`,[run,payload])).id,doc.id);
 await db.query("update cookbook_agent_runs set status='cancelled' where id=$1",[run]);
 await assert.rejects(scalar(db,`select cookbook_worker_write($1,'document',$2) as value`,[run,JSON.stringify({content:'# No save',operation:'save-2'})]),/RUN_STOPPED/);
 await login(db,other);
 assert.equal(await scalar(db,'select count(*)::int as value from cookbook_agent_runs'),0);
 assert.equal(await scalar(db,'select count(*)::int as value from cookbook_documents'),0);
 await assert.rejects(propose(db,t,'other-user',[update('proof')]),/INVALID_TASK/);
 await assert.rejects(queue(),/INVALID_TASK/);
 }finally{await db.close();}
});

test('task-only conversations cannot propose account memory; sidebar metadata excludes document content',async()=>{
 const db=await database();try{
 const t=await task(db);await db.query("update cookbook_skills set context_scope='task' where id=$1",[t]);
 await assert.rejects(propose(db,t,'foreign-brand',[update('proof')]),/INVALID_TASK/);
 const rows=await scalar(db,'select cookbook_list_tasks() as value');
 assert.equal(rows.length,1);assert.equal(rows[0].has_document,false);assert.equal(rows[0].document,undefined);
 assert.equal(rows[0].content,undefined);
 }finally{await db.close();}
});
