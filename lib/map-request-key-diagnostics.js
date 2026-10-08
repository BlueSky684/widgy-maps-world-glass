// Compare only keys already constructed by night-map. Return fixed labels,
// never coordinates, city text, a key, a hash, or a request URL.
// This describes the preceding reusable request in THIS instance, not the
// contents of the render cache or proof of why a cache lookup missed.
export function compareMapRequestKeys(previous, current) {
  if (previous === null) return {previousKeyComparison: 'first', previousKeyChanges: []};
  if (previous === current) return {previousKeyComparison: 'same', previousKeyChanges: []};
  const before = JSON.parse(previous), after = JSON.parse(current);
  const changes = [];
  if (JSON.stringify(before.slice(0, 5)) !== JSON.stringify(after.slice(0, 5))) changes.push('render_options');
  const a = before[5], b = after[5];
  if (Boolean(a) !== Boolean(b)) changes.push('location_availability');
  else if (a && b) {
    if (a.latitude !== b.latitude || a.longitude !== b.longitude) changes.push('coordinates');
    if (a.city !== b.city) changes.push('city');
    if (a.source !== b.source) changes.push('location_source');
  }
  return {previousKeyComparison: 'changed', previousKeyChanges: changes};
}

// Client-reported duration only, not a trusted server clock or device identity.
export function readCityTimingTrace(url) {
  const values = url.searchParams.getAll('city_trace_v1');
  if (values.length !== 1) return {};
  const match = /^(none|memory|fetch|empty|failed):([0-9]{1,7})$/.exec(values[0]);
  if (!match || Number(match[2]) > 3600000) return {};
  return {clientCityPath: match[1], clientCityScriptMs: Number(match[2])};
}
