import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {createDAVClient} from 'tsdav';
import {BridgeError, origin} from './security.js';
import {googleEvents, icalEvents} from './dots.js';

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly'
];
export const callbackURL = () => `${origin()}/api/calendar-bridge?op=google-callback`;
// Public Apple holiday subscription shown under "Other" on the iPhone.
// Pin the feed instead of accepting arbitrary server-side fetch URLs.
export const APPLE_HOLIDAY_CALENDAR = Object.freeze({provider:'apple-holidays',id:'il_he',name:'חגים בישראל'});
const APPLE_HOLIDAY_URL = 'https://calendars.icloud.com/holidays/il_he.ics';

async function limitedFetch(url, init = {}, fetcher = fetch) {
  const response = await fetcher(url,{...init, redirect:'error', signal:AbortSignal.timeout(15000)});
  const reader = response.body?.getReader();
  const chunks = [];
  let size = 0;
  if (reader) {
    try {
      for (;;) {
        const {done,value} = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 10000000) throw new BridgeError('provider_response_too_large',502);
        chunks.push(value);
      }
    } finally { await reader.cancel().catch(() => {}); }
  }
  return new Response([204,205,304].includes(response.status) ? null : Buffer.concat(chunks),{status:response.status, statusText:response.statusText, headers:response.headers});
}

async function tokenRequest(parameters) {
  const response = await limitedFetch('https://oauth2.googleapis.com/token',{
    method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({...parameters,
      client_id:process.env.CALENDAR_GOOGLE_CLIENT_ID,
      client_secret:process.env.CALENDAR_GOOGLE_CLIENT_SECRET})
  });
  if (!response.ok) throw new BridgeError('google_connection_failed',502);
  return response.json();
}
export function googleAuthorizeURL({state,verifier}) {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({client_id:process.env.CALENDAR_GOOGLE_CLIENT_ID,
    redirect_uri:callbackURL(), response_type:'code', scope:GOOGLE_SCOPES.join(' '),
    access_type:'offline', prompt:'consent', state,
    code_challenge:createHash('sha256').update(verifier).digest('base64url'), code_challenge_method:'S256'
  }).toString();
  return url.href;
}
export async function googleExchange(code, verifier) {
  const tokens = await tokenRequest({code,code_verifier:verifier,redirect_uri:callbackURL(),grant_type:'authorization_code'});
  const granted = new Set(String(tokens.scope || '').split(' '));
  if (!GOOGLE_SCOPES.every(s => granted.has(s)) || !tokens.refresh_token) throw new BridgeError('google_permissions_required');
  return {refresh:tokens.refresh_token};
}
async function googleAccess(credentials) {
  const tokens = await tokenRequest({refresh_token:credentials.refresh,grant_type:'refresh_token'});
  if (!tokens.access_token) throw new BridgeError('google_connection_failed',502);
  return tokens.access_token;
}
export async function googlePages(path, parameters, access, fetcher = limitedFetch) {
  const items = [];
  let pageToken;
  for (let page = 0; page < 50; page++) {
    const url = new URL(`https://www.googleapis.com/calendar/v3/${path}`);
    url.search = new URLSearchParams({...parameters,...(pageToken ? {pageToken} : {})}).toString();
    const response = await fetcher(url,{headers:{Authorization:`Bearer ${access}`}});
    if (!response.ok) throw new BridgeError('google_read_failed',502);
    const data = await response.json();
    if (!Array.isArray(data.items || [])) throw new BridgeError('invalid_calendar_data',502);
    items.push(...(data.items || []));
    if (items.length > 20000) throw new BridgeError('event_limit',502);
    pageToken = data.nextPageToken;
    if (!pageToken) return items;
  }
  throw new BridgeError('event_limit',502);
}
export async function googleCalendars(credentials) {
  const access = await googleAccess(credentials);
  const items = await googlePages('users/me/calendarList',{maxResults:250,showDeleted:false},access);
  return items.filter(c => !c.deleted).map(c => ({provider:'google',id:c.id,name:c.summaryOverride || c.summary || c.id}));
}

