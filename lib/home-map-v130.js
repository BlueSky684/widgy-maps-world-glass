import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {solarPosition,solarElevation,daylightMix,resolveLocation} from './home-map-v122.js';
export {solarPosition,solarElevation,daylightMix,resolveLocation};

export const WIDTH=1827, HEIGHT=861, NORTH=85, SOUTH=-75;
// Match the approved map panel aspect ratio; every geographic layer uses these bounds.
const S=WIDTH/1484;
const RAD=Math.PI/180;
const asset=name=>fileURLToPath(new URL(`../assets/earth/${name}`,import.meta.url));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};

const mesh=JSON.parse(readFileSync(asset('reference-mesh-v127.json'),'utf8'));
// Piecewise affine calibration follows the approved artwork. It is illustrative
// rather than a standard map projection; pin and solar coordinates share it.
export function project(latitude,longitude) {
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||latitude<SOUTH||latitude>NORTH||Math.abs(longitude)>180)return null;
  for(const t of mesh.triangles) {
    const [a,b,c]=t.map(i=>mesh.points[i]);
    const det=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
    const u=((b[1]-c[1])*(longitude-c[0])+(c[0]-b[0])*(latitude-c[1]))/det;
    const v=((c[1]-a[1])*(longitude-c[0])+(a[0]-c[0])*(latitude-c[1]))/det;
    const w=1-u-v;
    if(u>=-1e-8&&v>=-1e-8&&w>=-1e-8)return {x:u*a[2]+v*b[2]+w*c[2],y:u*a[3]+v*b[3]+w*c[3]};
  }return null;
}
const escape=text=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
// Albedo is locked to v129. Night signal is historical NASA-derived data;
// it contains neither painted coast outlines nor baked colour / bloom.
let textures;
function coordinateNormals(name) {
  const field=gunzipSync(readFileSync(asset(name)));
  if(field.length!==WIDTH*HEIGHT*4)throw Error('Invalid coordinate field');
  const sinLat=new Float32Array(WIDTH*HEIGHT),cosLat=new Float32Array(WIDTH*HEIGHT);
  const sinLon=new Float32Array(WIDTH*HEIGHT),cosLon=new Float32Array(WIDTH*HEIGHT);
  let longitude=0,latitude=0;
  for(let p=0;p<WIDTH*HEIGHT;p++) {
    if(p%WIDTH===0){longitude=0;latitude=0;}
    longitude+=field.readInt16LE(p*4);latitude+=field.readInt16LE(p*4+2);
    const lon=longitude/100*RAD,lat=latitude/100*RAD;
    sinLat[p]=Math.sin(lat);cosLat[p]=Math.cos(lat);
    sinLon[p]=Math.sin(lon);cosLon[p]=Math.cos(lon);
  }
  return {sinLat,cosLat,sinLon,cosLon};
}
async function getTextures() {
  if(!textures)textures=(async()=>{
    const base=await sharp(asset('reference-base-v127.png'))
      .resize(WIDTH,HEIGHT,{fit:'fill'}).removeAlpha().raw().toBuffer();
    const signal=gunzipSync(readFileSync(asset('night-signal-v130.bin.gz')));
    if(signal.length!==WIDTH*HEIGHT*2)throw Error('Invalid night signal');
    const cores=new Float32Array(WIDTH*HEIGHT);
    for(let p=0;p<cores.length;p++) {
      const energy=signal.readUInt16LE(p*2)/512;
      // Smooth shoulder protects bright centres; weak urban points survive.
      // This artistic response is not a calibrated radiance measurement.
      const response=240*Math.pow(1-Math.exp(-energy/28),.65);
      const i=p*3,luma=base[i]*.26+base[i+1]*.55+base[i+2]*.19;
      // Clip source registration spill to the existing land artwork. This
      // coverage affects city emission only; never changes the albedo itself.
      cores[p]=response*smooth(6,20,luma);
    }
    return {base,cores,geo:coordinateNormals('reference-coordinates-v127.bin.gz'),
      airGeo:coordinateNormals('air-coordinates-v130.bin.gz')};
  })().catch(error=>{textures=null;throw error;});
  return textures;
}
const dotSun=(geo,p,sinD,cosD,sinS,cosS)=>geo.sinLat[p]*sinD+
  geo.cosLat[p]*cosD*(geo.cosLon[p]*cosS+geo.sinLon[p]*sinS);
