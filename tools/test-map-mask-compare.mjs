import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import sharp from 'sharp';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';
import {compactCalendarDots} from './calendar-compact-dots.js';
import {thinNativeStepsRing} from './native-steps-ring.js';
import {withMapFiveMinuteURL} from './map-five-minute-url.js';
import {withMapMaskCompare} from './map-mask-compare.js';
import {renderPixels} from '../lib/home-map-day-night.js';
import {solarMask} from '../lib/map-solar-mask.js';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const template=JSON.parse(read('./Widgy_Home_Glass_Calendar_C16.json'));
const full=thinNativeStepsRing(compactCalendarDots(consolidateWidget(personalizedWidget(template,
  'https://example.test/api/calendar-dots?token=synthetic','https://example.test/api/calendar-widget?token=synthetic'))));
const before=structuredClone(full),control=withMapFiveMinuteURL(full,'https://example.test');
const result=withMapMaskCompare(full,'https://example.test');
assert.deepEqual(full,before);assert.deepEqual(result['36'],[]);
const [home,calendar]=result['1'];assert.equal(home.d0,245);assert.equal(calendar.d0,247);
assert.equal(home.a,true);assert.equal(calendar.a,false);
const flatten=nodes=>nodes.flatMap(n=>[n,...(Array.isArray(n['1'])?flatten(n['1']):[])]);
const nodes=flatten(result['1']),ids=nodes.map(n=>n.d0);
assert.equal(new Set(ids).size,ids.length,'No duplicated layer IDs');
const imageNodes=nodes.filter(n=>n.z==='5');assert.equal(imageNodes.length,5);
const oldImage=flatten(control['1']).find(n=>n.d0===6170);
for(const n of imageNodes){
  assert.equal(n['1'],'Web URL');assert.equal(n['3'],true);
  for(const k of ['b','c','d','e'])assert.deepEqual(n[k],oldImage[k],'Map/masks share the exact inherited frame');
  assert(n['2'].startsWith('https://example.test/assets/diagnostics/map-mask-compare-1/'));
}
for(const group of [home,calendar]){
  const oldGroup=control['1'].find(n=>n.d0===group.d0);
  assert.deepEqual(group['1'].filter(n=>n.z==='11'),oldGroup['1'].filter(n=>n.z==='11'),'No reload or altered tab navigation');
}
const day=nodes.find(n=>n.d0===84010),night=nodes.find(n=>n.d0===84020);
assert(!day.t);assert.deepEqual(night.t,{a:[{a:17,b:548,c:0,d:548}],b:0});
for(const g of [day,night]){
  assert.deepEqual(g['1'][0].t,{a:[{a:1,b:547,c:0,d:547}],b:0});
  assert(g['1'][0]['2'].includes('/mask-'));assert(!g['1'][1].t);
}
assert(home['1'].indexOf(night)<home['1'].indexOf(day),'Night sum above masked day');
assert(!/\$\{widgy\.|token=|\/api\//.test(JSON.stringify(result)));
const texts=nodes.flatMap(n=>n['66']||[]).map(d=>d['25']);
assert.equal(texts.filter(t=>t==='MASK').length,2);assert.equal(texts.filter(t=>t==='ORIGINAL').length,2);

const dir=new URL('../assets/diagnostics/map-mask-compare-1/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('manifest.json',dir)));
const decoded={};
for(const [file,spec] of Object.entries(manifest.files)){
  const bytes=readFileSync(new URL(file,dir));
  assert.equal(bytes.length,spec.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),spec.sha256);
  const pipeline=sharp(bytes),meta=await pipeline.metadata();assert(meta.icc?.length>0,'Explicit image color profile');
  assert.deepEqual([meta.width,meta.height],[spec.width,spec.height]);
  decoded[file]=await pipeline.removeAlpha().raw().toBuffer();
}
assert(decoded['reference.png'].equals(renderPixels(new Date(manifest.at),'r6').data));
const mask=solarMask(new Date(manifest.at),522,246);
for(let p=0;p<mask.night.length;p++)for(let c=0;c<3;c++){
  assert.equal(decoded['mask-day.png'][p*3+c],mask.day[p]);
  assert.equal(decoded['mask-night.png'][p*3+c],mask.night[p]);
  assert.equal(mask.night[p]+mask.day[p],255);
}
assert.equal(522/246,3306/1558);
assert.throws(()=>solarMask(new Date('bad'),522,246));assert.throws(()=>solarMask(new Date(),0,1));

// Exercise the actual import/copy controller with its only permitted request.
const html=read('./widgy-map-mask-compare.html');
const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],
  {events:{},classList:{toggle(){}},addEventListener(n,f){this.events[n]=f;},removeAttribute(n){delete this[n];}}]));
const events={},requests=[];let downloaded,copied,fail=false;
class BrowserURL extends URL{static createObjectURL(blob){downloaded=blob;return 'blob:test';}static revokeObjectURL(){}}
const ctx={document:{getElementById:id=>elements[id]},Blob,URL:BrowserURL,personalizedWidget,consolidateWidget,
  compactCalendarDots,thinNativeStepsRing,withMapMaskCompare,
  navigator:{clipboard:{async writeText(v){copied=v;}}},window:{location:{href:'https://example.test/tools/widgy-map-mask-compare.html'},addEventListener(n,f){events[n]=f;}},
  async fetch(url,options){requests.push([url,options]);return {ok:!fail,async json(){return structuredClone(template);}};}};
vm.runInNewContext(read('./widgy-map-mask-compare.js').replace(/^import .*;\n/gm,''),ctx);
await new Promise(setImmediate);assert.deepEqual(JSON.parse(await downloaded.text()),result);
await elements.copy.events.click();assert.deepEqual(JSON.parse(copied),result);
fail=true;await elements.retry.events.click();assert.equal(elements.copy.disabled,true);assert.equal(elements.download.href,undefined);
fail=false;events.pageshow({persisted:true});await new Promise(setImmediate);assert.equal(elements.copy.disabled,false);
assert(requests.every(([u,o])=>u==='./Widgy_Home_Glass_Calendar_C16.json'&&o.cache==='no-store'));
assert(html.includes('widgy-map-mask-compare.js?v=map-mask-compare-1'));
console.log('PASS: fixed-time real-map pair, captured blend modes, shared exact frames and aspect ratios, unchanged navigation, zero private sources; PNG hashes/pixels/profiles and copy/error/retry verified. Native appearance remains for the owner.');
