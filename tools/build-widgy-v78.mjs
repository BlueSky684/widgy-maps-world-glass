import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const before=JSON.parse(read('widgy-v77.json')),data=structuredClone(before);
const ids=new Set([77102,77105,77108,77202,77205,77208,77211]);
let changed=0;
for(const layer of data['1'][0]['1']){
 if(!ids.has(layer.d0))continue;
 const old=before['1'][0]['1'].find(l=>l.d0===layer.d0);
 // Bound the native corner parameter to half the narrow dimension instead
 // of a fixed oversized value. Native rendering still needs device review.
 layer.i.a[0].a=Math.min(layer.d.a[0].a,layer.e.a[0].a)/2;
 layer.s=layer.s.replace('v77','v78');
 for(const k of ['b','c','d','e','q','g','z'])assert.deepEqual(layer[k],old[k]);
 assert.equal(layer.i.a[0].a,layer.d.a[0].a/2);
 changed++;
}
assert.equal(changed,7);
assert.deepEqual(data['1'][0]['1'].filter(l=>!ids.has(l.d0)),before['1'][0]['1'].filter(l=>!ids.has(l.d0)));
data['3']='Native Weather Icons Master Board v78 - Bounded Rain Corners';
data['4']='Based on v77. Replace the fixed corner parameter 50 on all seven native rain shapes with half of their narrow dimension (6.5255731922398585). Preserve frames, centres, colour, rotation, spacing and all other layers. This targets oversized corner geometry. Widgy corner-parameter units and native rendering are not independently documented here; on-device visual review is required before final approval.';
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64'),hash=createHash('sha256').update(payload).digest('hex');
write('widgy-v78.json',payload);
const html=read('widgy-v77.html').replaceAll('v77','v78')
 .replace('פסי גשם — ליטוש עדין','פסי גשם — תיקון עיגול הקצוות')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('<textarea'));assert(!html.includes('id="manual"'));write('widgy-v78.html',html);
console.log(JSON.stringify({changedStrokes:changed,cornerParameter:6.5255731922398585,payloadLength:payload.length,sha256:hash}));
