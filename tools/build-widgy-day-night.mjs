import {readFileSync, writeFileSync} from 'node:fs';
const base = JSON.parse(readFileSync(new URL('./widgy-v142.json', import.meta.url)));
const widget = structuredClone(base);
// An optional preview origin is supplied at build time, never guessed.
const origin = process.argv[2] || 'https://widgy-maps-world-glass.vercel.app';
const parsed = new URL(origin);
if (parsed.protocol !== 'https:' || parsed.pathname !== '/' || parsed.search || parsed.hash)
  throw Error('Expected an HTTPS deployment origin');
const endpoint = `${parsed.origin}/api/night-map`;
let count = 0;
function walk(value) {
  if (!value || typeof value !== 'object') return;
  if (value.d0 === 6170) {
    count++;
    for (const key of ['2', '22']) value[key] = value[key]
      .replaceAll('https://widgy-maps-world-glass.vercel.app/api/home-map?v=142', endpoint+'?mode=live');
  }
  for (const child of Object.values(value)) walk(child);
}
walk(widget);
if (count !== 1) throw Error('Expected exactly one map layer');
widget['3'] = 'Widgy Home Day Night Test';
writeFileSync(new URL('./widgy-day-night.json', import.meta.url), JSON.stringify(widget));
console.log(JSON.stringify({source: 'widgy-v142.json', endpoint, modifiedMapLayers: count}));
