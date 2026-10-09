import {renderHomeMap, resolveLocation, REVISION} from '../lib/home-map-day-night.js';
import {parseMapRequest} from '../lib/native-map-request.js';
import {createMapRenderCache} from '../lib/map-render-cache.js';
import {precomputedState} from '../lib/map-precomputed.js';
import {randomUUID} from 'node:crypto';
import {compareMapRequestKeys, readCityTimingTrace} from '../lib/map-request-key-diagnostics.js';
import {createCityReuseCache} from '../lib/city-reuse-cache.js';
import {createMapURLDiagnostics} from '../lib/map-url-diagnostics.js';

const cachedRender = createMapRenderCache();
const cachedCity = createCityReuseCache();
const observeMapURL = createMapURLDiagnostics();
// Opaque process-local identity distinguishes separate warm caches. It is not
// derived from the device, location, request, or deployment credentials.
const instance = randomUUID();
let instanceRequests = 0, previousCacheKey = null, previousCacheRequestAt = null;
// CDN delivery trial is restricted to one public synthetic map. Real device
// locations, city text, extra/duplicate parameters and normal exports remain
// private. This response never depends on request IP or calendar data.
const syntheticCDNQuery = new URLSearchParams('mode=live&width=3306&presentation=glass&atlas=r6&reuse=60&lat=0&lon=0&cache=synthetic-60');

