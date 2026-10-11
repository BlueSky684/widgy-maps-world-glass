// Exercise the actual browser module, WebCrypto and click handler without
// logging the decrypted widget or its account-specific sources.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {formatJSONLines} from './json-copy-lines.js';

const base=process.env.TEST_ORIGIN;
const source=base?await (await fetch(base+'/tools/widgy-health-premium-copy.js?v=14')).text():fs.readFileSync('tools/widgy-health-premium-copy.js','utf8');
const key=JSON.parse(fs.readFileSync('work/private/copy-key.json')).key;
const expected=JSON.parse(fs.readFileSync('work/private/Widgy_Health_Premium_1.json'));
const envelope=base?await (await fetch(base+'/tools/widgy-health-premium-1.enc.json?verify='+Date.now())).json():JSON.parse(fs.readFileSync('tools/widgy-health-premium-1.enc.json'));
const html=base?await (await fetch(base+'/tools/widgy-health-premium-copy.html?verify='+Date.now())).text():fs.readFileSync('tools/widgy-health-premium-copy.html','utf8');
assert(html.includes('widgy-health-premium-copy.js?v=14'),'Missing cache-busted copy module');
assert(html.includes('Weather 14'));
let clipboard='',manualMode=false;
const nodes=Object.fromEntries(['copy','status','manual','text','multiline','select'].map(id=>[id,{disabled:true,checked:true,hidden:true,value:'',handlers:{},addEventListener(t,f){this.handlers[t]=f},classList:{toggle(){}},focus(){},select(){},setSelectionRange(){}}]));
const context={formatJSONLines,console,URLSearchParams,location:{hash:'#key='+key},crypto:webcrypto,atob,TextEncoder,TextDecoder,Response,Blob,DecompressionStream,Uint8Array,
 document:{getElementById:id=>nodes[id],execCommand:()=>false},navigator:{clipboard:{writeText:async s=>{if(manualMode)throw Error('clipboard_denied');clipboard=s;}}},fetch:async()=>({ok:true,json:async()=>envelope})};
vm.runInNewContext(source.replace(/^import .*?;\s*/,'').replace(/load\(\);\s*$/,'globalThis.ready=load();'),context);
await context.ready;
assert.equal(nodes.copy.disabled,false,'Copy page failed to decrypt or validate the widget');
await nodes.copy.handlers.click();
assert(isDeepStrictEqual(JSON.parse(clipboard),expected),'Copied JSON changed');assert(clipboard.split('\n').length>1000);
nodes.multiline.checked=false;nodes.multiline.handlers.change();await nodes.copy.handlers.click();
assert.equal(clipboard,JSON.stringify(expected));
manualMode=true;await nodes.copy.handlers.click();assert.equal(nodes.manual.hidden,false);assert.equal(nodes.text.value,clipboard);
console.log(JSON.stringify({live:Boolean(base),copiedWidget:expected['3'],bytes:envelope.bytes,sha256:envelope.sha256,multiline:true,compact:true,manualFallback:true}));
