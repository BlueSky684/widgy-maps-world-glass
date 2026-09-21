import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const before=JSON.parse(read('widgy-v93.json')),data=structuredClone(before);
const layer=data['1'][0]['1'].find(l=>l.d0===77102);
const old=before['1'][0]['1'].find(l=>l.d0===77102);
const library=JSON.parse(Buffer.from(layer['2'],'base64').toString('utf8'));
const item=library.items.find(item=>item.id===layer['3']);
assert.equal(item.shape.rounding,0);
assert.equal(item.shape.points.length,50);
const original=structuredClone(item.shape.points);
const scale={x:1134/1600,y:1182/1600};
const boxW=old.d.a[0].a*scale.x,boxH=old.e.a[0].a*scale.y;
const physical=original.map(p=>({x:p.x*boxW,y:p.y*boxH}));
// IMG_9372 agrees with the v93 polygon's exact pixel-area coverage to
// within 0.00232 alpha. It also confirms that this native screenshot snaps
// the layer's origin to whole reference pixels. Keep the proven contour
// and adjust its sampling phase, rather than changing its cap radius again.
const origin={x:Math.round(old.b.a[0].a*scale.x),y:Math.round(old.c.a[0].a*scale.y)};
const center={x:origin.x+(physical[0].x+physical[24].x)/2,y:origin.y+(physical[0].y+physical[24].y)/2};
const target={x:Math.round(center.x-.5)+.5,y:Math.round(center.y-.5)+.5};
const delta={x:target.x-center.x,y:target.y-center.y};
assert(Math.hypot(delta.x,delta.y)<.5);
// Apply one rigid subpixel translation to the single test stroke. A common
// translation preserves both caps, straight sides, width, length and angle.
// Keep the enclosing frame unchanged so native origin snapping stays fixed.
item.shape.points=original.map(p=>({x:p.x+delta.x/boxW,y:p.y+delta.y/boxH}));
const contour=item.shape.points.map(p=>({x:p.x*boxW,y:p.y*boxH}));
let maxTranslationError=0,maxDistanceError=0;
for(let n=0;n<50;n++){
 const p=item.shape.points[n];
 assert(p.x>0&&p.x<1&&p.y>0&&p.y<1,'Keep padded contour inside frame');
 maxTranslationError=Math.max(maxTranslationError,Math.hypot(contour[n].x-physical[n].x-delta.x,contour[n].y-physical[n].y-delta.y));
 for(let j=0;j<n;j++){
  const beforeDistance=Math.hypot(physical[n].x-physical[j].x,physical[n].y-physical[j].y);
  const afterDistance=Math.hypot(contour[n].x-contour[j].x,contour[n].y-contour[j].y);
  maxDistanceError=Math.max(maxDistanceError,Math.abs(afterDistance-beforeDistance));
 }
}
assert(maxTranslationError<1e-9);
assert(maxDistanceError<1e-9);
const newCenter={x:origin.x+(contour[0].x+contour[24].x)/2,y:origin.y+(contour[0].y+contour[24].y)/2};
assert(Math.hypot(newCenter.x-target.x,newCenter.y-target.y)<1e-9);
for(let n=0;n<=24;n++){
 const p={x:origin.x+contour[n].x,y:origin.y+contour[n].y};
 assert(Math.abs(Math.hypot(p.x-newCenter.x,p.y-newCenter.y)-4.625)<1e-9);
}
item.id='E785CA94-9F64-4DB1-A105-528838F93C94';
item.name='Pixel Centered Rain v94';
layer['3']=item.id;layer['2']=Buffer.from(JSON.stringify(library)).toString('base64');
layer.s=layer.s.replace('Circular Cap · v93','Pixel Centered Cap · v94');
for(const k of ['b','c','d','e','q','i','g','z','1'])assert.deepEqual(layer[k],old[k]);
assert.deepEqual(data['1'][0]['1'].filter(l=>l.d0!==77102),before['1'][0]['1'].filter(l=>l.d0!==77102));
assert.deepEqual(data['1'].slice(1),before['1'].slice(1));
data['3']='Native Weather Icons Master Board v94 - Pixel Centered Rain Cap';
data['4']='Based on v93 and original screenshot IMG_9372. The native screenshot matches the circular contour; remaining edge unevenness is consistent with raster sampling. Preserve all 50 contour points as a rigid shape, translating the single test stroke by approximately -0.47918 reference pixel horizontally and -0.05357 vertically. Its upper-circle center then lies at a pixel center in the 1134x1182 reference render. All interpoint distances, cap radius, body width, length and angle remain unchanged. No fill patches, blur or opacity changes. Other strokes and layers are unchanged. This is a sampling adjustment requiring native visual review; its effect can vary with display scale.';
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64'),hash=createHash('sha256').update(payload).digest('hex');
write('widgy-v94.json',payload);
const html=read('widgy-v93.html').replaceAll('v93','v94')
 .replace('קצה עגול ברדיוס אחיד — פס בדיקה אחד','ליטוש תצוגת הקצה — פס בדיקה אחד')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('<textarea'));assert(!html.includes('id="manual"'));
write('widgy-v94.html',html);
console.log(JSON.stringify({changedStrokes:1,points:50,delta,totalShift:Math.hypot(delta.x,delta.y),center:newCenter,maxTranslationError,maxDistanceError,payloadLength:payload.length,sha256:hash}));
