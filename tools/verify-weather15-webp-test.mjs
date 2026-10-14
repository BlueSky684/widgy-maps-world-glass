// Real encoder/route and encrypted copy-controller verification. Synthetic
// image locations only; private widget URLs are never fetched or printed.
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash, webcrypto} from 'node:crypto';
import vm from 'node:vm';
import sharp from 'sharp';
import exactSharp from 'sharp-webp-exact';
import {encodeMapWebP} from '../lib/map-webp-exact.js';
import {renderHomeMap} from '../lib/home-map-day-night.js';
import handler from '../api/night-map.js';
import {formatJSONLines} from './json-copy-lines.js';
import {widgetLayers} from './weather15-location-split.js';

const [fixtureDir, originalPath, privateDir] = process.argv.slice(2);
assert(fixtureDir && originalPath && privateDir);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
async function exact(png, webp) {
  const p = await sharp(png).metadata(), w = await sharp(webp).metadata();
  assert.equal(w.format, 'webp'); assert.equal(w.width, p.width); assert.equal(w.height, p.height);
  assert.deepEqual(w.icc, p.icc);
  assert((await sharp(png).ensureAlpha().raw().toBuffer()).equals(await sharp(webp).ensureAlpha().raw().toBuffer()));
}
assert.equal(sharp.versions.sharp, '0.34.5');
assert.equal(exactSharp.versions.sharp, '0.35.5');
const fixtures = JSON.parse(readFileSync(resolve(fixtureDir,'fixtures.json'))), images=[];
for (const fixture of fixtures) {
  const png = readFileSync(resolve(fixtureDir,fixture.name+'.png'));
  assert.equal(sha(png), fixture.sha256);
  // Loading the new encoder alongside the old renderer must not alter PNGs.
  const freshlyRendered = await renderHomeMap({date:new Date(fixture.instant), location:fixture.location,
    width:3306, presentation:'glass', atlas:'r6'});
  assert(freshlyRendered.equals(png), 'Existing renderer PNG bytes changed');
  const start=performance.now(), webp=await encodeMapWebP(png), encodeMs=performance.now()-start;
  await exact(png,webp);
  images.push({fixture:fixture.name, pngBytes:png.length, webpBytes:webp.length,
    encodeMs:Math.round(encodeMs), rawRGBAIdentical:true, iccIdentical:true, pngBytesUnchanged:true,
    webpSHA256:sha(webp)});
}
// Explicit invisible-color and partial-alpha coverage beyond the map fixtures.
const pixels=Buffer.from([93,51,212,0, 13,71,219,1, 22,103,53,128, 241,38,86,255]);
const alphaPNG=await sharp(pixels,{raw:{width:4,height:1,channels:4}}).png().toBuffer();
await exact(alphaPNG,await encodeMapWebP(alphaPNG));

const source=JSON.parse(readFileSync(originalPath));
const widget=JSON.parse(readFileSync(resolve(privateDir,'Widgy_Weather_15_WebP_Test.json')));
const restored=structuredClone(widget), text=w=>w['36'].find(v=>v['1']==='map_request')['3']['66'][0];
assert.equal(text(widget)['25'],text(source)['25']+'&format=webp-exact-v1');
restored['3']=source['3']; text(restored)['25']=text(source)['25'];
assert.deepEqual(restored,source); assert.equal([...widgetLayers(widget)].length,1204);
assert.equal(widget['36'].length,74);

