import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {DateTime} from 'luxon';
import {BridgeError,privateHeaders} from '../lib/calendar-bridge/security.js';
import {monthWindow,eventsByDay,dayDots} from '../lib/calendar-bridge/dots.js';
import {widgetSnapshot} from '../lib/calendar-bridge/widget-data.js';
import {widgyFields} from '../lib/calendar-bridge/widgy-fields.js';
import {flightProfiles,presentAgenda,agendaPresentationFields} from '../lib/calendar-bridge/agenda-presentation.js';
import {sourceZone} from '../lib/calendar-bridge/source-timezones.js';
import {preparedDaysFor} from '../lib/calendar-bridge/prepared-days.js';
import {homeAgenda,homeAgendaFields} from '../lib/calendar-bridge/home-agenda.js';
import {calendarGrid} from '../lib/calendar-bridge/calendar-grid.js';
import {createProviderCache} from '../lib/calendar-bridge/provider-cache.js';

const rule={title:'Flight to Test City (XX 100)',start:'2026-11-08T06:30:00+02:00',end:'2026-11-08T09:15:00+02:00',
 departure:{zone:'Asia/Jerusalem',airport:'TLV'},arrival:{zone:'Asia/Dubai',airport:'AUH'}};
const encode=rules=>Buffer.from(JSON.stringify(rules)).toString('base64url');
const profiles=flightProfiles(encode([rule]));
const flight={uid:'flight-fixture',title:rule.title,start:rule.start,end:rule.end,allDay:false,color:0};
const stay={uid:'stay-fixture',title:'Stay fixture',start:'2026-11-08',end:'2026-11-11',allDay:true,color:1};
function snapshot(events,at,zone){
 const now=new Date(at),window=monthWindow({now,zone}),days=eventsByDay(events,window);
 return {window,days,data:presentAgenda(widgetSnapshot(events,window,now,days),days,profiles)};
}
test('India midnight excludes the completed previous-day flight but retains a multi-day stay',()=>{
 const at='2026-11-08T18:30:01Z';
 const local=snapshot([flight,stay],at,'Asia/Kolkata');
 assert.equal(local.data.date,'2026-11-09');assert.deepEqual(local.data.rows.map(r=>r.title),['Stay fixture']);
 assert.equal(local.data.rows[0].start,'');assert.equal(local.data.rows[0].flight,0);
 assert.equal(local.data.total,dayDots([flight,stay],local.window,local.days).find(d=>d.date===local.data.date).count);
 assert.equal(snapshot([flight,stay],at,'Asia/Jerusalem').data.rows.length,2);
 assert.equal(local.data.validUntil,Date.parse('2026-11-09T18:30:00Z'));
 assert.equal(snapshot([stay],'2026-11-10T18:30:00Z','Asia/Kolkata').data.rows.length,0,'exclusive checkout date');
});
test('confirmed flight retains departure local time and uses arrival local time in every viewer zone',()=>{
 for(const zone of ['Asia/Kolkata','Asia/Dubai','Asia/Jerusalem','UTC']){
  const row=snapshot([flight],'2026-11-08T08:00:00Z',zone).data.rows[0];
  assert.equal(row.start,'06:30');assert.equal(row.end,'11:15');assert.equal(row.flight,1);
  assert.equal(row.startLabel,'TLV');assert.equal(row.endLabel,'AUH');
 }
});
test('ordinary events use viewer-local HH:mm; no airplane inferred from title or fromGmail',()=>{
 for(const title of ['Meeting','Holiday planning','Flight planning meeting','Flight to Other City (XX 200)',rule.title]){
  const event={...flight,title,start:'2026-11-08T15:00:00+02:00',end:'2026-11-08T16:00:00+02:00',providerEventType:'fromGmail'};
  const row=snapshot([event],'2026-11-08T08:00:00Z','Asia/Kolkata').data.rows[0];
  assert.equal(row.flight,0);assert.equal(row.start,'18:30');assert.equal(row.end,'19:30');
  assert.equal(row.startLabel,'START');assert.equal(row.endLabel,'END');
 }
});
test('confirmation does not carry to another date, edited duration, or all-day event',()=>{
 for(const event of [{...flight,end:'2026-11-08T09:16:00+02:00'},
  {...flight,start:'2026-11-09T06:30:00+02:00',end:'2026-11-09T09:15:00+02:00'},
  {...stay,title:flight.title}]){
  const date=event.start.slice(0,10)+'T12:00:00Z';
  assert.equal(snapshot([event],date,'Asia/Kolkata').data.rows[0].flight,0);
 }
});
test('overnight timed events remain on both overlapping days, ending exactly at midnight is exclusive',()=>{
 const event={...flight,title:'Night work',start:'2026-11-08T23:30:00+05:30',end:'2026-11-09T01:00:00+05:30'};
 assert.equal(snapshot([event],'2026-11-08T18:31:00Z','Asia/Kolkata').data.rows.length,1);
 assert.equal(snapshot([{...event,end:'2026-11-09T00:00:00+05:30'}],'2026-11-08T18:31:00Z','Asia/Kolkata').data.rows.length,0);
});
test('flight labels handle next-day arrivals and date-line travel, without fixed hour offsets',()=>{
 for(const value of [
  {...rule,start:'2026-11-08T22:30:00+02:00',end:'2026-11-09T01:00:00+02:00'},
  {...rule,start:'2026-11-09T01:00:00+09:00',end:'2026-11-09T10:00:00+09:00',departure:{zone:'Asia/Tokyo',airport:'HND'},arrival:{zone:'Pacific/Honolulu',airport:'HNL'}}]){
  const event={...flight,...value},now=new Date(value.start),window=monthWindow({now,zone:'UTC'}),days=eventsByDay([event],window);
  const row=presentAgenda(widgetSnapshot([event],window,now,days),days,flightProfiles(encode([value]))).rows[0];
  assert.equal(row.start,DateTime.fromISO(value.start).setZone(value.departure.zone).toFormat('HH:mm'));
  assert.equal(row.end,DateTime.fromISO(value.end).setZone(value.arrival.zone).toFormat('HH:mm'));
  assert.match(row.endLabel,value.arrival.airport==='AUH'?/\+1d$/:/-1d$/);
 }
});
test('local midnight and month rollover work across DST zones and 30/45-minute offsets',()=>{
 for(const zone of ['Asia/Kolkata','Asia/Kathmandu','Australia/Adelaide','America/New_York','Pacific/Auckland'])
 for(const date of ['2026-11-01','2026-11-09','2027-01-01']){
  const local=DateTime.fromISO(date,{zone}).startOf('day'),previous=local.minus({days:1}).toISODate();
  const old={...flight,title:'Previous day',start:previous+'T10:00:00'+local.minus({days:1}).toFormat('ZZ'),end:previous+'T11:00:00'+local.minus({days:1}).toFormat('ZZ')};
  const result=snapshot([old],local.plus({seconds:1}).toISO(),zone).data;
  assert.equal(result.date,date);assert.equal(result.total,0);assert.equal(result.validUntil,local.plus({days:1}).toMillis());
 }
});
test('malformed flight facts fail closed and empty fields clear all four rows',()=>{
 for(const bad of ['?',encode({}),encode([{...rule,arrival:{zone:'invalid',airport:'AUH'}}]),encode([{...rule,end:rule.start}]),encode([{...rule,start:'2026-11-08T06:30:00'}])])
  assert.throws(()=>flightProfiles(bad),/invalid_flight_profile/);
 assert.deepEqual(flightProfiles(''),[]);
 assert(Object.values(agendaPresentationFields(null)).every(v=>v===0 || v===''));
});
test('Home uses confirmed departure, while day membership follows the phone',()=>{
 const {data,days}=snapshot([flight],'2026-11-08T03:00:00Z','Asia/Kolkata');
 assert.match(homeAgenda(days,data,profiles).title,/^06:30/);
 const midnight=snapshot([flight,stay],'2026-11-08T18:30:01Z','Asia/Kolkata');
 assert.equal(homeAgenda(midnight.days,midnight.data,profiles).title,'All day · Stay fixture');
});
test('handler authenticates first, isolates day-zone caches, and preserves legacy behavior',async()=>{
 let time=Date.parse('2026-11-08T18:30:01Z'),reads=0;
 class Clock extends Date{constructor(...args){super(...(args.length?args:[time]));}static now(){return time;}}
 const code=readFileSync(new URL('../api/calendar-widget.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('export default async function handler','async function handler').replace('export function clientMaxAge','function clientMaxAge');
 const handler=vm.runInNewContext(code+'\nhandler',{Date:Clock,URL,performance,createHash,BridgeError,privateHeaders,monthWindow,
  widgetSnapshot,widgyFields,preparedDaysFor,homeAgenda,homeAgendaFields,calendarGrid,sourceZone,flightProfiles,presentAgenda,agendaPresentationFields,
  console:{info(){}},origin:()=> 'https://example.invalid',cachedEvents:createProviderCache({now:()=>time}),
  unseal:async token=>{if(token!=='test')throw new BridgeError('unauthorized',401);return {zone:'Asia/Jerusalem',sources:[{provider:'google',id:'fixture',color:0}]};},
  readEvents:async()=>{reads++;return [flight,stay];}});
 const request=async(query='',token='test')=>{
  const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(body){this.body=body;return this;}};
  await handler({method:'GET',url:'/api/calendar-widget?token='+token+'&format=widgy&agenda=home-v1'+query},res);return res;
 };
 assert.equal((await request('&day_zone=bad','no')).code,401);assert.equal(reads,0);
 const legacy=await request();assert.equal(legacy.code,200);assert.equal(legacy.body.calendar_remaining_today,2);
 const local=await request('&day_zone=Asia/Kolkata&presentation=agenda-v2&flights='+encode([rule]));
 assert.equal(local.code,200);assert.equal(local.body.calendar_agenda_date,'2026-11-09');assert.equal(local.body.calendar_remaining_today,1);
 assert.equal(local.body.calendar_event_2_title,'');assert.equal(local.body.calendar_event_2_flight,0);
 assert.equal(reads,2,'different day-zone cache keys');
 assert.equal((await request('&day_zone=Asia/Kolkata')).code,200);assert.equal(reads,2);
 assert.equal((await request('&day_zone=${widgy.calendar_device_zone}&presentation=agenda-v2')).code,400);
 assert.equal((await request('&day_zone=&presentation=agenda-v2')).code,400);
 assert.equal((await request()).body.calendar_remaining_today,2,'legacy cache intact');
});
