import {resolveMapCity} from './map-city.js';
import {authorizeLocation} from './shared.js';

export const FILE_DELIVERY = 'vercel-file-v1';
// Owned, existing service only. Never take an upstream URL from a request.
export const CLOUD_CITY_ORIGIN = 'https://widgy-map-test-952007798808.me-west1.run.app';
const UPSTREAM_MS = 5000, MAX_JSON_BYTES = 8192;

export function fileCityBackend(env = process.env) {
  const backend = env.WIDGY_MAP_FILE_CITY_BACKEND || 'cloud-run';
  if (!['cloud-run', 'vercel-bdc'].includes(backend)) throw Error('not_configured');
  return backend;
}

export function authorizeFileDelivery(url, env = process.env) {
  const modes = url.searchParams.getAll('delivery');
  if (!modes.length) return null;
  if (modes.length !== 1 || modes[0] !== FILE_DELIVERY || url.searchParams.has('city_cache_v1')) {
    throw Error('invalid_delivery');
  }
  const point = authorizeLocation(url, {
    WIDGY_LOCATION_ACCESS_TOKEN: env.WIDGY_MAP_FILE_ACCESS_TOKEN
  }, {requireProvider: false});
  fileCityBackend(env);
  return point;
}

// The existing Google service remains the sole provider/quota/cache authority.
// No Redis access, new provider key or quota initialization happens here.
export function createCloudCityLookup({fetcher = fetch, env = () => process.env,
  timeoutMs = UPSTREAM_MS} = {}) {
  return async point => {
    const token = env().WIDGY_MAP_FILE_ACCESS_TOKEN;
    if (typeof token !== 'string' || token.length < 32) throw Error('not_configured');
    const url = new URL('/api/fetch-probe', CLOUD_CITY_ORIGIN);
    url.search = new URLSearchParams({location_shared: '1', location_key: token,
      lat: String(point.latitude), lon: String(point.longitude)});
    const controller = new AbortController();
    let timer;
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(() => {reject(Error('city_bridge_timeout')); controller.abort();}, timeoutMs);
    });
    try {
      const request = (async () => {
        const response = await fetcher(url, {signal: controller.signal, redirect: 'error',
          headers: {Accept: 'application/json'}});
        if (response.status !== 200 ||
          !/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') || '')) {
          await response.body?.cancel();
          throw Error('city_bridge_unavailable');
        }
        const reader = response.body?.getReader();
        if (!reader) throw Error('city_bridge_body');
        const chunks = []; let size = 0;
        try {
          while (true) {
            const {done, value} = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > MAX_JSON_BYTES) throw Error('city_bridge_size');
            chunks.push(value);
          }
        } finally {try {await reader.cancel();} catch {} }
        // Exact coordinates, allowed states and safe city text are validated by
        // resolveMapCity before the name can appear in a map.
        return JSON.parse(Buffer.concat(chunks).toString('utf8'));
      })();
      return await Promise.race([request, deadline]);
    } finally {clearTimeout(timer); controller.abort();}
  };
}

const cloudCityLookup = createCloudCityLookup();
export function resolveCloudMapCity(point, options = {}) {
  // Preserve the 1500ms city decision; waitUntil completes the bounded upstream
  // work without delaying PNG delivery or starting any extra geocoder request.
  return resolveMapCity(point, {lookup: cloudCityLookup, ...options});
}

export function resolveFileMapCity(point) {
  // Enable vercel-bdc only AFTER the controlled Firestore -> Redis handback.
  // The existing Redis resolver refuses reservations while its ledger is fenced.
  // No client update is needed when this server-only switch is changed later.
  return fileCityBackend() === 'vercel-bdc' ? resolveMapCity(point) : resolveCloudMapCity(point);
}
