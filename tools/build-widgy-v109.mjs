import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const source=JSON.parse(read('widgy-native-wind-source.json'));
const before=JSON.parse(read('widgy-v108.json'));
const previousReport=JSON.parse(read('widgy-v108-integration.json'));
const data=structuredClone(before);
const windId=source.variable['0'];
const statusId=before['36'].find(v=>v['1']==='wx_status')['0'];
assert.equal(source.variable['2'],2); // Real Number, confirmed on device.
assert.deepEqual(source.greaterThanOrEqual,{'0':windId,'1':5,'2':'30'});
assert.deepEqual(source.lessThan,{'0':windId,'1':6,'2':'30'});
const variable=structuredClone(source.variable);
// The native export still has the empty initial Custom Text row. It adds no
// data, so retain only the real Wind Speed source in the published variable.
variable['3']['66']=variable['3']['66'].filter(entry=>!(entry['5']==='Custom Text'&&entry['6']==='Text'&&entry['25']===''));
assert.deepEqual(variable['3']['66'],[{'5':'Weather (Now)','6':'Wind Speed'}]);
data['36'].push(variable);

const allNodes=widget=>{
  const list=[];
  const visit=n=>{list.push(n);if(n.z==='13')(n['1']??[]).forEach(visit);};
  widget['1'].forEach(visit);
  return list;
};
const changed=[];
for(const node of allNodes(data)){
  if(node.o1?.['0']!==statusId||node.o1['2']!=='Wind')continue;
  if(node.o1['1']===2){
    assert.equal(node.d0,80010);
    node.o1=structuredClone(source.greaterThanOrEqual);
  }else{
    assert.equal(node.o1['1'],3);
    node.o1=structuredClone(source.lessThan);
    node.s='WX rule · wind below 30 km/h';
  }
  changed.push(node.d0);
}
assert.equal(changed.length,8); // Wind + seven clear/cloudy/fair branches.
data['3']='Widgy Home v109 - Native Weather and Wind';
data['4']='Native weather selector with wind speed priority. wx_status: String, Weather (Now) > Status (Full). wx_wind_speed: Real Number, Weather (Now) > Wind Speed; Widgy wind units MUST remain KM/H (app preference, not embedded in this export). Wind is displayed at speed >= 30 km/h, below the priority of Thunder, Snow/Sleet, Rain and Fog. Clear, Fair and Cloudy branches require speed < 30 km/h. Original day/night and rain intensity conditions are preserved. Numeric operator 5 (>=) and 6 (<), threshold encoding and variable type 2 are copied from the user native export 20260921-195211. Empty Custom Text is removed from the wind variable. Wind Test is not included. All approved native drawings and other Home data/layout are unchanged from v108. Boundary and overlap logic is tested locally; high-wind rendering and transitions on the device remain to be verified.';
const payload=JSON.stringify(data);
const actual=JSON.parse(payload);
const nodes=allNodes(actual),originalNodes=allNodes(before);
const byId=new Map(nodes.map(n=>[n.d0,n]));
assert.equal(byId.size,nodes.length);
assert.equal(nodes.length,originalNodes.length);
assert.equal(actual.a2,before.a2);
assert(actual.a2>Math.max(...byId.keys()));
assert(!nodes.some(n=>n.d0===source.temporaryGroup.id));
assert(!nodes.some(n=>/^Wind Tes/.test(n.s??'')));
assert(!nodes.some(n=>n.o1?.['0']===statusId&&n.o1['2']==='Wind'));
assert.equal(nodes.filter(n=>n.o1?.['0']===windId&&n.o1['1']===5).length,1);
assert.equal(nodes.filter(n=>n.o1?.['0']===windId&&n.o1['1']===6).length,7);
for(const n of nodes.filter(n=>n.o1)){
  assert.notEqual(n.a,false);
  assert.equal(n.o1['2'],n.o1['2'].trim());
}
const leaves=n=>n.z==='13'?(n['1']??[]).flatMap(leaves):[n];
const layers=actual['1'][0]['1'];
const iconIds=new Set(previousReport.bindings.map(b=>b.id));
const iconGroups=layers.filter(n=>iconIds.has(n.d0));
assert.equal(iconGroups.length,14);
let drawingCount=0;
for(const group of iconGroups){
  const original=before['1'][0]['1'].find(n=>n.d0===group.d0);
  assert.deepEqual(leaves(group),leaves(original));
  drawingCount+=leaves(group).length;
}
assert.equal(drawingCount,46);
// Undo only the intended changes to prove nothing else was altered.
const restored=structuredClone(actual);
for(const node of allNodes(restored)){
  if(!changed.includes(node.d0))continue;
  const original=originalNodes.find(n=>n.d0===node.d0);
  node.o1=original.o1;
  node.s=original.s;
}
for(const key of ['36','3','4'])restored[key]=before[key];
assert.deepEqual(restored,before);

