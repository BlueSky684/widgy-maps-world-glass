import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';
import {compactCalendarDots} from './calendar-compact-dots.js';
import {thinNativeStepsRing} from './native-steps-ring.js';
import {withHomeSyncMapLean} from './home-sync-map-lean.js';
import {withMapCacheURL} from './map-cache-url.js';

const template=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
const normal=personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic',
  'https://example.test/api/calendar-widget?token=synthetic');
const full=thinNativeStepsRing(compactCalendarDots(consolidateWidget(normal)));
const before=structuredClone(full),control=withHomeSyncMapLean(full),result=withMapCacheURL(full);
const get=w=>w['36'].find(v=>v['1']==='map_request')['3']['66'][0];
const restored=structuredClone(result);get(restored)['10']=get(control)['10'];
restored['3']=control['3'];restored['4']=control['4'];
assert.deepEqual(restored,control,'Only one script body and metadata change');
assert.deepEqual(full,before,'Input immutable');
assert.equal(result['36'].length,69);assert.equal(get(result)['6'],'Script');
assert(!/Date\.now|sendToWidgy|fetch\s*\(|&t=/.test(get(result)['10']));
const walk=ns=>ns.flatMap(n=>[n,...(n.z==='13'?walk(n['1']):[])]);
assert.equal(walk(result['1']).length,1289);
const instantiate=(code,lat,lon)=>code.replace(/\$\{widgy\.([^}]+)\}/g,(_,name)=>({
 map_latitude_max5:lat,map_longitude_max5:lon,Latitude:lat,Longitude:lon})[name]);
const seen=new Map();let cases=0;
for(const now of [1791176939999,1791176940000,1791176999999,1791177000000,1791180600000]){
 for(const [lat,lon] of [['0','0'],['0.00001','0'],['-45.12345','120.12345'],['90','180'],['-90','-180'],
  [' 12,25 ','\u2212120,5'],['','0'],['91','0'],['0','181'],['NaN','0'],['${widgy.missing}','0']]){
  const env={Date:{now:()=>now},fetch(){throw Error('Unexpected network');}};
  const old=vm.runInNewContext(instantiate(get(control)['10'],lat,lon)+'\nmain();',env);
  const expected=new URL(old);expected.searchParams.delete('t');
  const source=instantiate(get(result)['10'],lat,lon),ctx=vm.createContext(env);
  vm.runInContext(source,ctx);const actual=vm.runInContext('main()',ctx);
  assert.equal(actual,expected.href,'Same exact URL minus t');
  assert.equal(vm.runInContext('main()',ctx),actual,'Repeated evaluation stable');
  const key=JSON.stringify([lat,lon]);if(seen.has(key))assert.equal(actual,seen.get(key),'Stable across time');
  seen.set(key,actual);const q=new URL(actual).searchParams;
  assert.equal(q.get('width'),'3306');assert.equal(q.get('reuse'),'60');assert.equal(q.has('city'),false);
  cases++;
 }
}
assert.notEqual(seen.get('["0","0"]'),seen.get('["0.00001","0"]'),'Exact GPS change still changes URL');
const html=readFileSync(new URL('./widgy-map-cache-url.html',import.meta.url),'utf8');
const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],
  {events:{},classList:{toggle(){}},addEventListener(name,fn){this.events[name]=fn;},removeAttribute(name){delete this[name];}}]));
const events={};let downloaded,copied,error;
const ctx={document:{getElementById:id=>{assert(elements[id],id);return elements[id];}},Blob,
  consolidateWidget,compactCalendarDots,thinNativeStepsRing,withMapCacheURL,
  URL:{createObjectURL(blob){downloaded=blob;return 'blob:synthetic';},revokeObjectURL(){}},
  navigator:{clipboard:{async writeText(value){copied=value;}}},window:{addEventListener(name,fn){events[name]=fn;}},
  async prepareWidget(){if(error)throw Error(error);return {payload:JSON.stringify(normal)};}};
vm.runInNewContext(readFileSync(new URL('./widgy-map-cache-url.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,''),ctx);
await new Promise(setImmediate);
assert.equal(elements.copy.disabled,false);assert.deepEqual(JSON.parse(await downloaded.text()),result);
await elements.copy.events.click();assert.deepEqual(JSON.parse(copied),result);
error='unauthorized';await elements.retry.events.click();assert.equal(elements.copy.disabled,true);
assert.equal(elements.download.hidden,true);assert.equal(elements.download.href,undefined);
copied='';await elements.copy.events.click();assert.equal(copied,'');
error=null;events.pageshow({persisted:true});await new Promise(setImmediate);assert.equal(elements.copy.disabled,false);
ctx.navigator.clipboard.writeText=async()=>{throw Error('blocked');};
await elements.copy.events.click();assert.equal(elements.download.hidden,false);
assert(html.includes('widgy-map-cache-url.js?v=map-cache-url-1'));
assert(html.includes('Widgy_Map_Cache_URL_1.json'));
assert(html.includes('./widgy-map-sync-recovery.html?v=map-sync-recovery-1'));
assert(html.includes('./widgy-home-sync-map-lean.html?v=home-sync-map-lean-1'));
console.log(`PASS: ${cases} synthetic coordinate/time cases, exact control URL minus t, stable time identity and unchanged GPS invalidation/precision. Only map script body and metadata differ. 69 variables/1289 layers retained. Copy/download/auth/session recovery passes. Widgy caching and native refresh unverified.`);
