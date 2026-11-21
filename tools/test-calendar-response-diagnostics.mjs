import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {BridgeError} from '../lib/calendar-bridge/security.js';
import {calendarHandler} from './fixtures/calendar-handler.mjs';

const before=execFileSync('git',['show','6a8689058105cdfed629506c14de4879acef43b9:api/calendar-widget.js'],{encoding:'utf8'});
const after=readFileSync(new URL('../api/calendar-widget.js',import.meta.url),'utf8');
function setup(code){
  let time=Date.parse('2026-10-08T14:00:00Z'),reads=0,renders=0,fail=false;
  const logs=[];
  const store=new Map();
  const state={zone:'Asia/Jerusalem',sources:[{provider:'google',id:'PRIVATE_CALENDAR_ID',color:0},
    {provider:'apple-holidays',id:'il_he',color:1}],google:{refresh:'PRIVATE_REFRESH'}};
  const handler=calendarHandler({
    now:()=>time,remote:()=>({get:async k=>store.get(k),set:async(k,v)=>store.set(k,v)}),background:()=>{},
    info:line=>logs.push(JSON.parse(line)),
    unseal:async token=>{if(token==='invalid')throw new BridgeError('unauthorized',401);return state;},
    readEvents:async()=>{reads++;if(fail)throw Error('PRIVATE_PROVIDER_ERROR');return [{
      uid:'PRIVATE_EVENT_ID',source:'PRIVATE_CALENDAR_ID',provider:'google',color:0,
      title:'PRIVATE_TITLE',location:'PRIVATE_LOCATION',allDay:true,start:'2026-10-08',end:'2026-10-09'}];},
    renderDots:async(events,window,{bounds})=>{renders++;return Buffer.from('PNG '+bounds);}
  },code);
  async function request(query='',method='GET',token='PRIVATE_TOKEN'){
    const start=logs.length,res={headers:{},code:200,body:null,setHeader(k,v){this.headers[k.toLowerCase()]=v;},
      status(c){this.code=c;return this;},json(v){this.body=JSON.parse(JSON.stringify(v));return this;},
      send(v){this.body=Buffer.from(v);return this;},end(){return this;}};
    await handler({method,url:'/api/calendar-widget?token='+token+query,
      headers:{cookie:'PRIVATE_COOKIE','user-agent':'PRIVATE_AGENT'}},res);
    const headers={...res.headers};delete headers['server-timing'];
    return {output:{code:res.code,headers,body:res.body},logs:logs.slice(start)};
  }
  return {request,logs,reads:()=>reads,renders:()=>renders,advance:()=>time+=61000,setFail:v=>fail=v};
}
const old=setup(before),current=setup(after);
for(const [query,method,token] of [
  ['&view=today&format=widgy','GET'],['&view=today','GET'],['&view=today','HEAD'],
  ['&view=dots&bounds=grid','GET'],['&view=dots&bounds=grid','HEAD'],['&view=dots','GET'],
  ['&view=dots&offset=1','GET'],['&view=PRIVATE_BAD_VIEW','GET'],['&offset=1','GET'],
  ['&bounds=grid','GET'],['','POST'],['&format=widgy','GET','invalid']]){
  const baseline=await old.request(query,method,token),actual=await current.request(query,method,token);
  // Check the historical response plus the revision and source-cache metadata
  // added since. All content, status and private caching headers are compared.
  const headers={...baseline.output.headers,'x-calendar-revision':'flight-auto-v1'};
  if(query.includes('view=dots') && baseline.output.code===200){
    Object.assign(headers,{'x-calendar-data-state':'current','x-calendar-data-age':'0',
      'x-calendar-missing-sources':'0','x-calendar-stale-sources':'0',
      'x-calendar-provider-cache':'SOURCE-CACHE'});
  }
  assert.deepEqual(actual.output,{...baseline.output,headers},'Calendar response contract');
  assert.equal(actual.logs.length,2);assert.equal(actual.logs[0].phase,'started');
  assert.equal(actual.logs[1].status,actual.output.code);
  assert.equal(actual.logs[1].phase,actual.output.code===200?'prepared':'failed');
  if(method==='HEAD' && query.includes('dots'))assert.equal(actual.logs[1].bodyBytes,0);
}
assert.equal(current.reads(),3,'One TODAY read and one annual read for each of two calendar sources');assert.equal(current.renders(),3);
assert.equal(current.logs.find(l=>l.phase==='prepared').providerCache,'MISS');
assert(current.logs.some(l=>l.providerCache==='REUSE'));
current.advance();current.setFail(true);
assert.equal((await current.request()).logs.at(-1).stage,'provider');
current.setFail(false);assert.equal((await current.request()).output.code,200);
const simultaneous=setup(after);
await Promise.all(Array.from({length:8},()=>simultaneous.request('&view=today&format=widgy')));
assert.equal(simultaneous.reads(),1,'In-flight coalescing remains unchanged');
assert.equal(simultaneous.logs.filter(l=>l.phase==='prepared'&&l.providerCache==='REUSE').length,7);
const keys=new Set(['event','phase','method','elapsedMs','view','bounds','offset','validationMs','sources',
  'providerWindow','providerCache','providerWaitMs','status','responseMs','pngBytes','bodyBytes','stage']);
for(const entry of current.logs){
  for(const key of Object.keys(entry))assert(keys.has(key),'Only approved operational fields');
  for(const [key,value]of Object.entries(entry))if(key.endsWith('Ms'))assert(Number.isFinite(value)&&value>=0);
}
assert(!JSON.stringify(current.logs).includes('PRIVATE_'),'No request, credentials, source or event content in logs');
console.log('PASS: Calendar diagnostics preserve responses/privacy/cache/coalescing; identify request view, offset, wait, rendering, HEAD, errors and recovery. Native navigation latency is not inferred.');
