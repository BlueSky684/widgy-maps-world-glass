import sharp from 'sharp';
import {buildEngraving, ENGRAVING, ENGRAVING_R6} from './engraved-coasts.js';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {PNG} from 'pngjs';
import {precomputedMap} from './map-precomputed.js';
import {solarPosition, solarElevation, resolveLocation} from './map-astronomy-location.js';
import {nightMapAsset} from './night-map-assets.js';
import {mapRefreshStamp, REFRESH_STAMP_RECT} from './map-refresh-stamp.js';
import {createRenderResourceCache} from './render-resource-cache.js';

export {solarPosition, solarElevation, resolveLocation};
export const WIDTH = 3306, HEIGHT = 1558, NORTH = 85, SOUTH = -61;
export const REVISION = 'engraved-coasts-f50';
export const STYLE = Object.freeze({twilightNight:-6, twilightDay:0, lightsNight:-6, lightsDay:0});
const RAD = Math.PI / 180;
const asset = name => fileURLToPath(nightMapAsset(name));
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
  const prepared=precomputedMap();
  if(prepared)return textures=prepared.textures;
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
const engravings = new Map();
const nightPixels = new Map();
export function getEngraving(atlas = 'f50') {
  const key = atlas === 'r6' ? 'r6' : 'f50';
  const prepared=key==='r6' && precomputedMap();
  if(prepared)return prepared.engraving;
  if (!engravings.has(key)) engravings.set(key, buildEngraving(getTextures().terrain,
    WIDTH, HEIGHT, project, key === 'r6' ? ENGRAVING_R6 : ENGRAVING));
  return engravings.get(key);
}
function getNightPixels(atlas) {
  const key=atlas==='r6'?'r6':'f50';
  if(!nightPixels.has(key)){
    const {terrain,lights}=getTextures(),{ocean,rgb}=getEngraving(key);
    const data=Buffer.allocUnsafe(WIDTH*HEIGHT*3);
    const maskAlpha=Math.round(ENGRAVING.opacity*255)/255;
    for(let p=0;p<WIDTH*HEIGHT;p++){
      const i=p*4,o=p*3,ma=ocean[p]?maskAlpha:0,la=lights[i+3]/255;
      for(let c=0;c<3;c++)data[o+c]=Math.round((terrain[i+c]*(1-ma)+rgb[o+c]*ma)*(1-la)+lights[i+c]*la);
    }
    nightPixels.set(key,data);
  }
  return nightPixels.get(key);
}
export function composePixel(terrain, lights, elevation, maskRGB = null) {
  const night=smooth(0,6,Math.max(0,-elevation));
  const ma=maskRGB?Math.round(ENGRAVING.opacity*night*255)/255:0;
  const la=lights[3]/255*night;
  return [0,1,2].map(c=>Math.round((terrain[c]*(1-ma)+(maskRGB?.[c]||0)*ma)*(1-la)+lights[c]*la));
}
export function renderPixels(date = new Date(), atlas = 'f50') {
  return renderPixelsForSun(solarPosition(date), atlas);
}
// Explicit solar pose is used only by the exact approved-preview regression.
export function renderPixelsForSun(sun, atlas = 'f50') {
  const {terrain,lights}=getTextures(),{ocean,rgb}=getEngraving(atlas);
  const dark=getNightPixels(atlas),nightBoundary=Math.sin(-6*RAD);
  const sinD=Math.sin(sun.latitude*RAD),cosD=Math.cos(sun.latitude*RAD);
  const cosHour=Float64Array.from({length:WIDTH},(_,x)=>Math.cos((pixelCoordinates(x,0).longitude-sun.longitude)*RAD));
  const out=Buffer.allocUnsafe(WIDTH*HEIGHT*3);
  for(let y=0;y<HEIGHT;y++){
    const lat=pixelCoordinates(0,y).latitude*RAD,a=Math.sin(lat)*sinD,b=Math.cos(lat)*cosD;
    for(let x=0;x<WIDTH;x++){
      const p=y*WIDTH+x,i=p*4,o=p*3;
      const sineElevation=a+b*cosHour[x];
      // Outside twilight, the original smoothstep is exactly 0 or 1. Reuse
      // those exact RGB values; only twilight needs per-pixel trigonometry and
      // blending. The solar pose, projection and rounding order stay unchanged.
      if(sineElevation>=0){
        out[o]=terrain[i];out[o+1]=terrain[i+1];out[o+2]=terrain[i+2];continue;
      }
      if(sineElevation<=nightBoundary){
        out[o]=dark[o];out[o+1]=dark[o+1];out[o+2]=dark[o+2];continue;
      }
      const el=Math.asin(clamp(sineElevation,-1,1))/RAD;
      const night=smooth(0,6,Math.max(0,-el));
      const ma=ocean[p]?Math.round(ENGRAVING.opacity*night*255)/255:0;
      const la=lights[i+3]/255*night;
      for(let c=0;c<3;c++)out[o+c]=Math.round((terrain[i+c]*(1-ma)+rgb[o+c]*ma)*(1-la)+lights[i+c]*la);
    }
  }
  return {data:out,sun};
}

