import {readFileSync, writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

// Native export 20261001-130422, layer 96018, identifies Text / Max 5 as
// property 28 with scalar value 11. IMG_9647 confirms extra native digits
// INSIDE the editor. Variable formatting and outside-editor JS are unverified.
// This isolated comparison uses only Decimal sources that already reach JS.
// No geocoding, images, network requests, variable chains or dashboard edits.
const base=JSON.parse(readFileSync(new URL('./Widgy_Async_Location_Check.json',import.meta.url)));
const native=JSON.parse(readFileSync(new URL('./widgy-native-max5-source.json',import.meta.url)));
assert.equal(native.propertyKey,'28');
assert.equal(native.max5.a[0].a,11);
const template=base['1'].find(n=>n.s==='2 Sync City');
const background=structuredClone(base['1'].find(n=>n.z==='2'));
const variableTemplate=base['36'].find(v=>v['1']==='dms_decimal')['3'];
const custom=value=>({'5':'Custom Text','6':'Text','25':value});
const location=source=>({'5':'Location','6':source});
const sync=value=>({'5':'Javascript','6':'Script','10':value});
const asyncSource=value=>({'5':'Javascript','6':'Async + No main()','10':value});
const token=name=>'${widgy.'+name+'}';
const quoted=name=>JSON.stringify(token(name));
const scalar=value=>({a:[{a:value,b:168,c:0,d:168}],b:0});
const max5=node=>{node[native.propertyKey]=structuredClone(native.max5);return node;};
let id=97000;
function text(name,entries,y,height=62,format=false) {
  const node=structuredClone(template);
  Object.assign(node,{d0:id++,s:name,'66':entries});
  delete node[native.propertyKey];
  for(const [i,k] of ['b','c','d','e'].entries())node[k]=scalar([70,y,1460,height][i]);
  return format?max5(node):node;
}
const variables=[];
for(const [axis,source] of [['lat','Latitude (Decimal)'],['lon','Longitude (Decimal)']]) {
  for(const [variant,type,format] of [['auto',0,false],['text5',0,true],['number5',2,true]]) {
    const name=axis+'_'+variant;
    const body=structuredClone(variableTemplate);
    body.s='Variable: '+name;body['66']=[location(source)];
    delete body[native.propertyKey];
    if(format)max5(body);
    variables.push({'0':`C5D5F231-73AF-48A7-B001-${String(id++).padStart(12,'0')}`,'1':name,'2':type,'3':body});
  }
}
const pairExpression=variant=>"'['+String("+quoted('lat_'+variant)+")+'] / ['+String("+quoted('lon_'+variant)+")+']'";
const pairScript=variant=>'function main(){return '+pairExpression(variant)+';}';

// A short LABEL demo only. The raw input rows above never round the JS output.
// Treat missing or unresolved inputs as missing rather than silently using 0.
function shortLabel(latitude,longitude) {
  function coordinate(value,limit) {
    var input=String(value).trim().replace(/\u2212/g,'-').replace(',','.');
    if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(input))return null;
    var n=Number(input);
    return isFinite(n)&&Math.abs(n)<=limit?n:null;
  }
  var lat=coordinate(latitude,90),lon=coordinate(longitude,180);
  if(lat===null||lon===null)return '[missing or invalid input]';
  return Math.abs(lat).toFixed(1)+'\u00b0'+(lat<0?'S':'N')+' '+
    Math.abs(lon).toFixed(1)+'\u00b0'+(lon<0?'W':'E');
}
const labelScript=shortLabel.toString()+'\nfunction main(){return shortLabel('+quoted('lat_text5')+','+quoted('lon_text5')+');}';
const layers=[
  text('Title',[custom('WIDGY MAX 5 / JAVASCRIPT')],45,80),
  text('Instructions',[custom('Separate copy; screenshot OUTSIDE the editor')],150,48),
  text('Order',[custom('Each row shows: [LATITUDE] / [LONGITUDE]')],225,48),
  text('1 Native direct Max 5',[custom('1 Native / Max 5: ['),location('Latitude (Decimal)'),custom('] / ['),location('Longitude (Decimal)'),custom(']')],315,62,true),
  text('2 Native Max 5 variables',[custom('2 Native variables: ['+token('lat_text5')+'] / ['+token('lon_text5')+']')],415),
  text('3 JS Auto variables',[custom('3 JS / Auto variables: '),sync(pairScript('auto'))],515),
  text('4 JS Max 5 Text variables',[custom('4 JS / Max 5 Text: '),sync(pairScript('text5'))],615),
  text('5 Async Max 5 Text variables',[custom('5 Async / Max 5 Text: '),asyncSource('sendToWidgy('+pairExpression('text5')+');')],715),
  text('6 JS Max 5 Number variables',[custom('6 JS / Max 5 Number: '),sync(pairScript('number5'))],815),
  text('7 JS Max 5 consumer only',[custom('7 JS / Max 5 output only: '),sync(pairScript('auto'))],915,62,true),
  text('8 Short map label',[custom('8 Short label from row 4: '),sync(labelScript)],1040),
  text('Execution',[sync("function main(){return 'JS ran at '+new Date().toISOString().slice(11,19)+' UTC';}")],1150,50),
  text('Interpretation',[custom('Compare JS rows 4-6 with native rows 1-2.')],1260,48),
  text('Privacy',[custom('Local text only. No network or geocoding requests.')],1345,48),
  text('Status',[custom('Precision test, not a City fix. Map labels stay short.')],1430,48),
];
background.d0=id++;layers.push(background);
const widget=structuredClone(base);
Object.assign(widget,{'1':layers,'2':[],'3':'Widgy Max 5 JavaScript Check',
  '4':'Tests the native-proven Max 5 text format (property 28, value 11) on Decimal coordinate variables before sync/async JavaScript, with native, Auto and consumer-only controls. Local text only. Variable formatting and outside-editor precision are unverified; this is not a City fix.',
  '36':variables,a2:id});

