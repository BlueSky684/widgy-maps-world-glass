import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {cityFetchDiagnostic} from './widgy-city-fetch-diagnostic.mjs';

// Simulated responses only: provider calls must originate on the user's phone.
async function run(code, fetchImpl) {
  const values=[],requests=[];
  let complete;
  const finished=new Promise(resolve=>{complete=resolve;});
  vm.runInNewContext(code,{
    fetch:url=>{requests.push(url);return fetchImpl(url);},
    sendToWidgy:value=>{values.push(value);complete();},
  });
  await finished;
  for(let i=0;i<10;i++)await Promise.resolve();
  assert.equal(values.length,1);
  return {value:values[0],requests};
}
const widget=JSON.parse(readFileSync(new URL('./Widgy_Fetch_Image_Check.json',import.meta.url)));
assert.equal(widget['1'].filter(n=>n.z==='5').length,4);
assert.equal(new Set(widget['1'].map(n=>n.d0)).size,widget['1'].length);
const allScripts=[...widget['1'],...widget['36'].map(v=>v['3'])].flatMap(n=>n['66']||[]).filter(e=>e['5']==='Javascript');
for(const entry of allScripts) {
  const code=entry['10'].replace(/"\$\{widgy\.([^}]+)\}"/g,(_,name)=>JSON.stringify(name==='fetch_latitude'?'12.34567':'-123.45678'));
  const result=await run(code,async url=>({ok:true,status:200,json:async()=>
    url.includes('bigdatacloud.net')?{lookupSource:'coordinates',latitude:12.34567,longitude:-123.45678,city:'Test City'}:{probe:'WIDGY_FETCH_OK'}}));
  assert(typeof result.value==='string'&&result.value.length>0);
  assert(result.requests.length<=1);
  if(entry['10'].includes('cityFetchDiagnostic'))assert.equal(result.value,'HTTP: 200 | source: coordinates\nCity: [Test City]\nGPS match: YES | JSON received');
}
const diagnostic=(lat='12.34567',lon='-123.45678')=>cityFetchDiagnostic.toString()+'\ncityFetchDiagnostic('+JSON.stringify(lat)+','+JSON.stringify(lon)+');';
for(const [fetchImpl,expected] of [
  [async()=>({ok:false,status:402}),'FAILED | HTTP: 402 | Error'],
  [async()=>({ok:true,status:200,json:async()=>{throw new SyntaxError('secret URL');}}),'FAILED | HTTP: 200 | SyntaxError'],
  [async()=>{throw new TypeError('secret URL');},'FAILED | HTTP: ? | TypeError'],
  [()=>{throw new TypeError('secret URL');},'FETCH CALL FAILED | TypeError'],
]) {
  const result=await run(diagnostic(),fetchImpl);
  assert.equal(result.value,expected);
  assert(!result.value.includes('secret'));
}
for(const lat of ['', '91', '${widgy.missing}']) {
  const result=await run(diagnostic(lat),()=>{throw Error('Must not fetch');});
  assert.equal(result.value,'INPUT MISSING / INVALID');assert.equal(result.requests.length,0);
}
for(const variable of widget['36'].filter(v=>v['1'].startsWith('fetch_')))assert.equal(variable['3']['28'].a[0].a,11);
console.log('Generated direct and variable scripts completed once with simulated responses. HTTP/network/JSON failures and invalid input produce readable status. No live geocoding calls.');
