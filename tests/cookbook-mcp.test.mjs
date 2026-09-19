import {test} from 'node:test';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const {loader} = require('./ts-loader.cjs');
const {recipeList, recipe} = loader()('@/lib/integrations/service');
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdir,mkdtemp,writeFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createServer} from 'node:http';
import {createMcpHandler} from 'mcp-handler';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
await mkdir('packages/cookbook-mcp/dist',{recursive:true});
await build({entryPoints:['packages/cookbook-mcp/src/register.ts'],bundle:true,packages:'external',platform:'node',format:'esm',outfile:'packages/cookbook-mcp/dist/register-test.mjs'});
const {registerCookbook}=await import(pathToFileURL(path.resolve('packages/cookbook-mcp/dist/register-test.mjs')).href);
const context={projectId:'p',sections:[{key:'voice',approvedContent:'# Voice\nWarm and specific.',approvedVersion:1,latestVersion:2,pending:true}]};
const api={recipes:async()=>({items:recipeList()}),recipe:async(slug,mode)=>recipe(slug,mode),pantry:async()=>context,propose:async()=>({status:'pending_review',reviewUrl:'https://cookbook.test/create?view=cookbook'}),save:async()=>{throw new Error('PLAN_REQUIRED');},list:async()=>({items:[],nextCursor:null}),get:async()=>({title:'Saved'})};
async function listen(handler){const server=createServer(handler);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return {server,url:`http://127.0.0.1:${server.address().port}`};}

