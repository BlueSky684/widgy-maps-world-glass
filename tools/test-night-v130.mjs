import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import sharp from 'sharp';
import {renderHomeMap,solarPosition,solarElevation,project,WIDTH,HEIGHT} from '../lib/home-map-v130.js';
import {renderHomeMap as oldRender} from '../lib/home-map-v129.js';
import handler from '../api/home-map.js';
const read=p=>fs.readFileSync(p,'utf8');
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const meta=JSON.parse(read('assets/earth/night-provenance-v130.json'));
assert.equal(sha('assets/earth/reference-base-v127.png'),meta.terrainSha256);
assert.equal(sha('assets/earth/night-signal-v130.bin.gz'),meta.newSignalSha256);
// Independent renderer controls: remove emission from both old and new,
// and use the original air projection. Every backdrop pixel must match.
const paths=[];
function control(version,edit) {
 const path=`work/map/control-v${version}.mjs`;paths.push(path);
 const source=edit(read(`lib/home-map-v${version}.js`))
   .replaceAll("from './home-map-v122.js'","from '../../lib/home-map-v122.js'")
   .replaceAll('../assets/earth/','../../assets/earth/');
 fs.writeFileSync(path,source);
 return import(new URL(`../${path}`,import.meta.url));
}
try {
 const oldControl=await control(129,s=>s.replace('const city=(lights[i+k]*1.02+glow[i+k]*.28)*night;','const city=0;'));
 const newControl=await control(130,s=>s.replace('cores[p]=response*smooth(6,20,luma);','cores[p]=0;').replace('air-coordinates-v130.bin.gz','reference-coordinates-v127.bin.gz'));
 const darkControl=await (async()=>{
   const path='work/map/control-dark-v130.mjs';paths.push(path);
   fs.writeFileSync(path,read('lib/home-map-v130.js').replace('cores[p]=response*smooth(6,20,luma);','cores[p]=0;')
    .replaceAll("from './home-map-v122.js'","from '../../lib/home-map-v122.js'").replaceAll('../assets/earth/','../../assets/earth/'));
   return import(new URL(`../${path}`,import.meta.url));
 })();
 const rgb=async png=>sharp(png).removeAlpha().raw().toBuffer();
 const frames=new Map(),controls=new Map(),terrainChecks=[];
 for(const timestamp of ['2026-09-22T03:10:00Z','2026-09-22T18:10:00Z','2026-06-21T12:00:00Z','2026-12-21T12:00:00Z']) {
  const date=new Date(timestamp);
  const [a,b]=await Promise.all([oldControl.renderHomeMap({date}),newControl.renderHomeMap({date})]);
  assert.deepEqual(a,b,`v129 terrain/backdrop changed at ${timestamp}`);
  terrainChecks.push(timestamp);
  const png=await renderHomeMap({date});
  frames.set(timestamp,await rgb(png));
  controls.set(timestamp,await rgb(await darkControl.renderHomeMap({date})));
  const rgba=await sharp(png).ensureAlpha().raw().toBuffer();
  assert.equal(rgba.length,WIDTH*HEIGHT*4);assert.equal(rgba[3],0);
 }
 // Source registration is illustrative. Broad neighbourhoods verify actual
 // visible emission, not just the sign of a solar formula.
 const observations=[];
 for(const [name,lat,lon,x,y,nightTime,dayTime] of [
  ['New York',40.7,-74,540,233,'03:10','18:10'],
  ['Tokyo',35.68,139.69,1545,267,'18:10','03:10'],
  ['Sydney',-33.87,151.21,1597,670,'18:10','03:10'],
  ['Delhi',28.61,77.21,1240,287,'18:10','03:10']]) {
  function emitted(time){
    const key=`2026-09-22T${time}:00Z`,im=frames.get(key),dark=controls.get(key);
    let max=0,sum=0;
    for(let dy=-12;dy<=12;dy++)for(let dx=-12;dx<=12;dx++){
      const i=((y+dy)*WIDTH+x+dx)*3;
      max=Math.max(max,im[i]-dark[i]);sum+=im[i]-dark[i];
    }
    return {max,sum};
  }
  const night=emitted(nightTime),day=emitted(dayTime);
  assert(night.max>90,`${name} missing a luminous centre: ${night.max}`);
  assert.equal(day.sum,0,`${name} lights leaked into daylight`);
  observations.push({name,nightPeak:night.max,dayEmission:day.sum});
 }
 const old=await rgb(await oldRender({date:new Date('2026-09-22T18:10:00Z')}));
 const latest=frames.get('2026-09-22T18:10:00Z');
 const whitePixels=im=>{let n=0;for(let i=0;i<im.length;i+=3)if(im[i]>225&&im[i+1]>205&&im[i+2]>170)n++;return n;};
 assert(whitePixels(latest)<whitePixels(old)*.25,'Broad white hotspots remain');
 // Decorative right-edge dawn arc should not inherit the mesh's y=457 kink.
 function field(name){return gunzipSync(fs.readFileSync(`assets/earth/${name}`));}
 function contour(bytes){
   const sun=solarPosition(new Date('2026-09-22T18:10:00Z')),out=[];
   for(let y=0;y<HEIGHT;y++){
    let lon=0,lat=0,prev=null,cross=null;
    for(let x=0;x<WIDTH;x++){
     const i=(y*WIDTH+x)*4;lon+=bytes.readInt16LE(i);lat+=bytes.readInt16LE(i+2);
     const e=solarElevation(lat/100,lon/100,sun);
     if(x>WIDTH*.85&&prev<0&&e>=0)cross=x-1-prev/(e-prev);
     prev=e;
    }
    out.push(cross);
   }
   return out;
 }
 const oldArc=contour(field('reference-coordinates-v127.bin.gz'));
 const newArc=contour(field('air-coordinates-v130.bin.gz'));
 const kink=arc=>Math.abs((arc[477]-arc[457])/20-(arc[457]-arc[437])/20);
 assert(kink(newArc)<kink(oldArc)*.4,'Right horizon kink not smoothed');
 // Route correctness, real server UTC and no shared caching.
 let body;const headers={};const res={setHeader:(k,v)=>headers[k]=v,status:()=>res,send:b=>body=b,json:e=>{throw Error(JSON.stringify(e));}};
 const begin=Date.now();await handler({url:'/?v=130&t=0&date=2000-01-01',method:'GET',headers:{}},res);
 assert.equal(headers['X-Map-Revision'],'130');assert.match(headers['Cache-Control'],/no-store/);
 assert(new Date(headers['X-Map-Rendered-At']).getTime()>=begin);
 assert.deepEqual(body,await renderHomeMap({date:new Date(headers['X-Map-Rendered-At'])}));
 const result={passed:true,terrainPixelEquality:terrainChecks,cities:observations,whitePixels:{v129:whitePixels(old),v130:whitePixels(latest)},rightHorizonKink:{v129:kink(oldArc),v130:kink(newArc)},route130:true,serverUTC:true};
 fs.writeFileSync('work/map/v130-validation.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result));
} finally {for(const p of paths)fs.rmSync(p,{force:true});}
