// The iPhone renders the image. This route exposes only the established city resolver.
import { authorizeLocation, locationErrorStatus } from '../lib/location/shared.js';
import { resolveFileMapCity } from '../lib/location/cloud-city-bridge.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  try {
    const credentials = /^Bearer ([^\s]+)$/.exec(req.headers.authorization || '');
    if (!credentials) return res.status(403).end();
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const params = new URL('https://city.invalid');
    params.searchParams.set('location_key', credentials[1]);
    params.searchParams.set('lat', typeof body?.lat === 'string' ? body.lat : '');
    params.searchParams.set('lon', typeof body?.lon === 'string' ? body.lon : '');
    const point = authorizeLocation(params, {
      WIDGY_LOCATION_ACCESS_TOKEN: process.env.WIDGY_MAP_FILE_ACCESS_TOKEN
    }, {requireProvider: false});
    const result = await resolveFileMapCity(point);
    return res.status(200).json({...point, city: result.city, state: result.state});
  } catch (error) {
    return res.status(error instanceof SyntaxError ? 400 : locationErrorStatus(error)).end();
  }
}
