import test from 'node:test';
import assert from 'node:assert/strict';
import {eventsByDay,monthWindow,googleEvents} from '../lib/calendar-bridge/dots.js';
import {widgetSnapshot} from '../lib/calendar-bridge/widget-data.js';
import {widgyFields} from '../lib/calendar-bridge/widgy-fields.js';
import {homeAgenda,homeAgendaFields} from '../lib/calendar-bridge/home-agenda.js';
import handler,{clientMaxAge} from '../api/calendar-widget.js';

const now=new Date('2026-11-01T10:00:00Z'); // Noon in Jerusalem.
const event=(id,start,end,title=id)=>({uid:id,source:'test',color:0,title,
  start:`2026-11-01T${start}:00+02:00`,end:`2026-11-01T${end}:00+02:00`,allDay:false});
const allDay=(id,title=id)=>({uid:id,source:'test',color:1,title,
  start:'2026-11-01',end:'2026-11-02',allDay:true});
function render(events,at=now){
  const window=monthWindow({now:at}),days=eventsByDay(events,window);
  const snapshot=widgetSnapshot(events,window,at,days);
  return {agenda:homeAgenda(days,snapshot),snapshot};
}

test('empty day, one event, and several remaining events match the approved text',()=>{
  let a=render([]).agenda;
  assert.equal(a.meta,'TODAY');assert.equal(a.title,'No events today');assert.equal(a.remaining,0);
  const dinner=event('dinner','18:30','20:00','Dinner with friends');
  a=render([dinner]).agenda;
  assert.equal(a.meta,'TODAY');assert.equal(a.title,'18:30 · Dinner with friends');assert.equal(a.remaining,1);
  a=render([event('late','21:00','22:00'),dinner,event('middle','20:00','21:00')]).agenda;
  assert.equal(a.meta,'TODAY · 3 EVENTS');assert.equal(a.remaining,3);
  assert.equal(a.title,'18:30 · Dinner with friends');
});

test('finished events leave the Home count while the full-day Calendar data stays intact',()=>{
  const items=[event('finished','09:00','10:00'),event('next','13:00','14:00'),event('last','18:30','19:30')];
  const {agenda,snapshot}=render(items);
  assert.equal(agenda.remaining,2);assert.equal(agenda.meta,'TODAY · 2 EVENTS');
  assert.equal(snapshot.total,3);assert.equal(widgyFields(snapshot).calendar_home_count,'3');
  assert.equal(render(items,new Date('2026-11-01T12:00:00Z')).agenda.meta,'TODAY');
  const done=render(items,new Date('2026-11-01T18:00:00Z')).agenda;
  assert.equal(done.remaining,0);assert.equal(done.title,'No more events today');
});

test('active events stay eligible and another overlapping end invalidates the count',()=>{
  const items=[event('long','11:00','14:00'),event('short','11:30','12:10'),event('later','18:00','19:00')];
  const a=render(items).agenda;
  assert.equal(a.title,'11:00 · long');assert.equal(a.remaining,3);
  assert.equal(a.validUntil,Date.parse('2026-11-01T12:10:00+02:00'));
  assert.equal(render(items,new Date('2026-11-01T10:10:00Z')).agenda.remaining,2);
  const instant=a.validUntil-4500;
  assert.equal(clientMaxAge(render(items).snapshot,instant+60000,instant,a.validUntil),4);
});

test('all-day events are counted, timed events are preferred, and empty titles have a fallback',()=>{
  assert.equal(render([allDay('holiday')]).agenda.title,'All day · holiday');
  const a=render([allDay('holiday'),event('meeting','13:00','14:00','')]).agenda;
  assert.equal(a.meta,'TODAY · 2 EVENTS');assert.equal(a.title,'13:00 · (Untitled event)');
  const past={...allDay('past'),start:'2026-10-31',end:'2026-11-01'};
  assert.equal(render([past]).agenda.remaining,0);
});

test('the next event and count use all events, beyond the four Calendar rows',()=>{
  const items=[...Array.from({length:6},(_,i)=>allDay('all-'+i,'A holiday '+i)),
    event('hebrew','13:00','14:00','פגישה'),event('later','18:00','19:00','Z later')];
  const {agenda,snapshot}=render([...items,{...items[0],source:'duplicate'}]);
  assert.equal(snapshot.rows.length,4);assert(!snapshot.rows.some(r=>r.title==='פגישה'));
  assert.equal(agenda.remaining,8);assert.equal(agenda.title,'13:00 · פגישה');
  assert.equal(agenda.meta,'TODAY · 8 EVENTS');
});

test('cancelled provider events do not enter the agenda',()=>{
  const converted=googleEvents([{id:'cancel',status:'cancelled',start:{date:'2026-11-01'},end:{date:'2026-11-02'}}],
    {id:'test',color:0,provider:'google'});
  assert.equal(render(converted).agenda.remaining,0);
});

test('midnight and DST retain the configured calendar timezone',()=>{
  const overnight={...event('night','23:00','23:59'),start:'2026-10-31T23:00:00+02:00',end:'2026-11-01T13:00:00+02:00'};
  assert.equal(render([overnight]).agenda.title,'23:00 · night');
  assert.equal(render([allDay('holiday')],new Date('2026-11-01T22:00:00Z')).agenda.title,'No events today');
  const dst={...overnight,start:'2026-10-25T01:15:00+03:00',end:'2026-10-25T01:45:00+02:00'};
  const a=render([dst],new Date('2026-10-24T23:20:00Z')).agenda;
  assert.equal(a.remaining,1);assert.equal(a.title,'01:15 · night');
  assert.equal(a.validUntil,Date.parse(dst.end));
});

test('unavailable data is explicit, and the API extension is opt-in',async()=>{
  assert.deepEqual(homeAgendaFields(null),{calendar_home_agenda_meta:'TODAY',
    calendar_home_agenda_title:'Calendar unavailable',calendar_home_agenda_remaining:-1});
  const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(body){this.body=body;return this;}});
  const compact=response(),original=response();
  await handler({method:'GET',url:'/api/calendar-widget?format=widgy&agenda=home-v1'},compact);
  await handler({method:'GET',url:'/api/calendar-widget?format=widgy'},original);
  assert.equal(compact.body.calendar_home_agenda_title,'Calendar unavailable');
  assert.equal(original.body.calendar_home_agenda_title,undefined);
  for(const [key,value] of Object.entries(original.body))assert.deepEqual(compact.body[key],value);
});
