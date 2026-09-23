import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import sharp from 'sharp';
import {renderHomeMap as renderV134} from '../lib/home-map-v134.js';
import {renderHomeMap as renderV135} from '../lib/home-map-v135.js';
import handler from '../api/home-map.js';

const pngSignature=Buffer.from([137,80,78,71,13,10,26,10]);
const isPng=b=>Buffer.isBuffer(b)&&b.length>10000&&b.subarray(0,8).equals(pngSignature);

const src=readFileSync(new URL('../lib/home-map-v135.js',import.meta.url),'utf8');
const provenance=JSON.parse(readFileSync(new URL('../assets/earth/night-provenance-v135.json',import.meta.url),'utf8'));
assert(src.includes("night-signal-v135.bin.gz"),'v135 must use the clean v135 signal');
assert(!src.includes("night-signal-v133.bin.gz"),'v135 must not reuse the v133 signal');
assert(src.includes("signal.readUInt16LE(p*2)/256"),'v135 signal scale mismatch');
assert(src.includes("cores[p]=236*Math.pow(energy/(energy+7.5),.74);"),'v135 tone curve mismatch');
assert(src.includes("const POINT=[1,.79,.46],NEAR=[1,.68,.28],FAR=[1,.56,.18];"),'v135 palette mismatch');
assert(src.includes("[.68,2.2]"),'v135 halo widths mismatch');
assert(src.includes("near[p]*.32"),'v135 micro-glow mismatch');
assert(src.includes("far[p]*.10"),'v135 far glow mismatch');
assert(src.includes("projectFromField"),'v135 dynamic marker projection missing');
assert.equal(provenance.version,135);
assert.equal(provenance.signalScale,256);
assert.equal(provenance.signalExtraction.regionalBoosts,false);
assert.equal(provenance.signalExtraction.bakedGlow,false);
assert.equal(provenance.signalExtraction.bakedColour,false);
assert.equal(provenance.signalExtraction.bakedDayNightMask,false);
assert(provenance.signalRange[1] > 100,'v135 wider hotspot range was not retained');

const loc={latitude:31.6688,longitude:34.5743,city:'Ashkelon',source:'test'};
const nightDate=new Date('2026-09-23T00:30:00Z');
const dayDate=new Date('2026-09-23T12:30:00Z');
const [oldNight,newNight,newDay]=await Promise.all([
  renderV134({date:nightDate,location:loc}),
  renderV135({date:nightDate,location:loc}),
  renderV135({date:dayDate,location:loc})
]);
assert(isPng(newNight)&&isPng(newDay),'v135 render is not PNG');
assert(!newNight.equals(newDay),'v135 dynamic solar mask did not change');
assert(!newNight.equals(oldNight),'v135 clean rebuild did not change rendered output');

async function stats(buffer){
  const {data,info}=await sharp(buffer).removeAlpha().raw().toBuffer({resolveWithObject:true});
  let sum=0,sum2=0;
  for(let i=0;i<data.length;i+=3){
    const y=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];
    sum+=y; sum2+=y*y;
  }
  const n=info.width*info.height;
  const mean=sum/n,sd=Math.sqrt(Math.max(0,sum2/n-mean*mean));
  return {mean,sd};
}
const oldStats=await stats(oldNight),newStats=await stats(newNight);
assert(Number.isFinite(newStats.mean)&&newStats.sd>0,'v135 render stats invalid');

mkdirSync('work/v135-preview',{recursive:true});
writeFileSync('work/v135-preview/ashkelon-v134-night.png',oldNight);
writeFileSync('work/v135-preview/ashkelon-v135-night.png',newNight);
writeFileSync('work/v135-preview/ashkelon-v135-day.png',newDay);

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
const ash=await call('/?v=135&lat=31.6688&lon=34.5743&city=Ashkelon');
const nyc=await call('/?v=135&lat=40.7128&lon=-74.0060&city=New%20York');
assert.equal(ash.statusCode,200);
assert.equal(nyc.statusCode,200);
assert.equal(ash.headers['X-Map-Revision'],'135');
assert.equal(ash.headers['X-Map-Location-Source'],'coordinates');
assert(isPng(ash.body)&&isPng(nyc.body),'v135 API did not return PNGs');
assert(!ash.body.equals(nyc.body),'v135 dynamic locations did not change output');

console.log(JSON.stringify({
  passed:true,
  cleanSignal:true,
  noV133SignalReuse:true,
  wideDynamicRange:true,
  noRegionalBoosts:true,
  noBakedGlow:true,
  dynamicSolarMask:true,
  dynamicLocation:true,
  visibleDifferenceVsV134:true,
  v134NightStats:oldStats,
  v135NightStats:newStats,
  v134NightBytes:oldNight.length,
  v135NightBytes:newNight.length,
  v135DayBytes:newDay.length
}));
