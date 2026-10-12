// Build only public, synthetic full-resolution fixtures; no private input.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {renderHomeMap} from '../lib/home-map-day-night.js';
import config from '../lib/map-stability-config.json' with {type:'json'};
for(const fixture of Object.values(config.fixtures)){
 const bytes=await renderHomeMap({date:new Date(fixture.at),location:null,width:3306,presentation:'glass',atlas:'r6'});
 assert.equal(bytes.length,fixture.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),fixture.sha256,'Fixture renderer changed; review before publishing');
 fs.mkdirSync('assets/diagnostics/map-stability-15',{recursive:true});fs.writeFileSync(fixture.path,bytes);
}
console.log('Map stability: two verified full-resolution prepared fixtures.');
