import {monthWindow,eventsByDay} from './dots.js';
import {preparedDaysFor} from './prepared-days.js';

// Authenticate and validate the displayed offset as before. Pool by its local
// calendar year, including the overflow days of January and December grids.
// Reading a year does not extend the widget's navigable +/-12-month range.
export function yearProviderWindow(options={}) {
  const requested=monthWindow(options),zone=requested.zone;
  const now=requested.month.startOf('year').toJSDate();
  const first=monthWindow({zone,now}),last=monthWindow({offset:11,zone,now});
  return {...first,end:last.end,weeks:Math.round(last.end.diff(first.start,'days').days/7)};
}

// Index and order the annual events once, then take each month's exact days.
// Do not parse/sort the whole year again on each month switch. The existing
// 50,000 retained-reference ceiling still applies to this shared day index.
export function yearPreparedDaysFor(entry,events,window,range) {
  if(window.zone!==range.zone || window.start<range.start || window.end>range.end)
    throw Error('invalid_year_window');
  const key=JSON.stringify([range.zone,range.start.toISO(),range.end.toISO()]);
  if(entry.yearIndexSkipped?.events===events && entry.yearIndexSkipped.key===key)
    return eventsByDay(events,window);
  const days=preparedDaysFor(entry,events,range);
  if(entry.dayIndex?.days!==days)entry.yearIndexSkipped={events,key};
  const first=Math.round(window.start.diff(range.start,'days').days);
  return days.slice(first,first+window.weeks*7);
}

const CAPACITY_ERRORS=new Set(['event_limit','provider_response_too_large','recurrence_limit']);
// Dense accounts may fit a monthly read but exceed a provider's annual limit.
// Avoid repeating the rejected annual work on every month switch for a minute.
// This bounded, in-process hint holds hashes only; it stores no event content.
export function createYearRangeReader({now=Date.now}={}) {
  const declined=new Map();
  return async function read(key,readYear,readMonth) {
    for(const [id,until] of declined)if(until<=now())declined.delete(id);
    if(!declined.has(key)) {
      try{return {...await readYear(),rangeFallback:false};}
      catch(error) {
        if(!CAPACITY_ERRORS.has(error?.code))throw error;
        if(!declined.has(key)) {
          if(declined.size>=50)declined.delete(declined.keys().next().value);
          declined.set(key,now()+60000);
        }
      }
    }
    return {...await readMonth(),rangeFallback:true};
  };
}
export const readYearRange=createYearRangeReader();
