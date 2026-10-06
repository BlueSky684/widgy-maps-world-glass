import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';
import {compactCalendarDots} from './calendar-compact-dots.js';
import {thinNativeStepsRing} from './native-steps-ring.js';
import {withMapMaskLive} from './map-mask-live.js';
import {withMapMaskAppearedOff} from './map-mask-appeared-off.js';
import {withMapMaskAlpha} from './map-mask-alpha.js';
import {withMapMaskAlphaFixed,ALPHA_FIXED_EPOCH} from './map-mask-alpha-fixed.js';

const html=readFileSync(new URL('./widgy-map-mask-alpha-fixed-1.html',import.meta.url),'utf8');
const oldHTML=readFileSync(new URL('./widgy-map-mask-alpha-1.html',import.meta.url),'utf8');
const transform=body=>body.split('// BEGIN PERSISTENT TRANSFORM')[1].split('// END PERSISTENT TRANSFORM')[0];
assert.equal(transform(html),transform(oldHTML),'Persistent transform drift');
const source=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/^import .*;\n/gm,'');
const template=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
const origin='https://example.test';
const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],{
  events:{},classList:{toggle(){}},addEventListener(name,f){this.events[name]=f;},removeAttribute(name){delete this[name];}
}]));
const events={},requests=[];let downloaded,copied,fail=false,clipboardFail=false;
class BrowserURL extends URL{static createObjectURL(blob){downloaded=blob;return 'blob:test';}static revokeObjectURL(){}}
const context={document:{getElementById:id=>elements[id]},Blob,URL:BrowserURL,structuredClone,
  personalizedWidget,consolidateWidget,compactCalendarDots,thinNativeStepsRing,withMapMaskLive,withMapMaskAppearedOff,withMapMaskAlpha,withMapMaskAlphaFixed,
  navigator:{clipboard:{async writeText(text){if(clipboardFail)throw Error('denied');copied=text;}}},
  window:{location:{href:origin+'/tools/widgy-map-mask-alpha-fixed-1.html?v=1',protocol:'https:',host:'example.test',pathname:'/tools/widgy-map-mask-alpha-fixed-1.html',search:'?v=1'},addEventListener(name,f){events[name]=f;}},
  async fetch(url,options){requests.push([url,options]);return {ok:!fail,async json(){return structuredClone(template);}};}
};
vm.runInNewContext(source,context);await new Promise(setImmediate);
assert.equal(elements.copy.disabled,false);
const actual=JSON.parse(await downloaded.text());
const live=withMapMaskLive(thinNativeStepsRing(compactCalendarDots(consolidateWidget(personalizedWidget(template,
  origin+'/api/calendar-dots?token=unused-mask-test',origin+'/api/calendar-widget?token=unused-mask-test')))),origin);
const alpha=withMapMaskAlpha(withMapMaskAppearedOff(structuredClone(context.persistentMask(live))));
const original=structuredClone(alpha),candidate=withMapMaskAlphaFixed(alpha,origin);
assert.deepEqual(alpha,original,'Input mutated');assert.deepEqual(actual,candidate,'Page copies a different transform');
assert.equal(candidate['3'],'Widgy Map Mask Alpha Fixed 1');
assert.deepEqual(candidate['36'],[]);
assert(!/\$\{widgy\.|"Javascript"/.test(JSON.stringify(candidate)));
assert.equal(new Date(ALPHA_FIXED_EPOCH).toISOString(),'2026-10-06T10:05:00.000Z');
const flat=nodes=>nodes.flatMap(n=>[n,...(Array.isArray(n['1'])?flat(n['1']):[])]);
const nodes=flat(candidate['1']);assert.equal(nodes.length,29);
assert.equal(nodes.filter(n=>n.z==='5').length,4);
assert.equal(nodes.filter(n=>Object.hasOwn(n,'r0')).length,8);
const restored=structuredClone(candidate),restoredNodes=flat(restored['1']);
for(const [id,part]of [[84011,'day'],[84021,'night']]){
  const mask=restoredNodes.find(n=>n.d0===id);
  assert.equal(mask['2'],origin+'/api/solar-mask?rev=alpha-1&part='+part+'&t='+ALPHA_FIXED_EPOCH);
  mask['2']='${widgy.mask_'+part+'_request}';
}
restored['36']=structuredClone(alpha['36']);
assert.equal(restoredNodes.find(n=>n.d0===84050)['66'][0]['25'],'FIXED ALPHA');
restoredNodes.find(n=>n.d0===84050)['66'][0]['25']='ALPHA MASK';
restored['3']=alpha['3'];restored['4']=alpha['4'];
assert.deepEqual(restored,alpha,'Unexpected change to assets, hierarchy, effects, actions or settings');
assert.throws(()=>withMapMaskAlphaFixed(candidate,origin),/unexpected_baseline/);
assert.throws(()=>withMapMaskAlphaFixed(alpha,origin+'/wrong'),/unexpected_origin/);
const invalid=structuredClone(alpha);invalid['36'].push({});
assert.throws(()=>withMapMaskAlphaFixed(invalid,origin),/unexpected_variables/);
await elements.copy.events.click();assert.deepEqual(JSON.parse(copied),candidate);
clipboardFail=true;await elements.copy.events.click();assert.match(elements.status.textContent,/ההעתקה נחסמה/);
fail=true;await elements.retry.events.click();assert.equal(elements.copy.disabled,true);assert.equal(elements.download.href,undefined);
fail=false;events.pageshow({persisted:true});await new Promise(setImmediate);assert.equal(elements.copy.disabled,false);
assert.deepEqual(JSON.parse(await downloaded.text()),candidate);
assert.equal(elements.chrome.href,'googlechromes://example.test/tools/widgy-map-mask-alpha-fixed-1.html?v=1');
assert(requests.every(([url,options])=>url==='./Widgy_Home_Glass_Calendar_C16.json'&&options.cache==='no-store'));
console.log(JSON.stringify({result:'PASS',layers:29,images:4,variables:0,epoch:ALPHA_FIXED_EPOCH,
  checks:'Exact reversal to Alpha1; no native script/binding left; all effects/assets/nav preserved; real copy/download/error/recovery controller'}));
