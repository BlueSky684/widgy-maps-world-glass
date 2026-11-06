// Only the explicit, seven-field Home projection opts into device reuse.
// No server/provider lifetime changes; errors and stale fallbacks stay no-store.
export function homeClientMaxAge(result,now=Date.now()) {
  if(result?.state!=='fresh' || !Number.isFinite(result.freshUntil) ||
    !Number.isFinite(now) || !Number.isFinite(result.data?.at) || typeof result.data?.zone!=='string')return 0;
  // The minute boundary also prevents reuse across normal hour/date changes.
  let until=Math.min(now+30000,result.freshUntil,
    (Math.floor(now/60000)+1)*60000,result.data.at+3*3600000);
  for(const day of result.data.days || [])for(const key of ['sunriseAt','sunsetAt']) {
    if(Number.isFinite(day[key]) && day[key]>now)until=Math.min(until,day[key]);
  }
  if(until<=now)return 0;
  try {
    // Includes historical zones whose UTC offset was not a whole minute.
    const date=new Intl.DateTimeFormat('en-CA',{timeZone:result.data.zone,year:'numeric',month:'2-digit',day:'2-digit'});
    if(date.format(now)!==date.format(until-1))return 0;
  }catch{return 0;}
  return Math.max(0,Math.floor((until-now)/1000));
}
