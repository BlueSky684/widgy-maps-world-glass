import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {BridgeError,privateHeaders} from '../lib/calendar-bridge/security.js';
import {monthWindow} from '../lib/calendar-bridge/dots.js';
import {widgetSnapshot} from '../lib/calendar-bridge/widget-data.js';
import {widgyFields} from '../lib/calendar-bridge/widgy-fields.js';

const before=execFileSync('git',['show','6a8689058105cdfed629506c14de4879acef43b9:api/calendar-widget.js'],{encoding:'utf8'});
const after=readFileSync(new URL('../api/calendar-widget.js',import.meta.url),'utf8');
function setup(code){
  let time=Date.parse('2026-10-08T14:00:00Z'),reads=0,renders=0,fail=false;
  const logs=[];
  class Clock extends Date {constructor(...args){super(...(args.length?args:[time]));}static now(){return time;}}
  const state={zone:'Asia/Jerusalem',sources:[{provider:'google',id:'PRIVATE_CALENDAR_ID',color:0},
    {provider:'apple-holidays',id:'il_he',color:1}],google:{refresh:'PRIVATE_REFRESH'}};
  const context={Date:Clock,performance,Buffer,createHash,BridgeError,privateHeaders,monthWindow,widgetSnapshot,widgyFields,
    origin:()=> 'https://example.test',URL,console:{info:line=>logs.push(JSON.parse(line))},
    unseal:async token=>{if(token==='invalid')throw new BridgeError('unauthorized',401);return state;},
    readEvents:async()=>{reads++;if(fail)throw Error('PRIVATE_PROVIDER_ERROR');return [{
      uid:'PRIVATE_EVENT_ID',source:'PRIVATE_CALENDAR_ID',provider:'google',color:0,
      title:'PRIVATE_TITLE',location:'PRIVATE_LOCATION',allDay:true,start:'2026-10-08',end:'2026-10-09'}];},
    renderDots:async(events,window,{bounds})=>{renders++;return Buffer.from('PNG '+bounds);}};
  vm.createContext(context);
  vm.runInContext(code.replace(/^import .*;\n/gm,'').replace('export default async function handler','async function handler')
    .replace('export function clientMaxAge','function clientMaxAge')+'\nthis.handler=handler;',context);
  async function request(query='',method='GET',token='PRIVATE_TOKEN'){
    const start=logs.length,res={headers:{},code:200,body:null,setHeader(k,v){this.headers[k.toLowerCase()]=v;},
      status(c){this.code=c;return this;},json(v){this.body=JSON.parse(JSON.stringify(v));return this;},
      send(v){this.body=Buffer.from(v);return this;},end(){return this;}};
    await context.handler({method,url:'/api/calendar-widget?token='+token+query,
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
  assert.deepEqual(actual.output,baseline.output,'Diagnostics preserve body/status/cache headers');
  assert.equal(actual.logs.length,2);assert.equal(actual.logs[0].phase,'started');
  assert.equal(actual.logs[1].status,actual.output.code);
  assert.equal(actual.logs[1].phase,actual.output.code===200?'prepared':'failed');
  if(method==='HEAD' && query.includes('dots'))assert.equal(actual.logs[1].bodyBytes,0);
}
assert.equal(current.reads(),2);assert.equal(current.renders(),3);
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
  'providerCache','providerWaitMs','status','responseMs','pngBytes','bodyBytes','stage']);
for(const entry of current.logs){
  for(const key of Object.keys(entry))assert(keys.has(key),'Only approved operational fields');
  for(const [key,value]of Object.entries(entry))if(key.endsWith('Ms'))assert(Number.isFinite(value)&&value>=0);
}
assert(!JSON.stringify(current.logs).includes('PRIVATE_'),'No request, credentials, source or event content in logs');
console.log('PASS: Calendar diagnostics preserve responses/privacy/cache/coalescing; identify request view, offset, wait, rendering, HEAD, errors and recovery. Native navigation latency is not inferred.');
