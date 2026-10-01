import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {REFERENCE} from './home_glass_design.mjs';

const widget=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass.json',import.meta.url),'utf8'));
const home=widget['1'].find(n=>n.d0===245);
const layer=id=>home['1'].find(n=>n.d0===id);
const custom=value=>({'5':'Custom Text','6':'Text','25':value});
const native=name=>({'5':'Location','6':name});
const scalar=a=>({a:[{a,b:168,c:0,d:168}],b:0});
function frame(n,[x,y,w,h]) {
  for(const [key,value] of Object.entries({b:x/REFERENCE.width*1600,c:y/REFERENCE.height*1600,d:w/REFERENCE.width*1600,e:h/REFERENCE.height*1600})) n[key]=scalar(value);
  return n;
}
function row(name,entries,y) {
  const n=structuredClone(layer(6114));n.d0=widget.a2++;n.s=name;n['66']=entries;
  n['1']='BarlowCondensed-Light';delete n.a;delete n.o1;
  return frame(n,[54,y,1020,38]);
}
const request=widget['36'].find(v=>v['1']==='map_request');
assert(request);
// Keep the known map binding. The failed native URL is DISPLAYED as text only.
const mapScript=request['3']['66'][0]['10'];
assert(mapScript);
request['3']['66'][0]['10']=mapScript.replace("return url + '&t='", "return url + '&diagnostic=location&t='");
assert(request['3']['66'][0]['10'].includes('&diagnostic=location'));
const endpoint=mapScript.match(/var url = '([^']+)'/)[1];
const nativeEntries=[
  custom(endpoint+'&binding=native4&t='),
  {'5':'Date And Time','6':'Custom','11':'yyyyMMddHHmmssZ'},
  custom('&lat='),native('Latitude (Decimal)'),
  custom('&lon='),native('Longitude (Decimal)'),
  custom('&city_text='),native('City'),
];
const probe=structuredClone(request);
probe['0']='AD5D21AF-E1F3-486C-A001-000000000006';probe['1']='native4_query_probe';
probe['3']['66']=structuredClone(nativeEntries);
probe['3']['66'][0]['25']='binding=native4&t=';
probe['3'].s='Variable: native4_query_probe';widget['36'].push(probe);
const fullProbe=structuredClone(probe);fullProbe['0']='AD5D21AF-E1F3-486C-A001-000000000007';fullProbe['1']='native4_url_probe';
fullProbe['3']['66']=nativeEntries;fullProbe['3'].s='Variable: native4_url_probe';widget['36'].push(fullProbe);
const rows=[
  row('Check 1 · Native City',[custom('1 CITY SOURCE: ['),native('City'),custom(']')],181),
  row('Check 2 · Variable City',[custom('2 CITY VARIABLE: [${widgy.City}]')],220),
  row('Check 3 · JS City',[custom('3 JS CITY: ['),{'5':'Javascript','6':'Script','10':`function main() { return String("${'${widgy.City}'}").trim(); }`},custom(']')],259),
  row('Check 4 · Coordinates',[custom('4 COORDINATES: [${widgy.Latitude}] / [${widgy.Longitude}]')],298),
  row('Check 5 · Native query',[custom('5 NATIVE QUERY: [${widgy.native4_query_probe}]')],337),
  row('Check 6 · Native full URL',[custom('6 NATIVE URL: [${widgy.native4_url_probe}]')],376),
  row('Check 7 · Bound URL',[custom('7 MAP URL: [${widgy.map_request}]')],415),
];
const bg=structuredClone(layer(5001));bg.d0=widget.a2++;bg.s='Location Check · Panel';bg.g='uicol_black-100';delete bg.a;delete bg.o1;
frame(bg,[40,177,1050,281]);
home['1'].unshift(...rows,bg);
widget['3']='Widgy Location Check';
widget['4']='Location diagnostic 2 uses the recovered Glass 3 map binding. Rows 5-6 DISPLAY the failed Glass 4 native URL/query as text only; they never load the image. Row 7 displays the bound map_request as native text, without a JavaScript inspector. Row 3 separately tests the City value inside JavaScript. The SERVER stamp reports actual received location. No fixed location or geocoding. City delivery remains unresolved.';
writeFileSync(new URL('./Widgy_Location_Check.json',import.meta.url),JSON.stringify(widget));

let page=readFileSync(new URL('./widgy-home-glass.html',import.meta.url),'utf8');
page=page.replace(/Widgy Home · Glass(?: \d+| — Recovery)?/g,'Widgy · Location Check')
  .replace(/<p>העיצוב[\s\S]*?<button/, '<p>בדיקה 2: המפה משתמשת במנגנון המשוחזר. הכתובת שנכשלה מוצגת כטקסט בלבד בשורות 5–6, והכתובת של המפה בשורה 7. שורת SERVER מציגה מה שהשרת קיבל בפועל.</p>\n  <p>ייבא כעותק נוסף, צא מהעורך ושלח צילום מלא של תצוגת הווידג׳ט מחוץ לעורך.</p>\n  <button')
  .replaceAll('Widgy_Home_Glass.json','Widgy_Location_Check.json')
  .replace("widget['3']!=='Widgy Home Glass'", "widget['3']!=='Widgy Location Check'")
  .replace(/<small>יעד הטבעת[\s\S]*?<\/small>/,'<small>זהו כלי אבחון זמני. הוא אינו מחליף את הווידג׳ט הרגיל.</small>');
writeFileSync(new URL('./widgy-location-check.html',import.meta.url),page);
console.log('Built separate native location diagnostic and importer.');
