import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync, copyFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import vm from 'node:vm';
import {createMapRenderCache} from '../lib/map-render-cache.js';
import {buildCityMapScript} from './widgy-city-map-script.mjs';

const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const base = read('./Widgy_Home_Glass_Calendar_C5.json'), w = read('./Widgy_Home_Glass_Calendar_C6.json');
const map = w['36'].find(n => n['1'] === 'map_request');
assert.deepEqual(w['1'], base['1']);
assert.deepEqual(w['36'].filter(n => n['1'] !== 'map_request'), base['36'].filter(n => n['1'] !== 'map_request'));
const restored = structuredClone(w);
restored['3'] = base['3']; restored['4'] = base['4'];
restored['36'].find(n => n['1'] === 'map_request')['3']['66'] = base['36'].find(n => n['1'] === 'map_request')['3']['66'];
assert.deepEqual(restored, base);
const script = map['3']['66'][0]['10'];
const RealDate = Date;
let clock = Date.UTC(2026, 9, 2, 12, 0, 10);
class FixedDate extends RealDate {
  constructor(...args) { super(...(args.length ? args : [clock])); }
  static now() { return clock; }
}
async function mapURL(source, {lat='0', lon='0', city='Test & City', fail=false}={}) {
  let calls=0, completed=0;
  const replaced = source.replaceAll('${widgy.map_latitude_max5}', lat).replaceAll('${widgy.map_longitude_max5}', lon);
  const url = await new Promise((resolve, reject) => {
    vm.runInNewContext(replaced, {Date: FixedDate, sendToWidgy(v) { completed++; resolve(v); }, fetch(url) {
      calls++; assert(url.startsWith('https://api.bigdatacloud.net/data/reverse-geocode-client?'));
      if (fail) return Promise.reject(new Error('Simulated offline'));
      return Promise.resolve({ok:true, json:async()=>({latitude:lat, longitude:lon, city, lookupSource:'coordinates'})});
    }}, {timeout:1000});
  });
  await Promise.resolve();
  assert.equal(completed,1);
  assert.equal(calls, lat==='unavailable' ? 0 : 1);
  return new URL(url);
}
const first = await mapURL(script); clock+=12000;
assert.equal((await mapURL(script)).href, first.href);
assert.equal(first.searchParams.get('reuse'),'60');
assert.equal(first.searchParams.get('width'),'3306');
assert.equal(first.searchParams.get('city'),'Test & City');
assert.equal(first.searchParams.get('lat'),'0');
assert.notEqual((await mapURL(script,{lat:'0.00001'})).href,first.href);
assert.notEqual((await mapURL(script,{city:'Other City'})).href,first.href);
clock+=60000;
assert.notEqual((await mapURL(script)).href,first.href);
assert.equal((await mapURL(script,{fail:true})).searchParams.has('city'),false);
assert.equal((await mapURL(script,{lat:'unavailable'})).searchParams.get('lat'),'');
const legacy = buildCityMapScript('https://example.com/api/night-map?mode=live',{enabled:true});
const legacyFirst = await mapURL(legacy); clock++;
assert.notEqual((await mapURL(legacy)).href,legacyFirst.href);
assert.equal(legacyFirst.searchParams.has('reuse'),false);

let ticks=0, renders=0;
const cache = createMapRenderCache({now:()=>ticks,maxEntries:2,maxBytes:6});
const options = () => ({expiresAt:60,renderedAt:'test',render:async()=>{renders++;return Buffer.from('abc');}});
const miss=await cache('a',options());assert.equal(miss.state,'MISS');
assert.strictEqual((await cache('a',options())).entry,miss.entry);assert.equal(renders,1);
await cache('b',options());await cache('a',options());await cache('c',options());
assert.equal((await cache('b',options())).state,'MISS'); // LRU eviction
ticks=60;assert.equal((await cache('b',{...options(),expiresAt:120})).state,'MISS');
let release;
const slow = cache('slow',{...options(),expiresAt:120,render:()=>new Promise(r=>{release=r;})});
const concurrent=cache('slow',{...options(),expiresAt:120});
release(Buffer.from('abc'));
assert.equal((await slow).state,'MISS');assert.equal((await concurrent).state,'COALESCED');
await assert.rejects(cache('error',{...options(),render:async()=>{throw Error('render failed');}}));
assert.equal((await cache('error',{...options(),expiresAt:120})).state,'MISS');
const oversized={...options(),expiresAt:120,render:async()=>Buffer.alloc(7)};
await cache('large',oversized);assert.equal((await cache('large',oversized)).state,'MISS');
ticks=119;
await cache('expired-during-render',{...options(),expiresAt:120,render:async()=>{ticks=121;return Buffer.from('abc');}});
assert.equal((await cache('expired-during-render',{...options(),expiresAt:180})).state,'MISS');

