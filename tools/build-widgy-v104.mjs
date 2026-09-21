import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const before=JSON.parse(read('widgy-v103.json')),data=structuredClone(before);
const layers=data['1'][0]['1'],sx=1134/1600,sy=1182/1600;
// Preserve v103 optical anchors. Scale all four day-composite layers together.
const adjustments=[{ids:[7302,7303,7053,7001],factor:1.04,cx:352.5,cy:370},
 {ids:[7010,79001,79002,7011],factor:1.04,cx:281.5,cy:754.5},
 {ids:[7009],factor:.95,cx:91.5,cy:754.5}];
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
data['3']='Native Weather Icons Master Board v104 - Final Size Refinement';
data['4']='Based on user-approved v103 and IMG_9389. Enlarge both Partly Cloudy Day and Partly Cloudy Night by 4 percent around their existing optical centers, applying the same transform to each cloud, sun or moon, and both separation masks. Reduce only the standalone clear-night moon by 5 percent around its existing optical center. Preserve all shapes, weights, colors, layer order and every other icon exactly. Native visual review required.';
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');write('widgy-v104.json',payload);
const html=read('widgy-v103.html').replaceAll('v103','v104')
 .replace('איזון גדלים — סט האייקונים','ליטוש גדלים — מעונן חלקית וירח')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('<textarea'));write('widgy-v104.html',html);
console.log(JSON.stringify({changedLayers:[...changed],dayScale:1.04,nightCompositeScale:1.04,moonScale:.95,payloadLength:payload.length,sha256:hash}));
