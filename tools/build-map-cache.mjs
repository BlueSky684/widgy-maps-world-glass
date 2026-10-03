// Run during deployment, never on a phone request. Only approved public map
// pixels are included; this file contains no location or calendar information.
import {rmSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {PRECOMPUTED_PATH,precomputedKey} from '../lib/map-precomputed.js';
rmSync(PRECOMPUTED_PATH,{force:true});
const {getTextures,getEngraving}=await import('../lib/home-map-day-night.js');
const textures=getTextures(),engraving=getEngraving('r6');
const packed=Buffer.concat([precomputedKey(),textures.terrain,textures.lights,
  Buffer.from(engraving.ocean),engraving.rgb]);
const compressed=gzipSync(packed,{level:6});
writeFileSync(PRECOMPUTED_PATH,compressed);
console.log(JSON.stringify({mapPrecomputed:true,compressedBytes:compressed.length,rawBytes:packed.length}));
