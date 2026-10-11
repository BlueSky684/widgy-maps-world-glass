import fs from 'node:fs';
import assert from 'node:assert/strict';
import {DIAL} from './design.mjs';

const root=new URL('../../',import.meta.url);
const read=p=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const original=read('tools/Widgy_Device_Glass_4.json');
const reference=read('tools/device-glass/native-circle-reference.json');
const widget=structuredClone(original);
const index=widget['1'].findIndex(n=>n.z==='9');
assert(index>=0);
const previous=widget['1'][index];
const circle=structuredClone(reference.layer);
// The owner's z:8 layer has already drawn an exact 75% sweep in IMG_0285.
// Styling keys below occur in creator-published native Circle Chart exports:
// https://www.reddit.com/r/widgy/comments/knrtsc/
// https://www.reddit.com/r/widgy/comments/jn65o0/
// https://www.reddit.com/r/widgy/comments/m9g9s1/
// Their numeric scalars are encoded using the current export's constant
// container. This is a compatibility trial, not a verified v27 schema.
const scalar=a=>({b:0,a:[{a:Number(a.toFixed(6)),b:1294,c:0,d:1294}]});
for(const k of ['b','c','d','e','d0'])circle[k]=structuredClone(previous[k]);
circle.s='Battery · Native Circle Chart';
circle['5']=previous['10']; // Segment material, rather than text colour f.
circle['8']=scalar(100*(DIAL.r-DIAL.stroke/2)/(DIAL.r+DIAL.stroke/2));
// Retain the native top origin and sweep defaults proven in the comparison.
// The public thin-circle configurations disable both 10 and 12; their exact
// current UI labels are not asserted here. Clear text is also intentional.
circle['10']=false;
circle['12']=false;
circle['13']='uicol_clear-100';
circle['14']=scalar(0);
circle.f='uicol_clear-100';
widget['1'][index]=circle;
widget['3']='Widgy Device Glass 5';
widget['4']='Device Glass 5 — native Circle Chart compatibility trial after IMG_0285 showed a correct 75% Circle sweep and a short Ring sweep. One chart layer replaces the old Ring Chart. Target: original lime, 68px centre radius and 4.5px stroke. Styling adapted from published native Circle exports into the current numeric container; v27 styling and endpoints still require native phone validation. No adjustment to the battery input. Other 12 layers, fonts, artwork, readings and interactions are identical to Device Glass 4.';
assert.equal(widget['1'].length,13);
for(let i=0;i<13;i++)if(i!==index)assert.deepEqual(widget['1'][i],original['1'][i]);
assert.equal(circle['1'],'1-Segment Info');
assert.equal(circle['2'],'Battery Level');
assert.equal(circle.z,'8');
assert(!('20' in circle)&&!('21' in circle));
const outer=circle.d.a[0].a*530/1600/2;
const inner=outer*circle['8'].a[0].a/100;
assert(Math.abs((outer+inner)/2-DIAL.r)<1e-5);
assert(Math.abs(outer-inner-DIAL.stroke)<1e-5);
const raw=JSON.stringify(widget);
assert(!/https?:\/\//.test(raw));
fs.writeFileSync(new URL('tools/Widgy_Device_Glass_5.json',root),raw);
console.log(JSON.stringify({name:widget['3'],layers:13,unchangedLayers:12,targetRadius:68,targetStroke:4.5,innerRadiusPercent:circle['8'].a[0].a,bytes:Buffer.byteLength(raw),nativeValidation:'pending'}));
