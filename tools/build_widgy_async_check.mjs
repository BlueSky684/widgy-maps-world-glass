import {readFileSync, writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

// IMG_9640: native DMS, direction, Longitude and Location Name work outside
// the editor, while the matching synchronous JS inputs are empty.
// IMG_9641 confirms Javascript / Async + No main() as a separate source.
// IMG_9643 outside editor confirms this Async source executes (RAN), but
// City, DMS, hemisphere and full Longitude remain empty; Decimal resolves.
// Use the established Javascript code field (10) with that exact source
// name (6). The constant control verifies this import on the device; local
// JS tests cannot verify Widgy's source selection or substitution timing.
// Developer's async contract:
// https://www.reddit.com/r/widgy/comments/pdpi2j/fetch_use/
// No requests, location transmission, timers, variable chains or map edits.
const base=JSON.parse(readFileSync(new URL('./Widgy_DMS_Location_Check.json',import.meta.url)));
const template=base['1'].find(n=>n.s==='2 JS DMS');
const background=structuredClone(base['1'].find(n=>n.z==='2'));
const custom=value=>({'5':'Custom Text','6':'Text','25':value});
const sync=value=>({'5':'Javascript','6':'Script','10':value});
const asyncSource=value=>({'5':'Javascript','6':'Async + No main()','10':value});
const token=name=>'${widgy.'+name+'}';
const quoted=name=>JSON.stringify(token(name));
const scalar=value=>({a:[{a:value,b:168,c:0,d:168}],b:0});
let id=96000;
function text(name,entries,y,height=62) {
  const node=structuredClone(template);
  Object.assign(node,{d0:id++,s:name,'66':entries});
  for(const [i,k] of ['b','c','d','e'].entries())node[k]=scalar([70,y,1460,height][i]);
  return node;
}
const variables=structuredClone(base['36']);
const city=structuredClone(variables[0]);
city['0']='A301D450-B9B3-4D10-A002-000000096000';
city['1']='async_city';city['3'].s='Variable: async_city';
city['3']['66']=[{'5':'Location','6':'City'}];
variables.push(city);
const expression=name=>"'['+String("+quoted(name)+")+']'";
const packet=['dms_degrees','dms_minutes','dms_seconds','dms_hemisphere'].map(expression).join("+' / '+");
const layers=[
  text('Title',[custom('WIDGY ASYNC LOCATION CHECK')],45,78),
  text('Instructions',[custom('Separate copy; screenshot OUTSIDE the editor')],145,48),
  text('Source label',[custom('Testing: Javascript > Async + No main()')],215,48),
  text('1 Native City',[custom('1 Native City: ['+token('async_city')+']')],295),
  text('2 Sync City',[custom('2 Sync City: '),sync('function main(){return '+expression('async_city')+';}')],380),
  text('3 Async control',[custom('3 Async control: '),asyncSource("sendToWidgy('RAN at '+new Date().toISOString().slice(11,19)+' UTC');")],465),
  text('4 Async City',[custom('4 Async City: '),asyncSource('sendToWidgy('+expression('async_city')+');')],550),
  text('5 Async Promise City',[custom('5 Async Promise City: '),asyncSource('Promise.resolve().then(function(){sendToWidgy('+expression('async_city')+');});')],635),
  text('6 Native DMS',[custom('6 Native D/M/S/N: '+['dms_degrees','dms_minutes','dms_seconds','dms_hemisphere'].map(n=>'['+token(n)+']').join(' / '))],740),
  text('7 Async DMS',[custom('7 Async D/M/S/N: '),asyncSource('sendToWidgy('+packet+');')],825),
  text('8 Async Decimal',[custom('8 Async Decimal: '),asyncSource('sendToWidgy('+expression('dms_decimal')+');')],910),
  text('9 Native Longitude',[custom('9 Native Longitude: ['+token('dms_longitude')+']')],1015),
  text('10 Async Longitude',[custom('10 Async Longitude: '),asyncSource('sendToWidgy('+expression('dms_longitude')+');')],1100),
  text('11 Async runtime',[custom('11 Async runtime: '),asyncSource("sendToWidgy('widgy='+typeof widgy+', timer='+typeof setTimeout+', fetch='+typeof fetch);")],1205,54),
  text('Interpretation',[custom('RAN on row 3 confirms the async source executed.')],1320,48),
  text('Privacy',[custom('Local text only. No images or network requests.')],1390,48),
  text('Status',[custom('Diagnostic only; the dashboard stays unchanged.')],1460,48),
];
background.d0=id++;layers.push(background);
const widget=structuredClone(base);
Object.assign(widget,{'1':layers,'3':'Widgy Async Location Check',
  '4':'Compares native Location, synchronous Javascript and the screenshot-confirmed Async + No main() source. Constant execution control, immediate and Promise completion. Local text only; not a verified City fix.',
  '36':variables,a2:id});
assert.equal(new Set(layers.map(n=>n.d0)).size,layers.length);
assert.equal(new Set(variables.map(v=>v['1'])).size,variables.length);
assert(variables.every(v=>v['3']['66'].every(e=>e['5']==='Location')));
assert(layers.every(n=>n.z!=='5'));
const asyncScripts=layers.flatMap(n=>n['66']||[]).filter(e=>e['6']==='Async + No main()');
for(const input of ['', 'Synthetic Place', '12'])for(const source of asyncScripts) {
  const code=source['10'];
  assert(!/function\s+main|fetch\s*\(|https?:|setTimeout\s*\(/.test(code));
  const substituted=code.replace(/"\$\{widgy\.[^}]+\}"/g,JSON.stringify(input));
  const outputs=[];
  const result=vm.runInNewContext(substituted,{sendToWidgy:value=>{outputs.push(value);}});
  if(result&&typeof result.then==='function')await result;
  assert.equal(outputs.length,1,'Each source must complete exactly once');
  assert.equal(typeof outputs[0],'string');
  if(code.includes('${widgy.async_city}'))assert.equal(outputs[0],'['+input+']');
}
writeFileSync(new URL('./Widgy_Async_Location_Check.json',import.meta.url),JSON.stringify(widget));
let page=readFileSync(new URL('./widgy-coordinate-precision.html',import.meta.url),'utf8');
page=page.replaceAll('Widgy · Coordinate Precision','Widgy · Async Location Check')
  .replace('השוואת קואורדינטות מסוג טקסט מול Real Number, כדי לבדוק אם JavaScript יכול לקבל יותר ספרות אחרי הנקודה.','השוואת נתוני מיקום ב־JavaScript רגיל מול המקור Async + No main(). שורה 3 תראה אם המסלול האסינכרוני אכן רץ.')
  .replaceAll('Widgy_Coordinate_Precision.json','Widgy_Async_Location_Check.json')
  .replace("widget['3']!=='Widgy Coordinate Precision'","widget['3']!=='Widgy Async Location Check'");
writeFileSync(new URL('./widgy-async-location-check.html',import.meta.url),page);
console.log(`Built ${layers.length} layers; ${asyncScripts.length} async sources passed single-completion checks. Widgy async import and location binding require device verification.`);
