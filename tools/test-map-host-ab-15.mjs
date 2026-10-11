import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
const origin=process.env.TEST_ORIGIN;
const key=JSON.parse(fs.readFileSync('work/private/map-host-ab-15-key.json')).key;
const localJS=fs.readFileSync('tools/map-host-ab-15.js','utf8');
const code=origin?await (await fetch(origin+'/tools/map-host-ab-15.js')).text():localJS;
assert.equal(code,localJS,'Published script mismatch');
function element(){return {disabled:true,hidden:true,value:'',textContent:'',classList:{toggle(){}},listeners:{},addEventListener(k,fn){this.listeners[k]=fn;},focus(){},select(){},setSelectionRange(){}};}
async function run(testKey,failA=false){
 const cards=['A','B'].map(name=>{const elements=Object.fromEntries(['button','.status','.manual','textarea','.select'].map(s=>[s,element()]));return {dataset:{copy:name},elements,querySelector:s=>elements[s]};});
 let copied='';
 const ctx=vm.createContext({document:{querySelectorAll:()=>cards,execCommand:()=>false},location:{hash:'#key='+testKey},URLSearchParams,Uint8Array,atob,crypto:webcrypto,TextEncoder,TextDecoder,Response,Blob,DecompressionStream,navigator:{clipboard:{writeText:async s=>{copied=s;}}},fetch:async path=>{
  if(failA&&path.includes('-A.'))return new Response('',{status:503});
  if(origin)return fetch(new URL(path,origin+'/tools/'));
  return new Response(fs.readFileSync('tools/'+path.replace('./','')));
 }});
 vm.runInContext(code,ctx);
 const until=Date.now()+15000;
 while(cards.some(c=>!c.elements['.status'].textContent)&&Date.now()<until)await new Promise(r=>setTimeout(r,20));
 for(const card of cards){
  const name=card.dataset.copy,success=testKey===key&&!(failA&&name==='A');
  assert.equal(card.elements.button.disabled,!success,`Unexpected copy state ${name}`);
  if(success){await card.elements.button.listeners.click();assert.equal(copied,fs.readFileSync(`work/private/Map_Host_${name}.json`,'utf8'),'Clipboard mismatch');}
 }
}
await run(key);await run('A'.repeat(43));await run(key,true);
console.log(JSON.stringify({source:origin?'live':'local',fullClipboardCopies:true,wrongKeyBlocked:true,independentLoadFailure:true}));
