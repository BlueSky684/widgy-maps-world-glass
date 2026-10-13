// Integration verification with the real compositor, real route and complete
// private export. Does not access the city provider or print private content.
// node tools/verify-weather15-location-split.mjs <original-export> <private-dir>
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash,webcrypto} from 'node:crypto';
import vm from 'node:vm';
import sharp from 'sharp';
import {splitWeather15,widgetLayers,SPLIT_DESCRIPTION} from './weather15-location-split.js';
import {formatJSONLines} from './json-copy-lines.js';
import {renderHomeMap,renderMapLocation} from '../lib/home-map-day-night.js';
import handler from '../api/night-map.js';
import {resolveMapCity} from '../lib/location/map-city.js';

const [sourcePath,privateDir] = process.argv.slice(2);
assert(sourcePath && privateDir);
const source = JSON.parse(readFileSync(sourcePath));
const transformed = JSON.parse(readFileSync(resolve(privateDir,'Widgy_Weather_15.json')));
const oldLayers = [...widgetLayers(source)], newLayers = [...widgetLayers(transformed)];
const additions = newLayers.filter(n => !oldLayers.some(o => o.d0 === n.d0));
assert.equal(additions.length,1);
const extra = additions[0], map = oldLayers.find(n => n.d0===6170);
assert.deepEqual({...extra,d0:map.d0,s:map.s,'2':map['2']},map);
assert.equal(newLayers.filter(n => n.d0===extra.d0).length,1);
assert.equal(transformed['3'],'Widgy Weather 15');
assert.equal(transformed['4'],SPLIT_DESCRIPTION);
const restored = structuredClone(transformed);
const home = [...widgetLayers(restored)].find(n => n.d0===245);
assert.equal(home['1'][home['1'].findIndex(n=>n.d0===6170)-1].d0,extra.d0);
home['1'] = home['1'].filter(n => n.d0!==extra.d0);
const oldRequest = source['36'].find(v=>v['1']==='map_request');
const baseRequest = transformed['36'].find(v=>v['1']==='map_request');
const locationRequest = transformed['36'].find(v=>v['1']==='map_location_request');
const text = v => v['3']['66'][0]['25'];
const baseURL = new URL(text(baseRequest)), locationURL = new URL(text(locationRequest));
assert.equal(baseURL.searchParams.get('layer'),'base');
assert.deepEqual(text(baseRequest).match(/\$\{[^}]+\}/g),['${widgy.calendar_refresh_minute}']);
assert(!baseURL.searchParams.has('location_key') && !baseURL.searchParams.has('shared_location'));
assert.equal(baseURL.searchParams.get('lat'),''); assert.equal(baseURL.searchParams.get('lon'),'');
assert.equal(locationURL.searchParams.get('layer'),'location');
assert.equal(locationURL.searchParams.get('location_key'),new URL(text(oldRequest)).searchParams.get('location_key'));
assert.deepEqual(text(locationRequest).match(/\$\{[^}]+\}/g),text(oldRequest).match(/\$\{[^}]+\}/g));
assert.equal(baseURL.searchParams.get('width'),'3306'); assert.equal(locationURL.searchParams.get('width'),'3306');
restored['36'] = restored['36'].filter(v=>v['1']!=='map_location_request');
restored['36'][restored['36'].findIndex(v=>v['1']==='map_request')] = structuredClone(oldRequest);
restored['4'] = source['4'];
assert.deepEqual(restored,source,'An unrelated widget field changed');
assert.throws(()=>splitWeather15(transformed));

