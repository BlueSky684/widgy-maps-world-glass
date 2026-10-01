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
const nativeRequest=request['3']['66'][0]['5']==='Custom Text';
if (nativeRequest) {
  request['3']['66'][0]['25']=request['3']['66'][0]['25'].replace('&t=','&diagnostic=location&t=');
  assert(request['3']['66'][0]['25'].includes('&diagnostic=location'));
} else {
  request['3']['66'][0]['10']=request['3']['66'][0]['10'].replace("return url + '&t='", "return url + '&diagnostic=location&t='");
  assert(request['3']['66'][0]['10'].includes('&diagnostic=location'));
}
const rows=[
  row('Check 1 · Native City',[custom('1 CITY SOURCE: ['),native('City'),custom(']')],188),
  row('Check 2 · Variable City',[custom('2 CITY VARIABLE: [${widgy.City}]')],227),
  row('Check 3 · Native coordinates',[custom('3 COORD SOURCE: ['),native('Latitude (Decimal)'),custom('] / ['),native('Longitude (Decimal)'),custom(']')],266),
  row('Check 4 · Variable coordinates',[custom('4 COORD VARIABLES: [${widgy.Latitude}] / [${widgy.Longitude}]')],305),
  row('Check 5 · Map request',[custom('5 REQUEST: '),{'5':'Javascript','6':'Script','10':`function main() {
    var raw = String("${'${widgy.map_request}'}");
    if (!raw || raw.indexOf('$'+'{') !== -1) return '[unavailable]';
    function field(key) {
      var match = raw.match(new RegExp('[?&]' + key + '=([^&]*)'));
      if (!match) return '[absent]';
      try { return decodeURIComponent(match[1]); } catch (e) { return '[decode error]'; }
    }
    return 'lat=' + field('lat') + ' / lon=' + field('lon') + ' / city=' + field('city');
  }`}],344),
];
// The JS URL inspector did not reflect the server's received coordinates in
// IMG_9629. Do not present that inspector as evidence for the new native path.
if (nativeRequest) rows[4]['66']=[custom('5 URL BUILD: native Location + Date/Time (no JavaScript)')];
const bg=structuredClone(layer(5001));bg.d0=widget.a2++;bg.s='Location Check · Panel';bg.g='uicol_black-100';delete bg.a;delete bg.o1;
frame(bg,[40,180,1050,205]);
home['1'].unshift(...rows,bg);
widget['3']='Widgy Location Check';
widget['4']='Separate diagnostic copy. Rows compare direct native city/coordinates and variables outside the editor. The SERVER stamp reports the actual source and city received by the map. For native URL construction, row 5 identifies the pipeline instead of using the unreliable nested JS inspector. No fixed location, external geocoding, or location storage. The normal widget is unchanged.';
writeFileSync(new URL('./Widgy_Location_Check.json',import.meta.url),JSON.stringify(widget));

let page=readFileSync(new URL('./widgy-home-glass.html',import.meta.url),'utf8');
page=page.replace(/Widgy Home · Glass(?: \d+)?/g,'Widgy · Location Check')
  .replace(/<p>העיצוב[\s\S]*?<button/, '<p>עותק בדיקה נפרד לאיתור היעלמות שם העיר. תופיע טבלת בדיקה מעל המפה ושורת SERVER בתוכה.</p>\n  <p>ייבא כעותק נוסף, צא מהעורך ושלח צילום מלא של תצוגת הווידג׳ט מחוץ לעורך.</p>\n  <button')
  .replaceAll('Widgy_Home_Glass.json','Widgy_Location_Check.json')
  .replace("widget['3']!=='Widgy Home Glass'", "widget['3']!=='Widgy Location Check'")
  .replace(/<small>יעד הטבעת[\s\S]*?<\/small>/,'<small>זהו כלי אבחון זמני. הוא אינו מחליף את הווידג׳ט הרגיל.</small>');
writeFileSync(new URL('./widgy-location-check.html',import.meta.url),page);
console.log('Built separate native location diagnostic and importer.');
