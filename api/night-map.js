import {renderHomeMap, resolveLocation, REVISION} from '../lib/home-map-day-night.js';

// This route is opt-in. Existing widget endpoints retain their behavior.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  if (req.method && !['GET', 'HEAD'].includes(req.method)) {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }
  const url = new URL(req.url, 'https://widgy-maps-world-glass.vercel.app');
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
  try {
    const png = await renderHomeMap({date, location, width, presentation});
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('X-Map-Revision', REVISION);
    res.setHeader('X-Map-Width', String(width));
    res.setHeader('X-Map-Time-Mode', fixed === null ? 'server-now' : 'fixed-test');
    res.setHeader('X-Map-Rendered-At', date.toISOString());
    res.setHeader('X-Map-Location-Source', location?.source || 'unavailable');
    return req.method === 'HEAD' ? res.status(200).end() : res.status(200).send(png);
  } catch (error) {
    console.error('Day/night render failed:', error.message);
    return res.status(500).json({error: 'Map rendering unavailable'});
  }
}
