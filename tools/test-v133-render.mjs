// signal revision a904cef2
import {writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
import {renderHomeMap} from '../lib/home-map-v133.js';
import handler from '../api/home-map.js';

const pngSignature=Buffer.from([137,80,78,71,13,10,26,10]);
const isPng=b=>Buffer.isBuffer(b)&&b.length>10000&&b.subarray(0,8).equals(pngSignature);

const night=await renderHomeMap({date:new Date('2026-09-23T00:30:00Z'),location:{latitude:31.6688,longitude:34.5743,city:'Ashkelon',source:'test'}});
const twelveHours=await renderHomeMap({date:new Date('2026-09-23T12:30:00Z'),location:{latitude:31.6688,longitude:34.5743,city:'Ashkelon',source:'test'}});
assert(isPng(night),'v133 fixed-time night render is not a PNG');
assert(isPng(twelveHours),'v133 fixed-time day render is not a PNG');
assert(!night.equals(twelveHours),'dynamic solar mask did not change across 12 hours');
mkdirSync('work/v133-preview',{recursive:true});
writeFileSync('work/v133-preview/ashkelon-night.png',night);
writeFileSync('work/v133-preview/ashkelon-day.png',twelveHours);

async function call(url){
  let body,statusCode=200;
  const headers={};
  const req={url,method:'GET',headers:{}};
  const res={
    setHeader:(k,v)=>{headers[k]=v;},
    status:n=>{statusCode=n;return res;},
    send:b=>{body=b;return res;},
    json:o=>{body=Buffer.from(JSON.stringify(o));return res;},
    end:()=>res
  };
  await handler(req,res);
  return {body,headers,statusCode};
}
const ash=await call('/?v=133&lat=31.6688&lon=34.5743&city=Ashkelon');
const nyc=await call('/?v=133&lat=40.7128&lon=-74.0060&city=New%20York');
assert.equal(ash.statusCode,200);
assert.equal(nyc.statusCode,200);
assert.equal(ash.headers['X-Map-Revision'],'133');
assert.equal(ash.headers['X-Map-Location-Source'],'coordinates');
assert(isPng(ash.body)&&isPng(nyc.body),'v133 API did not return PNGs');
assert(!ash.body.equals(nyc.body),'explicit global locations did not change the rendered map');

console.log(JSON.stringify({
  passed:true,
  fixedTimeDynamicMask:true,
  explicitLocationRouting:true,
  ashkelonBytes:ash.body.length,
  newYorkBytes:nyc.body.length,
  nightBytes:night.length,
  twelveHoursBytes:twelveHours.length
}));
