import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createMapRenderCache} from '../lib/map-render-cache.js';
import {parseMapRequest} from '../lib/native-map-request.js';
import {resolveLocation} from '../lib/map-astronomy-location.js';
import {randomUUID} from 'node:crypto';
import {compareMapRequestKeys} from '../lib/map-request-key-diagnostics.js';

let now=Date.parse('2026-10-08T12:54:00Z'), fail=false, renders=0;
const logs=[];
class Clock extends Date {constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
const context={Date:Clock,URLSearchParams,Buffer,randomUUID,compareMapRequestKeys,performance:{now:()=>now},
  console:{info(line){logs.push(JSON.parse(line));},error(){}},
  parseMapRequest,resolveLocation,REVISION:'diagnostic-test',precomputedState:()=> 'HIT',
  createMapRenderCache:()=>createMapRenderCache({now:()=>now}),
  async renderHomeMap(){renders++;if(fail)throw Error('synthetic failure');return Buffer.from('synthetic PNG bytes');}};
const route=readFileSync(new URL('../api/night-map.js',import.meta.url),'utf8')
  .replace(/^import .*;\n/gm,'').replace('export default async function handler','async function handler');
vm.runInNewContext(route,context);
async function request({method='GET',suffix='',headers={}}={}){
  const res={headers:{},code:null,body:null,setHeader(k,v){this.headers[k.toLowerCase()]=v;},
    status(n){this.code=n;return this;},send(b){this.body=b;return this;},json(b){this.body=b;return this;},end(){return this;}};
  const index=logs.length;
  await context.handler({method,url:'/api/night-map?mode=live&width=3306&presentation=glass&atlas=r6&reuse=60&lat=0&lon=0&city=PRIVATE_CITY_SENTINEL&token=PRIVATE_TOKEN_SENTINEL'+suffix,
    headers:{'user-agent':'PRIVATE_AGENT_SENTINEL',...headers}},res);
  return {res,logs:logs.slice(index)};
}
const first=await request();
assert.equal(first.res.code,200);assert.equal(first.logs[0].phase,'started');
assert.equal(first.logs[1].phase,'prepared');assert.equal(first.logs[1].cache,'MISS');
assert.equal(first.logs[1].bodyBytes,first.res.body.length);assert.equal(first.logs[1].conditional,false);
const repeat=await request();assert.equal(repeat.logs[1].cache,'HIT');
assert.deepEqual(repeat.res.body,first.res.body);assert.equal(renders,1);
const conditional=await request({headers:{'if-none-match':first.res.headers.etag}});
assert.equal(conditional.res.code,304);assert.equal(conditional.res.body,null);
assert.equal(conditional.logs[1].bodyBytes,0);assert.equal(conditional.logs[1].conditional,true);
assert.equal(conditional.logs[1].pngBytes,first.res.body.length);
const head=await request({method:'HEAD'});assert.equal(head.res.body,null);assert.equal(head.logs[1].bodyBytes,0);
const post=await request({method:'POST'});assert.equal(post.res.code,405);assert.equal(post.logs[0].method,'OTHER');
const bad=await request({suffix:'&at=invalid'});assert.equal(bad.res.code,400);assert.equal(bad.logs[1].reason,'invalid_instant');
now+=61000;fail=true;
const failure=await request();assert.equal(failure.res.code,500);assert.equal(failure.logs[1].phase,'failed');
fail=false;const recovery=await request();assert.equal(recovery.res.code,200);assert.equal(recovery.logs[1].cache,'MISS');
const text=JSON.stringify(logs);
for(const value of ['PRIVATE_CITY_SENTINEL','PRIVATE_TOKEN_SENTINEL','PRIVATE_AGENT_SENTINEL','lat=','lon=','synthetic PNG bytes',first.res.headers.etag])
  assert(!text.includes(value),'Diagnostics must exclude request and image content');
const keys=new Set(['event','phase','method','elapsedMs','status','cache','pngBytes','bodyBytes','conditional','precomputed','reason']);
for (const key of ['instance','instanceRequest','previousKeyComparison','previousKeyChanges','previousRequestAgeMs']) keys.add(key);
for(const entry of logs)for(const key of Object.keys(entry))assert(keys.has(key),'Unexpected logged field');
assert.equal(first.logs[1].previousKeyComparison,'first');
assert.equal(first.logs[1].previousRequestAgeMs,null);
assert.equal(repeat.logs[1].previousKeyComparison,'same');
assert.equal(repeat.logs[1].previousRequestAgeMs,0);
assert.equal(first.logs[0].instance,repeat.logs[1].instance);
assert.equal(repeat.logs[0].instanceRequest,first.logs[0].instanceRequest+1);
assert.match(first.logs[0].instance,/^[0-9a-f-]{36}$/);
console.log('PASS: safe start/response/error diagnostics; unchanged MISS/HIT/304/HEAD and private cache behavior; rejected requests; render-failure recovery; no query/location/city/token/header/image content in logs.');
