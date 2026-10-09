import assert from 'node:assert/strict';
import sharp from 'sharp';
import {crc32} from 'node:zlib';
import {tagRenderedMapSRGB} from '../lib/png-srgb-profile.js';

// Exhaust every possible 8-bit RGB triplet; alpha also spans all 256 values.
// Establish that the removed sRGB-to-sRGB operation is an identity for the
// internal raw samples, not an assumption based only on a visible screenshot.
const rgb=Buffer.allocUnsafe(4096*4096*4);
for(let i=0;i<4096*4096;i++){
 rgb[i*4]=i>>>16;rgb[i*4+1]=(i>>>8)&255;rgb[i*4+2]=i&255;rgb[i*4+3]=(i^(i>>>8)^(i>>>16))&255;
}
const converted=await sharp(rgb,{raw:{width:4096,height:4096,channels:4}}).withIccProfile('srgb').raw().toBuffer();
assert(converted.equals(rgb),'Every RGB colour and sampled alpha stays exact');
const input={raw:{width:256,height:256,channels:4}},sample=rgb.subarray(0,256*256*4);
const plain=await sharp(sample,input).png({compressionLevel:6}).toBuffer();
const original=await sharp(sample,input).withIccProfile('srgb').png({compressionLevel:6}).toBuffer();
const simultaneous=await Promise.all(Array.from({length:4},()=>tagRenderedMapSRGB(plain)));
for(const png of simultaneous){
 assert(png.equals(original),'Whole PNG, metadata and IDAT must stay exact');
 let profiles=0;
 for(let offset=8;offset<png.length;){
  const n=png.readUInt32BE(offset),type=png.toString('ascii',offset+4,offset+8);
  assert.equal(crc32(png.subarray(offset+4,offset+8+n)),png.readUInt32BE(offset+8+n));
  if(type==='iCCP')profiles++;offset+=n+12;
 }
 assert.equal(profiles,1);
}
await assert.rejects(tagRenderedMapSRGB(original),/Unexpected/);
await assert.rejects(tagRenderedMapSRGB(Buffer.from('not PNG')),/Expected/);
await assert.rejects(tagRenderedMapSRGB(plain.subarray(0,plain.length-1)),/Incomplete/);
console.log(JSON.stringify({pass:true,rgbTriplets:16777216,alphaValues:256,concurrentProfileCalls:4,wholePNGExact:true,allChunkCRCsValid:true,invalidOrAlreadyTaggedRejected:true}));
