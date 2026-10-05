import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';
import {compactCalendarDots} from './calendar-compact-dots.js';
import {thinNativeStepsRing} from './native-steps-ring.js';
import {withNativeCityRecovery,withMapSyncRecovery} from './native-city-url.js';

const template=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
const normal=personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic',
  'https://example.test/api/calendar-widget?token=synthetic');
const full=thinNativeStepsRing(compactCalendarDots(consolidateWidget(normal)));
const before=structuredClone(full),control=withNativeCityRecovery(full),result=withMapSyncRecovery(full);
const get=w=>w['36'].find(v=>v['1']==='map_request')['3']['66'][0];
const restored=structuredClone(result);
get(restored)['6']=get(control)['6'];get(restored)['10']=get(control)['10'];
restored['3']=control['3'];restored['4']=control['4'];
assert.deepEqual(restored,control,'Only map source completion mode/body and metadata change');
assert.deepEqual(full,before,'Input immutable');
assert.equal(get(result)['6'],'Script');
assert(!/sendToWidgy|fetch\s*\(|reverse-geocode-client/.test(get(result)['10']));
const walk=ns=>ns.flatMap(n=>[n,...(n.z==='13'?walk(n['1']):[])]);
assert.equal(walk(result['1']).length,1514);assert.equal(result['36'].length,81);
const instantiate=(code,lat,lon)=>code.replace(/\$\{widgy\.([^}]+)\}/g,(_,name)=>({
  map_latitude_max5:lat,map_longitude_max5:lon,Latitude:lat,Longitude:lon})[name]);
let cases=0;
for(const now of [1791176939999,1791176940000,1791176999999,1791177000000]){
  for(const [lat,lon] of [['0','0'],['-45.12345','120.12345'],['90','180'],['-90','-180'],
    [' 12,25 ','\u2212120,5'],['','0'],['91','0'],['0','181'],['NaN','0'],['${widgy.missing}','0']]){
    const out=[],context={Date:{now:()=>now},fetch(){throw Error('Unexpected network');}};
    vm.runInNewContext(instantiate(get(control)['10'],lat,lon),{...context,sendToWidgy:value=>out.push(value)});
    assert.equal(out.length,1);
    // Candidate gets no sendToWidgy binding. The exact source runs twice in one
    // context and once fresh to check deterministic initial/repeated completion.
    const source=instantiate(get(result)['10'],lat,lon),candidate=vm.createContext(context);
    vm.runInContext(source,candidate);
    assert.equal(vm.runInContext('main()',candidate),out[0]);
    assert.equal(vm.runInContext('main()',candidate),out[0]);
    assert.equal(vm.runInNewContext(source+'\nmain();',context),out[0]);
    const url=new URL(out[0]);assert.equal(url.searchParams.get('t'),String(Math.floor(now/60000)*60000));
    assert.equal(url.searchParams.get('width'),'3306');assert.equal(url.searchParams.get('reuse'),'60');
    assert.equal(url.searchParams.has('city'),false);cases++;
  }
}

const html=readFileSync(new URL('./widgy-map-sync-recovery.html',import.meta.url),'utf8');
const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],
  {events:{},classList:{toggle(){}},addEventListener(name,fn){this.events[name]=fn;},removeAttribute(name){delete this[name];}}]));
const events={};let downloaded,copied,error;
const ctx={document:{getElementById:id=>{assert(elements[id],id);return elements[id];}},Blob,
  consolidateWidget,compactCalendarDots,thinNativeStepsRing,withMapSyncRecovery,
  URL:{createObjectURL(blob){downloaded=blob;return 'blob:synthetic';},revokeObjectURL(){}},
  navigator:{clipboard:{async writeText(value){copied=value;}}},window:{addEventListener(name,fn){events[name]=fn;}},
  async prepareWidget(){if(error)throw Error(error);return {payload:JSON.stringify(normal)};}};
vm.runInNewContext(readFileSync(new URL('./widgy-map-sync-recovery.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,''),ctx);
await new Promise(setImmediate);
assert.equal(elements.copy.disabled,false);assert.deepEqual(JSON.parse(await downloaded.text()),result);
await elements.copy.events.click();assert.deepEqual(JSON.parse(copied),result);
error='unauthorized';await elements.retry.events.click();assert.equal(elements.copy.disabled,true);
assert.equal(elements.download.hidden,true);assert.equal(elements.download.href,undefined);
copied='';await elements.copy.events.click();assert.equal(copied,'');
error=null;events.pageshow({persisted:true});await new Promise(setImmediate);assert.equal(elements.copy.disabled,false);
ctx.navigator.clipboard.writeText=async()=>{throw Error('blocked');};
await elements.copy.events.click();assert.equal(elements.download.hidden,false);
assert(html.includes('widgy-map-sync-recovery.js?v=map-sync-recovery-1'));
assert(html.includes('Widgy_Map_Sync_Recovery_1.json'));
assert(html.includes('./widgy-native-city-url.html?v=native-city-recovery-1'));
console.log(`PASS: ${cases} coordinate/time cases yield byte-identical URLs on initial/repeated evaluation, without async callback or network. Only map completion mode/body and metadata change; 1514 layers/81 variables, image, Calendar and other fields exact. Import controller copy/download/session recovery pass. Native map stability and speed remain unverified.`);
