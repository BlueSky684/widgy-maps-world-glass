// Add two independent diagnostic stamp plates to already-derived static maps.
// Outside the bottom114 rows, all3306x1558 RGB pixels remain exact.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {MASK_LIVE} from '../lib/map-mask-live.js';

const source=new URL('../assets/diagnostics/map-mask-compare-1/',import.meta.url);
const dir=new URL('../assets/diagnostics/map-mask-live-1/',import.meta.url);
mkdirSync(dir,{recursive:true});
const width=3306,height=1558,top=height*(MASK_LIVE.height-MASK_LIVE.bandRows)/MASK_LIVE.height;
assert(Number.isInteger(top));
const files={},manifest=JSON.parse(readFileSync(new URL('manifest.json',source)));
for(const part of ['day','night']){
  const input=readFileSync(new URL(part+'.png',source));
  assert.equal(createHash('sha256').update(input).digest('hex'),manifest.files[part+'.png'].sha256);
  const raw=await sharp(input).removeAlpha().raw().toBuffer(),original=Buffer.from(raw);
  for(let y=top;y<height;y++)for(let x=0;x<width;x++){
    const white=part==='day'?x<width/2:x>=width/2;
    for(let c=0;c<3;c++)raw[(y*width+x)*3+c]=white?255:0;
  }
  assert(raw.subarray(0,top*width*3).equals(original.subarray(0,top*width*3)));
  const png=await sharp(raw,{raw:{width,height,channels:3}}).withIccProfile('srgb').png({compressionLevel:6}).toBuffer();
  assert((await sharp(png).raw().toBuffer()).equals(raw));
  writeFileSync(new URL(part+'.png',dir),png);
  files[part+'.png']={width,height,bytes:png.length,sha256:createHash('sha256').update(png).digest('hex')};
}
const out={revision:'map-mask-live-1',mapDimensions:[width,height],maskDimensions:[MASK_LIVE.width,MASK_LIVE.height],
  stampBand:{top,height:height-top,left:'D = day mask time',right:'N = night mask time',timeZone:'Asia/Jerusalem'},files,
  note:'Temporary bitmap freshness diagnostic only. Exact comparison-derived map pixels above the stamp strip; no approved master modification. No location or real-time clock layer.'};
writeFileSync(new URL('manifest.json',dir),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out,null,2));
