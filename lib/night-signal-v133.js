import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';

const SOURCE_WIDTH=2400, SOURCE_HEIGHT=1188;
const SOURCE_NORTH=85, SOURCE_SOUTH=-65;
const asset=name=>fileURLToPath(new URL(`../assets/earth/${name}`,import.meta.url));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
let cached;

function sampleRGB(data,x,y) {
  if(y<0||y>SOURCE_HEIGHT-1)return 0;
  x=((x%SOURCE_WIDTH)+SOURCE_WIDTH)%SOURCE_WIDTH;
  const x0=Math.floor(x),y0=Math.floor(y);
  const x1=(x0+1)%SOURCE_WIDTH,y1=Math.min(SOURCE_HEIGHT-1,y0+1);
  const fx=x-x0,fy=y-y0;
  const lum=(px,py)=>{
    const i=(py*SOURCE_WIDTH+px)*3;
    return data[i]*.55+data[i+1]*.35+data[i+2]*.10;
  };
  const a=lum(x0,y0)*(1-fx)+lum(x1,y0)*fx;
  const b=lum(x0,y1)*(1-fx)+lum(x1,y1)*fx;
  return a*(1-fy)+b*fy;
}

export async function buildNightSignalV133({base,width,height}) {
  if(cached)return cached;
  cached=(async()=>{
    const source=await sharp(asset('lights-v121.png')).removeAlpha().raw().toBuffer({resolveWithObject:true});
    if(source.info.width!==SOURCE_WIDTH||source.info.height!==SOURCE_HEIGHT||source.info.channels!==3)
      throw new Error('Unexpected v121 historical-lights dimensions');

    const coordinates=gunzipSync(readFileSync(asset('reference-coordinates-v127.bin.gz')));
    if(coordinates.length!==width*height*4)throw new Error('Invalid v127 coordinate field');

    const cores=new Float32Array(width*height);
    let longitude=0,latitude=0;
    const maxCurve=1-Math.exp(-3.2);
    for(let p=0;p<cores.length;p++) {
      if(p%width===0){longitude=0;latitude=0;}
      longitude+=coordinates.readInt16LE(p*4);
      latitude+=coordinates.readInt16LE(p*4+2);
      const lon=longitude/100,lat=latitude/100;
      if(lat<SOURCE_SOUTH||lat>SOURCE_NORTH){cores[p]=0;continue;}

      const sx=(lon+180)/360*SOURCE_WIDTH-.5;
      const sy=(SOURCE_NORTH-lat)/(SOURCE_NORTH-SOURCE_SOUTH)*SOURCE_HEIGHT-.5;
      const raw=sampleRGB(source.data,sx,sy);
      if(raw<.75){cores[p]=0;continue;}

      // Rebuild from the clean historical-light layer:
      // gamma < 1 raises weak and mid-level urban points;
      // exponential shoulder compresses dense hotspots instead of clipping them.
      const e=clamp((raw-.75)/254.25,0,1);
      const lifted=Math.pow(e,.72);
      const filmic=(1-Math.exp(-3.2*lifted))/maxCurve;

      // Keep coastal lights even where the illustrated shoreline differs slightly
      // from real geography, while still suppressing obvious ocean spill.
      const i=p*3;
      const baseLuma=base[i]*.26+base[i+1]*.55+base[i+2]*.19;
      const landGate=.22+.78*smooth(3,18,baseLuma);
      cores[p]=215*filmic*landGate;
    }
    return cores;
  })().catch(error=>{cached=null;throw error;});
  return cached;
}
