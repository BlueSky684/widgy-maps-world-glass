// Cache completed images and join identical work already in progress. The
// input key includes the full forecast and all presentation/AQI options.
export function createRenderCache({clock=Date.now,maxEntries=24,ttlMs=300000}={}){
  const ready=new Map(),pending=new Map();
  return {
    acquire(key,produce){
      const now=clock();
      for(const [id,entry] of ready)if(entry.until<=now)ready.delete(id);
      const hit=ready.get(key);
      if(hit){
        ready.delete(key);ready.set(key,hit);
        return {state:'HIT',value:Promise.resolve(hit.value)};
      }
      if(pending.has(key))return {state:'JOIN',value:pending.get(key)};
      // Bound retained keys even if many distinct locations arrive together.
      // Untracked work still returns the complete result to its caller.
      const tracked=pending.size<maxEntries;
      const promise=Promise.resolve().then(produce).then(value=>{
        if(tracked){
          if(ready.size>=maxEntries)ready.delete(ready.keys().next().value);
          ready.set(key,{value,until:clock()+ttlMs});
        }
        return value;
      }).finally(()=>{
        if(tracked&&pending.get(key)===promise)pending.delete(key);
      });
      if(tracked)pending.set(key,promise);
      return {state:'MISS',value:promise};
    }
  };
}
