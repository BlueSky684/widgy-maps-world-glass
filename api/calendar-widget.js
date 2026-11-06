import {createHash} from 'node:crypto';
import {BridgeError,origin,privateHeaders,unseal} from '../lib/calendar-bridge/security.js';
import {monthWindow,renderDots} from '../lib/calendar-bridge/dots.js';
import {readEvents} from '../lib/calendar-bridge/providers.js';
import {widgetSnapshot} from '../lib/calendar-bridge/widget-data.js';
import {widgyFields} from '../lib/calendar-bridge/widgy-fields.js';
import {preparedDaysFor} from '../lib/calendar-bridge/prepared-days.js';
import {homeAgenda,homeAgendaFields} from '../lib/calendar-bridge/home-agenda.js';
import {cachedEvents} from '../lib/calendar-bridge/provider-cache.js';
import {monthProviderWindow,monthViewEntry} from '../lib/calendar-bridge/month-provider-window.js';
import {yearProviderWindow,yearPreparedDaysFor,readYearRange} from '../lib/calendar-bridge/year-provider-window.js';
import {cachedAnnualEvents} from '../lib/calendar-bridge/annual-provider-cache.js';
import {calendarGrid} from '../lib/calendar-bridge/calendar-grid.js';

export function clientMaxAge(snapshot,providerUntil,instant=Date.now(),agendaUntil=Infinity){
  // Reuse identical sequential Home field requests on the device only.
  // Never keep a response beyond a provider refresh or an event transition.
  return Math.max(0,Math.floor(Math.min(30000,providerUntil-instant,
    snapshot.validUntil-instant,snapshot.home.validUntil-instant,agendaUntil-instant)/1000));
}
export default async function handler(req,res) {
  const started=performance.now();
  const method=req.method==='GET'?'GET':req.method==='HEAD'?'HEAD':'OTHER';
  // Log bounded operational fields only: never URLs, tokens, event content,
  // source identifiers, credentials, coordinates or request headers.
  const trace={};
  let stage='validation';
  const report=(phase,details={})=>console.info(JSON.stringify({
    event:'calendar_response_v1',phase,method,
    elapsedMs:Math.round((performance.now()-started)*10)/10,...trace,...details
  }));
  report('started');
  privateHeaders(res);
  let nativeFields=false,compactAgenda=false;
  try {
    if (req.method!=='GET' && req.method!=='HEAD') throw new BridgeError('method_not_allowed',405);
    const url=new URL(req.url,origin()),token=url.searchParams.get('token');
    nativeFields=url.searchParams.get('format')==='widgy';
    compactAgenda=nativeFields && url.searchParams.get('agenda')==='home-v1';
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
    Object.assign(trace,{view,bounds,offset:Number(raw),
      validationMs:Math.round((performance.now()-started)*10)/10,
      sources:{google:state.sources.filter(s=>s.provider==='google').length,
        icloud:state.sources.filter(s=>s.provider==='icloud').length,
        holidays:state.sources.filter(s=>s.provider==='apple-holidays').length}});
    const fastAnnual=url.searchParams.get('reuse')==='year-v2';
    const annual=fastAnnual || url.searchParams.get('reuse')==='year-v1';
    const pooled=annual || url.searchParams.get('reuse')==='months-v1';
    trace.providerWindow=annual?'calendar-year':pooled?'adjacent-months':'single-month';
    const providerWindow=annual?yearProviderWindow({offset:Number(raw),zone:state.zone,now}):
      pooled?monthProviderWindow({offset:Number(raw),zone:state.zone,now}):window;
    const monthKey=createHash('sha256').update(`${token}:${window.month.toISODate()}`).digest('hex');
    const key=pooled?createHash('sha256').update(JSON.stringify([fastAnnual?'year-v2':annual?'year-v1':'months-v1',token,providerWindow.zone,
      providerWindow.start.toISO(),providerWindow.end.toISO()])).digest('hex'):monthKey;
    stage='provider';
    const providerStarted=performance.now();
    const fetchProviderWindow=range=>{
      const work=readEvents(state,range);
      // Build the account-independent date grid while provider I/O is pending,
      // rather than adding its CPU work after the final provider response.
      // Grid preparation is optional here; normal validation still runs later.
      try {calendarGrid(range);} catch {}
      return work;
    };
    let provider;
    try {
      provider=annual?await readYearRange(key,
        ()=>fastAnnual?cachedAnnualEvents(key,()=>fetchProviderWindow(providerWindow),{
          requireFresh:view==='today',
          prepareSnapshot:candidate=>yearPreparedDaysFor(candidate,candidate.events,window,providerWindow),
          canServeStale:error=>!['event_limit','provider_response_too_large','recurrence_limit'].includes(error?.code)
        }):cachedEvents(key,()=>fetchProviderWindow(providerWindow)),
        ()=>cachedEvents(monthKey,()=>fetchProviderWindow(window))):
        await cachedEvents(key,()=>fetchProviderWindow(providerWindow));
      if(provider.rangeFallback)trace.rangeFallback=true;
    } catch(error) {
      // Very dense calendars may exceed a provider's per-request limits over
      // three months. Retry only these capacity failures using the old range.
      if(annual || !pooled || !['event_limit','provider_response_too_large','recurrence_limit'].includes(error?.code))throw error;
      trace.rangeFallback=true;
      provider=await cachedEvents(monthKey,()=>fetchProviderWindow(window));
    }
    const {entry,state:providerCache}=provider;
    trace.providerCache=providerCache;
    const events=await entry.pending;
    if(fastAnnual) {
      const stale=entry.until<=Date.now();
      res.setHeader('X-Calendar-Data-State',stale?(providerCache==='STALE-ERROR'?'refresh-failed':providerCache==='STALE'?'refreshing':'stale'):'current');
      if(Number.isFinite(entry.startedAt))res.setHeader('X-Calendar-Data-Age',String(Math.max(0,Math.floor((Date.now()-entry.startedAt)/1000))));
      if(stale)res.setHeader('Cache-Control','private, no-store');
    }
    trace.providerWaitMs=Math.round((performance.now()-providerStarted)*10)/10;
    stage='response';
    const responseStarted=performance.now();
    const viewEntry=pooled?monthViewEntry(entry,window,annual?12:3):entry;
    const pngKey=bounds==='grid'?'pngGrid':'png';
    const preparedDays=annual && view==='dots' && viewEntry[pngKey]?undefined:
      annual && !provider.rangeFallback?yearPreparedDaysFor(entry,events,window,providerWindow):
      preparedDaysFor(viewEntry,events,window);
    if(view==='today'){
      // Reuse date parsing, ordering and overlap indexing, not the timed Home
      // snapshot: NOW/NEXT EVENT and generatedAt still use the current instant.
      const snapshot=widgetSnapshot(events,window,new Date(),preparedDays);
      const agenda=compactAgenda?homeAgenda(preparedDays,snapshot):null;
      const maxAge=clientMaxAge(snapshot,entry.until,Date.now(),agenda?.validUntil);
      if(maxAge>0)res.setHeader('Cache-Control',`private, max-age=${maxAge}, must-revalidate`);
      res.setHeader('Content-Type','application/json; charset=utf-8');
      res.setHeader('X-Calendar-Provider-Cache',providerCache);
      res.setHeader('Server-Timing',`calendar;dur=${(performance.now()-started).toFixed(1)}`);
      const body=nativeFields?widgyFields(snapshot):snapshot;
      if(compactAgenda)Object.assign(body,homeAgendaFields(agenda));
      report('prepared',{status:200,responseMs:Math.round((performance.now()-responseStarted)*10)/10});
      return req.method==='HEAD'?res.status(200).end():res.status(200).json(body);
    }
    if(!viewEntry[pngKey])viewEntry[pngKey]=renderDots(events,window,{bounds,preparedDays});
    const png=await viewEntry[pngKey];
    // Reuse month dots on the device within the same provider freshness window.
    // privateHeaders continues to forbid shared/CDN caching of private calendars.
    const remaining=Math.max(0,Math.floor((entry.until-Date.now())/1000));
    if(!fastAnnual || remaining>0)res.setHeader('Cache-Control',`private, max-age=${Math.min(30,remaining)}, must-revalidate`);
    res.setHeader('Content-Type','image/png');
    res.setHeader('X-Calendar-Provider-Cache',providerCache);
    res.setHeader('Server-Timing',`calendar;dur=${(performance.now()-started).toFixed(1)}`);
    res.setHeader('X-Calendar-Generated-For',window.month.toFormat('yyyy-MM'));
    report('prepared',{status:200,responseMs:Math.round((performance.now()-responseStarted)*10)/10,
      pngBytes:png.length,bodyBytes:method==='HEAD'?0:png.length});
    return req.method==='HEAD'?res.status(200).end():res.status(200).send(png);
  } catch(error) {
    report('failed',{status:error instanceof BridgeError?error.status:502,stage});
    return res.status(error instanceof BridgeError?error.status:502).json({
      ...(compactAgenda?homeAgendaFields(null):{}),
      ...(nativeFields?widgyFields(null):{}),error:error instanceof BridgeError?error.code:'calendar_read_failed'});
  }
}


