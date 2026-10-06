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

const html=readFileSync(new URL('./widgy-map-mask-alpha-1.html',import.meta.url),'utf8');
const controlHTML=readFileSync(new URL('./widgy-map-mask-persistent-1.html',import.meta.url),'utf8');
const transform=body=>body.split('// BEGIN PERSISTENT TRANSFORM')[1].split('// END PERSISTENT TRANSFORM')[0];
assert.equal(transform(html),transform(controlHTML),'baseline transform drift');
const fields=JSON.parse(readFileSync(new URL('./performance/map-mask-appeared-off-native-fields.json',import.meta.url)));
const source=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/^import .*;\n/gm,'');
const template=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
const origin='https://example.test';
const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],{
  events:{},classList:{toggle(){}},addEventListener(name,f){this.events[name]=f;},removeAttribute(name){delete this[name];}
}]));
const events={},requests=[];let downloaded,copied,fail=false,clipboardFail=false;
class BrowserURL extends URL{static createObjectURL(blob){downloaded=blob;return 'blob:test';}static revokeObjectURL(){}}
const context={document:{getElementById:id=>elements[id]},Blob,URL:BrowserURL,structuredClone,
  personalizedWidget,consolidateWidget,compactCalendarDots,thinNativeStepsRing,withMapMaskLive,withMapMaskAppearedOff,withMapMaskAlpha,
  navigator:{clipboard:{async writeText(text){if(clipboardFail)throw Error('denied');copied=text;}}},
  window:{location:{href:origin+'/tools/widgy-map-mask-alpha-1.html?v=1',protocol:'https:',host:'example.test',pathname:'/tools/widgy-map-mask-alpha-1.html',search:'?v=1'},addEventListener(name,f){events[name]=f;}},
  async fetch(url,options){requests.push([url,options]);return {ok:!fail,async json(){return structuredClone(template);}};}
};
vm.runInNewContext(source,context);
await new Promise(setImmediate);
assert.equal(elements.copy.disabled,false);
const persistent=JSON.parse(await downloaded.text());
const live=withMapMaskLive(thinNativeStepsRing(compactCalendarDots(consolidateWidget(personalizedWidget(template,
  origin+'/api/calendar-dots?token=unused-mask-test',origin+'/api/calendar-widget?token=unused-mask-test')))),origin);
const baseline=withMapMaskAppearedOff(structuredClone(context.persistentMask(live)));
const before=structuredClone(baseline);
const candidate=withMapMaskAlpha(baseline);
assert.deepEqual(baseline,before,'transform mutated input');
assert.deepEqual(persistent,candidate,'page did not copy tested transform');
assert.equal(persistent['3'],'Widgy Map Mask Alpha 1');
assert.equal(persistent['36'].length,3);
assert.deepEqual(persistent['36'][0],baseline['36'][0]);
const [home,calendar,map]=persistent['1'];
assert.deepEqual(calendar,baseline['1'][1]);
assert.equal(map.d0,84100);assert.equal(map.a,true);
assert.deepEqual(map['1'].map(n=>n.d0),[84020,84010,84040]);
const flat=nodes=>nodes.flatMap(n=>[n,...(Array.isArray(n['1'])?flat(n['1']):[])]);
const nodes=flat(persistent['1']);
assert.equal(nodes.length,29);
assert.equal(nodes.filter(n=>n.z==='5').length,4);
assert.equal(nodes.length,new Set(nodes.map(n=>n.d0)).size);
const expectedIDs=[84011,84012,84021,84022,84010,84020,84040,84100].sort();
assert.deepEqual(nodes.filter(n=>Object.hasOwn(n,'r0')).map(n=>n.d0).sort(),expectedIDs);
for(const n of nodes.filter(n=>Object.hasOwn(n,'r0'))){
  const capture=n.z==='5'?fields.image:n.z==='13'?fields.group:fields.shape;
  assert.equal(n.z,capture.type);
  assert.deepEqual(n.r0,capture.r0,'native appeared-Off field differs on '+n.d0);
}
// Reverse ONLY the two mask blend fields and URL revisions, plus trial labels.
// The entire current fast baseline, including all eight r0 values, is preserved.
const restored=structuredClone(persistent);
for(const id of [84011,84021]){
  const changed=flat(restored['1']).find(n=>n.d0===id);
  assert(!Object.hasOwn(changed,'t'),'Mask must use native default Normal');
  changed.t=structuredClone(flat(baseline['1']).find(n=>n.d0===id).t);
}
for(const part of ['day','night']){
  const source=restored['36'].find(v=>v['1']==='mask_'+part+'_request')['3']['66'][0];
  assert(source['10'].includes('/api/solar-mask?rev=alpha-1&part='+part+'&t='));
  source['10']=source['10'].replace('rev=alpha-1','rev=live-1');
}
flat(restored['1']).find(n=>n.d0===84050)['66'][0]['25']='APPEARED OFF';
restored['3']=baseline['3'];restored['4']=baseline['4'];
assert.deepEqual(restored,baseline);
assert.throws(()=>withMapMaskAlpha(persistent),/unexpected_baseline/);
const invalid=structuredClone(baseline);flat(invalid['1']).find(n=>n.d0===84021).t.a[0].a=0;
assert.throws(()=>withMapMaskAlpha(invalid),/unexpected_mask_night/);
const epoch=Date.parse('2026-10-06T09:35:00Z');
const trap=()=>{throw Error('Unexpected native async/network/timer call');};
for(const offset of [0,299999,300000]){
  const stamp=String(Math.floor((epoch+offset)/300000)*300000);
  for(const part of ['day','night']){
    const script=persistent['36'].find(v=>v['1']==='mask_'+part+'_request')['3']['66'][0]['10'];
    const run=value=>vm.runInNewContext(script.replace('"${widgy.mask_epoch}"',JSON.stringify(value))+'; main()',
      {fetch:trap,setTimeout:trap,setInterval:trap,sendToWidgy:trap});
    assert.equal(run(stamp),origin+'/api/solar-mask?rev=alpha-1&part='+part+'&t='+stamp);
    assert.equal(run('${widgy.mask_epoch}'),'');
  }
}
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
assert.equal(elements.chrome.href,'googlechromes://example.test/tools/widgy-map-mask-alpha-1.html?v=1');
assert(requests.every(([url,options])=>url==='./Widgy_Home_Glass_Calendar_C16.json'&&options.cache==='no-store'));
console.log(JSON.stringify({result:'PASS',layers:nodes.length,images:4,variables:3,checks:'Eight Off fields unchanged; exact reversal to fast Appeared Off1; only two mask blend fields and revisions differ; synchronous URL bindings; actual copy/download/error/recovery flows'}));
