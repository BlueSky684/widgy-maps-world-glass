// Exercise the actual browser copy controller using a supplied private handoff.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';
import {formatJSONLines} from './json-copy-lines.js';
const [input, privateDir] = process.argv.slice(2);
assert(privateDir);
const widget = JSON.parse(readFileSync(input));
const envelope = JSON.parse(readFileSync(new URL('./widgy-weather15-google-soft-lime.enc.json',import.meta.url)));
const controller = readFileSync(new URL('./widgy-weather15-google-soft-lime-copy.js',import.meta.url),'utf8').replace(/^import[^\n]+\n/, '');
async function check(key, valid, body=envelope) {
  const nodes = Object.fromEntries(['copy','download','status','manual','text','multiline','select'].map(id=>[id,
    {disabled:true,checked:id==='multiline',hidden:true,classList:{toggle(){}},handlers:{},addEventListener(k,f){this.handlers[k]=f;}}]));
  let copied=null;
  const ctx={document:{getElementById:id=>nodes[id]},location:{hash:'#key='+key},crypto:webcrypto,TextEncoder,TextDecoder,
    Response,Blob,DecompressionStream,URLSearchParams,Uint8Array,atob,formatJSONLines,
    navigator:{clipboard:{writeText:async value=>{copied=value;}}},
    fetch:async (url,options)=>{assert.equal(url,'./widgy-weather15-google-soft-lime.enc.json?v=1');assert.equal(options.credentials,'omit');return {ok:true,json:async()=>body};}};
  await vm.runInNewContext(controller,ctx);
  assert.equal(nodes.copy.disabled,!valid);
  if(valid){
    await nodes.copy.handlers.click(); assert.deepEqual(JSON.parse(copied),widget); assert(copied.includes('\n'));
    nodes.multiline.checked=false; nodes.multiline.handlers.change();
    await nodes.copy.handlers.click(); assert.equal(copied,JSON.stringify(widget));
  }
}
const key=readFileSync(resolve(privateDir,'copy-key.txt'),'utf8');
await check(key,true); await check('invalid',false); await check('A'.repeat(43),false);
await check(key,false,{...envelope,sha256:'0'.repeat(64)});
console.log(JSON.stringify({copyController:'decrypt, integrity, multiline, compact, clipboard, bad key and corrupt envelope passed',nativeWidgyVerified:false}));
