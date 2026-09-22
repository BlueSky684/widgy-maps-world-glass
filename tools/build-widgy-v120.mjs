import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {allNodes} from './build-widgy-v110.mjs';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const write=(name,data)=>writeFileSync(new URL(name,import.meta.url),data);
const before=JSON.parse(read('widgy-v119.json'));
const data=structuredClone(before);
const map=allNodes(data).find(n=>n.d0===6170);
const url='https://widgy-maps-world-glass.vercel.app/api/home-map?v=120';
map['2']=url;
map['22']=`var main = function() {\n  return '${url}&t=' + Date.now();\n}`;
data['3']='Widgy Home v120 - Coastal Relief Map';
data['4']='v120: deeper cool-slate land with two-scale NASA texture detail and independent, softened coastal relief; fine Natural Earth 1:10m administrative borders. Higher-resolution NASA Black Marble 2016 source (13500 x 6750) improves urban networks, with warm cores and restrained local bloom. Subtle atmospheric colour tracks solar elevation at both real horizons; the NOAA/Meeus geometry and symmetric -6..+6 degree twilight mask are unchanged. Output remains 2400 x 1188. All native geometry, weather artwork/conditions, variables and live 24-hour no-seconds System Light clock are unchanged from v119. Historical textures with dynamic illumination, not live satellite imagery or a pixel-identical copy of the reference. Location remains approximate IP and may lack a city name.';
const restored=structuredClone(data);
Object.assign(allNodes(restored).find(n=>n.d0===6170),structuredClone(allNodes(before).find(n=>n.d0===6170)));
restored['3']=before['3'];restored['4']=before['4'];
assert.deepEqual(restored,before);
assert.equal(allNodes(data).find(n=>n.d0===6110)['66'][0]['6'],'Live Timer (24 hours, No Seconds)');
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');
let html=read('widgy-v119.html').replaceAll('v119','v120')
 .replace('מפה גבוהה ומפורטת יותר, עם יבשות ברורות בלילה ואורות ערים חמים.','מפה בגווני כחול עמוקים, קווי חוף מעודנים ואורות ערים מפורטים יותר.')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`)
 .replaceAll('Refined Night Map','Coastal Relief Map');
assert.equal(gunzipSync(Buffer.from(html.match(/const packed=\['([^']+)'\]/)[1],'base64')).toString(),payload);
write('widgy-v120.json',payload);
write('widgy-v120.html',html);
write('widgy-v120-integration.json',JSON.stringify({base:'v119',status:'prepared',changedLayerIds:[6170],
 imageEndpoint:url,scope:'Map rendering only; all native layout, sources, conditions and artwork preserved',
 resolution:[2400,1188],coastline:'Natural Earth 1:10m',
 nightSource:{provider:'NASA Black Marble',year:2016,resolution:[13500,6750]},
 appearance:['Cool-slate multi-scale relief','Independent soft shoreline highlights','Detailed warm city-light networks','Elevation-based subtle twilight colour'],
 solarModel:'Unchanged NOAA/Meeus UTC geometry and -6..+6 degree blend with 50% at the geometric horizon',
 nativePreservationVerified:true,deviceVerified:false,bytes:Buffer.byteLength(payload),sha256:hash},null,2)+'\n');
let fragment=readFileSync('/workspace/widgy-v119-copy.html','utf8').replaceAll('v119','v120')
 .replace(/<script type="application\/json" data-packed>[\s\S]*?<\/script>/,`<script type="application/json" data-packed>${JSON.stringify(packed)}</script>`)
 .replace(/payload.length !== \d+/,`payload.length !== ${payload.length}`)
 .replaceAll('Refined Night Map','Coastal Relief Map')
 .replace(/hash !== '[^']+'/,`hash !== '${hash}'`);
writeFileSync('/workspace/widgy-v120-copy.html',fragment);
assert.equal(gunzipSync(Buffer.from(JSON.parse(fragment.match(/data-packed>([\s\S]*?)<\/script>/)[1]),'base64')).toString(),payload);
console.log(JSON.stringify({version:120,bytes:Buffer.byteLength(payload),sha256:hash,nativePreservation:'verified',copyPayload:'verified'}));
