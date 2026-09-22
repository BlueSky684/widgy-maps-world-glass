import assert from 'node:assert/strict';
import sharp from 'sharp';
import {renderHomeMap,project,solarPosition,solarElevation,daylightMix,WIDTH,HEIGHT} from '../lib/home-map.js';
import {solarPosition as oldSun,daylightMix as oldMix,renderHomeMap as renderV120} from '../lib/home-map-v120.js';
import handler from '../api/home-map.js';

// A global reprojection error can leave bright cities offshore even when the
// terminator math is correct. Require real urban signals at published city
// locations in both Americas and eastern Asia, not merely a non-empty texture.
const lights=await sharp('assets/earth/lights-v121.png').removeAlpha().raw().toBuffer();
function peak(lat,lon){
 const {x,y}=project(lat,lon);let max=0;
 for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){
  const i=(Math.round(y+dy)*WIDTH+Math.round(x+dx))*3;max=Math.max(max,lights[i]);
 }return max;
}
for(const [name,lat,lon] of [['New York',40.71,-74.01],['Los Angeles',34.05,-118.24],['Sao Paulo',-23.55,-46.63],['Buenos Aires',-34.6,-58.38],['Tokyo',35.68,139.69]]){
 assert(peak(lat,lon)>120,`${name}: lights must be geographically aligned`);
}
assert(peak(0,-140)<10,'Open Pacific should not have a city cluster');
for(const date of ['2026-03-20T12:00:00Z','2026-06-21T12:00:00Z','2026-09-22T10:57:00Z','2026-12-21T12:00:00Z']){
 assert.deepEqual(solarPosition(new Date(date)),oldSun(new Date(date)));
 for(const e of [-90,-12,-6,-3,0,3,6,12,90])assert.equal(daylightMix(e),oldMix(e));
}
const nightDate=new Date('2026-09-23T03:00:00Z'),dayDate=new Date('2026-09-22T15:00:00Z');
const sa={latitude:-23.55,longitude:-46.63};
assert(solarElevation(sa.latitude,sa.longitude,solarPosition(nightDate))<-6);
assert(solarElevation(sa.latitude,sa.longitude,solarPosition(dayDate))>6);
async function brightness(date){
 const rgb=await sharp(await renderHomeMap({date})).removeAlpha().raw().toBuffer();
 const {x,y}=project(sa.latitude,sa.longitude);let max=0;
 for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++)max=Math.max(max,rgb[(Math.round(y+dy)*WIDTH+Math.round(x+dx))*3]);
 return max;
}
assert(await brightness(nightDate)>await brightness(dayDate)+60,'Sao Paulo lights must activate at night');
// At a fixed instant a v120 request must still use its exact archived renderer.
for(const rev of ['120','121']){
 const h={};let body;
 const res={setHeader:(k,v)=>h[k]=v,status:()=>res,send:b=>body=b,json:e=>{throw Error(JSON.stringify(e));}};
 await handler({url:`/?v=${rev}`,method:'GET',headers:{}},res);
 assert.equal(h['X-Map-Revision'],rev);
 const fn=rev==='120'?renderV120:renderHomeMap;
 assert.deepEqual(body,await fn({date:new Date(h['X-Map-Rendered-At']),location:null}));
 const meta=await sharp(body).metadata();assert.deepEqual([meta.width,meta.height],[WIDTH,HEIGHT]);
}
console.log('PASS: geographically aligned cities, no Pacific city cluster, solar geometry preserved, South America night activation, archived v120 and new v121 API routing');
