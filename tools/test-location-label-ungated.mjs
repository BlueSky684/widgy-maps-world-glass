import fs from 'node:fs';import assert from 'node:assert/strict';
import {withLocationLabelUngated} from './location-label-ungated.js';
const input=JSON.parse(fs.readFileSync(process.argv[2]));const out=withLocationLabelUngated(input);
assert.deepEqual(out['36'],input['36']);
for(const [groupId,fallbackId,textId]of [[247,81871,83204],[246,84006,84013]]){
 const a=input['1'].find(n=>n.d0===groupId),b=out['1'].find(n=>n.d0===groupId);
 assert(!b['1'].some(n=>n.d0===fallbackId));
 assert(!b['1'].find(n=>n.d0===textId).o1);
 b['1'].splice(a['1'].findIndex(n=>n.d0===fallbackId),0,structuredClone(a['1'].find(n=>n.d0===fallbackId)));
 b['1'].find(n=>n.d0===textId).o1=structuredClone(a['1'].find(n=>n.d0===textId).o1);
}
assert.deepEqual(out,input);
console.log('PASS: only the two label visibility guards and native fallback groups change; all variables, requests, other layers and geometry preserved.');
