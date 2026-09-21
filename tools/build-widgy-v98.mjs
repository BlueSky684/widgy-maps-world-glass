import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const before=JSON.parse(read('widgy-v97.json')),data=structuredClone(before);
const layers=data['1'][0]['1'];
const master=layers.find(l=>l.d0===77102);
const reference=JSON.parse(read('widgy-v77.json'))['1'][0]['1'];
const referenceMaster=reference.find(l=>l.d0===77102);
const copies=[[77105,28,'Light Rain · Stroke 2'],[77108,56,'Light Rain · Stroke 3'],
  [77202,202,'Heavy Rain · Stroke 1'],[77205,230,'Heavy Rain · Stroke 2'],
  [77208,258,'Heavy Rain · Stroke 3'],[77211,286,'Heavy Rain · Stroke 4']];
const scaleX=1134/1600;
for(const [id,offset,name] of copies){
  const index=layers.findIndex(l=>l.d0===id);
  assert(index>=0);
  const placement=reference.find(l=>l.d0===id);
  assert(Math.abs((placement.b.a[0].a-referenceMaster.b.a[0].a)*scaleX-offset)<1e-9);
  assert.deepEqual(placement.c,referenceMaster.c);
  const clone=structuredClone(master);
  clone.d0=id;clone.s=name+' · Approved Rain Master · v98';
  // Whole reference-pixel translations preserve the approved sampling phase.
  // Clone the actual shape, frame, fill and native Blur without reconstruction.
  clone.b.a[0].a=master.b.a[0].a+offset/scaleX;
  assert(Math.abs((clone.b.a[0].a-master.b.a[0].a)*scaleX-offset)<1e-9);
  const normalized=structuredClone(clone);
  normalized.b=structuredClone(master.b);normalized.d0=master.d0;normalized.s=master.s;
  assert.deepEqual(normalized,master);
  layers[index]=clone;
}
const ids=new Set(copies.map(c=>c[0]));
assert.deepEqual(layers.filter(l=>!ids.has(l.d0)),before['1'][0]['1'].filter(l=>!ids.has(l.d0)));
assert.deepEqual(data['1'].slice(1),before['1'].slice(1));
assert.deepEqual(layers.find(l=>l.d0===77102),before['1'][0]['1'].find(l=>l.d0===77102));
data['3']='Native Weather Icons Master Board v98 - Approved Rain Strokes';
data['4']='The user approved the complete v97 rain stroke. Duplicate layer 77102 exactly onto the other two Light Rain strokes and four Heavy Rain strokes, retaining their IDs and original 28-reference-pixel pitch. Copies translate by 28, 56, 202, 230, 258 and 286 reference pixels horizontally; no vertical translation. The source remains unchanged. All seven share the exact v97 contour, frame dimensions, selected custom shape, rotation, fill and native Blur 0.25. All other layers remain unchanged. Integer offsets preserve the approved sampling phase at the 1134x1182 reference size.';
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');
write('widgy-v98.json',payload);
const html=read('widgy-v97.html').replaceAll('v97','v98')
  .replace('ליטוש הקצה התחתון — הפס השמאלי בגשם קל','הפס המאושר — בכל פסי הגשם הקל והכבד')
  .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
  .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
  .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
  .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('<textarea'));
write('widgy-v98.html',html);
console.log(JSON.stringify({exactCopies:6,sourceUnchanged:true,totalMatchingRainStrokes:7,
  offsets:copies.map(c=>c[1]),payloadLength:payload.length,sha256:hash}));
