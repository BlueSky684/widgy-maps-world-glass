import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createLiveMapHandler,minuteAt,liveImageURL,LIVE_MAP_VERSION} from '../lib/widgy-live-map.js';
const response=()=>({headers:{},code:200,body:undefined,setHeader(k,v){this.headers[k.toLowerCase()]=v},status(c){this.code=c;return this},json(v){this.body=v;return this},send(v){this.body=v;return this},end(){return this}});
async function call(handler,url,headers={},method='GET'){const res=response();await handler({url,headers,method},res);return res;}
let now=Date.parse('2026-10-07T19:08:59.999Z'),calls=[];
const render=async opts=>{calls.push(opts);return Buffer.from(opts.date.toISOString())};
const handler=createLiveMapHandler({now:()=>now,render});
const source=await call(handler,'/api/widgy-live-map',{'x-vercel-ip-latitude':'31.8',cookie:'private=example'});
assert.equal(source.body.mapTime,'2026-10-07T19:08:00.000Z');assert.equal(calls.length,0);
assert.equal(source.headers['cache-control'],'no-store, max-age=0');
assert.equal(source.headers['vercel-cdn-cache-control'],'no-store');
const target=source.body.image;
const first=await call(handler,target,{'x-vercel-ip-city':'example'}),second=await call(handler,target);
assert.equal(calls.length,1);assert.equal(first.headers['x-map-cache'],'MISS');assert.equal(second.headers['x-map-cache'],'HIT');
assert.equal(calls[0].location,null);assert.equal(calls[0].width,3306);assert.equal(calls[0].atlas,'r6');
assert.equal(first.headers['cache-control'],'public, max-age=31536000, immutable');
assert.deepEqual(first.body,second.body);
const etag=await call(handler,target,{'if-none-match':'W/'+first.headers.etag});assert.equal(etag.code,304);assert.equal(etag.body,undefined);
const head=await call(handler,target,{},'HEAD');assert.equal(head.code,200);assert.equal(head.body,undefined);
now++;const next=await call(handler,'/api/widgy-live-map');assert.notEqual(next.body.image,target);
assert.equal(next.body.mapTime,'2026-10-07T19:09:00.000Z');
await call(handler,next.body.image);assert.equal(calls.length,2);
const old=await call(handler,target);assert.deepEqual(old.body,first.body);
const boot=await call(handler,'/api/widgy-live-map?view=image');assert.equal(boot.headers['cache-control'],'no-store, max-age=0');assert.equal(boot.headers['x-map-cache'],'HIT');
for(const url of ['?minute=1&v='+LIVE_MAP_VERSION,'?minute=999999999999999999&v='+LIVE_MAP_VERSION,'?minute=2&minute=3','?minute=2&v=no','?lat=31&lon=34','?view=image&city=example','?unexpected=1']){
 const bad=await call(handler,'/api/widgy-live-map'+url);assert.equal(bad.code,400);assert.equal(bad.headers['cdn-cache-control'],'no-store');
}
assert.equal((await call(handler,'/api/widgy-live-map',{},'POST')).code,405);
// Same uncached revision, concurrent requests: one render job in this instance.
let release,count=0;const gate=new Promise(r=>release=r);
const concurrent=createLiveMapHandler({now:()=>now,render:async()=>{count++;await gate;return Buffer.from('PNG')}});
const a=call(concurrent,next.body.image),b=call(concurrent,next.body.image);release();
const [ra,rb]=await Promise.all([a,b]);assert.equal(count,1);assert.deepEqual(ra.body,rb.body);assert.equal(rb.headers['x-map-cache'],'COALESCED');
const failing=createLiveMapHandler({now:()=>now,render:async()=>{throw Error('failure')}});
const fail=await call(failing,next.body.image);assert.equal(fail.code,503);assert.equal(fail.headers['cache-control'],'no-store, max-age=0');
// Metadata stays small and follows UTC, including a date/year boundary.
now=Date.parse('2027-01-01T00:00:01Z');const year=await call(handler,'/api/widgy-live-map');
assert.equal(year.body.mapTime,'2027-01-01T00:00:00.000Z');assert(Buffer.byteLength(JSON.stringify(year.body))<400);
// Export: original approved rectangle, contained entire bitmap under Aspect Fit.
const w=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),flat=ns=>ns.flatMap(n=>[n,...(n.z==='13'?flat(n['1']):[])]);
const map=flat(w['1']).find(n=>n.d0===82316),v=k=>map[k].a[0].a;
const template=JSON.parse(fs.readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url))),approved=flat(template['1']).find(n=>n.d0===6170);
for(const k of ['b','c','d','e'])assert.deepEqual(map[k],approved[k]);
assert.equal(flat(w['1']).length,1289);assert.equal(w['36'].length,40);assert.equal(map['13'][0],'image');
const rect={x:v('b')*1135/1600,y:v('c')*1184/1600,w:v('d')*1135/1600,h:v('e')*1184/1600};
assert(Math.abs(rect.x-22)<.001&&Math.abs(rect.y-154)<.001&&Math.abs(rect.w-1090)<.001&&Math.abs(rect.h-540)<.001);
console.log(JSON.stringify({pass:true,metadataNoRender:true,minuteChange:true,immutablePixels:true,noPersonalInputs:true,cacheHit:true,coalescing:true,headAndEtag:true,errorsNotCached:true,frame:rect,layers:1289,variables:40}));
if(process.argv.includes('--render')){
 const real=(await import('../api/widgy-live-map.js')).default;
 const minute=minuteAt(Date.parse('2026-10-07T19:08:00Z'));
 const t=performance.now(),png=await call(real,liveImageURL(minute));
 assert.equal(png.code,200);assert(Buffer.isBuffer(png.body));
 const sharp=(await import('sharp')).default;
 const metadata=await sharp(png.body).metadata();assert.equal(metadata.width,3306);assert.equal(metadata.height,1558);
 assert(png.body.length<4500000,'Review function response size');
 const renderTime=performance.now()-t,againStart=performance.now(),again=await call(real,liveImageURL(minute));
 assert.equal(again.headers['x-map-cache'],'HIT');assert.deepEqual(png.body,again.body);
 const cacheTime=performance.now()-againStart;
 const {renderHomeMap}=await import('../lib/home-map-day-night.js');
 const reference=await renderHomeMap({date:new Date(minute*60000),location:null,width:3306,presentation:'glass',diagnostic:false,atlas:'r6'});
 assert.deepEqual(png.body,reference,'Approved renderer output changed');
 console.log(JSON.stringify({realRenderer:true,width:metadata.width,height:metadata.height,bytes:png.body.length,firstLocalMs:Math.round(renderTime),cacheLocalMs:Math.round(cacheTime),nativeLatency:'unmeasured',pixels:'exact approved renderer'}));
 const {renderWidgyLiveMap}=await import('../lib/render-widgy-live-map.js');
 const opts={date:new Date('2026-12-21T00:00:00Z'),location:null,width:3306,presentation:'glass',diagnostic:false,atlas:'r6'};
 const large=await renderHomeMap(opts),small=await renderWidgyLiveMap(opts);
 assert(large.length>4500000);assert(small.length<4500000);
 const [pa,pb]=await Promise.all([sharp(large).raw().toBuffer(),sharp(small).raw().toBuffer()]);assert.deepEqual(pa,pb);
 const [ma,mb]=await Promise.all([sharp(large).metadata(),sharp(small).metadata()]);
 for(const k of ['width','height','space','channels','depth'])assert.equal(ma[k],mb[k]);assert.deepEqual(ma.icc,mb.icc);
 console.log(JSON.stringify({losslessFallback:true,before:large.length,after:small.length,profileAndPixelsEqual:true}));

}
