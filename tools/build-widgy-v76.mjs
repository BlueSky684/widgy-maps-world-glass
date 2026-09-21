import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const before=JSON.parse(read('widgy-v75.json')),data=structuredClone(before);
const ids=new Set([77102,77105,77108,77202,77205,77208,77211]);
// Native Shape corner-rounding field, copied from existing exported Widgy
// shape layers (e.g. Temp background, d0=13, i={a:[{a:40,b:861}],b:0}).
// Use maximum corner rounding on the narrow rectangle. No symbol end caps,
// overlapping parts, external image, or group rasterisation are needed.
data['1'][0]['1']=data['1'][0]['1'].map(layer=>{
 if(!ids.has(layer.d0))return layer;
 assert.equal(layer.z,'13');
 const body=layer['1'].find(child=>child.z==='2');assert(body);
 const stroke={z:'2',d0:layer.d0,s:layer.s.replace('Aligned Capsule · v75','Single Rounded Shape · v76'),g:body.g,q:layer.q,i:{a:[{a:50,b:861}],b:0}};
 for(const key of 'bcde'){
  stroke[key]=structuredClone(body[key]);stroke[key].a[0].a=layer[key].a[0].a;
 }
 return stroke;
});
data['3']='Native Weather Icons Master Board v76 - Single Shape Rain';
data['4']='Based on v75. Each of the seven rain strokes is now one native Widgy Shape (z=2) using the existing exported corner-rounding field i at 50. The separate circle.fill caps and groups are removed. Overall frames, colour, 30-degree rotation and 3/4 count are retained. This eliminates composite joins by construction. Other layers are unchanged. Check the resulting native corner rounding in Widgy on-device.';
const originalOther=before['1'][0]['1'].filter(l=>!ids.has(l.d0));
assert.deepEqual(data['1'][0]['1'].filter(l=>!ids.has(l.d0)),originalOther);
const strokes=data['1'][0]['1'].filter(l=>ids.has(l.d0));assert.equal(strokes.length,7);
for(const l of strokes){assert.equal(l.z,'2');assert.equal(l.i.a[0].a,50);assert.equal(l.q,30);assert(!('1' in l));assert(!('3' in l));}
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64'),hash=createHash('sha256').update(payload).digest('hex');
write('widgy-v76.json',payload);
const html=read('widgy-v75.html').replaceAll('v75','v76')
 .replace('פסי גשם — יישור וסיבוב משותף','פסי גשם — קצוות מעוגלים ברצף אחד')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('<textarea'));assert(!html.includes('id="manual"'));write('widgy-v76.html',html);
console.log(JSON.stringify({nativeSingleShapes:strokes.length,removedCaps:14,removedGroups:7,unchangedLayers:originalOther.length,payloadLength:payload.length,sha256:hash}));
