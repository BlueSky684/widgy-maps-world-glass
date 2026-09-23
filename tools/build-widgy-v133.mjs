// v133 is intentionally not based on night-signal-v130.bin.gz.
// Runtime source: assets/earth/lights-v121.png -> lib/night-signal-v133.js.
// Widgy JSON release is derived from v132 with only map endpoint + release metadata changed.
import {readFileSync,writeFileSync} from 'node:fs';
import {allNodes} from './build-widgy-v110.mjs';
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const data=JSON.parse(read('widgy-v132.json'));
const map=allNodes(data).find(n=>n.d0===6170);
const url='https://widgy-maps-world-glass.vercel.app/api/home-map?v=133';
map['2']=url;
map['22']=`var main = function() {\n  return '${url}&t=' + Date.now();\n}`;
data['3']='Widgy Home v133 - Night Lighting Rebuild';
writeFileSync(new URL('widgy-v133.json',import.meta.url),JSON.stringify(data));
console.log(JSON.stringify({version:133,renderer:'home-map-v133',v130SignalUsed:false}));
