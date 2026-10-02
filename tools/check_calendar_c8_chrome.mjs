import {writeFileSync} from 'node:fs';
import sharp from 'sharp';
import assert from 'node:assert/strict';
const pairs=[['Home','../assets/home-glass/Home_Glass_Chrome_R4.png','../assets/home-glass/Home_Glass_Chrome_C8.png'],['Calendar','../assets/calendar-glass/Calendar_Glass_Chrome_C2.png','../assets/calendar-glass/Calendar_Glass_Chrome_C8.png']];
const results=[];
for(const [name,previous,current] of pairs){
 const width=1134,height=1182;
 // Transparent RGB is undefined. Composite over black before comparing the
 // visible pixels; comparing invisible RGB exaggerates resampling differences.
 const pixels=async p=>sharp(new URL(p,import.meta.url).pathname).resize(width,height).flatten({background:'#000'}).removeAlpha().raw().toBuffer();
 const a=await pixels(previous),b=await pixels(current);
 let abs=0,sq=0,max=0,over8=0;
 for(let i=0;i<a.length;i++){const d=Math.abs(a[i]-b[i]);abs+=d;sq+=d*d;max=Math.max(max,d);if(d>8)over8++;}
 const result={name,comparisonPixels:[width,height],background:'#000',meanAbsoluteChannelDifference:abs/a.length,PSNR:10*Math.log10(255**2/(sq/a.length)),maxDifference:max,channelsOver8Percent:over8/a.length*100};
 assert(result.meanAbsoluteChannelDifference<.3);assert(result.PSNR>48);
 const metadata=await sharp(new URL(current,import.meta.url).pathname).metadata();
 assert.deepEqual([metadata.width,metadata.height],[1320,1377]);assert.equal(metadata.space,'srgb');
 results.push(result);
}
writeFileSync(new URL('../assets/calendar-glass/Calendar_C8_Chrome_Check.json',import.meta.url),JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results));
