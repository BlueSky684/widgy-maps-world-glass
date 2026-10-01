import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {PNG} from 'pngjs';
import {getTextures, WIDTH, HEIGHT, project, pixelCoordinates, solarElevation} from '../lib/home-map-day-night.js';
import {createCreativeChoices} from './creative-mask-styles.mjs';

// LOCAL DESIGN STUDIES ONLY. Original approved terrain/light rasters remain
// locked. This file changes neither the API renderer nor the widget or site.
const root = '/workspace/scratch/3fac4a755ada';
const hash = b => createHash('sha256').update(b).digest('hex');
const expectedCompositeHash = 'e01c9714cc6d881be54c4f374ea38a9d0d19ad63f4b3c039a1fe0ac9cd68fcda';
const originalBytes = readFileSync(`${root}/approved_original_reference/World_Map_Night_Preview_3306x1558.png`);
if (hash(originalBytes) !== expectedCompositeHash) throw Error('Approved reference changed');
const original = PNG.sync.read(originalBytes);
const {terrain, lights} = getTextures();
const terrainHash = hash(terrain), lightsHash = hash(lights);
if (original.width !== WIDTH || original.height !== HEIGHT) throw Error('Reference size changed');

// Same illustrative pose and light gate as the accepted-for-comparison Ink Blue
// option. Not a representation of today's sunlight. Only the mask style varies.
const sun = {latitude:20, longitude:-165};
const n = WIDTH*HEIGHT;
const elevation = new Float64Array(n);
const ocean = new Uint8Array(n);
const queue = new Uint32Array(n);
let head=0, tail=0, reconstructionMismatches=0;
const visit = p => {
  const i=p*4;
  if (!ocean[p] && terrain[i]===0 && terrain[i+1]===0 && terrain[i+2]===0) {
    ocean[p]=1; queue[tail++]=p;
  }
};
for(let x=0;x<WIDTH;x++){visit(x);visit((HEIGHT-1)*WIDTH+x);}
for(let y=0;y<HEIGHT;y++){visit(y*WIDTH);visit(y*WIDTH+WIDTH-1);}
// Narrow straits in this illustrated source can disconnect water from the
// image perimeter. Seed known seas, accepting only exact-black source pixels;
// never repaint a nonblack coast or use an external coastline mask.
const seaSeeds=[['Mediterranean',35,20],['Black Sea',43,35],['Red Sea',20,38],
  ['Persian Gulf',27,51],['Caspian Sea',42,51],['Baltic Sea',56,19]];
for(const [,lat,lon] of seaSeeds){const q=project(lat,lon);visit(Math.floor(q.y)*WIDTH+Math.floor(q.x));}
while(head<tail){
  const p=queue[head++],x=p%WIDTH;
  if(x>0)visit(p-1); if(x<WIDTH-1)visit(p+1);
  if(p>=WIDTH)visit(p-WIDTH); if(p<n-WIDTH)visit(p+WIDTH);
}
for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++){
  const p=y*WIDTH+x,i=p*4,{latitude,longitude}=pixelCoordinates(x,y);
  elevation[p]=solarElevation(latitude,longitude,sun);
  const a=lights[i+3]/255;
  for(let c=0;c<3;c++){
    if(Math.round(terrain[i+c]*(1-a)+lights[i+c]*a)!==original.data[i+c])reconstructionMismatches++;
  }
}
if(reconstructionMismatches)throw Error('Sources do not reproduce the approved composite');

