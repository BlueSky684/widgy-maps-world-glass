import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {webcrypto} from 'node:crypto';
const origin=process.env.TEST_ORIGIN;
const key=JSON.parse(fs.readFileSync('work/private/map-host-ab-15-key.json')).key;
const a=JSON.parse(fs.readFileSync('work/private/Map_Host_A.json'));
const cBytes=fs.readFileSync('work/private/Map_Refresh_C.json','utf8'),c=JSON.parse(cBytes);
const source=w=>w['36'].find(v=>v['1']==='map_request')['3']['66'][0];
const template=source(c)['25'];
const restore=structuredClone(c);restore['3']=a['3'];restore['4']=a['4'];source(restore)['25']=source(a)['25'];
assert(isDeepStrictEqual(restore,a),'C must only change the map URL and identifying metadata');
assert.equal(c['3'],'C');assert(template.startsWith(source(a)['25']+'?'));
assert.deepEqual([...new URL(template).searchParams.keys()],['lat','lon','t']);
const values=[['0','0'],['-12.34567','145.12345'],['85','-180'],['','']];
const resolve=(lat,lon,t)=>template.replace('${widgy.map_latitude_max5}',lat).replace('${widgy.map_longitude_max5}',lon).replace('${widgy.calendar_refresh_minute}',String(t));
for(const [lat,lon] of values){
 const first=new URL(resolve(lat,lon,100)),next=new URL(resolve(lat,lon,101));
 assert.equal(first.pathname,new URL(source(a)['25']).pathname);
 assert.equal(first.searchParams.get('lat'),lat);assert.equal(first.searchParams.get('lon'),lon);
 assert.notEqual(first.href,next.href);assert.equal(first.origin,new URL(source(a)['25']).origin);
}
const localJS=fs.readFileSync('tools/map-host-ab-15.js','utf8');
const code=origin?await (await fetch(origin+'/tools/map-host-ab-15.js')).text():localJS;
assert.equal(code,localJS,'Published controller mismatch');
if(origin){const page=await fetch(origin+'/tools/map-refresh-c-15.html');assert(page.ok);const html=await page.text();assert(html.includes('data-copy="C"'));assert(html.includes('./map-host-ab-15.js'));}
function element(){return {disabled:true,hidden:true,value:'',textContent:'',classList:{toggle(){}},listeners:{},addEventListener(k,fn){this.listeners[k]=fn;},focus(){},select(){},setSelectionRange(){}};}
async function run(testKey,{fail=false,clipboardFails=false}={}){
 const elements=Object.fromEntries(['button','.status','.manual','textarea','.select'].map(s=>[s,element()]));
 const card={dataset:{copy:'C'},elements,querySelector:s=>elements[s]};let copied='';
 const ctx=vm.createContext({document:{querySelectorAll:()=>[card],execCommand:()=>false},location:{hash:'#key='+testKey},URLSearchParams,Uint8Array,atob,crypto:webcrypto,TextEncoder,TextDecoder,Response,Blob,DecompressionStream,navigator:{clipboard:{writeText:async s=>{if(clipboardFails)throw Error('blocked');copied=s;}}},fetch:async path=>{
  assert.equal(path,'./map-host-ab-15-C.enc.json');
  if(fail)return new Response('',{status:503});
  return origin?fetch(new URL(path,origin+'/tools/')):new Response(fs.readFileSync('tools/'+path.replace('./','')));
 }});
 vm.runInContext(code,ctx);const until=Date.now()+15000;
 while(!elements['.status'].textContent&&Date.now()<until)await new Promise(r=>setTimeout(r,20));
 const success=testKey===key&&!fail;assert.equal(elements.button.disabled,!success);
 if(success){await elements.button.listeners.click();if(clipboardFails){assert.equal(elements['.manual'].hidden,false);assert(elements.textarea.value===cBytes,'Manual copy must contain complete C');}else assert(copied===cBytes,'Clipboard must contain complete C');}
}
await run(key);await run('A'.repeat(43));await run('');await run(key,{fail:true});await run(key,{clipboardFails:true});
console.log(JSON.stringify({source:origin?'live':'local',onlyMapURLAndMetadataChanged:true,completeClipboard:true,manualFallback:true,wrongOrMissingKeyBlocked:true,failedLoadBlocked:true}));
