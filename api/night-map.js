import {renderHomeMap, resolveLocation, REVISION} from '../lib/home-map-day-night.js';
import {parseMapRequest} from '../lib/native-map-request.js';
import {createMapRenderCache} from '../lib/map-render-cache.js';
import {precomputedState} from '../lib/map-precomputed.js';

const cachedRender = createMapRenderCache();

// This route is opt-in. Existing widget endpoints retain their behavior.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  if (req.method && !['GET', 'HEAD'].includes(req.method)) {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }
  const url = parseMapRequest(req.url);
  const fixed = url.searchParams.get('at');
  // An explicit fixed UTC instant is for reproducible geometric checks only.
  // Widgy's t= cache buster never controls the solar instant.
  const validISO = fixed === null || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(fixed);
  const date = fixed === null ? new Date() : new Date(fixed);
  if (!validISO || !Number.isFinite(date.getTime()) || date.getUTCFullYear() < 1900 || date.getUTCFullYear() > 2100)
    return res.status(400).json({error: 'at must be an ISO instant with a timezone, between 1900 and 2100'});
  const width=Number(url.searchParams.get('width') || 3306);
  if(![3306,1653,1102].includes(width))return res.status(400).json({error:'Unsupported image width'});
  const location = resolveLocation(url, req.headers);
  const presentation = url.searchParams.get('presentation') === 'glass' ? 'glass' : 'default';
  const atlas = url.searchParams.get('atlas') === 'r6' ? 'r6' : 'f50';
  try {
    const diagnostic = url.searchParams.get('diagnostic') === 'location';
    // C6 opt-in only. Explicit coordinates (including empty/unavailable values)
    // make the URL self-contained; IP-derived locations must never be browser-cached.
    const reuse = url.searchParams.get('reuse') === '60' && fixed === null &&
      url.searchParams.has('lat') && url.searchParams.has('lon');
    const minute = Math.floor(date.getTime() / 60000);
    const render = () => renderHomeMap({date, location, width, presentation, diagnostic, atlas});
    const result = reuse ? await cachedRender(
      JSON.stringify([REVISION, minute, width, presentation, atlas, diagnostic, location]),
      {expiresAt: (minute + 1) * 60000, renderedAt: date.toISOString(), render}
    ) : {entry: {png: await render(), renderedAt: date.toISOString()}, state: 'BYPASS'};
    const {entry} = result;
    if (reuse) {
      // Do not extend freshness on a cache hit or after a slow render.
      const remaining = Math.max(0, Math.floor((entry.expiresAt - Date.now()) / 1000));
      res.setHeader('Cache-Control', `private, max-age=${remaining}, must-revalidate`);
      res.setHeader('ETag', entry.etag);
    }
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('X-Map-Cache', result.state);
    res.setHeader('X-Map-Precomputed',precomputedState());
    res.setHeader('X-Map-Revision', REVISION);
    res.setHeader('X-Map-Atlas', atlas);
    res.setHeader('X-Map-Width', String(width));
    res.setHeader('X-Map-Time-Mode', fixed === null ? 'server-now' : 'fixed-test');
    res.setHeader('X-Map-Rendered-At', entry.renderedAt);
    res.setHeader('X-Map-Location-Source', location?.source || 'unavailable');
    const tags = String(req.headers?.['if-none-match'] || '').split(',').map(s => s.trim().replace(/^W\//, ''));
    if (reuse && (tags.includes(entry.etag) || tags.includes('*'))) return res.status(304).end();
    return req.method === 'HEAD' ? res.status(200).end() : res.status(200).send(entry.png);
  } catch (error) {
    console.error('Day/night render failed:', error.message);
    return res.status(500).json({error: 'Map rendering unavailable'});
  }
}
