import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {withCalendarCityDirectLayer} from './calendar-city-direct-layer.js';
import {flatten,variableReferences} from './compact-widget-structure.js';

const input=JSON.parse(readFileSync(process.argv[2],'utf8'));
const original=structuredClone(input), output=withCalendarCityDirectLayer(input);
assert.deepEqual(input,original,'Transform must not mutate the installed baseline');
const nodes=flatten(output['1']), originals=flatten(input['1']);
assert.equal(nodes.length,1187);assert.equal(new Set(nodes.map(n=>n.d0)).size,nodes.length);
assert.equal(output['36'].length,53);
const removed=input['36'].filter(v=>['calendar_city_prefix','calendar_native_city'].includes(v['1']));
assert.equal(variableReferences(output,removed).size,0);
assert.deepEqual(output['36'],input['36'].filter(v=>!removed.includes(v)));
const restored=structuredClone(output);
restored['3']=input['3'];restored['4']=input['4'];restored['36']=structuredClone(input['36']);
const cal=restored['1'].find(n=>n.d0===247), oldCal=input['1'].find(n=>n.d0===247);
const target=cal['1'].find(n=>n.d0===80337), oldTarget=oldCal['1'].find(n=>n.d0===80337);
target['66']=structuredClone(oldTarget['66']);target.o1=structuredClone(oldTarget.o1);
const fallbackAt=oldCal['1'].findIndex(n=>n.d0===81871);
cal['1'].splice(fallbackAt,0,structuredClone(oldCal['1'][fallbackAt]));
assert.deepEqual(restored,input,'Only city source/guard, fallback, two variables and metadata may change');
for(const n of nodes)if(n['1a']?.startsWith('button_'))for(const id of n['1a'].slice(7).split(/[-,]/).map(Number))
 assert(nodes.some(n=>n.d0===id),'Navigation must retain every target');
const source=nodes.find(n=>n.d0===80337)['66'][0]['10'];
const previous=removed.find(v=>v['1']==='calendar_city_prefix')['3']['66'][0]['10'];
assert.equal(source,previous,'Use the identical successful-city parser');
assert(!/fetch\s*\(|sendToWidgy\s*\(/.test(source),'The layer must add no network request or async callback');
let cases=0;
function run(url) {
 const context={};
 vm.runInNewContext(source.replace('"${widgy.map_request}"',JSON.stringify(url)),context);
 return vm.runInNewContext('main()',context);
}
for(const city of ['Example','Ashkelon','Ashdod','Tel Aviv-Yafo','São Paulo','東京','ירושלים','St. John\'s','A "quoted" city','A\\B','A & B','A\nB','x'.repeat(100),'']) {
 const url='https://example.test/api/night-map?lat=0&lon=0'+(city?'&city='+encodeURIComponent(city):'')+'&t=1000';
 const expected=city?city.replace(/[\u0000-\u001f\u007f]/g,'').slice(0,80)+', ':'';
 assert.equal(run(url),expected);cases++;
 // The actual map source percent-encodes city text, making the existing quoted
 // URL interpolation safe for these cases, without passing raw city into JS.
 const context={};vm.runInNewContext(source.replace('${widgy.map_request}',url),context);
 assert.equal(vm.runInNewContext('main()',context),expected);cases++;
}
for(const value of ['',null,undefined,'${widgy.map_request}','https://example.test/api/night-map?city=%E0%A4%A','https://example.test/api/night-map?city=']) {
 assert.equal(run(value),'');cases++;
}
let scripts=0;function walk(x){if(!x||typeof x!=='object')return;for(const v of Object.values(x)){
 if(typeof v==='string'&&(/function\s+main|var main =|function cityMapRuntime/.test(v))){new vm.Script(v);scripts++;}else walk(v);}}
walk(output);
assert.equal(nodes.filter(n=>n.z==='18').length,1);
assert.deepEqual(nodes.find(n=>n.s==='Home Hero World Map'),originals.find(n=>n.s==='Home Hero World Map'));
console.log(JSON.stringify({documentWhitelist:true,inputImmutable:true,homeAndMapUnchanged:true,exactSuccessfulCityParser:true,missingCity:'empty prefix; native country retained; no fallback city',cases,layers:nodes.length,variables:output['36'].length,scriptsParsed:scripts,uniqueIDs:true,validNavigation:true,nativeDayGauge:1}));
