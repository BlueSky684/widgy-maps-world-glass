import assert from 'node:assert/strict';
import {DateTime} from 'luxon';
import {monthWindow,icalEvents,eventsByDay,renderDots} from '../lib/calendar-bridge/dots.js';
import {monthProviderWindow,monthViewEntry} from '../lib/calendar-bridge/month-provider-window.js';
import {preparedDaysFor} from '../lib/calendar-bridge/prepared-days.js';
import {widgetSnapshot} from '../lib/calendar-bridge/widget-data.js';

let checked=0;
// Cover a complete Gregorian leap-year cycle with every supported offset.
for(let year=2000;year<2400;year++)for(const month of [1,2,3,12]) {
 const now=new Date(Date.UTC(year,month-1,15,12)),zone='UTC';
 const low=monthWindow({offset:-12,zone,now}),high=monthWindow({offset:12,zone,now});
 const buckets=new Set();
 for(let offset=-12;offset<=12;offset++) {
  const one=monthWindow({offset,zone,now}),range=monthProviderWindow({offset,zone,now});
  assert(range.start<=one.start && range.end>=one.end);
  assert(range.start>=low.start && range.end<=high.end);
  assert(range.end.diff(range.start,'days').days<=105);
  buckets.add(range.start.toISO()+'|'+range.end.toISO());checked++;
 }
 assert.equal(buckets.size,9);
}
const dates=['2024-02-29T12:00:00Z','2026-03-29T00:30:00Z','2026-10-25T00:30:00Z','2026-11-05T08:00:00Z','2026-12-31T23:30:00Z'];
let rendered=0;
for(const zone of ['Asia/Jerusalem','America/New_York','Pacific/Kiritimati'])for(const stamp of dates) {
 const now=new Date(stamp),base=DateTime.fromJSDate(now,{zone}).startOf('month');
 const first=base.minus({months:14});
 const start=first.toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
 const end=first.plus({hours:2}).toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
 const ics=['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT','UID:weekly','SUMMARY:Weekly','DTSTART:'+start,'DTEND:'+end,'RRULE:FREQ=WEEKLY;COUNT=160','END:VEVENT',
 'BEGIN:VEVENT','UID:all-day','SUMMARY:חג','DTSTART;VALUE=DATE:'+base.toFormat('yyyyMMdd'),'DTEND;VALUE=DATE:'+base.plus({days:3}).toFormat('yyyyMMdd'),'END:VEVENT','END:VCALENDAR'].join('\r\n');
 const source={provider:'icloud',id:'fixture',color:1};
 const entry={},viewObjects=new Map();
 for(const offset of [-1,0,1]) {
  const window=monthWindow({offset,zone,now}),range=monthProviderWindow({offset,zone,now});
  const one=icalEvents([{data:ics}],source,window),shared=icalEvents([{data:ics}],source,range);
  const expected=eventsByDay(one,window),view=monthViewEntry(entry,window);
  assert(![...viewObjects.values()].includes(view));viewObjects.set(offset,view);
  const actual=preparedDaysFor(view,shared,window);assert.deepEqual(actual,expected);
  assert.deepEqual(widgetSnapshot(shared,window,now,actual),widgetSnapshot(one,window,now,expected));
  if(zone==='Asia/Jerusalem')for(const bounds of ['grid','full']) {
   const a=await renderDots(one,window,{bounds,preparedDays:expected});
   const b=await renderDots(shared,window,{bounds,preparedDays:actual});assert(a.equals(b));rendered++;
  }
 }
 assert.equal(entry.monthViews.size,3);
 for(const offset of [-1,0,1])assert.equal(monthViewEntry(entry,monthWindow({offset,zone,now})),viewObjects.get(offset));
 // Even if a caller accidentally uses another month, retained render entries
 // are bounded; it can never get a different month's PNG/day index.
 monthViewEntry(entry,monthWindow({offset:2,zone,now}));assert.equal(entry.monthViews.size,3);
}
for(const offset of [-13,13,0.5,NaN])assert.throws(()=>monthProviderWindow({offset}));
console.log(`PASS: ${checked} month coverage cases, DST/year/leap boundaries, 9 provider buckets over 25 months, recurring/all-day events, distinct bounded render entries; ${rendered} byte-identical PNG comparisons.`);
