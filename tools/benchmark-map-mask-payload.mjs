// Offline capability investigation, not a Widgy mask implementation.
// Uses approved textures only; no endpoint, export, native blend field or asset changes.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
import {getTextures,getEngraving,renderPixels,solarPosition,WIDTH,HEIGHT,NORTH,SOUTH} from '../lib/home-map-day-night.js';
import {ENGRAVING} from '../lib/engraved-coasts.js';

const pixels=WIDTH*HEIGHT, radians=Math.PI/180;
const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};
const {terrain,lights}=getTextures(),{ocean,rgb}=getEngraving('r6');
function compare(a,b) {
  let changedPixels=0,maxChannelDifference=0,sum=0;
  for(let i=0;i<a.length;i+=3){
    let changed=false;
    for(let c=0;c<3;c++){
      const d=Math.abs(a[i+c]-b[i+c]);
      if(d)changed=true;
      maxChannelDifference=Math.max(maxChannelDifference,d);sum+=d;
    }
    if(changed)changedPixels++;
  }
  return {changedPixels,maxChannelDifference,meanAbsoluteChannelDifference:sum/a.length};
}
const cases=['2026-10-06T04:30:00Z','2026-10-06T20:00:00Z',
  '2026-03-20T12:00:00Z','2026-06-21T00:00:00Z','2026-12-21T12:00:00Z'];
const rows=[];
for(const at of cases){
  const date=new Date(at),sun=solarPosition(date),mask=Buffer.alloc(pixels),
    unquantized=Buffer.alloc(pixels*3),quantized=Buffer.alloc(pixels*3);
  const sinD=Math.sin(sun.latitude*radians),cosD=Math.cos(sun.latitude*radians);
  const cosHour=Float64Array.from({length:WIDTH},(_,x)=>Math.cos((-180+(x+.5)/WIDTH*360-sun.longitude)*radians));
  for(let y=0;y<HEIGHT;y++){
    const lat=(NORTH-(y+.5)/HEIGHT*(NORTH-SOUTH))*radians,a=Math.sin(lat)*sinD,b=Math.cos(lat)*cosD;
    for(let x=0;x<WIDTH;x++){
      const p=y*WIDTH+x,i=p*4,o=p*3;
      const elevation=Math.asin(Math.max(-1,Math.min(1,a+b*cosHour[x])))/radians;
      const n=smooth(Math.max(0,-elevation)/6);
      mask[p]=Math.round(n*255);
      for(const [night,out] of [[n,unquantized],[mask[p]/255,quantized]]){
        const ma=ocean[p]?Math.round(ENGRAVING.opacity*night*255)/255:0,la=lights[i+3]/255*night;
        for(let c=0;c<3;c++)out[o+c]=Math.round((terrain[i+c]*(1-ma)+rgb[o+c]*ma)*(1-la)+lights[i+c]*la);
      }
    }
  }
  const target=renderPixels(date,'r6').data;
  assert(target.equals(unquantized),'Unquantized formula must match current approved renderer');
  const png=await sharp(mask,{raw:{width:WIDTH,height:HEIGHT,channels:1}})
    .toColourspace('b-w').png({compressionLevel:6}).toBuffer();
  const decoded=await sharp(png).toColourspace('b-w').raw().toBuffer();
  assert(mask.equals(decoded),'Mask PNG must preserve every encoded grayscale sample');
  const smallTarget=await sharp(target,{raw:{width:WIDTH,height:HEIGHT,channels:3}}).resize({width:367}).raw().toBuffer();
  const smallQuantized=await sharp(quantized,{raw:{width:WIDTH,height:HEIGHT,channels:3}}).resize({width:367}).raw().toBuffer();
  rows.push({at,maskPNGBytes:png.length,fullResolution:compare(target,quantized),
    composedThenResizedWidth367:compare(smallTarget,smallQuantized)});
}
console.log(JSON.stringify({schema:1,kind:'offline-mask-payload-and-quantization-only',
  baseline:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  dimensions:[WIDTH,HEIGHT],rows,limits:[
    'No native Widgy mask or blend schema has been verified.',
    'This measures an 8-bit solar mask and reconstructs with the approved formula in JavaScript.',
    'Reconstruction precedes resize; native independently sampled layers are NOT modeled.',
    'The full opacity mask still decodes into a full-size surface on many pipelines; PNG size is not memory use.',
    'Coastal engraving and lights require the approved sequential operations and rounding.',
    'Marker, city, timestamp, corner clipping and color-profile conversions are excluded.',
    'A lossless mask file does not mean its 8-bit solar-weight quantization preserves final pixels.',
    'No runtime code, template or approved master changed; not ready for device import.'
  ]},null,2));
