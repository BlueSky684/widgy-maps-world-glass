import {createMapURLDiagnostics} from '../lib/map-url-diagnostics.js';
import {createCityReuseCache} from '../lib/city-reuse-cache.js';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import sharp from 'sharp';
import {mapRefreshStamp,REFRESH_STAMP_RECT} from '../lib/map-refresh-stamp.js';
import {renderHomeMap} from '../lib/home-map-day-night.js';
import {createMapRenderCache} from '../lib/map-render-cache.js';
import {parseMapRequest} from '../lib/native-map-request.js';
import {resolveLocation} from '../lib/map-astronomy-location.js';
import {randomUUID} from 'node:crypto';
import {compareMapRequestKeys, readCityTimingTrace} from '../lib/map-request-key-diagnostics.js';
assert.equal(mapRefreshStamp(new Date('2026-10-05T18:38:18Z')),'MAP TIME 2026-10-05 21:38:18 ISRAEL');
assert.equal(mapRefreshStamp(new Date('2026-12-01T18:38:18Z')),'MAP TIME 2026-12-01 20:38:18 ISRAEL');
assert.throws(()=>mapRefreshStamp(new Date('invalid')),/invalid_map_date/);

// Execute the real route with controlled clock/render bytes, retaining real
// cache/parser/resolver. This does not emulate Widgy or make network requests.
let now=Date.parse('2026-10-05T18:00:00Z'),renders=[];
class ControlledDate extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
const ctx={Date:ControlledDate,Buffer,URLSearchParams,createMapURLDiagnostics,createCityReuseCache:()=>createCityReuseCache({now:()=>now}),randomUUID,compareMapRequestKeys,readCityTimingTrace,performance:{now:()=>now},console,
 parseMapRequest,resolveLocation,REVISION:'test',precomputedState:()=> 'test',
 createMapRenderCache:()=>createMapRenderCache({now:()=>now}),
 async renderHomeMap(options){
  renders.push(options);
  return Buffer.from(JSON.stringify({date:options.date.toISOString(),diagnostic:options.diagnostic,
   label:options.diagnostic==='refresh-v1'?mapRefreshStamp(options.date):null}));
 }};
const route=readFileSync(new URL('../api/night-map.js',import.meta.url),'utf8')
 .replace(/^import .*;\n/gm,'').replace('export default async function handler','async function handler');
vm.runInNewContext(route,ctx);
async function request(query='',headers={},method='GET'){
 const res={headers:{},code:null,body:null,
  setHeader(k,v){this.headers[k.toLowerCase()]=v;},
  status(c){this.code=c;return this;},
  send(b){this.body=b;return this;},json(b){this.body=b;return this;},end(){return this;}};
 await ctx.handler({url:'/api/night-map?mode=live&width=3306&presentation=glass&atlas=r6&reuse=60&lat=0&lon=0'+query,headers,method},res);
 return res;
}
const normal=await request(),location=await request('&diagnostic=location'),first=await request('&diagnostic=refresh-v1');
assert.equal(normal.code,200);assert.equal(location.code,200);assert.equal(first.code,200);
assert.deepEqual(renders.map(x=>x.diagnostic),[false,true,'refresh-v1']);
assert.equal(first.headers['x-map-rendered-at'],'2026-10-05T18:00:00.000Z');
assert.equal(JSON.parse(first.body).label,'MAP TIME 2026-10-05 21:00:00 ISRAEL');
const normalAgain=await request('&diagnostic=unknown');assert.equal(normalAgain.headers['x-map-cache'],'HIT');
assert.deepEqual(normalAgain.body,normal.body,'Unknown/absent diagnostic keep previous false cache identity');
now+=10000;
const hit=await request('&diagnostic=refresh-v1');
assert.equal(hit.headers['x-map-cache'],'HIT');assert.deepEqual(hit.body,first.body);
assert.equal(hit.headers.etag,first.headers.etag);
assert.equal(hit.headers['x-map-rendered-at'],first.headers['x-map-rendered-at']);
assert.equal(hit.headers['cache-control'],'private, max-age=50, must-revalidate');
const notModified=await request('&diagnostic=refresh-v1',{'if-none-match':first.headers.etag});
assert.equal(notModified.code,304);assert.equal(notModified.body,null);
now+=51000;
const next=await request('&diagnostic=refresh-v1',{'if-none-match':first.headers.etag});
assert.equal(next.code,200);assert.equal(next.headers['x-map-cache'],'MISS');
assert.notDeepEqual(next.body,first.body);assert.notEqual(next.headers.etag,first.headers.etag);
assert.equal(next.headers['x-map-rendered-at'],'2026-10-05T18:01:01.000Z');
assert.equal(JSON.parse(next.body).label,'MAP TIME 2026-10-05 21:01:01 ISRAEL');
assert.equal(next.headers['cdn-cache-control'],'no-store');
assert.equal(next.headers['vercel-cdn-cache-control'],'no-store');
assert.equal(next.headers['x-map-delivery'],undefined);
const syntheticCDN=await request('&cache=synthetic-60');
assert.equal(syntheticCDN.headers['x-map-delivery'],'synthetic-cdn-60','Existing explicit synthetic CDN remains');
const diagWithFlag=await request('&diagnostic=refresh-v1&cache=synthetic-60');
assert.equal(diagWithFlag.headers['x-map-delivery'],undefined);
assert.equal(diagWithFlag.headers['cdn-cache-control'],'no-store','Diagnostic never publicly cached');
const head=await request('&diagnostic=refresh-v1',{},'HEAD');assert.equal(head.code,200);assert.equal(head.body,null);
const badMethod=await request('&diagnostic=refresh-v1',{},'POST');assert.equal(badMethod.code,405);

