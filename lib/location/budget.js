// One persistent ledger for this project's BDC account. Never expire/reset it
// automatically. Missing/corrupt storage stops new provider calls.
export const LEDGER_KEY='widgy:bdc:budget:v1';
export const RESERVE_LUA=`
if redis.call('HGET', KEYS[1], '_initialized') ~= '1' then return {-1,0} end
local t=redis.call('TIME')
local day=math.floor(tonumber(t[1])/86400)
local minute=math.floor(tonumber(t[1])/60)
local fields=redis.call('HGETALL',KEYS[1])
local total=0
for i=1,#fields,2 do
  local d=tonumber(fields[i])
  if d then
    local n=tonumber(fields[i+1])
    if not n or n<0 or n~=math.floor(n) or d>day then return {-1,0} end
    if d>=day-31 then total=total+n end
  end
end
local last=tonumber(redis.call('HGET',KEYS[1],'_minute') or '0')
local rate=tonumber(redis.call('HGET',KEYS[1],'_rate') or '0')
if not last or not rate or rate<0 or last>minute then return {-1,total} end
if total>=40000 then return {0,total} end
if last==minute and rate>=10 then return {2,total} end
if last~=minute then rate=0 end
for i=1,#fields,2 do
  local d=tonumber(fields[i])
  if d and d<day-31 then redis.call('HDEL',KEYS[1],fields[i]) end
end
redis.call('HINCRBY',KEYS[1],tostring(day),1)
redis.call('HSET',KEYS[1],'_minute',tostring(minute),'_rate',tostring(rate+1))
return {1,total+1}
`;
export function createBudget({env=()=>process.env,fetcher=fetch}={}) {
  return async function reserve() {
    const c=env();
    let url;
    try {url=new URL(c.UPSTASH_REDIS_REST_URL);}catch {throw Error('budget_unavailable');}
    if(url.protocol!=='https:' || !url.hostname.endsWith('.upstash.io') || url.username || url.password || url.search || url.hash || !c.UPSTASH_REDIS_REST_TOKEN)throw Error('budget_unavailable');
    let result;
    try {
      const response=await fetcher(url,{method:'POST',redirect:'error',signal:AbortSignal.timeout(1500),headers:{Authorization:'Bearer '+c.UPSTASH_REDIS_REST_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(['EVAL',RESERVE_LUA,'1',LEDGER_KEY])});
      if(!response.ok)throw Error();
      const data=await response.json();
      if(data.error || !Array.isArray(data.result))throw Error();
      result=data.result;
    }catch {throw Error('budget_unavailable');}
    if(result[0]===0)throw Error('budget_exhausted');
    if(result[0]===2)throw Error('budget_rate_limited');
    if(result[0]!==1 || !Number.isInteger(result[1]) || result[1]<1 || result[1]>40000)throw Error('budget_unavailable');
    return {used:result[1],limit:40000};
  };
}
export const reserveBudget=createBudget();
