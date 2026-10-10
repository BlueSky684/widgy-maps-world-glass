import fs from 'node:fs';
import sharp from 'sharp';
import assert from 'node:assert/strict';
const source='assets/home-glass/Home_Glass_Chrome_C8.png';
const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const out=Buffer.from(data),sx=info.width/1135,sy=info.height/1184;
const areas=[64,1069].map(cx=>({left:Math.floor((cx-32)*sx),top:Math.floor(719*sy),right:Math.ceil((cx+32)*sx),bottom:Math.ceil(766*sy)}));
// Only the two ornament rectangles are patched. Restore the smooth glass
// beneath the previous sun by interpolating the clean edge pixels per row.
for(const a of areas)for(let y=a.top;y<a.bottom;y++)for(let x=a.left;x<a.right;x++){
 const t=(x-a.left)/(a.right-1-a.left),p=(y*info.width+x)*4;
 for(let c=0;c<4;c++)out[p+c]=Math.round(data[(y*info.width+a.left)*4+c]*(1-t)+data[(y*info.width+a.right-1)*4+c]*t);
}
const symbol=(cx,rise)=>`<g transform="translate(${cx} 749)" fill="#c5ff0a" stroke="#c5ff0a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M-12 3 A12 12 0 0 1 12 3Z" stroke="none"/><path d="M-27 12H27 M-23 1H-19 M23 1H19 M-15-15L-11-11 M15-15L11-11 ${rise?'M0-13V-24 M-5-19L0-24 5-19':'M0-24V-13 M-5-18L0-13 5-18'}" fill="none"/></g>`;
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${info.width}" height="${info.height}" viewBox="0 0 1135 1184">${symbol(64,true)}${symbol(1069,false)}</svg>`;
const composited=await sharp(out,{raw:info}).composite([{input:Buffer.from(svg)}]).raw().toBuffer();
const pixels=Buffer.from(data);
for(const a of areas)for(let y=a.top;y<a.bottom;y++)composited.copy(pixels,(y*info.width+a.left)*4,(y*info.width+a.left)*4,(y*info.width+a.right)*4);
const final=await sharp(pixels,{raw:info}).png().toBuffer();
let changed=0;
for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
 const p=(y*info.width+x)*4;
 if(pixels.readUInt32LE(p)!==data.readUInt32LE(p)){
  assert(areas.some(a=>x>=a.left&&x<a.right&&y>=a.top&&y<a.bottom),'Change outside solar icons');changed++;
 }
}
fs.writeFileSync('assets/home-glass/Home_Glass_Chrome_Solar_R10.png',final);
console.log(JSON.stringify({changedPixels:changed,onlySolarIcons:true,width:info.width,height:info.height}));
