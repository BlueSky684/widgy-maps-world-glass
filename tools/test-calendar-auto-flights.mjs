import test from 'node:test';
import assert from 'node:assert/strict';
import {DateTime} from 'luxon';
import {createRequire} from 'node:module';
import {monthWindow,eventsByDay} from '../lib/calendar-bridge/dots.js';
import {widgetSnapshot} from '../lib/calendar-bridge/widget-data.js';
import {presentAgenda} from '../lib/calendar-bridge/agenda-presentation.js';
import {homeAgenda} from '../lib/calendar-bridge/home-agenda.js';
import {airportPlace,automaticFlight} from '../lib/calendar-bridge/flight-route.js';
const client=createRequire(import.meta.url)('./fixtures/native-calendar.cjs');
const event=(title='Flight to Tel Aviv (XX 123)',location='Abu Dhabi AUH',start='2027-02-17T04:50:00Z',end='2027-02-17T08:20:00Z')=>({title,location,start,end,allDay:false,color:2,uid:'test',provider:'google',startTimeZone:'Asia/Jerusalem',endTimeZone:'Asia/Jerusalem'});
function pair(e,zone='Asia/Kolkata',date=e.start){
 const now=new Date(date),window=monthWindow({now,zone}),days=eventsByDay([e],window);
 const raw=widgetSnapshot([e],window,now,days),presented=presentAgenda(raw,days,[],true);
 const encoded=encodeURIComponent(JSON.stringify({version:1,raw,presented}));
 const bundle=JSON.parse(decodeURIComponent(client.nativeBundle(encoded,raw.date,zone,raw.rows,1,0,[])));
 return {raw,presented,bundle,days};
}
test('automatic flight is date/number independent and uses the airports, not provider or phone zones',()=>{
 for(const day of ['2027-02-17','2027-06-10','2028-03-22'])for(const zone of ['Asia/Kolkata','Asia/Dubai','Asia/Jerusalem','UTC']){
  const e=event('Flight to Tel Aviv (XX 987)','Abu Dhabi AUH',day+'T04:50:00Z',day+'T08:20:00Z');
  const p=pair(e,zone),r=p.bundle.rows[0];assert.equal(r.flight,1);assert.equal(r.flight_start,'08:50');
  assert.equal(r.flight_end,DateTime.fromISO(e.end).setZone('Asia/Jerusalem').toFormat('HH:mm'));
  assert.equal(r.start_label,'AUH');assert.equal(r.end_label,'TLV');assert.equal(r.flight_number,'XX 987');
 }
});
test('both route directions, repeated and rescheduled flights resolve afresh',()=>{
 for(const [title,location,origin,destination] of [
  ['Flight from TLV to AUH (XX 1)','','TLV','AUH'],['XX 2 JFK → LHR','','JFK','LHR'],
  ['Flight BLR-DOH (XX 3)','','BLR','DOH'],['טיסה מ TLV → JFK','','TLV','JFK'],
  ['Flight to Bengaluru (XX 4)','Doha DOH','DOH','BLR']]){
  const e=event(title.replace('טיסה מ ','טיסה '),location),p=pair(e);assert.equal(p.bundle.rows[0].flight,1);
  assert.equal(p.presented.rows[0].startLabel,origin);assert.equal(p.presented.rows[0].endLabel.split(' ')[0],destination);
  const changed=pair({...e,start:'2027-02-17T05:45:00Z',end:'2027-02-17T09:15:00Z'});
  assert.notEqual(changed.bundle.rows[0].flight_start,p.bundle.rows[0].flight_start);
 }
});
test('DST and quarter/half-hour zones follow IANA rules, including DST transition',()=>{
 for(const [route,at,end] of [
  ['JFK-LHR','2027-01-10T02:00:00Z','2027-01-10T09:00:00Z'],
  ['JFK-LHR','2027-07-10T02:00:00Z','2027-07-10T09:00:00Z'],
  ['JFK-LHR','2027-03-14T06:00:00Z','2027-03-14T13:00:00Z'],
  ['DEL-KTM','2027-02-17T04:00:00Z','2027-02-17T05:30:00Z'],
  ['ADL-SYD','2027-02-17T04:00:00Z','2027-02-17T06:00:00Z']]){
  const p=pair(event('Flight '+route,'',at,end)),r=p.bundle.rows[0],f=automaticFlight(event('Flight '+route));
  assert.equal(r.flight_start,DateTime.fromISO(at).setZone(f.departure.zone).toFormat('HH:mm'));
  assert.equal(r.flight_end,DateTime.fromISO(end).setZone(f.arrival.zone).toFormat('HH:mm'));
 }
});
test('overnight/date-line routes show the local arrival day offset',()=>{
 for(const [route,start,end,label] of [
  ['HND-HNL','2027-02-17T16:00:00Z','2027-02-18T00:00:00Z','HNL -1d'],
  ['HNL-HND','2027-02-17T19:00:00Z','2027-02-18T04:00:00Z','HND +1d'],
  ['LAX-SYD','2027-02-17T07:00:00Z','2027-02-17T22:00:00Z','SYD +2d']]){
  const p=pair(event('Flight '+route,'',start,end));assert.equal(p.bundle.rows[0].end_label,label);
 }
});
test('ambiguous city and missing route stay flight cards without invented local times',()=>{
 assert.equal(airportPlace('London'),null);
 for(const [title,location,start,end] of [
  ['Flight to London (XX 5)','JFK','—','—'],
  ['Flight to Unknown City (XX 6)','','—','—'],
  ['Flight to Tel Aviv (XX 7)','','—','10:20']]){
  const p=pair(event(title,location)),r=p.bundle.rows[0];assert.equal(r.flight,1);
  if(!location)assert.equal(r.flight_start,start);
  assert.equal(r.flight_end,end);assert.equal(p.presented.rows[0].flightEvidence.status,'route-incomplete');
 }
 const p=pair(event('Flight to London, United Kingdom (XX 8)','JFK'));
 assert.equal(p.presented.rows[0].arrivalZone,'Europe/London');assert.equal(p.bundle.rows[0].end_label,'London +1d');
});
test('meetings, hotels, flight planning and all-day events remain ordinary',()=>{
 for(const title of ['Meeting','Hotel booking (XX 123)','Flight planning meeting','from Paris to Lyon','Meeting (XX 123)']){
  const p=pair({...event(title),providerEventType:'fromGmail'});assert.equal(p.bundle.rows[0].flight,0);
 }
 const p=pair({...event(),allDay:true,start:'2027-02-17',end:'2027-02-18'});assert.equal(p.presented.rows[0].flight,0);
});
test('native validation rejects stale or corrupt metadata instead of displaying its times',()=>{
 const p=pair(event()),r=p.raw.rows[0];
 for(const alter of [x=>x.flightEvidence.start='bad',x=>x.flightEvidence.start='2027-02-18T04:50:00Z',x=>x.flightEvidence.end=x.flightEvidence.start,
  x=>x.start='10:20',x=>x.end='13:50',x=>x.departureZone='UTC',x=>x.flightEvidence.arrival.zone='No/Such',x=>x.endLabel='XXX',x=>x.title='Another flight']){
  const changed=structuredClone(p.presented);alter(changed.rows[0]);assert.equal(client.matchRow(r,p.raw,changed,[]),null);
 }
 assert.equal(client.matchRow({...r,start:'10:21'},p.raw,p.presented,[]),null);
 assert.equal(client.matchRow(r,{...p.raw,rows:[r,r]},p.presented,[]),null);
});
test('phone-day membership and Home use the same event without borrowing yesterday flight',()=>{
 const e=event(),p=pair(e);assert.match(homeAgenda(p.days,p.raw,[],true).title,/^08:50/);
 const tomorrow=pair(e,'Asia/Kolkata','2027-02-18T00:00:00Z');assert.equal(tomorrow.raw.total,0);
 const unknown=pair(event('Flight to Tel Aviv (XX 2)',''));assert.match(homeAgenda(unknown.days,unknown.raw,[],true).title,/^—/);
});
test('legacy clients stay opt-in, and normal appointment hours remain viewer-local',()=>{
 const p=pair(event()),legacy=presentAgenda(p.raw,p.days,[]);assert.equal(legacy.rows[0].flight,0);
 const ordinary=pair(event('Appointment'));assert.equal(ordinary.bundle.rows[0].flight,0);assert.equal(ordinary.presented.rows[0].start,'10:20');
});
test('Hebrew, unnumbered flights and prefixed numbers preserve flight presentation',()=>{
 for(const [title,location] of [['טיסה מאבו דאבי לתל אביב',''],['Flight to Tel Aviv','AUH'],['XX 2 AUH → TLV','']]){
  const p=pair(event(title,location));assert.equal(p.bundle.rows[0].flight,1);assert.equal(p.bundle.rows[0].flight_start,'08:50');assert.equal(p.bundle.rows[0].flight_end,'10:20');
 }
 const r=pair(event('XX 2 AUH → TLV','')).bundle.rows[0];assert.equal(r.flight_number,'XX 2');assert.equal(r.flight_title,'AUH → TLV');
});
test('Home beyond the four native rows still displays departure local time',()=>{
 const flight=event('Flight to Tel Aviv (XX 5)');
 const past=Array.from({length:4},(_,i)=>({...event('Appointment '+i,'','2027-02-17T00:00:00Z','2027-02-17T00:10:00Z'),uid:'past'+i}));
 const now=new Date('2027-02-17T04:00:00Z'),window=monthWindow({now,zone:'Asia/Kolkata'}),events=[...past,flight],days=eventsByDay(events,window);
 const raw=widgetSnapshot(events,window,now,days,{rowLimit:256}),presented=presentAgenda(raw,days,[],true);
 assert.equal(raw.rows.length,5);assert.equal(client.homeTitle(raw.rows.slice(0,4),5,raw,presented,570,[]),'08:50 · Flight to Tel Aviv (XX 5)');
});
