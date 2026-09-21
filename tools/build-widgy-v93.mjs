import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const before=JSON.parse(read('widgy-v92.json')),data=structuredClone(before);
const layer=data['1'][0]['1'].find(l=>l.d0===77102);
const old=before['1'][0]['1'].find(l=>l.d0===77102);
const library=JSON.parse(Buffer.from(layer['2'],'base64').toString('utf8'));
const item=library.items.find(item=>item.id===layer['3']);
assert.equal(item.shape.rounding,0);
assert.equal(item.shape.points.length,50);
const original=structuredClone(item.shape.points);
const boxW=old.d.a[0].a*1134/1600,boxH=old.e.a[0].a*1182/1600;
const physical=original.map(p=>({x:p.x*boxW,y:p.y*boxH}));
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const dot=(a,b)=>a.x*b.x+a.y*b.y;
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const span=sub(physical[24],physical[0]);
const radius=Math.hypot(span.x,span.y)/2;
const across={x:span.x/(2*radius),y:span.y/(2*radius)};
const along={x:-across.y,y:across.x};
const oldCenter={x:(physical[0].x+physical[24].x)/2,y:(physical[0].y+physical[24].y)/2};
const crown=physical[12];
// v92 mirrored the existing left arc, including its axial stretch inherited
// from the reference display aspect ratio. Symmetry alone did not make that
// cap circular. Define the replacement directly in physical display units.
const center={x:crown.x+radius*along.x,y:crown.y+radius*along.y};
assert(Math.abs(radius-4.625)<1e-9);
const cap=t=>{
 const angle=Math.PI+t*Math.PI;
 return {
  x:center.x+radius*(Math.cos(angle)*across.x+Math.sin(angle)*along.x),
  y:center.y+radius*(Math.cos(angle)*across.y+Math.sin(angle)*along.y)
 };
};
for(let n=0;n<=24;n++){
 const p=cap(n/24);
 if(n===12){assert(Math.hypot(p.x-crown.x,p.y-crown.y)<1e-9);continue;}
 item.shape.points[n]={x:p.x/boxW,y:p.y/boxH};
}
const contour=item.shape.points.map(p=>({x:p.x*boxW,y:p.y*boxH}));
const oldAxialRadius=-dot(sub(crown,oldCenter),along);
let maxRadiusError=0,maxSymmetryError=0,maxPointShift=0;
for(let n=0;n<=24;n++){
 const p=sub(contour[n],center),mirror=sub(contour[24-n],center);
 maxRadiusError=Math.max(maxRadiusError,Math.abs(Math.hypot(p.x,p.y)-radius));
 maxSymmetryError=Math.max(maxSymmetryError,Math.hypot(dot(p,across)+dot(mirror,across),dot(p,along)-dot(mirror,along)));
 maxPointShift=Math.max(maxPointShift,Math.hypot(contour[n].x-physical[n].x,contour[n].y-physical[n].y));
}
assert(maxRadiusError<1e-9);
assert(maxSymmetryError<1e-9);
assert(maxPointShift<.253);
// Preserve both parallel sides and their width. Moving their cap joins
// along those same lines retains the crown and full axial stroke length.
for(const [top,bottom] of [[0,49],[24,25]]){
 assert(Math.abs(cross(sub(contour[bottom],contour[top]),along))<1e-9);
 assert(Math.abs(dot(sub(contour[top],physical[top]),across))<1e-9);
 assert(dot(sub(contour[bottom],contour[top]),along)>0);
}
const length=points=>{
 const projections=points.map(p=>dot(p,along));
 return Math.max(...projections)-Math.min(...projections);
};
assert(Math.abs(length(contour)-length(physical))<1e-9);
for(let n=0;n<50;n++){
 if(n>=25||n===12)assert.deepEqual(item.shape.points[n],original[n]);
 const p=item.shape.points[n];
 assert(p.x>0&&p.x<1&&p.y>0&&p.y<1);
 assert(Math.abs(dot(sub(contour[n],center),across))<=radius+1e-9);
 const a=contour[n],b=contour[(n+1)%50],c=contour[(n+2)%50];
 assert(cross(sub(b,a),sub(c,b))>0,'Keep a convex contour');
}
// Check the exported sample points, not only the circle construction:
// every interior cap vertex must have the same circumcircle curvature.
let maxCurvatureError=0;
for(let n=1;n<24;n++){
 const a=sub(contour[n],contour[n-1]),b=sub(contour[n+1],contour[n]),c=sub(contour[n+1],contour[n-1]);
 const curvature=2*cross(a,b)/(Math.hypot(a.x,a.y)*Math.hypot(b.x,b.y)*Math.hypot(c.x,c.y));
 maxCurvatureError=Math.max(maxCurvatureError,Math.abs(curvature-1/radius));
}
assert(maxCurvatureError<1e-9);
const maxChordError=radius*(1-Math.cos(Math.PI/48));
assert(maxChordError<.01);
item.id='E785CA93-9F64-4DB1-A105-528838F93C93';
item.name='Circular Rain Cap v93';
layer['3']=item.id;layer['2']=Buffer.from(JSON.stringify(library)).toString('base64');
layer.s=layer.s.replace('Mirrored Cap · v92','Circular Cap · v93');
for(const k of ['b','c','d','e','q','i','g','z','1'])assert.deepEqual(layer[k],old[k]);
assert.deepEqual(data['1'][0]['1'].filter(l=>l.d0!==77102),before['1'][0]['1'].filter(l=>l.d0!==77102));
assert.deepEqual(data['1'].slice(1),before['1'].slice(1));
data['3']='Native Weather Icons Master Board v93 - Circular Rain Cap';
data['4']='Based on v92 and screenshots IMG_9369/IMG_9371. Replace the upper cap of stroke 77102 with a constant-radius semicircle in reference display coordinates. The previous symmetric arc retained an axial stretch (4.877 versus 4.625 reference pixels) and a crown correction. The new circle radius is exactly half the existing 9.25-pixel body width. Preserve the crown and full axial length by advancing the two side joins along the same straight sides; all lower-cap points, frame, position, angle and other layers remain unchanged. Fifty contour points; maximum circular chord deviation under 0.01 reference pixel. Native appearance requires on-device review.';
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64'),hash=createHash('sha256').update(payload).digest('hex');
write('widgy-v93.json',payload);
const html=read('widgy-v92.html').replaceAll('v92','v93')
 .replace('קצה מעוגל וסימטרי — פס בדיקה אחד','קצה עגול ברדיוס אחיד — פס בדיקה אחד')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('<textarea'));assert(!html.includes('id="manual"'));
write('widgy-v93.html',html);
console.log(JSON.stringify({changedStrokes:1,points:50,bodyWidth:2*radius,oldAxialRadius,newRadius:radius,maxRadiusError,maxSymmetryError,maxPointShift,maxCurvatureError,maxChordError,payloadLength:payload.length,sha256:hash}));
