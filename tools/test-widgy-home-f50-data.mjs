import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {daylightPercent, localSolarTime, daylightScript} from './widgy-daylight-logic.mjs';

const originalTZ = process.env.TZ;
let cases = 0;
function check(zone, instant, sunrise, sunset, expected) {
  process.env.TZ = zone;
  const now = new Date(instant);
  assert.equal(daylightPercent(now, sunrise, sunset), expected, `${zone} ${instant}`);
  class Clock extends Date {constructor(...args) {super(...(args.length ? args : [now.getTime()]));}}
  const script = daylightScript.replaceAll('${widgy.sunrise_today}', sunrise).replaceAll('${widgy.sunset_today}', sunset);
  assert.equal(vm.runInNewContext(script + '\nmain()', {Date:Clock}), expected);
  cases++;
}
check('Asia/Jerusalem','2026-10-01T08:45:00+03:00','6:35','18:26',18);
check('Asia/Jerusalem','2026-10-01T09:09:00+03:00','6:35','18:26',21);
check('Asia/Jerusalem','2026-10-01T05:00:00+03:00','6:35','18:26',0);
check('Asia/Jerusalem','2026-10-01T06:35:00+03:00','6:35','18:26',0);
check('Asia/Jerusalem','2026-10-01T18:26:00+03:00','6:35','18:26',100);
check('Asia/Jerusalem','2026-10-01T23:59:00+03:00','6:35','18:26',100);
check('Asia/Jerusalem','2026-10-02T00:00:00+03:00','6:36','18:25',0);
// Actual elapsed time across the Israeli spring/fall clock changes.
check('Asia/Jerusalem','2026-03-27T01:00:00+02:00','00:00','06:00',20);
check('Asia/Jerusalem','2026-03-27T03:00:00+03:00','00:00','06:00',40);
check('Asia/Jerusalem','2026-10-25T01:30:00+03:00','00:00','06:00',21);
check('Asia/Jerusalem','2026-10-25T01:30:00+02:00','00:00','06:00',35);
check('America/New_York','2026-03-08T03:00:00-04:00','00:00','06:00',40);
check('America/New_York','2026-11-01T01:30:00-05:00','00:00','06:00',35);
check('Europe/London','2026-03-29T02:00:00+01:00','00:00','06:00',20);
check('Australia/Sydney','2026-10-04T03:00:00+11:00','00:00','06:00',40);
check('Australia/Sydney','2026-04-05T02:30:00+10:00','00:00','06:00',50);
check('Asia/Kathmandu','2026-10-01T12:00:00+05:45','06:00','18:00',50);
check('Asia/Tokyo','2026-10-01T12:00:00+09:00','6:00 AM','6:00 PM',50);
check('Pacific/Auckland','2026-10-01T12:00:00+13:00','06:00','18:00',50);
check('Asia/Jerusalem','2026-10-01T08:45:00+03:00','6:35 AM','6:26 PM',18);
check('Asia/Jerusalem','2026-10-01T08:45:00+03:00','6:35 לפנה״צ','6:26 אחה״צ',18);
check('Asia/Jerusalem','2026-10-01T08:45:00+03:00','\u200e٠٦:٣٥','١٨:٢٦\u200f',18);
check('Asia/Jerusalem','2026-10-01T08:45:00+03:00','2026-10-01T06:35:00+03:00','2026-10-01T18:26:00+03:00',18);
for (const pair of [['','18:26'],['—','—'],['No sunrise','No sunset'],['25:00','18:26'],['06:70','18:26'],['18:26','6:35'],['6:35','6:35'],['2026-09-30T06:35:00+03:00','18:26']]) {
  check('Asia/Jerusalem','2026-10-01T08:45:00+03:00',...pair,-1);
}
process.env.TZ = 'Asia/Jerusalem';
assert(Number.isNaN(localSolarTime('02:30',new Date('2026-03-27T05:00:00+03:00'))));

