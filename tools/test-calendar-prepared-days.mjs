import test from 'node:test';
import assert from 'node:assert/strict';
import {DateTime} from 'luxon';
import {eventsByDay,monthWindow,dayDots,renderDots} from '../lib/calendar-bridge/dots.js';
import {widgetSnapshot} from '../lib/calendar-bridge/widget-data.js';
import {preparedDaysFor} from '../lib/calendar-bridge/prepared-days.js';

test('prepared days preserve rows, sorting, duplicate removal, DST and live Home transitions',()=>{
 let cases=0;
 for(const zone of ['Asia/Jerusalem','America/New_York','Pacific/Auckland','UTC']){
  for(const instant of ['2026-02-15T12:00Z','2026-08-15T12:00Z','2026-10-25T00:30Z','2028-02-29T12:00Z']){
   const now=new Date(instant),window=monthWindow({now,zone});
   const today=DateTime.fromJSDate(now,{zone}).startOf('day');
   const events=Array.from({length:60},(_,i)=>{
    const start=window.start.plus({days:i%35,hours:i%24});
    return {uid:'fixture-'+i,source:'synthetic',color:i%4,title:i%2?'כותרת':'English title',location:'',allDay:false,
     start:start.toISO(),end:start.plus({hours:i%49}).toISO()};
   });
   events.push({uid:'all-day',color:0,title:'All day',allDay:true,start:today.toISODate(),end:today.plus({days:1}).toISODate()});
   events.push({...events[0],source:'duplicate-copy'});
   const entry={},days=preparedDaysFor(entry,events,window);
   assert.deepEqual(days,eventsByDay(events,window));
   assert.equal(preparedDaysFor(entry,events,window),days);
   assert.deepEqual(dayDots(events,window,days),dayDots(events,window));
   for(const at of [today.toMillis(),now.getTime()-1,now.getTime(),now.getTime()+1,today.plus({days:1}).toMillis()-1,today.plus({days:1}).toMillis()]){
    assert.deepEqual(widgetSnapshot(events,window,new Date(at),days),widgetSnapshot(events,window,new Date(at)));cases++;
   }
  }
 }
 assert.equal(cases,96);
});

test('NOW/NEXT boundaries are recalculated despite reusing the same index',()=>{
 const window=monthWindow({now:new Date('2026-10-09T06:00Z')});
 const events=[{uid:'timed',color:0,title:'Synthetic meeting',allDay:false,start:'2026-10-09T10:00:00+03:00',end:'2026-10-09T11:00:00+03:00'}];
 const days=preparedDaysFor({},events,window);
 const snapshots=['2026-10-09T06:59:59.999Z','2026-10-09T07:00:00Z','2026-10-09T08:00:00Z'].map(at=>widgetSnapshot(events,window,new Date(at),days));
 assert.deepEqual(snapshots.map(s=>s.home.label),['NEXT EVENT','NOW','TODAY']);
 assert.equal(new Set(snapshots.map(s=>s.generatedAt)).size,3);
});

test('entries, provider generations, windows and zones are isolated',()=>{
 const now=new Date('2026-10-09T06:00Z'),w=monthWindow({now}),events=[];
 const a={},b={},days=preparedDaysFor(a,events,w);
 assert.notEqual(preparedDaysFor(b,events,w),days);
 assert.notEqual(preparedDaysFor(a,[...events],w),days);
 const current=preparedDaysFor(a,events,w);
 assert.notEqual(preparedDaysFor(a,events,monthWindow({now,offset:1})),current);
 assert.notEqual(preparedDaysFor(a,events,monthWindow({now,zone:'UTC'})),current);
});

test('dense month is not retained beyond the reference budget',()=>{
 const w=monthWindow({now:new Date('2026-08-15T12:00Z')}),entry={};
 const events=Array.from({length:1200},(_,i)=>({uid:String(i),color:i%4,title:'Synthetic',start:w.start.toISO(),end:w.end.toISO()}));
 const days=preparedDaysFor(entry,events,w);
 assert.equal(days.reduce((n,d)=>n+d.events.length,0),50400);
 assert.equal(entry.dayIndex,undefined);
});

test('dot PNG bytes remain identical for 4/5/6 weeks and both bounds',async()=>{
 for(const date of ['2026-02-15T12:00Z','2026-10-09T06:00Z','2026-08-15T12:00Z']){
  const w=monthWindow({now:new Date(date)});
  const events=Array.from({length:4},(_,color)=>({uid:String(color),color,title:'Synthetic',start:w.month.toISODate(),end:w.month.plus({days:3}).toISODate()}));
  const preparedDays=preparedDaysFor({},events,w);
  for(const bounds of ['full','grid']) assert((await renderDots(events,w,{bounds})).equals(await renderDots(events,w,{bounds,preparedDays})));
 }
});
