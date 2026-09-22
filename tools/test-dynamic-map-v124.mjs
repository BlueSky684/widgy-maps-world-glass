import assert from 'node:assert/strict';
import sharp from 'sharp';
import {readFileSync,writeFileSync} from 'node:fs';
import {renderHomeMap,project,solarPosition,solarElevation,WIDTH,HEIGHT} from '../lib/home-map-v124.js';
import {renderHomeMap as archiveV122} from '../lib/home-map-v122.js';
import handler from '../api/home-map.js';
import {allNodes} from './build-widgy-v110.mjs';

const images=new Map();
for(const hour of [3,9,15,21]) {
  const date=new Date(`2026-09-22T${String(hour).padStart(2,'0')}:00:00Z`);
  const png=await renderHomeMap({date});
  const raw=await sharp(png).ensureAlpha().raw().toBuffer();
  assert.equal(raw.length,WIDTH*HEIGHT*4);
  assert.equal(raw[3],0,'Rounded top-left corner must be transparent');
  images.set(hour,raw);
}
function patchPeak(raw,lat,lon,channel=0) {
  const {x,y}=project(lat,lon);let max=0;
  for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){
    const i=(Math.round(y+dy)*WIDTH+Math.round(x+dx))*4;
    max=Math.max(max,raw[i+channel]);
  }return max;
}
// Independent expected local-day fixtures around the September equinox.
// These compare actual image pixels, so a static image or inverted light mask fails.
const cities=[['New York',40.71,-74.01,3,15],['Sao Paulo',-23.55,-46.63,3,15],
  ['Tokyo',35.68,139.69,15,3],['London',51.51,-.13,3,15]];
const observed=[];
for(const [name,lat,lon,nightHour,dayHour] of cities) {
  const night=patchPeak(images.get(nightHour),lat,lon);
  const day=patchPeak(images.get(dayHour),lat,lon);
  assert(night>day+50,`${name}: urban lights must activate at night (${night} vs ${day})`);
  observed.push({city:name,nightRedPeak:night,dayRedPeak:day});
}
// The western Indian Ocean is near the horizon at 15 UTC, in daylight at 9 UTC.
// Its blue glow must move; checking ocean avoids confusing it with city lights.
const oceanDay=patchPeak(images.get(9),0,45,2),oceanHorizon=patchPeak(images.get(15),0,45,2);
assert(oceanHorizon>oceanDay+20,'Blue horizon glow must not be baked at a fixed longitude');
for(const [month,expected] of [['06',1],['12',-1]]) {
  const sun=solarPosition(new Date(`2026-${month}-21T12:00:00Z`));
  assert(Math.abs(sun.latitude-expected*23.44)<.1,'Solstice declination');
  assert(Math.sign(solarElevation(80,0,sun))===expected,'Polar day/night must follow the season');
}
assert.equal(project(90,0),null,'Out-of-frame coordinates must not be falsely pinned');

for(const rev of ['122','124']) {
  const headers={};let body;
  const res={setHeader:(k,v)=>headers[k]=v,status:()=>res,send:b=>body=b,json:e=>{throw Error(JSON.stringify(e));}};
  const begin=Date.now();
  await handler({url:`/?v=${rev}&t=0&date=2000-01-01`,method:'GET',headers:{}},res);
  const rendered=new Date(headers['X-Map-Rendered-At']);
  assert(rendered.getTime()>=begin&&rendered.getTime()<=Date.now(),'Server time must drive the map');
  assert.equal(headers['X-Map-Revision'],rev);
  assert.match(headers['Cache-Control'],/no-store/);
  assert.equal(headers['CDN-Cache-Control'],'no-store');
  assert.deepEqual(body,await (rev==='124'?renderHomeMap:archiveV122)({date:rendered}),`v${rev}: API renderer mismatch`);
}
const widget=JSON.parse(readFileSync('tools/widgy-v124.json','utf8'));
const map=allNodes(widget).find(n=>n.d0===6170);
assert.match(map['2'],/\/api\/home-map\?v=124$/);
assert.match(map['22'],/Date\.now\(\)/);
assert(!map['22'].includes('approved-map-v123.png'),'No static approved-map URL in native image source');
writeFileSync('work/map/v124-validation.json',JSON.stringify({passed:true,cities:observed,
  oceanBlue:{day:oceanDay,horizon:oceanHorizon},testedUtcHours:[3,9,15,21],
  serverTime:true,noStore:true,archiveV122:true,staticMapSource:false},null,2)+'\n');
console.log('PASS: actual city-light activation on both hemispheres, moving blue horizon, seasonal polar shading, current server time, cache headers, archived renderer and dynamic Widgy source');
