import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {renderHomeMap} from '../lib/home-map-day-night.js';
import {monthWindow} from '../lib/calendar-bridge/dots.js';
import {widgetSnapshot} from '../lib/calendar-bridge/widget-data.js';
import {preparedDaysFor} from '../lib/calendar-bridge/prepared-days.js';
const baseline='513d5fcbac89725465557dd145517fc13adf5207';
let code=execFileSync('git',['show',baseline+':lib/home-map-day-night.js'],{encoding:'utf8'});
code=code.replace(/from '(\.\/[^']+)'/g,(_,p)=>`from '${new URL(p,new URL('../lib/home-map-day-night.js',import.meta.url)).href}'`);
// Data URL imports do not resolve bare package names; pin to this installed tree.
code=code.replace("from 'sharp'",`from '${new URL('../node_modules/sharp/lib/index.js',import.meta.url).href}'`)
 .replace("from 'pngjs'",`from '${new URL('../node_modules/pngjs/lib/png.js',import.meta.url).href}'`);
const old=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
const timed=async fn=>{const start=performance.now();await fn();return +(performance.now()-start).toFixed(3);};
const map=[];
for(const date of ['2026-10-09T06:30:00Z','2026-03-20T12:00:00Z','2026-06-21T00:00:00Z']){
 const options={date:new Date(date),location:{latitude:0,longitude:0,city:'Synthetic Test',source:'coordinates'},width:3306,presentation:'glass',atlas:'r6'};
 assert((await old.renderHomeMap(options)).equals(await renderHomeMap(options)));
 const samples=[];
 for(let i=0;i<4;i++){
  const pair={};for(const mode of (i%2?['after','before']:['before','after'])) pair[mode]=await timed(()=>mode==='before'?old.renderHomeMap(options):renderHomeMap(options));
  samples.push(pair);
 }
 const beforeMs=median(samples.map(s=>s.before)),afterMs=median(samples.map(s=>s.after));
 map.push({date,samples,beforeMedianMs:beforeMs,afterMedianMs:afterMs,reductionPercent:+(100*(1-afterMs/beforeMs)).toFixed(1)});
}
const now=new Date('2026-10-09T06:30:00Z'),window=monthWindow({now}),calendar=[];
for(const count of [0,10,100,500]){
 const events=Array.from({length:count},(_,i)=>({uid:'fixture-'+i,title:i%2?'English':'עברית',color:i%4,allDay:false,
  start:window.start.plus({days:i%35,hours:i%24}).toISO(),end:window.start.plus({days:i%35,hours:i%24+2}).toISO()}));
 const entry={};preparedDaysFor(entry,events,window);
 const before=[],after=[];
 for(let i=0;i<30;i++){
  let a,b;for(const mode of(i%2?['after','before']:['before','after'])){
   const t=performance.now();
   if(mode==='before'){a=widgetSnapshot(events,window,now);before.push(performance.now()-t);}
   else{b=widgetSnapshot(events,window,now,preparedDaysFor(entry,events,window));after.push(performance.now()-t);}
  }assert.deepEqual(a,b);
 }
 const beforeMs=median(before),afterMs=median(after);
 calendar.push({syntheticEvents:count,repeatedRequests:30,beforeMedianMs:+beforeMs.toFixed(3),afterMedianMs:+afterMs.toFixed(3),reductionPercent:+(100*(1-afterMs/beforeMs)).toFixed(1)});
}
console.log(JSON.stringify({baseline,environment:'local Node '+process.version,method:'Warm alternating order; no network or phone. Map regenerates each image. Calendar reuses one unchanged provider entry and recalculates current-time snapshot.',map,calendar,nativeLatencyMeasured:false},null,2));
