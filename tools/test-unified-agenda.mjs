import test from 'node:test';
import assert from 'node:assert/strict';
import {DateTime} from 'luxon';
import {monthWindow,eventsByDay,googleEvents,icalEvents} from '../lib/calendar-bridge/dots.js';
import {unifiedAgenda,unavailableAgenda} from '../lib/calendar-bridge/unified-agenda.js';
import {createWidgetContext} from '../lib/widget-context.js';
export const flight={title:'Flight from AUH to TLV (XX 101)',location:'Abu Dhabi AUH',start:'2026-11-13T04:50:00Z',end:'2026-11-13T08:20:00Z',uid:'flight',allDay:false,color:2};
export const meeting={...flight,title:'Meeting',location:'Office',start:'2026-11-13T12:00:00Z',end:'2026-11-13T13:00:00Z',uid:'meeting'};
export const allDay={...meeting,title:'All-day task',start:'2026-11-13',end:'2026-11-14',uid:'day',allDay:true};
export function fixture(events,at='2026-11-13T08:54:00Z',zone='Asia/Jerusalem'){
 const now=new Date(at),window=monthWindow({now,zone}),days=eventsByDay(events,window);
 return {agenda:unifiedAgenda(days,window,now),days,window,now};
}
test('exact expiry uses instants and the same event drives title, flight clocks and presence',()=>{
 for(const zone of ['Asia/Jerusalem','Asia/Dubai','Asia/Kolkata','Asia/Kathmandu','UTC','America/New_York']){
  const before=fixture([flight],'2026-11-13T08:19:59Z',zone).agenda;
  assert.equal(before.fields.home_title,flight.title);assert.equal(before.fields.home_flight_start,'08:50');assert.equal(before.fields.home_flight_end,'10:20');
  assert.equal(before.fields.home_start_label,'AUH');assert.equal(before.fields.home_end_label,'TLV');
  assert.equal(before.validUntil,Date.parse(flight.end));
  const after=fixture([flight],flight.end,zone).agenda.fields;
  assert.equal(after.state,'finished');assert.equal(after.message,'No more events today');
  assert.equal(after.home_visible,0);assert.equal(after.event_1_visible,0);assert.equal(after.home_title,'');assert.equal(after.count,0);
 }
});
test('no dependency on native count, row availability, ordering or JS substitutions',async()=>{
 const {agenda,now}=fixture([flight]);
 for(const count of ['0','1','2','invalid','${widgy.unresolved}']){
  const res={headers:{},setHeader(k,v){this.headers[k]=v},status(){return this},json(b){this.body=b},end(){}};
  const logs=[];const context=createWidgetContext({clock:()=>+now,log:x=>logs.push(x),
   calendar:async()=>(req,res)=>res.json({encoded:'',agenda}),weather:async()=>(req,res)=>res.json({icon_status:'Clear'}),location:async()=>(req,res)=>res.json({text:'Test'})});
  await context({method:'GET',url:'/?context=home-v1&agenda=unified-v1&day_zone=Asia%2FJerusalem&native_count='+encodeURIComponent(count)},res);
  assert.equal(res.body.calendar.agenda.fields.state,'finished');assert.equal(logs[0].agendaState,'finished');
 }
});
test('completed rows are removed before packing; all-day and later meetings survive',()=>{
 for(const other of [meeting,allDay]){
  const f=fixture([flight,other]).agenda.fields;
  assert.equal(f.count,1);assert.equal(f.event_1_title,other.title);assert.equal(f.event_1_visible,1);assert.equal(f.event_2_visible,0);assert.equal(f.home_title,other.title);
 }
 assert.equal(fixture([]).agenda.fields.message,'No events today');
 assert.equal(fixture([allDay],'2026-11-13T21:59:59Z').agenda.fields.home_kind,'all-day');
 assert.equal(fixture([allDay],'2026-11-13T22:00:00Z').agenda.fields.state,'empty');
});
test('dense days, all-day priority, ongoing overlaps, language ordering and home beyond four slots',()=>{
 const ended=Array.from({length:300},(_,i)=>({...flight,uid:`ended${i}`,title:`Past ${i}`}));
 assert.equal(fixture([...ended,meeting]).agenda.fields.home_title,meeting.title);
 const days=Array.from({length:8},(_,i)=>({...allDay,uid:`day${i}`,title:`All day ${i}`}));
 const f=fixture([...days,meeting]).agenda.fields;
 assert.equal(f.count,9);assert.equal(f.home_title,'Meeting');assert.equal(f.overflow,'+5 more');assert.equal(f.event_4_visible,1);
 const active={...meeting,title:'אקטיבי',start:'2026-11-13T08:00:00Z'};
 assert.equal(fixture([meeting,active]).agenda.fields.home_title,active.title);
});
test('overnight, date line and DST use absolute end while retaining airport local times',()=>{
 const cases=[['Flight from JFK to LHR','2026-11-13T23:00:00Z','2026-11-14T06:00:00Z','2026-11-14T05:00:00Z','America/New_York','18:00','06:00','LHR +1d'],
 ['Flight from NRT to LAX','2026-11-13T01:00:00Z','2026-11-13T08:00:00Z','2026-11-13T07:00:00Z','Asia/Tokyo','10:00','00:00','LAX'],
 ['Flight from LAX to NRT','2026-11-13T23:00:00Z','2026-11-14T10:00:00Z','2026-11-14T09:00:00Z','Asia/Tokyo','15:00','19:00','NRT +1d']];
 for(const [title,start,end,at,zone,a,b,label]of cases){
  const f=fixture([{...flight,title,start,end}],at,zone).agenda.fields;
  assert.equal(f.home_flight_start,a);assert.equal(f.home_flight_end,b);assert.equal(f.home_end_label,label);assert.equal(f.home_visible,1);
 }
 const dst={...meeting,start:'2026-11-01T05:30:00Z',end:'2026-11-01T06:15:00Z'};
 assert.equal(fixture([dst],'2026-11-01T06:00:00Z','America/New_York').agenda.fields.home_visible,1);
 assert.equal(fixture([dst],dst.end,'America/New_York').agenda.fields.state,'finished');
});
test('failures, incomplete/malformed snapshot and stale or wrong-zone responses never become an empty day',async()=>{
 const {agenda,now,window}=fixture([]);
 assert.equal(unifiedAgenda([],window,now).fields.ready,0);
 for(const changed of [null,{...agenda,generatedAt:'2026-11-12T00:00:00Z'},{...agenda,zone:'Asia/Dubai'},{...agenda,validUntil:+now}]){
  const res={setHeader(){},status(){return this},json(b){this.body=b},end(){}};
  await createWidgetContext({clock:()=>+now,log:()=>{},calendar:async()=>(req,res)=>{if(!changed)throw Error('secret');res.json({encoded:'',agenda:changed})},
   weather:async()=>(req,res)=>res.json({icon_status:'Clear'}),location:async()=>(req,res)=>res.json({text:'Test'})})({method:'GET',url:'/?context=home-v1&agenda=unified-v1&day_zone=Asia%2FJerusalem'},res);
  assert.equal(res.body.calendar.agenda.fields.ready,0);assert.equal(res.body.calendar.agenda.fields.state,'unavailable');assert.equal(res.body.weather.icon_status,'Clear');
 }
 assert.equal(unavailableAgenda().fields.home_title,'');
});
test('cancelled events, recurring all-day occurrence, duplicates and Unicode titles',()=>{
 const source={id:'fixture',provider:'google',color:0};
 const google=googleEvents([{status:'cancelled',start:{date:'2026-11-13'},end:{date:'2026-11-14'}}],source);
 assert.equal(fixture(google).agenda.fields.state,'empty');
 const title='פגישה "חשובה" \\ ${widgy.any}';
 assert.equal(fixture([{...meeting,title}]).agenda.fields.home_title,title);
 assert.equal(fixture([meeting,{...meeting,source:'copy'}]).agenda.fields.count,1);
 const {window}=fixture([]);const ics='BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:daily\r\nDTSTART;VALUE=DATE:20261112\r\nDTEND;VALUE=DATE:20261113\r\nRRULE:FREQ=DAILY;COUNT=3\r\nSUMMARY:Daily\r\nEND:VEVENT\r\nEND:VCALENDAR';
 const events=icalEvents([{data:ics}],{...source,provider:'icloud'},window);
 assert.equal(fixture(events).agenda.fields.home_kind,'all-day');
});
