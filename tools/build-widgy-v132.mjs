import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {allNodes} from './build-widgy-v110.mjs';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const write=(name,data)=>writeFileSync(new URL(name,import.meta.url),data);
const before=JSON.parse(read('widgy-v131.json')),data=structuredClone(before);
const map=allNodes(data).find(n=>n.d0===6170);
const url='https://widgy-maps-world-glass.vercel.app/api/home-map?v=132';
map['2']=url;
map['22']=`var main = function() {\n  return '${url}&t=' + Date.now();\n}`;
data['3']='Widgy Home v132 - Night Glow Micro Polish';
data['4']='v132 uses the v131 layout with two renderer-only refinements: near bloom -5% and a clearly smaller location marker. Marker position/style, terrain, labels, point lights, far bloom and all native layout nodes are otherwise unchanged.';
const payload=JSON.stringify(data);
assert.equal(allNodes(data).find(n=>n.d0===6110)['66'][0]['6'],'Live Timer (24 hours, No Seconds)');
write('widgy-v132.json',payload);
console.log(JSON.stringify({version:132,bytes:Buffer.byteLength(payload),nearBloom:'0.52 -> 0.494',nativePreservation:'verified by construction'}));
