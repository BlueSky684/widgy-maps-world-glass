import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const before=JSON.parse(read('widgy-v85.json')),data=structuredClone(before);
const layer=data['1'][0]['1'].find(l=>l.d0===77102);
const old=before['1'][0]['1'].find(l=>l.d0===77102);
const library=JSON.parse(Buffer.from(layer['2'],'base64').toString('utf8'));
const item=library.items.find(item=>item.id===layer['3']);
assert.equal(item.shape.rounding,0);
assert.equal(item.shape.points.length,50);
const original=structuredClone(item.shape.points);
const boxW=old.d.a[0].a*1134/1600,boxH=old.e.a[0].a*1182/1600;
const physical=original.map(p=>({x:p.x*boxW,y:p.y*boxH}));
const angle=Math.PI/6,across={x:Math.cos(angle),y:Math.sin(angle)};
const side={x:-Math.sin(angle),y:Math.cos(angle)};
const dot=(a,b)=>a.x*b.x+a.y*b.y;
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const radius=dot(sub(physical[24],physical[0]),across)/2;
assert(Math.abs(radius-4.625)<1e-9);
// Replace the entire right-quarter segment with one rational quadratic.
// Retain its endpoints and analytic tangents. At the start (-60 degrees),
// the retained v84 correction has a nonzero derivative; the v85 bump has
// zero value and derivative. Include that derivative to avoid a new kink.
const startAngle=-Math.PI/3;
const phase=2*(startAngle+Math.PI/2);
const offset=.10*Math.sin(phase)**4;
const derivative=.80*Math.sin(phase)**3*Math.cos(phase);
const tangent={
 x:radius*across.x+derivative*Math.cos(startAngle)-offset*Math.sin(startAngle),
 y:radius*across.y+derivative*Math.sin(startAngle)+offset*Math.cos(startAngle)
};
const start=physical[12],end=physical[24];
const distance=cross(sub(end,start),side)/cross(tangent,side);
assert(distance>0);
const control={x:start.x+distance*tangent.x,y:start.y+distance*tangent.y};
assert(Math.abs(cross(sub(control,start),tangent))<1e-9);
assert(Math.abs(cross(sub(end,control),side))<1e-9);
assert(dot(sub(end,control),side)>0);
// Weight 1.2 fills the shoulder continuously, staying within the same sides.
const weight=1.2;
const curve=t=>{
 const a=(1-t)**2,b=2*weight*t*(1-t),c=t*t,d=a+b+c;
 return {x:(a*start.x+b*control.x+c*end.x)/d,y:(a*start.y+b*control.y+c*end.y)/d};
};
for(let n=1;n<12;n++){
 const p=curve(n/12);
 item.shape.points[12+n]={x:p.x/boxW,y:p.y/boxH};
}
for(let n=0;n<50;n++)if(n<=12||n>=24)assert.deepEqual(item.shape.points[n],original[n]);
const contour=item.shape.points.map(p=>({x:p.x*boxW,y:p.y*boxH}));
const minAcross=dot(physical[0],across),maxAcross=dot(physical[24],across);
for(let n=0;n<50;n++){
 const p=item.shape.points[n];
 assert(p.x>0&&p.x<1&&p.y>0&&p.y<1);
 assert(dot(contour[n],across)>=minAcross-1e-9&&dot(contour[n],across)<=maxAcross+1e-9);
 const a=contour[n],b=contour[(n+1)%50],c=contour[(n+2)%50];
 assert(cross(sub(b,a),sub(c,b))>0,'Contour must remain convex');
}
assert.equal(Math.min(...contour.map(p=>p.y)),Math.min(...physical.map(p=>p.y)));
assert.equal(Math.max(...contour.map(p=>p.y)),Math.max(...physical.map(p=>p.y)));
let maxChordError=0;
for(let n=0;n<=1200;n++){
 const t=n/1200,p=curve(t),segment=Math.min(11,Math.floor(t*12));
 const a=contour[12+segment],b=contour[13+segment];
 maxChordError=Math.max(maxChordError,Math.abs(cross(sub(b,a),sub(p,a)))/Math.hypot(b.x-a.x,b.y-a.y));
 assert(dot(p,across)>=minAcross-1e-9&&dot(p,across)<=maxAcross+1e-9);
}
assert(maxChordError<.025);
item.id='E785CA86-9F64-4DB1-A105-528838F93C86';
item.name='Continuous Right Rain Cap v86';
layer['3']=item.id;layer['2']=Buffer.from(JSON.stringify(library)).toString('base64');
layer.s=layer.s.replace('Right Shoulder Cap Polish · v85','Continuous Right Cap · v86');
for(const k of ['b','c','d','e','q','i','g','z','1'])assert.deepEqual(layer[k],old[k]);
assert.deepEqual(data['1'][0]['1'].filter(l=>l.d0!==77102),before['1'][0]['1'].filter(l=>l.d0!==77102));
data['3']='Native Weather Icons Master Board v86 - Continuous Right Rain Cap';
data['4']='Based on v85. Replace only the upper cap right-quarter segment of the leftmost light-rain stroke with a fuller rational quadratic, weight 1.2, sampled into the existing 50-point contour. Preserve endpoint positions and analytic tangent directions. The cap stays convex and inside the original parallel sides. Body width, top and bottom extents, lower cap, frame and all other layers are unchanged. Native appearance requires on-device review.';
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64'),hash=createHash('sha256').update(payload).digest('hex');
write('widgy-v86.json',payload);
const html=read('widgy-v85.html').replaceAll('v85','v86')
 .replace('ליטוש הקשת הימנית — פס בדיקה אחד','דיוק הקשת הימנית — פס בדיקה אחד')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('<textarea'));assert(!html.includes('id="manual"'));
write('widgy-v86.html',html);
console.log(JSON.stringify({changedStrokes:1,points:50,changedPoints:11,weight,maxChordError,payloadLength:payload.length,sha256:hash}));
