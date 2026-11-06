import {DateTime} from 'luxon';

// Calendar geometry only: no events, source IDs, tokens or account data.
// Retain a small number of immutable grids across provider refreshes.
const grids=new Map(),MAX_GRIDS=32;
export function calendarGrid(window) {
  const key=JSON.stringify([window.zone,window.start.toISO(),window.weeks]);
  const previous=grids.get(key);
  if(previous)return previous;
  // Preserve the original anchored date arithmetic and parsing, including
  // DST transitions and historical skipped/repeated civil dates.
  const dates=Array.from({length:window.weeks*7},(_,i)=>window.start.plus({days:i}).toISODate());
  const grid=Object.freeze(dates.map(date=>{
    const start=DateTime.fromISO(date,{zone:window.zone});
    return Object.freeze({date,startMs:start.toMillis(),endMs:start.plus({days:1}).toMillis()});
  }));
  if(window.start.isValid && Number.isInteger(window.weeks) && window.weeks>0 && window.weeks<=60 &&
      grid.every(d=>Number.isFinite(d.startMs)&&Number.isFinite(d.endMs))) {
    if(grids.size>=MAX_GRIDS)grids.delete(grids.keys().next().value);
    grids.set(key,grid);
  }
  return grid;
}
