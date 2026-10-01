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
      .replaceAll('https://widgy-maps-world-glass.vercel.app/api/home-map?v=142', endpoint+'?mode=live&width=3306');
  }
  for (const child of Object.values(value)) walk(child);
}
walk(widget);
if (count !== 1) throw Error('Expected exactly one map layer');
widget['3'] = 'Widgy Home F50 Test';
widget['4'] = 'Approved F coastal engraving +50%, inner width +25%. Original approved terrain and night lights. Date-driven day/night. Full-resolution lossless PNG 3306 x 1558; original approved source resolution. Refresh follows Widgy. Native device verification pending.';
writeFileSync(new URL('./widgy-day-night.json', import.meta.url), JSON.stringify(widget));
const light=structuredClone(widget);
function reduce(value){if(!value||typeof value!=='object')return;if(value.d0===6170)for(const key of ['2','22'])value[key]=value[key].replaceAll('width=3306','width=1653');for(const child of Object.values(value))reduce(child);}
reduce(light);light['3']='Widgy Home F50 Loading Test';
light['4']='Diagnostic half-resolution PNG 1653 x 779 only. Not the final full-resolution map. '+widget['4'];
writeFileSync(new URL('./widgy-day-night-light-test.json',import.meta.url),JSON.stringify(light));
console.log(JSON.stringify({source: 'widgy-v142.json', endpoint, modifiedMapLayers: count}));
