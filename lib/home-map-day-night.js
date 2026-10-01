import sharp from 'sharp';
import {buildEngraving, ENGRAVING} from './engraved-coasts.js';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {PNG} from 'pngjs';
import {solarPosition, solarElevation, resolveLocation} from './home-map-v122.js';

export {solarPosition, solarElevation, resolveLocation};
export const WIDTH = 3306, HEIGHT = 1558, NORTH = 85, SOUTH = -61;
export const REVISION = 'engraved-coasts-f50';
export const STYLE = Object.freeze({twilightNight:-6, twilightDay:0, lightsNight:-6, lightsDay:0});
const RAD = Math.PI / 180;
const asset = name => fileURLToPath(new URL(`../assets/earth/${name}`, import.meta.url));
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const smooth = (a, b, x) => {const t = clamp((x-a)/(b-a), 0, 1); return t*t*(3-2*t);};
const escape = text => text.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));

// Source raster contract approved 2026-09-29. Both textures and every overlay
// use the same full canvas. No re-projection or separate layer resizing.
export function project(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      latitude < SOUTH || latitude > NORTH || Math.abs(longitude) > 180) return null;
  return {x: (longitude+180)/360*WIDTH, y: (NORTH-latitude)/(NORTH-SOUTH)*HEIGHT};
}
export function pixelCoordinates(x, y) {
  return {longitude: -180+(x+.5)/WIDTH*360, latitude: NORTH-(y+.5)/HEIGHT*(NORTH-SOUTH)};
}
export function weightsAt(elevation) {
  const day = smooth(STYLE.twilightNight, STYLE.twilightDay, elevation);
  return {day, shadow: 1-day,
    lights: 1-smooth(STYLE.lightsNight, STYLE.lightsDay, elevation)};
}

let textures;
export function getTextures() {
  if (textures) return textures;
  const contract = JSON.parse(readFileSync(asset('Widget_Asset_Contract.json'), 'utf8'));
  const decode = name => {
    const bytes = readFileSync(asset(name));
    const sha = createHash('sha256').update(bytes).digest('hex');
    if (sha !== contract.assets[name].sha256) throw Error(`Unapproved map asset: ${name}`);
    const png = PNG.sync.read(bytes);
    if (png.width !== WIDTH || png.height !== HEIGHT) throw Error(`Wrong map dimensions: ${name}`);
    return png.data;
  };
  textures = {terrain: decode('Terrain_Master_3306x1558.png'),
    lights: decode('Night_Lights_Master_3306x1558.png')};
  return textures;
}

// Preserve the approved F50 operation order and quantization exactly.
let engraving;
export function getEngraving() {
  return engraving ||= buildEngraving(getTextures().terrain, WIDTH, HEIGHT, project);
}
export function composePixel(terrain, lights, elevation, maskRGB = null) {
  const night=smooth(0,6,Math.max(0,-elevation));
  const ma=maskRGB?Math.round(ENGRAVING.opacity*night*255)/255:0;
  const la=lights[3]/255*night;
  return [0,1,2].map(c=>Math.round((terrain[c]*(1-ma)+(maskRGB?.[c]||0)*ma)*(1-la)+lights[c]*la));
}
export function renderPixels(date = new Date()) {
  return renderPixelsForSun(solarPosition(date));
}
// Explicit solar pose is used only by the exact approved-preview regression.
export function renderPixelsForSun(sun) {
  const {terrain,lights}=getTextures(),{ocean,rgb}=getEngraving();
  const sinD=Math.sin(sun.latitude*RAD),cosD=Math.cos(sun.latitude*RAD);
  const cosHour=Float64Array.from({length:WIDTH},(_,x)=>Math.cos((pixelCoordinates(x,0).longitude-sun.longitude)*RAD));
  const out=Buffer.allocUnsafe(WIDTH*HEIGHT*3);
  for(let y=0;y<HEIGHT;y++){
    const lat=pixelCoordinates(0,y).latitude*RAD,a=Math.sin(lat)*sinD,b=Math.cos(lat)*cosD;
    for(let x=0;x<WIDTH;x++){
      const p=y*WIDTH+x,i=p*4,o=p*3;
      const el=Math.asin(clamp(a+b*cosHour[x],-1,1))/RAD;
      const night=smooth(0,6,Math.max(0,-el));
      const ma=ocean[p]?Math.round(ENGRAVING.opacity*night*255)/255:0;
      const la=lights[i+3]/255*night;
      for(let c=0;c<3;c++)out[o+c]=Math.round((terrain[i+c]*(1-ma)+rgb[o+c]*ma)*(1-la)+lights[i+c]*la);
    }
  }
  return {data:out,sun};
}

async function textImage(text, size, color, weight = 'Regular') {
  return sharp({text: {text: `<span foreground="${color}">${escape(text)}</span>`,
    font: `Barlow Condensed${weight==='Medium'?' Medium':''}, ${size}`,
    fontfile: asset(`BarlowCondensed-${weight}.ttf`), dpi: 72, rgba: true}})
    .png().toBuffer({resolveWithObject: true});
}
async function locationOverlays(location) {
  const p = location && project(location.latitude, location.longitude);
  if (!p) return [];
  const coord = `${Math.abs(location.latitude).toFixed(1)}°${location.latitude<0?'S':'N'}  ${Math.abs(location.longitude).toFixed(1)}°${location.longitude<0?'W':'E'}`;
  let label = await textImage(location.city || coord, 42, '#f4f6f8', 'Medium');
  const coords = await textImage(coord, 30, '#afbac9');
  if (label.info.width > 420) label = await sharp(label.data).resize({width: 420}).png().toBuffer({resolveWithObject: true});
  const boxWidth = Math.max(label.info.width, coords.info.width);
  let lx = p.x+58, ly = clamp(p.y-20, 24, HEIGHT-120);
  if (lx+boxWidth > WIDTH-30) lx = p.x-58-boxWidth;
  lx = clamp(lx, 28, WIDTH-boxWidth-28);
  const marker = `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="g"><stop stop-color="#a8ff00" stop-opacity=".22"/><stop offset="1" stop-color="#a8ff00" stop-opacity="0"/></radialGradient></defs>
    <circle cx="${p.x}" cy="${p.y}" r="68" fill="url(#g)"/>
    <circle cx="${p.x}" cy="${p.y}" r="36" fill="#09121c" fill-opacity=".72" stroke="#baff12" stroke-width="7"/>
    <circle cx="${p.x}" cy="${p.y}" r="16" fill="#f7faf9"/>
  </svg>`;
  const overlays = [{input: Buffer.from(marker)}, {input: label.data, left: Math.round(lx), top: Math.round(ly)}];
  if (location.city) overlays.push({input: coords.data, left: Math.round(lx), top: Math.round(ly+label.info.height+6)});
  return overlays;
}
export async function renderHomeMap({date = new Date(), location = null, width = WIDTH} = {}) {
  const {data} = renderPixels(date);
  const composed = await sharp(data, {raw: {width: WIDTH, height: HEIGHT, channels: 3}})
    .ensureAlpha().composite(await locationOverlays(location)).png().toBuffer();
  const clip = Buffer.from(`<svg width="${WIDTH}" height="${HEIGHT}"><rect width="${WIDTH}" height="${HEIGHT}" rx="80" fill="white"/></svg>`);
  const clipped=await sharp(composed).composite([{input:clip,blend:'dest-in'}]).png().toBuffer();
  return sharp(clipped).resize({width}).withIccProfile('srgb').png({compressionLevel:9}).toBuffer();
}
