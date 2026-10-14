// Enforce retention on reads even before asynchronous Firestore TTL cleanup.
// The budget document is in a different collection and never has a TTL.
export function createLocationCache({store, now = Date.now} = {}) {
  const pathFor = key => {
    if (!/^[a-f0-9]{64}$/.test(key)) throw Error('invalid_cache_key');
    return `widgyCityCache/${key}`;
  };
  return {
    async get(key) {
      const document = await store.get(pathFor(key), {timeoutMs: 350});
      if (!document) return null;
      const {entry, expiresAt} = document.value;
      if (!(expiresAt instanceof Date) || expiresAt.getTime() <= now()) return null;
      return entry;
    },
    async set(key, entry, {ttl}) {
      if (!Number.isInteger(ttl) || ttl < 1 || ttl > 21600) throw Error('invalid_cache_ttl');
      await store.put(pathFor(key), {entry, expiresAt: new Date(now() + ttl * 1000)}, {timeoutMs: 350});
    }
  };
}
