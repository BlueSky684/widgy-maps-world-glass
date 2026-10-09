import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {renderHomeMap} from '../lib/home-map-day-night.js';
const baseline='bd930a85ca6c5ebf79beb0c0e50410d8c00efe6d';
let code=execFileSync('git',['show',baseline+':lib/home-map-day-night.js'],{encoding:'utf8'});
code=code.replace(/from '(\.\/[^']+)'/g,(_,p)=>`from '${new URL(p,new URL('../lib/home-map-day-night.js',import.meta.url)).href}'`)
 .replace("from 'sharp'",`from '${new URL('../node_modules/sharp/lib/index.js',import.meta.url).href}'`)
 .replace("from 'pngjs'",`from '${new URL('../node_modules/pngjs/lib/png.js',import.meta.url).href}'`);
const old=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const median=values=>{const v=[...values].sort((a,b)=>a-b),m=Math.floor(v.length/2);return v.length%2?v[m]:(v[m-1]+v[m])/2;};
const cases=[];
for(const date of ['2026-10-09T08:00:00Z','2026-03-20T12:00:00Z','2026-06-21T00:00:00Z']){
 const base={date:new Date(date),location:{latitude:0,longitude:0,city:'Synthetic Test',source:'coordinates'},width:3306,presentation:'glass',atlas:'r6'};
 await old.renderHomeMap(base);await renderHomeMap(base);
 const samples=[];
 for(let i=0;i<6;i++){
  const options={...base,location:{...base.location,latitude:i*0.0000123,longitude:i*0.0000141}};
  const pair={},images={};
  for(const mode of(i%2?['after','before']:['before','after'])){
   const start=performance.now();images[mode]=await(mode==='before'?old.renderHomeMap(options):renderHomeMap(options));
   pair[mode]=+(performance.now()-start).toFixed(3);
  }
  assert(images.before.equals(images.after));samples.push(pair);
 }
 const before=median(samples.map(s=>s.before)),after=median(samples.map(s=>s.after));
 cases.push({date,samples,beforeMedianMs:before,afterMedianMs:after,reductionPercent:+(100*(1-after/before)).toFixed(1),allPNGBytesExact:true});
}
console.log(JSON.stringify({baseline,environment:'local Node '+process.version,method:'Six warm pairs per solar instant, alternating order, precise synthetic coordinates changed each pair, fresh full rendering each time; no phone/network measurement.',cases,nativeLatencyMeasured:false},null,2));
