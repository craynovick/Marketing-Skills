import type { CookbookApi } from './register';
export function validateBaseUrl(value:string) {
  const url=new URL(value);
  if(url.username||url.password||url.search||url.hash||!['','/'].includes(url.pathname)||!(url.protocol==='https:'||url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)))throw new Error('Use an HTTPS Cookbook origin, or HTTP on localhost for development.');
  return url.origin;
}
export function createApi(base:string,key:string) {
  base=validateBaseUrl(base);
  async function call(path:string,method='GET',body?:unknown) {
    const response=await fetch(`${base}/api/v1/${path}`,{method,headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(30000)});
    const data=await response.json();
    if(!response.ok)throw new Error(`${data.code||'REQUEST_FAILED'}: ${data.error||'Cookbook request failed.'}`);
    return data;
  }
  const api:CookbookApi={recipes:()=>call('skills'),recipe:(slug,mode)=>call(`skills/${encodeURIComponent(slug)}${mode?`?mode=${encodeURIComponent(mode)}`:''}`),pantry:()=>call('pantry'),propose:v=>call('pantry','PATCH',v),save:v=>call('artifacts','POST',v),list:v=>call(`artifacts?${new URLSearchParams(Object.entries(v as Record<string,string>).filter(([,value])=>value!==undefined))}`),get:id=>call(`artifacts/${encodeURIComponent(id)}`)};
  return {...api,connection:()=>call('connection')};
}
