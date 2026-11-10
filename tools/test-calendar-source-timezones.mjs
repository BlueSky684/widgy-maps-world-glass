import test from 'node:test';
import assert from 'node:assert/strict';
import {DateTime} from 'luxon';
import {googleEvents,icalEvents,monthWindow,eventsByDay,dayDots} from '../lib/calendar-bridge/dots.js';
import {widgetSnapshot} from '../lib/calendar-bridge/widget-data.js';
import {widgyFields} from '../lib/calendar-bridge/widgy-fields.js';
import {sourceTimeMetadata,withSourceTimeMetadata,sourceTimeFields} from '../lib/calendar-bridge/source-timezones.js';
import {seal} from '../lib/calendar-bridge/security.js';
import handler from '../api/calendar-widget.js';

const now=new Date('2026-11-08T08:00:00Z'),window=monthWindow({now});
const source={id:'synthetic',provider:'google',color:0};
// Synthetic route fixture: both endpoint instants may arrive in the response
// zone, while each timeZone retains its explicitly configured event zone.
const input={id:'travel-fixture',summary:'Flight to Test City (XX 100)',eventType:'fromGmail',
  start:{dateTime:'2026-11-08T06:30:00+02:00',timeZone:'Asia/Jerusalem'},
  end:{dateTime:'2026-11-08T09:15:00+02:00',timeZone:'Asia/Dubai'}};
const event=googleEvents([input],source)[0];

test('Google retains separate explicit endpoint zones and provenance without changing instants',()=>{
  assert.equal(event.start,input.start.dateTime);assert.equal(event.end,input.end.dateTime);
  const data=sourceTimeMetadata(event);
  assert.equal(data.start.time,'06:30');assert.equal(data.start.zone,'Asia/Jerusalem');
  assert.equal(data.end.time,'11:15');assert.equal(data.end.zone,'Asia/Dubai');
  assert.equal(data.providerType,'fromGmail');assert.equal(data.complete,true);
  assert(!('flight' in data));assert(!('isFlight' in event));
});

test('missing/invalid zones and floating times stay incomplete, never inferred from title/location',()=>{
  for(const zone of [undefined,'','Not/AZone','x'.repeat(200)]){
    const missing=googleEvents([{...input,end:{dateTime:input.end.dateTime,timeZone:zone}}],source)[0];
    const data=sourceTimeMetadata({...missing,location:'Test airport'});
    assert.equal(data.complete,false);assert.equal(data.end.time,'');assert.equal(data.end.zone,'');
  }
  assert.equal(sourceTimeMetadata({...event,end:'2026-11-08T11:15:00'}).end.time,'');
  const noZones=googleEvents([{...input,start:{dateTime:input.start.dateTime},end:{dateTime:input.end.dateTime}}],source)[0];
  assert.equal(sourceTimeMetadata(noZones).start.time,'');
});

test('all-day holidays and reservations have no endpoint times or flight flags',()=>{
  for(const summary of ['Holiday','Stay at Test Hotel','Flight planning day']){
    const item=googleEvents([{...input,summary,start:{date:'2026-11-08',timeZone:'Asia/Jerusalem'},end:{date:'2026-11-10',timeZone:'Asia/Dubai'}}],source)[0];
    assert.equal(item.start,'2026-11-08');assert.equal(item.end,'2026-11-10');
    assert.equal(item.startTimeZone,'');assert.equal(sourceTimeMetadata(item),null);
    const days=eventsByDay([item],window),snapshot=widgetSnapshot([item],window,now,days);
    const fields=sourceTimeFields(withSourceTimeMetadata(snapshot,days));
    assert.equal(fields.calendar_event_1_start_source_time,'');
    assert.equal(fields.calendar_event_1_end_source_time,'');
    assert.equal(fields.calendar_event_1_source_timezones_complete,0);
  }
});

test('regular meetings preserve the existing display-zone policy and time ordering',()=>{
  const meeting={...event,title:'Team meeting',providerEventType:'default',endTimeZone:'Asia/Jerusalem'};
  const days=eventsByDay([meeting],window),before=widgetSnapshot([meeting],window,now,days);
  const after=withSourceTimeMetadata(before,days);
  assert.equal(after.rows[0].start,'6:30');assert.equal(after.rows[0].end,'9:15');
  const {sourceTimes,...plain}=after.rows[0];assert.deepEqual(plain,before.rows[0]);
  assert.deepEqual(after.home,before.home);assert.equal(sourceTimes.end.time,'09:15');
  assert.equal(before.rows[0].sourceTimes,undefined);
  const originalFields=widgyFields(before),newFields=widgyFields(after);
  for(const key of Object.keys(originalFields).filter(k=>k!=='encoded'))assert.deepEqual(newFields[key],originalFields[key]);
});

