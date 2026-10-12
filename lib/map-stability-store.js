// Small isolated diagnostic state in the already configured Redis account.
// No locations, credentials, raw URLs, headers or health/calendar data stored.
export const STATE_KEY='widgy:map-stability:15:v1';
export const STATE_LUA=`
local raw=redis.call('GET',KEYS[1])
local now=tonumber(ARGV[1])
local action=ARGV[2]
local value=cjson.decode(ARGV[3])
local s
if raw then s=cjson.decode(raw) else s={mode='a',rev=1,selectedAt=now,untilAt=0,sourceCount=0,imageCount=0,events={}} end
local function note(e)
 e.at=now
 table.insert(s.events,e)
 while #s.events>32 do table.remove(s.events,1) end
end
if s.untilAt>0 and now>=s.untilAt then
 s.mode='b';s.rev=s.rev+1;s.selectedAt=now;s.untilAt=0
 note({kind='auto-recovery',rev=s.rev,mode=s.mode})
end
if action=='set' then
 s.mode=value.mode;s.rev=s.rev+1;s.selectedAt=now;s.untilAt=0
 if s.mode=='json-error' or s.mode=='image-error' or s.mode=='slow' then s.untilAt=now+300000 end
 note({kind='control',rev=s.rev,mode=s.mode})
elseif action=='source' then
 s.sourceCount=s.sourceCount+1;s.lastSource={at=now,rev=s.rev,mode=s.mode}
 note({kind='source',rev=s.rev,mode=s.mode})
elseif action=='image' then
 s.imageCount=s.imageCount+1
 s.lastImage={at=now,rev=value.rev,asset=value.asset,behavior=value.behavior}
 note({kind='image',rev=value.rev,asset=value.asset,behavior=value.behavior})
elseif action=='observation' then
 s.observation={at=now,rev=s.rev,mode=s.mode,result=value.result}
 note({kind='observation',rev=s.rev,mode=s.mode,result=value.result})
end
local encoded=cjson.encode(s)
redis.call('SET',KEYS[1],encoded,'EX',604800)
return encoded
`;
export function createStabilityStore({env=()=>process.env,fetcher=fetch}={}){
 return async(action,value={},now=Date.now())=>{
  const e=env(),token=e.UPSTASH_REDIS_REST_TOKEN||e.KV_REST_API_TOKEN;
  const url=new URL(e.UPSTASH_REDIS_REST_URL||e.KV_REST_API_URL);
  if(url.protocol!=='https:'||!url.hostname.endsWith('.upstash.io')||url.username||url.password||url.search||url.hash||!token)throw Error('state_unavailable');
  const response=await fetcher(url,{method:'POST',redirect:'error',signal:AbortSignal.timeout(2000),headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(['EVAL',STATE_LUA,'1',STATE_KEY,String(now),action,JSON.stringify(value)])});
  if(!response.ok)throw Error('state_unavailable');const data=await response.json();
  if(data.error||typeof data.result!=='string')throw Error('state_unavailable');
  const state=JSON.parse(data.result);
  if(!Number.isInteger(state.rev)||!Number.isFinite(state.selectedAt))throw Error('state_unavailable');
  return state;
 };
}
