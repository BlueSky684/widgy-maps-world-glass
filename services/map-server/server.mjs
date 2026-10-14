import http from 'node:http';
import {AsyncLocalStorage} from 'node:async_hooks';
import {randomUUID, timingSafeEqual} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {createNightMapHandler} from '../../api/night-map.js';
import {createSharedLocation} from '../../lib/location/shared.js';
import {createBudget} from '../../lib/location/budget.js';
import {resolveMapCity} from '../../lib/location/map-city.js';
import {getTextures, getEngraving} from '../../lib/home-map-day-night.js';
import {createLocationCache} from './location-cache.mjs';

export function validateConfiguration(env) {
  const missing = ['WIDGY_LOCATION_ACCESS_TOKEN', 'BIGDATACLOUD_API_KEY',
    'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'].filter(key => !env[key]);
  if (missing.length) throw Error(`Missing configuration: ${missing.join(', ')}`);
  if (env.WIDGY_LOCATION_ACCESS_TOKEN.length < 32) throw Error('Access token is too short');
  const url = new URL(env.UPSTASH_REDIS_REST_URL);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.upstash.io') ||
      url.username || url.password || url.search || url.hash) throw Error('Invalid cache endpoint');
}

function authorize(url, env) {
  const expected = env.WIDGY_LOCATION_ACCESS_TOKEN || '';
  const actual = url.searchParams.get('location_key') || '';
  if (expected.length < 32) return 503;
  if (url.searchParams.getAll('location_key').length !== 1 ||
      Buffer.byteLength(actual) !== Buffer.byteLength(expected) ||
      !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))) return 403;
  return 200;
}

export function createMapServer({env = () => process.env, lookup, logger = console.info,
  cityDeadlineMs = 1500, drainDeadlineMs = 6500} = {}) {
  const cache = createLocationCache({env});
  const lookupCity = lookup || createSharedLocation({env, cache: () => cache, reserve: createBudget({env})});
  const requestWork = new AsyncLocalStorage();
  const handler = createNightMapHandler({resolveCity: point => resolveMapCity(point, {
    lookup: lookupCity, deadlineMs: cityDeadlineMs,
    defer: work => requestWork.getStore().add(work)
  })});
  const report = fields => {
    try { logger(JSON.stringify({event: 'cloud_map_http_v1', ...fields})); } catch {}
  };
  return http.createServer({maxHeaderSize: 16384, requestTimeout: 30000, headersTimeout: 15000}, async (req, res) => {
    const id = randomUUID(), started = performance.now();
    // Never include URLs, query strings, tokens, coordinates, city or image data.
    let terminal = false;
    const terminalReport = phase => {
      if (terminal) return;
      terminal = true;
      report({id, phase, status: res.statusCode,
        elapsedMs: Math.round(performance.now() - started),
        bodyBytes: Number(res.getHeader('Content-Length') || 0),
        rssMiB: Math.round(process.memoryUsage().rss / 1048576)});
    };
    res.once('finish', () => terminalReport('finished'));
    res.once('close', () => terminalReport(res.writableFinished ? 'finished' : 'closed_early'));
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Map-Service', 'cloud-run-trial-v1');
    res.setHeader('X-Map-Request-ID', id);
    const reply = (status, value) => {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json');
      const body = Buffer.from(JSON.stringify(value));
      res.setHeader('Content-Length', body.length);
      res.end(body);
    };
    let url;
    try { url = new URL(req.url, 'http://map.invalid'); } catch { return reply(400, {error: 'Invalid request'}); }
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.setHeader('Allow', 'GET, HEAD');
      return reply(405, {error: 'Method not allowed'});
    }
    if (url.pathname === '/healthz') return reply(200, {status: 'ready', service: 'cloud-run-trial-v1'});
    if (url.pathname !== '/api/night-map') return reply(404, {error: 'Not found'});
    const access = authorize(url, env());
    if (access !== 200) return reply(access, {error: 'Map unavailable'});

    const work = new Set();
    await requestWork.run(work, async () => {
      // Request-billed Cloud Run can suspend CPU after the HTTP response ends.
      // Finish bounded city/cache work before ending the response. Usually it
      // completes during PNG rendering. A slow cold lookup can add latency;
      // the 1500ms city decision and the resulting image pixels are unchanged.
      async function drain() {
        if (!work.size) return;
        let timer;
        const completed = await Promise.race([
          Promise.allSettled([...work]).then(() => true),
          new Promise(resolve => { timer = setTimeout(() => resolve(false), drainDeadlineMs); })
        ]).finally(() => clearTimeout(timer));
        if (!completed) report({id, phase: 'city_completion_timeout'});
      }
      async function finish(body) {
        await drain();
        if (res.destroyed || res.writableEnded) return;
        if (body !== undefined && res.statusCode !== 304) res.setHeader('Content-Length', body.length);
        res.end(body);
      }
      // Only the small response surface used by api/night-map.js is adapted.
      // Native events/properties retain real finish/close diagnostics.
      const facade = {
        get statusCode() { return res.statusCode; },
        get headersSent() { return res.headersSent; },
        get writableEnded() { return res.writableEnded; },
        get writableFinished() { return res.writableFinished; },
        once(name, fn) { res.once(name, fn); return this; },
        setHeader(name, value) { res.setHeader(name, value); },
        status(code) { res.statusCode = code; return this; },
        end() { return finish(); },
        send(body) { return finish(Buffer.isBuffer(body) ? body : Buffer.from(body)); },
        json(value) { res.setHeader('Content-Type', 'application/json'); return finish(Buffer.from(JSON.stringify(value))); }
      };
      try { await handler(req, facade); }
      catch {
        report({id, phase: 'handler_failed'});
        if (!res.headersSent && !res.destroyed) reply(500, {error: 'Map rendering unavailable'});
        else res.destroy();
      }
    });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    validateConfiguration(process.env);
    // Validate/load the approved textures before accepting any traffic.
    getTextures(); getEngraving('r6');
    const server = createMapServer();
    const port = Number(process.env.PORT || 8080);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error('Invalid port');
    server.listen(port, '0.0.0.0', () => console.info(JSON.stringify({event: 'cloud_map_ready_v1', port})));
    process.once('SIGTERM', () => {
      server.close();
      setTimeout(() => { server.closeAllConnections(); process.exit(0); }, 8500).unref();
    });
  } catch {
    console.error('Map server startup failed; check configuration and approved assets.');
    process.exitCode = 1;
  }
}
