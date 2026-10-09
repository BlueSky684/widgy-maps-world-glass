import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {formatJSONLines} from './json-copy-lines.js';

const tokens = s => s.match(/"(?:\\.|[^"\\])*"|true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}\[\]:,]/g);
const sample = JSON.stringify({city:'Ashkelon, Israel',quoted:'A "quote" \\ end',script:'function main() {\n return "\\n";\n}',unicode:'עברית 日本 😀',nested:[null,true,false,{},[],[1,2]],url:'https://example.test/?a=1&b=2',encoded:'X'.repeat(14000)});
for(const value of [sample, '{"a":-0,"b":1.2300e+09,"c":9007199254740993,"escape":"\\u0041","last":"backslash\\\\"}', '{\n "a": [1,2,3], "b":"line\\nline"\n}', '{}','[]','"top-level string"','123']) {
  for (const width of [1,7,160]) {
    const result=formatJSONLines(value,width);
    assert.deepEqual(JSON.parse(result),JSON.parse(value));
    assert.deepEqual(tokens(result),tokens(value),'Token spelling, escapes, order and numbers must be exact');
    assert(!result.endsWith('\n') || value.endsWith('\n'),'Do not add a trailing empty paragraph');
  }
}
assert.throws(()=>formatJSONLines(null));assert.throws(()=>formatJSONLines('{}',0));

const [sourcePath='../outputs/Widgy_Calendar_City_Country_1.json',prefix='widgy-calendar-city-country',keyPath='../calendar-city-country-copy-key.json',revision='1']=process.argv.slice(2);
const source=readFileSync(sourcePath,'utf8');
const formatted=formatJSONLines(source);
assert.deepEqual(JSON.parse(formatted),JSON.parse(source));
assert.equal(formatted.replaceAll('\n',''),source,'The real compact export changes only by inserted LF whitespace');
assert.deepEqual(tokens(formatted),tokens(source));
const key='key='+JSON.parse(readFileSync(keyPath,'utf8')).key;
const envelope=readFileSync('tools/'+prefix+'-'+revision+'.enc.json','utf8');
const script=readFileSync('tools/'+prefix+'-copy.js','utf8').replace(/^import .*;\n/gm,'');
async function run(hash,{corrupt=false,deny=false,legacy=false}={}){
  const elements=new Map();
  const el=id=>{
    if(!elements.has(id))elements.set(id,{checked:id==='multiline',disabled:true,hidden:true,textContent:'',value:'',events:{},classList:{toggle(){}},addEventListener(n,fn){this.events[n]=fn},focus(){},select(){},setSelectionRange(a,b){this.selection=[a,b]}});
    return elements.get(id);
  };
  let copied='',requests=0,resolveLoad;
  const done=new Promise(r=>resolveLoad=r);
  const context={formatJSONLines,document:{getElementById:el,execCommand(){if(legacy)copied=el('text').value;return legacy}},navigator:{clipboard:{async writeText(v){if(deny)throw Error('denied');copied=v}}},location:{hash:'#'+hash},URLSearchParams,Uint8Array,atob,TextEncoder,TextDecoder,Blob,Response,DecompressionStream,crypto:webcrypto,fetch:async()=>{requests++;const value=JSON.parse(envelope);if(corrupt)value.data=(value.data[0]==='A'?'B':'A')+value.data.slice(1);return new Response(JSON.stringify(value))},resolveLoad};
  vm.runInNewContext(script.replace(/load\(\);\s*$/,'load().finally(resolveLoad);'),context);await done;
  return {el,get requests(){return requests;},async copy(){await el('copy').events.click();return copied;},toggle(on){el('multiline').checked=on;el('multiline').events.change();}};
}
const valid=await run(key);assert.equal(valid.el('copy').disabled,false);assert.equal(valid.el('multiline').disabled,false);
assert.equal(await valid.copy(),formatted,'Default green button copies complete multiline JSON');
valid.toggle(false);assert.equal(await valid.copy(),source,'Original compact copy remains exact');
valid.toggle(true);assert.equal(await valid.copy(),formatted);assert.equal(valid.requests,1,'No network request during copy/toggle');
for(const hash of ['', 'key='+'A'.repeat(43)])assert.equal((await run(hash)).el('copy').disabled,true);
assert.equal((await run(key,{corrupt:true})).el('copy').disabled,true);
const fallback=await run(key,{deny:true});await fallback.copy();assert.equal(fallback.el('manual').hidden,false);assert.equal(fallback.el('text').value,formatted);assert.deepEqual(fallback.el('text').selection,[0,formatted.length]);
fallback.toggle(false);assert.equal(fallback.el('text').value,source);await fallback.copy();assert.deepEqual(fallback.el('text').selection,[0,source.length]);
const legacy=await run(key,{deny:true,legacy:true});assert.equal(await legacy.copy(),formatted);
const lines=formatted.split('\n'),lengths=lines.map(x=>x.length).sort((a,b)=>a-b);
console.log(JSON.stringify({originalChars:source.length,formattedChars:formatted.length,lineCount:lines.length,medianLineChars:lengths[Math.floor(lengths.length/2)],maxLineChars:lengths.at(-1),identicalJSONTokens:true,identicalWidget:true,embeddedStringsUntouched:true,originalCopyAvailable:true,greenButtonAndBothFallbacksVerified:true,keyAndTamperGates:true,nativeWidgyVisibilityUnverified:true}));
