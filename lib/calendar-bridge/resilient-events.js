import {createHash} from 'node:crypto';
import {getCache} from '@vercel/functions';
import {createAnnualProviderCache} from './annual-provider-cache.js';
import {createYearRangeReader} from './year-provider-window.js';
import {preparedDaysFor} from './prepared-days.js';
import {readEvents} from './providers.js';

const CAPACITY=new Set(['event_limit','provider_response_too_large','recurrence_limit']);
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
// Each selected calendar publishes only a validated complete read. Failed
// refreshes never overwrite it with an empty or partial result. Source caches
// are scoped by the authenticated sealed link, exact range, zone and color.
// The shared store is bounded/evictable, not a durable database or a promise of
// availability. 24h is a last-good DOTS fallback; TODAY enrichment needs fresh data.
export function createResilientEvents({read=readEvents,now=Date.now,...options}={}) {
  const cached=createAnnualProviderCache({
    remote:()=>getCache({namespace:'widgy-calendar-source-v1'}),
    now,ioMs:600,freshMs:60000,retainMs:86400000,maxMemory:200,maxPending:48,...options
  });
  const ranges=createYearRangeReader({now}),merged=new Map();
  return async function readSources(scope,state,window,range,{requireFresh=false}={}) {
    const sources=state.sources || [];
    const results=await Promise.allSettled(sources.map(async source=>{
      const sourceState={...state,sources:[source]};
      const keyFor=r=>hash([scope,source,r.zone,r.start.toISO(),r.end.toISO()]);
      const annualKey=keyFor(range);
      const fetchRange=r=>cached(keyFor(r),()=>read(sourceState,r),{
        requireFresh,
        canServeStale:error=>!requireFresh && !CAPACITY.has(error?.code),
        prepareSnapshot:entry=>preparedDaysFor(entry,entry.events,r)
      });
      return ranges(annualKey,()=>fetchRange(range),()=>fetchRange(window));
    }));
    const good=results.filter(r=>r.status==='fulfilled').map(r=>r.value);
    const failed=results.filter(r=>r.status==='rejected');
    // Never describe missing providers as a successful complete TODAY snapshot.
    if(!good.length || requireFresh && failed.length)throw failed[0]?.reason || Error('calendar_read_failed');
    const rangeFallback=good.some(r=>r.rangeFallback);
    const key=hash([scope,range.zone,range.start.toISO(),range.end.toISO(),
      rangeFallback?[window.start.toISO(),window.end.toISO()]:null]);
    const signature=results.map(r=>r.status==='fulfilled'?r.value.entry.revision:'missing').join(':');
    let entry=merged.get(key);
    if(!entry || entry.revision!==signature) {
      const events=good.flatMap(r=>r.entry.events);
      // Share derived month images/indexes across concurrent response wrappers.
      // Freshness remains per response; a content revision gets a new cache.
      entry={events,pending:Promise.resolve(events),revision:signature,renderCache:{}};
    }
    // Do not mutate freshness on an entry held by an in-flight response.
    entry={...entry,until:Math.min(...good.map(r=>r.entry.until)),
      startedAt:Math.min(...good.map(r=>r.entry.startedAt))};
    merged.delete(key);merged.set(key,entry);
    while(merged.size>50)merged.delete(merged.keys().next().value);
    const stale=good.filter(r=>r.entry.until<=now()).length;
    const refreshFailed=good.some(r=>r.state==='STALE-ERROR');
    return {entry,rangeFallback,state:failed.length?'PARTIAL':refreshFailed?'STALE-ERROR':stale?'STALE':'SOURCE-CACHE',
      availability:failed.length?'partial':refreshFailed?'refresh-failed':stale?'refreshing':'current',
      missingSources:failed.length,staleSources:stale};
  };
}
export const resilientEvents=createResilientEvents();
