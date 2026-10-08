import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {buildCityMapScript} from './widgy-city-map-script.mjs';
import {withCityTimingDiagnostic} from './city-timing-diagnostic.js';
import {readCityTimingTrace} from '../lib/map-request-key-diagnostics.js';

const source = buildCityMapScript('https://example.test/api/night-map?width=3306&atlas=r6&presentation=glass',
  {enabled:true,reuseSeconds:60,cityReuseSeconds:3600});
const input = process.argv[2] ? JSON.parse(readFileSync(process.argv[2],'utf8')) :
  {'3':'Control','4':'Control description','1':[{'z':'13','1':[]}], '36':[
    {'0':'map-id','1':'map_request','3':{'66':[{'5':'Javascript','6':'Async + No main()','10':source}]}}]};
const get = w => w['36'].find(v=>v['1']==='map_request')['3']['66'][0];
const snapshot = structuredClone(input), output = withCityTimingDiagnostic(input), restored = structuredClone(output);
restored['3']=input['3'];restored['4']=input['4'];get(restored)['10']=get(input)['10'];
assert.deepEqual(restored,input,'Only map script body and identifying metadata change');
assert.deepEqual(input,snapshot,'Input remains immutable');
const original = get(input)['10'], measured = get(output)['10'];
const initial = 1791472200000;
async function run(code, scenario) {
  let now=initial,calls=0; const sent=[];
  const context={Date:{now:()=>now},sendToWidgy:url=>sent.push(url),
    fetch(){calls++; return Promise.resolve().then(()=>{
      now+=scenario.duration??2300;
      if(scenario.fail)throw Error('mock failure');
      return {ok:true,json:async()=>scenario.empty?{}:{latitude:0,longitude:0,city:'Example',lookupSource:'coordinates'}};
    });}};
  if(scenario.memory)context.__homeGlassCityV1={latitude:0,longitude:0,city:'Example',time:initial-1000};
  const values={map_latitude_max5:scenario.invalid?'':'0',map_longitude_max5:'0',Latitude:'0',Longitude:'0'};
  code=code.replace(/\$\{widgy\.([^}]+)\}/g,(_,name)=>{assert(name in values);return values[name];});
  vm.runInNewContext(code,context);
  for(let i=0;i<12;i++)await Promise.resolve();
  assert.equal(sent.length,1,'One callback only');
  assert.equal(calls,scenario.memory||scenario.invalid?0:1,'No diagnostic fetch added');
  return {url:new URL(sent[0]),calls};
}
for(const [scenario,path,duration] of [
  [{},'fetch',2300],[{memory:true},'memory',0],[{fail:true},'failed',2300],
  [{empty:true},'empty',2300],[{invalid:true},'none',0],[{duration:-10},null,null],
  [{duration:3600001},null,null]
]) {
  const a=await run(original,scenario),b=await run(measured,scenario);
  assert.equal(a.calls,b.calls);
  assert.deepEqual(readCityTimingTrace(b.url),path?{clientCityPath:path,clientCityScriptMs:duration}:{});
  b.url.searchParams.delete('city_trace_v1');assert.equal(b.url.href,a.url.href,'Original complete map URL retained');
}
for(const value of ['fetch:-1','fetch:NaN','fetch:3600001','secret:123','fetch:1&city_trace_v1=memory:2','fetch:1PRIVATE'])
  assert.deepEqual(readCityTimingTrace(new URL('https://example.test/?city_trace_v1='+value)),{});
const bad=structuredClone(input);get(bad)['10']=get(bad)['10'].replace('var finished = false','var finished = true');
assert.throws(()=>withCityTimingDiagnostic(bad),/Unexpected map script/);
console.log('PASS: exact one-script/metadata delta; callback and original URL preserved; no new fetch; measured fetch/cache/failure/empty/invalid-GPS outcomes; clock anomalies ignored; private trace parser accepts only bounded numbers and fixed labels.');
