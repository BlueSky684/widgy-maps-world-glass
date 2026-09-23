import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import sharp from 'sharp';
import {renderHomeMap as renderV138} from '../lib/home-map-v138.js';
import {renderHomeMap as renderV139} from '../lib/home-map-v139.js';

const sig=Buffer.from([137,80,78,71,13,10,26,10]);
const isPng=b=>Buffer.isBuffer(b)&&b.length>10000&&b.subarray(0,8).equals(sig);

const src=readFileSync(new URL('../lib/home-map-v139.js',import.meta.url),'utf8');
const provenance=JSON.parse(readFileSync(new URL('../assets/earth/night-provenance-v139.json',import.meta.url),'utf8'));

assert(src.includes("night-signal-v139.bin.gz"),'v139 must use its fresh signal');
assert(!src.includes("night-signal-v137.bin.gz"),'v139 must not reuse v137 signal');
assert(src.includes("const BODY=[1,.90,.46],IVORY=[1,.99,.82],NEAR=[1,.84,.35],FAR=[1,.74,.26];"),'v139 palette mismatch');
assert(!src.includes("const shine="),'shine computation must be absent');
assert(!src.includes("SHINE=["),'SHINE palette must be absent');
assert(src.includes("near[p]*.24"),'near micro-glow mismatch');
assert(src.includes("far[p]*.035"),'far micro-glow mismatch');
assert(src.includes("const ivory=clamp((nightSignal[p]-125)*.10,0,12)*IVORY[k];"),'ivory core mismatch');
assert.equal(provenance.version,139);
assert.equal(provenance.signalExtraction.previousSignalReuse,false);
assert.equal(provenance.signalExtraction.regionalBoosts,false);
assert.equal(provenance.signalExtraction.handEdits,false);
assert.equal(provenance.signalExtraction.bakedGlow,false);
assert.equal(provenance.signalExtraction.bakedColour,false);
assert.equal(provenance.signalExtraction.highFrequencyOvershoot,false);

const date=new Date('2026-09-23T00:30:00Z');
const [oldMap,newMap]=await Promise.all([
  renderV138({date,location:null}),
  renderV139({date,location:null})
]);
assert(isPng(oldMap)&&isPng(newMap),'technical preview is not PNG');
assert(!oldMap.equals(newMap),'v139 produced no visual change');

async function stats(buffer){
  const {data,info}=await sharp(buffer).removeAlpha().raw().toBuffer({resolveWithObject:true});
  let sum=0,bright=0,veryBright=0,goldR=0,goldG=0,goldB=0,goldN=0;
  const n=info.width*info.height;
  for(let p=0;p<n;p++){
    const i=p*3,R=data[i],G=data[i+1],B=data[i+2];
    const y=.2126*R+.7152*G+.0722*B;
    sum+=y;
    if(y>180)bright++;
    if(y>230)veryBright++;
    if(R>130&&G>110&&R>=G&&G>B){goldR+=R;goldG+=G;goldB+=B;goldN++;}
  }
  return {
    mean:sum/n,
    brightFraction:bright/n,
    veryBrightFraction:veryBright/n,
    goldMean:goldN?[goldR/goldN,goldG/goldN,goldB/goldN]:[0,0,0],
    goldCount:goldN
  };
}
const a=await stats(oldMap),b=await stats(newMap);
assert(b.goldCount>1000,'yellow-gold population unexpectedly low');
assert(b.goldMean[1]/b.goldMean[0]>.84,'v139 gold is still too red/brown');
assert(b.veryBrightFraction<.01,'v139 highlights are too broad');

mkdirSync('work/v139-technical',{recursive:true});
writeFileSync('work/v139-technical/v138-reference.png',oldMap);
writeFileSync('work/v139-technical/v139-luxury-yellow-gold.png',newMap);

console.log(JSON.stringify({
  passed:true,
  renderer:"v139 technical candidate",
  freshRebuild:true,
  previousSignalReuse:false,
  shineLayerRemoved:true,
  ivoryRoundCore:true,
  luxuryYellowGold:true,
  v138:a,
  v139:b,
  v138Bytes:oldMap.length,
  v139Bytes:newMap.length
}));
