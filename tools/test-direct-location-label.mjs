import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
import {directLocationLabel,withDirectLocationLabel} from './direct-location-label.js';
async function run(lat,lon,data,fail){
 const values=[], urls=[]; const context=vm.createContext({sendToWidgy:v=>values.push(v),fetch:url=>{urls.push(url);return fail==='sync'?(()=>{throw Error()})():fail==='network'?Promise.reject(Error()):Promise.resolve({ok:fail!=='http',status:fail==='http'?429:200,json:async()=>data});}});
 vm.runInContext('('+directLocationLabel.toString()+')('+JSON.stringify(lat)+','+JSON.stringify(lon)+')',context);
 await new Promise(r=>setImmediate(r)); assert.equal(values.length,1);return {value:values[0],urls,context};
}
const data={latitude:31.8,longitude:34.65,lookupSource:'coordinates',city:'Ashdod',countryName:'Israel'};
assert.equal((await run('31.8','34.65',data)).value,'Ashdod, Israel');
assert.equal((await run('31,8','34,65',{...data,city:'Ashqelon'})).value,'Ashkelon, Israel');
assert.equal((await run('31.8','34.65',{...data,countryName:''})).value,'Ashdod');
assert.equal((await run('31.8','34.65',{...data,city:'',locality:'Ashdod'})).value,'Ashdod, Israel');
for(const change of [{latitude:0},{lookupSource:'ip'},{city:'',locality:''}])assert.equal((await run('31.8','34.65',{...data,...change})).value,'Location unavailable');
for(const fail of ['network','http','sync'])assert.equal((await run('31.8','34.65',data,fail)).value,'Location unavailable');
for(const v of ['', '${widgy.map_latitude_max5}', '100']){const r=await run(v,'34.65',data);assert.equal(r.value,'Location unavailable');assert.equal(r.urls.length,0);}
const cached=await run('31.8','34.65',data);vm.runInContext('('+directLocationLabel.toString()+')(31.8,34.65)',cached.context);assert.equal(cached.urls.length,1);
const input=JSON.parse(fs.readFileSync('work/private/current.json')), output=withDirectLocationLabel(input);
// Reverse the narrowly scoped changes, proving all map/weather/Health data and geometry remain identical.
const restored=structuredClone(output);
restored['36']=input['36'];
for(const id of [246,247])restored['1'].find(n=>n.d0===id)['1']=input['1'].find(n=>n.d0===id)['1'];
assert.deepEqual(restored,input);
for(const id of [245,195])assert.deepEqual(output['1'].find(n=>n.d0===id),input['1'].find(n=>n.d0===id));
console.log('PASS: valid/missing/mismatched GPS, HTTP/network errors, city-only, spelling, cache and preserved widget');
