import assert from 'node:assert/strict';
import {DateTime} from 'luxon';
import {monthWindow,icalEvents,eventsByDay,renderDots} from '../lib/calendar-bridge/dots.js';
import {yearProviderWindow,yearPreparedDaysFor,createYearRangeReader} from '../lib/calendar-bridge/year-provider-window.js';
import {monthViewEntry} from '../lib/calendar-bridge/month-provider-window.js';
import {widgetSnapshot} from '../lib/calendar-bridge/widget-data.js';

let coverage=0;
for(let year=2000;year<2400;year++) {
  const now=new Date(Date.UTC(year,5,15,12)),zone='UTC',keys=new Set();
  for(let offset=-5;offset<=6;offset++) {
    const month=monthWindow({offset,zone,now}),range=yearProviderWindow({offset,zone,now});
    assert.equal(range.month.year,year);assert.equal(range.month.month,1);
    assert(range.start<=month.start && range.end>=month.end);
    assert([53,54].includes(range.weeks));assert.equal(range.end.diff(range.start,'days').days,range.weeks*7);
    keys.add(range.start.toISO()+'|'+range.end.toISO());coverage++;
  }
  assert.equal(keys.size,1);
}
for(const offset of [-13,13,NaN,0.5])assert.throws(()=>yearProviderWindow({offset}));
let pngs=0;
for(const zone of ['Asia/Jerusalem','America/New_York','Pacific/Kiritimati'])for(const stamp of ['2024-02-29T12:00:00Z','2026-11-05T08:00:00Z','2026-12-31T23:30:00Z']) {
  const now=new Date(stamp),local=DateTime.fromJSDate(now,{zone}),year=local.year;
  const source={provider:'icloud',id:'fixture',color:1};
  const ics=['BEGIN:VCALENDAR','VERSION:2.0',
    'BEGIN:VEVENT','UID:weekly','SUMMARY:Weekly','DTSTART:'+(year-1)+'1201T100000Z','DTEND:'+(year-1)+'1201T110000Z','RRULE:FREQ=WEEKLY;COUNT=70','END:VEVENT',
    'BEGIN:VEVENT','UID:monthly','SUMMARY:Monthly','DTSTART:'+year+'0105T100000Z','DTEND:'+year+'0105T110000Z','RRULE:FREQ=MONTHLY;COUNT=12','END:VEVENT',
    'BEGIN:VEVENT','UID:monthly','RECURRENCE-ID:'+year+'0305T100000Z','SUMMARY:Moved override','DTSTART:'+year+'0403T100000Z','DTEND:'+year+'0403T110000Z','END:VEVENT',
    'BEGIN:VEVENT','UID:all-day','SUMMARY:חג','DTSTART;VALUE=DATE:'+year+'0228','DTEND;VALUE=DATE:'+year+'0303','END:VEVENT',
    'BEGIN:VEVENT','UID:year-edge','SUMMARY:Across year','DTSTART;VALUE=DATE:'+(year-1)+'1228','DTEND;VALUE=DATE:'+year+'0105','END:VEVENT',
    'BEGIN:VEVENT','UID:cancelled','SUMMARY:Cancelled','STATUS:CANCELLED','DTSTART:'+year+'0601T120000Z','DTEND:'+year+'0601T130000Z','END:VEVENT','END:VCALENDAR'].join('\r\n');
  const range=yearProviderWindow({zone,now}),events=icalEvents([{data:ics}],source,range),entry={},views=[];
  let sharedIndex;
  for(let month=1;month<=12;month++) {
    const window=monthWindow({offset:month-local.month,zone,now});
    const original=icalEvents([{data:ics}],source,window),expected=eventsByDay(original,window);
    const actual=yearPreparedDaysFor(entry,events,window,range);
    assert.deepEqual(actual,expected);
    assert.deepEqual(widgetSnapshot(events,window,now,actual),widgetSnapshot(original,window,now,expected));
    if(sharedIndex)assert.equal(entry.dayIndex.days,sharedIndex);sharedIndex=entry.dayIndex.days;
    const view=monthViewEntry(entry,window,12);assert(!views.includes(view));views.push(view);
    if(zone==='Asia/Jerusalem')for(const bounds of ['grid','full']) {
      const left=await renderDots(original,window,{bounds,preparedDays:expected});
      const right=await renderDots(events,window,{bounds,preparedDays:actual});assert(left.equals(right));pngs++;
    }
  }
  assert.equal(entry.monthViews.size,12);
  for(let month=1;month<=12;month++)assert.equal(monthViewEntry(entry,monthWindow({offset:month-local.month,zone,now}),12),views[month-1]);
  monthViewEntry(entry,monthWindow({offset:12,zone,now}),12);assert.equal(entry.monthViews.size,12);
}

// High overlap must not retain hundreds of thousands of annual day references.
const now=new Date('2026-06-01T12:00:00Z'),zone='Asia/Jerusalem',window=monthWindow({zone,now}),range=yearProviderWindow({zone,now});
const dense=Array.from({length:160},(_,i)=>({uid:String(i),source:'dense',color:0,title:'Long',allDay:true,start:'2025-12-01',end:'2027-02-01'}));
const entry={};
assert.deepEqual(yearPreparedDaysFor(entry,dense,window,range),eventsByDay(dense,window));
assert.equal(entry.dayIndex,undefined);assert.equal(entry.yearIndexSkipped.events,dense);
assert.deepEqual(yearPreparedDaysFor(entry,dense,window,range),eventsByDay(dense,window));
assert.throws(()=>yearPreparedDaysFor({},[],monthWindow({offset:12,zone,now}),range));

// Capacity fallback is bounded, does not slide on hits, and is never used to
// conceal a general provider/auth failure or turn failure into empty events.
let time=1000,attempts=0,monthly=0;
const reader=createYearRangeReader({now:()=>time});
const wide=async()=>{attempts++;throw Object.assign(Error('dense'),{code:'event_limit'});};
const narrow=async()=>{monthly++;return {entry:{},state:'MISS'};};
assert.equal((await reader('account-year',wide,narrow)).rangeFallback,true);
time+=30000;await reader('account-year',wide,narrow);assert.equal(attempts,1);
time+=30000;await reader('account-year',wide,narrow);assert.equal(attempts,2);assert.equal(monthly,3);
await assert.rejects(reader('outage',async()=>{throw Object.assign(Error('outage'),{code:'google_read_failed'});},narrow));assert.equal(monthly,3);
for(let i=0;i<51;i++)await reader('bounded-'+i,wide,narrow);
const before=attempts;await reader('account-year',wide,narrow);assert.equal(attempts,before+1);
console.log(`PASS: ${coverage} full-year month coverage cases, leap/DST/year edges, shared bounded annual day index, 12 isolated month views, capacity cooldown; ${pngs} identical PNG pairs.`);
