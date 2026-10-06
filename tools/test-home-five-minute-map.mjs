import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';
import {compactCalendarDots} from './calendar-compact-dots.js';
import {thinNativeStepsRing} from './native-steps-ring.js';
import {withMapSyncRecovery} from './native-city-url.js';
import {withMapFiveMinuteURL} from './map-five-minute-url.js';
import {withHomeFiveMinuteMap} from './home-five-minute-map.js';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const template=JSON.parse(read('./Widgy_Home_Glass_Calendar_C16.json'));
const endpoints={endpoint:'https://example.test/api/calendar-dots?token=synthetic',
  widgetEndpoint:'https://example.test/api/calendar-widget?token=synthetic'};
const normal=personalizedWidget(template,endpoints.endpoint,endpoints.widgetEndpoint);
const full=thinNativeStepsRing(compactCalendarDots(consolidateWidget(normal)));
const before=structuredClone(full),control=withMapSyncRecovery(full);
const minimal=withMapFiveMinuteURL(full,'https://example.test');
const result=withHomeFiveMinuteMap(full,'https://example.test');
const variable=(w,name)=>w['36'].find(v=>v['1']===name);
const source=w=>variable(w,'map_request')['3']['66'][0];
assert.deepEqual(full,before,'Input unchanged');
const restored=structuredClone(result);
source(restored)['10']=source(control)['10'];
restored['3']=control['3'];restored['4']=control['4'];
assert.deepEqual(restored,control,'Only the map script and trial metadata may change');
assert.deepEqual(variable(result,'map_request'),variable(minimal,'map_request'));
for(const name of ['map_latitude_max5','map_longitude_max5'])
  assert.deepEqual(variable(result,name),variable(minimal,name));
const walk=ns=>ns.flatMap(n=>[n,...(n.z==='13'?walk(n['1']):[])]);
const nodes=walk(result['1']);
assert.equal(nodes.length,1514);assert.equal(new Set(nodes.map(n=>n.d0)).size,1514);
assert.equal(result['36'].length,81);
assert.deepEqual(result['1'].map(n=>n.s),['HOME','CALENDAR','WEATHER','FITNESS']);
const map=nodes.find(n=>n.d0===6170);
assert.deepEqual(map,walk(minimal['1']).find(n=>n.d0===6170));
assert.equal(map['1'],'Web URL');assert.equal(map['3'],true);
// Existing compact-dot preparation already routes month images through
// calendar-widget; preserve that private endpoint, not the obsolete dots URL.
assert(JSON.stringify(result).includes(endpoints.widgetEndpoint));
assert(!/fetch\s*\(|reverse-geocode-client/.test(source(result)['10']));
assert(!/fetch\s*\(|reverse-geocode-client/.test(variable(result,'calendar_city_prefix')['3']['66'][0]['10']));
const trap=()=>{throw Error('Unexpected map network/timer/async');};
function run(now,lat,lon){
  const script=source(result)['10'].replace(/"\$\{widgy\.([^}]+)\}"/g,(_,name)=>{
    assert(['map_latitude_max5','map_longitude_max5'].includes(name));
    return JSON.stringify(name.includes('latitude')?lat:lon);
  });
  return vm.runInNewContext(script+'\nmain()',{
    Date:{now:()=>now},fetch:trap,sendToWidgy:trap,setTimeout:trap,setInterval:trap
  },{timeout:100});
}
const now=Date.parse('2026-10-06T05:45:00Z');
const url=run(now,'1.25001','2.50002');
assert.equal(url,run(now+299999,'1.25001','2.50002'));
assert.notEqual(url,run(now+300000,'1.25001','2.50002'));
assert.notEqual(url,run(now,'1.25002','2.50002'));
assert.equal(new URL(url).searchParams.get('diagnostic'),'refresh-v1');
assert.equal(new URL(url).searchParams.get('width'),'3306');
assert.equal(new URL(run(now,'','')).searchParams.get('lat'),'');

// Exercise the real private export helper and new controller with synthetic
// responses only. Check auth failure cannot leave an old payload copyable.
const html=read('./widgy-home-five-minute-map.html');
const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],
  {events:{},classList:{toggle(){}},addEventListener(name,fn){this.events[name]=fn;},removeAttribute(name){delete this[name];}}]));
const events={},requests=[];let downloaded,copied,error=null,revoked=0;
class BrowserURL extends URL{
  static createObjectURL(blob){downloaded=blob;return 'blob:synthetic';}
  static revokeObjectURL(){revoked++;}
}
const context=vm.createContext({document:{getElementById:id=>{assert(elements[id],id);return elements[id];}},
  Blob,URL:BrowserURL,personalizedWidget,consolidateWidget,compactCalendarDots,thinNativeStepsRing,withHomeFiveMinuteMap,
  navigator:{clipboard:{async writeText(value){copied=value;}}},
  window:{location:{href:'https://example.test/tools/widgy-home-five-minute-map.html'},addEventListener(name,fn){events[name]=fn;}},
  async fetch(url,options){
    requests.push({url,options});
    if(url==='/api/calendar-bridge?op=export')return {ok:!error,async json(){return error?{error}:endpoints;}};
    assert.equal(url,'./Widgy_Home_Glass_Calendar_C16.json');
    return {ok:true,async json(){return structuredClone(template);}};
  }});
const noImports=code=>code.replace(/^import .*;\n/gm,'');
vm.runInContext(noImports(read('./calendar-widget-export.js')).replace('export async function','async function'),context);
vm.runInContext(noImports(read('./widgy-home-five-minute-map.js')),context);
await new Promise(setImmediate);
assert.equal(elements.copy.disabled,false);
assert.deepEqual(JSON.parse(await downloaded.text()),result);
await elements.copy.events.click();assert.deepEqual(JSON.parse(copied),result);
error='unauthorized';await elements.retry.events.click();
assert.equal(elements.copy.disabled,true);assert.equal(elements.download.hidden,true);
assert.equal(elements.download.href,undefined);assert(elements.status.textContent.includes('בכרום'));
copied='';await elements.copy.events.click();assert.equal(copied,'');
error=null;events.pageshow({persisted:true});await new Promise(setImmediate);
assert.equal(elements.copy.disabled,false);assert.equal(revoked,1);
context.navigator.clipboard.writeText=async()=>{throw Error('blocked');};
await elements.copy.events.click();assert.equal(elements.download.hidden,false);
assert.deepEqual(JSON.parse(await downloaded.text()),result);
for(const {url,options} of requests){
  assert.equal(options.cache,'no-store');
  if(url==='/api/calendar-bridge?op=export'){
    assert.equal(options.method,'POST');assert.deepEqual(JSON.parse(options.body),{version:2});
  }else assert(!options.method || options.method==='GET');
}
assert.equal(requests.length,5);
assert(html.includes('widgy-home-five-minute-map.js?v=home-five-minute-map-1'));
assert(html.includes('Widgy_Home_Five_Minute_Map_1.json'));
console.log('PASS: exact tested map source/image/coordinates in full 1514-layer/81-variable widget; all other full-baseline fields preserved. Real private export helper and copy/download/auth failure/recovery flows pass with synthetic data. Native full-widget speed still unverified.');
