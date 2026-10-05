import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';
import {compactCalendarDots} from './calendar-compact-dots.js';
import {thinNativeStepsRing} from './native-steps-ring.js';
import {withHomeSyncMapLean} from './home-sync-map-lean.js';
import {withMapMinimalPair} from './map-minimal-pair.js';

const template=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
const normal=personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic',
  'https://example.test/api/calendar-widget?token=synthetic');
const full=thinNativeStepsRing(compactCalendarDots(consolidateWidget(normal)));
const before=structuredClone(full),control=withHomeSyncMapLean(full),result=withMapMinimalPair(full);
assert.deepEqual(full,before,'Do not mutate the full widget');
const map=w=>w['1'].find(n=>n.d0===245)['1'].find(n=>n.d0===6170);
assert.deepEqual(map(result),map(control),'Exact map: image binding/cache flag/frame/parent');
const names=['Latitude','Longitude','map_latitude_max5','map_longitude_max5','map_request'];
assert.deepEqual(result['36'],control['36'].filter(v=>names.includes(v['1'])),
  'Exact source objects, IDs, formatters and order for the complete map dependency closure');
for(const k of Object.keys(control))if(!['1','3','4','36'].includes(k))
  assert.deepEqual(result[k],control[k],'Document setting/resource '+k);
assert.equal(result['36'].length,5);
assert.deepEqual(result['1'].map(n=>n.d0),[245,247]);
for(const root of result['1'])for(const k of Object.keys(root))if(k!=='1')
  assert.deepEqual(root[k],control['1'].find(n=>n.d0===root.d0)[k]);
const walk=ns=>ns.flatMap(n=>[n,...(n.z==='13'?walk(n['1']):[])]);
const nodes=walk(result['1']),ids=new Set(nodes.map(n=>n.d0));
assert.equal(nodes.length,21);assert.equal(ids.size,21);
assert.equal(nodes.filter(n=>n.z==='5').length,1,'Only one remote image');
assert.equal(nodes.filter(n=>n.z==='11').length,4);
assert(!JSON.stringify(result).includes('/api/calendar-'));
assert(!JSON.stringify(result).includes('token='));
const removed=control['36'].filter(v=>!names.includes(v['1']));
for(const v of removed){
  assert(!JSON.stringify(result).includes('${widgy.'+v['1']+'}'));
  assert(!JSON.stringify(result).toLowerCase().includes(v['0'].toLowerCase()));
}
for(const m of JSON.stringify(result).matchAll(/\$\{widgy\.([^}]+)\}/g))assert(names.includes(m[1]));
const sourceKinds=[];
function sources(value){
  if(!value||typeof value!=='object')return;
  if(Array.isArray(value['66']))sourceKinds.push(...value['66'].map(s=>s['5']+'/'+s['6']));
  Object.values(value).forEach(sources);
}
sources(result);
assert.deepEqual(sourceKinds.sort(),['Custom Text/Text','Custom Text/Text','Custom Text/Text',
  'Custom Text/Text','Custom Text/Text','Javascript/Script','Location/Latitude (Decimal)',
  'Location/Latitude (Decimal)','Location/Longitude (Decimal)','Location/Longitude (Decimal)'].sort());
