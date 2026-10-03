import {BridgeError,body,checkPost,origin,privateHeaders,randomKey,readiness,same,seal,session,setSession} from '../lib/calendar-bridge/security.js';
import {callbackURL,googleAuthorizeURL,googleExchange,iCloudCalendars,listCalendars,readEvents} from '../lib/calendar-bridge/providers.js';
import {COLORS,DEFAULT_ZONE,dayDots,monthWindow} from '../lib/calendar-bridge/dots.js';
import {sourceDiagnostics,widgetSnapshot} from '../lib/calendar-bridge/widget-data.js';

const PAGE = '/tools/calendar-connect.html';
function publicState(state) {
  return {connected:{google:Boolean(state.google),icloud:Boolean(state.icloud)},
    sources:state.sources || [],zone:state.zone || DEFAULT_ZONE};
}
function clearOAuth(state) { const next={...state}; delete next.oauth; return next; }

export default async function handler(req,res) {
  privateHeaders(res);
  try {
    const url = new URL(req.url,origin());
    const op = url.searchParams.get('op') || 'state';
    const ready = readiness();
    if (op === 'state' && req.method === 'GET') {
      let state;
      if (ready.base) { try { state=await session(req); } catch {} }
      return res.status(200).json({ready,authenticated:Boolean(state),colors:COLORS,
        ...(state ? publicState(state) : {})});
    }
    if (!ready.base) throw new BridgeError('server_configuration',503);
    if (op === 'google-callback' && req.method === 'GET') {
      const state = await session(req);
      const oauth = state.oauth;
      if (!oauth || Date.now()-oauth.at > 600000 || !same(url.searchParams.get('state'),oauth.state)) throw new BridgeError('oauth_expired',401);
      try {
        if (url.searchParams.has('error')) throw new BridgeError('google_connection_cancelled');
        const code = url.searchParams.get('code');
        if (!code || code.length > 8000) throw new BridgeError('google_connection_failed');
        const google=await googleExchange(code,oauth.verifier);
        // A new Google authorization may use a different account; require source reselection.
        await setSession(res,{...clearOAuth(state),google,sources:(state.sources || []).filter(s=>s.provider!=='google')});
        res.setHeader('Location',`${PAGE}#connected`);
      } catch (error) {
        await setSession(res,clearOAuth(state));
        res.setHeader('Location',`${PAGE}#${error instanceof BridgeError ? error.code : 'google_connection_failed'}`);
      }
      return res.status(303).end();
    }
    if (op === 'calendars' && req.method === 'GET') {
      const state = await session(req);
      return res.status(200).json(await listCalendars(state));
    }
    checkPost(req);
    const input=body(req);
    if (op === 'login') {
      if (!same(input.key,process.env.CALENDAR_SETUP_KEY)) throw new BridgeError('unauthorized',401);
      let state;
      try { state=await session(req); } catch { state={sources:[],zone:DEFAULT_ZONE}; }
      await setSession(res,state);
      return res.status(200).json({ok:true});
    }
    const state=await session(req);
    if (op === 'google') {
      if (!ready.google) throw new BridgeError('google_not_configured',503);
      const oauth={state:randomKey(),verifier:randomKey(),at:Date.now()};
      await setSession(res,{...state,oauth});
      return res.status(200).json({url:googleAuthorizeURL(oauth),redirect:callbackURL()});
    }
    if (op === 'icloud') {
      const username=String(input.username || '').trim();
      const password=String(input.password || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username) || username.length>254 || !/^[a-z]{4}(?:-[a-z]{4}){3}$/i.test(password)) throw new BridgeError('icloud_credentials_invalid');
      const icloud={username,password};
      const calendars=await iCloudCalendars(icloud);
      await setSession(res,{...state,icloud,sources:(state.sources || []).filter(s=>s.provider!=='icloud')});
      return res.status(200).json({ok:true,calendars});
    }
    if (op === 'select') {
      if (!Array.isArray(input.sources) || input.sources.length<1 || input.sources.length>6) throw new BridgeError('choose_calendars');
      const zone=typeof input.zone==='string' ? input.zone : DEFAULT_ZONE;
      monthWindow({zone});
      const sources=input.sources.map(s=>({provider:s.provider,id:s.id,color:s.color}));
      if (sources.some(s=>!['google','icloud','apple-holidays'].includes(s.provider)||typeof s.id!=='string'||!Number.isInteger(s.color)||!COLORS[s.color]) ||
          new Set(sources.map(s=>`${s.provider}:${s.id}`)).size!==sources.length) throw new BridgeError('invalid_selection');
      const listing=await listCalendars(state);
      if (sources.some(s=>listing.errors.includes(s.provider))) throw new BridgeError('provider_read_failed',502);
      if (sources.some(s=>!listing.calendars.some(c=>c.provider===s.provider&&c.id===s.id))) throw new BridgeError('invalid_selection');
      const next={...state,sources,zone};
      await setSession(res,next);
      return res.status(200).json({ok:true});
    }
    if (op === 'export') {
      if (!state.sources?.length) throw new BridgeError('choose_calendars');
      // Check real reads before issuing a widget; never label a failed/partial read as ready.
      const window=monthWindow({zone:state.zone});
      const events=await readEvents(state,window);
      const days=dayDots(events,window);
      const payload={sources:state.sources,zone:state.zone};
      if (state.sources.some(s=>s.provider==='google')) payload.google=state.google;
      if (state.sources.some(s=>s.provider==='icloud')) payload.icloud=state.icloud;
      const token=await seal(payload,'calendar-render','365d');
      if (token.length>5000) throw new BridgeError('selection_too_large');
      const endpoint=`${origin()}/api/calendar-dots?token=${encodeURIComponent(token)}`;
      let details={};
      if(input.version===2){
        const widgetToken=await seal(payload,'calendar-widget','365d');
        if(widgetToken.length>5000)throw new BridgeError('selection_too_large');
        details={widgetEndpoint:`${origin()}/api/calendar-widget?token=${encodeURIComponent(widgetToken)}`,
          today:widgetSnapshot(events,window),sources:sourceDiagnostics(events,window,state.sources)};
      }
      return res.status(200).json({endpoint,daysWithEvents:days.filter(d=>d.count).length,
        month:window.month.toFormat('yyyy-MM'),expires:new Date(Date.now()+365*86400000).toISOString(),...details});
    }
    throw new BridgeError('not_found',404);
  } catch (error) {
    // Provider errors may contain credentials/URLs; never serialize or log raw errors.
    return res.status(error instanceof BridgeError ? error.status : 502).json({error:error instanceof BridgeError ? error.code : 'connection_failed'});
  }
}
