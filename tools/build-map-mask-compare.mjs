// Technical derivation from approved pixels, not generated artwork.
// A fixed time makes the phone's native composition directly comparable.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {solarMask} from '../lib/map-solar-mask.js';
import {getTextures,getEngraving,renderPixels,WIDTH,HEIGHT} from '../lib/home-map-day-night.js';
import {ENGRAVING} from '../lib/engraved-coasts.js';

const directory=new URL('../assets/diagnostics/map-mask-compare-1/',import.meta.url);
mkdirSync(directory,{recursive:true});
const at='2026-10-06T04:30:00.000Z',P=WIDTH*HEIGHT;
const {terrain,lights}=getTextures(),{ocean,rgb}=getEngraving('r6');
const day=Buffer.alloc(P*3),night=Buffer.alloc(P*3);
for(let p=0;p<P;p++){
  const i=p*4,o=p*3,a=lights[i+3]/255,m=ocean[p]?Math.round(ENGRAVING.opacity*255)/255:0;
  for(let c=0;c<3;c++){
    day[o+c]=terrain[i+c];
    night[o+c]=Math.round((terrain[i+c]*(1-m)+rgb[o+c]*m)*(1-a)+lights[i+c]*a);
  }
}
const mask=solarMask(new Date(at),522,246);
assert.equal(mask.width/mask.height,WIDTH/HEIGHT);
const files={};
async function save(name,data,width,height,channels){
  // Explicit sRGB for every image, including the grayscale-valued masks.
  const encoded=await sharp(data,{raw:{width,height,channels}}).withIccProfile('srgb').png({compressionLevel:6}).toBuffer();
  writeFileSync(new URL(name,directory),encoded);
  const decoded=await sharp(encoded).removeAlpha().raw().toBuffer();
  const expected=channels===3?data:Buffer.from(Array.from(data).flatMap(v=>[v,v,v]));
  assert(decoded.equals(expected),'PNG must retain all intended RGB samples');
  files[name]={width,height,bytes:encoded.length,sha256:createHash('sha256').update(encoded).digest('hex')};
}
await save('day.png',day,WIDTH,HEIGHT,3);
await save('night.png',night,WIDTH,HEIGHT,3);
await save('reference.png',renderPixels(new Date(at),'r6').data,WIDTH,HEIGHT,3);
await save('mask-day.png',mask.day,mask.width,mask.height,1);
await save('mask-night.png',mask.night,mask.width,mask.height,1);
const manifest={revision:'map-mask-compare-1',at,atlas:'r6',mapDimensions:[WIDTH,HEIGHT],maskDimensions:[mask.width,mask.height],files,
  purpose:'Fixed-time native appearance comparison. HOME/MASK uses static day/night plus complementary small masks; CALENDAR/ORIGINAL uses the approved renderer at the same instant. No location, live endpoint or personal data.',
  limits:['The mask construction is an approximation, pending owner comparison.','Corners are rectangular in both views to isolate color/composition.','This cannot measure live update latency or prove separate sources update atomically.','No approved master asset is edited.']};
writeFileSync(new URL('manifest.json',directory),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest,null,2));
