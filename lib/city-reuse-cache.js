// Opt-in, bounded, private process-local cache. A cold/different instance may
// miss; the phone keeps its existing client-side geocoder as fallback.
export function createCityReuseCache({now = Date.now, maxEntries = 256} = {}) {
  const entries = new Map(), ttl = 3600000;
  function identity(url) {
    const p = url.searchParams;
    for (const name of ['city_cache_scope', 'lat', 'lon', 'city_cache_v1']) {
      if (p.getAll(name).length !== 1) return null;
    }
    const scope = p.get('city_cache_scope');
    if (!/^[a-f0-9]{32}$/.test(scope)) return null;
    function coordinate(name, limit) {
      const raw = p.get(name);
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw)) return null;
      const n = Number(raw);
      return Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
    }
    const latitude = coordinate('lat', 90), longitude = coordinate('lon', 180);
    if (latitude === null || longitude === null) return null;
    return {key: JSON.stringify([scope, latitude, longitude]), latitude, longitude};
  }
  function prune(time) {
    for (const [key, entry] of entries) if (time - entry.observedAt >= ttl || time < entry.observedAt) entries.delete(key);
  }
  return {
    read(url) {
      const id = identity(url), time = now();
      if (!id || url.searchParams.get('city_cache_v1') !== 'read') return {state: 'INVALID'};
      prune(time);
      const entry = entries.get(id.key);
      if (!entry) return {state: 'MISS'};
      entries.delete(id.key); entries.set(id.key, entry);
      return {state: 'HIT', entry: {...entry}, remainingSeconds: Math.max(0, Math.floor((entry.observedAt + ttl - time) / 1000))};
    },
    remember(url) {
      const p = url.searchParams;
      if (p.get('city_cache_v1') !== 'map') return;
      const id = identity(url), time = now();
      if (!id || p.getAll('city').length !== 1 || p.getAll('city_cache_time').length !== 1) return;
      const raw = p.get('city_cache_time');
      if (!/^\d{13}$/.test(raw)) return;
      const observedAt = Number(raw);
      // Carry the original observation time through every reuse. Never extend
      // freshness just because an image or city is read again.
      if (observedAt > time || time - observedAt >= ttl) return;
      const city = Array.from(p.get('city').replace(/[\u0000-\u001f\u007f]/g, '').trim()).slice(0, 80).join('');
      if (!city) return;
      prune(time);
      if ((entries.get(id.key)?.observedAt ?? -1) > observedAt) return;
      entries.delete(id.key);
      entries.set(id.key, {latitude: id.latitude, longitude: id.longitude, city, observedAt});
      while (entries.size > maxEntries) entries.delete(entries.keys().next().value);
    }
  };
}
