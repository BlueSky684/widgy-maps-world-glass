import {createHash} from 'node:crypto';

// Warm-instance cache only. Never share responses through a public CDN.
// Full location and rendering options belong in the caller's key.
export function createMapRenderCache({now = Date.now, maxEntries = 4, maxBytes = 32 * 1024 * 1024} = {}) {
  const entries = new Map(), pending = new Map();
  let bytes = 0;
  function remove(key) {
    const entry = entries.get(key);
    if (entry) { bytes -= entry.png.length; entries.delete(key); }
  }
  function prune() {
    for (const [key, entry] of entries) if (entry.expiresAt <= now()) remove(key);
  }
  return async function get(key, {expiresAt, renderedAt, render}) {
    prune();
    const hit = entries.get(key);
    if (hit) {
      entries.delete(key); entries.set(key, hit);
      return {entry: hit, state: 'HIT'};
    }
    const running = pending.get(key);
    if (running) return {entry: await running, state: 'COALESCED'};
    const work = (async () => {
      const png = await render();
      const entry = {png, renderedAt, expiresAt,
        etag: '"' + createHash('sha256').update(png).digest('hex') + '"'};
      prune();
      if (expiresAt > now() && png.length <= maxBytes && maxEntries > 0) {
        remove(key);
        while (entries.size >= maxEntries || bytes + png.length > maxBytes) remove(entries.keys().next().value);
        entries.set(key, entry); bytes += png.length;
      }
      return entry;
    })();
    // Bound retained in-flight keys as well as completed PNGs.
    const tracked = pending.size < maxEntries;
    if (tracked) pending.set(key, work);
    try { return {entry: await work, state: 'MISS'}; }
    finally { if (tracked && pending.get(key) === work) pending.delete(key); }
  };
}
