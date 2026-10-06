import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';
import {compactCalendarDots} from './calendar-compact-dots.js';
import {thinNativeStepsRing} from './native-steps-ring.js';
import {withMapFiveMinuteURL} from './map-five-minute-url.js';
import {withMaskBlendProbe} from './mask-blend-probe.js';
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const template=JSON.parse(read('./Widgy_Home_Glass_Calendar_C16.json'));
const full=thinNativeStepsRing(compactCalendarDots(consolidateWidget(personalizedWidget(template,
  'https://example.test/api/calendar-dots?token=synthetic',
  'https://example.test/api/calendar-widget?token=synthetic'))));
const before=structuredClone(full),control=withMapFiveMinuteURL(full,'https://example.test');
const result=withMaskBlendProbe(full,'https://example.test');
assert.deepEqual(full,before);assert.equal(result['1'].length,1);
assert.deepEqual(result['36'],[]);
const group=result['1'][0],picture=group['1'][0];
assert.equal(group.s,'Probe Group');assert.equal(group.a,true);assert.equal(group['1'].length,1);
assert.equal(picture.s,'Probe Image');assert.equal(picture['1'],'Web URL');
assert.equal(picture['2'],'https://example.test/assets/calendar-glass/today-c13/1.png');
const imageControl=control['1'][0]['1'].find(n=>n.d0===6170),restored=structuredClone(picture);
restored.s=imageControl.s;restored['2']=imageControl['2'];
assert.deepEqual(restored,imageControl,'No guessed native effect or image fields');
assert(!/\$\{widgy\.|token=|\/api\//.test(JSON.stringify(result)));
const html=read('./widgy-mask-blend-probe.html');
const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],
  {events:{},classList:{toggle(){}},addEventListener(name,fn){this.events[name]=fn;},removeAttribute(name){delete this[name];}}]));
let downloaded,copied,fail=false;const events={},requests=[];
class BrowserURL extends URL{
  static createObjectURL(blob){downloaded=blob;return 'blob:synthetic';}
  static revokeObjectURL(){}
}
const ctx={document:{getElementById:id=>{assert(elements[id]);return elements[id];}},Blob,URL:BrowserURL,
  personalizedWidget,consolidateWidget,compactCalendarDots,thinNativeStepsRing,withMaskBlendProbe,
  navigator:{clipboard:{async writeText(value){copied=value;}}},
  window:{location:{href:'https://example.test/tools/widgy-mask-blend-probe.html'},addEventListener(name,fn){events[name]=fn;}},
  async fetch(url,options){requests.push([url,options]);return {ok:!fail,async json(){return structuredClone(template);}};}};
vm.runInNewContext(read('./widgy-mask-blend-probe.js').replace(/^import .*;\n/gm,''),ctx);
await new Promise(setImmediate);
assert.equal(elements.copy.disabled,false);assert.deepEqual(JSON.parse(await downloaded.text()),result);
await elements.copy.events.click();assert.deepEqual(JSON.parse(copied),result);
fail=true;await elements.retry.events.click();assert.equal(elements.copy.disabled,true);
assert.equal(elements.download.hidden,true);assert.equal(elements.download.href,undefined);
copied='';await elements.copy.events.click();assert.equal(copied,'');
fail=false;events.pageshow({persisted:true});await new Promise(setImmediate);
assert.equal(elements.copy.disabled,false);
ctx.navigator.clipboard.writeText=async()=>{throw Error('blocked');};
await elements.copy.events.click();assert.equal(elements.download.hidden,false);
for(const [url,options] of requests){assert.equal(url,'./Widgy_Home_Glass_Calendar_C16.json');assert.equal(options.cache,'no-store');}
assert(html.includes('widgy-mask-blend-probe.js?v=mask-blend-probe-1'));
assert(html.includes('Widgy_Mask_Blend_Probe_1.json'));
console.log('PASS: one group/one generic image/zero variables, no GPS/calendar/API/guessed effect fields; public copy/download/error/recovery flows. Native named-mode selection/export remains required.');