test('remote MCP negotiates with a real client, exposes tools/resources/prompts, and preserves review-only writes',async()=>{
 const handler=createMcpHandler(server=>registerCookbook(server,api),{maxSubscriptions:0});
 const {server,url}=await listen(async(req,res)=>{try{const chunks=[];for await(const c of req)chunks.push(c);const response=await handler(new Request(`${url}${req.url}`,{method:req.method,headers:req.headers,...(chunks.length?{body:Buffer.concat(chunks)}:{})}));res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch(e){res.writeHead(500);res.end(String(e));}});
 const client=new Client({name:'test',version:'1.0'});
 try{
  await client.connect(new StreamableHTTPClientTransport(new URL(`${url}/mcp`)));
  const tools=await client.listTools();assert.equal(tools.tools.length,7);
  const recipes=await client.callTool({name:'list_recipes',arguments:{}});assert.match(recipes.content[0].text,/customer-interview/);
  for (const slug of ['go-to-market-strategy', 'offer-pricing-strategy', 'sales-enablement-playbook']) {
   assert.ok(JSON.parse(recipes.content[0].text).items.some(item=>item.slug===slug));
   const fromTool=await client.callTool({name:'get_recipe',arguments:{slug}});
   const fromResource=await client.readResource({uri:`cookbook://recipes/${slug}`});
   assert.equal(JSON.parse(fromTool.content[0].text).markdownContent,fromResource.contents[0].text);
   assert.equal(fromResource.contents[0].text,(await api.recipe(slug)).markdownContent);
  }
  const context=await client.readResource({uri:'cookbook://pantry/brand-context'});assert.match(context.contents[0].text,/Warm and specific/);
  const recipe=await client.readResource({uri:'cookbook://recipes/customer-interview-synthesizer'});assert.match(recipe.contents[0].text,/# Customer Interview Synthesizer/);
  const result=await client.callTool({name:'update_brand_context',arguments:{requestId:'55555555-5555-4555-8555-555555555555',updates:[{key:'voice',content:'# Voice\nCalm.',expectedVersion:2,sources:[]}]}});assert.match(result.content[0].text,/pending_review/);
  const denied=await client.callTool({name:'save_deliverable',arguments:{requestId:'55555555-5555-4555-8555-555555555555',skillSlug:'a',title:'A',contentMarkdown:'# Draft'}});assert.equal(denied.isError,true);assert.match(denied.content[0].text,/PLAN_REQUIRED/);
  const prompt=await client.getPrompt({name:'customer-interview-synthesizer',arguments:{interview_notes:'A customer said they need a simpler process.'}});assert.match(prompt.messages[0].content.text,/approvedBrand/);
 }finally{await client.close();await new Promise(resolve=>server.close(resolve));}
});

test('standalone stdio connector talks to the REST API and refuses redirected credentials',async()=>{
 await build({entryPoints:['packages/cookbook-mcp/src/cli.ts'],bundle:true,platform:'node',target:'node22',format:'esm',outfile:'packages/cookbook-mcp/dist/cli.mjs',banner:{js:'#!/usr/bin/env node\nimport { createRequire } from "node:module"; const require = createRequire(import.meta.url);'}});
 const temp=await mkdtemp(path.join(tmpdir(),'cookbook-mcp-'));
 const key=`cb_${'a'.repeat(43)}`;const calls=[];
 const {server,url}=await listen((req,res)=>{calls.push(req.url);assert.equal(req.headers.authorization,`Bearer ${key}`);res.setHeader('Content-Type','application/json');res.end(JSON.stringify(req.url==='/api/v1/pantry'?context:{items:[{slug:'brand-voice-guide'}]}));});
 const config=path.join(temp,'connection.json');await writeFile(config,JSON.stringify({url,key}),{mode:0o600});
 assert.equal((await stat(config)).mode&0o777,0o600);
 const client=new Client({name:'stdio-test',version:'1.0'});
 try{await client.connect(new StdioClientTransport({command:process.execPath,args:[path.resolve('packages/cookbook-mcp/dist/cli.mjs'),'serve','--config',config],stderr:'pipe'}));
  assert.equal((await client.listTools()).tools.length,7);
  const result=await client.callTool({name:'get_brand_context',arguments:{}});assert.match(result.content[0].text,/Warm and specific/);assert.deepEqual(calls,['/api/v1/pantry']);
 }finally{await client.close();await new Promise(resolve=>server.close(resolve));await rm(temp,{recursive:true,force:true});}
});

test('REST bridge refuses redirects instead of forwarding a connection key',async()=>{
 await build({entryPoints:['packages/cookbook-mcp/src/client.ts'],bundle:true,packages:'external',platform:'node',format:'esm',outfile:'packages/cookbook-mcp/dist/client-test.mjs'});
 const {createApi,validateBaseUrl}=await import(pathToFileURL(path.resolve('packages/cookbook-mcp/dist/client-test.mjs')).href);
 assert.throws(()=>validateBaseUrl('http://remote.example.com'));assert.throws(()=>validateBaseUrl('https://key@example.com'));assert.throws(()=>validateBaseUrl('https://example.com/path'));
 let leaked=false;
 const {server:target,url:targetUrl}=await listen((_req,res)=>{leaked=true;res.end('{}');});
 const {server:source,url}=await listen((_req,res)=>{res.writeHead(302,{Location:targetUrl});res.end();});
 try{await assert.rejects(createApi(url,'secret').connection());assert.equal(leaked,false);}
 finally{await Promise.all([new Promise(r=>source.close(r)),new Promise(r=>target.close(r))]);}
});

test('interactive connector hides the key, writes private credentials, and registers each client without embedding secrets',{skip:!['darwin','linux'].includes(process.platform)},async()=>{
 const {spawn}=await import('node:child_process');
 const {readFile,chmod}=await import('node:fs/promises');
 const temp=await mkdtemp(path.join(tmpdir(),'cookbook-connect-'));
 const key=`cb_${'b'.repeat(43)}`;
 const {server,url}=await listen((req,res)=>{assert.equal(req.headers.authorization,`Bearer ${key}`);res.setHeader('Content-Type','application/json');res.end(JSON.stringify({name:'CLI test connection'}));});
 const mock=`#!${process.execPath}\nconst fs=require('node:fs'); const args=process.argv.slice(2); if(args[1]==='get')process.exit(process.env.COOKBOOK_TEST_EXISTS==='1'?0:1); fs.writeFileSync(process.env.COOKBOOK_TEST_ARGS,JSON.stringify(args));`;
 for(const name of ['codex','claude']){await writeFile(path.join(temp,name),mock);await chmod(path.join(temp,name),0o755);}
 async function connect(client,config,exists=false){
  const command=[process.execPath,path.resolve('packages/cookbook-mcp/dist/cli.mjs'),'connect','--client',client,'--url',url,'--config',config];
  return new Promise((resolve,reject)=>{
   const proc=spawn('python3',['-c',`import os, pty, sys, subprocess, select
master, slave = pty.openpty()
child = subprocess.Popen(sys.argv[1:], stdin=slave, stdout=slave, stderr=slave)
os.close(slave)
inputs = [master, sys.stdin.fileno()]
while child.poll() is None:
    for fd in select.select(inputs, [], [], 0.1)[0]:
        try:
            data = os.read(fd, 65536)
        except OSError:
            data = b''
        if not data:
            inputs.remove(fd)
        elif fd == master:
            os.write(sys.stdout.fileno(), data)
        else:
            os.write(master, data)
while select.select([master], [], [], 0)[0]:
    try:
        data = os.read(master, 65536)
    except OSError:
        break
    if not data:
        break
    os.write(sys.stdout.fileno(), data)
os.close(master)
sys.exit(child.wait())`,...command],{env:{...process.env,PATH:`${temp}:${process.env.PATH}`,COOKBOOK_TEST_ARGS:path.join(temp,'registration.json'),COOKBOOK_TEST_EXISTS:exists?'1':'0'},stdio:['pipe','pipe','pipe']});
   let output='',sent=false;const timer=setTimeout(()=>{proc.kill();reject(new Error('Interactive setup timed out: '+output.replaceAll(key,'[redacted]')));},15000);
   const receive=chunk=>{output+=chunk.toString();if(!sent&&output.includes('(hidden):')){sent=true;proc.stdin.write(key+'\n');}};
   proc.stdout.on('data',receive);proc.stderr.on('data',receive);proc.on('error',reject);proc.on('close',code=>{clearTimeout(timer);resolve({code,output});});
  });
 }
 try{
  for(const client of ['codex','claude-code']){
   const config=path.join(temp,`${client}.json`),result=await connect(client,config);
   assert.equal(result.code,0,result.output);assert.ok(!result.output.includes(key),'key was echoed');
   assert.equal((await stat(config)).mode&0o777,0o600);assert.equal(JSON.parse(await readFile(config,'utf8')).key,key);
   const args=JSON.parse(await readFile(path.join(temp,'registration.json'),'utf8'));assert.equal(args[0],'mcp');assert.equal(args[1],'add');assert.ok(args.includes(config));assert.ok(!args.includes(key));
  }
  const unused=path.join(temp,'existing.json'),refused=await connect('codex',unused,true);
  assert.match(refused.output,/already exists/);await assert.rejects(stat(unused));
 }finally{await new Promise(resolve=>server.close(resolve));await rm(temp,{recursive:true,force:true});}
});
