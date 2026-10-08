import {flatten, combineSeparators, shareDotsClock, pruneUnused} from './compact-widget-structure.js';

// Port only Calendar drawings/dot-clock sharing and proven dead-variable
// removal onto the current live-GPS map. No map-provider or Home changes.
export function compactStableCalendar(input) {
  if (input['3'] !== 'Widgy Server City Cache Test 1' ||
      input['36']?.length !== 81 || flatten(input['1']).length !== 1415) {
    throw Error('Unexpected stable baseline; keep the existing widget unchanged');
  }
  const widget = structuredClone(input), calendar = widget['1'].find(n => n.d0 === 247 && n.s === 'CALENDAR');
  const map = flatten(widget['1']).find(n => n.s === 'Home Hero World Map');
  if (!calendar || map?.['1'] !== 'Web URL' || map['2'] !== '${widgy.map_request}') throw Error('Unexpected map or Calendar');
  const layouts = flatten(calendar['1']).filter(n => /^Calendar · [456] Week Layout$/.test(n.s || ''));
  if (layouts.length !== 75) throw Error('Expected all 25 month layouts');
  const separatorChanges = layouts.map(combineSeparators);
  const dots = shareDotsClock(widget), pruned = pruneUnused(widget);
  if (pruned.slice().sort().join(',') !== 'steps_goal,steps_progress') throw Error('Unexpected unreachable variables');
  widget['3'] = 'Widgy Calendar Compact Stable Test 1';
  widget['4'] = 'Calendar structure trial on the current full live-map widget. Week separator drawings combined, one shared minute clock for all 25 dot URLs, two unused step variables removed. Home, GPS, dynamic city, map, clock, native day gauge, step ring and all calendar event sources retained. Native appearance and transition speed require a phone comparison with Server City Cache Test 1.';
  return {widget, report:{
    before:{nodes:1415, variables:81, separatorDrawings:300, dotURLScripts:25},
    after:{nodes:flatten(widget['1']).length, variables:widget['36'].length, separatorDrawings:75, dotClockScripts:1},
    separatorChanges, dots, pruned
  }};
}
