import {flatten, inlineSingleTextSources} from './compact-widget-structure.js';

// Start from the working city/fallback baseline, never the retired direct-city copy.
export function withCalendarDirectData(input) {
  if (input['3'] !== 'Widgy Calendar Compact Stable Test 1' ||
      flatten(input['1']).length !== 1190 || input['36'].length !== 55) {
    throw Error('Unexpected Calendar baseline');
  }
  const widget = structuredClone(input);
  const calendar = widget['1'].find(n => n.d0 === 247 && n.z === '13');
  if (!calendar) throw Error('Missing Calendar');
  const calendarIDs = new Set(flatten(calendar['1']).map(n => n.d0));
  const changes = inlineSingleTextSources(widget, v =>
    v['1'].startsWith('calendar_') && !v['1'].startsWith('calendar_home_') &&
    v['3']['66']?.[0]?.['5'] === 'JSON Endpoint');
  if (changes.length !== 9 || changes.some(c => !calendarIDs.has(c.layer))) {
    throw Error('Unexpected Calendar data consumers');
  }
  widget['3'] = 'Widgy Calendar Direct Data Test 1';
  widget['4'] = 'Isolated Calendar data-source trial on Compact Stable. Nine single-use JSON sources are bound directly to their existing text layers. All city sources and fallback, Home, live map, exact GPS, clock, native gauges, Calendar months and navigation remain unchanged. Data URLs, authentication and JSON paths are preserved. Native speed benefit is unverified; keep Compact Stable for comparison.';
  return {widget, changes};
}