// Exercise the real route/cache/parser together. Only the costly image renderer
// is replaced; no network, client geocoder, or personal location is contacted.
const dir=mkdtempSync(join(tmpdir(),'widgy-c6-'));
try {
  mkdirSync(join(dir,'api'));mkdirSync(join(dir,'lib'));
  writeFileSync(join(dir,'package.json'),' {"type":"module"}');
  for(const p of ['api/night-map.js','lib/map-render-cache.js','lib/native-map-request.js']) copyFileSync(new URL('../'+p,import.meta.url),join(dir,p));
  writeFileSync(join(dir,'lib/home-map-day-night.js'), `
export const REVISION='test';
export let count=0;
export async function renderHomeMap(options){count++;return Buffer.from(JSON.stringify(options));}
export function resolveLocation(url,headers){
 const explicit=url.searchParams.has('lat')||url.searchParams.has('lon');
 const lat=explicit?url.searchParams.get('lat'):headers['x-vercel-ip-latitude'];
 const lon=explicit?url.searchParams.get('lon'):headers['x-vercel-ip-longitude'];
 if(lat===''||lon===''||lat==null||lon==null)return null;
 return {latitude:Number(lat),longitude:Number(lon),city:url.searchParams.get('city')||'',source:explicit?'coordinates':'ip-approximate'};
}`);
  globalThis.Date=FixedDate;
  clock=Date.UTC(2026,9,2,12,0,10);
  const {default:handler}=await import(pathToFileURL(join(dir,'api/night-map.js')));
  const renderer=await import(pathToFileURL(join(dir,'lib/home-map-day-night.js')));
  async function request(query,headers={},method='GET') {
    const out={headers:{},code:200,body:undefined,setHeader(k,v){this.headers[k]=v;},status(v){this.code=v;return this;},send(v){this.body=v;return this;},json(v){this.body=v;return this;},end(){return this;}};
    await handler({url:'/api/night-map?'+query,headers,method},out);return out;
  }
  const query='lat=0&lon=0&city=Test&atlas=r6&presentation=glass&width=3306&reuse=60';
  const a=await request(query);assert.equal(a.headers['X-Map-Cache'],'MISS');
  clock+=5000;
  const b=await request(query+'&t=anything');assert.equal(b.headers['X-Map-Cache'],'HIT');assert.deepEqual(b.body,a.body);
  assert.equal(b.headers['X-Map-Rendered-At'],a.headers['X-Map-Rendered-At']);
  assert.equal(b.headers['Cache-Control'],'private, max-age=45, must-revalidate');
  assert.equal(b.headers['CDN-Cache-Control'],'no-store');assert.equal(b.headers['Vercel-CDN-Cache-Control'],'no-store');
  assert.equal(renderer.count,1);
  const unchanged=await request(query,{'if-none-match':'W/'+a.headers.ETag});assert.equal(unchanged.code,304);assert.equal(unchanged.body,undefined);
  const head=await request(query,{},'HEAD');assert.equal(head.code,200);assert.equal(head.body,undefined);assert.equal(renderer.count,1);
  for (const [field,value] of [['lat','0.00001'],['lon','0.00001'],['city','Other'],['atlas','f50'],['width','1653'],['presentation','default'],['diagnostic','location']]) {
    const params=new URLSearchParams(query);params.set(field,value);
    assert.equal((await request(params.toString())).headers['X-Map-Cache'],'MISS',field);
  }
  clock+=60000;assert.equal((await request(query)).headers['X-Map-Cache'],'MISS');
  assert.equal((await request('lat=0&lon=0')).headers['Cache-Control'],'private, no-store, max-age=0');
  assert.equal((await request('reuse=60',{'x-vercel-ip-latitude':'1','x-vercel-ip-longitude':'2'})).headers['X-Map-Cache'],'BYPASS');
  assert.equal((await request(query+'&at=2026-10-02T12:00:00Z')).headers['X-Map-Cache'],'BYPASS');
  assert.equal((await request(query+'&at=bad')).code,400);
  assert.equal((await request(query.replace('width=3306','width=1'))).code,400);
  assert.equal((await request(query,{},'POST')).code,405);
} finally {globalThis.Date=RealDate;rmSync(dir,{recursive:true,force:true});}
const html=n=>readFileSync(new URL('./widgy-home-calendar-'+n+'.html',import.meta.url),'utf8').split('<script>')[1];
assert.equal(html('c6').replaceAll('C6','C5'),html('c5'));
console.log(JSON.stringify({passed:true,nativeWidgetUnchanged:true,copyFlowUnchanged:true,simulatedClientOnly:true,minuteReuse:true,preciseLocationKeys:true,cacheExpiryAndBounds:true,routeHeadersAndRevalidation:true,requiresDeviceTiming:true}));
