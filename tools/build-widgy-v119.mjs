import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {allNodes} from './build-widgy-v110.mjs';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const write=(name,data)=>writeFileSync(new URL(name,import.meta.url),data);
const before=JSON.parse(read('widgy-v118.json'));
const data=structuredClone(before);
const map=allNodes(data).find(n=>n.d0===6170);
const url='https://widgy-maps-world-glass.vercel.app/api/home-map?v=119';
map['2']=url;
map['22']=`var main = function() {\n  return '${url}&t=' + Date.now();\n}`;
// Match the reference's ~2.02:1 map panel instead of the shallow 2.32:1 frame.
const mapHeight=map.d.a[0].a*1188/2400;
map.e.a[0].a=mapHeight;
const moved=[];
const homeNodes=allNodes({'1':[data['1'].find(n=>n.d0===245)]});
for(const node of homeNodes) {
 if(node.z==='13'||node.d0===6170) continue;
 const y=node.c?.a?.[0]?.a;
 let dy=0;
 if([6110,6111,6112,6113,6114,6191].includes(node.d0))dy=70;
 else if((node.d0>=6120&&node.d0<=6125)||node.d0===6151||node.s?.startsWith('Day Progress Fill'))dy=84;
 else if(y>=1040&&y<1300)dy=42;
 if(dy) {for(const frame of node.c.a)frame.a+=dy;moved.push({id:node.d0,dy});}
}
data['3']='Widgy Home v119 - Refined Night Map';
data['4']='v119: 2400 x 1188 map with a taller 2.02:1 native frame matching the approved Master proportions. Natural Earth 1:10m shorelines/countries, slate land, finer borders, readable night geography, warmer city lights and restrained urban bloom. Solar calculation, geographic bounds and horizon-centred twilight blend are preserved. Map and marker share the revised projection scale. Clock/agenda and rows below are moved vertically to fit. Preserves all data sources, weather conditions, greeting logic and v118 native live 24-hour no-seconds clock font/size. Dynamic map, not a pixel-identical extraction of the reference. Location remains approximate IP; image updates on Widgy refresh.';

const restored=structuredClone(data),r=allNodes(restored).find(n=>n.d0===6170);
Object.assign(r,structuredClone(allNodes(before).find(n=>n.d0===6170)));
for(const {id} of moved)allNodes(restored).find(n=>n.d0===id).c=structuredClone(allNodes(before).find(n=>n.d0===id).c);
restored['3']=before['3'];restored['4']=before['4'];
assert.deepEqual(restored,before);
assert.equal(allNodes(data).find(n=>n.d0===6110)['66'][0]['6'],'Live Timer (24 hours, No Seconds)');
assert(map.c.a[0].a+mapHeight<960); // First progress row box.
assert(970+84+9<1041+42); // Progress bar clears cards.
assert(1041+42+238<1338); // Cards clear the navigation.
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');
let html=read('widgy-v118.html').replaceAll('v118','v119')
 .replace('טיימר חי 24 שעות ללא שניות, בפונט דק ובגודל מותאם למאסטר.','מפה גבוהה ומפורטת יותר, עם יבשות ברורות בלילה ואורות ערים חמים.')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`)
 .replaceAll('Live 24h Master Clock','Refined Night Map');
assert.equal(gunzipSync(Buffer.from(html.match(/const packed=\['([^']+)'\]/)[1],'base64')).toString(),payload);
write('widgy-v119.json',payload);
write('widgy-v119.html',html);
write('widgy-v119-integration.json',JSON.stringify({base:'v118',status:'prepared',changedLayerIds:[6170,...moved.map(n=>n.id)],
 imageEndpoint:url,scope:'Map appearance, resolution, aspect ratio and required vertical reflow; all data and conditions preserved',
 resolution:[2400,1188],mapFrame:Object.fromEntries(['b','c','d','e'].map(k=>[k,map[k].a[0].a])),moved,
 coastline:'Natural Earth 1:10m countries (including detailed coastlines)',
 appearance:['Less saturated slate land','Finer silver-grey borders','More readable night land','Warmer Black Marble urban lights with local bloom'],
 geography:'Same longitude -180..180 and latitude 85..-65',
 solarModel:'Same NOAA/Meeus UTC geometry and symmetric -6..+6 degree blend, with 50% at the geometric horizon',
 cityLights:'Night/twilight texture only; historical NASA composite',
 clock:'Unchanged native Live Timer (24 hours, No Seconds), System Light',
 reference:'Visual style target; not a pixel-identical static map',
 deviceVerified:false,bytes:Buffer.byteLength(payload),sha256:hash},null,2)+'\n');
let fragment=readFileSync('/workspace/widgy-v118-copy.html','utf8').replaceAll('v118','v119')
 .replace(/<script type="application\/json" data-packed>[\s\S]*?<\/script>/,`<script type="application/json" data-packed>${JSON.stringify(packed)}</script>`)
 .replace(/payload.length !== \d+/,`payload.length !== ${payload.length}`)
 .replaceAll('Live 24h Master Clock','Refined Night Map')
 .replace(/hash !== '[^']+'/,`hash !== '${hash}'`);
writeFileSync('/workspace/widgy-v119-copy.html',fragment);
assert.equal(gunzipSync(Buffer.from(JSON.parse(fragment.match(/data-packed>([\s\S]*?)<\/script>/)[1]),'base64')).toString(),payload);
console.log(JSON.stringify({version:119,bytes:Buffer.byteLength(payload),sha256:hash,resolution:[2400,1188],mapHeight,movedLayers:moved.length,copyPayload:'verified'}));
