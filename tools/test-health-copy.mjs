import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {webcrypto} from 'node:crypto';
import {formatJSONLines} from './json-copy-lines.js';
const expected=JSON.parse(fs.readFileSync('work/private/Widgy_Health_Premium_1.json'));
const key=JSON.parse(fs.readFileSync('work/private/copy-key.json')).key;
const script=fs.readFileSync('tools/widgy-health-premium-copy.js','utf8').replace(/^import .*;\n/,'');
async function trial(keyText){
 const nodes=new Map();let copied='';const el=id=>{if(!nodes.has(id))nodes.set(id,{disabled:true,checked:id==='multiline',hidden:id==='manual',events:{},textContent:'',value:'',classList:{toggle(){}},addEventListener(k,f){this.events[k]=f;},focus(){},select(){},setSelectionRange(){}});return nodes.get(id);};
 const context=vm.createContext({document:{getElementById:el,execCommand:()=>true},location:{hash:keyText?'#key='+keyText:''},URLSearchParams,Uint8Array,atob,TextEncoder,TextDecoder,Response,Blob,DecompressionStream,crypto:webcrypto,formatJSONLines,navigator:{clipboard:{writeText:async s=>{copied=s;}}},fetch:async url=>new Response(fs.readFileSync('tools/'+url.replace('./','')))});
 await vm.runInContext(script.replace(/load\(\);\s*$/,'load();'),context);
 return {el,context,get copied(){return copied;}};
}
const ok=await trial(key);assert.equal(ok.el('copy').disabled,false);assert.equal(ok.el('multiline').disabled,false);
await ok.el('copy').events.click();assert.deepEqual(JSON.parse(ok.copied),expected);assert(ok.copied.split('\n').length>1000);
const lines=ok.copied.split('\n').length;
ok.el('multiline').checked=false;ok.el('multiline').events.change();await ok.el('copy').events.click();assert.deepEqual(JSON.parse(ok.copied),expected);
ok.context.navigator.clipboard.writeText=async()=>{throw Error('denied')};await ok.el('copy').events.click();assert.deepEqual(JSON.parse(ok.el('text').value),expected);
for(const keyText of ['', 'A'.repeat(43)]){const bad=await trial(keyText);assert.equal(bad.el('copy').disabled,true);assert(!bad.copied);}
console.log(JSON.stringify({passed:true,mode:'DOM harness with real WebCrypto',multilineLines:lines,roundTrip:true,wrongKeyBlocked:true,missingKeyBlocked:true,clipboardFallback:true}));
