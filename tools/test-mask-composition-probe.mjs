import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';
import {compactCalendarDots} from './calendar-compact-dots.js';
import {thinNativeStepsRing} from './native-steps-ring.js';
import {withMaskCompositionProbe} from './mask-composition-probe.js';
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const template=JSON.parse(read('./Widgy_Home_Glass_Calendar_C16.json'));
const full=thinNativeStepsRing(compactCalendarDots(consolidateWidget(personalizedWidget(template,
  'https://example.test/api/calendar-dots?token=synthetic','https://example.test/api/calendar-widget?token=synthetic'))));
const before=structuredClone(full),result=withMaskCompositionProbe(full,'https://example.test');
assert.deepEqual(full,before);assert.deepEqual(result['36'],[]);assert.equal(result['1'].length,1);
const outer=result['1'][0],group=outer['1'][0],base=outer['1'][1],mask=group['1'][0],light=group['1'][1];
assert.equal(outer.s,'Mask Composition Probe');assert.equal(group.s,'Masked Light Group · Plus Lighter');
assert.deepEqual(group.t,{a:[{a:17,b:548,c:0,d:548}],b:0});
assert.deepEqual(mask.t,{a:[{a:1,b:547,c:0,d:547}],b:0});
assert.deepEqual([mask.s,light.s,base.s],['Network Mask · Multiply','Static Gold Light','Static Navy Base']);
assert.deepEqual([mask.d0,light.d0,base.d0],[6170,80408,80309]);
for(const node of [mask,light,base])assert.equal(node['1'],'Web URL');
assert(!/\$\{widgy\.|token=|\/api\//.test(JSON.stringify(result)));
for(const [file,pixels] of [['base-navy.png',[[14,34,58,255]]],['light-gold.png',[[218,151,50,255]]]]){
  const {data,info}=await sharp(fileURLToPath(new URL('../assets/diagnostics/mask-composition-probe/'+file,import.meta.url))).raw().toBuffer({resolveWithObject:true});
  assert.deepEqual([info.width,info.height,info.channels],[640,300,4]);assert.deepEqual([...data.subarray(0,4)],pixels[0]);
}
const {data:gradient,info}=await sharp(fileURLToPath(new URL('../assets/diagnostics/mask-composition-probe/mask-white-to-black.png',import.meta.url))).raw().toBuffer({resolveWithObject:true});
assert.deepEqual([info.width,info.height,info.channels],[640,300,4]);
const pixel=x=>[...gradient.subarray((150*640+x)*4,(150*640+x)*4+4)];
assert.deepEqual(pixel(0),[255,255,255,255]);assert.deepEqual(pixel(639),[0,0,0,255]);
assert(pixel(320)[0]>120 && pixel(320)[0]<135);

const html=read('./widgy-mask-composition-probe.html');
const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],
  {events:{},classList:{toggle(){}},addEventListener(name,fn){this.events[name]=fn;},removeAttribute(name){delete this[name];}}]));
const events={},requests=[];let downloaded,copied,fail=false;
class BrowserURL extends URL{static createObjectURL(blob){downloaded=blob;return 'blob:test';}static revokeObjectURL(){}}
const ctx={document:{getElementById:id=>elements[id]},Blob,URL:BrowserURL,personalizedWidget,consolidateWidget,
  compactCalendarDots,thinNativeStepsRing,withMaskCompositionProbe,
  navigator:{clipboard:{async writeText(v){copied=v;}}},window:{location:{href:'https://example.test/tools/widgy-mask-composition-probe.html'},addEventListener(n,f){events[n]=f;}},
  async fetch(url,options){requests.push([url,options]);return {ok:!fail,async json(){return structuredClone(template);}};}};
vm.runInNewContext(read('./widgy-mask-composition-probe.js').replace(/^import .*;\n/gm,''),ctx);
await new Promise(setImmediate);assert.deepEqual(JSON.parse(await downloaded.text()),result);
await elements.copy.events.click();assert.deepEqual(JSON.parse(copied),result);
fail=true;await elements.retry.events.click();assert.equal(elements.copy.disabled,true);assert.equal(elements.download.href,undefined);
fail=false;events.pageshow({persisted:true});await new Promise(setImmediate);assert.equal(elements.copy.disabled,false);
assert(requests.every(([u,o])=>u==='./Widgy_Home_Glass_Calendar_C16.json'&&o.cache==='no-store'));
assert(html.includes('widgy-mask-composition-probe.js?v=mask-composition-probe-1'));
console.log('PASS: captured Multiply=1 and Plus Lighter=17 applied only to controlled mask/group; 3 exact technical PNG inputs, zero variables/API/private data; copy/error/recovery flows pass. Native output screenshot remains required.');
