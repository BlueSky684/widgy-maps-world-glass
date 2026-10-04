// Reproducible public diagnostic fixture, built once during deployment.
// Approved renderer/assets only; no user location, network or calendar data.
import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {renderHomeMap} from '../lib/home-map-day-night.js';

const png=await renderHomeMap({
  date:new Date('2026-10-04T06:00:00.000Z'),location:null,
  width:3306,presentation:'glass',atlas:'r6'
});
const directory=new URL('../assets/diagnostics/',import.meta.url);
mkdirSync(directory,{recursive:true});
writeFileSync(new URL('Home_Map_Static_3306x1558.png',directory),png);
console.log(JSON.stringify({staticMapDiagnostic:true,bytes:png.length,
  sha256:createHash('sha256').update(png).digest('hex')}));

// User-approved resolution diagnostic only. Derive from the exact full-size
// static control, preserving its time, artwork, framing and color profile.
// PNG compression is lossless; the resize itself deliberately removes detail.
const small=await sharp(png).resize({width:1653,height:779,kernel:'lanczos3'})
  .withIccProfile('srgb').png({compressionLevel:6}).toBuffer();
writeFileSync(new URL('Home_Map_Static_1653x779.png',directory),small);
console.log(JSON.stringify({staticMapResolutionDiagnostic:true,width:1653,height:779,bytes:small.length,
  sha256:createHash('sha256').update(small).digest('hex')}));
