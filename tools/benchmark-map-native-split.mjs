// Offline follow-up to the owner's successful flat native blend probe.
// No runtime/export/master asset changes. Native color management and sampling
// are NOT simulated by Sharp's explicitly chosen lanczos3 reconstruction.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
import {getTextures,getEngraving,renderPixels,solarPosition,WIDTH,HEIGHT,NORTH,SOUTH} from '../lib/home-map-day-night.js';
import {ENGRAVING} from '../lib/engraved-coasts.js';

const P=WIDTH*HEIGHT,rad=Math.PI/180;
const {terrain,lights}=getTextures(),{ocean,rgb}=getEngraving('r6');
const day=Buffer.alloc(P*3),night=Buffer.alloc(P*3),minimum=Buffer.alloc(P*3),
  dayResidual=Buffer.alloc(P*3),nightResidual=Buffer.alloc(P*3),envelope=Buffer.alloc(P*3);
const endCoast=Math.round(ENGRAVING.opacity*255)/255;
let darkerPixels=0,maximumDarkening=0,coastLightOverlap=0;
for(let p=0;p<P;p++){
  const i=p*4,o=p*3,a=lights[i+3]/255,m=ocean[p]?endCoast:0;
  let darker=false;
  if(ocean[p]&&a&&(rgb[o]||rgb[o+1]||rgb[o+2]))coastLightOverlap++;
  for(let c=0;c<3;c++){
    const j=o+c;
    day[j]=terrain[i+c];
    night[j]=Math.round((terrain[i+c]*(1-m)+rgb[j]*m)*(1-a)+lights[i+c]*a);
    if(night[j]<day[j]){darker=true;maximumDarkening=Math.max(maximumDarkening,day[j]-night[j]);}
    minimum[j]=Math.min(day[j],night[j]);
    dayResidual[j]=day[j]-minimum[j];nightResidual[j]=night[j]-minimum[j];
    // A conservative, time-independent upper bound. Ocean terrain is black.
    // Its coast and lights contributions cannot exceed their separate maxima.
    if(ocean[p])assert.equal(day[j],0);
    envelope[j]=ocean[p]?Math.min(255,Math.ceil(rgb[j]*endCoast+lights[i+c]*a)):
      Math.max(day[j],night[j]);
  }
  if(darker)darkerPixels++;
}
function compare(a,b){
  assert.equal(a.length,b.length);
  let changedPixels=0,pixelsOverOneLevel=0,maxChannelDifference=0,sum=0;
  for(let i=0;i<a.length;i+=3){
    let largest=0;
    for(let c=0;c<3;c++){const d=Math.abs(a[i+c]-b[i+c]);largest=Math.max(largest,d);sum+=d;}
    if(largest)changedPixels++;if(largest>1)pixelsOverOneLevel++;
    maxChannelDifference=Math.max(maxChannelDifference,largest);
  }
  return {changedPixels,pixelsOverOneLevel,maxChannelDifference,meanAbsoluteChannelDifference:sum/a.length};
}
const png=(data,channels=3)=>{
  const pipeline=sharp(data,{raw:{width:WIDTH,height:HEIGHT,channels}});
  return (channels===1?pipeline.toColourspace('b-w'):pipeline).png({compressionLevel:6}).toBuffer();
};
const resize=(data,width,channels=3)=>{
  const pipeline=sharp(data,{raw:{width:WIDTH,height:HEIGHT,channels}}).resize({width,kernel:'lanczos3'});
  return (channels===1?pipeline.toColourspace('b-w'):pipeline).raw().toBuffer();
};
const staticInputs={day,night,minimum,dayResidual,nightResidual,envelope};
const staticPNGBytes=Object.fromEntries(await Promise.all(Object.entries(staticInputs).map(async([k,v])=>[k,(await png(v)).length])));
const widths=[367,1101],resized={};
for(const width of widths)resized[width]=Object.fromEntries(await Promise.all(Object.entries(staticInputs).map(async([k,v])=>[k,await resize(v,width)])));

