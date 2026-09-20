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
 for(const name of ['20260917000000_cookbooks','20260917002000_billing','20260918000000_durable_cookbook_workspace','20260918001000_workspace_document_metadata','20260918002000_workspace_attachments','20260919000000_agent_experience','20260919001000_agent_run_timeout'])
   await db.exec(await readFile(new URL(`../supabase/migrations/${name}.sql`,import.meta.url),'utf8'));
 await db.exec(`insert into cookbooks(user_id,company,voice) values('${owner}','Paper Harbor','Warm and specific');`);
 await db.exec(await readFile(new URL('../supabase/migrations/20260919002000_guided_brand_agent.sql',import.meta.url),'utf8'));
 await db.exec(`grant select,insert,update,delete on all tables in schema public to authenticated,service_role; grant usage,select on all sequences in schema public to authenticated,service_role;`);
 await db.exec(await readFile(new URL('../supabase/migrations/20260919003000_cookbook_integrations.sql',import.meta.url),'utf8'));
 for (const name of ['20260920000000_guided_experience','20260921000000_brands_and_adaptations','20260921001000_brand_connections']) await db.exec(await readFile(new URL(`../supabase/migrations/${name}.sql`,import.meta.url),'utf8'));
 await login(db,owner);
 return db;
}
async function login(db,id,role='authenticated') {await db.exec(`reset role; set role ${role}; select set_config('request.jwt.claim.sub','${id}',false); select set_config('request.jwt.claim.role','${role}',false);`);}
async function scalar(db,sql,params=[]) {return (await db.query(sql,params)).rows[0].value;}
const update=(key,version=0,content=`# ${key}\nUseful brand facts.`)=>({key,expectedVersion:version,content,sources:[]});

const request='55555555-5555-4555-8555-555555555555';
async function connection(db,who=owner,scopes=['context:read','foundations:write','artifacts:write'],hash='hash-owner') {
 await login(db,'','service_role');
 return scalar(db,`select cookbook_manage_connection($1,'create',$2) as value`,[who,JSON.stringify({name:'Test app',hash,scopes})]);
}
async function call(db,action,payload={},hash='hash-owner',self=false) {
 await login(db,'','service_role');
 return scalar(db,`select cookbook_integration($1,$2,$3,$4) as value`,[hash,action,JSON.stringify(payload),self]);
}
async function scan(db,action,data={},who=owner,self=false) {
 await login(db,'','service_role');
 return scalar(db,'select cookbook_scan_control($1,$2,$3,$4) as value',[who,action,JSON.stringify(data),self]);
}

test('connections are hashed, owner-bound, scoped, expiring, revocable and unavailable to authenticated RPC callers',async()=>{
 const db=await database();try{
 const c=await connection(db);assert.equal(c.key_hash,undefined);assert.equal(c.user_id,owner);
 assert.equal((await call(db,'connection')).id,c.id);
 await assert.rejects(call(db,'pantry',{},'wrong'),/AUTH_REQUIRED/);
 await connection(db,other,['foundations:write'],'other');
 await assert.rejects(call(db,'pantry',{},'other'),/FORBIDDEN/);
 await login(db,owner);
 await assert.rejects(scalar(db,"select cookbook_integration('hash-owner','pantry') as value"),/permission denied/);
 await login(db,'','service_role');
 await assert.rejects(scalar(db,"select cookbook_manage_connection($1,'revoke',$2) as value",[other,JSON.stringify({id:c.id})]),/NOT_FOUND/);
 await db.query("update cookbook_connections set expires_at=now()-interval '1 second' where id=$1",[c.id]);
 await assert.rejects(call(db,'pantry'),/AUTH_REQUIRED/);
 await db.query("update cookbook_connections set expires_at=now()+interval '1 day',revoked_at=now() where id=$1",[c.id]);
 await assert.rejects(call(db,'connection'),/AUTH_REQUIRED/);
 }finally{await db.close();}
});

test('external foundation writes are proposals, preserve approved context, reject stale versions and conflicting retries',async()=>{
 const db=await database();try{
 await connection(db);
 const initial=await call(db,'pantry');assert.equal(initial.sections.find(s=>s.key==='voice').approvedVersion,1);
 const payload={requestId:request,agentName:'Codex',updates:[update('voice',1,'# Voice\nClear and calm.')]};
 const p=await call(db,'propose',payload);assert.equal(p.status,'pending_review');
 assert.equal((await call(db,'propose',payload)).proposalId,p.proposalId);
 await assert.rejects(call(db,'propose',{...payload,agentName:'Changed'}),/IDEMPOTENCY_CONFLICT/);
 let pantry=await call(db,'pantry');let voice=pantry.sections.find(s=>s.key==='voice');assert.equal(voice.latestVersion,2);assert.equal(voice.approvedVersion,1);assert.equal(voice.pending,true);
 await assert.rejects(call(db,'propose',{...payload,requestId:key}),/STALE_VERSION/);
 await login(db,owner);await scalar(db,"select to_jsonb(cookbook_review_brand($1,'kept')) as value",[p.proposalId]);
 pantry=await call(db,'pantry');voice=pantry.sections.find(s=>s.key==='voice');assert.equal(voice.approvedVersion,2);assert.equal(voice.approvedContent,'# Voice\nClear and calm.');assert.equal(voice.pending,false);
 await connection(db,other,['context:read'],'other');
 assert.equal((await call(db,'pantry',{},'other')).sections.length,0);
 }finally{await db.close();}
});

