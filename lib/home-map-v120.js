import sharp from 'sharp';
import {fileURLToPath} from 'node:url';

export const WIDTH=2400, HEIGHT=1188, NORTH=85, SOUTH=-65;
// Higher-resolution output with the approved Master's ~2.02:1 panel proportions.
const S=WIDTH/1484;
const SCATTER=[3,11,21];
const RAD=Math.PI/180;
const asset=name=>fileURLToPath(new URL(`../assets/earth/${name}`,import.meta.url));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const norm=n=>((n+180)%360+360)%360-180;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};

// The 50% blend follows the geometric solar horizon (solar centre at 0°).
// Softness is symmetric around that horizon; it never shifts or bends it.
// This is an illustrative twilight blend, not a model of atmospheric refraction.
export const daylightMix=elevation=>smooth(-6,6,elevation);
export function solarElevation(latitude,longitude,sun) {
  return Math.asin(clamp(Math.sin(latitude*RAD)*Math.sin(sun.latitude*RAD)
    +Math.cos(latitude*RAD)*Math.cos(sun.latitude*RAD)*Math.cos((longitude-sun.longitude)*RAD),-1,1))/RAD;
}

// NOAA/Meeus solar longitude, obliquity, declination and equation of time.
// longitude is positive east; date is an absolute UTC instant.
export function solarPosition(date) {
  if(!Number.isFinite(date.getTime())) throw new TypeError('Invalid date');
  const t=(date.getTime()/86400000+2440587.5-2451545)/36525;
  const l0=((280.46646+t*(36000.76983+t*.0003032))%360+360)%360;
  const m=357.52911+t*(35999.05029-.0001537*t);
  const e=.016708634-t*(.000042037+.0000001267*t);
  const c=Math.sin(m*RAD)*(1.914602-t*(.004817+.000014*t))
    +Math.sin(2*m*RAD)*(.019993-.000101*t)+Math.sin(3*m*RAD)*.000289;
  const omega=125.04-1934.136*t;
  const lambda=l0+c-.00569-.00478*Math.sin(omega*RAD);
  const ob=(23+(26+(21.448-t*(46.815+t*(.00059-t*.001813)))/60)/60)
    +.00256*Math.cos(omega*RAD);
  const dec=Math.asin(Math.sin(ob*RAD)*Math.sin(lambda*RAD))/RAD;
  const y=Math.tan(ob*RAD/2)**2;
  const eq=4/RAD*(y*Math.sin(2*l0*RAD)-2*e*Math.sin(m*RAD)
    +4*e*y*Math.sin(m*RAD)*Math.cos(2*l0*RAD)
    -.5*y*y*Math.sin(4*l0*RAD)-1.25*e*e*Math.sin(2*m*RAD));
  const minutes=date.getUTCHours()*60+date.getUTCMinutes()+date.getUTCSeconds()/60;
  return {latitude:dec,longitude:norm((720-minutes-eq)/4)};
}
export function project(latitude,longitude) {
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||latitude<SOUTH||latitude>NORTH||Math.abs(longitude)>180) return null;
  return {x:(longitude+180)/360*WIDTH,y:(NORTH-latitude)/(NORTH-SOUTH)*HEIGHT};
}
function number(value) {
  if(typeof value!=='string'||!value.trim()) return NaN;
  return Number(value);
}
const clean=value=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,'').slice(0,80);
export function resolveLocation(url,headers={}) {
  const explicit=url.searchParams.has('lat')||url.searchParams.has('lon');
  const latitude=number(explicit?url.searchParams.get('lat'):headers['x-vercel-ip-latitude']);
  const longitude=number(explicit?url.searchParams.get('lon'):headers['x-vercel-ip-longitude']);
  if(!Number.isFinite(latitude)||Math.abs(latitude)>90||!Number.isFinite(longitude)||Math.abs(longitude)>180) return null;
  let city=explicit?url.searchParams.get('city'):headers['x-vercel-ip-city'];
  if(!explicit) {try{city=decodeURIComponent(city??'');}catch{city='';}}
  return {latitude,longitude,city:clean(city),source:explicit?'coordinates':'ip-approximate'};
}
const escape=text=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
let textures;
async function getTextures() {
  if(!textures) textures=Promise.all(['day-v120.png','night-v120.png'].map(name=>sharp(asset(name)).removeAlpha().raw().toBuffer()));
  return textures;
}
async function textImage(text,size,color,weight='Regular') {
  return sharp({text:{text:`<span foreground="${color}">${escape(text)}</span>`,
    // Comma prevents Pango parsing "Condensed" as a style of the Barlow family.
    font:`Barlow Condensed${weight==='Medium'?' Medium':''}, ${size*S}`,
    fontfile:asset(`BarlowCondensed-${weight}.ttf`),dpi:72,rgba:true}})
    .png().toBuffer({resolveWithObject:true});
}
export async function renderHomeMap({date=new Date(),location=null}={}) {
  const [day,night]=await getTextures();
  const out=Buffer.alloc(WIDTH*HEIGHT*3);
  const sun=solarPosition(date), sinD=Math.sin(sun.latitude*RAD),cosD=Math.cos(sun.latitude*RAD);
  const longitudes=Array.from({length:WIDTH},(_,x)=>Math.cos((-180+(x+.5)/WIDTH*360-sun.longitude)*RAD));
  for(let y=0;y<HEIGHT;y++) {
    const lat=(NORTH-(y+.5)/HEIGHT*(NORTH-SOUTH))*RAD;
    const a=Math.sin(lat)*sinD,b=Math.cos(lat)*cosD;
    for(let x=0;x<WIDTH;x++) {
      const elevation=Math.asin(clamp(a+b*longitudes[x],-1,1))/RAD;
      const mix=daylightMix(elevation);
      const daylight=.98+.30*Math.sqrt(Math.max(0,Math.sin(elevation*RAD)));
      // Subtle blue scattering follows solar elevation at BOTH real horizons.
      // Purely stylistic atmospheric colour: no screen-space circle, no change
      // to the solar horizon, twilight mask, geography, or city-light coverage.
      const atmosphere=Math.exp(-.5*(elevation/7)**2);
      const nx=(x/WIDTH-.50)/.72,ny=(y/HEIGHT-.44)/.95;
      const vignette=1-.18*Math.min(1,nx*nx+ny*ny);
      // Restrained darker zone behind the native clock and agenda at lower left.
      const veil=1-.36*smooth(.38,.93,y/HEIGHT)*(1-smooth(.28,.59,x/WIDTH));
      const i=(y*WIDTH+x)*3;
      // Readable midnight-blue geography and warm lights come from the night
      // texture. Its ambient floor stays visible instead of being crushed black.
      for(let k=0;k<3;k++) out[i+k]=clamp(Math.round((night[i+k]*(1-mix)+day[i+k]*daylight*mix+atmosphere*SCATTER[k])*veil*vignette),0,255);
    }
  }
  const overlays=[];
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
