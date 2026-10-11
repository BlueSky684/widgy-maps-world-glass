import fs from 'node:fs';
import assert from 'node:assert/strict';

const root=new URL('../../',import.meta.url);
const original=JSON.parse(fs.readFileSync(new URL('tools/Widgy_Device_Glass_5.json',root),'utf8'));
const widget=structuredClone(original);
const index=widget['1'].findIndex(n=>n.z==='8');
assert(index>=0);
const circle=widget['1'][index];
assert.equal(circle['8'].a[0].a,93.594306);
// IMG_0286 confirms the lime material, hidden chart labels and correct 75%
// sweep. The visible fill is only about 3px at the 530px screenshot size.
// Decrease only the inner-radius percentage: more fill inward, unchanged
// outer frame, data source, angular settings and the other twelve layers.
circle['8'].a[0].a=90;
widget['3']='Widgy Device Glass 6';
widget['4']='Device Glass 6 — thicker Circle Chart after IMG_0286. Only inner radius changes from 93.594306 to 90. Original outer frame, lime material, chart switches, native Battery Level and all other 12 layers are retained. D5 correctly displayed a 75% sweep but its visible lime fill looked too thin. No data or angle correction. Actual new thickness still requires native phone validation.';
const check=structuredClone(widget);
check['3']=original['3'];check['4']=original['4'];
check['1'][index]['8'].a[0].a=93.594306;
assert.deepEqual(check,original);
assert.equal(widget['1'].length,13);
const raw=JSON.stringify(widget);
fs.writeFileSync(new URL('tools/Widgy_Device_Glass_6.json',root),raw);
console.log(JSON.stringify({name:widget['3'],layers:13,changedLayerFields:['8.a[0].a'],innerRadius:90,bytes:Buffer.byteLength(raw)}));