const info=console.info, error=console.error, logs=[];
console.info=line=>logs.push(JSON.parse(line)); console.error=()=>{};
const previousToken=process.env.WIDGY_LOCATION_ACCESS_TOKEN, previousProvider=process.env.BIGDATACLOUD_API_KEY;
process.env.WIDGY_LOCATION_ACCESS_TOKEN='synthetic-webp-verification-server-token';
delete process.env.BIGDATACLOUD_API_KEY;
let routeChecks=0;
async function request(query,headers={},method='GET') {
  const res={headers:{},statusCode:200,setHeader(k,v){this.headers[k]=v;},status(n){this.statusCode=n;return this;},
    send(b){this.body=b;return this;},json(b){this.body=b;return this;},end(){return this;}};
  await handler({url:'/api/night-map?'+new URLSearchParams(query),method,headers},res);
  routeChecks++; return res;
}
try {
  const q={width:'3306',presentation:'glass',atlas:'r6',at:fixtures[0].instant,lat:'31.8',lon:'34.6',city:'Ashdod'};
  const png=await request(q), webp=await request({...q,format:'webp-exact-v1'});
  assert.equal(png.statusCode,200); assert.equal(webp.statusCode,200);
  assert.equal(png.headers['Content-Type'],'image/png'); assert.equal(webp.headers['Content-Type'],'image/webp');
  assert.equal(webp.headers['X-Map-Width'],'3306');
  assert.equal(webp.headers['X-Map-Time-Mode'],'fixed-test'); await exact(png.body,webp.body);
  const changedTime=await request({...q,format:'webp-exact-v1',at:'2026-10-14T12:00:00Z'});
  const changedLocation=await request({...q,format:'webp-exact-v1',lat:'35.7',lon:'139.7',city:'Tokyo'});
  assert(!changedTime.body.equals(webp.body)); assert(!changedLocation.body.equals(webp.body));
  const live={...q,reuse:'60'}; delete live.at;
  const p=await request(live), w=await request({...live,format:'webp-exact-v1'});
  assert.equal(p.headers['X-Map-Cache'],'MISS'); assert.equal(w.headers['X-Map-Cache'],'MISS');
  assert.notEqual(p.headers.ETag,w.headers.ETag);
  const hit=await request({...live,format:'webp-exact-v1'});
  assert.equal(hit.headers['X-Map-Cache'],'HIT'); assert(hit.body.equals(w.body));
  assert.equal(hit.headers['X-Map-Rendered-At'],w.headers['X-Map-Rendered-At']);
  assert.equal(hit.headers['X-Map-Time-Mode'],'server-now');
  for (const key of ['CDN-Cache-Control','Vercel-CDN-Cache-Control']) assert.equal(hit.headers[key],'no-store');
  assert.match(hit.headers['Cache-Control'],/^private, max-age=\d+, must-revalidate$/);
  const conditional=await request({...live,format:'webp-exact-v1'},{'if-none-match':w.headers.ETag});
  assert.equal(conditional.statusCode,304); assert.equal(conditional.body,undefined);
  const wrongFormatTag=await request({...live,format:'webp-exact-v1'},{'if-none-match':p.headers.ETag});
  assert.equal(wrongFormatTag.statusCode,200); assert(wrongFormatTag.body.equals(w.body));
  const head=await request({...live,format:'webp-exact-v1'}, {}, 'HEAD');
  assert.equal(head.statusCode,200); assert.equal(head.body,undefined); assert.equal(head.headers['Content-Type'],'image/webp');
  const denied=await request({...q,format:'webp-exact-v1',shared_location:'1',location_key:'synthetic-invalid-token'});
  assert.equal(denied.statusCode,403);
  const authorized=await request({...q,format:'webp-exact-v1',shared_location:'1',location_key:process.env.WIDGY_LOCATION_ACCESS_TOKEN});
  assert.equal(authorized.statusCode,200); assert.equal(authorized.headers['Content-Type'],'image/webp');
  assert.equal(authorized.headers['X-Location-Cache'],'UNAVAILABLE');
  assert.equal((await request({...q,format:'webp-exact-v1'}, {}, 'POST')).statusCode,405);
  assert.equal((await request({...q,format:'webp-exact-v1',at:'invalid'})).statusCode,400);
  assert.equal((await request({...q,format:'webp-exact-v1',width:'99'})).statusCode,400);
  const serialized=JSON.stringify(logs);
  for (const forbidden of ['synthetic-invalid-token','Ashdod','Tokyo','location_key=']) assert(!serialized.includes(forbidden));
} finally {
  console.info=info;console.error=error;
  if(previousToken===undefined) delete process.env.WIDGY_LOCATION_ACCESS_TOKEN; else process.env.WIDGY_LOCATION_ACCESS_TOKEN=previousToken;
  if(previousProvider===undefined) delete process.env.BIGDATACLOUD_API_KEY; else process.env.BIGDATACLOUD_API_KEY=previousProvider;
}

// Exercise the actual encrypted controller: valid copy, invalid key, corrupted data.
const controller=readFileSync(new URL('./widgy-weather15-webp-test-copy.js',import.meta.url),'utf8').replace(/^import .*;\n/,'');
const envelope=JSON.parse(readFileSync(new URL('./widgy-weather15-webp-test.enc.json',import.meta.url)));
async function copyCheck(key,valid,body=envelope) {
  const nodes=Object.fromEntries(['copy','download','status','manual','text','multiline','select'].map(id=>[id,
    {disabled:true,checked:id==='multiline',hidden:true,classList:{toggle(){}},handlers:{},addEventListener(k,f){this.handlers[k]=f;}}]));
  let copied=null;
  const ctx={document:{getElementById:id=>nodes[id]},location:{hash:'#key='+key},crypto:webcrypto,TextEncoder,TextDecoder,
    Response,Blob,DecompressionStream,URLSearchParams,Uint8Array,atob,formatJSONLines,
    navigator:{clipboard:{writeText:async value=>{copied=value;}}},
    fetch:async (url,options)=>{assert.equal(url,'./widgy-weather15-webp-test.enc.json?v=1');assert.equal(options.credentials,'omit');return {ok:true,json:async()=>body};}};
  await vm.runInNewContext(controller,ctx);
  assert.equal(nodes.copy.disabled,!valid);
  if(valid){await nodes.copy.handlers.click();assert.deepEqual(JSON.parse(copied),widget);assert(copied.includes('\n'));}
}
const key=readFileSync(resolve(privateDir,'copy-key.txt'),'utf8');
await copyCheck(key,true); await copyCheck('invalid',false); await copyCheck('A'.repeat(43),false);
await copyCheck(key,false,{...envelope,sha256:'0'.repeat(64)});
const report={date:'2026-10-14',rendererSharp:sharp.versions.sharp,encoderSharp:exactSharp.versions.sharp,
  images,transparentRGBPreserved:true,routeChecks,dynamicTimeAndLocation:true,pngAndWebPCachesIsolated:true,
  privateCachingPreserved:true,conditionalAndHeadPassed:true,authenticationStillRequired:true,
  widget:{layers:1204,variables:74,onlyNameAndFormatChanged:true},
  copyController:'decrypt/integrity/multiline/copy/invalid-key/corrupt-envelope passed',
  nativeWidgyVerified:false,deployed:false,timingScope:'local Node encoder only, not iPhone or network'};
writeFileSync(new URL('./weather15-webp-test-verification-20261014.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
