import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
import {solarPosition,solarElevation,daylightMix,resolveLocation} from './home-map-v122.js';
export {solarPosition,solarElevation,daylightMix,resolveLocation};

export const WIDTH=1828, HEIGHT=860, NORTH=85, SOUTH=-65;
// Match the approved map panel aspect ratio; every geographic layer uses these bounds.
const S=WIDTH/1484;
const RAD=Math.PI/180;
const asset=name=>fileURLToPath(new URL(`../assets/earth/${name}`,import.meta.url));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};

export function project(latitude,longitude) {
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||latitude<SOUTH||latitude>NORTH||Math.abs(longitude)>180) return null;
  return {x:(longitude+180)/360*WIDTH,y:(NORTH-latitude)/(NORTH-SOUTH)*HEIGHT};
}
const escape=text=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
let textures;
async function getTextures() {
  if(!textures) textures=(async()=>{
    const [day,night,lights,land,borders]=await Promise.all([
      ...['day-v121.png','night-v121.png','lights-v121.png'].map(name=>
        sharp(asset(name)).resize(WIDTH,HEIGHT,{fit:'fill'}).removeAlpha().raw().toBuffer()),
      ...['land-v122.png','borders-v122.png'].map(name=>
        sharp(asset(name)).resize(WIDTH,HEIGHT,{fit:'fill'}).greyscale().raw().toBuffer()),
    ]);
    // Large-scale luminance is used only to recover local terrain contrast.
    // The base materials contain neither city lights nor a fixed solar halo.
    const local=await sharp(day,{raw:{width:WIDTH,height:HEIGHT,channels:3}})
      .greyscale().blur(5).raw().toBuffer();
    const bloom=await sharp(lights,{raw:{width:WIDTH,height:HEIGHT,channels:3}})
      .blur(1.35).raw().toBuffer();
    return {day,night,lights,land,borders,local,bloom};
  })().catch(error=>{textures=null;throw error;});
  return textures;
}
// Atmospheric colour is artistic, but is tied to the actual solar horizon.
// It peaks at elevation zero, on both boundaries, and has no fixed map position.
export function illumination(elevation) {
  const day=daylightMix(elevation);
  return {day,lights:1-day,
    atmosphere:Math.exp(-.5*(elevation/5.5)**2),
    shoulder:Math.exp(-.5*(elevation/11)**2)};
}
async function textImage(text,size,color,weight='Regular') {
  return sharp({text:{text:`<span foreground="${color}">${escape(text)}</span>`,
    // Comma prevents Pango parsing "Condensed" as a style of the Barlow family.
    font:`Barlow Condensed${weight==='Medium'?' Medium':''}, ${size*S}`,
    fontfile:asset(`BarlowCondensed-${weight}.ttf`),dpi:72,rgba:true}})
    .png().toBuffer({resolveWithObject:true});
}
export async function renderHomeMap({date=new Date(),location=null}={}) {
  const {day,night,lights,land,borders,local,bloom}=await getTextures();
  const out=Buffer.alloc(WIDTH*HEIGHT*3);
  const sun=solarPosition(date), sinD=Math.sin(sun.latitude*RAD),cosD=Math.cos(sun.latitude*RAD);
  const longitudes=Array.from({length:WIDTH},(_,x)=>Math.cos((-180+(x+.5)/WIDTH*360-sun.longitude)*RAD));
  for(let y=0;y<HEIGHT;y++) {
    const lat=(NORTH-(y+.5)/HEIGHT*(NORTH-SOUTH))*RAD;
    const a=Math.sin(lat)*sinD,b=Math.cos(lat)*cosD;
    for(let x=0;x<WIDTH;x++) {
      const elevation=Math.asin(clamp(a+b*longitudes[x],-1,1))/RAD;
      const {day:mix,lights:nightWeight,atmosphere,shoulder}=illumination(elevation);
      const daylight=.98+.15*Math.sqrt(Math.max(0,Math.sin(elevation*RAD)));
      const nx=(x/WIDTH-.50)/.72,ny=(y/HEIGHT-.44)/.95;
      const vignette=1-.12*Math.min(1,nx*nx+ny*ny);
      // Restrained darker zone behind the native clock and agenda at lower left.
      const veil=1-.16*smooth(.38,.93,y/HEIGHT)*(1-smooth(.28,.59,x/WIDTH));
      const i=(y*WIDTH+x)*3;
      const pixel=y*WIDTH+x,l=land[pixel]/255;
      const dayLuma=day[i]*.26+day[i+1]*.55+day[i+2]*.19;
      const nightLuma=night[i]*.26+night[i+1]*.55+night[i+2]*.19;
      const detail=(dayLuma-local[pixel])*1.1;
      const borderAlpha=borders[pixel]/255*(.29+.32*mix);
      for(let k=0;k<3;k++) {
        const dayTone=day[i+k]*(1-l)+l*Math.max(0,
          (dayLuma*.18+day[i+k]*.82-11)*1.22+detail);
        // Deeper night lets urban lights stand out; maintain a readable coast.
        const nightTone=night[i+k]*(1-l)+l*Math.max(0,
          (nightLuma*.18+night[i+k]*.82-8)*.75+detail*.32);
        const terrain=nightTone*(1-mix)+dayTone*daylight*mix;
        const lined=terrain*(1-borderAlpha)+[121,139,161][k]*borderAlpha;
        const air=(atmosphere*[3,18,36][k]+shoulder*[1,5,10][k])*(1-.55*l);
        // Multiply the complete city light layer (including bloom) by local
        // night weight. No part of the city glow leaks into full daylight.
        const city=(lights[i+k]*[1.32,1.26,1.16][k]+bloom[i+k]*.28)*nightWeight;
        out[i+k]=clamp(Math.round((lined+air)*veil*vignette+city*vignette),0,255);
      }
    }
  }
  const overlays=[];
  // A true geographic grid, rendered after illumination and never baked in art.
  const grid=[];
  for(let lon=-150;lon<180;lon+=30){const p=project(0,lon);grid.push(`<path d="M${p.x},0 V${HEIGHT}"/>`);}
  for(let lat=-60;lat<90;lat+=30){const p=project(lat,0);if(p)grid.push(`<path d="M0,${p.y} H${WIDTH}"/>`);}
  overlays.push({input:Buffer.from(`<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg"><g stroke="#7a8996" stroke-opacity=".19" stroke-width="1" stroke-dasharray="7 5" fill="none">${grid.join('')}</g></svg>`)});
  const p=location&&project(location.latitude,location.longitude);
  if(p) {
    const coord=`${Math.abs(location.latitude).toFixed(1)}°${location.latitude<0?'S':'N'}  ${Math.abs(location.longitude).toFixed(1)}°${location.longitude<0?'W':'E'}`;
    // Missing IP city names must not turn into a fictitious city or "Location".
    const title=location.city||coord;
    let label=await textImage(title,location.city?38:30,location.city?'#f4f6f8':'#afbac9',location.city?'Medium':'Regular');
    const maxLabelWidth=310*S;
    if(label.info.width>maxLabelWidth) label=await sharp(label.data).resize({width:maxLabelWidth}).png().toBuffer({resolveWithObject:true});
    const coords=await textImage(coord,30,'#afbac9');
    const boxWidth=Math.max(label.info.width,coords.info.width);
    let lx=p.x+56*S,ly=clamp(p.y-3*S,18*S,HEIGHT-100*S);
    if(lx+boxWidth>WIDTH-22*S) lx=p.x-56*S-boxWidth;
    lx=clamp(lx,20*S,WIDTH-boxWidth-20*S);
    // Move labels above the native agenda when the marker is at lower left.
    if(lx<770*S&&ly>300*S) ly=200*S;
    const ring=`<svg width="${WIDTH}" height="${HEIGHT}"><defs><radialGradient id="glow"><stop stop-color="#a8ff00" stop-opacity=".28"/><stop offset="1" stop-color="#a8ff00" stop-opacity="0"/></radialGradient></defs><circle cx="${p.x}" cy="${p.y}" r="${48*S}" fill="url(#glow)"/><circle cx="${p.x}" cy="${p.y}" r="${25*S}" fill="#09121c" fill-opacity=".7" stroke="#baff12" stroke-width="${5*S}"/><circle cx="${p.x}" cy="${p.y}" r="${11*S}" fill="#f7faf9"/></svg>`;
    const shadow=`<svg width="${WIDTH}" height="${HEIGHT}"><defs><filter id="soft"><feGaussianBlur stdDeviation="${9*S}"/></filter></defs><rect x="${lx-7*S}" y="${ly-6*S}" width="${boxWidth+14*S}" height="${label.info.height+(location.city?coords.info.height+8*S:0)+12*S}" rx="${12*S}" fill="#02070c" fill-opacity=".6" filter="url(#soft)"/></svg>`;
    overlays.push({input:Buffer.from(shadow)},{input:Buffer.from(ring)});
    overlays.push({input:label.data,left:Math.round(lx),top:Math.round(ly)});
    if(location.city) overlays.push({input:coords.data,left:Math.round(lx),top:Math.round(ly+label.info.height+8*S)});
  }
  const border=Buffer.from(`<svg width="${WIDTH}" height="${HEIGHT}"><defs><linearGradient id="rim" x2=".7" y2="1"><stop stop-color="#64798b" stop-opacity=".85"/><stop offset=".35" stop-color="#33424e"/><stop offset="1" stop-color="#566977" stop-opacity=".7"/></linearGradient></defs><rect x="${1.5*S}" y="${1.5*S}" width="${WIDTH-3*S}" height="${HEIGHT-3*S}" rx="${40*S}" fill="none" stroke="url(#rim)" stroke-width="${3*S}"/></svg>`);
  overlays.push({input:border});
  const clip=Buffer.from(`<svg width="${WIDTH}" height="${HEIGHT}"><rect width="${WIDTH}" height="${HEIGHT}" rx="${40*S}" fill="white"/></svg>`);
  const composed=await sharp(out,{raw:{width:WIDTH,height:HEIGHT,channels:3}}).composite(overlays).png().toBuffer();
  // Native image frame retains the approved layout; corners are truly transparent.
  return sharp(composed).ensureAlpha().composite([{input:clip,blend:'dest-in'}]).png().toBuffer();
}
