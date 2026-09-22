import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import {gunzipSync} from 'node:zlib';
import {renderHomeMap,project,WIDTH,HEIGHT,solarPosition,solarElevation} from '../lib/home-map-v127.js';
import {renderHomeMap as renderV125} from '../lib/home-map-v125.js';
import handler from '../api/home-map.js';
import {allNodes} from './build-widgy-v110.mjs';

const mesh=JSON.parse(readFileSync('assets/earth/reference-mesh-v127.json'));
for(const [lon,lat,x,y] of mesh.points) {
  const p=project(lat,lon);assert(p&&Math.hypot(p.x-x,p.y-y)<1e-5,'Marker/mesh control mismatch');
}
const d=gunzipSync(readFileSync('assets/earth/reference-coordinates-v127.bin.gz'));
assert.equal(d.length,WIDTH*HEIGHT*4);
let lon=0,lat=0;
for(let i=0;i<WIDTH*HEIGHT;i++) {
  if(i%WIDTH===0){lon=0;lat=0;}
  lon+=d.readInt16LE(i*4);lat+=d.readInt16LE(i*4+2);
  assert(lon>=-18000&&lon<=18000&&lat>=-7500&&lat<=8500,'Coordinate field overflow');
}
const images=new Map();
for(const hour of [3,9,15,21]) {
  const date=new Date(`2026-09-22T${String(hour).padStart(2,'0')}:36:00Z`);
  const png=await renderHomeMap({date});
  const rgb=await sharp(png).ensureAlpha().raw().toBuffer();
  assert.equal(rgb[3],0,'Rounded frame transparency');
  images.set(hour,rgb);
}
// Broad landmark regions reflect this stylized atlas's calibration accuracy.
// Compare actual emission in opposite local-day fixtures, not just solar maths.
const observations=[];
for(const [name,lat,lon,nightHour,dayHour] of [
  ['New York',40.7,-74,3,15],['Sao Paulo',-23.55,-46.63,3,15],
  ['Tokyo',35.68,139.69,15,3],['London',51.51,-.13,3,15]]) {
  const p=project(lat,lon);
  function peak(hour) {
    const rgb=images.get(hour);let value=0;
    for(let dy=-22;dy<=22;dy++)for(let dx=-22;dx<=22;dx++)
      value=Math.max(value,rgb[(Math.round(p.y+dy)*WIDTH+Math.round(p.x+dx))*4]);
    return value;
  }
  const night=peak(nightHour),day=peak(dayHour);
  assert(night>day+50,`${name}: expected night emission, got ${night} vs ${day}`);
  observations.push({name,night,day});
}
for(const [month,sign] of [['06',1],['12',-1]]) {
  const sun=solarPosition(new Date(`2026-${month}-21T12:00:00Z`));
  assert(Math.abs(sun.latitude-sign*23.44)<.1);
  assert.equal(Math.sign(solarElevation(80,0,sun)),sign);
}
for(const rev of ['125','127']) {
  let body;const headers={};
  const res={setHeader:(k,v)=>headers[k]=v,status:()=>res,send:b=>body=b,json:e=>{throw Error(JSON.stringify(e));}};
  const begin=Date.now();
  await handler({url:`/?v=${rev}&t=0&date=2000-01-01`,method:'GET',headers:{}},res);
  const date=new Date(headers['X-Map-Rendered-At']);
  assert(date.getTime()>=begin&&date.getTime()<=Date.now());
  assert.equal(headers['X-Map-Revision'],rev);assert.match(headers['Cache-Control'],/no-store/);
  assert.deepEqual(body,await (rev==='127'?renderHomeMap:renderV125)({date}));
}
const widget=JSON.parse(readFileSync('tools/widgy-v127.json'));
const map=allNodes(widget).find(n=>n.d0===6170);
assert.match(map['2'],/\/api\/home-map\?v=127$/);assert.match(map['22'],/Date\.now\(\)/);
const source=readFileSync('lib/home-map-v127.js','utf8');
assert(!/(?:day|night|lights)-v121\.png|land-v122\.png|borders-v122\.png/.test(source),'Old base dependency');
console.log(JSON.stringify({passed:true,calibrationLandmarks:mesh.points.length,cities:observations,
  utcHours:[3,9,15,21],oldTerrainDependencies:false,nativeSource:'dynamic',archiveV125:true}));
