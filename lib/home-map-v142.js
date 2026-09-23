import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
import {solarPosition,solarElevation,daylightMix,resolveLocation} from './home-map-v122.js';

export {solarPosition,solarElevation,daylightMix,resolveLocation};

// v142 Pixel Master renderer.
// The approved raster is the visual source of truth. It is decoded losslessly
// and enlarged by an exact integer 2x nearest-neighbour replication only.
export const WIDTH=3306, HEIGHT=1558, NORTH=85, SOUTH=-75;
const NATIVE_WIDTH=1653, NATIVE_HEIGHT=779;
const RAD=Math.PI/180;
const asset=name=>fileURLToPath(new URL(`../assets/earth/${name}`,import.meta.url));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const escape=text=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));

export function project(latitude,longitude) {
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||latitude<SOUTH||latitude>NORTH||Math.abs(longitude)>180)return null;
  return {
    x:(longitude+180)/360*WIDTH,
    y:(NORTH-latitude)/(NORTH-SOUTH)*HEIGHT
  };
}

let textures;
async function getTextures() {
  if(!textures) textures=(async()=>{
    const masterPath=asset('v142-master-native.webp');
    // Decoded WebP pixels are verified identical to the approved native PNG.
    // nearest preserves every native pixel as an exact 2x2 HD block.
    const {data:master,info}=await sharp(masterPath)
      .resize(WIDTH,HEIGHT,{fit:'fill',kernel:sharp.kernel.nearest})
      .removeAlpha().raw().toBuffer({resolveWithObject:true});
    if(info.width!==WIDTH||info.height!==HEIGHT||info.channels!==3)throw Error('Invalid v142 pixel master');

    // Precompute only an emissive/warm-light mask. This never recolours the
    // night master; it is used solely to attenuate lights on the daylight side.
    const warm=new Float32Array(WIDTH*HEIGHT);
    for(let p=0;p<warm.length;p++){
      const i=p*3,R=master[i],G=master[i+1],B=master[i+2];
      const c1=clamp((R-B-18)/85,0,1);
      const c2=clamp((G-B-5)/58,0,1);
      const c3=clamp((R+G+B-150)/280,0,1);
      warm[p]=c1*c2*c3;
    }
    return {master,warm};
  })().catch(error=>{textures=null;throw error;});
  return textures;
}

async function textImage(text,size,color,weight='Regular') {
  return sharp({text:{text:`<span foreground="${color}">${escape(text)}</span>`,
    font:`Barlow Condensed${weight==='Medium'?' Medium':''}, ${size}`,
    fontfile:asset(`BarlowCondensed-${weight}.ttf`),dpi:72,rgba:true}})
    .png().toBuffer({resolveWithObject:true});
}

export async function renderHomeMap({date=new Date(),location=null}={}) {
  const {master,warm}=await getTextures();
  const out=Buffer.from(master); // exact master pixels by default

  const sun=solarPosition(date);
  const sinD=Math.sin(sun.latitude*RAD),cosD=Math.cos(sun.latitude*RAD);
  const longitudes=new Float32Array(WIDTH);
  for(let x=0;x<WIDTH;x++) longitudes[x]=Math.cos((-180+(x+.5)/WIDTH*360-sun.longitude)*RAD);

  for(let y=0;y<HEIGHT;y++){
    const lat=(NORTH-(y+.5)/HEIGHT*(NORTH-SOUTH))*RAD;
    const a=Math.sin(lat)*sinD,b=Math.cos(lat)*cosD;
    for(let x=0;x<WIDTH;x++){
      const p=y*WIDTH+x;
      const elevation=Math.asin(clamp(a+b*longitudes[x],-1,1))/RAD;
      const day=daylightMix(elevation);
      if(day<=0||warm[p]<=0) continue;

      // Daylight modifies only the detected warm emissive component.
      // Multiplying all three RGB channels equally avoids cyan/white artifacts
      // and leaves non-emissive approved terrain completely untouched.
      const attenuation=1-.90*day*warm[p];
      const i=p*3;
      out[i]=Math.round(master[i]*attenuation);
      out[i+1]=Math.round(master[i+1]*attenuation);
      out[i+2]=Math.round(master[i+2]*attenuation);
    }
  }

  const overlays=[];
  const p=location&&project(location.latitude,location.longitude);
  if(p){
    const coord=`${Math.abs(location.latitude).toFixed(1)}°${location.latitude<0?'S':'N'}  ${Math.abs(location.longitude).toFixed(1)}°${location.longitude<0?'W':'E'}`;
    const title=location.city||coord;

    let label=await textImage(title,42,'#f4f6f8','Medium');
    const coords=await textImage(coord,30,'#afbac9');
    const maxLabelWidth=420;
    if(label.info.width>maxLabelWidth)
      label=await sharp(label.data).resize({width:maxLabelWidth}).png().toBuffer({resolveWithObject:true});

    const boxWidth=Math.max(label.info.width,coords.info.width);
    let lx=p.x+58,ly=clamp(p.y-20,24,HEIGHT-120);
    if(lx+boxWidth>WIDTH-30)lx=p.x-58-boxWidth;
    lx=clamp(lx,28,WIDTH-boxWidth-28);

    const marker=`<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs><radialGradient id="g"><stop stop-color="#a8ff00" stop-opacity=".22"/><stop offset="1" stop-color="#a8ff00" stop-opacity="0"/></radialGradient></defs>
      <circle cx="${p.x}" cy="${p.y}" r="68" fill="url(#g)"/>
      <circle cx="${p.x}" cy="${p.y}" r="36" fill="#09121c" fill-opacity=".72" stroke="#baff12" stroke-width="7"/>
      <circle cx="${p.x}" cy="${p.y}" r="16" fill="#f7faf9"/>
    </svg>`;
    overlays.push({input:Buffer.from(marker)});
    overlays.push({input:label.data,left:Math.round(lx),top:Math.round(ly)});
    if(location.city) overlays.push({input:coords.data,left:Math.round(lx),top:Math.round(ly+label.info.height+6)});
  }

  // Preserve the existing premium rounded-card integration without altering
  // any interior master pixels.
  const clip=Buffer.from(`<svg width="${WIDTH}" height="${HEIGHT}"><rect width="${WIDTH}" height="${HEIGHT}" rx="80" fill="white"/></svg>`);
  const composed=await sharp(out,{raw:{width:WIDTH,height:HEIGHT,channels:3}})
    .ensureAlpha().composite(overlays).png().toBuffer();
  return sharp(composed).composite([{input:clip,blend:'dest-in'}]).png().toBuffer();
}
