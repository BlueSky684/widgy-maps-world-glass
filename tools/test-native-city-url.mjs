import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';
import {compactCalendarDots} from './calendar-compact-dots.js';
import {thinNativeStepsRing} from './native-steps-ring.js';
import {bypassCityLookups} from './city-lookup-bypass.js';
import {withNativeCityURL,withNativeCityRecovery} from './native-city-url.js';
import {parseMapRequest} from '../lib/native-map-request.js';
import {resolveLocation} from '../lib/map-astronomy-location.js';

const template=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
const normal=personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic',
  'https://example.test/api/calendar-widget?token=synthetic');
const control=thinNativeStepsRing(compactCalendarDots(consolidateWidget(normal)));
const before=structuredClone(control),bypass=bypassCityLookups(control),result=withNativeCityURL(control);
const get=(w,name)=>w['36'].find(v=>v['1']===name)['3']['66'][0];
const walk=nodes=>nodes.flatMap(n=>[n,...(n.z==='13'?walk(n['1']):[])]);
const map=w=>walk(w['1']).find(n=>n.s==='Home Hero World Map');
const restored=structuredClone(result);
for(const name of ['map_request','calendar_city_prefix'])get(restored,name)['10']=get(bypass,name)['10'];
map(restored)['2']=map(bypass)['2'];restored['3']=bypass['3'];restored['4']=bypass['4'];
assert.deepEqual(restored,bypass,'Only two script bodies, map URL field and metadata change');
assert.deepEqual(control,before,'Input immutable');
assert.equal(result['36'].length,81);assert.equal(walk(result['1']).length,1514);
assert(!JSON.stringify(result).includes('reverse-geocode-client'));
assert.equal(get(result,'calendar_native_city')['5'],'Location');
assert.equal(get(result,'calendar_native_city')['6'],'City');
assert.equal(map(result)['2'],'${widgy.map_request}&city_text=${widgy.calendar_native_city}');
const now=1791130800000;
function execute(name,lat='0',lon='0'){
  const values={map_latitude_max5:lat,map_longitude_max5:lon,Latitude:lat,Longitude:lon},out=[];
  const code=get(result,name)['10'];
  assert(!code.includes('${widgy.calendar_native_city}'),'City never enters JavaScript source');
  vm.runInNewContext(code.replace(/\$\{widgy\.([^}]+)\}/g,(_,key)=>values[key]),{
    Date:{now:()=>now},sendToWidgy(value){out.push(value);},fetch(){throw Error('Unexpected geocoder');}});
  assert.equal(out.length,1);return out[0];
}
const mapURL=execute('map_request'),url=new URL(mapURL);
for(const [k,v] of Object.entries({lat:'0',lon:'0',width:'3306',mode:'live',reuse:'60',t:String(now)}))
  assert.equal(url.searchParams.get(k),v);
assert.equal(url.searchParams.has('city'),false);assert.equal(execute('calendar_city_prefix'),'');
for(const [lat,lon] of [['','0'],['91','0'],['0','181'],['${widgy.missing}','0']]){
  const invalid=new URL(execute('map_request',lat,lon));
  assert(invalid.searchParams.get('lat')==='' || invalid.searchParams.get('lon')==='');
  assert.equal(resolveLocation(parseMapRequest(invalid.href+'&city_text=Example'),
    {'x-vercel-ip-latitude':'10','x-vercel-ip-longitude':'10'}),null,'Invalid GPS must not use IP location');
  assert.equal(execute('calendar_city_prefix',lat,lon),'');
}
// Models substitution as data. It does NOT establish native Widgy URL support.
for(const [city,expected] of [['Example','Example'],['Ashqelon','Ashkelon'],["O'Example", "O'Example"],
  ['עיר לדוגמה','עיר לדוגמה'],['A&B + Place','A&B + Place'],
  ['Example&width=1102&cache=synthetic-60','Example&width=1102&cache=synthetic-60'],
  ['${widgy.calendar_native_city}',''],['undefined',''],['null','']]){
  for(const value of [city,encodeURIComponent(city)]){
    const imageURL=map(result)['2'].replace('${widgy.map_request}',mapURL).replace('${widgy.calendar_native_city}',value);
    const parsed=parseMapRequest(imageURL);
    assert.equal(parsed.searchParams.get('city'),expected);
    assert.equal(parsed.searchParams.get('width'),'3306');assert.equal(parsed.searchParams.has('cache'),false);
    assert.equal(parsed.searchParams.get('lat'),'0');assert.equal(parsed.searchParams.get('lon'),'0');
  }
}
const ordinary='/api/night-map?lat=0&lon=0&city=Ashqelon';
assert.equal(parseMapRequest(ordinary).searchParams.get('city'),'Ashqelon','Existing city= unaffected');
assert.equal(parseMapRequest(mapURL).href,mapURL,'Existing map URL unaffected');
const vars=new Map(result['36'].map(v=>[v['1'],v]));
const locationNodes=result['1'].find(n=>n.s==='CALENDAR')['1'].filter(n=>n.s?.startsWith('Calendar Location'));
function active(ns,values){return ns.flatMap(n=>{
  if(n.o1){const {0:v,1:op,2:term}=n.o1,x=values[v]??'';if(!({0:x===term,1:x!==term})[op])return [];}
  return n.z==='13'?active(n['1'],values):[n];
});}
for(const [city,expected] of [['Example','Native Fallback'],['Ashqelon','Ashkelon Spelling'],['','Native Fallback']]){
  const shown=active(locationNodes,{[vars.get('calendar_city_prefix')['0']]:'',[vars.get('calendar_native_city')['0']]:city});
  assert.equal(shown.length,1);assert(shown[0].s.endsWith(expected));
}
for(const change of [w=>get(w,'calendar_native_city')['6']='Country',w=>map(w)['2']='unexpected',
  w=>w['36'].push(structuredClone(w['36'].find(v=>v['1']==='calendar_native_city')))]){
  const invalid=structuredClone(control);change(invalid);assert.throws(()=>withNativeCityURL(invalid),/unexpected_template/);
}

