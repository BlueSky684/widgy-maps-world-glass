import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {withNativeCitySpelling} from './calendar-native-city-spelling.js';
import {flatten} from './compact-widget-structure.js';
const input=JSON.parse(readFileSync(process.argv[2],'utf8')), original=structuredClone(input);
const widget=withNativeCitySpelling(input);
assert.deepEqual(input,original);
const before=input['1'].find(n=>n.d0===247), after=widget['1'].find(n=>n.d0===247);
const fallback=after['1'].find(n=>n.d0===81871), oldFallback=before['1'].find(n=>n.d0===81871);
assert(!Object.hasOwn(fallback,'o1'));
assert.deepEqual(fallback['1'],oldFallback['1'],'Native sources, spelling guards and geometry exact');
const restored=structuredClone(widget), cal=restored['1'].find(n=>n.d0===247);
cal['1'].find(n=>n.d0===81871).o1=structuredClone(oldFallback.o1);
const i=before['1'].findIndex(n=>n.d0===80337);
cal['1'].splice(i,0,structuredClone(before['1'][i]));
restored['3']=input['3'];restored['4']=input['4'];
assert.deepEqual(restored,input,'Only prefix row, outer guard, title and description change');
assert.deepEqual(widget['36'],input['36']);
const nodes=flatten(widget['1']),ids=new Set(nodes.map(n=>n.d0));
assert.equal(nodes.length,1189);assert.equal(ids.size,nodes.length);assert(!ids.has(80337));
for(const n of nodes)if(n['1a']?.startsWith('button_'))for(const id of n['1a'].slice(7).split(/[-,]/).map(Number))assert(ids.has(id));
for(const city of ['Ashqelon','Ashkelon','Ashdod','Paris','']){
  const shown=fallback['1'].filter(n=>n.o1['1']===0?city===n.o1['2']:city!==n.o1['2']);
  assert.equal(shown.length,1);
  if(city==='Ashqelon')assert.equal(shown[0]['66'][0]['25'],'Ashkelon, ');
  else assert.equal(shown[0]['66'][0]['6'],'City');
}
console.log(JSON.stringify({exactDocumentWhitelist:true,all55VariablesUnchanged:true,prefixDisplayDependencyRemoved:true,originalAshkelonCorrectionPreserved:true,layers:1189,validNavigation:true,nativeConditionBehaviorStillUnverified:true}));
