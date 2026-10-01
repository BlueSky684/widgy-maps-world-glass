import {readFileSync, writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {daylightScript} from './widgy-daylight-logic.mjs';

const read = name => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
const before = read('./widgy-day-night.json');
const widget = structuredClone(before);
const home = widget['1'].find(n => n.d0 === 245);
const layer = id => {const n = home['1'].find(n => n.d0 === id); assert(n, `Missing layer ${id}`); return n;};
const text = value => ({'5':'Custom Text','6':'Text','25':value});
const source = (category, field) => ({'5':category,'6':field});

// Native source names copied from the user's exports: Pedometer/Distance,
// Sun And Moon/Sunrise/Sunset and Weather (Now)/Max./Min. Temperature Today.
layer(6143)['66'] = [source('Pedometer', 'Distance')];
layer(6144)['66'] = [source('Health', 'Active Energy Burned')];
// Keep the original number + native Steps unit. The caption gives its period.
layer(6142)['66'] = [text('today')];
layer(6133)['66'] = [text('↑ '), source('Weather (Now)', 'Max. Temperature Today')];
layer(6134)['66'] = [text('↓ '), source('Weather (Now)', 'Min. Temperature Today')];

// Widgy draws the first item at the front. These aliases had been appended
// behind Full Graphite Background. Move the complete original groups intact.
const aliasIds = new Set([80070, 80083, 80096]);
const aliases = home['1'].filter(n => aliasIds.has(n.d0));
assert.equal(aliases.length, 3);
home['1'] = home['1'].filter(n => !aliasIds.has(n.d0));
const weatherEnd = home['1'].findIndex(n => n.d0 === 80010) + 1;
assert(weatherEnd > 0);
home['1'].splice(weatherEnd, 0, ...aliases);

const variables = widget['36'];
const progressIndex = variables.findIndex(v => v['1'] === 'day_progress');
assert(progressIndex >= 0);
function solarVariable(name, id, sourceLayer) {
  const data = structuredClone(variables[0]['3']);
  data['66'] = structuredClone(layer(sourceLayer)['66']);
  data.s = `Variable: ${name}`;
  return {'0':id,'1':name,'2':0,'3':data};
}
variables.splice(progressIndex, 0,
  solarVariable('sunrise_today', 'AC51B062-2774-4B83-9F84-C612A695148A', 6121),
  solarVariable('sunset_today', 'A066178C-0FD3-4121-AD56-1D19065849ED', 6124));
variables.find(v => v['1'] === 'day_progress')['3']['66'] = [
  {'5':'Javascript','6':'Script','10':daylightScript}
];
// Use Widgy's native variable text binding, as in the original working label.
// A second JavaScript layer can execute before variable resolution, turn an
// empty string into Number('') === 0 and cache 0% while the fill is already 21%.
const progressId = variables.find(v => v['1'] === 'day_progress')['0'];
const percentage = layer(6123);
percentage['66'] = [text('${widgy.day_progress}%')];
percentage.o1 = {'0':progressId,'1':5,'2':'0'};
const unavailable = structuredClone(percentage);
unavailable.d0 = widget.a2++;
unavailable.s = 'Day Progress Unavailable';
unavailable['66'] = [text('—')];
unavailable.o1 = {'0':progressId,'1':0,'2':'-1'};
home['1'].splice(home['1'].findIndex(n => n.d0 === 6123),0,unavailable);

// A downloaded JSON must preserve the F50 host selected by the existing import
// page. This is the same origin as the verified public F50 page, not a new map.
const origin = process.argv[2];
assert(origin, 'Pass the verified public F50 origin used by the existing importer');
const parsed = new URL(origin);
assert(parsed.protocol === 'https:' && parsed.pathname === '/' && !parsed.search && !parsed.hash);
const map = layer(6170);
for (const key of ['2','22']) map[key] = map[key].replaceAll('https://widgy-maps-world-glass.vercel.app', parsed.origin);

widget['3'] = 'Widgy Home F50 Data';
widget['4'] = 'Revision 2: native percentage text binding shares the daylight variable directly with the fill. Approved F50 map and artwork preserved. Daylight progress uses today’s native sunrise/sunset and the device’s current local time zone, including daylight saving; 0% before sunrise, 100% after sunset, unavailable if no rise/set data. Live Pedometer distance, Health active energy and today’s weather high/low. Weather alias layer order repaired. Active energy remains unverified on device when the source returns no data; never substitute estimated or demo calories. Requires normal Widgy location, motion and Health permissions. Calendar demo content remains unchanged.';

writeFileSync(new URL('./widgy-home-f50-data.json', import.meta.url), JSON.stringify(widget));
console.log(JSON.stringify({name:widget['3'], mapOrigin:parsed.origin, bytes:Buffer.byteLength(JSON.stringify(widget))}));