const read = name => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
const before = read('./widgy-day-night.json'), after = read('./widgy-home-f50-data.json');
function nodes(widget) {
  const result = [];
  function visit(n) {result.push(n); if(n.z === '13') n['1'].forEach(visit);}
  widget['1'].forEach(visit);return result;
}
const original = nodes(before), fixed = nodes(after), lookup = new Map(fixed.map(n => [n.d0,n]));
assert.equal(fixed.length,original.length+1);
assert.equal(lookup.size,fixed.length);
const changed = new Set([245,6123,6133,6134,6142,6143,6144,6170]);
for (const n of original) if(!changed.has(n.d0)) assert.deepEqual(lookup.get(n.d0),n,`Unexpected edit: ${n.s}`);
for (const id of [6123,6133,6134,6142,6143,6144]) {
  const old = original.find(n=>n.d0===id), copy = structuredClone(lookup.get(id));
  if(id===6123)delete copy.o1;
  copy['66']=old['66'];assert.deepEqual(copy,old,'Layout, fonts and colors must not change');
}
const oldMap = original.find(n=>n.d0===6170), map = structuredClone(lookup.get(6170));
for (const key of ['2','22']) map[key] = map[key].replaceAll('https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app','https://widgy-maps-world-glass.vercel.app');
assert.deepEqual(map,oldMap,'Map changes beyond the existing importer origin adaptation');
const home=after['1'].find(n=>n.d0===245)['1'];
for(const id of [80070,80083,80096]) assert(home.findIndex(n=>n.d0===id)<home.findIndex(n=>n.d0===6160),'Weather aliases must be in front of the card and background');
assert.deepEqual(lookup.get(6143)['66'],[{'5':'Pedometer','6':'Distance'}]);
assert.deepEqual(lookup.get(6144)['66'],[{'5':'Health','6':'Active Energy Burned'}]);
assert.equal(after['36'].length,before['36'].length+2);
assert(after.a2>Math.max(...fixed.map(n=>n.d0)));
const progressVariable=after['36'].find(v=>v['1']==='day_progress');
const percentage=lookup.get(6123);
assert.deepEqual(percentage['66'],[{'5':'Custom Text','6':'Text','25':'${widgy.day_progress}%'}]);
assert.deepEqual(percentage.o1,{'0':progressVariable['0'],'1':5,'2':'0'});
const unavailable=fixed.find(n=>n.s==='Day Progress Unavailable');
assert.deepEqual(unavailable.o1,{'0':progressVariable['0'],'1':0,'2':'-1'});
assert.equal(unavailable['66'][0]['25'],'—');
for(const n of before['36']) if(n['1']!=='day_progress') assert.deepEqual(after['36'].find(v=>v['0']===n['0']),n);
for(const id of [6121,6124]) assert.deepEqual(lookup.get(id),original.find(n=>n.d0===id));
const fills=home.filter(n=>n.s?.startsWith('Day Progress Fill'));
assert.equal(fills.length,100);
const track=lookup.get(6151);
for(const percent of [-1,0,18,21,50,99,100]) {
  const enabled=fills.filter(n=>percent>=Number(n.o1['2']));
  const width=Math.max(0,...enabled.map(n=>n.d.a[0].a));
  assert(Math.abs(width-track.d.a[0].a*Math.max(0,percent)/100)<1e-8);
  const label=percent>=0 ? percentage['66'][0]['25'].replace('${widgy.day_progress}',String(percent)) : unavailable['66'][0]['25'];
  assert.equal(label,percent<0?'—':`${percent}%`);
}
if(originalTZ===undefined)delete process.env.TZ;else process.env.TZ=originalTZ;
console.log(`PASS: ${cases} daylight/time-zone cases, serialized Widgy script execution, clock changes, unavailable-data handling, synchronized bar, preserved F50 map/artwork/layout.`);
console.log('Native Health data permissions/rendering require iPhone verification after import.');
