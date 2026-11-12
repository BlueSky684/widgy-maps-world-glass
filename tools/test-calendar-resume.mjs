import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/calendar-bridge.js';
import {ORIGIN,SESSION_COOKIE,seal,unseal} from '../lib/calendar-bridge/security.js';
process.env.CALENDAR_SEAL_KEY='2'.repeat(64);
process.env.CALENDAR_SETUP_KEY='synthetic-setup-key-'.repeat(4);
process.env.CALENDAR_GOOGLE_CLIENT_ID='test';process.env.CALENDAR_GOOGLE_CLIENT_SECRET='test';
const owner={google:{refresh:'synthetic-refresh'},sources:[{provider:'google',id:'test@example.test',color:0}],zone:'Asia/Jerusalem'};
async function call(body,{cookie,origin=ORIGIN,method='POST'}={}) {
 const res={headers:{},code:200,setHeader(k,v){this.headers[k.toLowerCase()]=v},status(v){this.code=v;return this},json(v){this.data=v;return this},end(){return this}};
 await handler({method,url:'/api/calendar-bridge?op=resume',headers:{origin,'content-type':'application/json',cookie},body},res);return res;
}
const setup=async()=>`${SESSION_COOKIE}=${await seal({sources:[],zone:'Asia/Jerusalem'},'calendar-setup')}`;
test('restore requires session, fresh setup key, same origin and valid widget audience',async()=>{
 const token=await seal(owner,'calendar-widget'),key=process.env.CALENDAR_SETUP_KEY,cookie=await setup();
 for(const [body,options,code] of [[{token,key},{},401],[{token,key:'wrong'},{cookie},401],[{token,key},{cookie,origin:'https://other.invalid'},403],[{token,key},{cookie,method:'GET'},405],[{token:'broken',key},{cookie},401],[{token:await seal(owner,'calendar-render'),key},{cookie},401],[{token:await seal(owner,'calendar-widget','-1s'),key},{cookie},401]]) {
  const res=await call(body,options);assert.equal(res.code,code);assert(!res.headers['set-cookie']);assert(!JSON.stringify(res.data).includes('synthetic-refresh'));
 }
});
test('valid restoration verifies accounts and returns no credentials; provider failure preserves session',async()=>{
 const original=globalThis.fetch;let mode='ok',calls=0;
 globalThis.fetch=async u=>{calls++;const url=new URL(u);if(mode==='fail')return new Response('',{status:403});
  if(url.hostname==='oauth2.googleapis.com')return Response.json({access_token:'synthetic-access',expires_in:3600});
  if(url.pathname.endsWith('/calendarList'))return Response.json({items:[{id:'test@example.test',summary:'Personal'},{id:'new-holidays',summary:'Holidays'}]});
  throw Error('Unexpected synthetic request');};
 try{
  const input={token:await seal({...owner,oauth:{state:'must-not-copy'}},'calendar-widget'),key:process.env.CALENDAR_SETUP_KEY};const options={cookie:await setup()};
  const r=await call(input,options);assert.equal(r.code,200);assert(calls>=2);assert(!JSON.stringify(r.data).includes('synthetic-refresh'));
  const sessionToken=r.headers['set-cookie'].split(';')[0].split('=')[1];const restored=await unseal(sessionToken,'calendar-setup');assert.deepEqual(restored,owner);assert(!restored.oauth);
  mode='fail';const failed=await call(input,options);assert.equal(failed.code,502);assert(!failed.headers['set-cookie']);assert.deepEqual(failed.data,{error:'provider_read_failed'});
 }finally{globalThis.fetch=original;}
});
