// Research only: no route, widget export, masters, or cache policy is changed.
// Uses approved pixels and synthetic dates/locations; no network requests.
// Run: node tools/benchmark-map-refresh-architecture.mjs > report.json
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {PNG} from 'pngjs';
import {getTextures, renderHomeMap, WIDTH, HEIGHT} from '../lib/home-map-day-night.js';
import {precomputedState} from '../lib/map-precomputed.js';

const raw = {width: WIDTH, height: HEIGHT, channels: 4};
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const ms = start => +(performance.now() - start).toFixed(2);
const encode = data => sharp(data, {raw}).withIccProfile('srgb')
  .png({compressionLevel: 6}).toBuffer();
const decode = png => PNG.sync.read(png).data;
function differences(a, b) {
  assert.equal(a.length, b.length);
  let pixels = 0, channels = 0, max = 0, absolute = 0;
  for (let i = 0; i < a.length; i += 4) {
    let changed = false;
    for (let c = 0; c < 4; c++) {
      const d = Math.abs(a[i+c] - b[i+c]);
      if (d) {changed = true; channels++; max = Math.max(max, d); absolute += d;}
    }
    if (changed) pixels++;
  }
  return {pixels, channels, maxChannelDifference: max, meanAbsoluteChannelDifference: absolute/a.length};
}
const clip = Buffer.from(`<svg width="${WIDTH}" height="${HEIGHT}"><rect width="${WIDTH}" height="${HEIGHT}" rx="80" fill="white"/></svg>`);
const started = performance.now();
// Use exactly the renderer's clipping and color conversion for the base.
const clipped = await sharp(getTextures().terrain, {raw})
  .composite([{input: clip, blend: 'dest-in'}]).raw().toBuffer();
const base = decode(await encode(clipped));
// Source-over cannot preserve a partially transparent edge if both layers
// contribute alpha. Delegate every such pixel to the dynamic overlay.
let edgePixels = 0;
for (let i = 0; i < base.length; i += 4) if (base[i+3] !== 255) {
  base.fill(0, i, i+4); edgePixels++;
}
const basePNG = await encode(base);
assert(decode(basePNG).equals(base), 'base PNG round-trip');
const prepareBaseMs = ms(started);

function replacementOverlay(target) {
  const out = Buffer.alloc(target.length);
  let occupiedPixels = 0;
  for (let i = 0; i < target.length; i += 4) {
    if (base[i+3] === 0 || !target.subarray(i, i+4).equals(base.subarray(i, i+4))) {
      target.copy(out, i, i, i+4);
      if (target[i+3]) occupiedPixels++;
    }
  }
  return {out, occupiedPixels};
}
const cases = [
  {id:'october-evening', at:'2026-10-05T20:00:00Z', location:null},
  {id:'october-morning', at:'2026-10-05T06:00:00Z', location:null},
  {id:'march-equinox', at:'2026-03-20T12:00:00Z', location:null},
  {id:'june-solstice', at:'2026-06-21T00:00:00Z', location:null},
  {id:'december-solstice', at:'2026-12-21T12:00:00Z', location:null},
  {id:'synthetic-zero-marker', at:'2026-10-05T20:00:00Z', location:{latitude:0,longitude:0,source:'coordinates'}},
  {id:'synthetic-edge-label', at:'2026-06-21T00:00:00Z', location:{latitude:85,longitude:-180,city:'Synthetic',source:'coordinates'}}
];
const results = [];
for (const c of cases) {
  const options = {date:new Date(c.at), location:c.location, atlas:'r6', presentation:'glass'};
  let start = performance.now();
  const fullPNG = await renderHomeMap(options);
  const renderMs = ms(start), target = decode(fullPNG);
  start = performance.now();
  const {out, occupiedPixels} = replacementOverlay(target);
  const makeOverlayMs = ms(start);
  start = performance.now();
  const overlayPNG = await encode(out);
  const overlayEncodeMs = ms(start);
  assert(decode(overlayPNG).equals(out), 'overlay PNG round-trip');
  const combined = await sharp(base, {raw}).composite([{input:out,raw}]).raw().toBuffer();
  const fullResolution = differences(combined, target);
  // Retain failures as findings: native compositing can round partially
  // transparent edge colors even when the mathematical split is exact.
  // Actual Widgy/CoreGraphics sampling is unobserved. These are explicit local
  // models of per-layer sampling, not a claim of matching the iPhone pipeline.
  const sampling = [];
  for (const width of [1102, 367]) {
    const a = await sharp(base, {raw}).resize({width}).raw().toBuffer({resolveWithObject:true});
    const b = await sharp(out, {raw}).resize({width}).raw().toBuffer();
    const smallRaw = {width:a.info.width,height:a.info.height,channels:4};
    const apart = await sharp(a.data,{raw:smallRaw}).composite([{input:b,raw:smallRaw}]).raw().toBuffer();
    const together = await sharp(target,{raw}).resize({width}).raw().toBuffer();
    sampling.push({width,height:a.info.height,...differences(apart,together)});
  }
  const next = decode(await renderHomeMap({...options,date:new Date(options.date.getTime()+60000)}));
  const minuteChanges = differences(target,next);
  results.push({id:c.id,at:c.at,syntheticLocation:c.location,renderMs,fullPNGBytes:fullPNG.length,
    fullSHA256:hash(fullPNG),overlayPNGBytes:overlayPNG.length,overlaySHA256:hash(overlayPNG),
    changedOverlayPixels:occupiedPixels,recurringByteReductionPercent:+(100*(1-overlayPNG.length/fullPNG.length)).toFixed(2),
    makeOverlayMs,overlayEncodeMs,fullResolution,fullResolutionPass:fullResolution.pixels===0,sampling,minuteChanges});
  process.stderr.write(`${c.id}: ${fullPNG.length} -> ${overlayPNG.length} bytes; full parity ${fullResolution.pixels}; sampled differences ${sampling.map(s=>s.pixels).join('/')}\n`);
}
console.log(JSON.stringify({schema:1,kind:'offline-research-not-device-test',baseline:'f56c6cdc5688e4bb48bae8c6c3e50676e0412be2',
  dimensions:[WIDTH,HEIGHT],versions:{node:process.version,sharp:sharp.versions.sharp,vips:sharp.versions.vips},
  precomputedState:precomputedState(),basePNGBytes:basePNG.length,baseSHA256:hash(basePNG),edgePixels,prepareBaseMs,
  decodedRGBABytes:{single:WIDTH*HEIGHT*4,twoLayers:WIDTH*HEIGHT*4*2},
  caveats:['Full-size pixel parity does not prove parity after independent native layer sampling.',
    'RGBA buffer counts are theoretical, not measured Widgy memory.',
    'The overlay prototype first renders the full image; timings are not optimized endpoint timings.',
    'Splitting images does not provide a background update or atomic snapshot commit API.',
    'All benchmark locations and times are synthetic. No device data or live geocoder calls.'],results},null,2));
