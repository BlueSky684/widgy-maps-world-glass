// Offline compatibility survey, not a phone or hosted-Vercel benchmark.
// Uses the original full-resolution renderer and a synthetic city/coordinate.
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {renderHomeMap} from '../lib/home-map-day-night.js';

const samples = [];
for (let hour = 0; hour < 24; hour++) samples.push(`2026-10-20T${String(hour).padStart(2, '0')}:00:00Z`);
for (const date of ['2026-06-21', '2026-12-21']) {
  for (const hour of ['00', '06', '12', '18']) samples.push(`${date}T${hour}:00:00Z`);
}
const rows = [];
for (const at of samples) {
  const start = performance.now();
  const body = await renderHomeMap({date: new Date(at), width: 3306,
    location: {latitude: 0, longitude: 0, city: 'Sample City', source: 'coordinates'},
    presentation: 'glass', atlas: 'r6'});
  const metadata = await sharp(body).metadata();
  if (metadata.width !== 3306 || metadata.height !== 1558) throw Error('Unexpected dimensions');
  await sharp(body).raw().toBuffer();
  rows.push({at, bytes: body.length, sha256: createHash('sha256').update(body).digest('hex'),
    renderAndDecodeMs: Math.round(performance.now() - start)});
}
const sizes = rows.map(row => row.bytes);
console.log(JSON.stringify({scope: 'local renderer; synthetic location; no external calls',
  samples: rows.length, minBytes: Math.min(...sizes), maxBytes: Math.max(...sizes),
  above4500000: rows.filter(row => row.bytes > 4500000).length,
  above4718592: rows.filter(row => row.bytes > 4718592).length,
  note: 'Documentation says 4.5 MB. Both decimal and binary thresholds are reported; neither is an observed hosted limit. Samples do not prove a global maximum.',
  rows}, null, 2));
