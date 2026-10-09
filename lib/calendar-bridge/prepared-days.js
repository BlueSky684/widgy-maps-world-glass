import {eventsByDay} from './dots.js';

// Owned by the existing private provider-cache entry, so it cannot outlive
// that entry's 60-second expiry or be shared with a different account/window.
// Event arrays returned by readEvents are immutable after the pending read.
// Keep unusually dense calendars uncached to bound additional retained refs.
export function preparedDaysFor(entry, events, window) {
  const key=JSON.stringify([window.zone,window.start.toISO(),window.end.toISO()]);
  if(entry.dayIndex?.events===events && entry.dayIndex.key===key) return entry.dayIndex.days;
  const days=eventsByDay(events,window);
  if(days.reduce((n,day)=>n+day.events.length,0)<=50000) entry.dayIndex={events,key,days};
  else delete entry.dayIndex;
  return days;
}
