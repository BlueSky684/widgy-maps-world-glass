// Offline research only. Uses the approved renderer without modifying it.
// Usage: node tools/research-map-transfer-fixtures-20261014.mjs /absolute/scratch/output
import {mkdir, writeFile} from 'node:fs/promises';
import {isAbsolute, join} from 'node:path';
import {createHash} from 'node:crypto';
import {renderHomeMap} from '../lib/home-map-day-night.js';
const output = process.argv[2];
if (!output || !isAbsolute(output)) throw Error('Provide an absolute temporary output directory');
await mkdir(output, {recursive: true});
const fixtures = [
  ['october-00', '2026-10-14T00:00:00Z', 31.8, 34.6, 'Ashdod'],
  ['october-06', '2026-10-14T06:00:00Z', 31.8, 34.6, 'Ashdod'],
  ['october-12', '2026-10-14T12:00:00Z', 35.7, 139.7, 'Tokyo'],
  ['october-18', '2026-10-14T18:00:00Z', 40.7, -74, 'New York'],
  ['march-equinox', '2026-03-20T12:00:00Z', -33.9, 151.2, 'Sydney'],
  ['june-solstice', '2026-06-21T00:00:00Z', 50, 5, 'Synthetic long location label'],
];
const manifest = [];
for (const [name, instant, latitude, longitude, city] of fixtures) {
  const start = performance.now();
  const png = await renderHomeMap({date: new Date(instant),
    location: {latitude, longitude, city}, width: 3306,
    presentation: 'glass', atlas: 'r6'});
  await writeFile(join(output, `${name}.png`), png);
  const row = {name, instant, location: {latitude, longitude, city},
    pngBytes: png.length, sha256: createHash('sha256').update(png).digest('hex'),
    renderMs: Math.round((performance.now() - start) * 10) / 10};
  manifest.push(row);
  console.log(JSON.stringify(row));
}
await writeFile(join(output, 'fixtures.json'), JSON.stringify(manifest, null, 2) + '\n');
