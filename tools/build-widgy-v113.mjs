import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {allNodes} from './build-widgy-v110.mjs';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const write=(name,data)=>writeFileSync(new URL(name,import.meta.url),data);
const before=JSON.parse(read('widgy-v112.json'));
const data=structuredClone(before),nodes=allNodes(data);
const changed=[6115,6116,6117,6170,6171];
const map=nodes.find(n=>n.d0===6170);
const url='https://widgy-maps-world-glass.vercel.app/api/home-map?v=113';
// Native Javascript image source and key 22 are copied from the user's
// World Map Glass export dated 2026-09-22 05:52:20.
map['1']='Javascript';
map['2']=url;
map['3']=true;
map['22']=`var main = function() {\n  return '${url}&t=' + Date.now();\n}`;
for(const id of [6115,6116,6117,6171]) nodes.find(n=>n.d0===id).a=false;
data['3']='Widgy Home v113 - Living World Map';
data['4']=before['4']+' v113: NASA detailed dark world map with Natural Earth country outlines, a solar day/night calculation, city lights, rounded rim and lime/white location marker. Marker and labels use the same approximate IP geolocation supplied by Vercel, as in the uploaded World Map Glass endpoint; not verified phone GPS. Map refreshes when Widgy evaluates its image Javascript. The native live timer migration is pending a verified timer export. All non-map layers preserve v112.';

// Require a precise map-only difference; header, weather, variables, progress,
// clock and all other layers must survive byte-for-byte structurally unchanged.
const restored=structuredClone(data),restoreNodes=allNodes(restored);
for(const id of changed) {
 const node=restoreNodes.find(n=>n.d0===id);
 for(const key of Object.keys(node)) delete node[key];
 Object.assign(node,structuredClone(allNodes(before).find(n=>n.d0===id)));
}
restored['3']=before['3'];restored['4']=before['4'];assert.deepEqual(restored,before);
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');
let html=read('widgy-v112.html').replaceAll('v112','v113')
 .replace('יישור שם היום והחודש לימין, לפי המאסטר המאושר.','מפת עולם מפורטת עם יום–לילה דינמיים וסמן ליים.')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert.equal(gunzipSync(Buffer.from(html.match(/const packed=\['([^']+)'\]/)[1],'base64')).toString(),payload);
write('widgy-v113.json',payload);
write('widgy-v113.html',html);
write('widgy-v113-integration.json',JSON.stringify({base:'v112',status:'pending-deployment-and-device-check',
 changedLayerIds:changed,source:'User native Javascript image export, 2026-09-22',
 imageEndpoint:url,location:'Approximate Vercel IP location; not phone GPS',
 mapRefresh:'On Widgy image source evaluation; no second-by-second redraw guarantee',
 clock:'Unchanged, native Live Timer export still required',deviceVerified:false,
 bytes:Buffer.byteLength(payload),sha256:hash},null,2)+'\n');
const fragmentPath='/workspace/widgy-v112-copy.html';
let fragment=readFileSync(fragmentPath,'utf8').replaceAll('v112','v113')
 .replace(/<script type="application\/json" data-packed>[\s\S]*?<\/script>/,`<script type="application/json" data-packed>${JSON.stringify(packed)}</script>`)
 .replace(/payload.length !== \d+/,`payload.length !== ${payload.length}`)
 .replace('Widgy Home v113 - Right Aligned Date',data['3'])
 .replace(/hash !== '[^']+'/,`hash !== '${hash}'`);
writeFileSync('/workspace/widgy-v113-copy.html',fragment);
assert.equal(gunzipSync(Buffer.from(JSON.parse(fragment.match(/data-packed>([\s\S]*?)<\/script>/)[1]),'base64')).toString(),payload);
console.log(JSON.stringify({version:113,bytes:Buffer.byteLength(payload),sha256:hash,scope:'map-only',copyPayload:'verified'}));
