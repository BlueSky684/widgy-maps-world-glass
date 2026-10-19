import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {formatJSONLines} from './json-copy-lines.js';

const [widgetPath, keyPath] = process.argv.slice(2);
assert(widgetPath && keyPath, 'Supply the private RC1.1 JSON and copy-key paths');
const expected = JSON.parse(fs.readFileSync(widgetPath));
const keyText = fs.readFileSync(keyPath,'utf8');
const nodes = new Map();
function element(id) {
  if (!nodes.has(id)) nodes.set(id, {
    disabled:true, checked:id==='multiline', hidden:id==='manual', open:false,
    textContent:'', value:'', error:false, events:{},
    classList:{toggle(_, value){nodes.get(id).error = value;}},
    addEventListener(type, handler){(this.events[type] ??= []).push(handler);},
    focus(){}, select(){}, setSelectionRange(){}
  });
  return nodes.get(id);
}
let clipboard = '', reads = 0;
const clipboardAPI = {
  writeText:async value => {clipboard = value;},
  readText:async () => {reads++; return clipboard;}
};
const context = vm.createContext({
  document:{getElementById:element,execCommand:()=>true},
  location:{hash:'#key='+keyText},URLSearchParams,Uint8Array,atob,
  TextEncoder,TextDecoder,Response,Blob,DecompressionStream,crypto:webcrypto,
  formatJSONLines,navigator:{clipboard:clipboardAPI},
  fetch:async url => new Response(fs.readFileSync('tools/'+url.replace('./','').split('?')[0]))
});
const verification = fs.readFileSync('tools/copy-verification.js','utf8').replace(/^export /gm,'');
const controller = fs.readFileSync('tools/widgy-weather-rc11-copy.js','utf8').replace(/^import .*;\n/gm,'');
await vm.runInContext(verification+'\n'+controller,context);
async function emit(id,type='click') {
  for (const handler of element(id).events[type] || []) await handler();
}
const verified = () => element('verify-status').textContent.startsWith('✓');
assert.equal(element('copy').disabled,false);
await emit('copy');
assert.deepEqual(JSON.parse(clipboard),expected);
assert.equal(reads,0,'Loading/copying must not read the clipboard automatically');
await emit('verify-copy'); assert(verified());
const full = clipboard;
clipboard = full.slice(0,-1);
await emit('verify-copy'); assert(!verified()); assert(element('verify-status').error);
clipboard = full.replace('Widgy Weather RC1.1','Widgy Weather RC1');
await emit('verify-copy'); assert(!verified());
clipboard = full.replace(/\n/g,'\r\n');
await emit('verify-copy'); assert(verified());
clipboardAPI.readText = async () => {throw Error('permission denied');};
await emit('verify-copy'); assert(!verified()); assert(element('verify-manual').open);
element('verify-text').value = full;
await emit('verify-paste'); assert(verified());
element('verify-text').value = '';
await emit('verify-text','input'); assert(!verified());
await emit('verify-paste'); assert(!verified()); assert(element('verify-status').error);
// A format change during a pending clipboard read must not produce stale success.
let finishRead;
clipboardAPI.readText = () => new Promise(resolve => {finishRead = resolve;});
const pending = emit('verify-copy');
element('multiline').checked = false;
await emit('multiline','change');
finishRead(full); await pending; assert(!verified());
await emit('copy'); assert.deepEqual(JSON.parse(clipboard),expected);
clipboardAPI.readText = async () => clipboard;
await emit('verify-copy'); assert(verified());
const html = fs.readFileSync('tools/widgy-weather-rc11-copy.html','utf8');
for (const id of ['verify-copy','verify-status','verify-manual','verify-text','verify-paste']) assert(html.includes(`id="${id}"`));
console.log('PASS: full encrypted payload copied; exact text, truncation, wrong version, CRLF, denied clipboard access, pasted text, and stale-format checks; no automatic clipboard reads.');