// Render actual full-resolution PNGs. Compare unchanged normal behavior against
// the reviewed parent source, and limit diagnostic pixel changes to its rectangle.
const parent='78d3e147a00c624e263e0134767fe871e7889181';
const old=execFileSync('git',['show',parent+':lib/home-map-day-night.js'],{encoding:'utf8'});
const oldResolved=old.replace(/from '([^']+)'/g,(_,specifier)=>{
 const resolved=specifier.startsWith('.')?new URL('../lib/'+specifier,import.meta.url).href:
  specifier.startsWith('node:')?specifier:import.meta.resolve(specifier);
 return "from '"+resolved+"'";
});
const baseline=await import('data:text/javascript;base64,'+Buffer.from(oldResolved).toString('base64'));
const options={date:new Date('2026-10-05T18:38:18Z'),location:{latitude:0,longitude:0,city:'',source:'coordinates'},width:3306,presentation:'glass',atlas:'r6'};
const before=await baseline.renderHomeMap(options),plain=await renderHomeMap(options);
assert.deepEqual(plain,before,'Default renderer remains byte-identical to parent');
const stamped=await renderHomeMap({...options,diagnostic:'refresh-v1'});
const a=await sharp(plain).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const b=await sharp(stamped).ensureAlpha().raw().toBuffer({resolveWithObject:true});
assert.deepEqual(a.info,b.info);assert.equal(b.info.width,3306);assert.equal(b.info.height,1558);
const box=REFRESH_STAMP_RECT;let changed=0;
for(let y=0;y<b.info.height;y++)for(let x=0;x<b.info.width;x++){
 const offset=(y*b.info.width+x)*4;
 if(!a.data.subarray(offset,offset+4).equals(b.data.subarray(offset,offset+4))){
  changed++;assert(x>=box.left&&x<box.left+box.width&&y>=box.top&&y<box.top+box.height,'Unexpected pixels outside stamp strip');
 }
}
assert(changed>10000);
mkdirSync(new URL('../work',import.meta.url),{recursive:true});
writeFileSync(new URL('../work/map-refresh-clock-synthetic.png',import.meta.url),stamped);
console.log('PASS: actual route private cache MISS/HIT/304/expiry; timestamp and ETag cached with PNG; separate diagnostic cache key; old default PNG byte-identical; full-size diagnostic changes only stamp rectangle; Israel DST labels correct. Synthetic image saved for visual check.');
