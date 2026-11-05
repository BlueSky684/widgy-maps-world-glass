import {monthWindow} from './dots.js';

// Three adjacent display months share one provider read. The centre bucket
// contains offsets -1, 0, +1; edge buckets stay within the existing +/-12 range.
// Retain the entire Sunday-to-Saturday grid of both outer months.
export function monthProviderWindow({offset=0,zone,now=new Date()}={}) {
  monthWindow({offset,zone,now}); // Preserve validation of the requested offset.
  const center=3*Math.floor((offset+1)/3);
  const first=monthWindow({offset:Math.max(-12,center-1),zone,now});
  const last=monthWindow({offset:Math.min(12,center+1),zone,now});
  return {...first,end:last.end};
}

// Provider events are shared, but rendered PNGs and day indexes are not: each
// requested month has its own exact grid, including its overflow days.
export function monthViewEntry(entry,window,limit=3) {
  const key=JSON.stringify([window.zone,window.start.toISO(),window.end.toISO()]);
  if(!entry.monthViews)entry.monthViews=new Map();
  if(!entry.monthViews.has(key)) {
    if(entry.monthViews.size>=limit)entry.monthViews.delete(entry.monthViews.keys().next().value);
    entry.monthViews.set(key,{});
  }
  return entry.monthViews.get(key);
}
