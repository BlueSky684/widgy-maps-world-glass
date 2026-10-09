import fs from 'node:fs';import {execFileSync} from 'node:child_process';import {performance} from 'node:perf_hooks';import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),lib=new URL('lib/',root);
let code=execFileSync('git',['show','7f768cafdebf46e1f9d878c5934dd54372cef05f:lib/home-map-day-night.js'],{cwd:root,encoding:'utf8'});
code=code.replace(/from '(\.\/[^']+)'/g,(_,s)=>'from '+JSON.stringify(new URL(s,lib).href)).replace("from 'sharp'","from "+JSON.stringify(new URL('node_modules/sharp/lib/index.js',root).href)).replace("from 'pngjs'","from "+JSON.stringify(new URL('node_modules/pngjs/lib/png.js',root).href));
const old=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64')),candidate=await import(new URL('home-map-day-night.js',lib));
const cases=[{id:'same-city-moving-gps',location:{latitude:12.3456789,longitude:45.9876543,city:'Synthetic City',source:'coordinates'}},{id:'no-city',location:null},{id:'long-label',location:{latitude:72.01020304,longitude:167.04030201,city:'Synthetic Longer City Name',source:'coordinates'}}];
const sha=b=>createHash('sha256').update(b).digest('hex'),median=xs=>{const a=[...xs].sort((a,b)=>a-b),m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;},rows=[];
for(const c of cases){const args={...c,date:new Date('2026-10-09T06:30:00Z'),atlas:'r6',presentation:'glass',width:3306};await old.renderHomeMap(args);await candidate.renderHomeMap(args);const times={old:[],candidate:[]};
for(let i=0;i<6;i++){if(args.location)args.location={...args.location,latitude:args.location.latitude+0.000001};let hashes=[];
for(const name of i%2?['old','candidate']:['candidate','old']){const start=performance.now(),png=await({old,candidate}[name]).renderHomeMap(args);times[name].push(performance.now()-start);hashes.push(sha(png));}
if(hashes[0]!==hashes[1])throw Error('image parity');}
rows.push({id:c.id,times,medianBefore:median(times.old),medianAfter:median(times.candidate)});}
const result={baseline:'7f768cafdebf46e1f9d878c5934dd54372cef05f',scope:'Local warm renderer, alternating order, six fresh renders per case. GPS inputs vary without quantization. Exact PNG bytes checked per pair; not phone or network latency.',rows};
fs.writeFileSync(new URL('tools/performance/render-resources-1-benchmark.json',root),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
