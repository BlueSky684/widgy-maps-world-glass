import assert from 'node:assert/strict';
import sharp from 'sharp';
import {solarMask} from '../lib/map-solar-mask.js';
import {getTextures,getEngraving,renderPixels,WIDTH,HEIGHT,NORTH,SOUTH} from '../lib/home-map-day-night.js';
import {ENGRAVING} from '../lib/engraved-coasts.js';

assert.deepEqual([WIDTH,HEIGHT,NORTH,SOUTH],[3306,1558,85,-61]);
const {terrain,lights}=getTextures(),{ocean,rgb}=getEngraving('r6'),P=WIDTH*HEIGHT;
const day=Buffer.alloc(P*3),night=Buffer.alloc(P*3);
for(let p=0;p<P;p++){
  const a=lights[p*4+3]/255,m=ocean[p]?Math.round(ENGRAVING.opacity*255)/255:0;
  for(let c=0;c<3;c++){
    const j=p*3+c;day[j]=terrain[p*4+c];
    night[j]=Math.round((day[j]*(1-m)+rgb[j]*m)*(1-a)+lights[p*4+c]*a);
  }
}
const resizeMap=(data,width)=>sharp(data,{raw:{width:WIDTH,height:HEIGHT,channels:3}})
  .resize({width,kernel:'lanczos3'}).raw().toBuffer();
const sizes=[367,1101],staticSmall={};
for(const w of sizes)staticSmall[w]=await Promise.all([resizeMap(day,w),resizeMap(night,w)]);
const cmp=(a,b)=>{
  assert.equal(a.length,b.length);let changedPixels=0,pixelsOverOneLevel=0,maxChannelDifference=0,sum=0;
  for(let p=0;p<a.length;p+=3){let peak=0;for(let c=0;c<3;c++){let d=Math.abs(a[p+c]-b[p+c]);peak=Math.max(peak,d);sum+=d;}
    if(peak)changedPixels++;if(peak>1)pixelsOverOneLevel++;maxChannelDifference=Math.max(maxChannelDifference,peak);}
  return {changedPixels,pixelsOverOneLevel,maxChannelDifference,meanAbsoluteChannelDifference:sum/a.length};
};
const rows=[];
for(const at of ['2026-10-06T04:30:00Z','2026-10-06T20:00:00Z','2026-03-20T12:00:00Z','2026-06-21T00:00:00Z','2026-12-21T12:00:00Z']){
  const target=renderPixels(new Date(at),'r6').data,targets={};
  for(const w of sizes)targets[w]=await resizeMap(target,w);
  const allOutputs={};
  // Multiples of87 preserve the master's exact87:41 aspect ratio in Widgy's
  // inherited Aspect Fit frame. This avoids a new letterboxing mismatch.
  for(const maskWidth of [3306,1044,522,261]){
    const m=solarMask(new Date(at),maskWidth),pngs=[];
    for(const bytes of [m.day,m.night])pngs.push(await sharp(bytes,{raw:{width:m.width,height:m.height,channels:1}}).toColourspace('b-w').png({compressionLevel:6}).toBuffer());
    for(let i=0;i<m.day.length;i++)assert.equal(m.day[i]+m.night[i],255);
    const samples={};
    for(const w of sizes){
      // Set both dimensions explicitly: mask and master aspect ratios can
      // differ by a fraction of a pixel after rounding the mask height.
      const h=targets[w].length/(w*3),[d,n]=staticSmall[w];
      const [dm,nm]=await Promise.all(pngs.map(png=>sharp(png).resize({width:w,height:h,fit:'fill',kernel:'lanczos3'}).toColourspace('b-w').raw().toBuffer()));
      const combined=Buffer.alloc(targets[w].length);
      for(let p=0;p<dm.length;p++)for(let c=0;c<3;c++){let j=p*3+c;combined[j]=Math.min(255,Math.round(d[j]*dm[p]/255+n[j]*nm[p]/255));}
      allOutputs[maskWidth]??={};allOutputs[maskWidth][w]=combined;
      samples[w]={versusApproved:cmp(targets[w],combined),versusFullMask:cmp(allOutputs[3306][w],combined)};
    }
    rows.push({at,maskWidth,maskHeight:m.height,maskPNGBytes:pngs.map(p=>p.length),combinedMaskBytes:pngs[0].length+pngs[1].length,
      theoreticalTwoMaskRGBABytes:m.width*m.height*8,samples});
  }
}
console.log(JSON.stringify({kind:'solar-mask-resolution-only',rows,limits:[
  'The approved terrain/night textures remain3306x1558. Only the smooth solar masks have reduced dimensions.',
  'Endpoint interpolation remains an approximation to the approved sequential renderer.',
  'Sharp lanczos3 independent resampling is a model, not native Widgy output or a perceptual approval.',
  'Byte counts are measurements. RGBA inputs are theoretical and exclude compositor surfaces.',
  'No refresh timing, request count, location, rounding of map corners or native color-space behavior is tested.'
]},null,2));
