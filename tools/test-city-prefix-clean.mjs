import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';
import {compactCalendarDots} from './calendar-compact-dots.js';
import {thinNativeStepsRing} from './native-steps-ring.js';
import {withHomeSyncMapLean} from './home-sync-map-lean.js';
import {withCityPrefixClean} from './city-prefix-clean.js';

const template=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
const normal=personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic',
  'https://example.test/api/calendar-widget?token=synthetic');
const full=thinNativeStepsRing(compactCalendarDots(consolidateWidget(normal)));
const before=structuredClone(full),control=withHomeSyncMapLean(full),result=withCityPrefixClean(full);
const get=(w,name='calendar_city_prefix')=>w['36'].find(v=>v['1']===name)['3']['66'];
const restored=structuredClone(result);
get(restored)[0]=structuredClone(get(control)[0]);
restored['3']=control['3'];restored['4']=control['4'];
assert.deepEqual(restored,control,'Only the one source object and metadata change');
assert.deepEqual(full,before,'Immutable input');
assert.deepEqual(get(result),[{'5':'Custom Text','6':'Text','25':''}]);
assert.deepEqual(get(result,'map_request'),get(control,'map_request'),'Map pipeline exact');
assert.equal(result['36'].length,69);
const walk=ns=>ns.flatMap(n=>[n,...(n.z==='13'?walk(n['1']):[])]);
const nodes=walk(result['1']),ids=new Set(nodes.map(n=>n.d0));
assert.equal(nodes.length,1289);assert.equal(ids.size,nodes.length);
for(const n of nodes)if(n['1a']?.startsWith('button_'))
  for(const id of n['1a'].slice(7).split(/[-,]/).map(Number))assert(ids.has(id),'Dangling tap target '+id);
const names=new Set(result['36'].map(v=>v['1']));
for(const m of JSON.stringify(result).matchAll(/\$\{widgy\.([^}]+)\}/g))assert(names.has(m[1]));
const code=get(control)[0]['10'];
assert.equal([...code.matchAll(/\$\{widgy\.[^}]+\}/g)].length,4);
assert(!JSON.stringify(get(result)).includes('${widgy.'));
let cases=0;
for(const now of [1791176939999,1791176940000,1791177000000,1791234000000]){
  for(const [lat,lon] of [['0','0'],['-45.12345','120.12345'],['90','180'],['-90','-180'],
    [' 12,25 ','\u2212120,5'],['','0'],['91','0'],['0','181'],['NaN','0'],['${widgy.missing}','0']]){
    // Synthetic only. Deliberately different unused fallback inputs.
    const values={map_latitude_max5:lat,map_longitude_max5:lon,Latitude:'-1',Longitude:'2'},out=[];
    const source=code.replace(/"\$\{widgy\.([^}]+)\}"/g,(_,name)=>JSON.stringify(values[name]));
    vm.runInNewContext(source,{Date:{now:()=>now},sendToWidgy:v=>out.push(v),fetch(){throw Error('Unexpected fetch');}});
    assert.equal(out.length,1);assert.equal(out[0],'');
    assert.equal(out[0],get(result)[0]['25'],'Existing completed result equals literal value');cases++;
  }
}

// Existing conditions must choose exactly the same native-city/spelling path.
const vars=new Map(result['36'].map(v=>[v['1'],v]));
const locationNodes=result['1'].find(n=>n.s==='CALENDAR')['1'].filter(n=>n.s?.startsWith('Calendar Location'));
function active(ns,values){return ns.flatMap(n=>{
  if(n.o1){const {0:v,1:op,2:term}=n.o1,x=values[v]??'';if(!({0:x===term,1:x!==term})[op])return [];}
  return n.z==='13'?active(n['1'],values):[n];
});}
for(const [city,expected] of [['Example','Native Fallback'],['Ashqelon','Ashkelon Spelling'],
  ['Ashkelon','Native Fallback'],['עיר לדוגמה','Native Fallback'],['','Native Fallback']]){
  const shown=active(locationNodes,{[vars.get('calendar_city_prefix')['0']]:'',[vars.get('calendar_native_city')['0']]:city});
  assert.equal(shown.length,1);assert(shown[0].s.endsWith(expected));
}
for(const mutate of [
  w=>get(w)[0]['6']='Script',
  w=>get(w)[0]['10']=get(w)[0]['10'].replace('atlas=r6','atlas=r6&city=Example'),
  w=>get(w)[0]['10']=get(w)[0]['10'].replace("sendToWidgy(city ? city + ', ' : '');","sendToWidgy('changed');")
]){
  const bad=structuredClone(full);mutate(bad);assert.throws(()=>withCityPrefixClean(bad),/unexpected_template/);
}

const html=readFileSync(new URL('./widgy-city-prefix-clean.html',import.meta.url),'utf8');
const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],
  {events:{},classList:{toggle(){}},addEventListener(name,fn){this.events[name]=fn;},removeAttribute(name){delete this[name];}}]));
const events={};let downloaded,copied,error;
const ctx={document:{getElementById:id=>{assert(elements[id],id);return elements[id];}},Blob,
  consolidateWidget,compactCalendarDots,thinNativeStepsRing,withCityPrefixClean,
  URL:{createObjectURL(blob){downloaded=blob;return 'blob:synthetic';},revokeObjectURL(){}},
  navigator:{clipboard:{async writeText(value){copied=value;}}},window:{addEventListener(name,fn){events[name]=fn;}},
  async prepareWidget(){if(error)throw Error(error);return {payload:JSON.stringify(normal)};}};
vm.runInNewContext(readFileSync(new URL('./widgy-city-prefix-clean.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,''),ctx);
await new Promise(setImmediate);
assert.equal(elements.copy.disabled,false);assert.deepEqual(JSON.parse(await downloaded.text()),result);
await elements.copy.events.click();assert.deepEqual(JSON.parse(copied),result);
error='unauthorized';await elements.retry.events.click();assert.equal(elements.copy.disabled,true);
assert.equal(elements.download.hidden,true);assert.equal(elements.download.href,undefined);
copied='';await elements.copy.events.click();assert.equal(copied,'');
error=null;events.pageshow({persisted:true});await new Promise(setImmediate);assert.equal(elements.copy.disabled,false);
ctx.navigator.clipboard.writeText=async()=>{throw Error('blocked');};
await elements.copy.events.click();assert.equal(elements.download.hidden,false);
assert(html.includes('widgy-city-prefix-clean.js?v=city-prefix-clean-1'));
assert(html.includes('Widgy_City_Prefix_Clean_1.json'));
assert(html.includes('./widgy-home-sync-map-lean.html?v=home-sync-map-lean-1'));
console.log(`PASS: ${cases} synthetic coordinate/time cases produce the same empty prefix; five native city/fallback states preserved; exact one-source delta, 69 variables/1289 layers and entire map pipeline unchanged; unsafe source cases and synthetic copy/download/session paths covered. Native empty-text behavior and speed unmeasured.`);
