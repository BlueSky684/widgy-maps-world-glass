import sharp from 'sharp';
import assert from 'node:assert/strict';
const {data,info}=await sharp('assets/home-glass/Home_Glass_Chrome_C8.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
assert.equal(info.width,1320);assert.equal(info.height,1377);
const before=await sharp('assets/home-glass/Home_Weather_Card_Addback_1.png').raw().toBuffer();
const out=Buffer.from(before);
// Original fitness card x577 y808 w535 h221, with antialias margin.
const x0=Math.floor(575*1320/1135),x1=Math.ceil(1114*1320/1135),y0=Math.floor(806*1377/1184),y1=Math.ceil(1031*1377/1184);
for(let y=y0;y<y1;y++)data.copy(out,(y*info.width+x0)*4,(y*info.width+x0)*4,(y*info.width+x1)*4);
const target='assets/home-glass/Home_Weather_Fitness_Cards_Addback_1.png';await sharp(out,{raw:info}).png().toFile(target);
const check=await sharp(target).raw().toBuffer();assert.deepEqual(check,out);
for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(x<x0||x>=x1||y<y0||y>=y1){const p=(y*info.width+x)*4;assert.equal(check.readUInt32LE(p),before.readUInt32LE(p));}
console.log(JSON.stringify({target,exactOriginalFitnessPixels:true,allOtherPixelsUnchanged:true,region:[x0,y0,x1,y1]}));
