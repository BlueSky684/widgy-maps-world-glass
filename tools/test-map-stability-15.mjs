import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createServer} from 'node:http';
import {createHash,createDecipheriv} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import sharp from 'sharp';
import {createStabilityHandler,selection} from '../lib/map-stability-handler.js';
import config from '../lib/map-stability-config.json' with {type:'json'};
const secrets=JSON.parse(fs.readFileSync('work/private/map-stability-15-secrets.json'));
let now=1791800000000,state={mode:'a',rev:1,selectedAt:now,untilAt:0,sourceCount:0,imageCount:0},calls=0;
const waits=[],logs=[];
// Deterministic HTTP routing tests. The deployed Redis Lua is checked separately.
async function store(action,v,t){
 calls++;
 if(state.untilAt&&t>=state.untilAt)Object.assign(state,{mode:'b',rev:state.rev+1,selectedAt:t,untilAt:0});
 if(action==='set')Object.assign(state,{mode:v.mode,rev:state.rev+1,selectedAt:t,untilAt:['json-error','image-error','slow'].includes(v.mode)?t+300000:0});
 if(action==='source')state.sourceCount++;
 if(action==='image')state.imageCount++;
 return structuredClone(state);
}
const handler=createStabilityHandler({config,store,clock:()=>now,wait:async n=>waits.push(n),log:x=>logs.push(x)});
const server=createServer(handler);await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
const get=path=>fetch(base+path,{redirect:'error'});
const set=mode=>fetch(base+'/api/map-stability',{method:'POST',headers:{Authorization:'Bearer '+secrets.control,'Content-Type':'application/json'},body:JSON.stringify({action:'set',mode})});
const source=()=>get('/api/map-stability?kind=source&key='+secrets.read);
const image=url=>get(new URL(url).pathname+new URL(url).search);
const digest=b=>createHash('sha256').update(b).digest('hex');
try{
 assert.equal((await get('/api/map-stability?kind=source&key=bad')).status,401);assert.equal(calls,0);
 assert.equal((await fetch(base+'/api/map-stability',{method:'POST',headers:{Authorization:'Bearer '+secrets.read,'Content-Type':'application/json'},body:'{"action":"set","mode":"b"}'})).status,401);assert.equal(calls,0);
 assert.equal((await set('invalid')).status,400);assert.equal(calls,0);
 const a=await(await source()).json();assert.equal(a.fixture,'a');
 let res=await image(a.image);assert.equal(res.status,200);assert.match(res.headers.get('content-type'),/image\/png/);
 let bytes=Buffer.from(await res.arrayBuffer());assert.equal(digest(bytes),config.fixtures.a.sha256);
 assert.equal((await sharp(bytes).metadata()).width,3306);
 await set('b');const b=await(await source()).json();assert.notEqual(a.image,b.image);res=await image(b.image);bytes=Buffer.from(await res.arrayBuffer());assert.equal(digest(bytes),config.fixtures.b.sha256);
 // Old successful URLs remain byte-identical after a control change.
 assert.equal(digest(Buffer.from(await(await image(a.image)).arrayBuffer())),config.fixtures.a.sha256);
 await set('json-error');res=await source();assert.equal(res.status,503);assert.equal(res.headers.get('cache-control'),'no-store');
 now+=300001;res=await source();assert.equal(res.status,200);assert.equal((await res.json()).fixture,'b');
 await set('image-error');const failed=await(await source()).json();assert.equal((await image(failed.image)).status,503);
 now+=300001;assert.equal((await image(failed.image)).status,200);
 await set('slow');const slow=await(await source()).json();assert.equal((await image(slow.image)).status,200);assert.deepEqual(waits,[6000]);
 await set('auto');const first=selection(state,now);now+=1800000;const second=selection(state,now);assert.notEqual(first.asset,second.asset);assert.notEqual(first.rev,second.rev);now+=1800000;assert.equal(selection(state,now).asset,first.asset);
 const count=state.sourceCount;const status=await fetch(base+'/api/map-stability?kind=status',{headers:{Authorization:'Bearer '+secrets.control}});assert.equal(status.status,200);assert.equal(state.sourceCount,count);
 const all=JSON.stringify(logs);for(const secret of Object.values(secrets))assert(!all.includes(secret));assert(!all.includes('key='));
 const e=JSON.parse(fs.readFileSync('tools/map-stability-15.enc.json')),data=Buffer.from(e.data,'base64url');
 const d=createDecipheriv('aes-256-gcm',Buffer.from(secrets.key,'base64url'),Buffer.from(e.iv,'base64url'));d.setAAD(Buffer.from('map-stability-15:v1'));d.setAuthTag(data.subarray(-16));
 const plain=gunzipSync(Buffer.concat([d.update(data.subarray(0,-16)),d.final()]));assert.equal(digest(plain),e.sha256);
 const payload=JSON.parse(plain),candidate=JSON.parse(fs.readFileSync('work/private/Widgy_Weather_15_Stability.json'));assert.deepEqual(payload.widget,candidate);assert.equal(payload.control,secrets.control);
 const original=JSON.parse(fs.readFileSync('work/private/Widgy_Health_Premium_1.json'));
 const walk=ns=>ns.flatMap(n=>[n,...(n.z==='13'?walk(n['1']):[])]),map=w=>walk(w['1']).find(n=>n.d0===6170);
 const restored=structuredClone(candidate);for(const k of ['1','2','3','8','9','11','13']){delete map(restored)[k];if(Object.hasOwn(map(original),k))map(restored)[k]=map(original)[k];}
 restored['36'].find(v=>v['1']==='map_request')['3']['66'][0]['25']=original['36'].find(v=>v['1']==='map_request')['3']['66'][0]['25'];restored['3']=original['3'];restored['4']=original['4'];assert.deepEqual(restored,original);
 assert.equal(digest(fs.readFileSync('work/private/Widgy_Health_Premium_1.json')),'4af8c286f333f3dcded3891f81ac267bb1711fc080a0923bbc637880cef970e7');
 console.log(JSON.stringify({passed:true,checks:['authentication isolation','invalid controls rejected','full PNG hashes and dimensions','immutable old image URL','metadata failure','image failure','five-minute recovery','six-second delay selected','automatic fixture/URL rotation','status not counted as widget request','logs contain no keys','encrypted payload roundtrip','exact full-widget restoration'],nativeWidgyStillUnverified:true,redisLua:'pending live isolated verification'}));
}finally{await new Promise(r=>server.close(r));}
