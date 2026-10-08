import {createHash} from 'node:crypto';
import {BridgeError} from './security.js';

// Share only OAuth exchanges in one warm process. Event data keeps its existing
// refresh policy. Nothing is persisted or exposed through browser/CDN caches.
export function createGoogleAccessCache({request, now = Date.now, maxEntries = 50,
  scope = () => [process.env.CALENDAR_GOOGLE_CLIENT_ID,
    process.env.CALENDAR_GOOGLE_CLIENT_SECRET, process.env.CALENDAR_TOKEN_VERSION]} = {}) {
  const entries = new Map();
  return async function access(credentials) {
    if (typeof credentials?.refresh !== 'string' || !credentials.refresh)
      throw new BridgeError('google_connection_failed', 502);
    const startedAt = now();
    for (const [id, entry] of entries)
      if (entry.until <= startedAt || startedAt < entry.startedAt) entries.delete(id);
    const id = createHash('sha256').update(JSON.stringify([scope(), credentials.refresh])).digest('hex');
    const hit = entries.get(id);
    if (hit) return hit.pending;
    const entry = {startedAt, until: startedAt + 60000};
    // Queue request work after installing the entry, including synchronous errors.
    entry.pending = Promise.resolve().then(() => request(credentials)).then(tokens => {
      if (typeof tokens?.access_token !== 'string' || !tokens.access_token)
        throw new BridgeError('google_connection_failed', 502);
      const lifetime = Number(tokens.expires_in);
      // Never invent an expiry, extend it on a hit, or retain a failed exchange.
      entry.until = startedAt + (Number.isFinite(lifetime) && lifetime > 30
        ? Math.min(60000, (lifetime - 30) * 1000) : 0);
      if (entry.until <= now() && entries.get(id) === entry) entries.delete(id);
      return tokens.access_token;
    }).catch(error => {
      if (entries.get(id) === entry) entries.delete(id);
      throw error;
    });
    if (maxEntries > 0) {
      while (entries.size >= maxEntries) entries.delete(entries.keys().next().value);
      entries.set(id, entry);
    }
    return entry.pending;
  };
}
