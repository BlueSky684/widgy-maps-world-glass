import {readFileSync, writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const read = n => readFileSync(new URL(n, import.meta.url), 'utf8');
const write = (n, s) => writeFileSync(new URL(n, import.meta.url), s);
const before = JSON.parse(read('widgy-v95.json'));
const data = structuredClone(before);
const layer = data['1'][0]['1'].find(l => l.d0 === 77102);
const old = before['1'][0]['1'].find(l => l.d0 === 77102);
const library = JSON.parse(Buffer.from(layer['2'], 'base64').toString('utf8'));
const item = library.items.find(s => s.id === layer['3']);
assert.equal(item.shape.rounding, 0);
assert.equal(item.shape.points.length, 50);
assert.equal(old.p.a[0].a, 0.2);
const original = structuredClone(item.shape.points);
const boxW = old.d.a[0].a * 1134 / 1600;
const boxH = old.e.a[0].a * 1182 / 1600;
const physical = original.map(p => ({x:p.x*boxW, y:p.y*boxH}));
const sub = (a,b) => ({x:a.x-b.x, y:a.y-b.y});
const dot = (a,b) => a.x*b.x+a.y*b.y;
const cross = (a,b) => a.x*b.y-a.y*b.x;
const span = sub(physical[24],physical[0]);
const radius = Math.hypot(span.x,span.y)/2;
const across = {x:span.x/(2*radius), y:span.y/(2*radius)};
const along = {x:-across.y, y:across.x};
const upperCenter = {x:(physical[0].x+physical[24].x)/2,
  y:(physical[0].y+physical[24].y)/2};
const oldLowerCenter = {x:(physical[25].x+physical[49].x)/2,
  y:(physical[25].y+physical[49].y)/2};
const crown = physical[37];
const oldAxialRadius = dot(sub(crown,oldLowerCenter),along);
// Keep the lower axial tip and full stroke length. The inherited lower
// ellipse has axial radius 4.820767 versus transverse radius 4.625.
// Match the upper cap's circular curvature, leaving every upper point intact.
const lowerCenter = {x:crown.x-radius*along.x, y:crown.y-radius*along.y};
assert(Math.abs(radius-4.625)<1e-9);
for(let n=0;n<=24;n++){
  if(n===12)continue; // Preserve the axial tip exactly, including serialization.
  const angle=n*Math.PI/24;
  const p={x:lowerCenter.x+radius*(Math.cos(angle)*across.x+Math.sin(angle)*along.x),
    y:lowerCenter.y+radius*(Math.cos(angle)*across.y+Math.sin(angle)*along.y)};
  item.shape.points[25+n]={x:p.x/boxW,y:p.y/boxH};
}
const contour=item.shape.points.map(p=>({x:p.x*boxW,y:p.y*boxH}));
let maxRadiusError=0,maxCapShift=0;
for(let n=0;n<50;n++){
  if(n<25||n===37)assert.deepEqual(item.shape.points[n],original[n]);
  const c=n<25?upperCenter:lowerCenter;
  maxRadiusError=Math.max(maxRadiusError,Math.abs(Math.hypot(contour[n].x-c.x,contour[n].y-c.y)-radius));
  maxCapShift=Math.max(maxCapShift,Math.hypot(contour[n].x-physical[n].x,contour[n].y-physical[n].y));
  const p=item.shape.points[n];
  assert(p.x>0&&p.x<1&&p.y>0&&p.y<1,'Keep padded contour inside frame');
  assert(cross(sub(contour[(n+1)%50],contour[n]),sub(contour[(n+2)%50],contour[(n+1)%50]))>0);
}
assert(maxRadiusError<1e-9);
assert(maxCapShift<0.196);
for(const [top,bottom] of [[0,49],[24,25]]){
  assert(Math.abs(cross(sub(contour[bottom],contour[top]),along))<1e-9);
}
const extent=(points,axis)=>{
  const values=points.map(p=>dot(p,axis));
  return Math.max(...values)-Math.min(...values);
};
assert(Math.abs(extent(contour,along)-extent(physical,along))<1e-9);
assert(Math.abs(extent(contour,across)-9.25)<1e-9);

// Slightly increase the verified native effect for the remaining upper-edge
// stepping reported by the user. Units and native appearance require review.
layer.p.a[0].a=0.25;
item.id='E785CA96-9F64-4DB1-A105-528838F93C96';
item.name='Equal Circular Rain Caps v96';
layer['3']=item.id;
layer['2']=Buffer.from(JSON.stringify(library)).toString('base64');
layer.s='Light Rain · Stroke 1 · Equal Circular Caps · v96';
const restored=structuredClone(data);
const restoredLayer=restored['1'][0]['1'].find(l=>l.d0===77102);
for(const k of ['2','3','s','p'])restoredLayer[k]=structuredClone(old[k]);
assert.deepEqual(restored,before);

data['3']='Native Weather Icons Master Board v96 - Equal Circular Caps';
data['4']='Based on v95 and IMG_9379. Only stroke 77102 changes. The lower cap inherited an axial radius of 4.820767 reference pixels versus the 4.625 transverse radius. Replace it with a 4.625-radius semicircle matching the upper cap. Preserve all 25 upper contour vertices, the lower axial tip, full axial length, 9.25 geometric width, angle, frame, position and fill. Change native Blur from 0.2 to 0.25 for the remaining upper-edge stepping. All other layers remain unchanged. These are geometry and effect checks; visual quality and perceived width still require native Widgy review.';
const payload=JSON.stringify(data);
const packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');
write('widgy-v96.json',payload);
const html=read('widgy-v95.html').replaceAll('v95','v96')
  .replace('בדיקת ריכוך עדין — הפס השמאלי בגשם קל','בדיקת קצוות אחידים — הפס השמאלי בגשם קל')
  .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
  .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
  .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
  .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('<textarea'));
write('widgy-v96.html',html);
console.log(JSON.stringify({changedStrokes:1,width:2*radius,oldLowerAxialRadius:oldAxialRadius,
  radius,maxRadiusError,maxCapShift,upperGeometryUnchanged:true,blur:0.25,
  payloadLength:payload.length,sha256:hash}));
