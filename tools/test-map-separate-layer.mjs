import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import sharp from 'sharp';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';
import {compactCalendarDots} from './calendar-compact-dots.js';
import {thinNativeStepsRing} from './native-steps-ring.js';
import {withHomeSyncMapLean} from './home-sync-map-lean.js';
import {withMapSeparateLayer} from './map-separate-layer.js';

const template=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
const normal=personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic',
  'https://example.test/api/calendar-widget?token=synthetic');
const full=thinNativeStepsRing(compactCalendarDots(consolidateWidget(normal)));
const before=structuredClone(full),control=withHomeSyncMapLean(full),result=withMapSeparateLayer(full);
const walk=ns=>ns.flatMap(n=>[n,...(n.z==='13'?walk(n['1']):[])]);
const originalHome=control['1'][0],mapIndex=originalHome['1'].findIndex(n=>n.d0===6170);
const map=result['1'].at(-1),restored=structuredClone(result);
assert.equal(result['1'].length,5);
assert.deepEqual(map,originalHome['1'][mapIndex],'Same exact image, identity, frame, options and URL');
assert.equal(result['1'][0]['1'].length,14);
restored['1'][0]['1'].splice(mapIndex,0,restored['1'].pop());
restored['3']=control['3'];restored['4']=control['4'];
assert.deepEqual(restored,control,'Only one reparenting plus trial metadata');
assert.deepEqual(full,before,'Immutable input');
assert.deepEqual(result['36'],control['36'],'All 69 variable objects and their ordering exact');
assert.equal(result['36'].length,69);
const nodes=walk(result['1']),byId=new Map(nodes.map(n=>[n.d0,n]));
assert.equal(nodes.length,1289);assert.equal(byId.size,nodes.length);
const actions=[...new Set(nodes.map(n=>n['1a']).filter(a=>a?.startsWith('button_')))];
const initial=new Map(nodes.map(n=>[n.d0,n.a!==false]));
assert.equal(initial.get(6170),true);
for(const action of actions){
  const state=new Map(initial),[shown,hidden]=action.slice(7).split('-');
  for(const [part,value] of [[shown,true],[hidden,false]])for(const id of part.split(',').map(Number)){
    assert(byId.has(id),'Missing target '+id);
    assert.notEqual(id,6170,'Map must not be a tap target');state.set(id,value);
  }
  const activeTabs=[245,247,246,195].filter(id=>state.get(id));
  assert.equal(activeTabs.length,1,'Exactly one visible tab after '+action);
  assert.equal(state.get(6170),true,'Map stays enabled under every tab/month action');
}
// No local execution of actual location sources or calendar endpoints.
const names=new Set(result['36'].map(v=>v['1']));
for(const m of JSON.stringify(result).matchAll(/\$\{widgy\.([^}]+)\}/g))assert(names.has(m[1]));

// Existing JSON builder documents topmost-first ordering. Verify backgrounds
// fully cover the unchanged map rectangle without adding a new covering layer.
const frame=n=>Object.fromEntries(['b','c','d','e'].map(k=>[k,n[k]?.a?.[0]?.a??0]));
const f=frame(map),calendar=result['1'][1],chrome=calendar['1'].find(n=>n.d0===80408);
assert.deepEqual(frame(chrome),{b:0,c:0,d:1600,e:1600});
assert.equal(calendar.a,false);
const {data,info}=await sharp(new URL('../assets/calendar-glass/Calendar_Glass_Chrome_C8.png',import.meta.url).pathname)
  .ensureAlpha().raw().toBuffer({resolveWithObject:true});
assert.equal(info.channels,4);
const box=[Math.floor(f.b*info.width/1600),Math.floor(f.c*info.height/1600),
  Math.ceil((f.b+f.d)*info.width/1600),Math.ceil((f.c+f.e)*info.height/1600)];
assert(box[0]>=0 && box[1]>=0 && box[2]<=info.width && box[3]<=info.height);
for(let y=box[1];y<box[3];y++)for(let x=box[0];x<box[2];x++)
  assert.equal(data[(y*info.width+x)*4+3],255,'Calendar map-area pixel must be opaque');
for(const id of [5049,5073]){
  const bg=byId.get(id);assert.deepEqual(frame(bg),{b:0,c:0,d:1600,e:1600});
  assert.equal(bg.g,'hexcol_A4F195A239A64F67A26E810CD80D1D2B-100');
}
for(const mutate of [
  w=>w['1'][0].b={a:[{a:10,b:1301,c:0,d:1301}],b:0},
  w=>w['1'][0].o1={0:'unexpected'},
  w=>w['1'][0]['1'].find(n=>n.d0===6170).a=false,
  w=>w['1'][1]['1'].find(n=>n.s==='HOME Tap')['1a']='button_245,6170-247,246,195',
  w=>w['1'][1]['1'].find(n=>n.d0===80408).a=false,
  w=>w['1'][2]['1'].find(n=>n.d0===5049).g='transparent'
]){
  const bad=structuredClone(full);mutate(bad);assert.throws(()=>withMapSeparateLayer(bad),/unexpected_template/);
}

// Exercise the real import controller using only a synthetic private response.
const html=readFileSync(new URL('./widgy-map-separate-layer.html',import.meta.url),'utf8');
const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],
  {events:{},classList:{toggle(){}},addEventListener(name,fn){this.events[name]=fn;},removeAttribute(name){delete this[name];}}]));
const events={};let downloaded,copied,error;
const ctx={document:{getElementById:id=>{assert(elements[id],id);return elements[id];}},Blob,
  consolidateWidget,compactCalendarDots,thinNativeStepsRing,withMapSeparateLayer,
  URL:{createObjectURL(blob){downloaded=blob;return 'blob:synthetic';},revokeObjectURL(){}},
  navigator:{clipboard:{async writeText(value){copied=value;}}},window:{addEventListener(name,fn){events[name]=fn;}},
  async prepareWidget(){if(error)throw Error(error);return {payload:JSON.stringify(normal)};}};
vm.runInNewContext(readFileSync(new URL('./widgy-map-separate-layer.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,''),ctx);
await new Promise(setImmediate);
assert.equal(elements.copy.disabled,false);assert.deepEqual(JSON.parse(await downloaded.text()),result);
await elements.copy.events.click();assert.deepEqual(JSON.parse(copied),result);
error='unauthorized';await elements.retry.events.click();assert.equal(elements.copy.disabled,true);
assert.equal(elements.download.hidden,true);assert.equal(elements.download.href,undefined);
copied='';await elements.copy.events.click();assert.equal(copied,'');
error=null;events.pageshow({persisted:true});await new Promise(setImmediate);assert.equal(elements.copy.disabled,false);
ctx.navigator.clipboard.writeText=async()=>{throw Error('blocked');};
await elements.copy.events.click();assert.equal(elements.download.hidden,false);
assert(html.includes('widgy-map-separate-layer.js?v=map-separate-layer-1'));
assert(html.includes('Widgy_Map_Separate_Layer_1.json'));
assert(html.includes('./widgy-home-sync-map-lean.html?v=home-sync-map-lean-1'));
console.log(`PASS: one exact map reparented; 1289 layers/69 variables unchanged; ${actions.length} tab/month actions retain enabled map and one active tab; Calendar alpha coverage/other tab backgrounds checked; unsafe variants rejected; synthetic copy/download/session flows pass. Native geometry, caching and speed still require phone verification.`);
