import {createHash} from 'node:crypto';
import {getCache,waitUntil} from '@vercel/functions';

const FRESH_MS=60000,RETAIN_MS=900000,BACKOFF_MS=15000,MAX_MEMORY=50,MAX_PENDING=16;
const digest=events=>createHash('sha256').update(JSON.stringify(events)).digest('hex');
const bounded=(work,ms)=>{
  let timer;
  return Promise.race([Promise.resolve().then(work),new Promise((_,reject)=>{
    timer=setTimeout(()=>reject(Error('cache_timeout')),ms);
  })]).finally(()=>clearTimeout(timer));
};

// Private annual snapshots: fresh for a minute, reusable for at most 15 minutes.
// Month requests can refresh in the background. TODAY can request a blocking
// refresh. A failed read never replaces a complete snapshot with partial/empty
// data. A successful empty result, including deletions, DOES replace old events.
export function createAnnualProviderCache({
  remote=()=>getCache({namespace:'widgy-calendar-annual-v2'}),
  now=Date.now,background=waitUntil,ioMs=120
}={}) {
  const memory=new Map(),pending=new Map(),loading=new Map(),failures=new Map();
  const retained=e=>e && e.startedAt<=now() && e.retainUntil>now();
  const fresh=e=>retained(e) && e.until>now();
  function prune() {
    for(const [k,e] of memory)if(!retained(e))memory.delete(k);
    for(const [k,e] of failures)if(e.at>now() || e.retryAt<=now())failures.delete(k);
  }
  function remember(key,entry) {
    const previous=memory.get(key);
    if(previous && previous.startedAt>=entry.startedAt)return previous;
    memory.delete(key);memory.set(key,entry);
    while(memory.size>MAX_MEMORY)memory.delete(memory.keys().next().value);
    return entry;
  }
  function makeEntry(events,startedAt,revision,previous) {
    const same=previous?.revision===revision;
    // Preserve expensive PNGs and the day index only for byte-identical event
    // content. The new freshness metadata is separate from in-flight readers.
    const entry={...(same?previous:{}),events:same?previous.events:events,
      revision,startedAt,until:startedAt+FRESH_MS,retainUntil:startedAt+RETAIN_MS};
    entry.pending=Promise.resolve(entry.events);
    return entry;
  }
  function validRecord(r) {
    return r?.version===2 && Number.isFinite(r.startedAt) && r.startedAt<=now() &&
      r.until===r.startedAt+FRESH_MS && r.retainUntil===r.startedAt+RETAIN_MS &&
      r.retainUntil>now() && Array.isArray(r.events) && r.revision===digest(r.events);
  }
  function defer(work) {
    const safe=work.catch(()=>{});
    try{background(safe);}catch{}
  }
  async function prepare(entry,prepareSnapshot) {
    if(prepareSnapshot && !entry.prepared) {
      await prepareSnapshot(entry);
      entry.prepared=true;
    }
    return entry;
  }
  async function loadRemote(key,prepareSnapshot) {
    if(loading.has(key))return loading.get(key);
    if(loading.size>=MAX_PENDING)return {};
    const task=(async()=>{
      let store;
      try {
        store=remote();const r=await bounded(()=>store.get(key),ioMs);
        if(validRecord(r))remember(key,await prepare(makeEntry(r.events,r.startedAt,r.revision,memory.get(key)),prepareSnapshot));
      }catch{}
      return {store};
    })();
    loading.set(key,task);
    try{return await task;}finally{if(loading.get(key)===task)loading.delete(key);}
  }
  function refresh(key,fetchEvents,loaded,prepareSnapshot) {
    if(pending.has(key))return pending.get(key);
    if(pending.size>=MAX_PENDING)return Promise.reject(Error('calendar_busy'));
    const task=(async()=>{
      const {store}=loaded || await loadRemote(key,prepareSnapshot);
      let previous=memory.get(key);
      if(fresh(previous))return {entry:previous,state:'SHARED'};
      const startedAt=now(),events=await fetchEvents();
      if(!Array.isArray(events))throw Error('invalid_calendar_snapshot');
      previous=memory.get(key);
      const revision=digest(events),candidate=makeEntry(events,startedAt,revision,previous);
      await prepare(candidate,prepareSnapshot);
      const entry=remember(key,candidate);
      failures.delete(key);
      const ttl=Math.floor((entry.retainUntil-now())/1000);
      if(entry===candidate && store && ttl>0)defer(bounded(()=>store.set(key,{
        version:2,startedAt:entry.startedAt,until:entry.until,retainUntil:entry.retainUntil,
        revision:entry.revision,events:entry.events
      },{ttl,name:'calendar-annual'}),ioMs));
      return {entry,state:previous?'REFRESH':'MISS'};
    })().catch(error=>{
      if(failures.size>=MAX_MEMORY)failures.delete(failures.keys().next().value);
      failures.set(key,{error,at:now(),retryAt:now()+BACKOFF_MS});
      throw error;
    }).finally(()=>{if(pending.get(key)===task)pending.delete(key);});
    pending.set(key,task);
    return task;
  }
  return async function read(key,fetchEvents,{requireFresh=false,canServeStale=()=>true,prepareSnapshot}={}) {
    prune();let loaded;
    if(!memory.has(key))loaded=await loadRemote(key,prepareSnapshot);
    let entry=memory.get(key);
    if(fresh(entry))return {entry,state:loaded?'SHARED':'REUSE'};
    const failure=failures.get(key);
    if(failure) {
      if(retained(entry) && canServeStale(failure.error))return {entry,state:'STALE-ERROR'};
      throw failure.error;
    }
    const work=refresh(key,fetchEvents,loaded,prepareSnapshot);
    if(retained(entry) && !requireFresh) {
      defer(work);return {entry,state:'STALE'};
    }
    try{return await work;}
    catch(error) {
      entry=memory.get(key);
      if(retained(entry) && canServeStale(error))return {entry,state:'STALE-ERROR'};
      throw error;
    }
  };
}
export const cachedAnnualEvents=createAnnualProviderCache();