test('destination-local date and DST come from time-zone rules, never a fixed added offset',()=>{
  const overnight=sourceTimeMetadata({...event,end:'2026-11-08T22:15:00+02:00'});
  assert.equal(overnight.end.date,'2026-11-09');assert.equal(overnight.end.time,'00:15');
  const summer=sourceTimeMetadata({...event,start:'2026-07-08T06:30:00+03:00',end:'2026-07-08T09:15:00+03:00'});
  assert.equal(summer.end.time,'10:15');
  const dst=sourceTimeMetadata({...event,start:'2026-10-25T01:15:00+03:00',end:'2026-10-25T01:45:00+02:00',endTimeZone:'Asia/Jerusalem'});
  assert.equal(dst.start.offset,'+03:00');assert.equal(dst.end.offset,'+02:00');
});

test('iCalendar retains DTSTART/DTEND TZID; floating and all-day values never receive invented zones',()=>{
  const fixture=(start,end)=>`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:zone-fixture\r\n${start}\r\n${end}\r\nSUMMARY:Travel fixture\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`;
  const parse=(start,end)=>icalEvents([{data:fixture(start,end)}],{...source,provider:'icloud'},window)[0];
  const travel=parse('DTSTART;TZID=Asia/Jerusalem:20261108T063000','DTEND;TZID=Asia/Dubai:20261108T111500');
  assert.equal(sourceTimeMetadata(travel).start.time,'06:30');
  assert.equal(sourceTimeMetadata(travel).end.time,'11:15');
  const floating=parse('DTSTART:20261108T063000','DTEND:20261108T091500');
  assert.equal(sourceTimeMetadata(floating).complete,false);
  const utc=parse('DTSTART:20261108T043000Z','DTEND:20261108T071500Z');
  assert.equal(sourceTimeMetadata(utc).start.zone,'UTC');
  assert.equal(sourceTimeMetadata(utc).end.time,'07:15');
  assert.equal(sourceTimeMetadata(parse('DTSTART;VALUE=DATE:20261108','DTEND;VALUE=DATE:20261109')),null);
});

test('metadata retains the existing four-row order, dots, all-day boundaries and missing-row clearing',()=>{
  const events=[event,{...event,uid:'holiday',title:'Holiday',allDay:true,start:'2026-11-08',end:'2026-11-09'},
    {...event,uid:'meeting',title:'Meeting',start:'2026-11-08T15:00:00+02:00',end:'2026-11-08T16:00:00+02:00'}];
  const days=eventsByDay(events,window),snapshot=widgetSnapshot(events,window,now,days);
  const result=withSourceTimeMetadata(snapshot,days);
  assert.deepEqual(result.rows.map(r=>r.title),snapshot.rows.map(r=>r.title));
  assert.equal(result.total,dayDots(events,window,days).find(d=>d.date===snapshot.date).count);
  assert.equal(sourceTimeFields(result).calendar_event_4_start_source_time,'');
  assert(Object.values(sourceTimeFields(null)).every(v=>v==='' || v===0));
});

test('authenticated handler exposes only opt-in metadata and clears it on unauthorized requests',async()=>{
  process.env.CALENDAR_SEAL_KEY='4'.repeat(64);
  const originalFetch=globalThis.fetch,at=DateTime.now().setZone('Asia/Jerusalem').startOf('day');
  const state={sources:[source],zone:'Asia/Jerusalem',google:{refresh:'synthetic-source-zone-refresh'}};
  const token=await seal(state,'calendar-widget');
  const request=async(query,capability=token)=>{
    const res={headers:{},statusCode:200,setHeader(k,v){this.headers[k]=v;},status(n){this.statusCode=n;return this;},json(data){this.data=data;return this;}};
    await handler({method:'GET',url:`/api/calendar-widget?token=${encodeURIComponent(capability)}&format=widgy${query}`},res);
    return res;
  };
  try{
    globalThis.fetch=async target=>new URL(target).hostname==='oauth2.googleapis.com'?
      Response.json({access_token:'synthetic-access'}):Response.json({items:[{...input,
        start:{...input.start,dateTime:at.plus({hours:6,minutes:30}).toISO()},
        end:{...input.end,dateTime:at.plus({hours:9,minutes:15}).toISO()}}]});
    const old=await request(''),opt=await request('&time_metadata=source-v1');
    assert.equal(old.statusCode,200);assert.equal(opt.statusCode,200);
    assert(!('calendar_event_1_start_source_time' in old.data));
    assert.equal(opt.data.calendar_event_1_start_source_time,'06:30');
    assert.equal(opt.data.calendar_event_1_end_source_zone,'Asia/Dubai');
    for(const key of Object.keys(old.data).filter(k=>k!=='encoded'))assert.deepEqual(opt.data[key],old.data[key]);
    const denied=await request('&time_metadata=source-v1','invalid');
    assert.equal(denied.statusCode,401);assert.equal(denied.data.calendar_event_1_end_source_time,'');
    assert.equal(opt.headers['CDN-Cache-Control'],'no-store');
    assert(!JSON.stringify(opt.data).includes('synthetic-source-zone-refresh'));
  }finally{globalThis.fetch=originalFetch;}
});
