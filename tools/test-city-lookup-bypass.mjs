import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';
import {compactCalendarDots} from './calendar-compact-dots.js';
import {thinNativeStepsRing} from './native-steps-ring.js';
import {bypassCityLookups} from './city-lookup-bypass.js';

const template=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
const normal=personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic',
  'https://example.test/api/calendar-widget?token=synthetic');
const control=thinNativeStepsRing(compactCalendarDots(consolidateWidget(normal)));
const before=structuredClone(control),result=bypassCityLookups(control),restored=structuredClone(result);
const get=(w,name)=>w['36'].find(v=>v['1']===name)['3']['66'][0];
for(const name of ['map_request','calendar_city_prefix'])get(restored,name)['10']=get(control,name)['10'];
restored['3']=control['3'];restored['4']=control['4'];
assert.deepEqual(restored,control,'Only two script bodies and trial metadata change');
assert.deepEqual(control,before,'Input immutable');
assert.equal(result['36'].length,81);
const walk=nodes=>nodes.flatMap(n=>[n,...(n.z==='13'?walk(n['1']):[])]);
assert.equal(walk(result['1']).length,1514);
assert.equal(walk(result['1']).filter(n=>n.z==='9').length,1);
assert(!JSON.stringify(result).includes('reverse-geocode-client'));
const now=1791130800000;
const tokenValues=(lat,lon)=>({map_latitude_max5:lat,map_longitude_max5:lon,Latitude:lat,Longitude:lon});
function execute(code,lat,lon,cache=false){
  const values=tokenValues(lat,lon),out=[];
  const ctx={Date:{now:()=>now},sendToWidgy(value){out.push(value);},
    fetch(){throw Error('Unexpected network lookup');}};
  if(cache)ctx.__homeGlassCityV1={latitude:Number(lat),longitude:Number(lon),city:'CITY TEST',time:now};
  vm.runInNewContext(code.replace(/\$\{widgy\.([^}]+)\}/g,(_,name)=>values[name]),ctx);
  assert.equal(out.length,1,'Completion must occur once during initial evaluation');
  return out[0];
}
for(const name of ['map_request','calendar_city_prefix']){
  const candidate=get(result,name),original=get(control,name);
  assert.equal(candidate['6'],original['6']);
  assert.equal(candidate['10'].slice(candidate['10'].lastIndexOf('\ncityMapRuntime(')),
    original['10'].slice(original['10'].lastIndexOf('\ncityMapRuntime(')),'Original call arguments retained');
  const value=execute(candidate['10'],'0','0');
  assert.equal(value,execute(original['10'],'0','0',true),'Matches immediate valid-cache result');
  if(name==='map_request'){
    const url=new URL(value);
    assert.equal(url.origin,'https://example.test');assert.equal(url.pathname,'/api/night-map');
    for(const [key,expected] of Object.entries({city:'CITY TEST',lat:'0',lon:'0',width:'3306',mode:'live',reuse:'60',t:String(now)}))
      assert.equal(url.searchParams.get(key),expected);
  }else assert.equal(value,'CITY TEST, ');
  for(const [lat,lon] of [['','0'],['91','0'],['0','181'],['${widgy.missing}','0']]){
    const empty=execute(candidate['10'],lat,lon);
    assert.equal(empty,execute(original['10'],lat,lon),'Invalid location handling retained');
    if(name==='map_request')assert.equal(new URL(empty).searchParams.has('city'),false);
    else assert.equal(empty,'');
  }
}
for(const change of [w=>w['3']='unknown',w=>get(w,'map_request')['10']='function main(){}',
  w=>get(w,'calendar_city_prefix')['6']='Script']){
  const invalid=structuredClone(control);change(invalid);
  assert.throws(()=>bypassCityLookups(invalid),/unexpected_template/);
}

const html=readFileSync(new URL('./widgy-city-lookup-bypass.html',import.meta.url),'utf8');
const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],
  {events:{},classList:{toggle(){}},addEventListener(name,fn){this.events[name]=fn;},removeAttribute(name){delete this[name];}}]));
const events={};let downloaded,copied,error;
const ctx={document:{getElementById:id=>{assert(elements[id],id);return elements[id];}},Blob,
  consolidateWidget,compactCalendarDots,thinNativeStepsRing,bypassCityLookups,
  URL:{createObjectURL(blob){downloaded=blob;return 'blob:synthetic';},revokeObjectURL(){}},
  navigator:{clipboard:{async writeText(value){copied=value;}}},window:{addEventListener(name,fn){events[name]=fn;}},
  async prepareWidget(){if(error)throw Error(error);return {payload:JSON.stringify(normal)};}};
const source=readFileSync(new URL('./widgy-city-lookup-bypass.js',import.meta.url),'utf8');
vm.runInNewContext(source.replace(/^import .*;\n/gm,''),ctx);
await new Promise(setImmediate);
assert.equal(elements.copy.disabled,false);assert.deepEqual(JSON.parse(await downloaded.text()),result);
await elements.copy.events.click();assert.deepEqual(JSON.parse(copied),result);
error='unauthorized';await elements.retry.events.click();assert.equal(elements.copy.disabled,true);
assert.equal(elements.download.hidden,true);assert.equal(elements.download.href,undefined);
copied='';await elements.copy.events.click();assert.equal(copied,'');
error=null;events.pageshow({persisted:true});await new Promise(setImmediate);assert.equal(elements.copy.disabled,false);
ctx.navigator.clipboard.writeText=async()=>{throw Error('blocked');};
await elements.copy.events.click();assert.equal(elements.download.hidden,false);
assert(html.includes('widgy-city-lookup-bypass.js?v=city-bypass-1'));
assert(html.includes('Widgy_City_Lookup_Bypass_1.json'));
console.log('PASS: only two city script bodies/metadata change; 1514 layers, 81 variables and native ring retained. Both callbacks finish synchronously once with CITY TEST for synthetic valid GPS and match their original cache-hit outputs; malformed GPS retains original handling. No geocoder request made. Copy/download/auth recovery tested. Native timing and rendering await phone validation.');
