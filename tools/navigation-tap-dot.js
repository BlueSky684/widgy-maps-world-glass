import assert from 'node:assert/strict';
import {flatten} from './compact-widget-structure.js';

export const DOT_IDS = [83001, 83002];
const pages = [245, 247, 246, 195];
const scalar = value => ({a:[{a:value,b:170,c:0,d:170}],b:0});

// A last-action indicator, NOT a verified touch-down timestamp. Widgy owns
// scheduling and may render these layers only alongside the destination page.
export function withNavigationTapDots(source, title) {
  const widget = structuredClone(source);
  const nodes = flatten(widget['1']);
  assert(DOT_IDS.every(id => !nodes.some(n => n.d0 === id)));
  const icon = nodes.find(n => n.d0 === 6191);
  assert.equal(icon?.z, '4');
  let changed = 0;
  for (const n of nodes) {
    if (n.z !== '11' || !/^(HOME|CALENDAR|WEATHER|FITNESS) Tap$/.test(n.s) || !n['1a']?.startsWith('button_')) continue;
    const [show, hide] = n['1a'].slice(7).split('-').map(s => s.split(',').map(Number));
    const destination = pages.find(id => show.includes(id));
    if (destination === undefined) continue; // Keep calendar month actions intact.
    const dot = destination === 245 ? DOT_IDS[0] : destination === 247 ? DOT_IDS[1] : null;
    if (dot !== null) show.unshift(dot);
    hide.push(...DOT_IDS.filter(id => id !== dot));
    n['1a'] = `button_${show.join(',')}-${hide.join(',')}`;
    changed++;
  }
  assert.equal(changed, 16);
  const dots = DOT_IDS.map((id, i) => ({
    z:'4', d0:id, s:`Tap indicator · ${i === 0 ? 'HOME' : 'CALENDAR'} · last action`,
    a:false, '3':'circle.fill', f:icon.f,
    b:scalar(i === 0 ? 194.22467 : 574.136564), c:scalar(1436),
    d:scalar(26), e:scalar(26)
  }));
  // First in the layer list is frontmost; no opaque chrome may cover the dots.
  widget['1'].unshift(...dots);
  widget['3'] = title;
  widget['4'] = `Temporary navigation-dot experiment based on ${source['3']}. A small white dot marks the most recent HOME or CALENDAR action and remains until the next navigation action. No timer, script, provider, or network request added. This does NOT establish the physical touch time: Widgy may render the dot with the page update. All original data, GPS, live map, city, Calendar month reset, and artwork remain unchanged.`;
  return widget;
}
