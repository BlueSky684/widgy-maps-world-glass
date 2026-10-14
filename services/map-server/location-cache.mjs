// Portable private cache. Reuses the EXISTING Upstash account and budget ledger;
// no Vercel runtime cache, new provider quota or publicly readable city objects.
export function createLocationCache({env = () => process.env, fetcher = fetch} = {}) {
  async function command(parts) {
    const config = env();
    const endpoint = config.UPSTASH_REDIS_REST_URL || config.KV_REST_API_URL;
    const token = config.UPSTASH_REDIS_REST_TOKEN || config.KV_REST_API_TOKEN;
    const url = new URL(endpoint);
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.upstash.io') ||
        url.username || url.password || url.search || url.hash || !token) {
      throw Error('cache_not_configured');
    }
    const response = await fetcher(url, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(350),
      headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'},
      body: JSON.stringify(parts)
    });
    if (!response.ok) throw Error('cache_unavailable');
    const value = await response.json();
    if (value.error) throw Error('cache_unavailable');
    return value.result;
  }
  const keyFor = key => {
    if (!/^[a-f0-9]{64}$/.test(key)) throw Error('invalid_cache_key');
    return `widgy:map:cloud-run:city:v1:${key}`;
  };
  return {
    async get(key) {
      const value = await command(['GET', keyFor(key)]);
      return typeof value === 'string' ? JSON.parse(value) : null;
    },
    async set(key, entry, {ttl}) {
      if (!Number.isInteger(ttl) || ttl < 1 || ttl > 21600) throw Error('invalid_cache_ttl');
      await command(['SET', keyFor(key), JSON.stringify(entry), 'EX', String(ttl)]);
    }
  };
}
