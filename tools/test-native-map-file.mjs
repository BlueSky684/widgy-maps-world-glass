import assert from 'node:assert/strict';
import sharp from 'sharp';
import {nativeFileToken, tagNativePNG} from '../lib/native-map-file.js';
import {createNightMapHandler} from '../api/night-map.js';
import {createHash} from 'node:crypto';
import {readNativeHandoffTiming} from '../lib/native-handoff-timing.js';

const key='synthetic-native-test-key-'.repeat(3), id='11111111-2222-4333-8444-555555555555';
const params={delivery:'vercel-file-v1',location_key:key,lat:'51.5',lon:'-0.1',width:'2400',
  shared_location:'0',city:'TEST',at:'2026-10-22T00:00:00Z',presentation:'glass',atlas:'r6',native_file:'1',transfer_id:id};
const url=(p={})=>new URL('https://test.invalid/api/night-map?'+new URLSearchParams({...params,...p}));
let checks=0;const test=async(name,fn)=>{await fn();checks++;console.log('PASS '+name)};
const previous=process.env.WIDGY_MAP_FILE_ACCESS_TOKEN, info=console.info, logs=[];
process.env.WIDGY_MAP_FILE_ACCESS_TOKEN=key;console.info=s=>logs.push(s);
const handler=createNightMapHandler({resolveFileCity:async()=>{throw Error('No city lookup expected')}});
async function route(u,headers={},method='GET'){
  const res={headers:{},setHeader(k,v){this.headers[k]=v},status(n){this.statusCode=n;return this},
    json(v){this.body=v;return this},send(v){this.body=v;return this},end(){return this}};
  await handler({url:u.pathname+u.search,method,headers},res);return res;
}
try{
  await test('Native opt-in requires authentication, width 2400, one UUID and one flag',async()=>{
    assert.equal(nativeFileToken(url(),true),id);
    for(const p of [{native_file:'0'},{transfer_id:'bad'},{width:'3306'},{format:'png'}])assert.throws(()=>nativeFileToken(url(p),true));
    assert.throws(()=>nativeFileToken(url(),false));
    for(const k of ['native_file','transfer_id','width']){const u=url();u.searchParams.append(k,params[k]);assert.throws(()=>nativeFileToken(u,true))}
    assert.equal(nativeFileToken(new URL('https://test.invalid/'),false),null);
  });
  const native=await route(url());
  await test('Native response is a noncached attachment with full body and request identity',async()=>{
    assert.equal(native.statusCode,200);assert.equal(native.headers['Content-Type'],'application/octet-stream');
    assert.equal(native.headers['Content-Disposition'],'attachment; filename="world-glass-map.png"');
    for(const h of ['Cache-Control','CDN-Cache-Control','Vercel-CDN-Cache-Control'])assert.match(native.headers[h],/no-store/);
    assert(native.body.includes(Buffer.from('WorldGlassTransfer\0'+id)));
    assert.equal(native.headers['X-Map-Service'],'vercel-file-v1');
  });
  await test('PNG pixels, dimensions, colour profile and original image chunks are unchanged',async()=>{
    const u=url();u.searchParams.delete('native_file');u.searchParams.delete('transfer_id');
    const ordinary=await route(u);assert.equal(ordinary.headers['Content-Type'],'image/png');
    assert(tagNativePNG(ordinary.body,id).equals(native.body));
    const a=await sharp(ordinary.body).raw().toBuffer(),b=await sharp(native.body).raw().toBuffer();assert(a.equals(b));
    const m=await sharp(native.body).metadata();assert.equal(m.width,2400);assert.equal(m.height,1131);assert(m.hasProfile);
  });
  await test('Conditional native requests never receive an empty 304, HEAD remains bodyless',async()=>{
    assert.equal((await route(url(),{'if-none-match':'*'})).statusCode,200);
    const head=await route(url(),{},'HEAD');assert.equal(head.statusCode,200);assert.equal(head.body,undefined);
  });
  await test('Bad auth or native parameters cannot return an image',async()=>{
    for(const p of [{location_key:'bad'},{transfer_id:'bad'},{width:'3306'}]){
      const r=await route(url(p));assert([400,403].includes(r.statusCode));assert(!Buffer.isBuffer(r.body));
    }
  });
  await test('Transfer marker differs per request; credentials and transfer IDs stay out of app logs',async()=>{
    const other=await route(url({transfer_id:'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'}));
    assert(!other.body.equals(native.body));assert(logs.every(s=>!s.includes(key)&&!s.includes(id)));
  });
  await test('Only authenticated native requests expose a deterministic hashed correlation',async()=>{
    const expected=createHash('sha256').update('world-glass-transfer-v1:'+id).digest('hex').slice(0,24);
    const start=logs.length;
    await route(url({transfer_id:id.toUpperCase()}));
    const rows=logs.slice(start).map(s=>JSON.parse(s));
    assert(rows.some(r=>r.phase==='started'&&r.transferCorrelation===expected));
    assert(rows.some(r=>r.phase==='prepared'&&r.transferCorrelation===expected));
    for(const r of rows)assert.equal(r.transferCorrelation,expected);
    const ordinary=url();ordinary.searchParams.delete('native_file');ordinary.searchParams.delete('transfer_id');
    const next=logs.length;await route(ordinary);
    assert(logs.slice(next).every(s=>!Object.hasOwn(JSON.parse(s),'transferCorrelation')));
    const rejected=logs.length;await route(url({location_key:'bad'}));await route(url({transfer_id:'bad'}));
    assert(logs.slice(rejected).every(s=>!s.includes('transferCorrelation')));
    assert(logs.every(s=>!s.includes(key)&&!s.includes(id)&&!s.includes('location_key=')));
  });
  await test('Optional handoff timing splits the phone tail and handler boundary without changing bytes or cache policy',async()=>{
    const start=logs.length, snapshot=1794636939062, ready=snapshot+105000;
    const r=await route(url({handoff_v1:`${snapshot},${ready}`}));
    assert.equal(r.statusCode,200);assert(r.body.equals(native.body));
    const stableHeaders=h=>Object.fromEntries(Object.entries(h).filter(([name])=>name!=='Server-Timing'));
    assert.deepEqual(stableHeaders(r.headers),stableHeaders(native.headers));
    const rows=logs.slice(start).map(s=>JSON.parse(s));
    const timing=rows.find(r=>r.phase==='started').handoffTiming;
    assert.equal(timing.tailMs,105000);assert.equal(timing.readyAt,ready);
    assert.equal(timing.readyToHandlerMs,timing.handlerEnteredAt-ready);
    assert.equal(rows.find(r=>r.phase==='prepared').previousKeyComparison,'bypass','fixed-time fixture remains uncached');
    assert(!rows.find(r=>r.phase==='prepared').handoffTiming);
    const shifted=readNativeHandoffTiming(url({handoff_v1:`${snapshot},${ready}`}),ready-5000);
    assert.equal(shifted.readyToHandlerMs,-5000,'clock offsets must not be silently clamped');
  });
  await test('Invalid optional timing is ignored; only authorized native requests log timing',async()=>{
    const snapshot=1794636939062, good=`${snapshot},${snapshot+40}`;
    for(const value of ['', 'bad',`${snapshot},${snapshot-1}`,`${snapshot},${snapshot+86400001}`,
      `${snapshot},Infinity`,`${snapshot},${snapshot}.5`,good+',extra']){
      const u=url({handoff_v1:value});assert.equal(readNativeHandoffTiming(u,Date.now()),null);
      const start=logs.length,r=await route(u);assert.equal(r.statusCode,200);assert(r.body.equals(native.body));
      assert(logs.slice(start).every(s=>!Object.hasOwn(JSON.parse(s),'handoffTiming')));
    }
    const duplicate=url({handoff_v1:good});duplicate.searchParams.append('handoff_v1',good);
    assert.equal(readNativeHandoffTiming(duplicate,Date.now()),null);
    const start=logs.length;assert.equal((await route(duplicate)).statusCode,200);
    const ordinary=url({handoff_v1:good});ordinary.searchParams.delete('native_file');ordinary.searchParams.delete('transfer_id');
    await route(ordinary);await route(url({handoff_v1:good,location_key:'bad'}));
    await route(url({handoff_v1:good,transfer_id:'bad'}));
    assert(logs.slice(start).every(s=>!Object.hasOwn(JSON.parse(s),'handoffTiming')));
    assert(logs.every(s=>!s.includes(key)&&!s.includes(id)&&!s.includes('location_key=')));
  });
}finally{console.info=info;if(previous===undefined)delete process.env.WIDGY_MAP_FILE_ACCESS_TOKEN;else process.env.WIDGY_MAP_FILE_ACCESS_TOKEN=previous}
console.log(checks+' native server checks passed.');
