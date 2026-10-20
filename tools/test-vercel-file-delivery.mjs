import assert from 'node:assert/strict';
import sharp from 'sharp';
import {createNightMapHandler} from '../api/night-map.js';
import {renderHomeMap} from '../lib/home-map-day-night.js';
import {authorizeFileDelivery, createCloudCityLookup, resolveCloudMapCity, fileCityBackend, CLOUD_CITY_ORIGIN} from '../lib/location/cloud-city-bridge.js';

const token = 'synthetic-file-delivery-token-'.repeat(2);
const env = {WIDGY_MAP_FILE_ACCESS_TOKEN: token};
const point = {latitude: 51.5074, longitude: -0.1278};
const entry = {...point, city: 'London', countryName: 'United Kingdom', observedAt: Date.now()};
const at = '2026-10-20T12:00:00Z';
const path = changes => '/api/night-map?' + new URLSearchParams({delivery:'vercel-file-v1',
  location_key:token,lat:String(point.latitude),lon:String(point.longitude),
  shared_location:'1',city:'Untrusted caller name',at,width:'3306',presentation:'glass',atlas:'r6',...changes});
const good = () => new Response(JSON.stringify({entry,state:'SHARED'}),{headers:{'Content-Type':'application/json'}});
let checks=0;
async function test(name, fn) {await fn();checks++;console.log('PASS '+name);}
const oldToken=process.env.WIDGY_MAP_FILE_ACCESS_TOKEN, oldInfo=console.info;
process.env.WIDGY_MAP_FILE_ACCESS_TOKEN=token;
const logs=[];console.info=s=>logs.push(s);
async function route(url, resolver, method='GET') {
  const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.statusCode=n;return this;},
    json(v){this.body=v;return this;},send(v){this.body=v;return this;},end(){return this;}};
  await createNightMapHandler({resolveFileCity:resolver})({url,method,headers:{}},res);
  return res;
}
try {
  await test('Only known opt-in mode accepts the existing app key and exact coordinates',async()=>{
    assert.equal(fileCityBackend({}),'cloud-run');
    assert.equal(fileCityBackend({WIDGY_MAP_FILE_CITY_BACKEND:'vercel-bdc'}),'vercel-bdc');
    assert.throws(()=>fileCityBackend({WIDGY_MAP_FILE_CITY_BACKEND:'unknown'}),/not_configured/);
    assert.deepEqual(authorizeFileDelivery(new URL(path({}),'https://test.invalid'),env),point);
    assert.equal(authorizeFileDelivery(new URL('https://test.invalid/'),env),null);
    for(const [changes,extra] of [[{location_key:'bad'},''],[{lat:'91'},''],[{delivery:'unknown'},''],[{},'&delivery=vercel-file-v1'],[{},'&location_key='+token],[{},'&lat=0'],[{},'&city_cache_v1=read']]) {
      assert.throws(()=>authorizeFileDelivery(new URL(path(changes)+extra,'https://test.invalid'),env));
    }
    assert.throws(()=>authorizeFileDelivery(new URL(path({}),'https://test.invalid'),{}),/not_configured/);
  });
  await test('Bridge sends one bounded request to the fixed owned service without redirects',async()=>{
    let calls=0;
    const lookup=createCloudCityLookup({env:()=>env,fetcher:async(url,init)=>{
      calls++;assert.equal(url.origin,CLOUD_CITY_ORIGIN);assert.equal(url.pathname,'/api/fetch-probe');
      assert.equal(url.searchParams.get('location_shared'),'1');assert.equal(url.searchParams.get('location_key'),token);
      assert.equal(url.searchParams.get('lat'),String(point.latitude));assert.equal(init.redirect,'error');
      assert(init.signal instanceof AbortSignal);return good();
    }});
    assert.deepEqual(await lookup(point),{entry,state:'SHARED'});assert.equal(calls,1);
  });
  await test('Wrong status, type, malformed JSON and oversized bodies fail closed',async()=>{
    for(const make of [()=>new Response('{}',{status:403}),()=>new Response('<html>login</html>'),
      ()=>new Response('{bad',{headers:{'content-type':'application/json'}}),
      ()=>new Response('x'.repeat(8193),{headers:{'content-type':'application/json'}})]) {
      await assert.rejects(createCloudCityLookup({env:()=>env,fetcher:async()=>make()})(point));
    }
  });
  await test('A stalled network or stalled response body has a bounded deadline and is aborted',async()=>{
    for(const stalledBody of [false,true]) {
      let signal;
      const lookup=createCloudCityLookup({env:()=>env,timeoutMs:15,fetcher:async(_,init)=>{
        signal=init.signal;
        return stalledBody?new Response(new ReadableStream({start(){}}),{headers:{'content-type':'application/json'}}):new Promise(()=>{});
      }});
      await assert.rejects(lookup(point),/city_bridge_timeout/);assert(signal.aborted);
    }
  });
  await test('Missing and duplicate credentials cannot reach the upstream or renderer',async()=>{
    let calls=0;const resolver=async()=>{calls++;return {city:'London',state:'SHARED'};};
    for(const [url,status] of [[path({location_key:''}),403],[path({})+'&location_key='+token,403],
      [path({lat:'100'}),400],[path({delivery:'other'}),400],[path({})+'&city_cache_v1=read',400]]) {
      const r=await route(url,resolver);assert.equal(r.statusCode,status);assert(!Buffer.isBuffer(r.body));
    }
    assert.equal(calls,0);
  });
  await test('Healthy bridge produces exactly the approved full-resolution city PNG',async()=>{
    const lookup=createCloudCityLookup({env:()=>env,fetcher:async()=>good()});
    const r=await route(path({}),p=>resolveCloudMapCity(p,{lookup,defer(){}}));
    assert.equal(r.statusCode,200);assert.equal(r.headers['X-Map-Service'],'vercel-file-v1');
    assert.equal(r.headers['X-Map-City-Service'],'cloud-run');assert.equal(r.headers['X-Location-Cache'],'SHARED');
    const expected=await renderHomeMap({date:new Date(at),location:{...point,city:'London',source:'coordinates'},width:3306,presentation:'glass',atlas:'r6'});
    assert(r.body.equals(expected));const m=await sharp(r.body).metadata();assert.equal(m.width,3306);assert.equal(m.height,1558);
    await sharp(r.body).raw().toBuffer();
  });
  await test('Delayed city work continues after the decision without blocking map delivery',async()=>{
    let finish,background;
    const lookup=()=>new Promise(resolve=>{finish=resolve;});
    const r=await route(path({width:'1102'}),p=>resolveCloudMapCity(p,{lookup,deadlineMs:5,defer:w=>{background=w;}}));
    assert.equal(r.statusCode,200);assert.equal(r.headers['X-Location-Cache'],'TIMEOUT');assert(Buffer.isBuffer(r.body));
    finish({entry,state:'SHARED'});await background;assert.equal(r.headers['X-Location-Cache'],'TIMEOUT');
  });
  await test('2400px delivery preserves the compositor, colour profile and exact expected PNG',async()=>{
    const r=await route(path({width:'2400'}),async()=>({city:'London',state:'SHARED'}));
    assert.equal(r.statusCode,200);assert.equal(r.headers['X-Map-Width'],'2400');
    assert.equal(r.headers['X-Map-Service'],'vercel-file-v1');
    const expected=await renderHomeMap({date:new Date(at),location:{...point,city:'London',source:'coordinates'},width:2400,presentation:'glass',atlas:'r6'});
    assert(r.body.equals(expected));
    const m=await sharp(r.body).metadata();assert.equal(m.width,2400);assert.equal(m.height,1131);
    assert.equal(m.space,'srgb');assert(m.hasAlpha && m.hasProfile);
    await sharp(r.body).raw().toBuffer();
  });
  await test('Wrong-coordinate city response is rejected and caller-supplied name is never reused',async()=>{
    const r=await route(path({width:'1102'}),p=>resolveCloudMapCity(p,{lookup:async()=>({entry:{...entry,latitude:0},state:'SHARED'}),defer(){}}));
    assert.equal(r.headers['X-Location-Cache'],'UNAVAILABLE');
    const expected=await renderHomeMap({date:new Date(at),location:{...point,city:'',source:'coordinates'},width:1102,presentation:'glass',atlas:'r6'});
    assert(r.body.equals(expected));
  });
  await test('Fixed A/B image is authenticated but does not call a city service',async()=>{
    let calls=0;const r=await route(path({shared_location:'0',city:'TEST A',width:'1102'}),async()=>{calls++;});
    assert.equal(r.statusCode,200);assert.equal(calls,0);assert.equal(r.headers['X-Map-Service'],'vercel-file-v1');
  });
  await test('Existing route does not require the new token and retains approved rendering',async()=>{
    delete process.env.WIDGY_MAP_FILE_ACCESS_TOKEN;
    const url=new URL(path({shared_location:'0',city:'Sample City',width:'1102'}),'https://test.invalid');url.searchParams.delete('delivery');
    const r=await route(url.pathname+url.search);assert.equal(r.statusCode,200);assert(!r.headers['X-Map-Service']);
    const unavailable=await route(path({}),()=>{throw Error('must not call');});assert.equal(unavailable.statusCode,503);
  });
  assert(logs.every(s=>!s.includes(token)&&!s.includes('London')&&!s.includes('Untrusted caller')));
} finally {console.info=oldInfo;if(oldToken===undefined)delete process.env.WIDGY_MAP_FILE_ACCESS_TOKEN;else process.env.WIDGY_MAP_FILE_ACCESS_TOKEN=oldToken;}
console.log(JSON.stringify({passed:checks,providerCalls:0,quotaChanges:0,fullResolutionImageOracle:true}));
