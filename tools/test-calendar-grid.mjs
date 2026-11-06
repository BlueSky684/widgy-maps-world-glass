import test from 'node:test';
import assert from 'node:assert/strict';
import {DateTime} from 'luxon';
import {calendarGrid} from '../lib/calendar-bridge/calendar-grid.js';
import {monthWindow,eventsByDay} from '../lib/calendar-bridge/dots.js';
import {yearProviderWindow} from '../lib/calendar-bridge/year-provider-window.js';

test('immutable date grids exactly match old arithmetic across DST, leap years and skipped dates',()=>{
  for(const zone of ['Asia/Jerusalem','UTC','America/New_York','Pacific/Auckland','Pacific/Apia','America/Havana'])
  for(const stamp of ['2011-12-15T12:00Z','2024-02-29T12:00Z','2026-03-15T12:00Z','2026-11-06T12:00Z'])
  for(const make of [monthWindow,yearProviderWindow]) {
    const window=make({zone,now:new Date(stamp)});
    const expected=Array.from({length:window.weeks*7},(_,i)=>{
      const date=window.start.plus({days:i}).toISODate(),start=DateTime.fromISO(date,{zone});
      return {date,startMs:start.toMillis(),endMs:start.plus({days:1}).toMillis()};
    });
    const actual=calendarGrid(window);
    assert.deepEqual(actual,expected);assert.equal(calendarGrid(window),actual);
    assert(Object.isFrozen(actual));assert(actual.every(Object.isFrozen));
    assert.throws(()=>actual[0].date='changed');
  }
});

test('cached grids contain no events and cannot mix accounts or revisions',()=>{
  const window=monthWindow({now:new Date('2026-11-06T12:00Z')}),grid=calendarGrid(window);
  const event={uid:'a',source:'private-source',title:'private-title',color:0,start:'2026-11-06',end:'2026-11-07'};
  const a=eventsByDay([event],window),b=eventsByDay([],window);
  assert(a.some(d=>d.events.length));assert(b.every(d=>d.events.length===0));
  a[0].events.push(event);
  assert(eventsByDay([],window).every(d=>d.events.length===0));
  assert.equal(calendarGrid(window),grid);assert(!JSON.stringify(grid).includes('private'));
  assert(grid.every(d=>Object.keys(d).sort().join(',')==='date,endMs,startMs'));
});

test('grid cache is bounded and distinct years and time zones remain isolated',()=>{
  const window=monthWindow({now:new Date('2000-01-15T12:00Z')}),first=calendarGrid(window);
  const utc=calendarGrid({...window,zone:'UTC'});assert.notEqual(first,utc);
  for(let year=2001;year<=2033;year++)calendarGrid(monthWindow({now:new Date(Date.UTC(year,0,15,12))}));
  const reloaded=calendarGrid(window);assert.notEqual(reloaded,first);assert.deepEqual(reloaded,first);
});