for(const root of result['1'])for(const node of root['1']){
  if(node.z==='11'){
    const old=structuredClone(control['1'].find(n=>n.d0===root.d0)['1'].find(n=>n.d0===node.d0));
    old['1a']=node.s==='HOME Tap'?'button_245-247':'button_247-245';
    assert.deepEqual(node,old,'Tap frame unchanged; only removed targets/month reset disappear');
  }else if(/ Nav /.test(node.s))
    assert.deepEqual(node,control['1'].find(n=>n.d0===root.d0)['1'].find(n=>n.d0===node.d0));
}
// Simulate exported visibility only, not Widgy timing or native scheduling.
const visibility=new Map(result['1'].map(n=>[n.d0,n.a!==false]));
assert.deepEqual([...visibility.values()],[true,false]);
function tap(id){
  const node=nodes.find(n=>n.d0===id),[show,hide]=node['1a'].slice(7).split('-');
  for(const [part,enabled] of [[show,true],[hide,false]])for(const value of part.split(',')){
    const target=Number(value);assert(ids.has(target));assert(visibility.has(target));visibility.set(target,enabled);
  }
  assert.equal([...visibility.values()].filter(Boolean).length,1);
}
for(let i=0;i<3;i++){
  tap(5022);assert.equal(visibility.get(247),true);
  tap(80315);assert.equal(visibility.get(247),true);
  tap(80314);assert.equal(visibility.get(245),true);
  tap(5021);assert.equal(visibility.get(245),true);
}
const bg=result['1'][1]['1'].at(-1);
assert.deepEqual(bg,control['1'].find(n=>n.s==='WEATHER')['1'].find(n=>n.d0===5049));
assert.equal(bg.d.a[0].a,1600);assert.equal(bg.e.a[0].a,1600);
assert.equal(result['1'][1]['1'].at(-2)['66'][0]['25'],'CALENDAR TEST');
for(const mutate of [
  w=>w['1'][0]['1'].push({...w['1'][0]['1'].find(n=>n.d0===5021)}),
  w=>{w['1'].find(n=>n.s==='WEATHER')['1'].find(n=>n.d0===5049).z='5';},
  w=>{w['1'].find(n=>n.s==='CALENDAR')['1'].find(n=>n.d0===80334)['66'][0]['25']='Changed';}
]){
  const bad=structuredClone(full);mutate(bad);assert.throws(()=>withMapMinimalPair(bad),/unexpected_template/);
}

// Exercise real import controller with PUBLIC template fetch only, no account
// session, location, geocoder or private-calendar request. No network is used.
const html=readFileSync(new URL('./widgy-map-minimal-pair.html',import.meta.url),'utf8');
const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],
  {events:{},classList:{toggle(){}},addEventListener(name,fn){this.events[name]=fn;},removeAttribute(name){delete this[name];}}]));
const events={},requests=[];let downloaded,copied,fail=false,revoked=0;
class BrowserURL extends URL{
  static createObjectURL(blob){downloaded=blob;return 'blob:synthetic';}
  static revokeObjectURL(){revoked++;}
}
const ctx={document:{getElementById:id=>{assert(elements[id],id);return elements[id];}},Blob,URL:BrowserURL,
  personalizedWidget,consolidateWidget,compactCalendarDots,thinNativeStepsRing,withMapMinimalPair,
  navigator:{clipboard:{async writeText(value){copied=value;}}},
  window:{location:{href:'https://example.test/tools/widgy-map-minimal-pair.html'},addEventListener(name,fn){events[name]=fn;}},
  async fetch(url,options){requests.push([url,options]);return {ok:!fail,async json(){return structuredClone(template);}};}};
vm.runInNewContext(readFileSync(new URL('./widgy-map-minimal-pair.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,''),ctx);
await new Promise(setImmediate);
assert.equal(elements.copy.disabled,false);assert.deepEqual(JSON.parse(await downloaded.text()),result);
await elements.copy.events.click();assert.deepEqual(JSON.parse(copied),result);
fail=true;await elements.retry.events.click();assert.equal(elements.copy.disabled,true);
assert.equal(elements.download.hidden,true);assert.equal(elements.download.href,undefined);
copied='';await elements.copy.events.click();assert.equal(copied,'');
fail=false;events.pageshow({persisted:true});await new Promise(setImmediate);assert.equal(elements.copy.disabled,false);
ctx.navigator.clipboard.writeText=async()=>{throw Error('blocked');};
await elements.copy.events.click();assert.equal(elements.download.hidden,false);
assert.equal(requests.length,3);assert.equal(revoked,1);
for(const [url,options] of requests){
  assert.equal(url,'./Widgy_Home_Glass_Calendar_C16.json');assert.equal(options.cache,'no-store');
  assert(!options.method || options.method==='GET');
}
assert(html.includes('widgy-map-minimal-pair.js?v=map-minimal-pair-1'));
assert(html.includes('Widgy_Map_Minimal_Pair_1.json'));
assert(html.includes('./widgy-home-sync-map-lean.html?v=home-sync-map-lean-1'));
console.log('PASS: 21 layers / 5 exact map variables; original image/frame/script/GPS/minute URL preserved; no calendar URLs/tokens or other data sources; two-screen visibility and tap frames checked; source input immutable; public-only copy/download/retry/pageshow and stale-payload handling pass. Native import and transition speed remain unmeasured.');