// Evaluate the serialized native group tree. Missing/invalid numeric input
// uses the zero fallback described by Widgy's variable UI; this is not a
// substitute for testing native variable parsing on the phone.
const numeric=value=>typeof value==='number'&&Number.isFinite(value)?value:0;
function pass(rule,status,speed){
  if(!rule)return true;
  if(rule['0']===statusId){
    if(rule['1']===2)return (status??'').includes(rule['2']);
    if(rule['1']===3)return !(status??'').includes(rule['2']);
  }
  if(rule['0']===windId){
    if(rule['1']===5)return numeric(speed)>=Number(rule['2']);
    if(rule['1']===6)return numeric(speed)<Number(rule['2']);
  }
  throw new Error('Unknown native rule');
}
function visibleLeaves(n,status,speed){
  if(n.a===false||!pass(n.o1,status,speed))return [];
  return n.z==='13'?(n['1']??[]).flatMap(c=>visibleLeaves(c,status,speed)):[n];
}
function active(status,speed){
  const names=[];
  for(const group of iconGroups){
    const visible=visibleLeaves(group,status,speed);
    assert(visible.length===0||visible.length===leaves(group).length,'Partially visible artwork');
    if(visible.length)names.push(group.s.replace('WX · ',''));
  }
  return names;
}
const fairWeather=[
  ['Clear Sky','Clear Day'],['Clear Sky Day','Clear Day'],['Clear Sky Night','Clear Night'],
  ['Fair','Partly Cloudy Day (Fair)'],['Fair Night','Partly Cloudy Night (Fair)'],
  ['Partly Cloudy','Partly Cloudy Day'],['Partly Cloudy Night','Partly Cloudy Night'],
  ['Cloudy','Cloudy'],['Cloudy Night','Cloudy'],['Wind And Clear Sky','Clear Day']
];
const priorityWeather=[
  ['Thunderstorm','Thunderstorm'],['Heavy Rain And Thunder Night','Thunderstorm'],
  ['Snow And Thunder','Thunderstorm'],['Sleet And Thunder','Thunderstorm'],
  ['Light Snow','Snow'],['Heavy Snow Showers Night','Snow'],['Snow And Rain','Snow'],
  ['Light Sleet','Snow (Sleet)'],['Sleet Night','Snow (Sleet)'],['Heavy Sleet','Snow (Sleet)'],
  ['Rain','Light Rain'],['Light Rain Showers Night','Light Rain'],['Moderate Rain','Light Rain'],
  ['Heavy Rain','Heavy Rain'],['Heavy Rain Showers Night','Heavy Rain'],
  ['Rain And Fog','Light Rain'],['Fog','Fog'],['Fog Night','Fog'],['Fog And Wind','Fog']
];
let expectedTests=0;
for(const speed of [0,6.1,29.9,29.999999,30,30.000001,40,200,null,NaN]){
  for(const [status,normal] of fairWeather){
    assert.deepEqual(active(status,speed),[numeric(speed)>=30?'Wind':normal],`${status} at ${speed}`);
    expectedTests++;
  }
  for(const [status,expected] of priorityWeather){
    assert.deepEqual(active(status,speed),[expected],`${status} at ${speed}`);
    expectedTests++;
  }
  for(const status of ['',null,'Unknown','Wind','Night']){
    // High, valid measured wind can still be represented even if the status
    // is unrecognized. Below threshold, no made-up sky condition is shown.
    assert.deepEqual(active(status,speed),numeric(speed)>=30?['Wind']:[]);
    expectedTests++;
  }
}
let overlapTests=0;
const words=['Thunder','Snow','Sleet','Rain','Fog','Cloudy','Fair','Clear'];
for(let i=0;i<words.length;i++)for(let j=i+1;j<words.length;j++){
  for(const speed of [6.1,29.999,30,80])for(const ending of ['',' Heavy Partly Night']){
    const status=`${words[i]} And ${words[j]}${ending}`;
    assert.equal(active(status,speed).length,1,`Overlap/missing: ${status}, ${speed}`);
    overlapTests++;
  }
}
const packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');
assert.equal(gunzipSync(Buffer.from(packed,'base64')).toString(),payload);
let html=read('widgy-v108.html').replaceAll('v108','v109')
  .replace('האייקונים המקוריים מחוברים למצב מזג האוויר, עם התאמה ליום וללילה.','האייקונים המקוריים עם תנאי רוח מ־30 קמ״ש ומעלה.')
  .replace('מעתיקים ומייבאים ל־Widgy.','יש להשאיר את יחידות מהירות הרוח ב־Widgy על KM/H.')
  .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
  .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
  .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
  .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('v108'));
assert.equal(gunzipSync(Buffer.from(html.match(/const packed=\['([^']+)'\]/)[1],'base64')).toString(),payload);
write('widgy-v109.json',payload);
write('widgy-v109.html',html);
const report={
  status:'native-wind-speed-selector-ready-for-device-verification',
  source:'v108 approved artwork and native user export 20260921-195211',
  windVariable:{id:windId,name:'wx_wind_speed',type:'Real Number',nativeType:2,data:'Weather (Now) / Wind Speed',unit:'km/h via the existing Widgy app preference'},
  threshold:30,operators:{greaterThanOrEqual:5,lessThan:6},
  windPriority:'Below Thunder, Snow/Sleet, Rain and Fog; above Cloudy, Fair and Clear.',
  changedGroups:changed.map(id=>({id,name:byId.get(id).s,rule:byId.get(id).o1})),
  verification:{approvedDrawingsPreserved:drawingCount,allOtherLayersPreserved:true,layerCountUnchanged:true,temporaryGroupAbsent:true,emptyCustomTextRemoved:true,expectedStatusAndBoundaryTests:expectedTests,overlapTests,exactCopyPagePayload:true,nativeNumericParsingObserved:'User screenshot: Real Number 6.1 after changing units to KM/H',deviceHighWindTransitionVerified:false},
  limitations:['Wind Speed follows the Widgy app unit preference; keep KM/H.','High-wind transitions still need device verification.','Sky/precipitation matching retains v108 English Status (Full) keyword rules.','Below the wind threshold an empty/unknown status still has no icon; a valid high wind speed can display Wind if no higher-priority weather keyword is present.','Numeric missing/invalid zero fallback is modeled from the variable UI description, not phone-tested.'],
  payloadLength:payload.length,payloadBytes:Buffer.byteLength(payload),sha256:hash
};
write('widgy-v109-integration.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,changedConditions:changed.length,drawingsPreserved:drawingCount,tests:expectedTests+overlapTests,payloadBytes:report.payloadBytes,sha256:hash}));
