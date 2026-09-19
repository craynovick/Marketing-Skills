import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { createAdminClient } from '@/lib/supabase/admin';
import { hostedLimitsEnabled } from '@/lib/cookbook-access';
import { selfHosted } from '@/lib/integrations/service';
const blocked = new BlockList();
for(const [ip,bits] of [['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.0.0.0',24],['192.168.0.0',16],['198.18.0.0',15],['224.0.0.0',3]] as const) blocked.addSubnet(ip,bits,'ipv4');
for(const [ip,bits] of [['::',128],['::1',128],['fc00::',7],['fe80::',10],['ff00::',8],['2001:db8::',32]] as const) blocked.addSubnet(ip,bits,'ipv6');
export function publicAddress(address:string) {const family=isIP(address);return !!family&&!blocked.check(address,family===4?'ipv4':'ipv6');}
export function siteHost(value:string) {return new URL(/^https?:\/\//i.test(value)?value:`https://${value}`).hostname.toLowerCase().replace(/^www\./,'').replace(/\.$/,'');}
async function safeUrl(value:string,host:string) {
  const url=new URL(/^https?:\/\//i.test(value)?value:`https://${value}`);
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.port&&!['80','443'].includes(url.port)||siteHost(url.href)!==host)throw new Error('SITE_LOCKED');
  const hostname=url.hostname.replace(/^\[|\]$/g,'');
  const addresses=await lookup(hostname,{all:true});
  if(!addresses.length||addresses.some(a=>!publicAddress(a.address)))throw new Error('INVALID_REQUEST');
  return {url,address:addresses[0]};
}
async function readHtml(value:string,host:string):Promise<{url:string;html:string}> {
  let target=value;
  for(let hop=0;hop<3;hop++) {
    const {url,address}=await safeUrl(target,host);
    // Pin the validated DNS result for the connection; redirects are revalidated.
    const response=await new Promise<{status:number;location?:string;html:string}>((resolve,reject)=>{
      const req=(url.protocol==='https:'?httpsRequest:httpRequest)(url,{...{autoSelectFamily:false},headers:{'User-Agent':'Cookbook-intake/1.0','Accept':'text/html'},lookup:(_hostname,_options,callback)=>callback(null,address.address,address.family)},res=>{
        if([301,302,303,307,308].includes(res.statusCode||0)){res.resume();resolve({status:res.statusCode!,location:res.headers.location,html:''});return;}
        if(!res.statusCode||res.statusCode<200||res.statusCode>=300||!res.headers['content-type']?.includes('text/html')){res.resume();reject(new Error('Website did not return a readable HTML page.'));return;}
        const chunks:Buffer[]=[];let size=0;
        res.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>350000){req.destroy(new Error('Website page exceeds 350 KB.'));return;}chunks.push(chunk);});
        res.on('end',()=>resolve({status:res.statusCode!,html:Buffer.concat(chunks).toString('utf8')}));res.on('error',reject);
      });
      const timer=setTimeout(()=>req.destroy(new Error('Website request timed out.')),10000);
      req.on('close',()=>clearTimeout(timer));req.on('error',reject);req.end();
    });
    if(response.location){target=new URL(response.location,url).href;continue;}
    if(response.status>=300)throw new Error('Website redirect is missing its destination.');
    return {url:url.href,html:response.html};
  }
  throw new Error('Too many website redirects.');
}
const textFromHtml=(html:string)=>html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim().slice(0,24000);
export async function scrapeWebsite(value:string) {
  const host=siteHost(value),first=await readHtml(value,host);
  const links=Array.from(first.html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi)).flatMap(m=>{try{const u=new URL(m[1],first.url);return siteHost(u.href)===host&&!u.hash&&/(about|solution|service|product|industry|case|resource|blog|faq|contact)/i.test(u.pathname)?[u.href]:[];}catch{return [];}});
  const candidates=[...new Set(links)].filter(u=>u!==first.url).slice(0,5);
  const results=await Promise.all(candidates.map(async url=>{try{return {page:await readHtml(url,host),failed:null};}catch{return {page:null,failed:url};}}));
  const pages=[first,...results.flatMap(r=>r.page?[r.page]:[])].map(p=>({url:p.url,title:p.html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1].replace(/<[^>]+>/g,' ').trim().slice(0,200)||null,text:textFromHtml(p.html)}));
  if(pages.map(p=>p.text).join(' ').length<120)throw new Error('Not enough public website content. Continue with your own evidence.');
  return {website:first.url,pageCount:pages.length,pages,failedPages:results.flatMap(r=>r.failed?[r.failed]:[])};
}
export async function scanWebsiteForUser<T>(userId:string,url:string,options:{requestId:string;foundation?:string;gap?:string},persist:(evidence:Awaited<ReturnType<typeof scrapeWebsite>>)=>Promise<T>):Promise<T> {
  if(!hostedLimitsEnabled())return persist(await scrapeWebsite(url));
  const db=createAdminClient();
  async function control(action:string,data:Record<string,unknown>) {
    const {data:result,error}=await db.rpc('cookbook_scan_control',{p_user:userId,p_action:action,p_data:{...options,...data},p_self_hosted:selfHosted()});
    if(error)throw error;return result;
  }
  const reserved=await control('reserve',{hostname:siteHost(url)});
  if(reserved.cached)return reserved.cached as T;
  try {const result=await persist(await scrapeWebsite(url));await control('finish',{result});return result;}
  catch(error){await control('fail',{});throw error;}
}
