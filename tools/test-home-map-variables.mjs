import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {personalizedWidget} from './calendar-connect-widget.js';
import {withHomeMapOnlyCity} from './widget-home-map-diagnostic.js';
import {withHomeMapVariables,RESTORED_HOME_VARIABLES} from './home-map-variables.js';

// Synthetic fixture only: never open a private calendar export endpoint here.
const template=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
const normal=personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic',
  'https://example.test/api/calendar-widget?token=synthetic');
const original=structuredClone(normal),control=withHomeMapOnlyCity(normal),result=withHomeMapVariables(normal);
assert.deepEqual(normal,original,'Input must not mutate');
assert.equal(control['36'].length,69);assert.equal(result['36'].length,81);
assert.deepEqual(result['36'],normal['36'],'Exact definitions, IDs, bindings and array order');
const added=result['36'].filter(v=>!control['36'].some(c=>c['0']===v['0']));
assert.deepEqual(added.map(v=>v['1']).sort(),[...RESTORED_HOME_VARIABLES].sort());
const restored=structuredClone(result);
for(const key of ['3','4','36'])restored[key]=structuredClone(control[key]);
assert.deepEqual(restored,control,'Only variables and name/description may differ from the fast control');
const walk=nodes=>nodes.flatMap(n=>[n,...(n.z==='13'?walk(n['1']):[])]);
const nodes=walk(result['1']),home=result['1'].find(n=>n.s==='HOME');
assert.equal(walk(home['1']).length,15);
assert.equal(nodes.length,1297);
assert.equal(home['1'].filter(n=>n.z==='5').length,1);
assert.deepEqual(home['1'].find(n=>n.s==='Home Hero World Map'),
  normal['1'].find(n=>n.s==='HOME')['1'].find(n=>n.s==='Home Hero World Map'));
assert.deepEqual(result['1'].filter(n=>n.s!=='HOME'),normal['1'].filter(n=>n.s!=='HOME'));
const ids=new Set(nodes.map(n=>n.d0));assert.equal(ids.size,nodes.length);
for(const n of nodes)if(n['1a']?.startsWith('button_'))
  for(const id of n['1a'].slice(7).split(/[-,]/).map(Number))assert(ids.has(id),'Dangling tap target '+id);
const names=new Set(result['36'].map(v=>v['1']));
for(const match of JSON.stringify(result).matchAll(/\$\{widgy\.([^}]+)\}/g))
  assert(names.has(match[1]),'Missing variable '+match[1]);
for(const change of [
  w=>w['36'].push(structuredClone(w['36'][0])),
  w=>w['36'].find(v=>v['1']==='steps_goal')['1']='renamed_goal',
  w=>w['1'].find(n=>n.s==='CALENDAR').s='${widgy.steps_progress}'
]){
  const bad=structuredClone(normal);change(bad);
  assert.throws(()=>withHomeMapVariables(bad),/unexpected_template/);
}

// Exercise the actual copy-page controller, including expired-session clearing.
const html=readFileSync(new URL('./widgy-home-map-variables.html',import.meta.url),'utf8');
const elementIDs=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const elements=Object.fromEntries(elementIDs.map(id=>[id,{events:{},classList:{toggle(){}},
  addEventListener(name,fn){this.events[name]=fn;},removeAttribute(name){delete this[name];}}]));
const events={};let downloaded,copied,error,loads=0,revoked=0;
const context={document:{getElementById:id=>{assert(elements[id],id);return elements[id];}},Blob,withHomeMapVariables,
  URL:{createObjectURL(blob){downloaded=blob;return 'blob:synthetic';},revokeObjectURL(){revoked++;}},
  navigator:{clipboard:{async writeText(value){copied=value;}}},
  window:{addEventListener(name,fn){events[name]=fn;}},
  async prepareWidget(){loads++;if(error)throw Error(error);return {payload:JSON.stringify(normal)};}};
const source=readFileSync(new URL('./widgy-home-map-variables.js',import.meta.url),'utf8');
vm.runInNewContext(source.replace(/^import .*;\n/gm,''),context);
await new Promise(setImmediate);
assert.equal(loads,1);assert.equal(elements.copy.disabled,false);
assert.deepEqual(JSON.parse(await downloaded.text()),result);
await elements.copy.events.click();assert.deepEqual(JSON.parse(copied),result);
error='unauthorized';await elements.retry.events.click();
assert.equal(elements.copy.disabled,true);assert.equal(elements.download.hidden,true);
assert.equal(elements.download.href,undefined);assert.equal(elements.retry.hidden,false);
assert.equal(revoked,1);copied='';await elements.copy.events.click();assert.equal(copied,'');
error=null;events.pageshow({persisted:true});await new Promise(setImmediate);
assert.equal(elements.copy.disabled,false);
context.navigator.clipboard.writeText=async()=>{throw Error('blocked');};
await elements.copy.events.click();assert.equal(elements.download.hidden,false);
assert(elements.status.textContent.includes('הורד את הקובץ'));
assert(html.includes('widgy-home-map-variables.js?v=home-variables-1'));
assert(html.includes('home=map-only-city&amp;v=map-only-city-1'));
assert(html.includes('Widgy_Home_Map_Variables_1.json'));
console.log('PASS: Map Only City unchanged except 12 restored variable definitions (69 → 81) and metadata; 15 Home nodes / 1297 total; exact live map/city and other tabs; valid dependencies/navigation; input immutable; copy/download/session recovery verified with synthetic data. Native variable evaluation and transition timing remain unmeasured.');