export function assertICloudURL(value) {
  let url;
  try { url = new URL(value); } catch { throw new BridgeError('invalid_calendar_url'); }
  if (url.protocol !== 'https:' || url.port || url.username || url.password ||
    !/^(?:caldav|p\d+-caldav)\.icloud\.com$/.test(url.hostname)) throw new BridgeError('invalid_calendar_url');
  return url;
}
export async function iCloudFetch(input, init = {}, fetcher = fetch) {
  let url = assertICloudURL(String(input));
  const method = String(init.method || 'GET').toUpperCase();
  if (!['GET','HEAD','OPTIONS','PROPFIND','REPORT'].includes(method)) throw new BridgeError('calendar_write_blocked',403);
  for (let n = 0; n < 4; n++) {
    // Follow only redirects within Apple's CalDAV service; never forward Basic auth elsewhere.
    const response = await limitedFetch(url,{...init,method},async (target,options) =>
      fetcher(target,{...options,redirect:'manual'}));
    if ([301,302,303,307,308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) throw new BridgeError('icloud_connection_failed',502);
      url = assertICloudURL(new URL(location,url).href);
      if (init.redirect==='manual') return response;
      continue;
    }
    if (!response.ok) throw new BridgeError('icloud_connection_failed',502);
    return response;
  }
  throw new BridgeError('icloud_connection_failed',502);
}
async function iCloudClient(credentials) {
  return createDAVClient({serverUrl:'https://caldav.icloud.com',
    credentials:{username:credentials.username,password:credentials.password},
    authMethod:'Basic',defaultAccountType:'caldav',fetch:iCloudFetch});
}
export async function iCloudCalendars(credentials) {
  const client = await iCloudClient(credentials);
  const calendars = await client.fetchCalendars();
  return calendars.filter(c => !c.components?.length || c.components.includes('VEVENT')).map(c => {
    assertICloudURL(c.url);
    return {provider:'icloud',id:c.url,name:typeof c.displayName === 'string' ? c.displayName : 'iCloud'};
  });
}
export async function appleHolidayEvents(source, window, fetcher = fetch) {
  if (source.provider !== APPLE_HOLIDAY_CALENDAR.provider || source.id !== APPLE_HOLIDAY_CALENDAR.id) throw new BridgeError('invalid_selection');
  try {
    // This public feed needs no account credentials, cookies or authorization.
    const response = await limitedFetch(APPLE_HOLIDAY_URL,{},fetcher);
    if (!response.ok) throw new Error('feed_unavailable');
    let bytes = Buffer.from(await response.arrayBuffer());
    // Apple's feed may be gzip-encoded even without a Content-Encoding header.
    if (bytes[0] === 0x1f && bytes[1] === 0x8b) bytes = gunzipSync(bytes,{maxOutputLength:5000000});
    if (bytes.length > 5000000) throw new Error('feed_too_large');
    const data = bytes.toString('utf8');
    if (!data.startsWith('BEGIN:VCALENDAR') || !data.includes('END:VCALENDAR')) throw new Error('invalid_feed');
    return icalEvents([{data}],source,window);
  } catch {
    throw new BridgeError('apple_holidays_read_failed',502);
  }
}
export async function listCalendars(state) {
  // A failed provider must remain visible as a failure, never as an empty calendar.
  const results = await Promise.allSettled([
    state.google ? googleCalendars(state.google) : Promise.resolve([]),
    state.icloud ? iCloudCalendars(state.icloud) : Promise.resolve([])
  ]);
  const providers = ['google','icloud'];
  return {calendars:[...results.flatMap(r => r.status === 'fulfilled' ? r.value : []),{...APPLE_HOLIDAY_CALENDAR}],
    errors:results.flatMap((r,i) => r.status === 'rejected' ? [providers[i]] : [])};
}
export async function readEvents(state, window) {
  const sources = state.sources || [];
  const results = await Promise.all([
    (async () => {
      const selected = sources.filter(s => s.provider === 'google');
      if (!selected.length) return [];
      if (!state.google) throw new BridgeError('google_connection_failed',502);
      const access = await googleAccess(state.google);
      return (await Promise.all(selected.map(async source => {
        const items = await googlePages(`calendars/${encodeURIComponent(source.id)}/events`,{
          timeMin:window.start.toISO(),timeMax:window.end.toISO(),singleEvents:true,
          showDeleted:false,maxResults:2500,timeZone:window.zone,orderBy:'startTime'
        },access);
        return googleEvents(items,source);
      }))).flat();
    })(),
    (async () => {
      const selected = sources.filter(s => s.provider === 'icloud');
      if (!selected.length) return [];
      if (!state.icloud) throw new BridgeError('icloud_connection_failed',502);
      const client = await iCloudClient(state.icloud);
      return (await Promise.all(selected.map(async source => {
        assertICloudURL(source.id);
        const objects = await client.fetchCalendarObjects({calendar:{url:source.id},
          timeRange:{start:window.start.toUTC().toISO(),end:window.end.toUTC().toISO()},expand:true});
        return icalEvents(objects,source,window);
      }))).flat();
    })(),
    Promise.all(sources.filter(s => s.provider === 'apple-holidays').map(source => appleHolidayEvents(source,window))).then(results=>results.flat())
  ]);
  return results.flat();
}
