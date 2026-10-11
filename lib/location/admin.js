import {timingSafeEqual} from 'node:crypto';
import {LEDGER_KEY} from './budget.js';
// Separate operator credential is never included in the widget.
export default async function admin(req,res){
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('Vercel-CDN-Cache-Control','no-store');
  const expected=process.env.WIDGY_LOCATION_ADMIN_TOKEN||'';
  const actual=(req.headers.authorization||'').replace(/^Bearer /,'');
  if(expected.length<32||Buffer.byteLength(actual)!==Buffer.byteLength(expected)||!timingSafeEqual(Buffer.from(actual),Buffer.from(expected)))return res.status(403).json({error:'Forbidden'});
  if(req.method!=='POST')return res.status(405).end();
  const action=req.body?.action;
  let command;
  if(action==='initialize')command=['EVAL',"if redis.call('EXISTS',KEYS[1])==1 then return 0 end redis.call('HSET',KEYS[1],'_initialized','1') return 1",'1',LEDGER_KEY];
  else if(action==='status')command=['HGETALL',LEDGER_KEY];
  else return res.status(400).json({error:'Invalid action'});
  try{
    const url=new URL(process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL);
    if(url.protocol!=='https:'||!url.hostname.endsWith('.upstash.io')||url.username||url.password||url.search||url.hash)throw Error();
    const response=await fetch(url,{method:'POST',redirect:'error',signal:AbortSignal.timeout(3000),headers:{Authorization:'Bearer '+(process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN),'Content-Type':'application/json'},body:JSON.stringify(command)});
    const data=await response.json();if(!response.ok||data.error)throw Error();
    return res.status(200).json({result:data.result});
  }catch{return res.status(503).json({error:'Storage unavailable'});}
}
