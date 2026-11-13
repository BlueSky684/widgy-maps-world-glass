import test from 'node:test';
import assert from 'node:assert/strict';
import {DateTime} from 'luxon';
import {nativeProjection} from '../lib/calendar-bridge/native-projection.js';
import {monthWindow,eventsByDay} from '../lib/calendar-bridge/dots.js';
import {widgetSnapshot} from '../lib/calendar-bridge/widget-data.js';
import {presentAgenda} from '../lib/calendar-bridge/agenda-presentation.js';

export const flight={title:'Flight from AUH to TLV (XX 101)',location:'Abu Dhabi AUH',start:'2026-11-13T04:50:00Z',end:'2026-11-13T08:20:00Z',uid:'flight',allDay:false,color:2};
export const meeting={...flight,title:'Meeting',location:'Office',start:'2026-11-13T12:00:00Z',end:'2026-11-13T13:00:00Z',uid:'meeting'};
export const allDay={...meeting,title:'All-day task',start:'2026-11-13',end:'2026-11-14',uid:'day',allDay:true};
export function fixture(events,at='2026-11-13T08:54:00Z',zone='Asia/Jerusalem',filter=true){
 const now=new Date(at),window=monthWindow({now,zone}),days=eventsByDay(events,window);
 const raw=widgetSnapshot(events,window,now,days,{rowLimit:256}),presented=presentAgenda(raw,days,[],true);
 const rows=(filter?raw.rows.filter(r=>r.allDay||Date.parse(r.endAt)>+now):raw.rows).slice(0,4);
 const t=DateTime.fromJSDate(now,{zone});
 const input=new URLSearchParams({day_zone:zone,native_date:raw.date,native_count:String(raw.total),native_hour:String(t.hour),native_minute:String(t.minute)});
 rows.forEach((r,i)=>['title','location','start','end'].forEach(k=>input.set(`n${i+1}_${k}`,r[k]??'')));
 const encoded=encodeURIComponent(JSON.stringify({version:1,raw,presented}));
 return {input,encoded,now:+now,rows,raw,presented,projection:nativeProjection(input,encoded,+now)};
}
test('after landing: count remains one but no native row; finished is supported by complete current data',()=>{
 const f=fixture([flight]);assert.equal(f.rows.length,0);assert.equal(f.input.get('native_count'),'1');
 assert.equal(f.projection.fields.calendar_day_state,'finished');
 assert.equal(f.projection.fields.calendar_event_1_phase,'absent');
});
test('finish boundary is the absolute end, invariant across phone zones',()=>{
 for(const zone of ['Asia/Jerusalem','Asia/Dubai','Asia/Kolkata','UTC','America/New_York']){
  for(const [at,phase,state]of [['2026-11-13T08:19:59Z','active','remaining'],['2026-11-13T08:20:00Z','ended','finished']]){
   const f=fixture([flight],at,zone,false);assert.equal(f.projection.fields.calendar_event_1_phase,phase);assert.equal(f.projection.fields.calendar_day_state,state);
   assert.equal(f.projection.fields.calendar_event_1_flight_start,'08:50');assert.equal(f.projection.fields.calendar_event_1_flight_end,'10:20');
  }
 }
});
test('all-day and future events survive completed flights, including native reindexing',()=>{
 for(const other of [meeting,allDay]){
  const f=fixture([flight,other]);assert.equal(f.rows.length,1);assert.equal(f.rows[0].title,other.title);
  assert.equal(f.projection.fields.calendar_day_state,'remaining');assert.equal(f.projection.fields.calendar_event_1_phase,other.allDay?'all-day':'future');
 }
 assert.equal(fixture([]).projection.fields.calendar_day_state,'empty');
});
test('absence, stale metadata, zone/day mismatch and differing calendar counts cannot prove completion',()=>{
 const f=fixture([flight]);
 const encode=p=>encodeURIComponent(JSON.stringify({version:1,...p}));
 const pairs=[{raw:{...f.raw,generatedAt:'2026-11-13T08:00:00Z'},presented:f.presented},
  {raw:{...f.raw,zone:'Asia/Dubai'},presented:f.presented},
  {raw:{...f.raw,date:'2026-11-12'},presented:f.presented},
  {raw:{...f.raw,total:2},presented:f.presented},
  {raw:{...f.raw,rows:[]},presented:f.presented}];
 for(const encoded of ['', 'bad',...pairs.map(encode)])assert.equal(nativeProjection(f.input,encoded,f.now).fields.calendar_day_state,'unknown');
});
test('all-day or later events beyond four slots prevent a false finished state',()=>{
 const ended=Array.from({length:5},(_,i)=>({...flight,uid:`past${i}`,title:`Past ${i}`}));
 for(const other of [meeting,allDay]){
  const f=fixture([...ended,other],undefined,undefined,false);
  assert.notEqual(f.projection.fields.calendar_day_state,'finished');
 }
 assert.equal(fixture(ended,undefined,undefined,false).projection.fields.calendar_day_state,'finished');
});
test('overnight and date-line flights use instants and never use displayed airport clock for expiry',()=>{
 for(const [e,at]of [[{...flight,title:'Flight from JFK to LHR',start:'2026-11-13T23:00:00Z',end:'2026-11-14T06:00:00Z'},'2026-11-14T05:00:00Z'],
  [{...flight,title:'Flight from NRT to LAX',start:'2026-11-13T01:00:00Z',end:'2026-11-13T08:00:00Z'},'2026-11-13T07:00:00Z']]){
  const f=fixture([e],at,'America/Los_Angeles',false);assert.equal(f.projection.fields.calendar_event_1_phase,'active');
 }
});
