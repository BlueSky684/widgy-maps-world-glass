import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import sharp from 'sharp';
import {renderHomeMap as renderV136} from '../lib/home-map-v136.js';
import {renderHomeMap as renderV137} from '../lib/home-map-v137.js';
import handler from '../api/home-map.js';

const pngSig=Buffer.from([137,80,78,71,13,10,26,10]);
const isPng=b=>Buffer.isBuffer(b)&&b.length>10000&&b.subarray(0,8).equals(pngSig);

const src=readFileSync(new URL('../lib/home-map-v137.js',import.meta.url),'utf8');
const provenance=JSON.parse(readFileSync(new URL('../assets/earth/night-provenance-v137.json',import.meta.url),'utf8'));

assert(src.includes("night-signal-v137.bin.gz"),'v137 must use its fresh signal');
assert(!src.includes("night-signal-v136.bin.gz"),'v137 must not reuse v136 signal');
assert(src.includes("cores[p]=238*Math.pow(energy/(energy+6.9),.78);"),'v137 tone curve mismatch');
assert(src.includes("const POINT=[1,.84,.57],NEAR=[1,.74,.34],FAR=[1,.63,.22],SHINE=[1,.95,.76];"),'v137 approved palette mismatch');
assert(src.includes("[.50,1.45]"),'v137 halo widths mismatch');
assert(src.includes("near[p]*.21"),'v137 near glow mismatch');
assert(src.includes("far[p]*.045"),'v137 far glow mismatch');
assert(src.includes("nightSignal[p]-152"),'v137 brilliance threshold mismatch');
assert(!src.includes("const air="),'decorative blue atmospheric arc still active');
assert.equal(provenance.version,137);
assert.equal(provenance.signalExtraction.previousSignalReuse,false);
assert.equal(provenance.signalExtraction.regionalBoosts,false);
assert.equal(provenance.signalExtraction.handEdits,false);
assert.equal(provenance.signalExtraction.bakedGlow,false);
assert.equal(provenance.signalExtraction.bakedColour,false);
assert.equal(provenance.signalExtraction.bakedDayNightMask,false);
assert(provenance.signalRange[1]>150,'strong-core dynamic range missing');

const nightDate=new Date('2026-09-23T00:30:00Z');
const dayDate=new Date('2026-09-23T12:30:00Z');
const loc={latitude:31.80,longitude:34.64,city:'Ashdod',source:'test'};

const [oldNight,newNight,newDay,cleanNight]=await Promise.all([
  renderV136({date:nightDate,location:loc}),
  renderV137({date:nightDate,location:loc}),
  renderV137({date:dayDate,location:loc}),
  renderV137({date:nightDate,location:null})
]);
assert(isPng(newNight)&&isPng(newDay)&&isPng(cleanNight),'v137 render not PNG');
assert(!newNight.equals(newDay),'dynamic solar mask failed');
assert(!newNight.equals(oldNight),'v137 should visibly differ from v136');

async function imageStats(buffer){
  const {data,info}=await sharp(buffer).removeAlpha().raw().toBuffer({resolveWithObject:true});
  let sum=0,sum2=0,bright=0,warmR=0,warmG=0,warmB=0,warmN=0;
  const w=info.width,h=info.height;
  const lum=new Float32Array(w*h);
  for(let p=0;p<w*h;p++){
    const i=p*3,R=data[i],G=data[i+1],B=data[i+2];
    const y=.2126*R+.7152*G+.0722*B;
    lum[p]=y;sum+=y;sum2+=y*y;
    if(y>210)bright++;
    if(R>130&&G>90&&R>=G&&G>B*1.12){warmR+=R;warmG+=G;warmB+=B;warmN++;}
  }
  let grad=0;
  for(let y=1;y<h;y++)for(let x=1;x<w;x++){
    const p=y*w+x; grad+=Math.abs(lum[p]-lum[p-1])+Math.abs(lum[p]-lum[p-w]);
  }
  return {
    mean:sum/(w*h),
    sd:Math.sqrt(Math.max(0,sum2/(w*h)-(sum/(w*h))**2)),
    gradient:grad/((w-1)*(h-1)),
    brightFraction:bright/(w*h),
    warmMean:warmN?[warmR/warmN,warmG/warmN,warmB/warmN]:[0,0,0],
    warmCount:warmN
  };
}
const oldStats=await imageStats(oldNight),newStats=await imageStats(newNight);
assert(newStats.warmCount>1000,'yellow-gold light population unexpectedly low');
assert(newStats.warmMean[1]/newStats.warmMean[0]>.72,'lights are too red/brown');
assert(newStats.brightFraction<.08,'highlights are too broad/bright');
assert(newStats.gradient>0,'detail metric invalid');

mkdirSync('work/v137-preview',{recursive:true});
writeFileSync('work/v137-preview/ashdod-v136-night.png',oldNight);
writeFileSync('work/v137-preview/ashdod-v137-night.png',newNight);
writeFileSync('work/v137-preview/ashdod-v137-day.png',newDay);
writeFileSync('work/v137-preview/v137-night-no-marker.png',cleanNight);

async function call(url){
  let body,statusCode=200; const headers={};
  const req={url,method:'GET',headers:{}};
  const res={setHeader:(k,v)=>{headers[k]=v;},status:n=>{statusCode=n;return res;},send:b=>{body=b;return res;},json:o=>{body=Buffer.from(JSON.stringify(o));return res;},end:()=>res};
  await handler(req,res); return {body,headers,statusCode};
}
const ash=await call('/?v=137&lat=31.80&lon=34.64&city=Ashdod');
const nyc=await call('/?v=137&lat=40.7128&lon=-74.0060&city=New%20York');
assert.equal(ash.statusCode,200); assert.equal(nyc.statusCode,200);
assert.equal(ash.headers['X-Map-Revision'],'137');
assert.equal(ash.headers['X-Map-Location-Source'],'coordinates');
assert(isPng(ash.body)&&isPng(nyc.body));
assert(!ash.body.equals(nyc.body),'explicit locations did not change output');

console.log(JSON.stringify({
  passed:true,
  freshRebuild:true,
  previousSignalReuse:false,
  approvedYellowGold:true,
  blueAtmosphericArcRemoved:true,
  dynamicSolarMask:true,
  dynamicLocation:true,
  v136Stats:oldStats,
  v137Stats:newStats,
  v136Bytes:oldNight.length,
  v137Bytes:newNight.length
}));
