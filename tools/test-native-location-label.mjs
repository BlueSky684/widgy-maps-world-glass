import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createNativeLocationHandler,locationLabel} from '../lib/location/native-label.js';
import {authorizeLocation} from '../lib/location/shared.js';
const point={latitude:1,longitude:2},time=1000000000;
const result=(state='MEMORY',observedAt=time)=>({state,entry:{...point,city:'City A',countryName:'Country',observedAt}});
const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},status(v){this.statusCode=v;return this;},json(v){this.body=v;return this;}});
const request={method:'GET',url:'/api/fetch-probe?location_shared=1&view=label-v1&lat=1&lon=2'};
const native=(options={})=>createNativeLocationHandler({authorize:()=>point,resolve:async()=>result(),now:()=>time,schedule:()=>{},...options});

test('native text projection matches the actual old script, including Unicode and stale results',async()=>{
  const old=readFileSync(new URL('./widget-city-fast-path.js',import.meta.url),'utf8');
  for(const state of ['MEMORY','SHARED','LOOKUP','STALE'])for(const [city,countryName] of [['Ashkelon','Israel'],['東京','日本'],['São Paulo','Brasil'],['עיר','מדינה']]) {
    const value=result(state);Object.assign(value.entry,{city,countryName});
    let output;
    const context=vm.createContext({Date,fetch:async()=>({ok:true,json:async()=>value}),sendToWidgy:x=>{output=x;}});
    vm.runInContext(old,context);context.sharedLocationText('1','2','https://example.invalid/?');
    for(let i=0;i<12;i++)await Promise.resolve();
    assert.equal(locationLabel(value,point),output);
  }
});

test('fresh responses keep the original private expiry, stale/expired ones stay no-store',async()=>{
  for(const [value,expected] of [[result(),'private, max-age=60, must-revalidate'],
    [result('SHARED',time-3599500),'private, no-store'],
    [result('LOOKUP',time-3580000),'private, max-age=20, must-revalidate'],
    [result('STALE',time-3600001),'private, no-store'],
    [result('MEMORY',time+1),'private, no-store']]) {
    const res=response();await native({resolve:async()=>value})(request,res);
    assert.equal(res.statusCode,200);assert.equal(res.body.text,'City A, Country');
    assert.equal(res.headers['Cache-Control'],expected);
    assert.equal(res.headers['Vercel-CDN-Cache-Control'],'no-store');
  }
});

test('the existing authorization and exact coordinates remain mandatory',async()=>{
  const env={BIGDATACLOUD_API_KEY:'synthetic',WIDGY_LOCATION_ACCESS_TOKEN:'x'.repeat(43)};
  const authorize=url=>authorizeLocation(url,env);
  let calls=0;
  const handler=native({authorize,resolve:async p=>{calls++;assert.deepEqual(p,point);return result();}});
  const query='&location_key='+env.WIDGY_LOCATION_ACCESS_TOKEN;
  const res=response();await handler({...request,url:request.url+query},res);
  assert.equal(res.body.text,'City A, Country');assert.equal(calls,1);
  const comma=response();await handler({...request,url:request.url.replace('lat=1&lon=2','lat=%201%2C0%20&lon=2%2C0')+query},comma);
  assert.equal(comma.body.text,'City A, Country');assert.equal(calls,2);
  for(const suffix of ['',query+'&lat=9',query+'&location_key=other']) {
    const res=response();await handler({...request,url:request.url+suffix},res);
    assert.equal(res.body.text,'Location unavailable');assert.equal(res.headers['Cache-Control'],'private, no-store');
  }
  assert.equal(calls,2);
});

test('wrong-point, malformed, failed and timed-out results cannot publish false city data',async()=>{
  for(const value of [null,{}, {entry:{...result().entry,latitude:9}}, {entry:{...result().entry,city:''}}]) {
    const res=response();await native({resolve:async()=>value})(request,res);
    assert.deepEqual(res.body,{text:'Location unavailable'});
    assert.equal(res.headers['Cache-Control'],'private, no-store');
  }
  const failure=response();await native({resolve:async()=>{throw Error('private provider contents');}})(request,failure);
  assert.deepEqual(failure.body,{text:'Location unavailable'});
  let release,sent=0,scheduled=0;
  const res=response(),original=res.json;res.json=function(v){sent++;return original.call(this,v);};
  await native({resolve:()=>new Promise(r=>release=r),deadlineMs:5,schedule:()=>scheduled++})(request,res);
  assert.equal(res.body.text,'Location unavailable');assert.equal(scheduled,1);
  release(result());await new Promise(r=>setImmediate(r));assert.equal(sent,1);
  const post=response();await native()({...request,method:'POST'},post);assert.equal(post.statusCode,405);
});

test('only the explicit label route returns native text; legacy route keeps its contract',async()=>{
  const {default:dispatch}=await import('../api/fetch-probe.js');
  const before=process.env.WIDGY_LOCATION_ACCESS_TOKEN;
  delete process.env.WIDGY_LOCATION_ACCESS_TOKEN;
  try {
    const res=response();await dispatch(request,res);
    assert.equal(res.statusCode,200);assert.deepEqual(res.body,{text:'Location unavailable'});
    const legacy=response();await dispatch({...request,url:request.url.replace('&view=label-v1','')},legacy);
    assert.equal(legacy.statusCode,503);assert.deepEqual(legacy.body,{error:'Location unavailable'});
    assert.equal(legacy.headers['Access-Control-Allow-Origin'],'*');
  }finally {
    if(before===undefined)delete process.env.WIDGY_LOCATION_ACCESS_TOKEN;
    else process.env.WIDGY_LOCATION_ACCESS_TOKEN=before;
  }
});
