import sharp from 'sharp';
import {writeFileSync, mkdirSync} from 'node:fs';
import {getTextures, WIDTH, HEIGHT, pixelCoordinates, solarElevation} from '../lib/home-map-day-night.js';

// Visual comparison pose, NOT the current solar position. Native approved
// rasters remain pixel-aligned. Optional preview grading is applied only to
// terrain; approved light RGB/alpha never receive that grade. No image blur.
const sun = {latitude: 20, longitude: -165};
const shadowOpacity = 0.22;
const {terrain, lights} = getTextures(); // checks approved SHA256 + dimensions
const showDayOcean = process.argv.includes('--day-ocean');
const slateGrade = process.argv.includes('--slate');
const saturation = slateGrade ? 0.45 : 1;
const dayOcean = [22, 35, 52];
// Only pure-black exterior-connected source pixels are treated as ocean.
// Do not paint dark land pixels or infer new coastlines from a foreign mask.
const ocean = new Uint8Array(WIDTH*HEIGHT);
if (showDayOcean) {
  const queue = new Uint32Array(WIDTH*HEIGHT);
  let head = 0, tail = 0;
  const visit = p => {
    const i = p*4;
    if (!ocean[p] && terrain[i] === 0 && terrain[i+1] === 0 && terrain[i+2] === 0) {
      ocean[p] = 1; queue[tail++] = p;
    }
  };
  for (let x = 0; x < WIDTH; x++) {visit(x); visit((HEIGHT-1)*WIDTH+x);}
  for (let y = 0; y < HEIGHT; y++) {visit(y*WIDTH); visit(y*WIDTH+WIDTH-1);}
  while (head < tail) {
    const p = queue[head++], x = p%WIDTH;
    if (x > 0) visit(p-1);
    if (x < WIDTH-1) visit(p+1);
    if (p >= WIDTH) visit(p-WIDTH);
    if (p < WIDTH*(HEIGHT-1)) visit(p+WIDTH);
  }
}
const output = Buffer.alloc(WIDTH * HEIGHT * 3);
let dayPixels = 0, dayMismatches = 0, nonOceanMismatches = 0, oceanPixels = 0;
for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
  const {latitude, longitude} = pixelCoordinates(x, y);
  const el = solarElevation(latitude, longitude, sun);
  const t = Math.max(0, Math.min(1, -el / 6));
  const night = t*t*(3-2*t);
  const i = (y*WIDTH+x)*4, o = (y*WIDTH+x)*3;
  const alpha = lights[i+3]/255*night;
  const isOcean = ocean[y*WIDTH+x] === 1;
  const luminance = 0.2126*terrain[i]+0.7152*terrain[i+1]+0.0722*terrain[i+2];
  for (let c = 0; c < 3; c++) {
    const gradedTerrain = luminance+(terrain[i+c]-luminance)*saturation;
    const shadedTerrain = gradedTerrain*(1-shadowOpacity*night);
    const base = isOcean ? dayOcean[c]*(1-night) : shadedTerrain;
    output[o+c] = Math.round(base*(1-alpha)+lights[i+c]*alpha);
    if (!isOcean && output[o+c] !== Math.round(shadedTerrain*(1-alpha)+lights[i+c]*alpha)) nonOceanMismatches++;
    if (!isOcean && el >= 0 && output[o+c] !== Math.round(gradedTerrain)) dayMismatches++;
  }
  if (el >= 0) dayPixels++;
  if (isOcean) oceanPixels++;
}
if (dayMismatches || nonOceanMismatches) throw Error('Non-ocean pixels changed');
const dir = '/workspace/scratch/3fac4a755ada/deliverables';
mkdirSync(dir, {recursive:true});
const name = slateGrade ? 'World_Map_Slate_Masters_Preview' : showDayOcean ? 'World_Map_Day_Ocean_Preview' : 'World_Map_Approved_Masters_Preview';
const path = `${dir}/${name}.png`;
await sharp(output, {raw:{width:WIDTH,height:HEIGHT,channels:3}})
  .withIccProfile('srgb').png({compressionLevel:9}).toFile(path);
await sharp(path).resize({width:707}).png().toFile(`work/day-night/${name}-inspection.png`);
const report = {path,width:WIDTH,height:HEIGHT,sourceHashesVerified:true,
  mode:'illustrative solar pose, not current time',sun,shadowOpacity,
  lights:'approved RGB and original alpha; alpha gated only by night mask',
  dayPixels,dayMismatches,nonOceanMismatches,oceanPixels,
  dayOcean:showDayOcean ? dayOcean : null,terrainSaturation:saturation,
  sourceAssetsModified:false,published:false};
writeFileSync(`work/day-night/${name}-report.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
