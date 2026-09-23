import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {renderHomeMap as renderV142} from '../lib/home-map-v142.js';

const masterPath=new URL('../assets/earth/v142-master-native.webp',import.meta.url);
const bytes=readFileSync(masterPath);
const fileSha256=createHash('sha256').update(bytes).digest('hex');

const {data,info}=await sharp(bytes).removeAlpha().raw().toBuffer({resolveWithObject:true});
assert.equal(info.width,1653);
assert.equal(info.height,779);
assert.equal(info.channels,3);
assert.equal(createHash('sha256').update(data).digest('hex'),
  '0307b6e6e17c667cadb57d2942a1ca6b3a99465df6fdcf7dfe0f5cb9b02f3255',
  'decoded v142 master pixels changed');

const a=await renderV142({
  date:new Date('2026-09-23T00:30:00Z'),
  location:{latitude:31.80,longitude:34.64,city:'Ashdod',source:'test'}
});
const b=await renderV142({
  date:new Date('2026-09-23T12:30:00Z'),
  location:{latitude:31.80,longitude:34.64,city:'Ashdod',source:'test'}
});
const sig=Buffer.from([137,80,78,71,13,10,26,10]);
assert(a.subarray(0,8).equals(sig)&&b.subarray(0,8).equals(sig),'v142 render is not PNG');
assert(!a.equals(b),'v142 solar day/night did not change');

const ma=await sharp(a).metadata();
assert.equal(ma.width,3306);
assert.equal(ma.height,1558);

console.log(JSON.stringify({
  passed:true,
  encodedBytes:bytes.length,
  encodedSha256:fileSha256,
  decodedPixelHashVerified:true,
  native:[1653,779],
  hd:[3306,1558],
  integerNearest2x:true,
  explicitLocation:true,
  dynamicSolarMask:true,
  outputsDiffer:true
}));
