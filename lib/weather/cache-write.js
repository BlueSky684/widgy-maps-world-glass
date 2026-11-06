// Cache persistence is optional work after a complete provider response.
// Bound its background lifetime and absorb sync/async failures. The returned
// promise also keeps the completed single-flight reusable briefly, so adjacent
// JSON/image requests do not refetch while the cache write is still in flight.
export function persistWeatherCache(work,schedule,ms=400){
  let timer;
  const operation=Promise.resolve().then(work).catch(()=>{});
  const settled=Promise.race([operation,new Promise(resolve=>{timer=setTimeout(resolve,ms);})]).finally(()=>clearTimeout(timer));
  try{schedule(settled);}catch{}
  return settled;
}
