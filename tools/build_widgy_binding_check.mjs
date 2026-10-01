import {readFileSync, writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';

// The user's Widgy re-export kept all variables and map layer 6170 exactly
// intact. Diagnose runtime binding separately from the 481-layer dashboard.
const base = JSON.parse(readFileSync(new URL('./Widgy_Home_Glass.json', import.meta.url)));
const home = base['1'].find(n => n.d0 === 245);
const textTemplate = home['1'].find(n => n.d0 === 6114);
const imageTemplate = home['1'].find(n => n.d0 === 6170);
const background = structuredClone(home['1'].find(n => n.d0 === 5001));
const endpoint = 'https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/api/binding-probe';
const custom = value => ({'5':'Custom Text', '6':'Text', '25':value});
const javascript = code => ({'5':'Javascript', '6':'Script', '10':code});
const source = name => ({'5':'Location', '6':name});
const scalar = value => ({a:[{a:value,b:168,c:0,d:168}],b:0});
let nextId = 90000;
function frame(n, box) {
  for (const [index, key] of ['b','c','d','e'].entries()) n[key] = scalar(box[index]);
  return n;
}
function text(name, entries, box) {
  const n = structuredClone(textTemplate);
  n.d0 = nextId++; n.s = name; n['1'] = 'System Regular'; n['66'] = entries;
  n.f = 'uicol_white-100';
  delete n.a; delete n.o1;
  return frame(n, box);
}
function variable(name, entries) {
  const body = structuredClone(base['36'].find(v => v['1'] === 'City')['3']);
  body['66'] = entries; body.s = `Variable: ${name}`;
  return {'0':`AD5D21AF-E1F3-486C-B001-${String(nextId++).padStart(12,'0')}`, '1':name, '2':0, '3':body};
}
const url = name => `${endpoint}?case=${name}&label=SyntheticTest`;
const variables = [
  structuredClone(base['36'].find(v => v['1'] === 'City')),
  structuredClone(base['36'].find(v => v['1'] === 'Latitude')),
  variable('probe_label', [custom('SyntheticTest')]),
  variable('probe_js_label', [javascript("function main() { return 'SyntheticTest'; }")]),
  variable('probe_js_url', [javascript(`function main() { return ${JSON.stringify(url('B'))}; }`)]),
  variable('probe_text_url', [custom(url('C'))]),
  variable('probe_parts_url', [custom(`${endpoint}?case=D&label=`), custom('SyntheticTest')]),
];
const layers = [
  text('Title', [custom('WIDGY BINDING CHECK 1')], [70,55,1460,95]),
  text('Instructions', [custom('Screenshot outside editor + Widgy version')], [70,155,1460,55]),
];
const rows = [
  ['1 Native city', [source('City')]],
  ['2 Variable city', [custom('${widgy.City}')]],
  ['3 JS control', [javascript("function main() { return 'RAN'; }")]],
  ['4 JS static text', [javascript('function main() { return "RAN [" + String("${widgy.probe_label}") + "]"; }')]],
  ['5 JS city', [javascript('function main() { return "RAN [" + String("${widgy.City}") + "]"; }')]],
  ['6 JS latitude', [javascript('function main() { return "RAN [" + String("${widgy.Latitude}") + "]"; }')]],
];
for (const [i,[label,entries]] of rows.entries()) layers.push(
  text(label, [custom(`${label}: <`), ...entries, custom('>')], [70,240+i*83,1460,64])
);
const cases = [
  ['A','Direct URL',url('A')],
  ['B','JS URL variable','${widgy.probe_js_url}'],
  ['C','Text URL variable','${widgy.probe_text_url}'],
  ['D','Joined text URL','${widgy.probe_parts_url}'],
  ['E','Text in URL',`${endpoint}?case=E&label=${'${widgy.probe_label}'}`],
  ['F','JS text in URL',`${endpoint}?case=F&label=${'${widgy.probe_js_label}'}`],
];
for (const [i,[name,label,address]] of cases.entries()) {
  const x = 70 + (i%3)*495, y = 810 + Math.floor(i/3)*270;
  layers.push(text(`Case ${name}`, [custom(`${name}  ${label}`)], [x,y,445,65]));
  const n = structuredClone(imageTemplate); n.d0 = nextId++; n.s = `Image ${name}`;
  n['2'] = address; layers.push(frame(n,[x,y+80,430,172]));
}
layers.push(text('Legend', [custom('Green = resolved  /  Amber = wrong value')], [70,1380,1460,65]));
layers.push(text('Legend blank', [custom('Blank = image did not load')], [70,1460,1460,65]));
background.d0 = nextId++; layers.push(background);

const widget = {};
for (const key of ['0','9','10','20','21','28']) widget[key] = base[key];
Object.assign(widget, {'1':layers, '2':[], '3':'Widgy Binding Check',
  '4':'Isolated runtime diagnostic. Six small synthetic image controls; native City is displayed locally only. The dashboard and map are not modified. This is not a city fix.',
  '5':base['5'], '6':0, '7':[], '36':variables, '38':[], '39':{'System Regular':1}, a2:nextId});
assert.equal(layers.filter(n => n.z === '5').length, 6);
assert(layers.filter(n => n.z === '5').every(n => !n['2'].includes('City') && !n['2'].includes('Latitude')));
writeFileSync(new URL('./Widgy_Binding_Check.json',import.meta.url), JSON.stringify(widget));

let page = readFileSync(new URL('./widgy-home-glass.html', import.meta.url),'utf8');
page = page.replace(/Widgy Home · Glass(?: — Recovery)?/g, 'Widgy · Binding Check')
  .replace(/<p>העיצוב[\s\S]*?<button/, '<p>בדיקה קטנה ונפרדת של טעינת תמונות ומשתנים. שש תמונות זעירות ושורות טקסט יעזרו לזהות איזה חיבור נכשל מחוץ לעורך.</p>\n  <p>ייבא כעותק נוסף, הצג מחוץ לעורך ושלח צילום מלא, יחד עם מספר גרסת Widgy המותקנת.</p>\n  <button')
  .replaceAll('Widgy_Home_Glass.json','Widgy_Binding_Check.json')
  .replace("widget['3']!=='Widgy Home Glass'", "widget['3']!=='Widgy Binding Check'")
  .replace(/<small>יעד הטבעת[\s\S]*?<\/small>/,'<small>כלי אבחון בלבד. זה אינו תיקון מאומת לעיר.</small>');
writeFileSync(new URL('./widgy-binding-check.html',import.meta.url),page);
console.log(`Built ${layers.length} layers, ${variables.length} variables, six 320 × 128 image controls.`);
