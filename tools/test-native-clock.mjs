import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {personalizedWidget} from './calendar-connect-widget.js';
import {withNativeClock} from './widget-native-clock.js';
const template=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
const original=personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic','https://example.test/api/calendar-widget?token=synthetic');
const unchanged=structuredClone(original),candidate=withNativeClock(original);
assert.deepEqual(original,unchanged);
const expected=structuredClone(original);
expected['1'].find(n=>n.s==='HOME')['1'].find(n=>n.s==='Hero Time')['66']=[{'5':'Date And Time','6':'HH:mm'}];
expected['3']=candidate['3'];expected['4']=candidate['4'];
assert.deepEqual(candidate,expected); // All real data, geometry and actions retained.
const home=candidate['1'].find(n=>n.s==='HOME');
const clock=home['1'].find(n=>n.s==='Hero Time');
assert.equal(clock['1'],'HomeGlassTime-Light');
assert.equal(home['1'].find(n=>n.s==='Home Hero World Map')['2'],'${widgy.map_request}');
assert(home['1'].filter(n=>/^Steps Goal Ring ·/.test(n.s)).every(n=>n.o1['1']===5));
assert.equal(candidate['36'].length,81);
assert.equal(candidate['36'].flatMap(v=>v['3']['66']||[]).filter(s=>s['5']==='JSON Endpoint').length,39);
assert(!JSON.stringify(candidate['1']).includes('TEST DATA'));
assert.throws(()=>withNativeClock(template),/unexpected_template/);
const missing=structuredClone(original);
missing['1'].find(n=>n.s==='HOME')['1']=home['1'].filter(n=>n.s!=='Hero Time');
assert.throws(()=>withNativeClock(missing),/unexpected_template/);

const html=readFileSync(new URL('./widgy-copy.html',import.meta.url),'utf8');
const source=readFileSync(new URL('./widgy-copy.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
for(const mode of ['', '?clock=native']){
  const elements=Object.fromEntries(ids.map(id=>[id,{textContent:'',hidden:true,classList:{toggle(){}},addEventListener(){}}]));
  let captured='';
  const context=vm.createContext({
    document:{getElementById:id=>{assert(elements[id],id);return elements[id];}},
    window:{location:{search:mode},addEventListener(){}},URLSearchParams,
    URL:{createObjectURL:b=>{captured=b.parts[0];return 'blob:test';},revokeObjectURL(){}},
    Blob:class{constructor(parts){this.parts=parts;}},
    prepareWidget:async()=>({payload:JSON.stringify(original),data:{today:{total:3}}}),withNativeClock
  });
  await new vm.Script(source).runInContext(context);
  assert.equal(elements.copy.disabled,false);
  assert.deepEqual(JSON.parse(captured),mode?candidate:original);
  assert.equal(elements['clock-minute-check'].hidden,!mode);
  if(mode)assert(elements.download.download.includes('Native_Clock_Trial'));
}
console.log('Passed: full native-clock candidate changes only one source and descriptive metadata; real map, 81 variables, 39 calendar fields, approved clock style and repaired ring retained; default copy unchanged. Native minute updates still require device verification.');