test('deliverables require paid hosting, remain readable after downgrade and cannot cross project boundaries',async()=>{
 const db=await database();try{
 const c=await connection(db);
 const payload={requestId:request,skillSlug:'landing-page-copywriter',skillVersion:'1.0.0',title:'A draft',contentMarkdown:'# Page\nHello',metadata:{inputs:'example'}};
 await assert.rejects(call(db,'save',payload),/PLAN_REQUIRED/);
 await db.query("insert into subscriptions(user_id,plan,status) values($1,'pro','active')",[owner]);
 const saved=await call(db,'save',payload);assert.equal((await call(db,'save',payload)).id,saved.id);
 await assert.rejects(call(db,'save',{...payload,title:'Changed'}),/IDEMPOTENCY_CONFLICT/);
 assert.equal((await call(db,'get',{id:saved.id})).document.integration_metadata.connectionId,c.id);
 await db.query("update subscriptions set status='canceled' where user_id=$1",[owner]);
 assert.equal((await call(db,'get',{id:saved.id})).title,'A draft');
 assert.equal((await call(db,'list',{limit:20})).length,1);
 await assert.rejects(call(db,'save',{...payload,requestId:key}),/PLAN_REQUIRED/);
 await connection(db,other,['context:read'],'other');
 await assert.rejects(call(db,'get',{id:saved.id},'other'),/NOT_FOUND/);
 assert.equal((await call(db,'list',{limit:20},'other')).length,0);
 await login(db,'','service_role');
 const project=await scalar(db,'insert into cookbook_projects(user_id) values($1) returning id as value',[owner]);
 await db.query('update cookbook_connections set project_id=$1 where id=$2',[project,c.id]);
 await assert.rejects(call(db,'get',{id:saved.id}),/NOT_FOUND/);
 }finally{await db.close();}
});

test('scan reservations enforce one site and four successes, release failures and reject overlapping requests',async()=>{
 const db=await database();try{
 const data={requestId:request,hostname:'example.com'};
 await scan(db,'reserve',data);
 await assert.rejects(scan(db,'reserve',{...data,requestId:key}),/SCAN_ACTIVE/);
 await scan(db,'fail',data);assert.equal((await scan(db,'status')).successes,0);
 await scan(db,'reserve',data);await scan(db,'finish',{...data,result:{pages:[{text:'evidence'}]}});
 assert.ok((await scan(db,'reserve',data)).cached);
 await assert.rejects(scan(db,'reserve',{requestId:key,hostname:'other.example',foundation:'proof',gap:'Need support for product claims'}),/SITE_LOCKED/);
 await assert.rejects(scan(db,'reserve',{requestId:key,hostname:'example.com'}),/EVIDENCE_GAP_REQUIRED/);
 await assert.rejects(scan(db,'reserve',{requestId:key,hostname:'example.com',foundation:'voice',gap:'Need examples of brand voice'}),/FOUNDATION_COMPLETE/);
 for(let i=1;i<=3;i++){
   const next={requestId:`66666666-6666-4666-8666-66666666666${i}`,hostname:'example.com',foundation:'proof',gap:'Need evidence supporting the product claims'};
   await scan(db,'reserve',next);await scan(db,'finish',{...next,result:{pages:[]}});
 }
 assert.equal((await scan(db,'status')).successes,4);
 await assert.rejects(scan(db,'reserve',{...data,requestId:run,foundation:'proof',gap:'Need more evidence'}),/SCAN_LIMIT/);
 }finally{await db.close();}
});

test('completed setup prevents scans while self-hosted installation can scan without commercial gates',async()=>{
 const db=await database();try{
 await scan(db,'complete');
 await assert.rejects(scan(db,'reserve',{requestId:request,hostname:'example.com'}),/SCAN_LIMIT/);
 assert.equal((await scan(db,'reserve',{requestId:request,hostname:'example.com'},owner,true)).reserved,true);
 await scan(db,'fail',{requestId:request});
 await connection(db);
 assert.equal((await call(db,'connection',{},'hash-owner',true)).entitlements.deliverables,true);
 }finally{await db.close();}
});


test('connection creation requires a brand for multi-brand accounts and validates ownership', async()=>{
 const db=await database();try{
  const brand=await scalar(db,"select cookbook_create_brand('Second','New offer','',gen_random_uuid()) as value");
  await login(db,'','service_role');
  const payload={name:'Scoped connector',hash:'new-hash',scopes:['context:read']};
  await assert.rejects(scalar(db,"select cookbook_manage_connection($1,'create',$2) as value",[owner,JSON.stringify(payload)]),/BRAND_REQUIRED/);
  const connection=await scalar(db,"select cookbook_manage_connection($1,'create',$2) as value",[owner,JSON.stringify({...payload,projectId:brand})]);
  assert.equal(connection.project_id,brand);
  await assert.rejects(scalar(db,"select cookbook_manage_connection($1,'create',$2) as value",[other,JSON.stringify({...payload,hash:'other-hash',projectId:brand})]),/INVALID_BRAND/);
 }finally{await db.close();}
});
