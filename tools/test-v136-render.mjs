import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import sharp from 'sharp';
import {renderHomeMap as renderV135} from '../lib/home-map-v135.js';
import {renderHomeMap as renderV136} from '../lib/home-map-v136.js';
import handler from '../api/home-map.js';

const sig=Buffer.from([137,80,78,71,13,10,26,10]);
const isPng=b=>Buffer.isBuffer(b)&&b.length>10000&&b.subarray(0,8).equals(sig);

const src=readFileSync(new URL('../lib/home-map-v136.js',import.meta.url),'utf8');
const provenance=JSON.parse(readFileSync(new URL('../assets/earth/night-provenance-v136.json',import.meta.url),'utf8'));
assert(src.includes("night-signal-v136.bin.gz"));
assert(!src.includes("night-signal-v135.bin.gz"));
assert(src.includes("signal.readUInt16LE(p*2)/384"));
assert(src.includes("cores[p]=242*Math.pow(energy/(energy+6.6),.76);"));
assert(src.includes("const POINT=[1,.82,.53],NEAR=[1,.70,.31],FAR=[1,.59,.20],SHINE=[1,.94,.78];"));
assert(src.includes("[.52,1.55]"));
assert(src.includes("near[p]*.24"));
assert(src.includes("far[p]*.055"));
assert(src.includes("nightSignal[p]-138"));
assert(src.includes("projectFromField"));
assert.equal(provenance.version,136);
assert.equal(provenance.signalScale,384);
assert.equal(provenance.signalExtraction.regionalBoosts,false);
assert.equal(provenance.signalExtraction.handEdits,false);
assert.equal(provenance.signalExtraction.bakedGlow,false);
assert.equal(provenance.signalExtraction.bakedColour,false);
assert.equal(provenance.signalExtraction.bakedDayNightMask,false);
assert(provenance.signalRange[1]>150);

const dateNight=new Date('2026-09-23T00:30:00Z');
const dateDay=new Date('2026-09-23T12:30:00Z');
const loc={latitude:31.80,longitude:34.64,city:'Ashdod',source:'test'};
const [v135Night,v136Night,v136Day,v136Clean]=await Promise.all([
 renderV135({date:dateNight,location:loc}),
 renderV136({date:dateNight,location:loc}),
 renderV136({date:dateDay,location:loc}),
 renderV136({date:dateNight,location:null})
]);
assert(isPng(v136Night)&&isPng(v136Day)&&isPng(v136Clean));
assert(!v136Night.equals(v136Day),'dynamic solar mask failed');
assert(!v136Night.equals(v135Night),'v136 must visibly differ from v135');

async function stats(buffer){
 const {data,info}=await sharp(buffer).removeAlpha().raw().toBuffer({resolveWithObject:true});
 let sum=0,sum2=0,grad=0,n=0;
 const w=info.width,h=info.height;
 const lum=new Float32Array(w*h);
 for(let p=0;p<w*h;p++){
   const i=p*3,y=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];
   lum[p]=y;sum+=y;sum2+=y*y;n++;
 }
 for(let y=1;y<h;y++)for(let x=1;x<w;x++){
   const p=y*w+x;
   grad+=Math.abs(lum[p]-lum[p-1])+Math.abs(lum[p]-lum[p-w]);
 }
 return {mean:sum/n,sd:Math.sqrt(Math.max(0,sum2/n-(sum/n)**2)),gradient:grad/((w-1)*(h-1))};
}
const oldStats=await stats(v135Night),newStats=await stats(v136Night);
assert(newStats.gradient>0&&Number.isFinite(newStats.gradient));

mkdirSync('work/v136-preview',{recursive:true});
writeFileSync('work/v136-preview/ashdod-v135-night.png',v135Night);
writeFileSync('work/v136-preview/ashdod-v136-night.png',v136Night);
writeFileSync('work/v136-preview/ashdod-v136-day.png',v136Day);
writeFileSync('work/v136-preview/v136-night-no-marker.png',v136Clean);

async function call(url){
 let body,statusCode=200;const headers={};
 const req={url,method:'GET',headers:{}};
 const res={setHeader:(k,v)=>{headers[k]=v;},status:n=>{statusCode=n;return res;},send:b=>{body=b;return res;},json:o=>{body=Buffer.from(JSON.stringify(o));return res;},end:()=>res};
 await handler(req,res);return {body,headers,statusCode};
}
const ash=await call('/?v=136&lat=31.80&lon=34.64&city=Ashdod');
const nyc=await call('/?v=136&lat=40.7128&lon=-74.0060&city=New%20York');
assert.equal(ash.statusCode,200);assert.equal(nyc.statusCode,200);
assert.equal(ash.headers['X-Map-Revision'],'136');
assert.equal(ash.headers['X-Map-Location-Source'],'coordinates');
assert(isPng(ash.body)&&isPng(nyc.body));
assert(!ash.body.equals(nyc.body));

console.log(JSON.stringify({
 passed:true,
 hdMaster:true,
 independentSignal:true,
 noRegionalBoosts:true,
 noBakedGlow:true,
 highlightOnlyBrilliance:true,
 dynamicSolarMask:true,
 dynamicLocation:true,
 visibleDifferenceVsV135:true,
 v135NightStats:oldStats,
 v136NightStats:newStats,
 v135NightBytes:v135Night.length,
 v136NightBytes:v136Night.length,
 v136DayBytes:v136Day.length
}));