const clamp = x=>Math.max(0,Math.min(1,x));
const smooth = (lo,hi,x)=>{const t=clamp((x-lo)/(hi-lo));return t*t*(3-2*t);};
const mix = (a,b,t)=>a.map((v,c)=>v+(b[c]-v)*t);
// Return [R,G,B,alpha] for a separate overlay UNDER the approved lights.
const choices = [
  {
    name:'World_Map_A_Satin_Depth',
    title:'A · Satin depth',
    inspiration:'Continuous terminator treatment in NASA SVS 5477; adapted to the locked black-ocean artwork.',
    parameters:{rgb:[84,94,109],edgeDegrees:10,interiorDepthDegrees:[6,65],opacityRange:[0.10,0.32]},
    sample(d){return [...[84,94,109],smooth(0,10,d)*(0.10+0.22*smooth(6,65,d))];}
  },
  {
    name:'World_Map_B_Twilight_Layers',
    title:'B · Twilight layers',
    inspiration:'Civil, nautical and astronomical twilight zones in Timeanddate and Esri; softened design transitions rather than categorical hard bands.',
    parameters:{twilightSteps:[6,12,18],outerRGB:[37,63,86],middleRGB:[68,63,89],innerRGB:[74,77,88],opacities:[0.14,0.23,0.34]},
    sample(d){
      let rgb=mix([37,63,86],[68,63,89],smooth(4,9,d));
      rgb=mix(rgb,[74,77,88],smooth(11,18,d));
      return [...rgb,0.14*smooth(0,4,d)+0.09*smooth(5,9,d)+0.11*smooth(11,18,d)];
    }
  },
  {
    name:'World_Map_C_Clear_Terrain',
    title:'C · Clear terrain',
    inspiration:'Own adaptation prioritizing geographic detail and approved Black-Marble-like city lights; mask restricted to source-defined open water.',
    parameters:{oceanRGB:[39,66,79],opacity:0.44,featherDegrees:7,landOverlay:0,seaSeeds},
    sample(d,p){return [39,66,79,ocean[p]?0.44*smooth(0,7,d):0];}
  },
  {
    name:'World_Map_D_Bronze_Contour',
    title:'D · Bronze contour',
    inspiration:'Minimal cartographic boundary treatment, inspired by terminator-line maps; no bloom or broad bright rim.',
    parameters:{fillRGB:[51,68,77],opacity:0.18,featherDegrees:5,lineRGB:[149,119,78],lineOpacity:0.42,lineWidthSourcePixels:3.4,lineOnNightSideOnly:true},
    sample(d,p,x,y){
      // Approximate signed screen distance to the 0-degree curve; this avoids
      // thickening the line at high latitudes. The line is entirely night-side.
      const dx=(elevation[y*WIDTH+Math.min(WIDTH-1,x+1)]-elevation[y*WIDTH+Math.max(0,x-1)])/2;
      const dy=(elevation[Math.min(HEIGHT-1,y+1)*WIDTH+x]-elevation[Math.max(0,y-1)*WIDTH+x])/2;
      const dist=d/Math.max(0.0001,Math.hypot(dx,dy));
      const line=0.42*smooth(0,0.75,dist)*(1-smooth(2.6,3.4,dist));
      const fill=0.18*smooth(0,5,d);
      const alpha=line+fill*(1-line);
      const rgb=alpha ? [0,1,2].map(c=>([149,119,78][c]*line+[51,68,77][c]*fill*(1-line))/alpha) : [0,0,0];
      return [...rgb,alpha];
    }
  }
];

mkdirSync(`${root}/deliverables`,{recursive:true});
mkdirSync('work/day-night',{recursive:true});
const reports=[];
const coastalOnly=process.argv.includes('--coastal');
const fStronger=process.argv.includes('--f-stronger');
const fStronger35=process.argv.includes('--f-35');
const fStronger50=process.argv.includes('--f-50');
const fStronger60=process.argv.includes('--f-60');
const selectedChoices=(process.argv.includes('--creative') || coastalOnly)
  ? createCreativeChoices({WIDTH,HEIGHT,elevation,ocean,pixelCoordinates,sun},{coastalOnly,fStronger,fStronger35,fStronger50,fStronger60}) : choices;