const output = resolve(privateDir,'verification'); mkdirSync(output,{recursive:true});
const at='2026-10-13T13:10:54Z', date=new Date(at), width=3306, presentation='glass', atlas='r6';
const location={latitude:31.8,longitude:34.6,city:'Ashdod',source:'coordinates'};
const base = await renderHomeMap({date,width,presentation,atlas});
const overlay = await renderMapLocation({location,width,presentation});
const whole = await renderHomeMap({date,width,presentation,atlas,location});
const combined = await sharp(base).composite([{input:overlay}]).png().toBuffer();
const decoded = async b => sharp(b).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const b = await decoded(base), o = await decoded(overlay), w = await decoded(whole), c = await decoded(combined);
assert.equal(o.info.width,width); assert.equal(o.info.height,1558);
const icc = (await sharp(base).metadata()).icc;
assert(icc?.equals((await sharp(overlay).metadata()).icc));
let visible=0, altered=0, outside=0, sum=0, maximum=0;
let minX=width,minY=1558,maxX=0,maxY=0;
for(let p=0;p<o.data.length;p+=4) {
  const x=p/4%width,y=Math.floor(p/4/width);
  if(o.data[p+3]) {visible++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
  let differs=false;
  for(let ch=0;ch<4;ch++) {const d=Math.abs(c.data[p+ch]-w.data[p+ch]);sum+=d;maximum=Math.max(maximum,d);if(d) differs=true;}
  if(differs) altered++;
  // All visual differences must be local to the existing location graphics.
  if((x<1860||x>2540||y<456||y>694)&&!c.data.subarray(p,p+4).equals(w.data.subarray(p,p+4))) outside++;
}
assert(visible>0 && visible < width*1558*.02,'Overlay must be mostly transparent');
assert.equal(outside,0,'Map pixels changed outside the location');
assert(sum/o.data.length < .1,'Unexpected compositing difference');
for(const [name,bytes] of Object.entries({base,overlay,whole,combined}))writeFileSync(resolve(output,name+'.png'),bytes);
const absent = await decoded(await renderMapLocation({width,presentation}));
assert(!absent.data.some((v,i)=>i%4===3&&v),'Missing location must produce transparency');
for(const edge of [{latitude:85,longitude:-180,city:'West'}, {latitude:-61,longitude:180,city:'East'}, {latitude:90,longitude:0,city:'Outside'}]) {
  const edgePNG=await renderMapLocation({width,presentation,location:edge});
  assert.equal((await sharp(edgePNG).metadata()).width,width);
}

const originalInfo=console.info;
console.info=()=>{};
let routeChecks=0;
async function request(query,headers={}) {
  const res={headers:{},statusCode:200,setHeader(k,v){this.headers[k]=v;},status(n){this.statusCode=n;return this;},send(b){this.body=b;return this;},json(b){this.body=b;return this;},end(){return this;}};
  await handler({url:'/api/night-map?'+new URLSearchParams(query),method:'GET',headers},res);
  routeChecks++;return res;
}
const token='synthetic-location-verification-token-20261013';
const previousToken=process.env.WIDGY_LOCATION_ACCESS_TOKEN, previousProvider=process.env.BIGDATACLOUD_API_KEY;
process.env.WIDGY_LOCATION_ACCESS_TOKEN=token; delete process.env.BIGDATACLOUD_API_KEY;
try {
  const params={width:String(width),presentation,atlas,at,lat:'',lon:''};
  const clean=await request({...params,layer:'base'});
  assert.equal(clean.statusCode,200);assert(clean.body.equals(base));
  const dirty=await request({...params,layer:'base',shared_location:'1',location_key:'wrong',lat:'not-gps',lon:'undefined',city:'Invalid'}, {'x-vercel-ip-latitude':'52','x-vercel-ip-longitude':'13','x-vercel-ip-city':'Ignored'});
  assert.equal(dirty.statusCode,200);assert(dirty.body.equals(base));assert(!dirty.headers['X-Location-Cache']);
  const original=await request({...params,lat:'31.8',lon:'34.6',city:'Ashdod'});
  assert(original.body.equals(whole),'Legacy route pixels changed');
  const loc=await request({...params,layer:'location',lat:'31.8',lon:'34.6',city:'Ashdod'});
  assert(loc.body.equals(overlay));
  const denied=await request({...params,layer:'location',shared_location:'1',location_key:'wrong',lat:'31.8',lon:'34.6'});
  assert.equal(denied.statusCode,403);
  const invalid=await request({...params,layer:'location',shared_location:'1',location_key:token,lat:'not-gps',lon:'34.6'});
  assert.equal(invalid.statusCode,400);
  const fallback=await request({...params,layer:'location',shared_location:'1',location_key:token,lat:'31.8',lon:'34.6',city:'Untrusted'});
  assert.equal(fallback.statusCode,200);assert.equal(fallback.headers['X-Location-Cache'],'UNAVAILABLE');
  assert(fallback.body.equals(await renderMapLocation({width,presentation,location:{...location,city:''}})));
  assert.equal((await request({...params,layer:'unknown'})).statusCode,400);
  const live={...params,reuse:'60',lat:'31.8',lon:'34.6',city:'Ashdod'};delete live.at;
  const liveWhole=await request(live), liveLocation=await request({...live,layer:'location'});
  assert.notEqual(liveWhole.headers.ETag,liveLocation.headers.ETag);
  assert.equal(liveLocation.headers['X-Map-Cache'],'MISS');
  const hit=await request({...live,layer:'location'});
  assert.equal(hit.headers['X-Map-Cache'],'HIT');assert(hit.body.equals(liveLocation.body));
  const conditional=await request({...live,layer:'location'},{'if-none-match':liveLocation.headers.ETag});
  assert.equal(conditional.statusCode,304);
  const cityTimeout=await resolveMapCity(location,{lookup:()=>new Promise(()=>{}),deadlineMs:5,defer:()=>{}});
  assert.equal(cityTimeout.state,'TIMEOUT');
} finally {
  console.info=originalInfo;
  if(previousToken===undefined)delete process.env.WIDGY_LOCATION_ACCESS_TOKEN;else process.env.WIDGY_LOCATION_ACCESS_TOKEN=previousToken;
  if(previousProvider===undefined)delete process.env.BIGDATACLOUD_API_KEY;else process.env.BIGDATACLOUD_API_KEY=previousProvider;
}

// Execute the shipped copy controller with WebCrypto/gzip and the real sealed
// payload, then exercise its copy event. No clipboard/device success is assumed.
const controller=readFileSync(new URL('./widgy-weather15-location-split-copy.js',import.meta.url),'utf8').replace(/^import .*;\n/,'');
const envelope=JSON.parse(readFileSync(new URL('./widgy-weather15-location-split.enc.json',import.meta.url)));
async function copyCheck(key,valid) {
  const elements=Object.fromEntries(['copy','status','manual','text','multiline','select'].map(id=>[id,{disabled:true,checked:id==='multiline',hidden:true,classList:{toggle(){}},handlers:{},addEventListener(k,f){this.handlers[k]=f;}}]));
  let copied=null,requested=0;
  const context={document:{getElementById:id=>elements[id]},location:{hash:'#key='+key},crypto:webcrypto,TextEncoder,TextDecoder,Response,Blob,DecompressionStream,URLSearchParams,Uint8Array,atob,formatJSONLines,navigator:{clipboard:{writeText:async value=>{copied=value;}}},fetch:async (url,opts)=>{assert.equal(url,'./widgy-weather15-location-split.enc.json?v=1');assert.equal(opts.credentials,'omit');requested++;return {ok:true,json:async()=>envelope};}};
  await vm.runInNewContext(controller.replace(/load\(\);\s*$/,'load();'),context);
  if(!valid){assert.equal(elements.copy.disabled,true);return;}
  assert.equal(requested,1);assert.equal(elements.copy.disabled,false);
  await elements.copy.handlers.click();
  assert.deepEqual(JSON.parse(copied),transformed);assert(copied.includes('\n'));
}
await copyCheck(readFileSync(resolve(privateDir,'copy-key.txt'),'utf8'),true);
await copyCheck('invalid',false);
await copyCheck('A'.repeat(43),false);
const report={widget:{layers:newLayers.length,variables:transformed['36'].length,unrelatedFieldsIdentical:true,baseHasNoLocationDependency:true},images:{width,height:1558,basePNGBytes:base.length,overlayPNGBytes:overlay.length,combinedDecodedRGBABytes:2*width*1558*4,overlayVisiblePixels:visible,overlayBounds:[minX,minY,maxX,maxY],compositeDifferentPixels:altered,compositeMaximumChannelDifference:maximum,compositeMeanChannelDifference:sum/o.data.length,differencesOutsideLocation:outside,iccSHA256:createHash('sha256').update(icc).digest('hex')},routeChecks,copyController:'decrypt/verify/multiline/copy/invalid-key passed',phoneVerification:'pending'};
writeFileSync(resolve(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
