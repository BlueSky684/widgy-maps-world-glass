import {readFileSync, writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

// Device evidence, 2026-10-01:
// IMG_9634 outside editor: City and Country empty in all JS pathways;
// packed native text retains Latitude only in JS; widgy is undefined.
// IMG_9635/9636 inside editor: all three JS City probes resolve correctly.
// Latitude's data menu has no decimal-format control. Rather than inventing
// a JSON formatting key, compare Text (0) vs native-proven Real Number (2).
// The type-2 schema is recorded in widgy-native-wind-source.json.
// This is a precision probe, not a City fix. It makes no web requests.
const base=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass.json',import.meta.url)));
const home=base['1'].find(n=>n.d0===245);
const template=home['1'].find(n=>n.d0===6114);
const background=structuredClone(home['1'].find(n=>n.d0===5001));
const wind=JSON.parse(readFileSync(new URL('./widgy-native-wind-source.json',import.meta.url)));
assert.equal(wind.variable['2'],2);
const custom=value=>({'5':'Custom Text','6':'Text','25':value});
const js=value=>({'5':'Javascript','6':'Script','10':value});
const token=name=>'${widgy.'+name+'}';
const scalar=value=>({a:[{a:value,b:168,c:0,d:168}],b:0});
let id=94000;
function text(name,entries,y,height=66,color='uicol_white-100') {
  const node=structuredClone(template);
  Object.assign(node,{d0:id++,s:name,'1':'System Regular','66':entries,f:color});
  delete node.a; delete node.o1;
  for (const [i,k] of ['b','c','d','e'].entries()) node[k]=scalar([70,y,1460,height][i]);
  return node;
}
function variable(name,type,entries) {
  const body=structuredClone(base['36'].find(v=>v['1']==='Latitude')['3']);
  body.s='Variable: '+name; body['66']=entries;
  return {'0':`AD5D21AF-E1F3-486C-B003-${String(id++).padStart(12,'0')}`,'1':name,'2':type,'3':body};
}
const variables=[];
for (const [prefix,source] of [['lat','Latitude (Decimal)'],['lon','Longitude (Decimal)']]) {
  for (const [suffix,type] of [['text',0],['number',2]]) {
    variables.push(variable('precision_'+prefix+'_'+suffix,type,[{'5':'Location','6':source}]));
  }
}
for (const [suffix,type] of [['text',0],['number',2]]) {
  variables.push(variable('precision_control_'+suffix,type,[custom('12.3456789')]));
}
const raw=name=>`function main() { return '[' + String(${JSON.stringify(token(name))}) + ']'; }`;
const layers=[
  text('Title',[custom('WIDGY COORDINATE PRECISION')],45,85),
  text('Instructions',[custom('Screenshot outside editor; no settings changes needed')],155,48),
  text('Latitude section',[custom('LATITUDE - same source, different variable type')],250,52),
  text('1 Latitude Text JS',[custom('1 JS / Text: '),js(raw('precision_lat_text'))],330),
  text('2 Latitude Number JS',[custom('2 JS / Real Number: '),js(raw('precision_lat_number'))],415),
  text('3 Latitude Number Native',[custom('3 Native / Real Number: ['+token('precision_lat_number')+']')],500),
  text('Longitude section',[custom('LONGITUDE - same source, different variable type')],620,52),
  text('4 Longitude Text JS',[custom('4 JS / Text: '),js(raw('precision_lon_text'))],700),
  text('5 Longitude Number JS',[custom('5 JS / Real Number: '),js(raw('precision_lon_number'))],785),
  text('6 Longitude Number Native',[custom('6 Native / Real Number: ['+token('precision_lon_number')+']')],870),
  text('Control section',[custom('SYNTHETIC CONTROL - input is 12.3456789')],990,52),
  text('7 Control Text JS',[custom('7 JS / Text: '),js(raw('precision_control_text'))],1070),
  text('8 Control Number JS',[custom('8 JS / Real Number: '),js(raw('precision_control_number'))],1155),
  text('Execution',[js("function main() { return 'JS ran at '+new Date().toISOString().slice(11,19)+' UTC'; }")],1280,52),
  text('Privacy',[custom('Local text only. No images or location requests.')],1380,52),
  text('Status',[custom('Diagnostic only; this does not fix the City binding.')],1450,52),
];
background.d0=id++;layers.push(background);
const widget=structuredClone(base);
Object.assign(widget,{'1':layers,'2':[],'3':'Widgy Coordinate Precision',
  '4':'Local-only comparison of Location Decimal as Text vs Real Number. Synthetic precision control distinguishes general numeric formatting from location rounding. No City fix, network requests or dashboard changes.',
  '6':0,'7':[],'36':variables,'38':[],'39':{'System Regular':1},a2:id});
assert.equal(new Set(layers.map(n=>n.d0)).size,layers.length);
assert.equal(layers.filter(n=>n.z==='5').length,0);
for (const prefix of ['lat','lon','control']) {
  assert.deepEqual(variables.find(v=>v['1']===`precision_${prefix}_text`)['3']['66'],
    variables.find(v=>v['1']===`precision_${prefix}_number`)['3']['66']);
}
for (const node of layers) for (const entry of node['66']||[]) {
  if (entry['5']!=='Javascript') continue;
  const code=entry['10']; assert(!/fetch\s*\(|https?:|toFixed|toPrecision/.test(code));
  if (code.includes('${widgy.')) {
    for (const input of ['', '0','-12.3456789','123.456789']) {
      const substituted=code.replace(/\$\{widgy\.[^}]+\}/g,input);
      assert.equal(vm.runInNewContext(substituted+'\nmain();'),`[${input}]`);
    }
  }
}
writeFileSync(new URL('./Widgy_Coordinate_Precision.json',import.meta.url),JSON.stringify(widget));
let page=readFileSync(new URL('./widgy-js-check-2.html',import.meta.url),'utf8');
page=page.replaceAll('Widgy · JavaScript Check 2','Widgy · Coordinate Precision')
  .replace(/<p>בדיקה ממוקדת[\s\S]*?<button/,'<p>השוואת קואורדינטות מסוג טקסט מול Real Number, כדי לבדוק אם JavaScript יכול לקבל יותר ספרות אחרי הנקודה.</p>\n  <p>ייבא כעותק נוסף ושלח צילום מלא מחוץ לעורך. אין צורך לשנות הגדרות.</p>\n  <button')
  .replaceAll('Widgy_JavaScript_Check_2.json','Widgy_Coordinate_Precision.json')
  .replace("widget['3']!=='Widgy JavaScript Check 2'","widget['3']!=='Widgy Coordinate Precision'")
  .replace('כלי אבחון בלבד. בקשות התמונות מעבירות רק הצלחה או כישלון; שם העיר והקואורדינטות מוצגים מקומית בלבד.','בדיקת טקסט מקומית בלבד. אין תמונות או בקשות רשת בתוך הווידג׳ט. זו אינה גרסה מתוקנת של המפה.');
writeFileSync(new URL('./widgy-coordinate-precision.html',import.meta.url),page);
console.log(`Built ${layers.length} layers, ${variables.length} variables. Raw JS echoes preserve all supplied digits; Widgy precision still needs device verification.`);
