const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loader}=require('./ts-loader.cjs');
const load=loader();
const {proposalSchema,artifactSchema,brandMarkdown}=load('@/lib/integrations/contracts');
const requestId='55555555-5555-4555-8555-555555555555';

test('contracts reject unknown foundation keys, duplicate sections, oversized drafts and malformed references',()=>{
 const item={key:'voice',content:'# Voice\nWarm.',expectedVersion:0,sources:[]};
 assert.equal(proposalSchema.parse({requestId,updates:[item]}).updates[0].key,'voice');
 assert.throws(()=>proposalSchema.parse({requestId,updates:[item,item]}));
 assert.throws(()=>proposalSchema.parse({requestId,updates:[{...item,key:'other'}]}));
 assert.throws(()=>proposalSchema.parse({requestId,updates:[{...item,sources:['file:///secret']}]}));
 assert.throws(()=>proposalSchema.parse({requestId,updates:[{...item,expectedVersion:-1}]}));
 assert.throws(()=>artifactSchema.parse({requestId,skillSlug:'a',title:'A',contentMarkdown:'a'.repeat(60001)}));
 assert.throws(()=>artifactSchema.parse({requestId,skillSlug:'a',title:'A',contentMarkdown:'ok',metadata:{a:'x'.repeat(8001)}}));
 assert.equal(brandMarkdown({sections:[{key:'voice',approvedContent:'# Approved',draft:'# Unapproved'}]}),'# Approved');
});

test('REST recipes are public; private operations reject absent keys and validate requests before database writes',async()=>{
 const prior=process.env.COOKBOOK_INTEGRATIONS_ENABLED,priorV2=process.env.COOKBOOK_V2_ENABLED;
 process.env.COOKBOOK_INTEGRATIONS_ENABLED='true';process.env.COOKBOOK_V2_ENABLED='true';
 const calls=[];
 const fake={rpc:async(name,args)=>{calls.push({name,args});return {data:{id:'saved'},error:null};}};
 const route=loader({'@/lib/supabase/admin':{createAdminClient:()=>fake}})('@/app/api/v1/[...path]/route');
 const context=path=>({params:Promise.resolve({path})});
 try{
  let response=await route.GET(new Request('https://cookbook.test/api/v1/skills'),context(['skills']));assert.equal(response.status,200);assert.ok((await response.json()).items.length>0);assert.equal(calls.length,0);
  for (const slug of ['go-to-market-strategy', 'offer-pricing-strategy', 'sales-enablement-playbook']) {
   response=await route.GET(new Request(`https://cookbook.test/api/v1/skills/${slug}`),context(['skills',slug]));
   assert.equal(response.status,200);
   const item=await response.json();
   assert.equal(item.markdownContent,load('@/lib/generated-skills').getSkill(slug).skill);
   assert.equal(item.foundational,false);
  }
  assert.equal(calls.length,0);
  response=await route.GET(new Request('https://cookbook.test/api/v1/pantry'),context(['pantry']));assert.equal(response.status,401);assert.equal(response.headers.get('cache-control'),'no-store');
  response=await route.PATCH(new Request('https://cookbook.test/api/v1/pantry',{method:'PATCH',headers:{Authorization:`Bearer cb_${'a'.repeat(43)}`},body:JSON.stringify({requestId,updates:[]})}),context(['pantry']));assert.equal(response.status,400);assert.equal(calls.length,0);
  response=await route.POST(new Request('https://cookbook.test/api/v1/artifacts',{method:'POST',headers:{Authorization:`Bearer cb_${'a'.repeat(43)}`},body:JSON.stringify({requestId,skillSlug:'invented-skill',title:'A',contentMarkdown:'Draft'})}),context(['artifacts']));assert.equal(response.status,404);assert.equal(calls.length,0);
  response=await route.GET(new Request('https://cookbook.test/api/v1/artifacts?cursor=broken',{headers:{Authorization:`Bearer cb_${'a'.repeat(43)}`}}),context(['artifacts']));assert.equal(response.status,400);assert.equal(calls.length,0);
  process.env.COOKBOOK_INTEGRATIONS_ENABLED='false';
  response=await route.GET(new Request('https://cookbook.test/api/v1/skills'),context(['skills']));assert.equal(response.status,404);
 }finally{if(prior===undefined)delete process.env.COOKBOOK_INTEGRATIONS_ENABLED;else process.env.COOKBOOK_INTEGRATIONS_ENABLED=prior;if(priorV2===undefined)delete process.env.COOKBOOK_V2_ENABLED;else process.env.COOKBOOK_V2_ENABLED=priorV2;}
});

