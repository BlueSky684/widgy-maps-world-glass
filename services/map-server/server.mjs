import http from 'node:http';
import {randomUUID, timingSafeEqual} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {createSharedLocation} from '../../lib/location/shared.js';
import {createBudget} from '../../lib/location/budget.js';
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


export function createCityServer({env = () => process.env, lookup, logger = console.info,
  cityDeadlineMs = 1500, drainDeadlineMs = 6500} = {}) {
  const cache = createLocationCache({env});
  const lookupCity = lookup || createSharedLocation({env, cache: () => cache, reserve: createBudget({env})});
  const report = fields => {
    try { logger(JSON.stringify({event: 'cloud_city_http_v1', ...fields})); } catch {}
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
    res.setHeader('X-City-Service', 'cloud-run-trial-v1');
    res.setHeader('X-City-Request-ID', id);
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
    return reply(404, {error: 'Not found'});
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    validateConfiguration(process.env);
    const server = createCityServer();
    const port = Number(process.env.PORT || 8080);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error('Invalid port');
    server.listen(port, '0.0.0.0', () => console.info(JSON.stringify({event: 'cloud_city_ready_v1', port})));
    process.once('SIGTERM', () => {
      server.close();
      setTimeout(() => { server.closeAllConnections(); process.exit(0); }, 8500).unref();
    });
  } catch {
    console.error('City server startup failed; check configuration.');
    process.exitCode = 1;
  }
}
