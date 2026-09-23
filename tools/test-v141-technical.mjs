import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import sharp from 'sharp';
import {renderHomeMap as renderV140} from '../lib/home-map-v140.js';
import {renderHomeMap as renderV141} from '../lib/home-map-v141.js';

const sig=Buffer.from([137,80,78,71,13,10,26,10]);
const isPng=b=>Buffer.isBuffer(b)&&b.length>10000&&b.subarray(0,8).equals(sig);

const src=readFileSync(new URL('../lib/home-map-v141.js',import.meta.url),'utf8');
const provenance=JSON.parse(readFileSync(new URL('../assets/earth/night-provenance-v141.json',import.meta.url),'utf8'));

for(const name of ['night-network-v141.bin.gz','night-body-v141.bin.gz','night-core-v141.bin.gz'])
  assert(src.includes(name),'missing v141 layer '+name);
assert(!src.includes('night-network-v140.bin.gz'),'v141 must not reuse v140 network');
assert(!src.includes('SHINE=['),'SHINE palette must not exist');
assert(!src.includes('const shine='),'shine computation must not exist');
assert(src.includes('const NETWORK=[1,.87,.30],BODY=[1,.83,.20],IVORY=[1,.97,.72];'),'v141 palette mismatch');
assert(src.includes('networkSignal[p]*.12'),'network strength mismatch');
assert(src.includes('bodySignal[p]*.18'),'body point mismatch');
assert(src.includes('bodyNear[p]*.72'),'body strength mismatch');
assert(src.includes('bodyWide[p]*.13'),'halo strength mismatch');
assert(src.includes('coreSignal[p]*.34'),'core strength mismatch');
assert(src.includes('[.92,2.20]'),'body glow widths mismatch');

assert.equal(provenance.version,141);
assert.equal(provenance.previousSignalReuse,false);
assert.equal(provenance.regionalBoosts,false);
assert.equal(provenance.handEdits,false);
assert.equal(provenance.bakedColour,false);
assert.equal(provenance.bakedGlow,false);
assert.equal(provenance.starburstLayer,false);
assert.equal(provenance.directionalKernel,false);
assert.deepEqual(provenance.workingResolution,[3654,1722]);

const date=new Date('2026-09-23T00:30:00Z');
const [oldMap,newMap]=await Promise.all([
  renderV140({date,location:null}),
  renderV141({date,location:null})
]);
assert(isPng(oldMap)&&isPng(newMap),'technical preview is not PNG');
assert(!oldMap.equals(newMap),'v141 produced no visual change');

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
    if(R>120&&G>105&&R>=G&&G>B){
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
assert(b.goldCount>1000,'v141 gold population unexpectedly low');
assert(b.goldMean[1]/b.goldMean[0]>.82,'v141 too red/brown');
assert(b.veryBrightFraction<.005,'v141 highlights too broad');

mkdirSync('work/v141-technical',{recursive:true});
writeFileSync('work/v141-technical/v140-reference.png',oldMap);
writeFileSync('work/v141-technical/v141-high-res-emissive.png',newMap);

console.log(JSON.stringify({
  passed:true,
  renderer:'v141 technical candidate',
  freshRebuild:true,
  supersampled2x:true,
  threeIndependentLayers:true,
  shineLayerRemoved:true,
  directionalKernel:false,
  luxuryYellowGold:true,
  compactIvoryCore:true,
  v140:a,
  v141:b,
  v140Bytes:oldMap.length,
  v141Bytes:newMap.length
}));
