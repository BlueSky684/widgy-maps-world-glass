import test from 'node:test';
import assert from 'node:assert/strict';
import {GOOGLE_EVENT_FIELDS,googlePages,readEvents} from '../lib/calendar-bridge/providers.js';
import {googleEvents,monthWindow,eventsByDay} from '../lib/calendar-bridge/dots.js';
import {widgetSnapshot} from '../lib/calendar-bridge/widget-data.js';

const now=new Date('2026-11-06T12:00Z'),window=monthWindow({now});
const source={id:'synthetic@example.test',provider:'google',color:0};
const full=[
 {id:'1',iCalUID:'one',summary:'Event title',location:'Room 2',status:'confirmed',start:{dateTime:'2026-11-06T15:00:00+02:00',timeZone:'Asia/Jerusalem'},end:{dateTime:'2026-11-06T16:00:00+02:00'},description:'unused '.repeat(1000),attendees:[{email:'synthetic-attendee@example.test'}]},
 {id:'2',summary:'All day',start:{date:'2026-11-06'},end:{date:'2026-11-08'},attachments:[{title:'Unused metadata'}]},
 {id:'3',status:'cancelled',start:{date:'2026-11-06'},end:{date:'2026-11-07'}},
 {id:'4',start:{dateTime:'2026-11-05T23:00:00Z'},end:{dateTime:'2026-11-06T23:00:00Z'}},
];
const project=items=>items.map(item=>Object.fromEntries(Object.entries(item).filter(([key])=>['id','iCalUID','status','summary','location','start','end'].includes(key))));

test('partial Google resource preserves normalized events, dates, counts and TODAY exactly',()=>{
 const before=googleEvents(full,source),after=googleEvents(project(full),source);
 assert.deepEqual(after,before);
 assert.deepEqual(eventsByDay(after,window),eventsByDay(before,window));
 assert.deepEqual(widgetSnapshot(after,window,now),widgetSnapshot(before,window,now));
 assert(Buffer.byteLength(JSON.stringify(project(full)))<Buffer.byteLength(JSON.stringify(full)));
});

test('selected fields are sent on every page and nextPageToken is retained',async()=>{
 let calls=0;
 const items=await googlePages('calendars/synthetic/events',{fields:GOOGLE_EVENT_FIELDS},'synthetic-access',async input=>{
  const url=new URL(input);assert.equal(url.searchParams.get('fields'),GOOGLE_EVENT_FIELDS);calls++;
  return Response.json(url.searchParams.has('pageToken')?{items:project(full.slice(2))}:{items:project(full.slice(0,2)),nextPageToken:'page-two'});
 });
 assert.equal(calls,2);assert.deepEqual(googleEvents(items,source),googleEvents(full,source));
});

test('real readEvents integration opts in only event queries and keeps source settings',async()=>{
 const old=globalThis.fetch;let pages=0;
 globalThis.fetch=async input=>{
  const url=new URL(input);
  if(url.hostname==='oauth2.googleapis.com')return Response.json({access_token:'synthetic',expires_in:3600});
  pages++;assert.equal(url.searchParams.get('fields'),GOOGLE_EVENT_FIELDS);
  assert.equal(url.searchParams.get('singleEvents'),'true');assert.equal(url.searchParams.get('showDeleted'),'false');
  assert.equal(url.searchParams.get('orderBy'),'startTime');assert.equal(url.searchParams.get('timeZone'),window.zone);
  return Response.json({items:project(full)});
 };
 try {
  const result=await readEvents({google:{refresh:'synthetic-field-mask'},sources:[source]},window);
  assert.deepEqual(result,googleEvents(full,source));assert.equal(pages,1);
 }finally{globalThis.fetch=old;}
});
