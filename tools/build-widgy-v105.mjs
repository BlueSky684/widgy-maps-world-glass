import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const before=JSON.parse(read('widgy-v104.json')),data=structuredClone(before);
const layers=data['1'][0]['1'],sx=1134/1600,sy=1182/1600;
// Preserve the standalone moon optical anchor and scale uniformly.
const adjustments=[{ids:[7009],factor:.97,cx:91.5,cy:754.5}];
const changed=new Set();
for(const {ids,factor,cx,cy} of adjustments){
 for(const id of ids){
  const l=layers.find(x=>x.d0===id);assert(l);changed.add(id);
  const ratio=l.d.a[0].a/l.e.a[0].a;
  l.b.a[0].a=cx/sx+(l.b.a[0].a-cx/sx)*factor;
  l.c.a[0].a=cy/sy+(l.c.a[0].a-cy/sy)*factor;
  l.d.a[0].a*=factor;l.e.a[0].a*=factor;
  assert(Math.abs(l.d.a[0].a/l.e.a[0].a-ratio)<1e-10);
 }
}
const restored=structuredClone(data);
for(const l of restored['1'][0]['1'])if(changed.has(l.d0)){
 const old=before['1'][0]['1'].find(x=>x.d0===l.d0);
 for(const key of ['b','c','d','e'])l[key]=old[key];
}
assert.deepEqual(restored,before);
data['3']='Native Weather Icons Master Board v105 - Moon Optical Balance';
data['4']='Based on v104 and IMG_9390. Reduce only the standalone clear-night moon by 3 percent around its existing optical center. Preserve all other layers and all contours, colors, weights and masks. Native visual review required.';
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');write('widgy-v105.json',payload);
const html=read('widgy-v104.html').replaceAll('v104','v105')
 .replace('ליטוש גדלים — מעונן חלקית וירח','איזון עדין — הירח הבודד')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('<textarea'));write('widgy-v105.html',html);
console.log(JSON.stringify({changedLayers:[...changed],moonScale:.97,payloadLength:payload.length,sha256:hash}));
