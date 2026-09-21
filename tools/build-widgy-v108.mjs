import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const source=JSON.parse(read('widgy-native-substring-source.json'));
const before=JSON.parse(read('widgy-v107.json'));
const data=structuredClone(before);
const layers=data['1'][0]['1'];
const originals=before['1'][0]['1'].filter(n=>n.d0>=80000&&n.d0<=80010);
assert.equal(originals.length,11);
assert.equal(source.variable['2'],0);
assert.deepEqual(source.variable['3']['66'],[{'5':'Weather (Now)','6':'Status (Full)'}]);
assert.equal(source.contains['1'],2);
assert.equal(source.doesNotContain['1'],3);
for(const condition of [source.contains,source.doesNotContain]){
  assert.equal(condition['0'],source.variable['0']);
  assert.equal(condition['2'],'Night');
}
data['36']=[structuredClone(source.variable)];
let nextId=before.a2;
const frame=()=>({a:[{a:1600,b:1301,c:0,d:1301}],b:0});
const contains=text=>({...source.contains,'2':text});
const excludes=text=>({...source.doesNotContain,'2':text});
const precedence=['Thunder','Snow','Sleet','Rain','Fog','Wind','Cloudy','Fair','Clear'];
const familyRules=family=>[contains(family),...precedence.slice(0,precedence.indexOf(family)).map(excludes)];
const bindings=[];

function wrap(group,rules,artworkSourceId){
  delete group.a;
  group.o1=rules[0];
  // Each ancestor supplies one native condition; a drawing is visible only if
  // all ancestors are visible. Full-canvas groups preserve absolute geometry.
  for(let i=rules.length-1;i>=1;i--){
    const rule=rules[i];
    group['1']=[{d0:nextId++,z:'13',s:`WX rule · ${rule['1']===2?'contains':'excludes'} ${rule['2']}`,d:frame(),e:frame(),o1:rule,'1':group['1']}];
  }
  bindings.push({id:group.d0,name:group.s,artworkSourceId,allOf:rules});
  return group;
}
function bind(id,family,extra=[]){
  const group=layers.find(n=>n.d0===id);
  return wrap(group,[...familyRules(family),...extra],id);
}
function alias(id,name,family,extra=[]){
  const group=structuredClone(originals.find(n=>n.d0===id));
  group.d0=nextId++;
  group.s=name;
  const remap=node=>{
    node.d0=nextId++;
    if(node.z==='13')node['1'].forEach(remap);
  };
  group['1'].forEach(remap);
  layers.push(wrap(group,[...familyRules(family),...extra],id));
}

bind(80000,'Clear',[excludes('Night')]);
bind(80001,'Cloudy',[contains('Partly'),excludes('Night')]);
bind(80002,'Cloudy',[excludes('Partly')]);
bind(80003,'Rain',[excludes('Heavy')]);
bind(80004,'Rain',[contains('Heavy')]);
bind(80005,'Clear',[contains('Night')]);
bind(80006,'Cloudy',[contains('Partly'),contains('Night')]);
bind(80007,'Thunder');
bind(80008,'Snow');
bind(80009,'Fog');
bind(80010,'Wind');
alias(80001,'WX · Partly Cloudy Day (Fair)','Fair',[excludes('Night')]);
alias(80006,'WX · Partly Cloudy Night (Fair)','Fair',[contains('Night')]);
alias(80008,'WX · Snow (Sleet)','Sleet');
data.a2=nextId;
data['3']='Widgy Home v108 - Native Weather Icons';
data['4']='Automatic native weather icon rules using wx_status (String), Weather (Now) > Status (Full). Native Contains (2) and Does Not Contain (3) come from verified device exports. Nested groups combine conditions: Thunder > Snow > Sleet > Rain > Fog > Wind > Cloudy > Fair > Clear. Night selects night variants for clear/partly cloudy/fair; Heavy selects heavy rain. Fair uses the approved partly-cloudy artwork; Sleet uses the approved snow artwork. Wind is supported only when the status contains Wind; no wind-speed threshold is configured. Empty/unknown status shows no icon. All original drawings, masks, colors and dimensions are preserved; aliases copy approved drawings. Local tests verify rule logic and exact artwork preservation, not device rendering. Nested visibility and all weather transitions still require device verification.';

