import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {withCalendarDirectData} from './calendar-direct-data.js';
import {flatten, variableReferences, inlineSingleTextSources} from './compact-widget-structure.js';

const input=JSON.parse(readFileSync(process.argv[2],'utf8')), untouched=structuredClone(input);
const {widget,changes}=withCalendarDirectData(input);
assert.deepEqual(input,untouched,'Input remains intact');
const nodes=flatten(widget['1']), originalNodes=flatten(input['1']);
assert.equal(nodes.length,1190);assert.equal(widget['36'].length,46);assert.equal(changes.length,9);
const removed=input['36'].filter(v=>changes.some(c=>c.name===v['1']));
assert.equal(variableReferences(widget,removed).size,0,'No dangling name/UUID reference');
assert.deepEqual(widget['36'],input['36'].filter(v=>!removed.includes(v)),'All retained variables are exact');
const restored=structuredClone(widget), restoredNodes=flatten(restored['1']);
for(const c of changes){
 const old=input['36'].find(v=>v['1']===c.name), n=nodes.find(n=>n.d0===c.layer);
 assert.equal(old['2'],0);assert.equal(old['3']['66'].length,1);
 assert.equal(old['3']['66'][0]['5'],'JSON Endpoint');
 assert.deepEqual(n['66'][c.index],old['3']['66'][0],'Native source URL/auth/path/format is exact');
 restoredNodes.find(n=>n.d0===c.layer)['66'][c.index]=structuredClone(originalNodes.find(n=>n.d0===c.layer)['66'][c.index]);
}
restored['36']=structuredClone(input['36']);restored['3']=input['3'];restored['4']=input['4'];
assert.deepEqual(restored,input,'No other field, frame, guard, ordering or source changes');
assert.equal(new Set(nodes.map(n=>n.d0)).size,1190);
for(const n of nodes)if(n['1a']?.startsWith('button_'))for(const id of n['1a'].slice(7).split(/[-,]/).map(Number))
 assert(nodes.some(n=>n.d0===id),'Tap target exists');
for(const id of [80337,81871,81869,81870])assert.deepEqual(nodes.find(n=>n.d0===id),originalNodes.find(n=>n.d0===id),'City and fallback intact');
for(const name of ['map_request','calendar_city_prefix','calendar_native_city','steps_label'])
 assert.deepEqual(widget['36'].find(v=>v['1']===name),input['36'].find(v=>v['1']===name));
assert.equal(nodes.filter(n=>n.z==='18').length,1);
// The exported generic helper preserves its existing default behavior; the new
// filter deliberately leaves the Home steps source alone.
const generic=structuredClone(input), all=inlineSingleTextSources(generic);
assert.equal(all.length,14);assert(all.some(c=>c.name==='steps_label'));
const rejectAll=structuredClone(input);assert.equal(inlineSingleTextSources(rejectAll,()=>false).length,0);assert.deepEqual(rejectAll,input);
let scripts=0;function walk(x){if(!x||typeof x!=='object')return;for(const v of Object.values(x)){
 if(typeof v==='string'&&(/function\s+main|var main =|function cityMapRuntime/.test(v))){new vm.Script(v);scripts++;}else walk(v);}}
walk(widget);
console.log(JSON.stringify({documentWhitelist:true,unchangedHomeMapCityAndFallback:true,exactJSONSources:changes.length,layers:nodes.length,variables:widget['36'].length,scriptsParsed:scripts,uniqueIDs:true,validNavigation:true,nativeDayGauge:1,changes}));