test('scraper rejects private, loopback, link-local, mapped IPv4 and reserved addresses',()=>{
 const {publicAddress,siteHost}=load('@/lib/cookbook-scraper');
 for(const address of ['127.0.0.1','10.1.2.3','169.254.169.254','192.168.1.1','100.64.0.1','::1','::','fc00::1','fe80::1','::ffff:127.0.0.1','::ffff:10.0.0.1'])assert.equal(publicAddress(address),false,address);
 assert.equal(publicAddress('1.1.1.1'),true);assert.equal(publicAddress('2606:4700:4700::1111'),true);
 assert.equal(siteHost('https://www.Example.com/about'),'example.com');
});

test('free accounts cannot run marketing chat, paid skills or edit general artifacts through shared access checks',async()=>{
 const prior=process.env.COOKBOOK_INTEGRATIONS_ENABLED,priorV2=process.env.COOKBOOK_V2_ENABLED;process.env.COOKBOOK_INTEGRATIONS_ENABLED='true';process.env.COOKBOOK_V2_ENABLED='true';
 const fake={rpc:async()=>({data:false,error:null}),from:()=>({select(){return this;},eq(){return this;},single:async()=>({data:{skill_slug:'landing-page-copywriter',foundation_key:null},error:null})})};
 const access=loader({'@/lib/supabase/admin':{createAdminClient:()=>fake}})('@/lib/cookbook-access');
 try{await access.requireSkillAccess('user','brand-voice-guide');await assert.rejects(access.requireSkillAccess('user','marketing-chat'),/PLAN_REQUIRED/);await assert.rejects(access.requireSkillAccess('user','landing-page-copywriter'),/PLAN_REQUIRED/);await assert.rejects(access.requireTaskAccess('user','task'),/PLAN_REQUIRED/);}
 finally{if(prior===undefined)delete process.env.COOKBOOK_INTEGRATIONS_ENABLED;else process.env.COOKBOOK_INTEGRATIONS_ENABLED=prior;if(priorV2===undefined)delete process.env.COOKBOOK_V2_ENABLED;else process.env.COOKBOOK_V2_ENABLED=priorV2;}
});

test('MCP HTTP boundary rejects foreign origins and missing credentials before constructing a server',async()=>{
 const route=loader({'@/lib/integrations/service':{requireIntegration(){},baseUrl:()=> 'https://cookbook.test',bearer(){throw new Error('AUTH_REQUIRED');}}})('@/app/mcp/route');
 let r=await route.POST(new Request('https://cookbook.test/mcp',{method:'POST',headers:{Origin:'https://attacker.test'},body:'{}'}));assert.equal(r.status,403);
 r=await route.POST(new Request('https://cookbook.test/mcp',{method:'POST',body:'{}'}));assert.equal(r.status,401);assert.equal(r.headers.get('cache-control'),'no-store');
});

test('scan allowance is consumed only after evidence is saved; failed imports release it and successful retries reuse the saved result',async()=>{
 const {EventEmitter}=require('node:events');
 const before=[process.env.COOKBOOK_INTEGRATIONS_ENABLED,process.env.COOKBOOK_V2_ENABLED];process.env.COOKBOOK_INTEGRATIONS_ENABLED='true';process.env.COOKBOOK_V2_ENABLED='true';
 const operations=[];let cached=null,fetches=0;
 const fakeRequest=(_url,_options,respond)=>{
  const req=new EventEmitter();req.end=()=>queueMicrotask(()=>{fetches++;const res=new EventEmitter();res.statusCode=200;res.headers={'content-type':'text/html'};respond(res);res.emit('data',Buffer.from(`<html><title>Example</title><p>${'Useful website evidence. '.repeat(15)}</p></html>`));res.emit('end');req.emit('close');});req.destroy=error=>{req.emit('error',error);req.emit('close');};return req;
 };
 const db={rpc:async(_name,args)=>{operations.push(args.p_action);if(args.p_action==='finish')cached=args.p_data.result;return {data:args.p_action==='reserve'&&cached?{cached}:{reserved:true},error:null};}};
 const {scanWebsiteForUser}=loader({'node:dns/promises':{lookup:async()=>[{address:'1.1.1.1',family:4}]},'node:https':{request:fakeRequest},'@/lib/supabase/admin':{createAdminClient:()=>db}})('@/lib/cookbook-scraper');
 try{
  await assert.rejects(scanWebsiteForUser('user','https://example.com',{requestId},async()=>{throw new Error('Storage failed');}),/Storage failed/);
  assert.deepEqual(operations,['reserve','fail']);
  const result=await scanWebsiteForUser('user','https://example.com',{requestId},async()=>({saved:true}));assert.deepEqual(result,{saved:true});assert.deepEqual(operations.slice(-2),['reserve','finish']);
  const retry=await scanWebsiteForUser('user','https://example.com',{requestId},async()=>{throw new Error('Must not save twice');});assert.deepEqual(retry,{saved:true});assert.equal(fetches,2);
 }finally{for(const [i,key] of ['COOKBOOK_INTEGRATIONS_ENABLED','COOKBOOK_V2_ENABLED'].entries()){if(before[i]===undefined)delete process.env[key];else process.env[key]=before[i];}}
});
