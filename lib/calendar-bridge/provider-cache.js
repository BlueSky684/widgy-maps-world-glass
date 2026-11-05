import {getCache,waitUntil} from '@vercel/functions';

const FRESH_MS=60000, MAX_MEMORY=50, IO_MS=120;
const bounded=(work,ms)=>{
  let timer;
  return Promise.race([Promise.resolve().then(work),new Promise((_,reject)=>{
    timer=setTimeout(()=>reject(Error('cache_timeout')),ms);
  })]).finally(()=>clearTimeout(timer));
};

// The caller authenticates before using this cache and supplies the SHA-256
// of the exact sealed access token and month. No public/CDN event caching.
// Original provider deadlines survive L1/L2 reads; hits never renew freshness.
export function createProviderCache({
  remote=()=>getCache({namespace:'widgy-calendar-provider-v1'}),
  now=Date.now, background=waitUntil, ioMs=IO_MS
}={}){
  const memory=new Map();
  const valid=e=>e?.version===1 && Number.isFinite(e.startedAt) &&
    e.startedAt<=now() && e.until===e.startedAt+FRESH_MS &&
    e.until>now() && Array.isArray(e.events);
  return async function read(key,fetchEvents){
    for(const [id,e] of memory)if(e.until<=now())memory.delete(id);
    let entry=memory.get(key);
    if(entry){await entry.pending;return {entry,state:'REUSE'};}
    if(memory.size>=MAX_MEMORY)memory.delete(memory.keys().next().value);
    entry={until:now()+FRESH_MS};
    memory.set(key,entry);
    let state='MISS';
    entry.pending=(async()=>{
      let store,cached;
      try{store=remote();cached=await bounded(()=>store.get(key),ioMs);}catch{}
      if(valid(cached)){
        entry.until=cached.until;state='SHARED';return cached.events;
      }
      const startedAt=now();entry.until=startedAt+FRESH_MS;
      const events=await fetchEvents();
      // Remote writes do not hold the widget response open. A failed or slow
      // cache is only a missed optimization, never a provider failure.
      const ttl=Math.floor((entry.until-now())/1000);
      if(store && ttl>0){
        const write=bounded(()=>store.set(key,{version:1,startedAt,until:entry.until,events},
          {ttl,name:'calendar-provider'}),ioMs).catch(()=>{});
        try{background(write);}catch{}
      }
      return events;
    })();
    try{await entry.pending;return {entry,state};}
    catch(error){if(memory.get(key)===entry)memory.delete(key);throw error;}
  };
}

export const cachedEvents=createProviderCache();
