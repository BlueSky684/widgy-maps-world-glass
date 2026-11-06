import test from 'node:test';
import assert from 'node:assert/strict';
import {createRenderCache} from '../lib/weather/render-cache.js';
import {createWeatherHandler} from '../lib/weather/handler.js';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
function response(){return {headers:{},setHeader(k,v){this.headers[k]=v;},status(v){this.code=v;return this;},send(v){this.body=v;return this;},json(v){this.body=v;return this;},end(){return this;}};}

test('eight overlapping requests join one image, then reuse the exact bytes',async()=>{
  const c=createRenderCache(),gate=deferred();let calls=0;
  const image=Buffer.from('exact image pixels and bytes');
  const produce=()=>{calls++;return gate.promise;};
  const requests=Array.from({length:8},()=>c.acquire('same-weather-options',produce));
  await Promise.resolve();assert.equal(calls,1);
  assert.deepEqual(requests.map(r=>r.state),['MISS',...Array(7).fill('JOIN')]);
  gate.resolve(image);const all=await Promise.all(requests.map(r=>r.value));
  assert(all.every(v=>v===image));
  const next=c.acquire('same-weather-options',produce);assert.equal(next.state,'HIT');assert.equal(await next.value,image);assert.equal(calls,1);
});
test('different data/options stay independent; rejection clears pending work',async()=>{
  const c=createRenderCache(),gate=deferred();
  const first=c.acquire('A',()=>gate.promise),join=c.acquire('A',()=>{throw Error('must not run');});
  assert.equal((await c.acquire('B',async()=>Buffer.from('B')).value).toString(),'B');
  const both=Promise.allSettled([first.value,join.value]);gate.reject(Error('offline'));
  assert((await both).every(r=>r.status==='rejected'));
  const retry=c.acquire('A',async()=>Buffer.from('recovered'));assert.equal(retry.state,'MISS');assert.equal((await retry.value).toString(),'recovered');
});
test('TTL and LRU limits do not extend old entries or retain unlimited keys',async()=>{
  let now=0;const c=createRenderCache({clock:()=>now,ttlMs:100,maxEntries:2});
  let calls=0;const get=k=>c.acquire(k,async()=>{calls++;return k;});
  await get('A').value;await get('B').value;assert.equal(get('A').state,'HIT');
  await get('C').value;assert.equal(get('A').state,'HIT');assert.equal(get('B').state,'MISS');
  await get('B').value;now=100;assert.equal(get('B').state,'MISS');await get('B').value;
  assert(calls>=5);
});
test('pending-key cap still returns every distinct result and retains no failed key',async()=>{
  const c=createRenderCache({maxEntries:1}),gate=deferred();
  const a=c.acquire('A',()=>gate.promise),b=c.acquire('B',async()=>2);
  assert.equal(await b.value,2);assert.equal(c.acquire('B',async()=>3).state,'MISS');
  gate.resolve(1);assert.equal(await a.value,1);assert.equal(c.acquire('A',async()=>9).state,'HIT');
});
test('handler coalesces images, preserves headers/ETag and keeps Home JSON render-free',async()=>{
  const gate=deferred(),rows=[];let calls=0;
  const data={zone:'UTC',at:1,current:{temperature:23,label:'Cloudy'},days:[{high:25,low:18,sunrise:'06:00',sunset:'17:00'}],hours:[]};
  const h=createWeatherHandler({forecast:async()=>({data,state:'fresh',cache:'HIT'}),airQuality:async()=>({value:53,state:'fresh'}),
    render:async()=>{calls++;return gate.promise;},log:r=>rows.push(r)});
  const req={method:'GET',url:'/api/weather-panel?lat=0&lon=0&v=13',headers:{}};
  const work=Array.from({length:8},()=>h(req,response()));
  const home=await h({...req,url:req.url+'&format=json&view=home-v1'},response());
  assert.equal(home.body.temperature,'23°C');
  gate.resolve(Buffer.from('complete-unchanged-png'));const all=await Promise.all(work);
  assert.equal(calls,1);assert(all.every(r=>r.body.equals(all[0].body)));
  assert(all.every(r=>r.headers.ETag===all[0].headers.ETag));
  assert(all.every(r=>r.headers['CDN-Cache-Control']==='no-store'));
  assert.equal(rows.filter(r=>r.renderCache==='JOIN').length,7);
  const unchanged=await h({...req,headers:{'if-none-match':all[0].headers.ETag}},response());assert.equal(unchanged.code,304);assert.equal(calls,1);
});