const recovery=withNativeCityRecovery(control),restoreRecovery=structuredClone(recovery);
map(restoreRecovery)['2']=map(result)['2'];restoreRecovery['3']=result['3'];restoreRecovery['4']=result['4'];
assert.deepEqual(restoreRecovery,result,'Recovery changes only failed image binding and metadata');
assert.deepEqual(map(recovery),map(control),'Original working map image definition is restored exactly');
assert.deepEqual(control,before,'Recovery input immutable');
assert.equal(recovery['3'],'Widgy Native City Recovery 1');
assert.equal(walk(recovery['1']).length,1514);assert.equal(recovery['36'].length,81);
assert.deepEqual(recovery['36'],result['36'],'Immediate scripts and native city fallback retained');

const html=readFileSync(new URL('./widgy-native-city-url.html',import.meta.url),'utf8');
const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],
  {events:{},classList:{toggle(){}},addEventListener(name,fn){this.events[name]=fn;},removeAttribute(name){delete this[name];}}]));
const events={};let downloaded,copied,error;
const ctx={document:{getElementById:id=>{assert(elements[id],id);return elements[id];}},Blob,
  consolidateWidget,compactCalendarDots,thinNativeStepsRing,withNativeCityRecovery,
  URL:{createObjectURL(blob){downloaded=blob;return 'blob:synthetic';},revokeObjectURL(){}},
  navigator:{clipboard:{async writeText(value){copied=value;}}},window:{addEventListener(name,fn){events[name]=fn;}},
  async prepareWidget(){if(error)throw Error(error);return {payload:JSON.stringify(normal)};}};
const source=readFileSync(new URL('./widgy-native-city-url.js',import.meta.url),'utf8');
vm.runInNewContext(source.replace(/^import .*;\n/gm,''),ctx);
await new Promise(setImmediate);
assert.equal(elements.copy.disabled,false);assert.deepEqual(JSON.parse(await downloaded.text()),recovery);
await elements.copy.events.click();assert.deepEqual(JSON.parse(copied),recovery);
error='unauthorized';await elements.retry.events.click();assert.equal(elements.copy.disabled,true);
assert.equal(elements.download.hidden,true);assert.equal(elements.download.href,undefined);
copied='';await elements.copy.events.click();assert.equal(copied,'');
error=null;events.pageshow({persisted:true});await new Promise(setImmediate);assert.equal(elements.copy.disabled,false);
ctx.navigator.clipboard.writeText=async()=>{throw Error('blocked');};
await elements.copy.events.click();assert.equal(elements.download.hidden,false);
assert(html.includes('widgy-native-city-url.js?v=native-city-recovery-1'));
assert(html.includes('Widgy_Native_City_Recovery_1.json'));
console.log('PASS: recovery changes only failed image binding and metadata; original map image restored exactly; 1514 layers/81 variables, immediate scripts without custom geocoder, live GPS and invalid-input behavior, native Calendar fallback and copy/download/session recovery preserved. Recovery map rendering, native city and speed await phone verification.');
