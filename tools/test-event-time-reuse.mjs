import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {DateTime} from 'luxon';
import {BridgeError} from '../lib/calendar-bridge/security.js';
import {eventTimes} from '../lib/calendar-bridge/event-times.js';
import {eventsByDay,monthWindow,renderDots} from '../lib/calendar-bridge/dots.js';
import {widgetSnapshot} from '../lib/calendar-bridge/widget-data.js';
const baseline='c2a80846fc091070a528ad32df4cc494b6520ee5';
const oldDots=execFileSync('git',['show',baseline+':lib/calendar-bridge/dots.js'],{encoding:'utf8'});
const oldData=execFileSync('git',['show',baseline+':lib/calendar-bridge/widget-data.js'],{encoding:'utf8'});
const language=oldDots.slice(oldDots.indexOf('function titleLanguageRank'),oldDots.indexOf('export function monthWindow'));
const index=oldDots.slice(oldDots.indexOf('export function eventsByDay'),oldDots.indexOf('export function dayDots')).replace('export ','');
const oldIndex=new Function('DateTime','BridgeError','COLORS',language+index+';return eventsByDay;')(DateTime,BridgeError,[1,1,1,1]);
const snapshot=oldData.slice(oldData.indexOf('function homeEvent'),oldData.indexOf('export function sourceDiagnostics')).replaceAll('export ','');
const oldSnapshot=new Function('DateTime','eventsByDay',snapshot+';return widgetSnapshot;')(DateTime,oldIndex);
function fixture(w,count){
 const result=Array.from({length:count},(_,i)=>{
  const start=w.start.plus({days:(i*17)%(w.weeks*7+8)-4,hours:i%24,minutes:i%60});
  return {uid:'e'+i,source:'synthetic',color:i%4,title:['English','עברית','123 😀 Test','日本'][i%4]+i,location:'Synthetic',allDay:i%9===0,
   start:i%9===0?start.toISODate():start.toISO(),end:i%9===0?start.plus({days:i%5}).toISODate():start.plus({hours:i%49}).toISO()};
 });
 if(result.length)result.push({...result[0],source:'duplicate'});
 return result;
}
let indexCases=0,snapshotCases=0;
for(const zone of ['UTC','Asia/Jerusalem','America/New_York','Australia/Lord_Howe','Pacific/Apia','Pacific/Kiritimati']){
 for(const instant of ['2026-02-15T12:00Z','2026-03-27T00:00Z','2026-10-25T00:30Z','2026-08-15T12:00Z','2028-02-29T12:00Z','2011-12-30T12:00Z']){
  const now=new Date(instant),w=monthWindow({now,zone}),events=fixture(w,100);
  const expected=oldIndex(events,w),actual=eventsByDay(events,w);assert.deepEqual(actual,expected);indexCases++;
  for(const at of [now.getTime()-1,now.getTime(),now.getTime()+1,...events.slice(0,12).flatMap(e=>[DateTime.fromISO(e.start,{zone}).toMillis(),DateTime.fromISO(e.end,{zone}).toMillis()]).flatMap(t=>[t-1,t,t+1])]){
   assert.deepEqual(widgetSnapshot(events,w,new Date(at),actual),oldSnapshot(events,w,new Date(at),expected));snapshotCases++;
  }
 }
}
for(const bad of [{color:8,start:'2026-01-01',end:'2026-01-02'},{color:0,start:'invalid',end:'2026-01-02'},{color:0,start:'2026-01-03',end:'2026-01-02'}]){
 const w=monthWindow();let a,b;try{oldIndex([bad],w)}catch(e){a=[e.code,e.status]}try{eventsByDay([bad],w)}catch(e){b=[e.code,e.status]}assert.deepEqual(b,a);assert(a);
}
const e={start:'2026-10-09T10:00:00+03:00',end:'2026-10-09T11:00:00+03:00'};
const saved=structuredClone(e),first=eventTimes(e,'Asia/Jerusalem');assert.equal(eventTimes(e,'Asia/Jerusalem'),first);assert.deepEqual(e,saved);
assert.notEqual(eventTimes(e,'UTC'),first);assert.notEqual(eventTimes({...e},'Asia/Jerusalem'),first);
e.end='2026-10-09T12:00:00+03:00';assert.notEqual(eventTimes(e,'Asia/Jerusalem').endMs,first.endMs);
const bounded=eventTimes(e,'UTC');
for(let i=0;i<2050;i++)eventTimes({...e},'UTC');
assert.notEqual(eventTimes(e,'UTC'),bounded,'Derived cache resets within the 2048-insertion bound');
let pngs=0;
for(const instant of ['2026-02-15T12:00Z','2026-10-09T12:00Z','2026-08-15T12:00Z']){
 const w=monthWindow({now:new Date(instant)}),events=fixture(w,40);
 for(const bounds of ['full','grid']){assert((await renderDots(events,w,{bounds,preparedDays:oldIndex(events,w)})).equals(await renderDots(events,w,{bounds,preparedDays:eventsByDay(events,w)})));pngs++;}
}
const med=a=>a.sort((a,b)=>a-b)[Math.floor(a.length/2)],bench=[];
const now=new Date('2026-10-09T10:00Z'),w=monthWindow({now});
for(const count of [10,100,500]){
 const template=fixture(w,count),a=[],b=[];
 for(let i=0;i<20;i++)for(const k of (i%2?['before','after']:['after','before'])){
  const events=structuredClone(template),t=performance.now();
  (k==='before'?oldIndex:eventsByDay)(events,w);(k==='before'?a:b).push(performance.now()-t);
 }
 bench.push({events:count,kind:'cold day index; fresh objects, cloning excluded',beforeMs:med(a),afterMs:med(b)});
}
for(const count of [0,10,100,500]){
 const events=fixture(w,count),days=eventsByDay(events,w),before=[],after=[];
 for(let i=0;i<50;i++)for(const k of (i%2?['before','after']:['after','before'])){
  const t=performance.now();(k==='before'?oldSnapshot:widgetSnapshot)(events,w,now,days);(k==='before'?before:after).push(performance.now()-t);
 }
 bench.push({events:count,kind:'warm snapshot; same prepared day index',beforeMs:med(before),afterMs:med(after)});
}
// Dense same-day events expose repeated Home sorting/parsing work that a
// sparse month benchmark otherwise hides. No provider or network is involved.
for(const count of [10,100,500]){
 const events=Array.from({length:count},(_,i)=>({uid:'timed'+i,color:i%4,title:'Synthetic '+i,start:'2026-10-09T10:00:00+03:00',end:'2026-10-09T23:00:00+03:00'})),days=eventsByDay(events,w),a=[],b=[];
 for(let i=0;i<30;i++)for(const k of (i%2?['before','after']:['after','before'])){const t=performance.now();(k==='before'?oldSnapshot:widgetSnapshot)(events,w,now,days);(k==='before'?a:b).push(performance.now()-t);}
 bench.push({events:count,kind:'same-day warm snapshot',beforeMs:med(a),afterMs:med(b)});
}
const report={pass:true,indexCases,snapshotCases,pngs,cacheInvalidationAndIsolation:true,baseline,bench,nativeLatencyMeasured:false};
if(process.argv.includes('--write'))writeFileSync('tools/performance/event-time-reuse-benchmark.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