// Point and halo responses are independent: brighter cores cannot turn the
// whole city network white. All bloom is made from already night-masked light.
const POINT=[1,.79,.46],NEAR=[1,.70,.30],FAR=[1,.60,.20];
async function textImage(text,size,color,weight='Regular') {
  return sharp({text:{text:`<span foreground="${color}">${escape(text)}</span>`,
    // Comma prevents Pango parsing "Condensed" as a style of the Barlow family.
    font:`Barlow Condensed${weight==='Medium'?' Medium':''}, ${size*S}`,
    fontfile:asset(`BarlowCondensed-${weight}.ttf`),dpi:72,rgba:true}})
    .png().toBuffer({resolveWithObject:true});
}
export async function renderHomeMap({date=new Date(),location=null}={}) {
  const {base,cores,geo,airGeo}=await getTextures();
  const out=Buffer.alloc(WIDTH*HEIGHT*3),nightSignal=Buffer.alloc(WIDTH*HEIGHT);
  const sun=solarPosition(date),sinD=Math.sin(sun.latitude*RAD),cosD=Math.cos(sun.latitude*RAD);
  const sinS=Math.sin(sun.longitude*RAD),cosS=Math.cos(sun.longitude*RAD);
  const darkness=new Float32Array(WIDTH*HEIGHT);
  for(let p=0;p<darkness.length;p++) {
    const elevation=Math.asin(clamp(dotSun(geo,p,sinD,cosD,sinS,cosS),-1,1))/RAD;
    darkness[p]=1-daylightMix(elevation);
    nightSignal[p]=Math.round(cores[p]*darkness[p]);
  }
  const [near,far]=await Promise.all([.85,3.2].map(sigma=>
    sharp(nightSignal,{raw:{width:WIDTH,height:HEIGHT,channels:1}})
      .blur(sigma).greyscale().raw().toBuffer()));
  for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++) {
    const p=y*WIDTH+x,i=p*3;
    const dot=dotSun(geo,p,sinD,cosD,sinS,cosS);
    const elevation=Math.asin(clamp(dot,-1,1))/RAD;
    const day=daylightMix(elevation),night=1-day;
    // All terrain terms below are identical to v129, including the palette,
    // base texture, luma coverage, night gain, daytime gain and agenda veil.
    const luma=base[i]*.26+base[i+1]*.55+base[i+2]*.19;
    const land=smooth(8,24,luma);
    const gain=.48*night+(.92+.08*Math.max(0,dot))*day;
    // Only the decorative blue halo uses the smoothed calibration, which
    // removes triangle-boundary kinks. Solar terrain and lights use geo.
    const airElevation=Math.asin(clamp(dotSun(airGeo,p,sinD,cosD,sinS,cosS),-1,1))/RAD;
    const halo=Math.exp(-.5*(airElevation/6.5)**2),core=Math.exp(-.5*(airElevation/2)**2);
    const veil=1-.08*smooth(.4,.94,y/HEIGHT)*(1-smooth(.25,.55,x/WIDTH));
    for(let k=0;k<3;k++) {
      const terrain=([1,3,5][k]*(1-land)+base[i+k]*land)*gain;
      const air=(halo*[3,20,42][k]+core*[3,15,30][k])*(1-.60*land);
      const backdrop=clamp((terrain+air)*veil,0,255);
      // Screen point and two modest amber halos separately, avoiding additive
      // clipping. Fade halo support to zero in daylight after blurring too.
      const point=nightSignal[p]*POINT[k];
      const local=near[p]*.58*NEAR[k]*night;
      const wide=far[p]*.38*FAR[k]*night;
      const transmission=(1-point/255)*(1-local/255)*(1-wide/255);
      out[i+k]=Math.round(255-(255-backdrop)*transmission);
    }
  }
  const overlays=[];
  // Decorative straight grid follows the approved design; it is not a
  // labelled geographic graticule. Illumination and pins use the mesh above.
  const grid=[];
  for(let x=WIDTH/8;x<WIDTH;x+=WIDTH/8)grid.push(`<path d="M${x},0 V${HEIGHT}"/>`);
  for(let y=HEIGHT/4;y<HEIGHT;y+=HEIGHT/4)grid.push(`<path d="M0,${y} H${WIDTH}"/>`);
  overlays.push({input:Buffer.from(`<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg"><g stroke="#71869b" stroke-opacity=".18" stroke-width="1" stroke-dasharray="7 5" fill="none">${grid.join('')}</g></svg>`)});
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
