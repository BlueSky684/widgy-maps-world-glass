import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {buildCityMapScript} from './widgy-city-map-script.mjs';
import {resolveLocation} from '../lib/home-map-day-night.js';

// All fetch responses are simulated. Never call the client-only provider here.
const endpoint = 'https://example.test/api/night-map?mode=live&width=3306&presentation=glass';
const inputs = {map_latitude_max5:'12.34567', map_longitude_max5:'-123.45678', Latitude:'12.3', Longitude:'-123.5'};
const data = {latitude:12.34567, longitude:-123.45678, lookupSource:'coordinates', city:'Test City'};
async function run({enabled = true, source, replacements = {}, fetchImpl = async () => ({ok:true,status:200,json:async()=>({...data})})} = {}) {
  const values = {...inputs, ...replacements}, requests = [], outputs = [];
  const code = (source || buildCityMapScript(endpoint, {enabled})).replace(/"\$\{widgy\.([^}]+)\}"/g, (_, name) => JSON.stringify(values[name]));
  let done;
  const completed = new Promise(resolve => {done = resolve;});
  vm.runInNewContext(code, {
    sendToWidgy: output => {outputs.push(output);done();},
    fetch: url => {requests.push(url);return fetchImpl(url);},
  });
  const initialRequests=requests.length;
  await completed;
  // Flush the complete success/catch chain to detect double delivery.
  for (let i=0; i<10; i++) await Promise.resolve();
  assert.equal(outputs.length, 1);
  return {requests, initialRequests, url:new URL(outputs[0])};
}
let count = 0;
const success = await run();
assert.equal(success.requests.length, 1);
assert.equal(success.initialRequests,1,'Start native fetch during initial evaluation, before Promise jobs');
const request = new URL(success.requests[0]);
assert.equal(request.origin, 'https://api.bigdatacloud.net');
assert.equal(request.searchParams.get('latitude'), inputs.map_latitude_max5);
assert.equal(request.searchParams.get('longitude'), inputs.map_longitude_max5);
assert.equal(success.url.searchParams.get('city'), data.city);
assert.equal(success.url.searchParams.get('lat'), inputs.map_latitude_max5);
assert.equal(success.url.searchParams.get('lon'), inputs.map_longitude_max5);
assert.equal(resolveLocation(success.url).city, data.city);count++;
const off = await run({enabled:false});
assert.equal(off.requests.length, 0);
assert.equal(off.url.searchParams.get('lat'), inputs.Latitude);
assert.equal(off.url.searchParams.get('city'), null);count++;
for (const replacements of [
  {map_latitude_max5:''}, {map_longitude_max5:'${widgy.missing}'},
  {map_latitude_max5:'91'}, {map_longitude_max5:'181'},
  {map_latitude_max5:'NaN'}, {map_latitude_max5:'null'},
]) {
  const result=await run({replacements});
  assert.equal(result.requests.length, 0);
  assert.equal(resolveLocation(result.url, {'x-vercel-ip-latitude':'1','x-vercel-ip-longitude':'2'}), null);count++;
}
for (const [lat,lon] of [['0','0'],['-12,34567','123,45678'],['90','-180']]) {
  const result=await run({replacements:{map_latitude_max5:lat,map_longitude_max5:lon}});
  assert.equal(result.requests.length, 1);
  assert.equal(result.url.searchParams.get('lat'), String(Number(lat.replace(',','.'))));count++;
}
for (const fetchImpl of [
  async()=>{throw Error('offline');},
  ()=>{throw Error('sync fetch failure');},
  async()=>({ok:false,status:402,json:async()=>data}),
  async()=>({status:503,json:async()=>data}),
  async()=>({ok:true,status:200,json:async()=>{throw Error('bad JSON');}}),
  ...[null, {}, {...data,lookupSource:'ip address'}, {...data,lookupSource:'ipGeolocation'},
    {...data,latitude:13}, {...data,longitude:-120}, {...data,city:''},
    {...data,city:42}, {...data,city:undefined,locality:'Not a city'}]
    .map(body=>async()=>({ok:true,status:200,json:async()=>body})),
]) {
  const result=await run({fetchImpl});
  assert.equal(result.url.searchParams.get('city'), null);
  assert.equal(result.url.searchParams.get('lat'), inputs.map_latitude_max5);count++;
}
const encoded=await run({fetchImpl:async()=>({ok:true,json:async()=>({...data,city:' A&B / "Test" <Town>\n '})})});
assert.equal(encoded.url.searchParams.get('city'), 'A&B / "Test" <Town>');count++;
const original=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass.json',import.meta.url)));
const review=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_JS_City_Review.json',import.meta.url)));
assert.deepEqual(review['1'], original['1']);
assert.deepEqual(review['2'], original['2']);
const mapScript=review['36'].find(v=>v['1']==='map_request')['3']['66'][0];
assert.equal(mapScript['6'],'Async + No main()');
assert(mapScript['10'].includes(',false,'));
assert(!mapScript['10'].includes('${widgy.City}'));
for(const name of ['map_latitude_max5','map_longitude_max5']) {
  const variable=review['36'].find(v=>v['1']===name);
  assert.equal(variable['3']['28'].a[0].a,11);
  assert(variable['3']['66'].every(e=>e['5']==='Location'));
}
const active=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_JS_City_R2.json',import.meta.url)));
assert.deepEqual(active['1'],original['1']);
assert.deepEqual(active['2'],original['2']);
const consumerIndex=active['36'].findIndex(v=>v['1']==='map_request');
const allNames=new Set(active['36'].map(v=>v['1']));
for(const match of JSON.stringify(active).matchAll(/\$\{widgy\.([^}]+)\}/g))assert(allNames.has(match[1]),'Unknown variable '+match[1]);
for(const name of ['map_latitude_max5','map_longitude_max5','Latitude','Longitude']) {
  const index=active['36'].findIndex(v=>v['1']===name);
  assert(index>=0&&index<consumerIndex,'Define coordinate input before map URL consumer: '+name);
}
const probe=JSON.parse(readFileSync(new URL('./Widgy_Fetch_Image_Check.json',import.meta.url)));
const body=structuredClone(active['36'][consumerIndex]['3']);
const provenBody=structuredClone(probe['36'].find(v=>v['1']==='async_fetch_url')['3']);
for(const obj of [body,provenBody]){delete obj['66'];delete obj.s;}
assert.deepEqual(body,provenBody,'Use the phone-verified async URL body');
const activeScript=active['36'].find(v=>v['1']==='map_request')['3']['66'][0];
assert.equal(activeScript['6'],'Async + No main()');
const exported=await run({source:activeScript['10']});
assert.equal(exported.requests.length,1);
assert.equal(exported.initialRequests,1);
assert.equal(exported.url.searchParams.get('city'),data.city);
assert.equal(exported.url.searchParams.get('lat'),inputs.map_latitude_max5);
assert.equal(exported.url.searchParams.get('presentation'),'glass');
assert.equal(exported.url.searchParams.get('width'),'3306');
assert.equal(exported.url.hostname,'widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app');
count++;
console.log(`${count} simulated runtime cases passed, including the actual R2 widget script. Direct native fetch kickoff, coordinate dependency order, phone-verified variable body, exact visual layers, full precision and one completion verified. R2 dashboard integration still needs phone verification.`);
