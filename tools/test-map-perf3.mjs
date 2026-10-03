// From a git checkout, prepare the approved baseline once:
// git show 65576a061252747ef12cb72b832f81e9b4a2189d:lib/home-map-day-night.js > lib/perf3-map-baseline.js
// node tools/test-map-perf3.mjs
// Do not commit that temporary baseline file.
import assert from 'node:assert/strict';
import sharp from 'sharp';
import * as old from '../lib/perf3-map-baseline.js';
import * as fast from '../lib/home-map-day-night.js';

const results=[];
for(const atlas of ['r6','f50']){
  for(const sun of [
    {latitude:0,longitude:0},
    {latitude:23.44,longitude:179.9},
    {latitude:-23.44,longitude:-179.9},
    {latitude:-4.16,longitude:-114.3}
  ]){
    const start=performance.now(),before=old.renderPixelsForSun(sun,atlas).data;
    const middle=performance.now(),after=fast.renderPixelsForSun(sun,atlas).data;
    assert.deepEqual(after,before,'The approved day/night pixels must stay exact');
    results.push({atlas,sun,beforeMs:Math.round(middle-start),afterMs:Math.round(performance.now()-middle)});
  }
}
const base={date:new Date('2026-10-03T19:36:00Z'),
  location:{latitude:31.7,longitude:34.6,city:'Ashkelon'},
  presentation:'glass',atlas:'r6',width:3306};
for(const input of [base,{...base,width:1653,location:null},
  {...base,atlas:'f50',presentation:'default',width:1102,diagnostic:true}]){
  const start=performance.now(),before=await old.renderHomeMap(input);
  const middle=performance.now(),after=await fast.renderHomeMap(input),end=performance.now();
  assert.deepEqual(await sharp(after).raw().toBuffer(),await sharp(before).raw().toBuffer());
  const [a,b]=await Promise.all([sharp(before).metadata(),sharp(after).metadata()]);
  for(const key of ['width','height','space','channels','hasAlpha','icc'])assert.deepEqual(b[key],a[key]);
  results.push({width:input.width,beforeMs:Math.round(middle-start),afterMs:Math.round(end-middle),
    beforeBytes:before.length,afterBytes:after.length,identicalPixels:true});
}
console.log(JSON.stringify({passed:true,results,deviceTimingNotMeasured:true},null,2));
