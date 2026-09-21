import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const before=JSON.parse(read('widgy-v76.json')),data=structuredClone(before);
const ids=new Set([77102,77105,77108,77202,77205,77208,77211]);
const sx=1134/1600, extraWidth=0.25/sx;
let changed=0;
for(const layer of data['1'][0]['1']){
 if(!ids.has(layer.d0))continue;
 const old=before['1'][0]['1'].find(l=>l.d0===layer.d0);
 layer.b.a[0].a-=extraWidth/2;
 layer.d.a[0].a+=extraWidth;
 layer.s=layer.s.replace('v76','v77');
 assert(Math.abs(layer.b.a[0].a+layer.d.a[0].a/2-(old.b.a[0].a+old.d.a[0].a/2))<1e-9);
 for(const k of ['c','e','q','i','g','z'])assert.deepEqual(layer[k],old[k]);
 changed++;
}
assert.equal(changed,7);
assert.deepEqual(data['1'][0]['1'].filter(l=>!ids.has(l.d0)),before['1'][0]['1'].filter(l=>!ids.has(l.d0)));
data['3']='Native Weather Icons Master Board v77 - Subtle Rain Polish';
data['4']='Based on v76. Increase each single native rounded rain stroke from 9 to 9.25 reference pixels in width (+2.78%), symmetrically about its existing centre. Full length, centres, angle, spacing, corner-rounding setting, colours and all other layers are unchanged. This is a subtle fuller-stroke comparison, not an asserted anti-aliasing fix. v76 is retained for comparison; final appearance requires user approval in Widgy.';
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64'),hash=createHash('sha256').update(payload).digest('hex');
write('widgy-v77.json',payload);
const html=read('widgy-v76.html').replaceAll('v76','v77')
 .replace('פסי גשם — קצוות מעוגלים ברצף אחד','פסי גשם — ליטוש עדין')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('<textarea'));assert(!html.includes('id="manual"'));write('widgy-v77.html',html);
console.log(JSON.stringify({changedStrokes:changed,widthIncreasePercent:100*.25/9,payloadLength:payload.length,sha256:hash}));
