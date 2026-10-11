import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {formatJSONLines} from '../json-copy-lines.js';

const root=new URL('../../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root));
const raw=read('tools/Widgy_Device_Glass_1.json').toString();
const w=JSON.parse(raw),source=JSON.parse(read('tools/device-glass/native-source.json'));
const layers=w['1'],find=id=>layers.find(n=>n.d0===id);
assert.equal(w['3'],'Widgy Device Glass 1');assert.equal(w['6'],source['6']);
assert.equal(layers.length,13);assert.equal(new Set(layers.map(n=>n.d0)).size,13);
assert.equal(layers.filter(n=>n.z==='5').length,1);
assert.equal(layers.filter(n=>n.z==='9').length,1);
assert.equal(layers.filter(n=>n.z==='1').length,9);
assert.equal(layers.filter(n=>n.z==='11').length,1);
assert.equal(layers.filter(n=>n.z==='4').length,1);
const expected=new Set(['System Info/Battery Level','System Info/Device Model','System Info/iOS Version','System Network/WiFi Status','System Info/Bluetooth Status','System Memory/Free Disk Space','System Info/Battery Hours Remaining']);
assert.deepEqual(new Set(layers.flatMap(n=>(n['66']||[]).map(s=>`${s['5']}/${s['6']}`))),expected);
for(const old of source['1']){
  const n=find(old.d0);assert(n);
  if(n.z==='1'){
    assert.deepEqual(n['66'],old['66'],`Native provider ${n.s}`);
    assert.deepEqual(n['9'],old['9'],`Native formatting ${n.s}`);
    assert(['Phenomena-Regular','Phenomena-Bold'].includes(n['1']));
  }else{
    // Preserve charging smart-symbol and default refresh action semantics.
    for(const [key,value]of Object.entries(old))if(!['b','c','d','e','f'].includes(key))assert.deepEqual(n[key],value);
  }
}
const replace=(n,value)=>{
  if(!n['33'])return value;
  const from=n['33'].split('||'),to=n['34'].split('||');
  return from.reduce((value,s,i)=>value.split(s).join(to[i]??''),value);
};
for(const [onId,offId]of [[15013,15611],[15030,15612]])for(const state of ['On','Off']){
  const a=replace(find(onId),state),b=replace(find(offId),state);
  assert.equal(a+b,state.toUpperCase());assert(a===''||b==='');
  assert.notEqual(find(onId).f,find(offId).f);
  for(const k of ['b','c','d','e'])assert.deepEqual(find(onId)[k],find(offId)[k]);
}
for(const percent of ['0%','1%','75%','100%'])assert.equal(replace(find(15003),percent),percent.slice(0,-1));
for(const space of ['512 MB','151 GB','1.2 TB','—'])assert.equal(replace(find(15022),space),space);
for(const value of ['0 h','29.2 h','—'])assert.equal(replace(find(15037),value),value);
const ring=layers.find(n=>n.z==='9');
assert.equal(ring['1'],'System Info');assert.equal(ring['2'],'Battery Level');assert.equal(ring['20'],100);
assert.equal(ring['8'].a[0].a,ring['9'].a[0].a);assert(ring['8'].a[0].a>0&&ring['8'].a[0].a<10);
for(const n of layers){
  const [x,y,width,height]=['b','c','d','e'].map(k=>n[k].a[0].a);
  assert([x,y,width,height].every(Number.isFinite));assert(x>=0&&y>=0&&width>0&&height>0);
  assert(x+width<=1600.001&&y+height<=1600.001,`Frame ${n.s}`);
}
const bg=layers.at(-1);assert.equal(bg.z,'5');
assert(bg['2'].startsWith('data:image/png;base64,'));
const png=Buffer.from(bg['2'].split(',')[1],'base64');
assert(png.equals(read('assets/device-glass/chrome-d1.png')));
const metadata=await sharp(png).metadata();assert.equal(metadata.width,1060);assert.equal(metadata.height,1060);
assert.equal(metadata.hasAlpha,true);assert(png.length<100000);assert(Buffer.byteLength(raw)<150000);
assert(!/https?:\/\//.test(raw));assert(!w['36']);
assert.deepEqual(JSON.parse(formatJSONLines(raw)),w);

// Exercise the shipped clipboard code: the copy happens synchronously within
// the tap handler before any network await; fallback retains the entire JSON.
const script=read('tools/widgy-device-glass-copy.js').toString().replace(/^import[^\n]+\n/,'');
async function copyTrial({denied=false,bad=false}={}){
  const elements=new Map();let copied='',requests=0;
  const get=id=>{
    if(!elements.has(id))elements.set(id,{disabled:true,checked:id==='multiline',hidden:id==='manual',value:'',listeners:{},classList:{toggle(){}},addEventListener(name,fn){this.listeners[name]=fn;},focus(){},select(){},setSelectionRange(){}});
    return elements.get(id);
  };
  const context={formatJSONLines,document:{getElementById:get,execCommand:()=>false},navigator:{clipboard:{writeText(value){copied=value;return denied?Promise.reject(Error('denied')):Promise.resolve();}}},fetch:async()=>{requests++;return {ok:!bad,text:async()=>raw};}};
  vm.runInNewContext(script,context);
  await new Promise(resolve=>setImmediate(resolve));
  if(bad){assert.equal(get('copy').disabled,true);return;}
  assert.equal(get('copy').disabled,false);assert.equal(requests,1);
  const copy=get('copy').listeners.click();assert.equal(requests,1);assert.deepEqual(JSON.parse(copied),w);await copy;
  if(denied){assert.equal(get('manual').hidden,false);assert.deepEqual(JSON.parse(get('text').value),w);}
  get('multiline').checked=false;get('multiline').listeners.change();await get('copy').listeners.click();assert.equal(copied,raw);
}
await copyTrial();await copyTrial({denied:true});await copyTrial({bad:true});

// Lock the existing Weather 15/runtime assets to the commit we started from.
const base='e86659da861ce47ea82cbac1acdd0e0e9c281b37';
const paths=execFileSync('git',['ls-tree','-r','--name-only',base],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(p=>/weather/i.test(p)||p.startsWith('api/')||p.startsWith('lib/'));
const sha=b=>createHash('sha256').update(b).digest('hex');
for(const p of paths)assert.equal(sha(read(p)),sha(execFileSync('git',['show',`${base}:${p}`],{cwd:root,maxBuffer:32*1024*1024})),`Protected file ${p}`);
const before=JSON.parse(execFileSync('git',['show',`${base}:tools/public-site-files.json`],{cwd:root}));
const after=JSON.parse(read('tools/public-site-files.json'));
for(const type of ['roots','files'])for(const p of before[type])assert(after[type].includes(p),`Existing public entry ${p}`);
console.log(JSON.stringify({pass:true,layers:13,sourceBindingsPreserved:8,connectivityStates:4,clipboardTrials:3,protectedFiles:paths.length,nativeIPhoneValidation:'pending'}));
