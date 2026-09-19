import { mkdir, readFile, writeFile, chmod } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createApi, validateBaseUrl } from './client';
const args=process.argv.slice(2);
const option=(name:string)=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
const configPath=path.resolve(option('--config')||path.join(homedir(),'.config','cookbook','cookbook.json'));
function hiddenKey():Promise<string> {
  if(!process.stdin.isTTY)throw new Error('Run connect in an interactive terminal so the key can be entered privately.');
  process.stderr.write('Paste your Cookbook connection key (hidden): ');
  return new Promise((resolve,reject)=>{
    let value='';process.stdin.setRawMode(true);process.stdin.resume();process.stdin.setEncoding('utf8');
    const finish=()=>{process.stdin.setRawMode(false);process.stdin.pause();process.stdin.unref();process.stdin.off('data',onData);process.stderr.write('\n');};
    const onData=(chunk:string)=>{for(const ch of chunk){if(ch==='\u0003'){finish();reject(new Error('Cancelled.'));return;}if(ch==='\r'||ch==='\n'){finish();resolve(value.trim());return;}if(ch==='\u007f'){value=value.slice(0,-1);}else if(ch>=' ')value+=ch;}};
    process.stdin.on('data',onData);
  });
}
async function main() {
  if(args[0]==='serve') {
    const [{McpServer},{serveStdio},{registerCookbook}]=await Promise.all([import('@modelcontextprotocol/server'),import('@modelcontextprotocol/server/stdio'),import('./register')]);
    const config=JSON.parse(await readFile(configPath,'utf8'));
    const api=createApi(config.url,config.key);
    await serveStdio(()=>{const server=new McpServer({name:'cookbook',version:'0.1.0'});registerCookbook(server,api);return server;});
    return;
  }
  if(args[0]!=='connect'){process.stdout.write('Usage: cookbook connect --client codex|claude-code|manual [--url https://www.cookbook.to] [--name cookbook]\n       cookbook serve [--config /absolute/path/connection.json]\n');return;}
  const client=option('--client')||'manual',name=option('--name')||'cookbook';
  if(!['codex','claude-code','manual'].includes(client)||!/^[a-zA-Z0-9_-]{1,60}$/.test(name))throw new Error('Choose codex, claude-code, or manual and a simple connection name.');
  const url=validateBaseUrl(option('--url')||'https://www.cookbook.to');
  // Check for an existing registration before storing credentials or changing configuration.
  if(client!=='manual') {
    const command=client==='codex'?'codex':'claude';
    const existing=spawnSync(command,['mcp','get',name],{stdio:'ignore'});
    if(existing.error)throw new Error(`Install ${command} and make it available in PATH first.`);
    if(existing.status===0)throw new Error(`The ${name} server already exists. Use --name with another name or remove that registration first.`);
  }
  const key=await hiddenKey();
  if(!/^cb_[A-Za-z0-9_-]{43}$/.test(key))throw new Error('Invalid Cookbook key format.');
  const connection=await createApi(url,key).connection();
  const destination=option('--config')?configPath:path.join(path.dirname(configPath),`${name}.json`);
  await mkdir(path.dirname(destination),{recursive:true,mode:0o700});
  // Exclusive creation avoids silently replacing another app's credentials.
  await writeFile(destination,JSON.stringify({url,key})+'\n',{mode:0o600,flag:'wx'});
  await chmod(destination,0o600);
  const executable=fileURLToPath(import.meta.url),serverArgs=[executable,'serve','--config',destination];
  if(client==='manual')process.stdout.write(JSON.stringify({mcpServers:{[name]:{command:process.execPath,args:serverArgs}}},null,2)+'\n');
  else {
    const command=client==='codex'?'codex':'claude';
    const registerArgs=client==='codex'?['mcp','add',name,'--',process.execPath,...serverArgs]:['mcp','add','--transport','stdio','--scope','user',name,'--',process.execPath,...serverArgs];
    const result=spawnSync(command,registerArgs,{stdio:'inherit'});
    if(result.error||result.status!==0)throw new Error(`Registration failed. Your credential file is saved at ${destination}; see the manual setup instructions.`);
  }
  process.stderr.write(`Connected to ${connection.name}. Restart your AI app if needed. Keys stay in ${destination}.\n`);
}
main().catch(error=>{process.stderr.write(`Cookbook: ${error instanceof Error?error.message:'Connection failed.'}\n`);process.exitCode=1;});