// This route is opt-in. Existing widget endpoints retain their behavior.
export default async function handler(req, res) {
  const requestStarted = performance.now();
  const url = parseMapRequest(req.url);
  if (url.searchParams.get('city_cache_v1') === 'read') {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('CDN-Cache-Control', 'no-store');
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
    if (req.method && !['GET', 'HEAD'].includes(req.method)) {
      res.setHeader('Allow', 'GET, HEAD');
      return res.status(405).end();
    }
    const result = cachedCity.read(url), status = result.state === 'INVALID' ? 400 : 200;
    if (result.state === 'HIT') res.setHeader('Cache-Control', `private, max-age=${result.remainingSeconds}, must-revalidate`);
    console.info(JSON.stringify({event:'city_cache_response_v1', state:result.state, status, instance,
      elapsedMs:Math.round((performance.now() - requestStarted) * 10) / 10}));
    return req.method === 'HEAD' ? res.status(status).end() : res.status(status).json({state:result.state, ...(result.entry ? {entry:result.entry} : {})});
  }
  const instanceRequest = ++instanceRequests;
  // Native black-image reports cannot be diagnosed from render errors alone.
  // Do not record the URL, query, coordinates, city, headers or image content.
  // Vercel supplies the request ID around each line, including timed-out calls.
  const method = req.method === 'HEAD' ? 'HEAD' : !req.method || req.method === 'GET' ? 'GET' : 'OTHER';
  const report = (phase, details = {}) => console.info(JSON.stringify({
    event: 'night_map_response_v1', phase, method, instance, instanceRequest,
    elapsedMs: Math.round((performance.now() - requestStarted) * 10) / 10,
    ...details
  }));
  report('started');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  if (req.method && !['GET', 'HEAD'].includes(req.method)) {
    res.setHeader('Allow', 'GET, HEAD');
    report('prepared', {status: 405, bodyBytes: 0});
    return res.status(405).end();
  }
  const fixed = url.searchParams.get('at');
  // An explicit fixed UTC instant is for reproducible geometric checks only.
  // Widgy's t= cache buster never controls the solar instant.
  const validISO = fixed === null || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(fixed);
  const date = fixed === null ? new Date() : new Date(fixed);
  if (!validISO || !Number.isFinite(date.getTime()) || date.getUTCFullYear() < 1900 || date.getUTCFullYear() > 2100) {
    report('rejected', {status: 400, reason: 'invalid_instant'});
    return res.status(400).json({error: 'at must be an ISO instant with a timezone, between 1900 and 2100'});
  }
  const width=Number(url.searchParams.get('width') || 3306);
  if(![3306,1653,1102].includes(width)){
    report('rejected', {status: 400, reason: 'invalid_width'});
    return res.status(400).json({error:'Unsupported image width'});
  }
  const location = resolveLocation(url, req.headers);
  cachedCity.remember(url);
  const presentation = url.searchParams.get('presentation') === 'glass' ? 'glass' : 'default';
  const atlas = url.searchParams.get('atlas') === 'r6' ? 'r6' : 'f50';
  try {
    const started=performance.now();
    const diagnosticValue = url.searchParams.get('diagnostic');
    // Keep the existing false/true keys; only this opt-in uses a distinct key.
    const diagnostic = diagnosticValue === 'refresh-v1' ? 'refresh-v1' : diagnosticValue === 'location';
    // C6 opt-in only. Explicit coordinates (including empty/unavailable values)
    // make the URL self-contained; IP-derived locations must never be browser-cached.
    const reuse = url.searchParams.get('reuse') === '60' && fixed === null &&
      url.searchParams.has('lat') && url.searchParams.has('lon');
    // Reuse for at most 60 seconds from the actual render, even across a
    // wall-clock minute boundary. GPS, city, style and size still key the cache.
    const render = () => renderHomeMap({date, location, width, presentation, diagnostic, atlas});
    const cacheKey = JSON.stringify([REVISION, width, presentation, atlas, diagnostic, location]);
    let keyDiagnostic = {previousKeyComparison: 'bypass', previousKeyChanges: [], previousRequestAgeMs: null};
    if (reuse) {
      keyDiagnostic = {...compareMapRequestKeys(previousCacheKey, cacheKey),
        previousRequestAgeMs: previousCacheRequestAt === null ? null : Math.round(requestStarted - previousCacheRequestAt)};
      previousCacheKey = cacheKey;
      previousCacheRequestAt = requestStarted;
    }
    const result = reuse ? await cachedRender(
      cacheKey,
      {expiresAt: date.getTime() + 60000, renderedAt: date.toISOString(), render}
    ) : {entry: {png: await render(), renderedAt: date.toISOString()}, state: 'BYPASS'};
    const {entry} = result;
    if (reuse) {
      // Do not extend freshness on a cache hit or after a slow render.
      const remaining = Math.max(0, Math.floor((entry.expiresAt - Date.now()) / 1000));
      res.setHeader('Cache-Control', `private, max-age=${remaining}, must-revalidate`);
      res.setHeader('ETag', entry.etag);
      const syntheticCDN = url.searchParams.size === syntheticCDNQuery.size &&
        [...syntheticCDNQuery].every(([key,value]) => url.searchParams.get(key) === value) &&
        location?.source === 'coordinates' && location.latitude === 0 && location.longitude === 0 && !location.city;
      if (syntheticCDN && remaining > 0) {
        const policy = `public, max-age=${remaining}, must-revalidate`;
        res.setHeader('Cache-Control', policy);
        res.setHeader('CDN-Cache-Control', policy);
        res.setHeader('Vercel-CDN-Cache-Control', policy);
        res.setHeader('X-Map-Delivery', 'synthetic-cdn-60');
      }
    }
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('X-Map-Cache', result.state);
    res.setHeader('Server-Timing', `map;dur=${(performance.now()-started).toFixed(1)}`);
    res.setHeader('X-Map-Performance', 'perf-8-srgb-profile');
    res.setHeader('X-Map-Precomputed',precomputedState());
    res.setHeader('X-Map-Revision', REVISION);
    res.setHeader('X-Map-Atlas', atlas);
    res.setHeader('X-Map-Width', String(width));
    res.setHeader('X-Map-Time-Mode', fixed === null ? 'server-now' : 'fixed-test');
    res.setHeader('X-Map-Rendered-At', entry.renderedAt);
    res.setHeader('X-Map-Location-Source', location?.source || 'unavailable');
    const tags = String(req.headers?.['if-none-match'] || '').split(',').map(s => s.trim().replace(/^W\//, ''));
    const notModified = reuse && (tags.includes(entry.etag) || tags.includes('*'));
    // "prepared" is server evidence only: it does not assert network delivery
    // or that Widgy decoded/displayed the image. A PNG above the platform body
    // budget can still fail after the function adapter processes this response.
    const urlDiagnostic = reuse && method === 'GET' ? observeMapURL({key:cacheKey, rawURL:req.url, etag:entry.etag}) : {};
    report('prepared', {status: notModified ? 304 : 200, cache: result.state, ...keyDiagnostic, ...urlDiagnostic, ...readCityTimingTrace(url),
      pngBytes: entry.png.length, bodyBytes: notModified || method === 'HEAD' ? 0 : entry.png.length,
      conditional: tags.length > 0 && tags[0] !== '', precomputed: precomputedState()});
    if (notModified) return res.status(304).end();
    return req.method === 'HEAD' ? res.status(200).end() : res.status(200).send(entry.png);
  } catch (error) {
    report('failed', {status: 500, reason: 'render_or_response_failed'});
    console.error('Day/night render failed:', error.message);
    return res.status(500).json({error: 'Map rendering unavailable'});
  }
}
