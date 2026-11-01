// Remove only the obsolete summary underline from the code-generated chrome.
// Preserve every other pixel, including the approved weather/activity spacing.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import sharp from 'sharp';

const original=await sharp(new URL('../assets/navigation-soft-glow/home-balanced-activity.png',import.meta.url).pathname)
  .ensureAlpha().raw().toBuffer({resolveWithObject:true});
const source=readFileSync(new URL('../assets/home-glass/Home_Glass_Chrome_R4.svg',import.meta.url),'utf8');
const line='<path d="M55 588H540" stroke="#566470" stroke-opacity=".55" stroke-width="1.4"/>';
assert.equal(source.split(line).length,2);
const {width,height}=original.info;
const render=svg=>sharp(Buffer.from(svg)).resize(width,height).ensureAlpha().raw().toBuffer();
const before=await render(source),after=await render(source.replace(line,''));
const output=Buffer.from(original.data);
let changed=0;
for(let p=0;p<before.length;p+=4){
  if(before.subarray(p,p+4).equals(after.subarray(p,p+4)))continue;
  const x=(p/4)%width,y=Math.floor(p/4/width);
  assert(x>=53*width/1135 && x<=542*width/1135 && y>=586*height/1184 && y<=590*height/1184);
  assert(before.subarray(p,p+4).equals(original.data.subarray(p,p+4)),'Original vector matches the underline');
  assert(after[p+3]<=before[p+3],'Removing a stroke must not add opacity');
  after.copy(output,p,p,p+4);changed++;
}
assert(changed>0);
const png=await sharp(output,{raw:original.info}).png({compressionLevel:9}).toBuffer();
assert((await sharp(png).ensureAlpha().raw().toBuffer()).equals(output));
writeFileSync(new URL('../assets/navigation-soft-glow/home-compact-agenda.png',import.meta.url),png);
console.log(JSON.stringify({changedPixels:changed,width,height,otherPixelsIdentical:true,onlyUnderlineRemoved:true}));
