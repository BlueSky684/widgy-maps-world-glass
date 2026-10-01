import {readFileSync, writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

// IMG_9637: both Text and Real Number expose Decimal coordinates rounded to
// one decimal; the synthetic control retains its digits. IMG_9639 confirms
// these exact Location source names. Do not guess the offscreen Longitude
// component names. This probe contains no images or outgoing requests.
const base=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass.json',import.meta.url)));
const home=base['1'].find(n=>n.d0===245);
const template=home['1'].find(n=>n.d0===6114);
const background=structuredClone(home['1'].find(n=>n.d0===5001));
const custom=value=>({'5':'Custom Text','6':'Text','25':value});
const js=value=>({'5':'Javascript','6':'Script','10':value});
const token=name=>'${widgy.'+name+'}';
const scalar=value=>({a:[{a:value,b:168,c:0,d:168}],b:0});
let id=95000;
function text(name,entries,y,height=62) {
  const node=structuredClone(template);
  Object.assign(node,{d0:id++,s:name,'1':'System Regular','66':entries,f:'uicol_white-100'});
  delete node.a; delete node.o1;
  for (const [i,k] of ['b','c','d','e'].entries()) node[k]=scalar([70,y,1460,height][i]);
  return node;
}
const sourceNames={
  dms_degrees:'Latitude (Degrees)',
  dms_minutes:'Latitude (Minutes)',
  dms_seconds:'Latitude (Seconds)',
  dms_hemisphere:'Latitude (Hemisphere)',
  dms_decimal:'Latitude (Decimal)',
  dms_longitude:'Longitude',
  dms_name:'Location Name',
};
const variables=Object.entries(sourceNames).map(([name,source])=>{
  const body=structuredClone(base['36'].find(v=>v['1']==='Latitude')['3']);
  body.s='Variable: '+name; body['66']=[{'5':'Location','6':source}];
  return {'0':`A301D450-B9B3-4D10-A001-${String(id++).padStart(12,'0')}`,'1':name,'2':0,'3':body};
});
const raw=name=>`function main(){return '['+String(${JSON.stringify(token(name))})+']';}`;
const nativeDms=['dms_degrees','dms_minutes','dms_seconds'].map(n=>'['+token(n)+']').join(' / ');
const jsDms=`function main(){return ${['dms_degrees','dms_minutes','dms_seconds'].map(n=>"'['+String("+JSON.stringify(token(n))+")+']'").join("+' / '+")};}`;

// Show magnitude only: hemisphere is reported separately, so an unavailable
// direction can never silently move a Southern coordinate to the North.
// Precision here is a diagnostic output, not the approved short map label.
function latitudeMagnitude(degrees,minutes,seconds) {
  function number(value) {
    var text=String(value).trim().replace(/\u2212/g,'-').replace(',','.');
    text=text.replace(/[\u00b0\u2032\u2033'"\s]/g,'');
    if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text))return null;
    var result=Number(text);
    return isFinite(result)?result:null;
  }
  var d=number(degrees),m=number(minutes),s=number(seconds);
  if(d===null||m===null||s===null)return '[missing or nonnumeric D/M/S]';
  if(Math.abs(d)>90||m<0||m>=60||s<0||s>=60||Math.floor(d)!==d)return '[invalid D/M/S]';
  var value=Math.abs(d)+m/60+s/3600;
  if(value>90)return '[invalid D/M/S]';
  return '['+value.toFixed(6)+']';
}
const convert=latitudeMagnitude.toString()+`\nfunction main(){return latitudeMagnitude(${['dms_degrees','dms_minutes','dms_seconds'].map(n=>JSON.stringify(token(n))).join(',')});}`;
const layers=[
  text('Title',[custom('WIDGY DMS + LOCATION NAME')],45,78),
  text('Instructions',[custom('Import a separate copy; screenshot outside editor')],145,48),
  text('Latitude section',[custom('LATITUDE - degrees / minutes / seconds')],225,50),
  text('1 Native DMS',[custom('1 Native D/M/S: '+nativeDms)],295),
  text('2 JS DMS',[custom('2 JS D/M/S: '),js(jsDms)],375),
  text('3 Hemisphere',[custom('3 Direction: native ['+token('dms_hemisphere')+'] / JS '),js(raw('dms_hemisphere'))],455),
  text('4 Current Decimal',[custom('4 Current decimal (JS): '),js(raw('dms_decimal'))],535),
  text('5 Converted magnitude',[custom('5 DMS magnitude (JS): '),js(convert)],615),
  text('Longitude section',[custom('LONGITUDE - alternative full source')],725,50),
  text('6 Native Longitude',[custom('6 Native Longitude: ['+token('dms_longitude')+']')],795),
  text('7 JS Longitude',[custom('7 JS Longitude: '),js(raw('dms_longitude'))],875),
  text('Name section',[custom('LOCATION NAME - alternative name source')],985,50),
  text('8 Native Name',[custom('8 Native name: ['+token('dms_name')+']')],1055),
  text('9 JS Name',[custom('9 JS name: '),js(raw('dms_name'))],1135),
  text('Execution',[js("function main(){return 'JS ran at '+new Date().toISOString().slice(11,19)+' UTC';}")],1245,48),
  text('Privacy',[custom('Local text only. No images or location requests.')],1340,48),
  text('Status',[custom('Diagnostic only. The map keeps its short coordinates.')],1410,48),
];
background.d0=id++;layers.push(background);
const widget=structuredClone(base);
Object.assign(widget,{'1':layers,'2':[],'3':'Widgy DMS Location Check',
  '4':'Local-only probe of screenshot-confirmed Latitude D/M/S, Longitude and Location Name sources in native text and JavaScript. Not a verified City fix. The dashboard is unchanged.',
  '6':0,'7':[],'36':variables,'38':[],'39':{'System Regular':1},a2:id});
assert.equal(new Set(layers.map(n=>n.d0)).size,layers.length);
assert.equal(layers.filter(n=>n.z==='5').length,0);
const fixtures=[
  [['12','34','56.7'],'[12.582417]'],
  [['12\u00b0','34\u2032','56,7\u2033'],'[12.582417]'],
  [['-12','34','56.7'],'[12.582417]'],
  [['0','0','1'],'[0.000278]'],
  [['90','0','0'],'[90.000000]'],
  [['90','0','1'],'[invalid D/M/S]'],
  [['12','60','0'],'[invalid D/M/S]'],
  [['12','0','60'],'[invalid D/M/S]'],
  [['','34','56'],'[missing or nonnumeric D/M/S]'],
  [['12','34','${widgy.dms_seconds}'],'[missing or nonnumeric D/M/S]'],
];
for(const [input,expected] of fixtures) {
  const values=Object.fromEntries(['dms_degrees','dms_minutes','dms_seconds'].map((key,i)=>[key,input[i]]));
  const code=convert.replace(/"\$\{widgy\.([^}]+)\}"/g,(_,key)=>JSON.stringify(values[key]));
  assert.equal(vm.runInNewContext(code+'\nmain();'),expected);
}
for(const node of layers)for(const entry of node['66']||[]) {
  if(entry['5']!=='Javascript')continue;
  assert(!/fetch\s*\(|https?:/.test(entry['10']));
  const code=entry['10'].replace(/"\$\{widgy\.([^}]+)\}"/g,()=>JSON.stringify('12'));
  assert.equal(typeof vm.runInNewContext(code+'\nmain();'),'string');
}
writeFileSync(new URL('./Widgy_DMS_Location_Check.json',import.meta.url),JSON.stringify(widget));
let page=readFileSync(new URL('./widgy-coordinate-precision.html',import.meta.url),'utf8');
page=page.replaceAll('Widgy · Coordinate Precision','Widgy · DMS & Location Name')
  .replace('השוואת קואורדינטות מסוג טקסט מול Real Number, כדי לבדוק אם JavaScript יכול לקבל יותר ספרות אחרי הנקודה.','בדיקת מעלות, דקות ושניות ומקור Location Name בתוך JavaScript ומחוצה לו. הדיוק המורחב משמש כאן לאבחון בלבד; על המפה יישארו קואורדינטות קצרות.')
  .replaceAll('Widgy_Coordinate_Precision.json','Widgy_DMS_Location_Check.json')
  .replace("widget['3']!=='Widgy Coordinate Precision'","widget['3']!=='Widgy DMS Location Check'");
writeFileSync(new URL('./widgy-dms-location-check.html',import.meta.url),page);
console.log(`Built ${layers.length} layers, ${variables.length} variables; ${fixtures.length} DMS checks passed. Device validation required.`);
