import http from 'node:http';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {createNightMapHandler} from '../../api/night-map.js';
import {authorizeFileDelivery} from '../../lib/location/cloud-city-bridge.js';
import {createSharedLocation, locationErrorStatus} from '../../lib/location/shared.js';
import {createBudget} from '../../lib/location/budget.js';
import {resolveMapCity} from '../../lib/location/map-city.js';
import {nativeFileToken} from '../../lib/native-map-file.js';
import {getTextures, getEngraving} from '../../lib/home-map-day-night.js';

export function validateConfiguration(env) {
  const names = ['WIDGY_MAP_FILE_ACCESS_TOKEN', 'BIGDATACLOUD_API_KEY',
    'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'];
  if (names.some(name => !env[name])) throw Error('Missing map configuration');
  if (env.WIDGY_MAP_FILE_ACCESS_TOKEN.length < 32) throw Error('Invalid map access key');
  if (env.WIDGY_MAP_FILE_CITY_BACKEND !== 'vercel-bdc') throw Error('Invalid city backend');
  let url;
  try { url = new URL(env.UPSTASH_REDIS_REST_URL); } catch { throw Error('Invalid quota store'); }
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.upstash.io') ||
      url.username || url.password || url.search || url.hash) throw Error('Invalid quota store');
}

// This adapter is deliberately separate from the production Vercel entrypoint.
// The existing protocol name, authentication, transfer marker and renderer stay
// unchanged. Only native 2400px delivery and health checks are exposed here.
export function createAzureMapServer({lookup, logger = console.info, cityDeadlineMs = 1500,
  maxInFlight = 2} = {}) {
  if (!Number.isInteger(maxInFlight) || maxInFlight < 1) throw Error('Invalid concurrency');
  const background = new Set();
  const defer = work => {
    const tracked = Promise.resolve(work).catch(() => {});
    background.add(tracked);
    void tracked.finally(() => background.delete(tracked));
  };
  const config = () => ({...process.env,
    WIDGY_LOCATION_ACCESS_TOKEN: process.env.WIDGY_MAP_FILE_ACCESS_TOKEN});
  const lookupCity = lookup || createSharedLocation({
    env: config,
    // Vercel Runtime Cache is not portable. The original resolver retains its
    // bounded process memory cache and exact-coordinate single-flight handling.
    // The SAME Upstash quota ledger is used; never initialize or reset it here.
    cache: () => { throw Error('Shared cache unavailable on this host'); },
    reserve: createBudget({env: config}), defer
  });
  const resolveFileCity = point => resolveMapCity(point, {
    lookup: lookupCity, deadlineMs: cityDeadlineMs, defer
  });
  const handler = createNightMapHandler({resolveFileCity});
  let inFlight = 0;
  const report = fields => {
    try { logger(JSON.stringify({event: 'azure_map_http_v1', ...fields})); } catch {}
  };
  const server = http.createServer({maxHeaderSize: 16384, requestTimeout: 30000,
    headersTimeout: 15000}, async (req, res) => {
    const started = performance.now(), id = randomUUID();
    let recorded = false, admitted = false, handlerSettled = false, bodyBytes = 0;
    const release = () => {
      if (admitted && recorded && handlerSettled) { inFlight--; admitted = false; }
    };
    const terminal = phase => {
      if (recorded) return;
      recorded = true;
      release();
      // Never log URL/query, headers, credentials, GPS, city or raw exceptions.
      report({id, phase, status: res.statusCode, bodyBytes,
        elapsedMs: Math.round(performance.now() - started)});
    };
    res.once('finish', () => terminal('finished'));
    res.once('close', () => terminal(res.writableFinished ? 'finished' : 'closed_early'));
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Map-Host', 'azure-container-apps-trial-v1');
    res.setHeader('X-Map-Request-ID', id);
    const send = body => {
      if (res.destroyed || res.writableEnded) return;
      bodyBytes = req.method === 'HEAD' ? 0 : body?.length || 0;
      if (body !== undefined) res.setHeader('Content-Length', body.length);
      res.end(req.method === 'HEAD' ? undefined : body);
    };
    const json = (status, value) => {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json');
      send(Buffer.from(JSON.stringify(value)));
    };
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.setHeader('Allow', 'GET, HEAD');
      return json(405, {error: 'Method not allowed'});
    }
    let url;
    try { url = new URL(req.url, 'http://map.invalid'); }
    catch { return json(400, {error: 'Invalid request'}); }
    if (url.pathname === '/health') return json(200, {status: 'ready'});
    if (url.pathname !== '/api/night-map') return json(404, {error: 'Not found'});
    try {
      const point = authorizeFileDelivery(url);
      if (!point || !nativeFileToken(url, true)) throw Error('invalid_delivery');
      for (const [name, expected] of Object.entries({shared_location: '1', mode: 'live',
        presentation: 'glass', atlas: 'r6'})) {
        const values = url.searchParams.getAll(name);
        if (values.length !== 1 || values[0] !== expected) throw Error('invalid_delivery');
      }
      if (url.searchParams.has('layer')) throw Error('invalid_delivery');
    } catch (error) {
      const invalid = ['invalid_delivery', 'invalid_native_file'].includes(error.message);
      return json(invalid ? 400 : locationErrorStatus(error), {error: 'Map unavailable'});
    }
    if (inFlight >= maxInFlight) {
      res.setHeader('Retry-After', '5');
      return json(503, {error: 'Map busy'});
    }
    inFlight++; admitted = true;
    // Adapt only the response methods the unchanged handler actually uses.
    const facade = {
      get statusCode() { return res.statusCode; },
      get headersSent() { return res.headersSent; },
      get writableEnded() { return res.writableEnded; },
      get writableFinished() { return res.writableFinished; },
      once(name, fn) { res.once(name, fn); return this; },
      setHeader(name, value) { res.setHeader(name, value); return this; },
      status(code) { res.statusCode = code; return this; },
      end() { send(); },
      send(body) { send(Buffer.isBuffer(body) ? body : Buffer.from(body)); },
      json(value) { json(res.statusCode, value); }
    };
    try { await handler(req, facade); }
    catch {
      if (!res.headersSent && !res.destroyed) json(500, {error: 'Map unavailable'});
      else res.destroy();
    } finally { handlerSettled = true; release(); }
  });
  // Optional cache work must not delay delivery. It is best effort across host
  // termination. Quota reservation precedes each provider request regardless.
  server.drainBackground = async (timeoutMs = 6000) => {
    let timer;
    try {
      await Promise.race([Promise.allSettled([...background]),
        new Promise(resolve => { timer = setTimeout(resolve, timeoutMs); })]);
    } finally { clearTimeout(timer); }
  };
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    validateConfiguration(process.env);
    const port = Number(process.env.PORT || 8080);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error('Invalid port');
    getTextures(); getEngraving('r6');
    const server = createAzureMapServer();
    server.listen(port, '0.0.0.0', () => console.info(JSON.stringify({event: 'azure_map_ready_v1', port})));
    process.once('SIGTERM', () => {
      server.close(async () => { await server.drainBackground(); process.exit(0); });
      setTimeout(() => { server.closeAllConnections(); process.exit(0); }, 10000).unref();
    });
  } catch {
    console.error('Azure map startup failed; check configuration and approved assets.');
    process.exitCode = 1;
  }
}
