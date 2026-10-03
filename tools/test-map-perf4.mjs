// Prepare lib/perf4-map-baseline.js from 614077bad3ae90f386dd99dcdf3ffd1e4e879faf.
// Build map cache first. Baseline files are temporary, never committed.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const run=module=>JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',`
  import {createHash} from 'node:crypto';
  import sharp from 'sharp';
  import {renderHomeMap} from ${JSON.stringify(module)};
  import {precomputedState} from './lib/map-precomputed.js';
  const input={date:new Date('2026-10-03T19:36:00Z'),atlas:'r6',presentation:'glass',width:3306,
    location:{latitude:31.7,longitude:34.6,city:'Ashkelon'}};
  const rows=[];
  for(let i=0;i<2;i++){
    const start=performance.now(),png=await renderHomeMap(input),ms=performance.now()-start;
    rows.push({ms:Math.round(ms),bytes:png.length,
      pixels:createHash('sha256').update(await sharp(png).raw().toBuffer()).digest('hex'),
      icc:createHash('sha256').update((await sharp(png).metadata()).icc).digest('hex')});
  }
  console.log(JSON.stringify({rows,prepared:precomputedState()}));
`],{cwd:new URL('..',import.meta.url),encoding:'utf8'}));
const before=run('./lib/perf4-map-baseline.js'),after=run('./lib/home-map-day-night.js');
assert.equal(after.prepared,'HIT');
for(let i=0;i<2;i++)for(const key of ['pixels','icc','bytes'])assert.equal(after.rows[i][key],before.rows[i][key]);
console.log(JSON.stringify({passed:true,before,after,deviceTimingNotMeasured:true},null,2));
