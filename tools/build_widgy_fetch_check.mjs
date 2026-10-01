import {readFileSync, writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {cityFetchDiagnostic} from './widgy-city-fetch-diagnostic.mjs';

const read = file => JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'));
const base = read('./Widgy_Home_Glass.json');
const home = base['1'].find(n => n.d0 === 245);
const textTemplate = home['1'].find(n => n.d0 === 6114);
const imageTemplate = home['1'].find(n => n.d0 === 6170);
const background = structuredClone(home['1'].find(n => n.d0 === 5001));
const max5 = read('./widgy-native-max5-source.json').max5;
const origin = new URL(process.argv[2]);
assert(origin.protocol === 'https:' && origin.pathname === '/' && !origin.search && !origin.hash);
const endpoint = origin.origin + '/api/fetch-probe';
const green = origin.origin + '/api/binding-probe?label=SyntheticTest';
const amber = origin.origin + '/api/binding-probe?label=Failed';
const custom = text => ({'5':'Custom Text','6':'Text','25':text});
const asyncSource = code => ({'5':'Javascript','6':'Async + No main()','10':code});
const location = name => ({'5':'Location','6':name});
const scalar = value => ({a:[{a:value,b:168,c:0,d:168}],b:0});
const token = name => '${widgy.' + name + '}';
let id = 98000;
function frame(node, box) {
  for (const [i,key] of ['b','c','d','e'].entries()) node[key] = scalar(box[i]);
  return node;
}
function text(name, entries, y, height=62) {
  const node = structuredClone(textTemplate);
  Object.assign(node,{d0:id++,s:name,'1':'System Regular','66':entries,f:'uicol_white-100'});
  delete node.a;delete node.o1;
  return frame(node,[70,y,1460,height]);
}
function variable(name, entries, precise=false) {
  const body=structuredClone(base['36'].find(v=>v['1']==='Latitude')['3']);
  body.s='Variable: '+name;body['66']=entries;
  if(precise) body['28']=structuredClone(max5);
  return {'0':`C5D5F231-73AF-48A7-B003-${String(id++).padStart(12,'0')}`,'1':name,'2':0,'3':body};
}
const controlScript = asImage => `var finished=false;
function done(value){if(!finished){finished=true;sendToWidgy(value);}}
try {
  fetch(${JSON.stringify(endpoint)}).then(function(response){
    if(response.ok===false)throw new Error('HTTP');
    return response.json();
  }).then(function(data){
    var ok=data&&data.probe==='WIDGY_FETCH_OK';
    done(${asImage ? 'ok?'+JSON.stringify(green)+':'+JSON.stringify(amber) : "ok?'FETCH OK / JSON OK':'WRONG JSON'"});
  }).catch(function(error){done(${asImage ? JSON.stringify(amber) : "'FETCH FAILED / '+(error&&error.name||'Error')"});});
} catch(error){done(${asImage ? JSON.stringify(amber) : "'CALL FAILED / '+(error&&error.name||'Error')"});}`;
const variables = [
  variable('fetch_latitude',[location('Latitude (Decimal)')],true),
  variable('fetch_longitude',[location('Longitude (Decimal)')],true),
  variable('async_immediate_url',[asyncSource('sendToWidgy('+JSON.stringify(green)+');')]),
  variable('async_promise_url',[asyncSource('Promise.resolve().then(function(){sendToWidgy('+JSON.stringify(green)+');});')]),
  variable('async_fetch_url',[asyncSource(controlScript(true))]),
];
const layers = [
  text('Title',[custom('WIDGY FETCH / IMAGE CHECK')],45,80),
  text('Instructions',[custom('Separate copy; screenshot OUTSIDE the editor')],145,48),
  text('Native city',[custom('1 Native City: ['),location('City'),custom(']')],225),
  text('Async helpers',[custom('2 Async: '),asyncSource("sendToWidgy('fetch='+typeof fetch+' | xhr='+typeof XMLHttpRequest+' | send='+typeof sendToWidgy);")],315),
  text('Fetch control',[custom('3 Direct JS control: '),asyncSource(controlScript(false))],405),
  text('City heading',[custom('4 Direct JS city request (BigDataCloud):')],495),
  text('City response',[asyncSource(cityFetchDiagnostic.toString()+'\ncityFetchDiagnostic('+JSON.stringify(token('fetch_latitude'))+','+JSON.stringify(token('fetch_longitude'))+');')],575,205),
  text('Control heading',[custom('Image controls (synthetic; no location):')],820,50),
];
for(const [index,[label,address]] of [
  ['A Direct URL',green],
  ['B Async variable',token('async_immediate_url')],
  ['C Promise variable',token('async_promise_url')],
  ['D Fetch variable',token('async_fetch_url')],
].entries()) {
  const x=70+(index%2)*755,y=900+Math.floor(index/2)*230;
  const caption=text(label,[custom(label)],y,52);frame(caption,[x,y,705,52]);layers.push(caption);
  const node=structuredClone(imageTemplate);
  Object.assign(node,{d0:id++,s:label+' image','1':'Web URL','2':address});
  delete node['22'];delete node.a;delete node.o1;
  layers.push(frame(node,[x,y+55,375,150]));
}
layers.push(text('Interpretation',[custom('Blank = no image | Amber D = request failed')],1360,48));
layers.push(text('Timestamp',[asyncSource("sendToWidgy('JS ran at '+new Date().toISOString().slice(11,19)+' UTC');")],1420,48));
layers.push(text('Privacy',[custom('Only row 4 sends current GPS to BigDataCloud.')],1480,44));
background.d0=id++;layers.push(background);
const widget=structuredClone(base);
Object.assign(widget,{'1':layers,'2':[],'3':'Widgy Fetch Image Check',
  '4':'Isolates IMG_9649 blank-map failure: direct async fetch text versus immediate, Promise and fetch-backed async URL variables consumed by images. One current-location BigDataCloud request from the phone, authorized by user. Small controlled image/JSON requests contain no location. Does not change dashboard.',
  '6':0,'7':[],'36':variables,'38':[],'39':{'System Regular':1},a2:id});
writeFileSync(new URL('./Widgy_Fetch_Image_Check.json',import.meta.url),JSON.stringify(widget));
let page=readFileSync(new URL('./widgy-home-glass.html',import.meta.url),'utf8');
page=page.replace(/Widgy Home · Glass(?: — Recovery)?/g,'Widgy · Fetch / Image')
  .replace(/<p>העיצוב[\s\S]*?<button/,'<p>בדיקה ממוקדת של בקשת זיהוי העיר ושל העברת תוצאה אסינכרונית לתמונה.</p>\n  <p>ייבא כעותק נוסף, צא מהעורך ורענן פעם אחת. שלח צילום מלא, כולל שורה 4 וארבע תמונות הבדיקה.</p>\n  <button')
  .replaceAll('Widgy_Home_Glass.json','Widgy_Fetch_Image_Check.json')
  .replace("widget['3']!=='Widgy Home Glass'","widget['3']!=='Widgy Fetch Image Check'")
  .replace(/<small>יעד הטבעת[\s\S]*?<\/small>/,'<small>בהתאם לאישור שלך, שורה 4 שולחת את המיקום הנוכחי ישירות מהאייפון ל־BigDataCloud. יתר בדיקות הרשת משתמשות בנתוני דוגמה בלבד.</small>');
writeFileSync(new URL('./widgy-fetch-image-check.html',import.meta.url),page);
console.log(`Built ${layers.length} layers, ${variables.length} variables and four image controls.`);
