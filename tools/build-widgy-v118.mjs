import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {allNodes} from './build-widgy-v110.mjs';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const write=(name,data)=>writeFileSync(new URL(name,import.meta.url),data);
const before=JSON.parse(read('widgy-v117.json'));
const data=structuredClone(before);
const clock=allNodes(data).find(n=>n.d0===6110);
const oldClock=structuredClone(clock);
// Exact native datasource and font names verified in the user's September 13
// Midnight Glass(2).txt export, clock layer 21. No masking or custom formatter.
clock['66']=[{'5':'Date And Time','6':'Live Timer (24 hours, No Seconds)'}];
clock['1']='System Light';
// Slightly taller text box, with the existing optical centre and left edge.
// Regular-width light digits follow the approved Master's thin clock style.
const frame={b:88,c:466,d:610,e:200};
for(const [key,value] of Object.entries(frame)) clock[key].a[0].a=value;
data['39']['System Light']=1;
data['3']='Widgy Home v118 - Live 24h Master Clock';
data['4']='v118: native Live Timer (24 hours, No Seconds), using the exact datasource from the user\'s Widgy export. System Light clock with a 610 x 200 frame, left 88, top 466, to approach the approved Master\'s light regular-width clock proportions. Clock requires on-device visual verification. Preserves the full v117 map frame enlarged by 4%, v116 balanced night rendering, dynamic greetings and day progress, weather conditions, location behavior and all other native layers.';

// Ensure the clock and font registration are the only functional changes.
const restored=structuredClone(data);
const restoredClock=allNodes(restored).find(n=>n.d0===6110);
for(const key of Object.keys(restoredClock)) delete restoredClock[key];
Object.assign(restoredClock,oldClock);
for(const key of ['3','4','39']) restored[key]=structuredClone(before[key]);
assert.deepEqual(restored,before);
assert.equal(frame.c+frame.e/2,oldClock.c.a[0].a+oldClock.e.a[0].a/2);
assert.equal(clock['66'].length,1);
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');
let html=read('widgy-v117.html').replaceAll('v117','v118')
 .replace('המפה גדולה ב־4%, עם כל תמונת המפה באותו יחס רוחב וגובה.','טיימר חי 24 שעות ללא שניות, בפונט דק ובגודל מותאם למאסטר.')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`)
 .replaceAll('Larger World Map','Live 24h Master Clock');
assert.equal(gunzipSync(Buffer.from(html.match(/const packed=\['([^']+)'\]/)[1],'base64')).toString(),payload);
write('widgy-v118.json',payload);
write('widgy-v118.html',html);
write('widgy-v118-integration.json',JSON.stringify({base:'v117',status:'prepared',
 changedLayerIds:[6110],scope:'Native clock source, font and text frame',
 source:clock['66'],sourceEvidence:'User-uploaded Midnight Glass(2).txt, September 13 2026, layer 21',
 font:clock['1'],frame,previousFrame:Object.fromEntries(['b','c','d','e'].map(k=>[k,oldClock[k].a[0].a])),
 fontRegistration:'System Light: 1',
 map:'Unchanged from v117: 4% larger complete image frame; v116 renderer',
 layout:'Text-box height +6.38%; same horizontal extent and vertical centre. Final glyph rendering is native Widgy.',
 deviceVerified:false,bytes:Buffer.byteLength(payload),sha256:hash},null,2)+'\n');
let fragment=readFileSync('/workspace/widgy-v117-copy.html','utf8').replaceAll('v117','v118')
 .replace(/<script type="application\/json" data-packed>[\s\S]*?<\/script>/,`<script type="application/json" data-packed>${JSON.stringify(packed)}</script>`)
 .replace(/payload.length !== \d+/,`payload.length !== ${payload.length}`)
 .replaceAll('Larger World Map','Live 24h Master Clock')
 .replace(/hash !== '[^']+'/,`hash !== '${hash}'`);
writeFileSync('/workspace/widgy-v118-copy.html',fragment);
assert.equal(gunzipSync(Buffer.from(JSON.parse(fragment.match(/data-packed>([\s\S]*?)<\/script>/)[1]),'base64')).toString(),payload);
console.log(JSON.stringify({version:118,bytes:Buffer.byteLength(payload),sha256:hash,frame,changedLayerIds:[6110],copyPayload:'verified'}));
