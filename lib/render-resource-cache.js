// Bounded cache for deterministic drawing resources, never for live GPS,
// solar output, snapshots or complete responses. Failed work is not cached.
export function createRenderResourceCache({maxEntries=32,maxBytes=4*1024*1024,maxPending=4}={}){
 const entries=new Map(),pending=new Map();let total=0;
 const remove=key=>{const old=entries.get(key);if(old){total-=old.bytes;entries.delete(key);}};
 return async function resource(key,build){
  if(entries.has(key)){const hit=entries.get(key);entries.delete(key);entries.set(key,hit);return hit.value;}
  if(pending.has(key))return pending.get(key);
  const work=(async()=>{
   const value=await build(),bytes=Buffer.isBuffer(value)?value.length:value.data.length;
   if(bytes<=maxBytes&&maxEntries>0){
    remove(key);while(entries.size>=maxEntries||total+bytes>maxBytes)remove(entries.keys().next().value);
    entries.set(key,{value,bytes});total+=bytes;
   }
   return value;
  })();
  const tracked=pending.size<maxPending;if(tracked)pending.set(key,work);
  try{return await work;}finally{if(tracked&&pending.get(key)===work)pending.delete(key);}
 };
}
