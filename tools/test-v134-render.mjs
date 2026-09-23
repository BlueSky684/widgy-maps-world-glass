import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {renderHomeMap as renderV133} from '../lib/home-map-v133.js';
import {renderHomeMap as renderV134} from '../lib/home-map-v134.js';
import handler from '../api/home-map.js';

const pngSignature=Buffer.from([137,80,78,71,13,10,26,10]);
const isPng=b=>Buffer.isBuffer(b)&&b.length>10000&&b.subarray(0,8).equals(pngSignature);

const v134src=readFileSync(new URL('../lib/home-map-v134.js',import.meta.url),'utf8');
assert(v134src.includes("night-signal-v133.bin.gz"),'v134 must reuse v133 signal');
assert(v134src.includes("cores[p]=228*Math.pow(energy/(energy+8),.68);"),'v134 tone curve changed');
assert(v134src.includes("projectFromField"),'v134 dynamic marker projection missing');
assert(v134src.includes("const POINT=[1,.77,.41],NEAR=[1,.69,.27],FAR=[1,.57,.17];"),'v134 colours mismatch');
assert(v134src.includes("const local=near[p]*.47*NEAR[k]*night;"),'v134 near glow mismatch');
assert(v134src.includes("const wide=far[p]*.25*FAR[k]*night;"),'v134 far glow mismatch');

const loc={latitude:31.6688,longitude:34.5743,city:'Ashkelon',source:'test'};
const nightDate=new Date('2026-09-23T00:30:00Z');
const dayDate=new Date('2026-09-23T12:30:00Z');
const [v133Night,v134Night,v134Day]=await Promise.all([
  renderV133({date:nightDate,location:loc}),
  renderV134({date:nightDate,location:loc}),
  renderV134({date:dayDate,location:loc})
]);
assert(isPng(v134Night)&&isPng(v134Day),'v134 fixed-time render not PNG');
assert(!v134Night.equals(v134Day),'v134 dynamic solar mask did not change');
assert(!v134Night.equals(v133Night),'v134 render polish produced no visible change');

mkdirSync('work/v134-preview',{recursive:true});
writeFileSync('work/v134-preview/ashkelon-v133-night.png',v133Night);
writeFileSync('work/v134-preview/ashkelon-v134-night.png',v134Night);
writeFileSync('work/v134-preview/ashkelon-v134-day.png',v134Day);

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
const ash=await call('/?v=134&lat=31.6688&lon=34.5743&city=Ashkelon');
const nyc=await call('/?v=134&lat=40.7128&lon=-74.0060&city=New%20York');
assert.equal(ash.statusCode,200);
assert.equal(nyc.statusCode,200);
assert.equal(ash.headers['X-Map-Revision'],'134');
assert.equal(ash.headers['X-Map-Location-Source'],'coordinates');
assert(isPng(ash.body)&&isPng(nyc.body),'v134 API did not return PNGs');
assert(!ash.body.equals(nyc.body),'v134 location routing did not change output');

console.log(JSON.stringify({
  passed:true,
  signalReused:true,
  toneCurvePreserved:true,
  dynamicSolarMask:true,
  dynamicLocation:true,
  visiblePolishVsV133:true,
  ashkelonBytes:ash.body.length,
  newYorkBytes:nyc.body.length,
  v133NightBytes:v133Night.length,
  v134NightBytes:v134Night.length,
  v134DayBytes:v134Day.length
}));
