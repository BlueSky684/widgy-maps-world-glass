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
// IMG_9630 confirms native City is present, JS City is empty, and the
// recovered map_request still loads the image. Test appending native City
// directly in the image Web URL field, outside JavaScript and map_request.
const mapScript=request['3']['66'][0]['10'];
assert(mapScript);
request['3']['66'][0]['10']=mapScript.replace("return url + '&t='", "return url + '&diagnostic=location&t='");
assert(request['3']['66'][0]['10'].includes('&diagnostic=location'));
const map=layer(6170);
assert.equal(map['1'],'Web URL');assert.equal(map['2'],'${widgy.map_request}');
map['2']='${widgy.map_request}&binding=direct-city&city_text=${widgy.City}';
const rows=[
  row('Check 1 · Native City',[custom('1 CITY SOURCE: ['),native('City'),custom(']')],181),
  row('Check 2 · Variable City',[custom('2 CITY VARIABLE: [${widgy.City}]')],220),
  row('Check 3 · Direct city URL',[custom('3 IMAGE URL: ['+map['2']+']')],259),
  row('Check 4 · Single-quoted JS City',[custom('4 JS SINGLE QUOTE: ['),{'5':'Javascript','6':'Script','10':`function main() { return String('${'${widgy.City}'}').trim(); }`},custom(']')],337),
];
frame(rows[2],[54,259,1020,75]);
const bg=structuredClone(layer(5001));bg.d0=widget.a2++;bg.s='Location Check · Panel';bg.g='uicol_black-100';delete bg.a;delete bg.o1;
frame(bg,[40,177,1050,205]);
home['1'].unshift(...rows,bg);
widget['3']='Widgy Location Check';
widget['4']='Location diagnostic 3: IMG_9630 confirms native City is available but JavaScript City is empty. Retain the recovered map_request script and append native City directly in the image Web URL field using terminal city_text. No replacement of the main recovery widget. The on-map SERVER stamp reports the actual received city. This binding still requires outside-editor device confirmation.';
writeFileSync(new URL('./Widgy_Location_Check.json',import.meta.url),JSON.stringify(widget));

let page=readFileSync(new URL('./widgy-home-glass.html',import.meta.url),'utf8');
page=page.replace(/Widgy Home · Glass(?: \d+| — Recovery)?/g,'Widgy · Location Check')
  .replace(/<p>העיצוב[\s\S]*?<button/, '<p>בדיקה 3: שם העיר נוסף ישירות לכתובת המפה בשדה Web URL, מחוץ ל־JavaScript. שורת SERVER תראה אם העיר התקבלה בפועל. גרסת השחזור הרגילה נשארת זמינה ללא שינוי.</p>\n  <p>ייבא כעותק נוסף, צא מהעורך ושלח צילום מלא של תצוגת הווידג׳ט מחוץ לעורך.</p>\n  <button')
  .replaceAll('Widgy_Home_Glass.json','Widgy_Location_Check.json')
  .replace("widget['3']!=='Widgy Home Glass'", "widget['3']!=='Widgy Location Check'")
  .replace(/<small>יעד הטבעת[\s\S]*?<\/small>/,'<small>זהו כלי אבחון זמני. הוא אינו מחליף את הווידג׳ט הרגיל.</small>');
writeFileSync(new URL('./widgy-location-check.html',import.meta.url),page);
console.log('Built separate native location diagnostic and importer.');