// Verify the actual generated scripts and schema, without pretending to
// emulate Widgy's location acquisition, formatting or variable substitution.
assert.equal(new Set(layers.map(n=>n.d0)).size,layers.length);
assert.equal(new Set(variables.map(v=>v['0'])).size,variables.length);
assert.equal(new Set(variables.map(v=>v['1'])).size,variables.length);
assert(layers.every(n=>n.z!=='5'));
for(const variable of variables) {
  assert(variable['3']['66'].every(e=>e['5']==='Location'));
  assert(!JSON.stringify(variable['3']).includes('${widgy.'));
  if(variable['1'].endsWith('5'))assert.deepEqual(variable['3']['28'],native.max5);
  else assert(!('28' in variable['3']));
}
const names=new Set(variables.map(v=>v['1']));
for(const match of JSON.stringify(widget).matchAll(/\$\{widgy\.([^}]+)\}/g))assert(names.has(match[1]));
const cases=[
  ['12.34567','-123.45678','12.3\u00b0N 123.5\u00b0W'],
  ['-12,34567','123,45678','12.3\u00b0S 123.5\u00b0E'],
  ['0','0','0.0\u00b0N 0.0\u00b0E'],
  ['90','-180','90.0\u00b0N 180.0\u00b0W'],
  ['','12','[missing or invalid input]'],
  ['91','12','[missing or invalid input]'],
  ['12','181','[missing or invalid input]'],
  ['${widgy.lat_text5}','12','[missing or invalid input]'],
];
for(const [lat,lon,label] of cases)for(const layer of layers)for(const entry of layer['66']||[]) {
  if(entry['5']!=='Javascript')continue;
  assert(!/fetch\s*\(|https?:|setTimeout\s*\(/.test(entry['10']));
  const code=entry['10'].replace(/"\$\{widgy\.([^}]+)\}"/g,(_,name)=>JSON.stringify(name.startsWith('lat_')?lat:lon));
  let result;
  if(entry['6']==='Async + No main()') {
    const outputs=[];
    vm.runInNewContext(code,{sendToWidgy:value=>outputs.push(value)});
    assert.equal(outputs.length,1);result=outputs[0];
  } else result=vm.runInNewContext(code+'\nmain();');
  if(layer.s==='8 Short map label')assert.equal(result,label);
  else if(layer.s!=='Execution')assert.equal(result,'['+lat+'] / ['+lon+']');
}
writeFileSync(new URL('./Widgy_Max5_JavaScript_Check.json',import.meta.url),JSON.stringify(widget));
let page=readFileSync(new URL('./widgy-coordinate-precision.html',import.meta.url),'utf8');
page=page.replaceAll('Widgy · Coordinate Precision','Widgy · Max 5 JavaScript')
  .replace('השוואת קואורדינטות מסוג טקסט מול Real Number, כדי לבדוק אם JavaScript יכול לקבל יותר ספרות אחרי הנקודה.','בדיקה האם הגדרת Max 5 שנמצאה בקובץ שלך מעבירה קואורדינטות מדויקות ל־JavaScript. נשווה ערכים מקוריים מול הקלט של הקוד.')
  .replace('ייבא כעותק נוסף ושלח צילום מלא מחוץ לעורך. אין צורך לשנות הגדרות.','ייבא כעותק נוסף, צא מהעורך, רענן פעם אחת ושלח צילום מלא של הבדיקה. כל ההגדרות כבר מוכנות.')
  .replaceAll('Widgy_Coordinate_Precision.json','Widgy_Max5_JavaScript_Check.json')
  .replace("widget['3']!=='Widgy Coordinate Precision'","widget['3']!=='Widgy Max 5 JavaScript Check'");
writeFileSync(new URL('./widgy-max5-js-check.html',import.meta.url),page);
console.log(`Built ${layers.length} layers and ${variables.length} variables; ${cases.length} input cases verified. Native format preserved exactly. Outside-editor precision still needs phone verification.`);
