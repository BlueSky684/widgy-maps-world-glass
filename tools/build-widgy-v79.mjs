import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const before=JSON.parse(read('widgy-v77.json')),data=structuredClone(before);
const ids=new Set([77102,77105,77108,77202,77205,77208,77211]);
const source=JSON.parse(read('widgy-capsule-source.json'));
const library=JSON.parse(Buffer.from(source['2'],'base64').toString('utf8'));
assert(library.items.some(item=>item.id===source['3']));
assert.equal(source['1'].a[0].a,75);
let changed=0;
for(const layer of data['1'][0]['1']){
 if(!ids.has(layer.d0))continue;
 const old=before['1'][0]['1'].find(l=>l.d0===layer.d0);
 for(const key of ['1','2','3'])layer[key]=structuredClone(source[key]);
 layer.s=layer.s.replace('Single Rounded Shape · v77','Native Custom Capsule · v79');
 for(const k of ['b','c','d','e','q','i','g','z'])assert.deepEqual(layer[k],old[k]);
 changed++;
}
assert.equal(changed,7);
assert.deepEqual(data['1'][0]['1'].filter(l=>!ids.has(l.d0)),before['1'][0]['1'].filter(l=>!ids.has(l.d0)));
data['3']='Native Weather Icons Master Board v79 - Native Custom Capsule';
data['4']='Based on v77. Apply the exact native Custom Shape Capsule definition exported by the user on 2026-09-21 to all seven rain strokes. The custom shape selector, embedded shape library and selected shape UUID are copied together. Preserve all frames, rotations, corner settings, colours, spacing and other layers. Native on-device appearance requires visual review; no claim of verified tip removal.';
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64'),hash=createHash('sha256').update(payload).digest('hex');
write('widgy-v79.json',payload);
const html=read('widgy-v77.html').replaceAll('v77','v79')
 .replace('פסי גשם — ליטוש עדין','פסי גשם — Capsule מובנה')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('<textarea'));assert(!html.includes('id="manual"'));write('widgy-v79.html',html);
console.log(JSON.stringify({changedStrokes:changed,customShapeId:source['3'],payloadLength:payload.length,sha256:hash}));
