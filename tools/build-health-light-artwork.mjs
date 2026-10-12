// Re-render the approved clean Health artwork at the Home/Calendar pixel size.
// This changes raster resolution only; native values and the map are separate.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {healthScene} from './health-design.js';

const source = 'assets/health-premium/chrome-h1-clean.png';
const target = 'assets/health-premium/chrome-h1-clean-1320.png';
const qa = 'work/health-memory-15';
fs.mkdirSync(qa, {recursive:true});
const original = fs.readFileSync(source);
const scene = healthScene(null, {highlightToday:false});
const rebuilt = await sharp(Buffer.from(scene.svg)).png({compressionLevel:9}).toBuffer();
assert(original.equals(rebuilt), 'Approved clean artwork has changed; inspect before rebuilding');
assert(!scene.svg.includes('fill="#bfff09" fill-opacity=".045"'), 'Today row highlight must stay removed');
// Change the root raster size, retaining every original vector and viewBox.
const svg = scene.svg.replace('width="2270" height="2368"', 'width="1320" height="1377"');
assert.notEqual(svg, scene.svg);
assert.equal(svg.replace('width="1320" height="1377"', 'width="2270" height="2368"'), scene.svg);
const output = await sharp(Buffer.from(svg)).png({compressionLevel:9}).toBuffer();
const before = await sharp(original).metadata(), after = await sharp(output).metadata();
assert.equal(after.width,1320); assert.equal(after.height,1377); assert.equal(after.channels,4);
fs.writeFileSync(target,output);
const metrics = [];
for (const width of [606,1135]) {
  const height = Math.round(width*1184/1135);
  const a = await sharp(original).resize(width,height,{fit:'fill'}).flatten({background:'#0b1119'}).raw().toBuffer();
  const b = await sharp(output).resize(width,height,{fit:'fill'}).flatten({background:'#0b1119'}).raw().toBuffer();
  let sum = 0, square = 0;
  for (let i=0;i<a.length;i++){const d=a[i]-b[i];sum+=Math.abs(d);square+=d*d;}
  metrics.push({width,height,meanAbsoluteChannelDifference:sum/a.length,psnr:10*Math.log10(255*255/(square/a.length))});
  await sharp(a,{raw:{width,height,channels:3}}).png().toFile(`${qa}/original-${width}.png`);
  await sharp(b,{raw:{width,height,channels:3}}).png().toFile(`${qa}/candidate-${width}.png`);
  await sharp({create:{width:width*2+20,height,channels:3,background:'#0b1119'}})
    .composite([{input:a,raw:{width,height,channels:3},left:0,top:0},{input:b,raw:{width,height,channels:3},left:width+20,top:0}])
    .png().toFile(`${qa}/comparison-${width}.png`);
}
const rgba = m=>m.width*m.height*4;
const report={source,target,sourcePNGBytes:original.length,targetPNGBytes:output.length,
  sourceSize:[before.width,before.height],targetSize:[after.width,after.height],
  sourceRGBAMiB:rgba(before)/1048576,targetRGBAMiB:rgba(after)/1048576,
  theoreticalRGBASavingMiB:(rgba(before)-rgba(after))/1048576,
  savingIsNotMeasuredWidgyRAM:true,vectorContentUnchanged:true,todayHighlightAbsent:true,
  sha256:createHash('sha256').update(output).digest('hex'),comparisons:metrics};
fs.writeFileSync(`${qa}/artwork-report.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
