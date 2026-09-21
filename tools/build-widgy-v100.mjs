import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const before=JSON.parse(read('widgy-v99.json')),data=structuredClone(before);
const layers=data['1'][0]['1'];
const source=layers.find(l=>l.d0===77102),storm=layers.find(l=>l.d0===7006);
assert.equal(storm['3'],'cloud.bolt.rain');
const used=new Set();
function collect(v){if(Array.isArray(v))v.forEach(collect);else if(v&&typeof v==='object'){if('d0' in v)used.add(v.d0);Object.values(v).forEach(collect);}}
collect(data);assert(!used.has(79101)&&!used.has(79102));
const scale={x:1134/1600,y:1182/1600};
const lime=source.g,background=layers.find(l=>l.d0===5001).g;
const frame=v=>({a:[{a:v,b:168,c:0,d:168}],b:0});

// Native Widgy custom shapes use the same verified schema as the approved rain.
// Integer reference-pixel frame origins avoid introducing a new rounding phase.
function nativeShape(id,name,uuid,physical,box,color,blur=false){
  const points=physical.map(p=>({x:(p.x-box.x)/box.w,y:(p.y-box.y)/box.h}));
  for(const p of points)assert(p.x>0&&p.x<1&&p.y>0&&p.y<1);
  const layer=structuredClone(source);
  layer.d0=id;layer.s=name;layer.g=color;
  layer['2']=Buffer.from(JSON.stringify({items:[{id:uuid,name,shape:{rounding:0,points}}]})).toString('base64');
  layer['3']=uuid;
  layer.b=frame(box.x/scale.x);layer.c=frame(box.y/scale.y);
  layer.d=frame(box.w/scale.x);layer.e=frame(box.h/scale.y);
  if(!blur)delete layer.p;
  return layer;
}

// In native IMG_9380 the existing cloud's straight bottom occupies
// y=759.64..768.88. Carve a central opening with two semicircular ends.
// The lower narrow extension covers only the old bolt, not its four rain marks.
const cy=764.26,r=4.62,left=447.5,right=498.5;
const mask=[{x:left,y:756},{x:right,y:756},{x:right,y:cy-r}];
for(let k=1;k<=32;k++){
  const t=-Math.PI/2-k*Math.PI/32;
  mask.push({x:right+r*Math.cos(t),y:cy+r*Math.sin(t)});
}
mask.push({x:right,y:771},{x:490,y:771},{x:490,y:815},
  {x:453,y:815},{x:453,y:771},{x:left,y:771},{x:left,y:cy+r});
for(let k=1;k<=32;k++){
  const t=Math.PI/2-k*Math.PI/32;
  mask.push({x:left+r*Math.cos(t),y:cy+r*Math.sin(t)});
}
const opening=nativeShape(79102,'Thunderstorm · Rounded Cloud Opening and Old Bolt Mask · v100',
  '58D02F49-A55C-4C62-8C71-000000079102',mask,{x:445,y:753,w:56,h:65},background);

// Outline in reference-image coordinates, with explicitly rounded transitions.
// This is native editable geometry, not an embedded raster/SVG asset.
const contour=[];
const line=(x,y)=>contour.push({x,y});
function cubic(x1,y1,x2,y2,x3,y3,steps=8){
  const p=contour.at(-1);
  for(let k=1;k<=steps;k++){
    const t=k/steps,u=1-t;
    contour.push({x:u*u*u*p.x+3*u*u*t*x1+3*u*t*t*x2+t*t*t*x3,
      y:u*u*u*p.y+3*u*u*t*y1+3*u*t*t*y2+t*t*t*y3});
  }
}
line(645,695.5);line(653.8,695.5);
cubic(657.7,695.5,658.8,697.4,657.2,701.1);
line(649.5,718.8);line(659.9,718.8);
cubic(663.7,718.8,665.4,721.3,663.2,724.9);
line(637.2,768.4);
cubic(635,772.3,630,771.5,631.1,766.9);
line(639.9,736.7);line(629.4,736.7);
cubic(626.1,736.7,624.1,734.4,625.7,730.8);
line(639.6,699);
cubic(640.7,696.5,642,695.5,645,695.5);
contour.pop(); // The native closed shape supplies the final edge.
const sx=115/144,sy=(cy-693)/(719.5-635);
const boltPoints=contour.map(p=>({x:414+(p.x-573)*sx,y:693+(p.y-635)*sy}));
const bolt=nativeShape(79101,'Thunderstorm · Reference Rounded Lightning · v100',
  '58D02F49-A55C-4C62-8C71-000000079101',boltPoints,{x:452,y:739,w:40,h:73},lime,true);
const index=layers.indexOf(storm);
// Widgy's layer array is front-to-back: new bolt, opening mask, original symbol.
layers.splice(index,0,bolt,opening);
const restored=structuredClone(data);
restored['1'][0]['1']=restored['1'][0]['1'].filter(l=>![79101,79102].includes(l.d0));
assert.deepEqual(restored,before);
data.a2=Math.max(Number(data.a2)||0,79103);
data['3']='Native Weather Icons Master Board v100 - Thunderstorm Lightning';
data['4']='Based on approved v99. Thunderstorm bolt/cloud connection only: two native custom-shape layers add a larger rounded lightning contour based on IMG_9215(8), and a background-colored cutout opening in the existing cloud base with circular end caps. The narrow lower cutout hides the old bolt. Existing cloud.bolt.rain remains exact, including its four rain marks, cloud contour, position, size and color. All other layers, approved regular rain strokes, and moon/cloud stack remain byte-for-byte equivalent. Uses the proven native custom-shape schema and Blur 0.25 on the new bolt only. Native visual review required.';
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');
write('widgy-v100.json',payload);
const html=read('widgy-v99.html').replaceAll('v99','v100')
  .replace('ירח עם ענן — הפרדה לפי הפתרון המאושר','סופה — הברק והחיבור לענן')
  .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
  .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
  .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
  .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('<textarea'));
write('widgy-v100.html',html);
console.log(JSON.stringify({addedLayers:2,allExistingLayersUnchanged:true,
  cloudEndRadius:r,boltVertices:boltPoints.length,maskVertices:mask.length,
  payloadLength:payload.length,sha256:hash}));
