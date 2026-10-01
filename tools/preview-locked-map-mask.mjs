import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {PNG} from 'pngjs';
import {getTextures, WIDTH, HEIGHT, pixelCoordinates, solarElevation} from '../lib/home-map-day-night.js';

// Sep 30 reset: only the Sep 29 approved pixels may be used. No generator,
// terrain grading, day-ocean fill, image blur, replacement lights or bright rim.
const root = '/workspace/scratch/3fac4a755ada';
const originalPath = `${root}/approved_original_reference/World_Map_Night_Preview_3306x1558.png`;
const expectedCompositeHash = 'e01c9714cc6d881be54c4f374ea38a9d0d19ad63f4b3c039a1fe0ac9cd68fcda';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const originalBytes = readFileSync(originalPath);
if (hash(originalBytes) !== expectedCompositeHash) throw Error('Approved reference changed');
const original = PNG.sync.read(originalBytes);
const {terrain, lights} = getTextures(); // immutable source hashes checked here
if (original.width !== WIDTH || original.height !== HEIGHT) throw Error('Wrong reference dimensions');

// Fixed illustration pose, not current time: comparable curved shape to the
// supplied reference. Live use must compute this vector from the requested UTC.
const sun = {latitude:20, longitude:-165};
const choices = process.argv.includes('--options') ? [
  {name:'World_Map_Mask_Graphite',rgb:[75,83,94],opacity:0.20,feather:6},
  {name:'World_Map_Mask_Ink_Blue',rgb:[50,76,106],opacity:0.28,feather:8},
  {name:'World_Map_Mask_Soft_Slate',rgb:[145,151,161],opacity:0.18,feather:12}
] : [{name:'World_Map_Locked_Mask_Preview',rgb:[120,125,135],opacity:0.20,feather:6}];
const reports = [];
for (const choice of choices) {
const {rgb:maskRGB,opacity,feather,name} = choice;
const out = Buffer.alloc(WIDTH*HEIGHT*3);
const mask = Buffer.alloc(WIDTH*HEIGHT*4);
let originalMismatchCount = 0, dayMismatchCount = 0;
const terrainBefore = hash(terrain), lightsBefore = hash(lights);
for (let y=0; y<HEIGHT; y++) for (let x=0; x<WIDTH; x++) {
  const {latitude, longitude} = pixelCoordinates(x,y);
  const el = solarElevation(latitude,longitude,sun);
  const t = Math.max(0,Math.min(1,-el/6));
  const night = t*t*(3-2*t);
  const maskT = Math.max(0,Math.min(1,-el/feather));
  const maskWeight = maskT*maskT*(3-2*maskT);
  const p=y*WIDTH+x, i=p*4, o=p*3;
  const maskAlphaByte = Math.round(255*opacity*maskWeight);
  const maskAlpha = maskAlphaByte/255;
  const originalLightAlpha = lights[i+3]/255;
  const visibleLightAlpha = originalLightAlpha*night;
  mask[i]=maskRGB[0]; mask[i+1]=maskRGB[1]; mask[i+2]=maskRGB[2];
  mask[i+3]=maskAlphaByte;
  for (let c=0;c<3;c++) {
    const approved = Math.round(terrain[i+c]*(1-originalLightAlpha)+lights[i+c]*originalLightAlpha);
    if (approved !== original.data[i+c]) originalMismatchCount++;
    // One translucent layer under the approved city lights. Its uniform full
    // night tone is visible over black water; only the alpha edge is feathered.
    const veiled = terrain[i+c]*(1-maskAlpha)+maskRGB[c]*maskAlpha;
    out[o+c]=Math.round(veiled*(1-visibleLightAlpha)+lights[i+c]*visibleLightAlpha);
    if (el>=0 && out[o+c]!==terrain[i+c]) dayMismatchCount++;
  }
}
if (originalMismatchCount || dayMismatchCount || hash(terrain)!==terrainBefore || hash(lights)!==lightsBefore)
  throw Error('Locked-source verification failed');
mkdirSync(`${root}/deliverables`,{recursive:true});
mkdirSync('work/day-night',{recursive:true});
const path = `${root}/deliverables/${name}.png`;
await sharp(out,{raw:{width:WIDTH,height:HEIGHT,channels:3}})
  .withIccProfile('srgb').png({compressionLevel:9}).toFile(path);
await sharp(mask,{raw:{width:WIDTH,height:HEIGHT,channels:4}})
  .png({compressionLevel:9}).toFile(`work/day-night/${name}-layer.png`);
await sharp(path).resize({width:707}).png().toFile(`work/day-night/${name}-inspection.png`);
const report = {path, dimensions:[WIDTH,HEIGHT], approvedCompositeSha256:expectedCompositeHash,
  approvedCompositeReconstructionMismatches:originalMismatchCount,dayPixelMismatches:dayMismatchCount,
  sourceBuffersUnchanged:true,terrainGrade:false,dayOceanFill:false,imageBlur:false,
  mask:{rgb:maskRGB,opacity,transitionSolarElevation:[0,-feather],placement:'under approved lights; night only'},
  lights:'original approved RGB/alpha, alpha gated by night visibility only',
  sun,pose:'illustration, not current time',published:false};
writeFileSync(`work/day-night/${name}-report.json`,JSON.stringify(report,null,2));
reports.push(report);
}
console.log(JSON.stringify(reports));
