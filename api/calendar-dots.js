import {createHash} from 'node:crypto';
import {BridgeError,origin,privateHeaders,unseal} from '../lib/calendar-bridge/security.js';
import {monthWindow,renderDots} from '../lib/calendar-bridge/dots.js';
import {readEvents} from '../lib/calendar-bridge/providers.js';

// Short per-process reuse for Widgy's simultaneous image requests, never a public CDN cache.
const cache=new Map();
export default async function handler(req,res) {
  privateHeaders(res);
  try {
    if (req.method!=='GET' && req.method!=='HEAD') throw new BridgeError('method_not_allowed',405);
    const url=new URL(req.url,origin()), token=url.searchParams.get('token');
    const state=await unseal(token,'calendar-render');
    if (!state?.sources?.length || state.sources.length>6) throw new BridgeError('unauthorized',401);
    const offsetText=url.searchParams.get('offset') || '0';
    if (!/^-?\d{1,2}$/.test(offsetText)) throw new BridgeError('invalid_month');
    const window=monthWindow({offset:Number(offsetText),zone:state.zone});
    const key=createHash('sha256').update(`${token}:${window.month.toISODate()}`).digest('hex');
    for (const [id,value] of cache) if (value.until<Date.now()) cache.delete(id);
    let entry=cache.get(key);
    if (!entry) {
      if (cache.size>=50) cache.delete(cache.keys().next().value);
      const pending=readEvents(state,window).then(events=>renderDots(events,window));
      entry={pending,until:Date.now()+60000}; cache.set(key,entry);
      pending.catch(()=>cache.delete(key));
    }
    const png=await entry.pending;
    res.setHeader('Content-Type','image/png');
    res.setHeader('X-Calendar-Generated-For',window.month.toFormat('yyyy-MM'));
    return req.method==='HEAD' ? res.status(200).end() : res.status(200).send(png);
  } catch (error) {
    return res.status(error instanceof BridgeError ? error.status : 502).json({error:error instanceof BridgeError ? error.code : 'calendar_read_failed'});
  }
}