const rows=[];
for(const at of ['2026-10-06T04:30:00Z','2026-10-06T20:00:00Z',
  '2026-03-20T12:00:00Z','2026-06-21T00:00:00Z','2026-12-21T12:00:00Z']){
  const date=new Date(at),sun=solarPosition(date),target=renderPixels(date,'r6').data;
  const mask=Buffer.alloc(P),inverse=Buffer.alloc(P),ratio=Buffer.alloc(P*3),
    endpoints=Buffer.alloc(P*3),ratioResult=Buffer.alloc(P*3);
  const sinD=Math.sin(sun.latitude*rad),cosD=Math.cos(sun.latitude*rad);
  const cosH=Float64Array.from({length:WIDTH},(_,x)=>Math.cos((-180+(x+.5)/WIDTH*360-sun.longitude)*rad));
  for(let y=0;y<HEIGHT;y++){
    const lat=(NORTH-(y+.5)/HEIGHT*(NORTH-SOUTH))*rad,a=Math.sin(lat)*sinD,b=Math.cos(lat)*cosD;
    for(let x=0;x<WIDTH;x++){
      const p=y*WIDTH+x;
      const elevation=Math.asin(Math.max(-1,Math.min(1,a+b*cosH[x])))/rad;
      const t=Math.max(0,Math.min(1,-elevation/6));
      mask[p]=Math.round(t*t*(3-2*t)*255);inverse[p]=255-mask[p];
      for(let c=0;c<3;c++){
        const j=p*3+c;
        endpoints[j]=Math.round(day[j]*inverse[p]/255+night[j]*mask[p]/255);
        assert(target[j]<=envelope[j],'static envelope bounds current renderer');
        // For integers 0 <= F <= E <= 255 this quantization reconstructs F
        // after one final nearest-integer rounding, even with an 8-bit mask.
        ratio[j]=envelope[j]?Math.round(target[j]*255/envelope[j]):255;
        ratioResult[j]=Math.round(envelope[j]*ratio[j]/255);
      }
    }
  }
  assert(target.equals(ratioResult),'full-size multiplicative reconstruction must be exact');
  const encoded=await Promise.all([png(mask,1),png(inverse,1),png(ratio),png(target)]);
  assert(mask.equals(await sharp(encoded[0]).toColourspace('b-w').raw().toBuffer()),'lossless mask');
  assert(ratio.equals(await sharp(encoded[2]).raw().toBuffer()),'lossless RGB ratio mask');
  const independentSampling={};
  for(const width of widths){
    const s=resized[width];
    const [targetSmall,m,iv,r]=await Promise.all([resize(target,width),resize(mask,width,1),resize(inverse,width,1),resize(ratio,width)]);
    const endpointSmall=Buffer.alloc(targetSmall.length),residualSmall=Buffer.alloc(targetSmall.length),ratioSmall=Buffer.alloc(targetSmall.length);
    assert.equal(targetSmall.length,m.length*3);
    for(let p=0;p<m.length;p++)for(let c=0;c<3;c++){
      const j=p*3+c;
      endpointSmall[j]=Math.min(255,Math.round(s.day[j]*iv[p]/255+s.night[j]*m[p]/255));
      residualSmall[j]=Math.min(255,Math.round(s.minimum[j]+s.dayResidual[j]*iv[p]/255+s.nightResidual[j]*m[p]/255));
      ratioSmall[j]=Math.round(s.envelope[j]*r[j]/255);
    }
    independentSampling[width]={endpointPair:compare(targetSmall,endpointSmall),
      minimumAndResiduals:compare(targetSmall,residualSmall),multiplicativeEnvelope:compare(targetSmall,ratioSmall)};
  }
  rows.push({at,rawMapPNGBytes:encoded[3].length,maskPNGBytes:encoded[0].length,
    inversePNGBytes:encoded[1].length,totalPairMaskPNGBytes:encoded[0].length+encoded[1].length,
    ratioMaskPNGBytes:encoded[2].length,fullResolution:{endpointPair:compare(target,endpoints),
      minimumAndResiduals:compare(target,endpoints),multiplicativeEnvelope:compare(target,ratioResult)},independentSampling});
}
console.log(JSON.stringify({schema:1,kind:'offline-native-split-feasibility-after-flat-probe',
  baseline:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),dimensions:[WIDTH,HEIGHT],
  findings:{darkerPixels,maximumDarkening,coastLightOverlap},staticPNGBytes,
  theoreticalFullSizeRGBAInputBytes:{singleImage:P*4,endpointPair:P*4*4,minimumAndResiduals:P*4*5,multiplicativeEnvelope:P*4*2},
  rows,limits:[
    'Flat native blend screenshot supports only qualitative masked addition, not real-map parity or timing.',
    'Full-size formulas assume component-wise sRGB byte arithmetic and a single final rounding; native intermediate precision/color space is unknown.',
    'Independent Sharp lanczos3 sampling is a counterexample to guaranteed parity, not a prediction of the Widgy renderer.',
    '367 and 1101 are representative output widths, not measured Widgy render surfaces.',
    'Endpoint interpolation changes the approved sequential coast/light operations; the original masters are unmodified.',
    'RGBA input counts exclude compositor surfaces, caching and memory sharing; these are not Widgy RSS measurements.',
    'Two complementary URLs have no verified atomic native update; mixing generations can temporarily alter brightness.',
    'No marker, coordinates, labels, timestamp, corner clipping, native color profile, refresh or navigation is included.',
    'No runtime, widget export, network endpoint, paid service or approved asset is changed. No candidate passes exact appearance parity at both tested scales.'
  ]},null,2));