const only=process.argv.find(arg=>arg.startsWith('--only='))?.slice(7);
if(only && !selectedChoices.some(c=>c.name.startsWith(`World_Map_${only}_`)))throw Error('Unknown choice in this set');
for(const choice of selectedChoices){
  if(only && !choice.name.startsWith(`World_Map_${only}_`))continue;
  const waterOnly=choice.waterOnly || choice.name==='World_Map_C_Clear_Terrain';
  const out=Buffer.alloc(n*3),mask=Buffer.alloc(n*4);
  let dayMismatches=0,fullNightLandMismatches=0,maskDayAlphaPixels=0;
  for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++){
    const p=y*WIDTH+x,i=p*4,o=p*3,el=elevation[p],d=Math.max(0,-el);
    const v=choice.sample(d,p,x,y);
    const ma=Math.round(v[3]*255)/255;
    mask[i+3]=Math.round(ma*255);
    const la=lights[i+3]/255*smooth(0,6,d);
    if(el>=0 && ma!==0)maskDayAlphaPixels++;
    for(let c=0;c<3;c++){
      mask[i+c]=Math.round(v[c]);
      const shaded=terrain[i+c]*(1-ma)+mask[i+c]*ma;
      out[o+c]=Math.round(shaded*(1-la)+lights[i+c]*la);
      if(el>=0 && out[o+c]!==terrain[i+c])dayMismatches++;
      if(waterOnly && !ocean[p] && el<=-6 && out[o+c]!==original.data[i+c])fullNightLandMismatches++;
    }
  }
  if(dayMismatches || fullNightLandMismatches || maskDayAlphaPixels)throw Error('Mask isolation failed');
  if(hash(terrain)!==terrainHash || hash(lights)!==lightsHash)throw Error('Source buffers changed');
  const path=`${root}/deliverables/${choice.name}.png`;
  const pngBytes=await sharp(out,{raw:{width:WIDTH,height:HEIGHT,channels:3}}).withIccProfile('srgb').png({compressionLevel:9}).toBuffer();
  const decoded=PNG.sync.read(pngBytes);
  if(decoded.width!==WIDTH || decoded.height!==HEIGHT)throw Error('Incomplete PNG export');
  for(let p=0;p<n;p++)for(let c=0;c<3;c++){
    if(decoded.data[p*4+c]!==out[p*3+c])throw Error('PNG round-trip changed rendered pixels');
  }
  writeFileSync(path,pngBytes);
  PNG.sync.read(readFileSync(path)); // Full decode, not merely header metadata.
  const maskBytes=await sharp(mask,{raw:{width:WIDTH,height:HEIGHT,channels:4}}).png({compressionLevel:9}).toBuffer();
  if(!PNG.sync.read(maskBytes).data.equals(mask))throw Error('Mask PNG round-trip changed pixels');
  const maskPath=`work/day-night/${choice.name}-layer.png`;
  writeFileSync(maskPath,maskBytes);
  if(!PNG.sync.read(readFileSync(maskPath)).data.equals(mask))throw Error('Incomplete saved mask PNG');
  for(const width of [707,360])await sharp(path).resize(width).png().toFile(`work/day-night/${choice.name}-${width}.png`);
  const report={path,title:choice.title,inspiration:choice.inspiration,parameters:choice.parameters,
    dimensions:[WIDTH,HEIGHT],approvedCompositeSha256:expectedCompositeHash,
    approvedReconstructionChannelMismatches:reconstructionMismatches,dayChannelMismatches:dayMismatches,
    maskDayAlphaPixels,fullNightLandMismatches:waterOnly?fullNightLandMismatches:null,
    sourceBuffersUnchanged:true,terrainRegrade:false,dayOceanFill:false,imageBlur:false,newLights:false,
    lights:'Original approved RGB/alpha with the SAME 0 to -6 degree alpha visibility gate in every option.',
    maskPlacement:'Separate night-only layer under approved city lights.',sun,pose:'Illustration, not current UTC',published:false};
  writeFileSync(`work/day-night/${choice.name}-report.json`,JSON.stringify(report,null,2));
  reports.push(report);
}
console.log(JSON.stringify(reports,null,2));
