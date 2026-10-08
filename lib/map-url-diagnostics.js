import {createHash} from 'node:crypto';

// Bounded process-local comparison only. Store digests, emit fixed labels;
// never log URL text, coordinates, city, scope, ETag or any digest.
export function createMapURLDiagnostics({maxEntries = 8, now = Date.now} = {}) {
  const history = new Map();
  const digest = text => createHash('sha256').update(text).digest('hex');
  const fields = [['t','minute_stamp'],['city_cache_time','city_observation_time'],['city_trace_v1','city_timing_trace']];
  return function observe({key, rawURL, etag}) {
    try {
      if (typeof rawURL !== 'string' || rawURL.length > 16384 || typeof etag !== 'string') return {};
      const time = now(), url = new URL(rawURL, 'https://diagnostic.invalid');
      const bucket = digest(key), signature = digest(rawURL), image = digest(etag);
      const parts = fields.map(([name]) => digest(JSON.stringify(url.searchParams.getAll(name))));
      for (const [name] of fields) url.searchParams.delete(name);
      parts.push(digest(url.href));
      for (const [k,v] of history) if (time < v.time || time-v.time >= 3600000) history.delete(k);
      const previous = history.get(bucket), changes = [];
      if (previous && previous.signature !== signature) {
        parts.forEach((part,i) => {if (part !== previous.parts[i]) changes.push(fields[i]?.[1] || 'other_url_fields');});
        if (!changes.length) changes.push('url_text_only');
      }
      history.delete(bucket); history.set(bucket,{signature,image,parts,time});
      while (history.size > maxEntries) history.delete(history.keys().next().value);
      return {
        urlForRenderKey: !previous ? 'first' : previous.signature === signature ? 'same' : 'changed',
        imageForRenderKey: !previous ? 'first' : previous.image === image ? 'same' : 'changed',
        urlChangesForRenderKey: changes
      };
    } catch {
      // Diagnostic failures must never prevent delivery of an existing image.
      return {};
    }
  };
}
