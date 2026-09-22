import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {allNodes} from './build-widgy-v110.mjs';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const write=(name,data)=>writeFileSync(new URL(name,import.meta.url),data);
const before=JSON.parse(read('widgy-v130.json')),data=structuredClone(before);
const map=allNodes(data).find(n=>n.d0===6170);
const url='https://widgy-maps-world-glass.vercel.app/api/home-map?v=131';
map['2']=url;
map['22']=`var main = function() {\n  return '${url}&t=' + Date.now();\n}`;
data['3']='Widgy Home v131 - Refined Golden Night Lights';
data['4']='v131 refines v130 only: the historical city-light signal is slightly softer and warmer, near/far bloom is reduced, and the calibrated location marker is about 12% smaller with a softer glow. Terrain, solar field, borders, map geometry, labels, dynamic location and native Widgy layout are unchanged.';
const payload=JSON.stringify(data);
assert.equal(allNodes(data).find(n=>n.d0===6110)['66'][0]['6'],'Live Timer (24 hours, No Seconds)');
write('widgy-v131.json',payload);
console.log(JSON.stringify({version:131,bytes:Buffer.byteLength(payload),nativePreservation:'map URL/release metadata only'}));
