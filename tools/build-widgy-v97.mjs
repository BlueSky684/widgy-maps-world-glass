import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const before=JSON.parse(read('widgy-v96.json')),data=structuredClone(before);
const layer=data['1'][0]['1'].find(l=>l.d0===77102);
const old=before['1'][0]['1'].find(l=>l.d0===77102);
const library=JSON.parse(Buffer.from(layer['2'],'base64').toString('utf8'));
const item=library.items.find(s=>s.id===layer['3']);
const original=structuredClone(item.shape.points);
assert.equal(original.length,50);
assert.equal(item.shape.rounding,0);
assert.equal(layer.p.a[0].a,0.25);
const scale={x:1134/1600,y:1182/1600};
const box={x:old.d.a[0].a*scale.x,y:old.e.a[0].a*scale.y};
const origin={x:Math.round(old.b.a[0].a*scale.x),y:Math.round(old.c.a[0].a*scale.y)};
const physical=original.map(p=>({x:origin.x+p.x*box.x,y:origin.y+p.y*box.y}));
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const dot=(a,b)=>a.x*b.x+a.y*b.y;
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const midpoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
const top=midpoint(physical[0],physical[24]);
const bottom=midpoint(physical[25],physical[49]);
const span=sub(physical[24],physical[0]);
const radius=Math.hypot(span.x,span.y)/2;
const across={x:span.x/(2*radius),y:span.y/(2*radius)};
const along={x:-across.y,y:across.x};
// The user accepts v96's upper end. Keep its vertices, frame and Blur exact.
// Match its sampling phase as closely as possible by sliding the lower cap
// along the existing axis, constrained to shorten by less than one reference
// pixel. This preserves both straight sides and geometric width.
const candidates=[];
for(let x=Math.floor(bottom.x)-1;x<=Math.ceil(bottom.x)+1;x++){
  for(let y=Math.floor(bottom.y)-1;y<=Math.ceil(bottom.y)+1;y++){
    const target={x:x+0.5,y:y+0.5};
    const distance=dot(sub(target,bottom),along);
    if(distance>=0||distance<=-1)continue;
    const delta={x:distance*along.x,y:distance*along.y};
    const center={x:bottom.x+delta.x,y:bottom.y+delta.y};
    candidates.push({target,distance,delta,center,error:Math.hypot(center.x-target.x,center.y-target.y)});
  }
}
candidates.sort((a,b)=>a.error-b.error);
assert(candidates.length>0);
const best=candidates[0];
assert(best.error<0.027);
assert(Math.abs(best.distance)<0.86);
for(let n=25;n<50;n++)item.shape.points[n]={
  x:original[n].x+best.delta.x/box.x,
  y:original[n].y+best.delta.y/box.y
};
const contour=item.shape.points.map(p=>({x:origin.x+p.x*box.x,y:origin.y+p.y*box.y}));
for(let n=0;n<50;n++){
  if(n<25)assert.deepEqual(item.shape.points[n],original[n]);
  const center=n<25?top:best.center;
  assert(Math.abs(Math.hypot(contour[n].x-center.x,contour[n].y-center.y)-radius)<1e-9);
  const p=item.shape.points[n];
  assert(p.x>0&&p.x<1&&p.y>0&&p.y<1);
  assert(cross(sub(contour[(n+1)%50],contour[n]),sub(contour[(n+2)%50],contour[(n+1)%50]))>0);
}
for(const [a,b] of [[0,49],[24,25]])assert(Math.abs(cross(sub(contour[b],contour[a]),along))<1e-9);
const extent=(p,axis)=>{
  const values=p.map(v=>dot(v,axis));return Math.max(...values)-Math.min(...values);
};
assert(Math.abs(extent(contour,across)-9.25)<1e-9);
assert(Math.abs(extent(contour,along)-extent(physical,along)-best.distance)<1e-9);
item.id='E785CA97-9F64-4DB1-A105-528838F93C97';
item.name='Lower Cap Sampling v97';
layer['3']=item.id;layer['2']=Buffer.from(JSON.stringify(library)).toString('base64');
layer.s='Light Rain · Stroke 1 · Lower Cap Sampling · v97';
const restored=structuredClone(data);
const restoredLayer=restored['1'][0]['1'].find(l=>l.d0===77102);
for(const k of ['2','3','s'])restoredLayer[k]=old[k];
assert.deepEqual(restored,before);
data['3']='Native Weather Icons Master Board v97 - Lower Cap Sampling';
data['4']='Based on v96 and native IMG_9380. Preserve the accepted upper contour, native Blur 0.25, frame, fill and all other layers. Slide only the circular lower cap along the existing straight axis by -0.851767 reference pixel; this shortens the stroke by that amount while retaining 9.25 geometric width and the angle. The lower center moves approximately (+0.425884,-0.737652) reference pixels, placing its sampling phase within 0.02628 pixel of the upper cap phase. No radial fill patches or new layers. Reference size is 1134x1182. Sampling benefit depends on native rendering and scale; review in Widgy is still required.';
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');
write('widgy-v97.json',payload);
const html=read('widgy-v96.html').replaceAll('v96','v97')
  .replace('בדיקת קצוות אחידים — הפס השמאלי בגשם קל','ליטוש הקצה התחתון — הפס השמאלי בגשם קל')
  .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
  .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
  .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
  .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('<textarea'));
write('widgy-v97.html',html);
console.log(JSON.stringify({changedStrokes:1,width:2*radius,shortening:-best.distance,
  lowerCenter:best.center,delta:best.delta,samplingError:best.error,
  upperContourAndBlurUnchanged:true,payloadLength:payload.length,sha256:hash}));
