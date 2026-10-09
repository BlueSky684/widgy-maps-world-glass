import sharp from 'sharp';
import assert from 'node:assert/strict';
const path='assets/home-glass/Home_Glass_Chrome_C8.png';
const {data,info}=await sharp(path).ensureAlpha().raw().toBuffer({resolveWithObject:true});
assert.equal(info.width,1320);assert.equal(info.height,1377);
// Approved chrome SVG: card x23 y808 w535 h221. Include antialias margin.
const x0=Math.floor(21*1320/1135),x1=Math.ceil(560*1320/1135);
const y0=Math.floor(806*1377/1184),y1=Math.ceil(1031*1377/1184);
const out=Buffer.alloc(data.length);
for(let y=y0;y<y1;y++)data.copy(out,(y*info.width+x0)*4,(y*info.width+x0)*4,(y*info.width+x1)*4);
const target='assets/home-glass/Home_Weather_Card_Addback_1.png';
await sharp(out,{raw:info}).png().toFile(target);
const check=await sharp(target).raw().toBuffer();assert.deepEqual(check,out);
console.log(JSON.stringify({target,width:info.width,height:info.height,exactPixels:true,region:[x0,y0,x1,y1]}));
