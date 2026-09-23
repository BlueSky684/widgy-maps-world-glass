import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import sharp from 'sharp';
import {renderHomeMap as renderV137} from '../lib/home-map-v137.js';
import {renderHomeMap as renderV138} from '../lib/home-map-v138.js';

const sig=Buffer.from([137,80,78,71,13,10,26,10]);
const isPng=b=>Buffer.isBuffer(b)&&b.length>10000&&b.subarray(0,8).equals(sig);

const src=readFileSync(new URL('../lib/home-map-v138.js',import.meta.url),'utf8');
assert(src.includes("night-signal-v137.bin.gz"),'v138 must retain approved clean v137 master signal');
assert(src.includes("const POINT=[1,.84,.57],NEAR=[1,.74,.34],FAR=[1,.63,.22];"),'approved Yellow-Gold changed');
assert(!src.includes("SHINE"),'SHINE layer must be completely absent');
assert(!src.includes("const shine="),'shine computation must be absent');
assert(src.includes("148+54*(1-Math.exp"),'peak soft-cap missing');
assert(src.includes("near[p]*.17"),'near micro-glow mismatch');
assert(src.includes("far[p]*.025"),'far micro-glow mismatch');
assert(src.includes("[.46,1.25]"),'isotropic glow widths mismatch');

const date=new Date('2026-09-23T00:30:00Z');
const [oldMap,newMap]=await Promise.all([
  renderV137({date,location:null}),
  renderV138({date,location:null})
]);
assert(isPng(oldMap)&&isPng(newMap),'technical preview is not PNG');
assert(!oldMap.equals(newMap),'v138 zero-starburst candidate produced no visual change');

async function stats(buffer){
  const {data,info}=await sharp(buffer).removeAlpha().raw().toBuffer({resolveWithObject:true});
  let bright=0,veryBright=0,sum=0,n=info.width*info.height;
  for(let p=0;p<n;p++){
    const i=p*3;
    const y=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];
    sum+=y;
    if(y>200)bright++;
    if(y>235)veryBright++;
  }
  return {mean:sum/n,brightFraction:bright/n,veryBrightFraction:veryBright/n};
}
const a=await stats(oldMap),b=await stats(newMap);
assert(b.veryBrightFraction<=a.veryBrightFraction,'v138 should not increase white-hot peaks');

mkdirSync('work/v138-technical',{recursive:true});
writeFileSync('work/v138-technical/option-b-v137-reference.png',oldMap);
writeFileSync('work/v138-technical/option-b-zero-starburst-v138.png',newMap);

console.log(JSON.stringify({
  passed:true,
  renderer:"v138 technical candidate",
  optionB:true,
  approvedYellowGold:true,
  shineLayerRemoved:true,
  directionalFlareKernel:false,
  peakSoftCap:true,
  isotropicMicroGlowOnly:true,
  v137:a,
  v138:b,
  v137Bytes:oldMap.length,
  v138Bytes:newMap.length
}));
