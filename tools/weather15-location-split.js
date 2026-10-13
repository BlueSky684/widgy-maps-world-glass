// Transform the owner's complete Weather 15 export, never a reduced demo.
// Private URLs remain in the caller's memory; this module embeds no credentials.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

export const SPLIT_WIDTH = 3306;
export const SPLIT_DESCRIPTION = 'Weather 15: live map and transparent GPS/city overlay; 3306 × 1558';
export function* widgetLayers(node) {
  if (node?.z) yield node;
  if (Array.isArray(node?.['1'])) for (const child of node['1']) yield* widgetLayers(child);
}
export function splitWeather15(source, {uuid = randomUUID()} = {}) {
  assert.equal(source['3'], 'Widgy Weather 15');
  const widget = structuredClone(source);
  const layers = [...widgetLayers(widget)];
  const home = layers.find(n => n.d0 === 245);
  const map = home?.['1']?.find(n => n.d0 === 6170);
  assert(map?.z === '5' && map['1'] === 'Web URL' && map['2'] === '${widgy.map_request}', 'Unexpected map layer');
  const variables = widget['36'];
  assert(Array.isArray(variables) && !variables.some(v => v['1'] === 'map_location_request'), 'Already split or unknown variables');
  const request = variables.find(v => v['1'] === 'map_request');
  const sourceText = request?.['3']?.['66'];
  assert(sourceText?.length === 1 && sourceText[0]['5'] === 'Custom Text', 'Unexpected map URL source');
  const originalURL = new URL(sourceText[0]['25']);
  assert.equal(originalURL.origin, 'https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app');
  assert.equal(originalURL.pathname, '/api/night-map');
  assert.equal(originalURL.searchParams.get('shared_location'), '1');
  assert.equal(originalURL.searchParams.get('lat'), '${widgy.map_latitude_max5}');
  assert.equal(originalURL.searchParams.get('lon'), '${widgy.map_longitude_max5}');
  assert.equal(originalURL.searchParams.get('t'), '${widgy.calendar_refresh_minute}');
  assert.equal(originalURL.searchParams.get('presentation'), 'glass');
  assert.equal(originalURL.searchParams.get('atlas'), 'r6');
  assert(originalURL.searchParams.get('location_key')?.length >= 32);
  const overlayRequest = structuredClone(request);
  assert(!variables.some(v => v['0'] === uuid.toUpperCase()), 'Duplicate variable UUID');
  overlayRequest['0'] = uuid.toUpperCase();
  overlayRequest['1'] = 'map_location_request';
  overlayRequest['3'].s = 'Variable: map_location_request';
  originalURL.searchParams.set('width', String(SPLIT_WIDTH));
  originalURL.searchParams.set('layer', 'location');
  // Widgy substitutes literal ${widgy.name} tokens in native Custom Text.
  overlayRequest['3']['66'][0]['25'] = originalURL.href.replace(/%24%7B/g, '${').replace(/%7D/g, '}');
  sourceText[0]['25'] = `${originalURL.origin}${originalURL.pathname}?mode=live&width=${SPLIT_WIDTH}&presentation=glass&atlas=r6&reuse=60&layer=base&lat=&lon=&t=\${widgy.calendar_refresh_minute}`;
  variables.splice(variables.indexOf(request) + 1, 0, overlayRequest);
  const overlay = structuredClone(map);
  overlay.d0 = Math.max(...layers.map(n => Number(n.d0) || 0)) + 1;
  overlay.s = 'Home Map Location Overlay';
  overlay['2'] = '${widgy.map_location_request}';
  // Widgy lists frontmost first. Keep existing clock/events above both images
  // and put the new transparent image immediately in front of the base map.
  home['1'].splice(home['1'].indexOf(map), 0, overlay);
  widget['4'] = SPLIT_DESCRIPTION;
  return widget;
}
