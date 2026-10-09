import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {withHomeDayAddback,DAY_IDS} from './home-day-addback.js';
import {flatten} from './compact-widget-structure.js';
const full=JSON.parse(readFileSync(process.argv[2])),control=JSON.parse(readFileSync(process.argv[3]));
const before=structuredClone(full),w=withHomeDayAddback(full);assert.deepEqual(full,before);
const home=w['1'].find(n=>n.d0===245),original=full['1'].find(n=>n.d0===245);
for(const n of home['1'].filter(n=>DAY_IDS.has(n.d0)))assert.deepEqual(n,original['1'].find(x=>x.d0===n.d0));
const reversed=structuredClone(w),rh=reversed['1'].find(n=>n.d0===245);rh['1']=rh['1'].filter(n=>!DAY_IDS.has(n.d0));
const c=rh['1'].find(n=>n.d0===80309),oc=control['1'].find(n=>n.d0===245)['1'].find(n=>n.d0===80309);c.s=oc.s;c['2']=oc['2'];
reversed['3']=control['3'];reversed['4']=control['4'];assert.deepEqual(reversed,control);
console.log(JSON.stringify({onlyDayAndChromeRegionAdded:true,originalSourcesFramesConditions:true,allOtherFieldsExact:true,layers:flatten(w['1']).length,variables:w['36'].length}));

const remaining=original["1"].filter(n=>!home["1"].some(x=>x.d0===n.d0));assert.deepEqual(remaining.map(n=>n.d0),[5001]);
