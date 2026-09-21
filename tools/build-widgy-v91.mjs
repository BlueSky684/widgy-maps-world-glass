import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const before=JSON.parse(read('widgy-v90.json')),data=structuredClone(before);
const layer=data['1'][0]['1'].find(l=>l.d0===77102);
const old=before['1'][0]['1'].find(l=>l.d0===77102);
const library=JSON.parse(Buffer.from(layer['2'],'base64').toString('utf8'));
const item=library.items.find(item=>item.id===layer['3']);
assert.equal(item.shape.rounding,0);
assert.equal(item.shape.points.length,50);
const original=structuredClone(item.shape.points);
const boxW=old.d.a[0].a*1134/1600,boxH=old.e.a[0].a*1182/1600;
const maxTrim=.03;
// Reduce the localized v90 fill while retaining one quarter of that
// addition. This inward sin-fourth taper preserves its boundary tangents.
for(let n=17;n<22;n++){
 const t=(n-16)/6;
 item.shape.points[n].x-=maxTrim*Math.sin(Math.PI*t)**4/boxW;
 assert.equal(item.shape.points[n].y,original[n].y);
 assert(item.shape.points[n].x<original[n].x);
}
for(let n=0;n<50;n++)if(n<=16||n>=22)assert.deepEqual(item.shape.points[n],original[n]);
const toPhysical=p=>({x:p.x*boxW,y:p.y*boxH});
const contour=item.shape.points.map(toPhysical),previous=original.map(toPhysical);
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const across=p=>p.x*Math.cos(Math.PI/6)+p.y*Math.sin(Math.PI/6);
const minAcross=across(previous[0]),maxAcross=across(previous[24]);
for(let n=0;n<50;n++){
 const p=item.shape.points[n];
 assert(p.x>0&&p.x<1&&p.y>0&&p.y<1);
 assert(across(contour[n])>=minAcross-1e-9&&across(contour[n])<=maxAcross+1e-9);
 const a=contour[n],b=contour[(n+1)%50],c=contour[(n+2)%50];
 assert(cross(sub(b,a),sub(c,b))>0,'Keep a convex contour');

}
// The entire new contour must remain inside the old one: removal only.
for(let n=0;n<50;n++){
 const a=previous[n],b=previous[(n+1)%50];
 for(const p of contour)assert(cross(sub(b,a),sub(p,a))>=-1e-9);
}
const curvature=p=>Array.from({length:11},(_,i)=>{
 const n=i+12,a=sub(p[n],p[n-1]),b=sub(p[n+1],p[n]),c=sub(p[n+1],p[n-1]);
 return 2*cross(a,b)/(Math.hypot(a.x,a.y)*Math.hypot(b.x,b.y)*Math.hypot(c.x,c.y));
});
const variation=k=>k.slice(1).reduce((sum,v,i)=>sum+(v-k[i])**2,0);
const beforeVariation=variation(curvature(previous)),afterVariation=variation(curvature(contour));
assert(afterVariation<beforeVariation*.5,'Reduce local curvature variation');
assert.equal(Math.min(...contour.map(p=>p.y)),Math.min(...previous.map(p=>p.y)));
assert.equal(Math.max(...contour.map(p=>p.y)),Math.max(...previous.map(p=>p.y)));
item.id='E785CA91-9F64-4DB1-A105-528838F93C91';
item.name='Smoothed Right Rain Edge v91';
layer['3']=item.id;layer['2']=Buffer.from(JSON.stringify(library)).toString('base64');
layer.s=layer.s.replace('Right Edge Fill · v90','Smoothed Right Edge · v91');
for(const k of ['b','c','d','e','q','i','g','z','1'])assert.deepEqual(layer[k],old[k]);
assert.deepEqual(data['1'][0]['1'].filter(l=>l.d0!==77102),before['1'][0]['1'].filter(l=>l.d0!==77102));
assert.deepEqual(data['1'].slice(1),before['1'].slice(1));
data['3']='Native Weather Icons Master Board v91 - Smoothed Right Rain Edge';
data['4']='Based on v90 and feedback IMG_9366. Trim at most 0.03 reference pixel from the localized right-cap fill, retaining one quarter of the v90 addition over v89. The smooth inward taper changes only points 17 through 21. The contour remains convex and inside v90. Discrete curvature variation decreases by more than half in the checked arc. Body width, crown, side join, lower cap, frame and other layers are unchanged. Native appearance requires on-device review.';
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64'),hash=createHash('sha256').update(payload).digest('hex');
write('widgy-v91.json',payload);
const html=read('widgy-v90.html').replaceAll('v90','v91')
 .replace('דיוק הקצה המעוגל — פס בדיקה אחד','עידון הקשת המעוגלת — פס בדיקה אחד')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('<textarea'));assert(!html.includes('id="manual"'));
write('widgy-v91.html',html);
console.log(JSON.stringify({changedStrokes:1,points:50,changedPoints:5,maxTrim,beforeVariation,afterVariation,payloadLength:payload.length,sha256:hash}));
