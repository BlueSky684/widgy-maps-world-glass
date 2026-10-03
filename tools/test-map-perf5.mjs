import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {personalizedWidget} from './calendar-connect-widget.js';
import {buildCityMapScript} from './widgy-city-map-script.mjs';
const original=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
const base='https://example.test';
const widget=personalizedWidget(original,base+'/api/calendar-dots?token=test',base+'/api/calendar-widget?token=test');
const source=widget['36'].find(v=>v['1']==='map_request');
const originalVar=original['36'].find(v=>v['1']==='map_request');
const withoutCode=v=>{v=structuredClone(v);delete v['3']['66'];return v;};
assert.deepEqual(withoutCode(source),withoutCode(originalVar));
const code=source['3']['66'][0]['10'];
let clock=1_000_000,requests=0,finish;
class FixedDate extends Date{static now(){return clock;}}
// Synthetic provider responses only; never contact the client geocoder here.
const context=vm.createContext({Date:FixedDate,sendToWidgy:value=>finish(value),fetch:url=>{
 requests++;const q=new URL(url).searchParams;
 return Promise.resolve({ok:true,json:async()=>({lookupSource:'coordinates',latitude:q.get('latitude'),longitude:q.get('longitude'),city:'Synthetic City'})});
}});
async function run(lat='0',lon='0'){
 return new Promise(resolve=>{finish=value=>resolve(new URL(value));
 vm.runInContext(code.replaceAll('${widgy.map_latitude_max5}',lat).replaceAll('${widgy.map_longitude_max5}',lon),context,{timeout:1000});});
}
const first=await run();assert.equal(requests,1);
clock+=61_000;const second=await run();assert.equal(requests,1);
assert.notEqual(first.searchParams.get('t'),second.searchParams.get('t'),'Solar URL still advances every minute');
assert.equal(second.searchParams.get('city'),'Synthetic City');
assert.equal(second.searchParams.get('width'),'3306');
assert.equal(second.searchParams.get('atlas'),'r6');
clock+=3_538_000;await run();assert.equal(requests,1);
clock+=1_000;await run();assert.equal(requests,2,'City expires after exactly one hour');
await run('0.00001');assert.equal(requests,3,'Any coordinate change rechecks city');
clock-=1;await run('0.00001');assert.equal(requests,4,'Clock rollback invalidates cache');
await run('');assert.equal(requests,4);
context.globalThis=undefined;await run();await run();assert.equal(requests,6,'Fresh/unsupported contexts keep the existing fetch fallback');
assert.throws(()=>buildCityMapScript(base+'/api/night-map',{cityReuseSeconds:86400}));
console.log(JSON.stringify({passed:true,cityNetworkRequestsAcrossMinute:1,solarRefreshSeconds:60,cityRefreshSeconds:3600,coordinateChangeInvalidates:true,noLayoutChanges:true,requiresDeviceValidation:true}));
