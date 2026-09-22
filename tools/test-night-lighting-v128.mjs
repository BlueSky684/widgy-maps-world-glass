import assert from 'node:assert/strict';
import sharp from 'sharp';
import {renderHomeMap,project,WIDTH} from '../lib/home-map-v128.js';
import {renderHomeMap as previous} from '../lib/home-map-v127.js';
import handler from '../api/home-map.js';

const images=new Map();
const report=[];
for(const hour of [3,15]) {
 const date=new Date(`2026-09-22T${String(hour).padStart(2,'0')}:37:00Z`);
 const [before,after]=await Promise.all([previous({date}),renderHomeMap({date})].map(async p=>sharp(await p).ensureAlpha().raw().toBuffer()));
 images.set(hour,{before,after});
 const clipped=rgb=>{let n=0;for(let i=0;i<rgb.length;i+=4)if(rgb[i]>245&&rgb[i+1]>230&&rgb[i+2]>200)n++;return n;};
 const oldCount=clipped(before),newCount=clipped(after);
 assert(oldCount>0&&newCount<oldCount*.1,'White light bands must be reduced substantially');
 assert.equal(after[3],0);
 report.push({hour,whiteHotBefore:oldCount,whiteHotAfter:newCount});
}
for(const [name,lat,lon,nightHour,dayHour] of [
 ['New York',40.7,-74,3,15],['Tokyo',35.68,139.69,15,3]]) {
 const p=project(lat,lon);let nightWarmth=0,dayWarmth=0;
 for(let dy=-22;dy<=22;dy++)for(let dx=-22;dx<=22;dx++) {
  const i=(Math.round(p.y+dy)*WIDTH+Math.round(p.x+dx))*4;
  const day=images.get(dayHour),night=images.get(nightHour);
  assert.deepEqual(day.after.subarray(i,i+4),day.before.subarray(i,i+4),`${name}: daylight must remain unchanged`);
  nightWarmth=Math.max(nightWarmth,night.after[i]-night.after[i+2]);
  dayWarmth=Math.max(dayWarmth,day.after[i]-day.after[i+2]);
 }
 assert(nightWarmth>dayWarmth+40,`${name}: lights must still follow the night side`);
 report.push({city:name,nightWarmth,dayWarmth});
}
for(const rev of ['127','128']) {
 let body;const headers={};
 const res={setHeader:(k,v)=>headers[k]=v,status:()=>res,send:b=>body=b,json:e=>{throw Error(JSON.stringify(e));}};
 const begin=Date.now();
 await handler({url:`/?v=${rev}&t=0&date=2000-01-01`,method:'GET',headers:{}},res);
 const date=new Date(headers['X-Map-Rendered-At']);
 assert(date.getTime()>=begin&&date.getTime()<=Date.now());
 assert.equal(headers['X-Map-Revision'],rev);assert.match(headers['Cache-Control'],/no-store/);
 assert.deepEqual(body,await (rev==='128'?renderHomeMap:previous)({date}));
}
console.log(JSON.stringify({passed:true,archiveV127:true,serverTime:true,observations:report}));
