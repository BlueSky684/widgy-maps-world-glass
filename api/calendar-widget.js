import {createHash} from 'node:crypto';
import {BridgeError,origin,privateHeaders,unseal} from '../lib/calendar-bridge/security.js';
import {monthWindow,renderDots} from '../lib/calendar-bridge/dots.js';
import {readEvents} from '../lib/calendar-bridge/providers.js';
import {widgetSnapshot} from '../lib/calendar-bridge/widget-data.js';
import {widgyFields} from '../lib/calendar-bridge/widgy-fields.js';

const cache=new Map();
export function clientMaxAge(snapshot,providerUntil,instant=Date.now()){
  // Reuse identical sequential Home field requests on the device only.
  // Never keep a response beyond a provider refresh or an event transition.
  return Math.max(0,Math.floor(Math.min(30000,providerUntil-instant,
    snapshot.validUntil-instant,snapshot.home.validUntil-instant)/1000));
}
export default async function handler(req,res) {
  const started=performance.now();
  privateHeaders(res);
  let nativeFields=false;
  try {
    if (req.method!=='GET' && req.method!=='HEAD') throw new BridgeError('method_not_allowed',405);
    const url=new URL(req.url,origin()),token=url.searchParams.get('token');
    nativeFields=url.searchParams.get('format')==='widgy';
    // Older dots-only links must never grant access to titles or locations.
    const state=await unseal(token,'calendar-widget');
    if (!state?.sources?.length || state.sources.length>6) throw new BridgeError('unauthorized',401);
    const view=url.searchParams.get('view') || 'today';
    if (!['today','dots'].includes(view)) throw new BridgeError('invalid_view');
    const bounds=url.searchParams.get('bounds') || 'full';
    if(!['full','grid'].includes(bounds) || (view!=='dots' && bounds!=='full'))throw new BridgeError('invalid_bounds');
    const raw=url.searchParams.get('offset') || '0';
    if (!/^-?\d{1,2}$/.test(raw) || (view==='today' && Number(raw)!==0)) throw new BridgeError('invalid_month');
    const now=new Date(),window=monthWindow({offset:Number(raw),zone:state.zone,now});
    const key=createHash('sha256').update(`${token}:${window.month.toISODate()}`).digest('hex');
    for(const [id,value] of cache) if(value.until<Date.now()) cache.delete(id);
    let entry=cache.get(key);
    const providerCache=entry?'REUSE':'MISS';
    if(!entry){
      if(cache.size>=50)cache.delete(cache.keys().next().value);
      entry={pending:readEvents(state,window),until:Date.now()+60000};cache.set(key,entry);
      entry.pending.catch(()=>cache.delete(key));
    }
    const events=await entry.pending;
    if(view==='today'){
      const snapshot=widgetSnapshot(events,window,new Date());
      const maxAge=clientMaxAge(snapshot,entry.until);
      if(maxAge>0)res.setHeader('Cache-Control',`private, max-age=${maxAge}, must-revalidate`);
      res.setHeader('Content-Type','application/json; charset=utf-8');
      res.setHeader('X-Calendar-Provider-Cache',providerCache);
      res.setHeader('Server-Timing',`calendar;dur=${(performance.now()-started).toFixed(1)}`);
      return req.method==='HEAD'?res.status(200).end():res.status(200).json(nativeFields?widgyFields(snapshot):snapshot);
    }
    const pngKey=bounds==='grid'?'pngGrid':'png';
    if(!entry[pngKey])entry[pngKey]=renderDots(events,window,{bounds});
    const png=await entry[pngKey];
    // Reuse month dots on the device within the same provider freshness window.
    // privateHeaders continues to forbid shared/CDN caching of private calendars.
    const remaining=Math.max(0,Math.floor((entry.until-Date.now())/1000));
    res.setHeader('Cache-Control',`private, max-age=${Math.min(30,remaining)}, must-revalidate`);
    res.setHeader('Content-Type','image/png');
    res.setHeader('X-Calendar-Provider-Cache',providerCache);
    res.setHeader('Server-Timing',`calendar;dur=${(performance.now()-started).toFixed(1)}`);
    res.setHeader('X-Calendar-Generated-For',window.month.toFormat('yyyy-MM'));
    return req.method==='HEAD'?res.status(200).end():res.status(200).send(png);
  } catch(error) {
    return res.status(error instanceof BridgeError?error.status:502).json({
      ...(nativeFields?widgyFields(null):{}),error:error instanceof BridgeError?error.code:'calendar_read_failed'});
  }
}
