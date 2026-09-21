import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const before=JSON.parse(read('widgy-v102.json')),data=structuredClone(before);
const layers=data['1'][0]['1'],sx=1134/1600,sy=1182/1600;
// Match both fog line lengths and their placement in the user's reference.
// Replace the earlier end cutouts with two native capsules over a single mask.
const oldFogMasks=[79301,79302],newFogIds=[79401,79402,79403];
for(const id of newFogIds)assert(!layers.some(l=>l.d0===id));
for(let n=layers.length-1;n>=0;n--)if(oldFogMasks.includes(layers[n].d0))layers.splice(n,1);
const shapeSource=layers.find(l=>l.d0===77102),background=layers.find(l=>l.d0===5001).g;
const frame=v=>({a:[{a:v,b:168,c:0,d:168}],b:0});
function fogShape(id,name,points,box,color){
 const l=structuredClone(shapeSource),uuid=`58D02F49-A55C-4C62-8C71-${String(id).padStart(12,'0')}`;
 const normalized=points.map(([x,y])=>({x:(x-box.x)/box.w,y:(y-box.y)/box.h}));
 for(const p of normalized)assert(p.x>0&&p.x<1&&p.y>0&&p.y<1);
 l.d0=id;l.s=name;l.g=color;delete l.p;
 l['3']=uuid;l['2']=Buffer.from(JSON.stringify({items:[{id:uuid,name,shape:{rounding:0,points:normalized}}]})).toString('base64');
 l.b=frame(box.x/sx);l.c=frame(box.y/sy);l.d=frame(box.w/sx);l.e=frame(box.h/sy);return l;
}
const fogCenter=851.7805044398096,fogRadius=(811.0212765957447-804.2595744680851)/2;
function fogBar(id,width,cy,name){
 const points=[],lc=fogCenter-width/2+fogRadius,rc=fogCenter+width/2-fogRadius;
 for(let k=0;k<=32;k++){const a=-Math.PI/2+k*Math.PI/32;points.push([rc+fogRadius*Math.cos(a),cy+fogRadius*Math.sin(a)]);}
 for(let k=0;k<=32;k++){const a=Math.PI/2+k*Math.PI/32;points.push([lc+fogRadius*Math.cos(a),cy+fogRadius*Math.sin(a)]);}
 const x=Math.floor(fogCenter-width/2)-2,y=Math.floor(cy-fogRadius)-2;
 return fogShape(id,name,points,{x,y,w:Math.ceil(width)+5,h:Math.ceil(fogRadius*2)+5},shapeSource.g);
}
// Reference cloud width 145, upper/lower line widths 105/86; current cloud 119.
// The new centers bring both bars closer to the cloud and to each other.
const upperFog=fogBar(79401,119*105/145,789.2,'Fog · Reference Upper Line · v103');
const lowerFog=fogBar(79402,119*86/145,803.2,'Fog · Reference Lower Line · v103');
const fogMask=fogShape(79403,'Fog · Original Lines Mask · v103',
 [[811,782],[893,782],[893,815],[811,815]],{x:809,y:780,w:86,h:37},background);
layers.splice(layers.findIndex(l=>l.d0===7007),0,upperFog,lowerFog,fogMask);

// Visible bounds measured from native IMG_9387, rather than symbol frame sizes.
// Compound icons get a small optical allowance; solid moon stays smaller.
// Wind reduction is the 5 percent adjustment agreed with the user.
const profiles=[
 ['Clear Day',[7002],[72,307,198,432],1,370],
 ['Partly Cloudy Day',[7302,7303,7053,7001],[274,311,431,434],130/157,370],
 ['Cloudy',[7003],[503,327,632,413],125/129,370],
 ['Light Rain',[76800,77102,77105,77108],[714,305,853,434],125/139,370],
 ['Heavy Rain',[76801,77202,77205,77208,77211],[930,305,1069,434],125/139,370],
 ['Clear Night',[7009],[36,699,147,810],1,754.5],
 ['Partly Cloudy Night',[7010,79001,79002,7011],[210,696,353,810],130/143,754.5],
 ['Thunderstorm',[79101,79102,79201,79202,7006],[414,693,529,808],125/115,754.5],
 ['Snow',[7012,7013,7014,7015],[604,706,720,827],125/121,754.5],
 ['Fog',[79401,79402,79403,7007],[792,697,911,807],125/119,754.5],
 ['Wind',[7008],[984,704,1099,805],0.95,754.5]
];
const touched=new Set(),report=[];
for(const [name,ids,[x0,y0,x1,y1],factor,targetY] of profiles){
 const cx=(x0+x1)/2/sx,cy=(y0+y1)/2/sy,ty=targetY/sy;
 for(const id of ids){
  assert(!touched.has(id));touched.add(id);
  const l=layers.find(l=>l.d0===id);assert(l,name+' missing layer');
  for(const key of ['b','c','d','e'])assert.equal(l[key].a.length,1);
  const initialRatio=l.d.a[0].a/l.e.a[0].a;
  l.b.a[0].a=cx+(l.b.a[0].a-cx)*factor;
  l.c.a[0].a=ty+(l.c.a[0].a-cy)*factor;
  l.d.a[0].a*=factor;l.e.a[0].a*=factor;
  assert(Math.abs(l.d.a[0].a/l.e.a[0].a-initialRatio)<1e-10);
 }
 report.push({name,scale:factor,width:(x1-x0)*factor,height:(y1-y0)*factor});
}
const visible=layers.filter(l=>l.a!==false&&l.d0!==5001);
assert(visible.every(l=>touched.has(l.d0)),'visible icon layer omitted');
const restored=structuredClone(data);
for(const l of restored['1'][0]['1'])if(touched.has(l.d0)&&!newFogIds.includes(l.d0)){
 const old=before['1'][0]['1'].find(x=>x.d0===l.d0);
 for(const key of ['b','c','d','e'])l[key]=old[key];
}
restored['1'][0]['1']=restored['1'][0]['1'].filter(l=>!newFogIds.includes(l.d0));
restored['1'][0]['1'].splice(restored['1'][0]['1'].findIndex(l=>l.d0===7007),0,...before['1'][0]['1'].filter(l=>oldFogMasks.includes(l.d0)));
assert.deepEqual(restored,before);
data.a2=Math.max(Number(data.a2)||0,79404);
// Except the explicitly requested fog bar reconstruction, contours, weights,
// colors, masks, rain masters and layer order remain exact. Each icon uses one similarity transform across all its layers.
data['3']='Native Weather Icons Master Board v103 - Optical Size Balance';
data['4']='Based on approved v102 and native IMG_9387. Balance visible icon sizes around the clear-day sun: main outlined symbols approximately 125 reference pixels, compound sun/cloud and moon/cloud 130 pixels, solid crescent unchanged, wind 5 percent smaller. Align total visible centers within each row. Apply uniform scale and translation to every layer of each icon, including all cutout masks, precipitation and cloud separators. Also match the fog reference line lengths (105/145 and 86/145 of cloud width) and vertical placement, retaining the prior thickness with circular caps. Replace the two earlier fog end masks with two editable native bars and one background mask. All other contour data, colors, weights, native blur and layer order remain exact. Native raster sampling can change after resizing; review at widget size is required.';
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');write('widgy-v103.json',payload);
const html=read('widgy-v102.html').replaceAll('v102','v103')
 .replace('ערפל — קו תחתון קצר וממורכז','איזון גדלים — סט האייקונים')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('<textarea'));write('widgy-v103.html',html);
console.log(JSON.stringify({icons:report,layers:touched.size,payloadLength:payload.length,sha256:hash}));