const drawingResources=createRenderResourceCache();
async function textImage(text, size, color, weight = 'Regular') {
  return drawingResources(JSON.stringify(['text',text,size,color,weight]),()=>sharp({text: {text: `<span foreground="${color}">${escape(text)}</span>`,
    font: `Barlow Condensed${weight==='Medium'?' Medium':''}, ${size}`,
    fontfile: asset(`BarlowCondensed-${weight}.ttf`), dpi: 72, rgba: true}})
    .png().toBuffer({resolveWithObject: true}));
}
async function locationOverlays(location, presentation = 'default') {
  const p = location && project(location.latitude, location.longitude);
  if (!p) return [];
  // An opt-in UI presentation changes only marker/text size. The approved
  // terrain, lights, geographic registration and F50 compositor stay exact.
  const glass = presentation === 'glass';
  const coord = `${Math.abs(location.latitude).toFixed(1)}°${location.latitude<0?'S':'N'}  ${Math.abs(location.longitude).toFixed(1)}°${location.longitude<0?'W':'E'}`;
  let label = await textImage(location.city || coord, glass ? 90 : 42, '#f4f6f8', 'Medium');
  const coords = await textImage(coord, glass ? 60 : 30, '#afbac9');
  const maxLabelWidth = glass ? 620 : 420;
  if (label.info.width > maxLabelWidth) label = await sharp(label.data).resize({width: maxLabelWidth}).png().toBuffer({resolveWithObject: true});
  const boxWidth = Math.max(label.info.width, coords.info.width);
  const offset = glass ? 124 : 58, gap = glass ? 12 : 6;
  let lx = p.x+offset, ly = clamp(p.y-(glass ? 12 : 20), 24, HEIGHT-(glass ? 220 : 120));
  if (lx+boxWidth > WIDTH-30) lx = p.x-offset-boxWidth;
  lx = clamp(lx, 28, WIDTH-boxWidth-28);
  const marker = `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="g"><stop stop-color="#a8ff00" stop-opacity=".22"/><stop offset="1" stop-color="#a8ff00" stop-opacity="0"/></radialGradient></defs>
    <circle cx="${p.x}" cy="${p.y}" r="${glass ? 104 : 68}" fill="url(#g)"/>
    <circle cx="${p.x}" cy="${p.y}" r="${glass ? 58 : 36}" fill="#09121c" fill-opacity=".72" stroke="#baff12" stroke-width="${glass ? 11 : 7}"/>
    <circle cx="${p.x}" cy="${p.y}" r="${glass ? 23 : 16}" fill="#f7faf9"/>
  </svg>`;
  const overlays = [{input: Buffer.from(marker)}, {input: label.data, left: Math.round(lx), top: Math.round(ly)}];
  if (location.city) overlays.push({input: coords.data, left: Math.round(lx), top: Math.round(ly+label.info.height+gap)});
  return overlays;
}
async function locationDiagnostic(location) {
  const status = `SERVER: ${location?.source || 'unavailable'} | CITY: ${location?.city || '[empty]'}`;
  let label = await textImage(status, 64, '#c5ff0a');
  if (label.info.width > 1450) label = await sharp(label.data).resize({width:1450}).png().toBuffer({resolveWithObject:true});
  return [
    {input:Buffer.from('<svg width="3306" height="1558"><rect x="1760" y="1310" width="1510" height="160" rx="18" fill="#080f14"/></svg>')},
    {input:label.data,left:1790,top:1350},
  ];
}
async function refreshDiagnostic(date) {
  const {left,top,width,height}=REFRESH_STAMP_RECT;
  const label=await textImage(mapRefreshStamp(date),84,'#c5ff0a','Medium');
  return [
    {input:Buffer.from(`<svg width="${WIDTH}" height="${HEIGHT}"><rect x="${left}" y="${top}" width="${width}" height="${height}" rx="22" fill="#080f14"/></svg>`)},
    {input:label.data,left:left+40,top:top+34}
  ];
}
export async function renderHomeMap({date = new Date(), location = null, width = WIDTH, presentation = 'default', diagnostic = false, atlas = 'f50'} = {}) {
  const {data} = renderPixels(date, atlas);
  const overlays = await locationOverlays(location, presentation);
  if (diagnostic === 'refresh-v1') overlays.push(...await refreshDiagnostic(date));
  else if (diagnostic) overlays.push(...await locationDiagnostic(location));
  // Keep the full-size compositor and encoder in one native pipeline. Avoid
  // materializing/copying a 20.6 MB RGBA buffer only to read it into sharp again.
  // Fixed corner alpha is identical for all GPS positions and solar instants.
  // Cache its lossless raster; full map, marker and time still render normally.
  const clip=await drawingResources('corner-clip-v1',()=>sharp(Buffer.from(`<svg width="${WIDTH}" height="${HEIGHT}"><rect width="${WIDTH}" height="${HEIGHT}" rx="80" fill="white"/></svg>`)).png().toBuffer());
  const raw = {width: WIDTH, height: HEIGHT, channels: 4};
  const pipeline=sharp(data,{raw:{...raw,channels:3}}).ensureAlpha()
    .composite([...overlays,{input:clip,blend:'dest-in'}]);
  if(width===WIDTH) return pipeline.withIccProfile('srgb').png({compressionLevel:6}).toBuffer();
  // Preserve legacy smaller-output ordering: sharp performs resize before
  // composite, so those outputs still need a post-composite resize pipeline.
  const clipped=await pipeline.raw().toBuffer();
  // Lossless encoding: the same decoded pixels and full resolution, without
  // level 9's extra CPU work on every newly rendered minute.
  return sharp(clipped,{raw}).resize({width}).withIccProfile('srgb').png({compressionLevel:6}).toBuffer();
}
