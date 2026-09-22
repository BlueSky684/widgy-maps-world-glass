import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {allNodes} from './build-widgy-v110.mjs';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const write=(name,data)=>writeFileSync(new URL(name,import.meta.url),data);
const before=JSON.parse(read('widgy-v124.json')),data=structuredClone(before);
const map=allNodes(data).find(n=>n.d0===6170);
const url='https://widgy-maps-world-glass.vercel.app/api/home-map?v=125';
map['2']=url;
map['22']=`var main = function() {\n  return '${url}&t=' + Date.now();\n}`;
data['3']='Widgy Home v125 - Rich Graphite Dynamic Map';
data['4']='v125: reduces pale daylight midtones and excessive coastline highlights. Richer cool graphite terrain, softer daylight borders and preserved local relief. The entire v124 dynamic solar model, moving blue glow, night-only historical city lights, approximate IP location, rounded frame and refresh behavior are retained. All native positions and other layers remain as in v124, including Live Timer (24 hours, No Seconds).';
const restored=structuredClone(data);
Object.assign(allNodes(restored).find(n=>n.d0===6170),structuredClone(allNodes(before).find(n=>n.d0===6170)));
restored['3']=before['3'];restored['4']=before['4'];assert.deepEqual(restored,before);
assert.equal(allNodes(data).find(n=>n.d0===6110)['66'][0]['6'],'Live Timer (24 hours, No Seconds)');
assert.ok(Math.abs(map.d.a[0].a/map.e.a[0].a-1828/860)<1e-12);
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');
const html=read('widgy-v124.html').replaceAll('v124','v125')
 .replace('מפה דינמית: יום ולילה לפי השעה, אורות ערים בלילה והילה שנעה עם גבול האור.','מפה דינמית בגוני גרפיט עמוקים יותר, עם קווי חוף מעודנים ואורות ערים בלילה.')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert.equal(gunzipSync(Buffer.from(html.match(/const packed=\['([^']+)'\]/)[1],'base64')).toString(),payload);
write('widgy-v125.json',payload);write('widgy-v125.html',html);
write('widgy-v125-integration.json',JSON.stringify({base:'v124',changedLayerIds:[6170],imageEndpoint:url,
 resolution:[1828,860],staticLighting:false,locationMarker:'approximate IP when available',
 nativePreservationVerified:true,deviceVerified:false,
 refresh:'new server-time image on Widgy data refresh; timestamp query prevents URL cache reuse',
 bytes:Buffer.byteLength(payload),sha256:hash},null,2)+'\n');
console.log(JSON.stringify({version:125,bytes:Buffer.byteLength(payload),sha256:hash,nativePreservation:'verified',aspectRatio:'verified',copyPayload:'verified'}));
