import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import sharp from 'sharp';
import {renderHomeMap as renderV139} from '../lib/home-map-v139.js';
import {renderHomeMap as renderV140} from '../lib/home-map-v140.js';

const sig=Buffer.from([137,80,78,71,13,10,26,10]);
const isPng=b=>Buffer.isBuffer(b)&&b.length>10000&&b.subarray(0,8).equals(sig);

const src=readFileSync(new URL('../lib/home-map-v140.js',import.meta.url),'utf8');
const provenance=JSON.parse(readFileSync(new URL('../assets/earth/night-provenance-v140.json',import.meta.url),'utf8'));

for(const name of ['night-network-v140.bin.gz','night-body-v140.bin.gz','night-core-v140.bin.gz'])
  assert(src.includes(name),'missing v140 layer '+name);

assert(!src.includes('night-signal-v139.bin.gz'),'v140 must not reuse v139 signal');
assert(!src.includes('SHINE=['),'SHINE palette must not exist');
assert(!src.includes('const shine='),'shine computation must not exist');
assert(src.includes('const NETWORK=[1,.88,.50],BODY=[1,.84,.39],IVORY=[1,.97,.84];'),'v140 palette mismatch');
assert(src.includes('networkSignal[p]*.58'),'network strength mismatch');
assert(src.includes('bodyNear[p]*.34'),'body strength mismatch');
assert(src.includes('bodyWide[p]*.055'),'halo strength mismatch');
assert(src.includes('coreSignal[p]*.34'),'core strength mismatch');
assert(src.includes('[.72,1.65]'),'body glow widths mismatch');

assert.equal(provenance.version,140);
assert.equal(provenance.previousSignalReuse,false);
assert.equal(provenance.regionalBoosts,false);
assert.equal(provenance.handEdits,false);
assert.equal(provenance.bakedColour,false);
assert.equal(provenance.bakedGlow,false);
assert.equal(provenance.starburstLayer,false);
assert.equal(provenance.directionalKernel,false);

const date=new Date('2026-09-23T00:30:00Z');
const [oldMap,newMap]=await Promise.all([
  renderV139({date,location:null}),
  renderV140({date,location:null})
]);
assert(isPng(oldMap)&&isPng(newMap),'technical preview is not PNG');
assert(!oldMap.equals(newMap),'v140 produced no visual change');

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
    if(R>125&&G>105&&R>=G&&G>B){
      goldR+=R;goldG+=G;goldB+=B;goldN++;
    }
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
assert(b.goldCount>1000,'v140 gold population unexpectedly low');
assert(b.goldMean[1]/b.goldMean[0]>.82,'v140 still too red/brown');
assert(b.veryBrightFraction<.005,'v140 highlights too broad');

mkdirSync('work/v140-technical',{recursive:true});
writeFileSync('work/v140-technical/v139-reference.png',oldMap);
writeFileSync('work/v140-technical/v140-multilayer-luxury.png',newMap);

console.log(JSON.stringify({
  passed:true,
  renderer:'v140 technical candidate',
  freshRebuild:true,
  threeIndependentLayers:true,
  shineLayerRemoved:true,
  directionalKernel:false,
  luxuryYellowGold:true,
  compactIvoryCore:true,
  v139:a,
  v140:b,
  v139Bytes:oldMap.length,
  v140Bytes:newMap.length
}));
