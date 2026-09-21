import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const before=JSON.parse(read('widgy-v101.json')),data=structuredClone(before);
const layers=data['1'][0]['1'],source=layers.find(l=>l.d0===77102);
const fog=layers.find(l=>l.d0===7007),background=layers.find(l=>l.d0===5001).g;
assert.equal(fog['3'],'cloud.fog');
const used=new Set();
function collect(v){if(Array.isArray(v))v.forEach(collect);else if(v&&typeof v==='object'){if('d0' in v)used.add(v.d0);Object.values(v).forEach(collect);}}
collect(data);assert(!used.has(79301)&&!used.has(79302));
const scale={x:1134/1600,y:1182/1600},frame=v=>({a:[{a:v,b:168,c:0,d:168}],b:0});
// Approved reference bar widths: 86/105. Native upper bar: about 73px.
// Keep the native lower bar center, thickness, vertical position and fill.
const ratio=86/105,width=73*ratio,cx=851.7805044398096;
const top=804.2595744680851,bottom=811.0212765957447;
const cy=(top+bottom)/2,r=(bottom-top)/2,capCenter=cx-width/2+r;
// The background cutouts leave mirrored circular end caps in the native bar.
const left=[{x:813,y:802},{x:capCenter,y:802},{x:capCenter,y:top}];
for(let k=1;k<=32;k++){
 const angle=-Math.PI/2-k*Math.PI/32;
 left.push({x:capCenter+r*Math.cos(angle),y:cy+r*Math.sin(angle)});
}
left.push({x:capCenter,y:814},{x:813,y:814});
const right=left.map(p=>({x:2*cx-p.x,y:p.y})).reverse();
const specs=[{id:79301,side:'Left',points:left,box:{x:812,y:800,w:16,h:16}},
 {id:79302,side:'Right',points:right,box:{x:877,y:800,w:16,h:16}}];
const masks=specs.map(({id,side,points,box})=>{
 const mask=structuredClone(source),uuid=`58D02F49-A55C-4C62-8C71-${String(id).padStart(12,'0')}`;
 const normalized=points.map(p=>({x:(p.x-box.x)/box.w,y:(p.y-box.y)/box.h}));
 for(const p of normalized)assert(p.x>0&&p.x<1&&p.y>0&&p.y<1);
 const name=`Fog · Lower Bar ${side} Rounded Shortening · v102`;
 mask.d0=id;mask.s=name;mask.g=background;delete mask.p;
 mask['2']=Buffer.from(JSON.stringify({items:[{id:uuid,name,shape:{rounding:0,points:normalized}}]})).toString('base64');
 mask['3']=uuid;
 mask.b=frame(box.x/scale.x);mask.c=frame(box.y/scale.y);
 mask.d=frame(box.w/scale.x);mask.e=frame(box.h/scale.y);
 return mask;
});
for(let n=0;n<left.length;n++){
 const mirror=right[right.length-1-n];
 assert(Math.abs(left[n].x+mirror.x-2*cx)<1e-9);assert.equal(left[n].y,mirror.y);
}
// Front-to-back: two end masks, existing cloud.fog with its upper bar intact.
layers.splice(layers.indexOf(fog),0,...masks);
const restored=structuredClone(data);
restored['1'][0]['1']=restored['1'][0]['1'].filter(l=>![79301,79302].includes(l.d0));
assert.deepEqual(restored,before);
data.a2=Math.max(Number(data.a2)||0,79303);
data['3']='Native Weather Icons Master Board v102 - Shorter Lower Fog Line';
data['4']='Based on approved v101 and native IMG_9386. Shorten only the lower fog line symmetrically to approximately 82 percent of the upper line, matching the 86/105 ratio measured in the approved reference. Two mirrored native background-colored cutouts form circular end caps. Preserve the existing lower line center, thickness and vertical position. The cloud.fog source and upper bar remain exact. All existing layers, approved thunderstorm, snow, moon/cloud and day rain remain unchanged. Native visual review required.';
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');
write('widgy-v102.json',payload);
const html=read('widgy-v101.html').replaceAll('v101','v102')
 .replace('סופה — קו גשם אחד מכל צד','ערפל — קו תחתון קצר וממורכז')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('<textarea'));write('widgy-v102.html',html);
console.log(JSON.stringify({addedMasks:2,existingLayersUnchanged:true,
 lowerToUpperRatio:ratio,lowerWidth:width,center:{x:cx,y:cy},capRadius:r,
 payloadLength:payload.length,sha256:hash}));
