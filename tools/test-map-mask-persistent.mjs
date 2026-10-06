import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';
import {compactCalendarDots} from './calendar-compact-dots.js';
import {thinNativeStepsRing} from './native-steps-ring.js';
import {withMapMaskLive} from './map-mask-live.js';

const html=readFileSync(new URL('./widgy-map-mask-persistent-1.html',import.meta.url),'utf8');
const source=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/^import .*;\n/gm,'');
const template=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
const origin='https://example.test';
const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],{
  events:{},classList:{toggle(){}},addEventListener(name,f){this.events[name]=f;},removeAttribute(name){delete this[name];}
}]));
const events={},requests=[];let downloaded,copied,fail=false,clipboardFail=false;
class BrowserURL extends URL{static createObjectURL(blob){downloaded=blob;return 'blob:test';}static revokeObjectURL(){}}
const context={document:{getElementById:id=>elements[id]},Blob,URL:BrowserURL,structuredClone,
  personalizedWidget,consolidateWidget,compactCalendarDots,thinNativeStepsRing,withMapMaskLive,
  navigator:{clipboard:{async writeText(text){if(clipboardFail)throw Error('denied');copied=text;}}},
  window:{location:{href:origin+'/tools/widgy-map-mask-persistent-1.html?v=1',protocol:'https:',host:'example.test',pathname:'/tools/widgy-map-mask-persistent-1.html',search:'?v=1'},addEventListener(name,f){events[name]=f;}},
  async fetch(url,options){requests.push([url,options]);return {ok:!fail,async json(){return structuredClone(template);}};}
};
vm.runInNewContext(source,context);
await new Promise(setImmediate);
assert.equal(elements.copy.disabled,false);
const persistent=JSON.parse(await downloaded.text());
const live=withMapMaskLive(thinNativeStepsRing(compactCalendarDots(consolidateWidget(personalizedWidget(template,
  origin+'/api/calendar-dots?token=unused-mask-test',origin+'/api/calendar-widget?token=unused-mask-test')))),origin);
assert.equal(persistent['3'],'Widgy Map Mask Persistent 1');
assert.deepEqual(persistent['36'],live['36']);
const [home,calendar,map]=persistent['1'];
assert.deepEqual(calendar,live['1'][1]);
assert.equal(map.d0,84100);assert.equal(map.a,true);
assert.deepEqual(map['1'].map(n=>n.d0),[84020,84010,84040]);
assert(!home['1'].some(n=>[84020,84010,84040].includes(n.d0)));
// Reverse exactly the documented structural move and labels. No other change
// to sources, animation/effects, coordinates, native navigation or settings.
const restored=structuredClone(persistent);
restored['1']=[restored['1'][0],restored['1'][1]];
restored['1'][0]['1'].push(...structuredClone(map['1']));
restored['1'][0]['1'].find(n=>n.d0===84050)['66'][0]['25']='LIVE MASK';
restored['3']=live['3'];restored['4']=live['4'];
assert.deepEqual(restored,live);
const flat=nodes=>nodes.flatMap(n=>[n,...(Array.isArray(n['1'])?flat(n['1']):[])]);
const nodes=flat(persistent['1']);
assert.equal(nodes.filter(n=>n.z==='5').length,4);
assert.equal(nodes.length,new Set(nodes.map(n=>n.d0)).size);
for(const tap of nodes.filter(n=>n.z==='11')){
  const match=/^button_(245|247)-(245|247)$/.exec(tap['1a']);assert(match);
  const state=new Map([[home.d0,home.a],[calendar.d0,calendar.a],[map.d0,map.a]]);
  state.set(Number(match[1]),true);state.set(Number(match[2]),false);
  assert.equal(state.get(84100),true);assert.notEqual(state.get(245),state.get(247));
}
// Exercise the actual page controller, including errors that must not leave a
// stale payload enabled, and recovery through the existing retry/pageshow path.
await elements.copy.events.click();assert.deepEqual(JSON.parse(copied),persistent);
clipboardFail=true;await elements.copy.events.click();assert.match(elements.status.textContent,/ההעתקה נחסמה/);
fail=true;await elements.retry.events.click();assert.equal(elements.copy.disabled,true);assert.equal(elements.download.href,undefined);
fail=false;events.pageshow({persisted:true});await new Promise(setImmediate);assert.equal(elements.copy.disabled,false);
assert.deepEqual(JSON.parse(await downloaded.text()),persistent);
assert.equal(elements.chrome.href,'googlechromes://example.test/tools/widgy-map-mask-persistent-1.html?v=1');
assert(requests.every(([url,options])=>url==='./Widgy_Home_Glass_Calendar_C16.json'&&options.cache==='no-store'));
console.log(JSON.stringify({result:'PASS',layers:nodes.length,images:4,variables:3,checks:'Exact reversal to Live1; fixed map remains outside both tab visibility targets; same sources/frames/effects/navigation; actual copy/download/error/recovery flows'}));
