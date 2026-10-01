import {readFileSync, writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';

// Check 1 established: JS runs, static text and Latitude bind, City is empty.
// All six synthetic image transports work. The user's working example uses
// native City text and a JS image URL without City: it does not prove JS City.
// Keep the dashboard intact. This second probe isolates NEW hypotheses:
// source alias, atomic native text, runtime access and direct image execution.
// See https://www.reddit.com/r/widgy/comments/1wgx4k4/variables_order/
// for the reported limitation on variable-to-variable dependencies.
// Async fetch/sendToWidgy is documented by the developer at
// https://www.reddit.com/r/widgy/comments/pdpi2j/fetch_use/ . A timer around an
// already-substituted empty literal is NOT a live read of native City.
// Do not guess the async source's serialized schema or invent an accessor.

const base = JSON.parse(readFileSync(new URL('./Widgy_Home_Glass.json', import.meta.url)));
const home = base['1'].find(n => n.d0 === 245);
const textTemplate = home['1'].find(n => n.d0 === 6114);
const imageTemplate = home['1'].find(n => n.d0 === 6170);
const background = structuredClone(home['1'].find(n => n.d0 === 5001));
const endpoint = 'https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/api/binding-probe';
const custom = value => ({'5':'Custom Text','6':'Text','25':value});
const js = value => ({'5':'Javascript','6':'Script','10':value});
const location = value => ({'5':'Location','6':value});
const token = name => '${widgy.' + name + '}';
const scalar = value => ({a:[{a:value,b:168,c:0,d:168}],b:0});
let id = 92000;
function frame(node, values) {
  for (const [i,key] of ['b','c','d','e'].entries()) node[key] = scalar(values[i]);
  return node;
}
function text(name, entries, box) {
  const node = structuredClone(textTemplate);
  Object.assign(node, {d0:id++,s:name,'1':'System Regular','66':entries,f:'uicol_white-100'});
  delete node.a; delete node.o1;
  return frame(node, box);
}
function variable(name, entries) {
  const body = structuredClone(base['36'].find(v => v['1'] === 'City')['3']);
  body['66'] = entries; body.s = 'Variable: '+name;
  return {'0':`AD5D21AF-E1F3-486C-B002-${String(id++).padStart(12,'0')}`,'1':name,'2':0,'3':body};
}
const quoted = name => JSON.stringify(token(name));
const read = name => `function main() { return '[' + String(${quoted(name)}) + ']'; }`;
const presentFunction = `function present(value) {
  var s = String(value == null ? '' : value).trim();
  return !!s && s.indexOf('$'+'{') < 0 && s !== 'undefined' && s !== 'null';
}`;
const imageCode = (name, packed = false) => `${presentFunction}
function main() {
  var value = String(${quoted(packed ? 'geo_packet_js2' : 'geo_city_js2')});
  ${packed ? "var match = /^C<([\\s\\S]*?)>\\|K</.exec(value); value = match ? match[1] : '';" : ''}
  // Transmit only a boolean as a synthetic label, never the user's location.
  return '${endpoint}?case=${name}&label=' + (present(value) ? 'SyntheticTest' : 'Empty') + '&t=' + Date.now();
}`;
const variables = [
  structuredClone(base['36'].find(v => v['1'] === 'City')),
  structuredClone(base['36'].find(v => v['1'] === 'Latitude')),
  variable('geo_city_js2',[location('City')]),
  variable('geo_country_js2',[location('Country')]),
  variable('geo_packet_js2',[custom('C<'),location('City'),custom('>|K<'),location('Country'),custom('>|L<'),location('Latitude (Decimal)'),custom('>')]),
  // This deliberately retains a variable-to-variable chain as the B control.
  variable('geo_url_js2',[js(imageCode('B'))]),
];
const rows = [
  ['1 Native City',[custom('['),location('City'),custom(']')]],
  ['2 JS existing City',[js(read('City'))]],
  ['3 JS fresh alias',[js(read('geo_city_js2'))]],
  ['4 JS Country',[js(read('geo_country_js2'))]],
  ['5 JS Latitude',[js(read('Latitude'))]],
  ['6 Native packet',[custom(token('geo_packet_js2'))]],
  ['7 JS packet',[js(read('geo_packet_js2'))]],
  ['8 Runtime object',[js(`function main() { return 'widgy=' + typeof widgy + ', globalThis=' + typeof globalThis; }`)]],
  ['9 Runtime City',[js(`function main() {
    try {
      if (typeof widgy === 'undefined') return 'NO LIVE OBJECT';
      return 'City=[' + String(widgy.City) + '] alias=[' + String(widgy.geo_city_js2) + ']';
    } catch (error) { return 'READ ERROR: ' + String(error.name); }
  }`)]],
  // These types describe the synchronous source only; missing helpers here
  // do not disprove their availability in Widgy's separate async source.
  ['10 Runtime helpers',[js(`function main() { return 'fetch=' + typeof fetch + ', timer=' + typeof setTimeout + ', send=' + typeof sendToWidgy; }`)]],
  ['11 Runtime names',[js(`function main() {
    if (typeof globalThis === 'undefined') return 'NO GLOBALTHIS';
    return Object.getOwnPropertyNames(globalThis).filter(function(k) { return /widgy|location|variable|geocod/i.test(k); }).sort().join(', ') || '(none)';
  }`)]],
  ['12 JS control',[js(`function main() { return 'RAN at ' + new Date().toISOString().slice(11,19) + ' UTC'; }`)]],
];
const layers = [
  text('Title',[custom('WIDGY JAVASCRIPT CHECK 2')],[70,38,1460,80]),
  text('Instructions',[custom('Outside editor: screenshot now, refresh once, screenshot again')],[70,128,1460,42]),
];
for (const [index,[name,entries]] of rows.entries()) {
  layers.push(text(name,[custom(name+': '),...entries],[70,194+index*73,1460,56]));
}
for (const [index,[name,label,script,address]] of [
  ['A','Direct image JS',imageCode('A'),null],
  ['B','JS variable chain',null,token('geo_url_js2')],
  ['C','Native packet + JS',imageCode('C',true),null],
].entries()) {
  const x = 70+495*index;
  layers.push(text('Label '+name,[custom(name+'  '+label)],[x,1092,450,54]));
  const node = structuredClone(imageTemplate);
  Object.assign(node,{d0:id++,s:'Image '+name});
  if (script) {
    node['1']='Javascript'; node['22']=script;
    // Never seed a green fallback that could masquerade as successful JS.
    node['2']='';
  } else {
    node['1']='Web URL'; node['2']=address; delete node['22'];
  }
  layers.push(frame(node,[x,1160,430,172]));
}
layers.push(text('Legend',[custom('Green = City reached JS   /   Amber = City empty')],[70,1365,1460,53]));
layers.push(text('Blank',[custom('Blank = image did not load   /   No city sent to server')],[70,1430,1460,53]));
background.d0=id++; layers.push(background);
const widget = structuredClone(base);
Object.assign(widget,{'1':layers,'2':[],'3':'Widgy JavaScript Check 2',
  '4':'Second isolated diagnostic: fresh City alias, Country, native packet, live runtime object and direct image JS versus variable chain. Image requests send synthetic presence flags only. No dashboard changes. Not a verified fix.',
  '6':0,'7':[],'36':variables,'38':[],'39':{'System Regular':1},a2:id});
assert.equal(widget['1'].filter(n => n.z==='5').length,3);
writeFileSync(new URL('./Widgy_JavaScript_Check_2.json',import.meta.url),JSON.stringify(widget));

let page = readFileSync(new URL('./widgy-binding-check.html',import.meta.url),'utf8');
page = page.replaceAll('Widgy · Binding Check','Widgy · JavaScript Check 2')
  .replace(/<p>בדיקה קטנה[\s\S]*?<button/, '<p>בדיקה ממוקדת של שם העיר בתוך JavaScript: קריאה ישירה, שם משתנה חדש והעברת נתוני מיקום יחד.</p>\n  <p>ייבא כעותק נוסף והצג מחוץ לעורך. שלח צילום ראשון, רענן את הווידג׳ט פעם אחת ושלח צילום נוסף. שתי התמונות יראו גם אם סדר הטעינה משפיע.</p>\n  <button')
  .replaceAll('Widgy_Binding_Check.json','Widgy_JavaScript_Check_2.json')
  .replace("widget['3']!=='Widgy Binding Check'","widget['3']!=='Widgy JavaScript Check 2'")
  .replace('כלי אבחון בלבד. זה אינו תיקון מאומת לעיר.','כלי אבחון בלבד. בקשות התמונות מעבירות רק הצלחה או כישלון; שם העיר והקואורדינטות מוצגים מקומית בלבד.');
writeFileSync(new URL('./widgy-js-check-2.html',import.meta.url),page);
console.log(`Built ${layers.length} layers, ${variables.length} variables, three synthetic image probes.`);