// Validate the serialized result, including geometry and mutually exclusive
// native conditions, rather than testing only the rule-builder objects.
const payload=JSON.stringify(data);
const actual=JSON.parse(payload);
const actualLayers=actual['1'][0]['1'];
const boundIds=new Set(bindings.map(b=>b.id));
const nodes=[];
const collect=node=>{nodes.push(node);if(node.z==='13')node['1'].forEach(collect);};
actual['1'].forEach(collect);
const ids=nodes.map(n=>n.d0);
assert(ids.every(Number.isInteger));
assert.equal(new Set(ids).size,ids.length);
assert(actual.a2>Math.max(...ids));
const leaves=node=>node.z==='13'?node['1'].flatMap(leaves):[node];
let originalDrawingCount=0,aliasDrawingCount=0;
for(const binding of bindings){
  const group=actualLayers.find(n=>n.d0===binding.id);
  const original=originals.find(n=>n.d0===binding.artworkSourceId);
  const drawings=leaves(group);
  const expected=leaves(original);
  assert.equal(drawings.length,expected.length);
  if(group.d0===original.d0){
    assert.deepEqual(drawings,expected);
    originalDrawingCount+=drawings.length;
    const originalShell=structuredClone(original),newShell=structuredClone(group);
    for(const shell of [originalShell,newShell]){delete shell['1'];delete shell.a;delete shell.o1;}
    assert.deepEqual(newShell,originalShell);
  }else{
    assert.deepEqual(drawings.map((n,i)=>({...n,d0:expected[i].d0})),expected);
    aliasDrawingCount+=drawings.length;
  }
  assert.equal(group.o1['1'],2); // Positive family guard, even on day groups.
  assert.notEqual(group.a,false);
}
assert.equal(originalDrawingCount,34);
assert.equal(aliasDrawingCount,12);
for(const node of nodes.filter(n=>n.o1)){
  assert.equal(node.o1['0'],source.variable['0']);
  assert([2,3].includes(node.o1['1']));
  assert.equal(node.o1['2'],node.o1['2'].trim());
  assert(node.o1['2'].length>0);
  assert.notEqual(node.a,false);
}
assert(!payload.includes('wx_clear_day'));
assert.equal(leaves(actualLayers.find(n=>n.d0===80000))[0]['3'],'sun.max.fill');
const restored=structuredClone(actual);
restored['1'][0]['1']=restored['1'][0]['1'].filter(n=>!boundIds.has(n.d0)||originals.some(o=>o.d0===n.d0)).map(n=>originals.find(o=>o.d0===n.d0)??n);
for(const key of ['36','3','4','a2'])restored[key]=before[key];
assert.deepEqual(restored,before); // Every non-weather field/layer is unchanged.

function rulePass(rule,status){
  if(!rule)return true;
  const text=status??'';
  switch(rule['1']){
    case 2:return text.includes(rule['2']);
    case 3:return !text.includes(rule['2']);
    default:throw new Error(`Unexpected operator ${rule['1']}`);
  }
}
function visibleLeaves(node,status){
  if(node.a===false||!rulePass(node.o1,status))return [];
  return node.z==='13'?node['1'].flatMap(n=>visibleLeaves(n,status)):[node];
}
const active=status=>actualLayers.filter(n=>boundIds.has(n.d0)&&visibleLeaves(n,status).length).map(n=>n.s.replace('WX · ',''));
const fixtures=[
  ['',null],[null,null],['Unknown',null],['Night',null],['Heavy',null],
  ['Clear Sky','Clear Day'],['Clear Sky Day','Clear Day'],['Clear Sky Night','Clear Night'],
  ['Fair','Partly Cloudy Day (Fair)'],['Fair Day','Partly Cloudy Day (Fair)'],['Fair Night','Partly Cloudy Night (Fair)'],
  ['Partly Cloudy','Partly Cloudy Day'],['Partly Cloudy Day','Partly Cloudy Day'],['Partly Cloudy Night','Partly Cloudy Night'],
  ['Cloudy','Cloudy'],['Cloudy Day','Cloudy'],['Cloudy Night','Cloudy'],
  ['Light Rain','Light Rain'],['Rain','Light Rain'],['Rain Night','Light Rain'],['Moderate Rain','Light Rain'],
  ['Light Rain Showers Night','Light Rain'],['Rain Showers Day','Light Rain'],
  ['Heavy Rain','Heavy Rain'],['Heavy Rain Showers Night','Heavy Rain'],
  ['Thunderstorm','Thunderstorm'],['Heavy Rain And Thunder Night','Thunderstorm'],['Snow And Thunder','Thunderstorm'],
  ['Light Snow','Snow'],['Snow Night','Snow'],['Heavy Snow Showers Day','Snow'],
  ['Light Sleet','Snow (Sleet)'],['Sleet Night','Snow (Sleet)'],['Heavy Sleet','Snow (Sleet)'],
  ['Fog','Fog'],['Fog Night','Fog'],['Wind','Wind'],['Windy Night','Wind'],
  ['Rain And Snow','Snow'],['Rain And Sleet','Snow (Sleet)'],['Rain And Fog','Light Rain'],
  ['Wind And Cloudy','Wind'],['Partly Cloudy And Fair Night','Partly Cloudy Night'],['Fair And Clear Night','Partly Cloudy Night (Fair)']
];
for(const [status,expected] of fixtures)assert.deepEqual(active(status),expected?[expected]:[],`Status: ${status}`);
// Exhaustively combine known keyword families with day/night, partly and
// heavy modifiers to detect condition overlaps. These are synthetic fixtures.
let overlapCases=0;
for(let mask=0;mask<2**precedence.length;mask++){
  const familyText=precedence.filter((_,i)=>mask&(1<<i)).join(' And ');
  for(const modifier of ['',' Night',' Heavy',' Partly',' Heavy Partly Night']){
    const status=familyText+modifier;
    const matches=active(status);
    assert.equal(matches.length,mask?1:0,`Overlap/missing rule: ${status}`);
    for(const group of actualLayers.filter(n=>boundIds.has(n.d0))){
      const visible=visibleLeaves(group,status);
      assert(visible.length===0||visible.length===leaves(group).length,'Partial artwork visibility');
    }
    overlapCases++;
  }
}

const packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');
assert.equal(gunzipSync(Buffer.from(packed,'base64')).toString(),payload);
write('widgy-v108.json',payload);
let html=read('widgy-v107.html').replaceAll('v107','v108')
  .replace('גרסת בדיקה: אייקון הלילה המעונן חלקית מחובר ל־wx_status. יתר המצבים טרם חוברו; במצב אחר אזור האייקון יהיה ריק.','האייקונים המקוריים מחוברים למצב מזג האוויר, עם התאמה ליום וללילה.')
  .replace('בדיקת נראות לפי מזג האוויר','מעתיקים ומייבאים ל־Widgy.')
  .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
  .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
  .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
  .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('v107'));
assert.equal(gunzipSync(Buffer.from(html.match(/const packed=\['([^']+)'\]/)[1],'base64')).toString(),payload);
assert(html.includes(`const expectedHash='${hash}';`));
write('widgy-v108.html',html);
const report={
  status:'native-weather-selector-ready-for-device-verification',
  source:'v107 approved native artwork; user-exported String/Contains/Does Not Contain schema',
  variable:{name:'wx_status',id:source.variable['0'],type:'String',data:'Weather (Now) / Status (Full)'},
  logic:'Each drawing is guarded by its outer group and all nested group conditions (AND).',
  precedence,bindings,
  verification:{originalDrawingCount,aliasDrawingCount,originalArtworkUnchanged:true,otherLayersUnchanged:true,uniqueLayerIds:true,syntheticExpectedStatusTests:fixtures.length,syntheticOverlapTests:overlapCases,exactCopyPagePayload:true,deviceNestedVisibilityVerified:false,deviceAllWeatherTransitionsVerified:false},
  limitations:['Native nested visibility requires verification in Widgy.','English, case-sensitive keyword matching assumes native Status (Full) uses the documented labels.','Wind is triggered only by Wind in Status (Full); no wind-speed condition.','Empty or unrecognized status hides all weather icons.','Fair uses partly-cloudy artwork; Sleet uses snow artwork.'],
  research:{officialTranslations:'https://github.com/duke4e/widgyTranslations/blob/main/en.xliff',runtimeConfirmedStatus:'Partly Cloudy Night',runtimeConfirmedSubstring:'Night'},
  payloadLength:payload.length,payloadBytes:Buffer.byteLength(payload),sha256:hash
};
write('widgy-v108-integration.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,groups:bindings.length,originalDrawingCount,aliasDrawingCount,conditions:nodes.filter(n=>n.o1).length,tests:fixtures.length+overlapCases,payloadBytes:report.payloadBytes,sha256:hash}));
