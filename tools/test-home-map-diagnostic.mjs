import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {personalizedWidget} from './calendar-connect-widget.js';
import {perf5DiagnosticBaseline,withoutHomeMap,withoutHomeMapAndCityLookup,withoutHomeNativeData,withoutHomeLiveClock,withMinimalHome,withMinimalHomeLiveClock,withMinimalHomeEvents,withoutHomeProgressArtwork,withoutHomeWeatherArtwork} from './widget-home-map-diagnostic.js';
const template=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
const normal=personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic','https://example.test/api/calendar-widget?token=synthetic');
const original=perf5DiagnosticBaseline(normal);
const expectedBaseline=structuredClone(normal);
for(const n of expectedBaseline['1'].find(n=>n.s==='HOME')['1'])if(/^Steps Goal Ring · \d+%$/.test(n.s))n.o1['1']=0;
assert.deepEqual(original,expectedBaseline);
assert(normal['1'].find(n=>n.s==='HOME')['1'].filter(n=>/^Steps Goal Ring · \d+%$/.test(n.s)).every(n=>n.o1['1']===5));
const unchanged=structuredClone(original),diagnostic=withoutHomeMap(original);
assert.deepEqual(original,unchanged);
const expected=structuredClone(original);
expected['1'].find(n=>n.s==='HOME')['1']=expected['1'].find(n=>n.s==='HOME')['1'].filter(n=>n.s!=='Home Hero World Map');
const names=['map_request'];
expected['36']=expected['36'].filter(v=>!names.includes(v['1']));
expected['3']=diagnostic['3'];expected['4']=diagnostic['4'];assert.deepEqual(diagnostic,expected);
assert.deepEqual(diagnostic['36'].find(v=>v['1']==='calendar_city_prefix'),original['36'].find(v=>v['1']==='calendar_city_prefix'));
assert(!JSON.stringify(diagnostic).includes('${widgy.map_request}'));
const count=nodes=>nodes.reduce((n,x)=>n+1+(x.z==='13'?count(x['1']):0),0);
assert.equal(count(original['1'])-count(diagnostic['1']),1);
assert.equal(original['36'].length-diagnostic['36'].length,1);
assert.throws(()=>withoutHomeMap(template),/unexpected_template/);
const missing=structuredClone(original);missing['1'].find(n=>n.s==='HOME')['1']=[];
assert.throws(()=>withoutHomeMap(missing),/unexpected_template/);
const dangling=structuredClone(original);dangling['1'][1].s='${widgy.map_request}';
assert.throws(()=>withoutHomeMap(dangling),/unexpected_template/);
console.log('Passed: only one image and one map variable removed; all other nodes, data, controls and metadata preserved; original not mutated; independent Calendar city lookup retained, map pipeline removed.');

const cityOff=withoutHomeMapAndCityLookup(original),expectedCityOff=structuredClone(diagnostic);
const literal=[{'5':'Custom Text','6':'Text','25':'TEST, '}];
expectedCityOff['36'].find(v=>v['1']==='calendar_city_prefix')['3']['66']=literal;
expectedCityOff['3']=cityOff['3'];expectedCityOff['4']=cityOff['4'];
assert.deepEqual(cityOff,expectedCityOff);
assert.deepEqual(original,unchanged);
assert.deepEqual(cityOff['1'],diagnostic['1']);
assert.equal(cityOff['36'].length,diagnostic['36'].length);
const city=cityOff['36'].find(v=>v['1']==='calendar_city_prefix');
assert.equal(city['0'],original['36'].find(v=>v['1']==='calendar_city_prefix')['0']);
const cal=cityOff['1'].find(n=>n.s==='CALENDAR');
assert.deepEqual(cal['1'].find(n=>n.s==='Calendar Location').o1,{'0':city['0'],'1':1,'2':''});
assert.deepEqual(cal['1'].find(n=>n.s==='Calendar Location · Pending Lookup').o1,{'0':city['0'],'1':0,'2':''});
assert.notEqual(literal[0]['25'],''); // Do not activate the native-city fallback.
assert(!JSON.stringify(cityOff['36']).includes('reverse-geocode-client'));
assert(!cityOff['36'].some(v=>v['3']['66']?.some(s=>s['6']==='Async + No main()')));
const jsonFields=w=>w['36'].flatMap(v=>v['3']['66']||[]).filter(s=>s['5']==='JSON Endpoint');
assert.equal(jsonFields(cityOff).length,39);
assert.deepEqual(jsonFields(cityOff),jsonFields(diagnostic));
for(const name of ['Latitude','Longitude','map_latitude_max5','map_longitude_max5','calendar_native_city']){
  assert.deepEqual(cityOff['36'].find(v=>v['1']===name),diagnostic['36'].find(v=>v['1']===name));
}
const badCity=structuredClone(original);
badCity['36'].find(v=>v['1']==='calendar_city_prefix')['3']['66']=literal;
assert.throws(()=>withoutHomeMapAndCityLookup(badCity),/unexpected_template/);
console.log('Passed: City-Off differs from Map-Off only in one source plus diagnostic metadata; unchanged layers, taps, GPS inputs and 39 native JSON bindings; no custom asynchronous geocoder remains; fallback visibility stays on the nonempty-city path.');

const nativeOff=withoutHomeNativeData(original);
const fieldNames=['Events Summary · 3','Sunrise Time','Sunset Time','Weather Temp','Weather Status','Weather High','Weather Low','Distance Value','Calories Value'];
const variableNames=['wx_status','wx_wind_speed','steps_today'];
const restored=structuredClone(nativeOff);
for(const name of variableNames){
  const v=restored['36'].find(v=>v['1']===name);
  assert.equal(v['3']['66'][0]['5'],'Custom Text');
  v['3']['66']=structuredClone(cityOff['36'].find(v=>v['1']===name)['3']['66']);
}
const restoredHome=restored['1'].find(n=>n.s==='HOME'),baselineHome=cityOff['1'].find(n=>n.s==='HOME');
for(const name of fieldNames){
  const n=restoredHome['1'].find(n=>n.s===name);
  assert.equal(n['66'][0]['5'],'Custom Text');
  n['66']=structuredClone(baselineHome['1'].find(n=>n.s===name)['66']);
}
restored['3']=cityOff['3'];restored['4']=cityOff['4'];
assert.deepEqual(restored,cityOff); // No changes outside the 12 sources + metadata.
assert.deepEqual(original,unchanged);
assert.deepEqual(jsonFields(nativeOff),jsonFields(cityOff));
const nativeHome=nativeOff['1'].find(n=>n.s==='HOME');
assert.equal(count(nativeOff['1']),count(cityOff['1']));
assert.deepEqual(nativeHome['1'].find(n=>n.s==='Hero Time'),baselineHome['1'].find(n=>n.s==='Hero Time'));
assert(!nativeHome['1'].flatMap(n=>n['66']||[]).some(s=>['Weather (Now)','Pedometer','Health (Daily)','Sun And Moon','Agenda (Today)'].includes(s['5'])));
assert.deepEqual(nativeOff['1'].filter(n=>n.s!=='HOME'),cityOff['1'].filter(n=>n.s!=='HOME'));
for(const name of variableNames){
  const id=nativeOff['36'].find(v=>v['1']===name)['0'];
  const unrelated=JSON.stringify(nativeOff['1'].filter(n=>n.s!=='HOME'));
  assert(!unrelated.includes(id));assert(!unrelated.includes('${widgy.'+name+'}'));
}
const missingSource=structuredClone(original);
missingSource['1'].find(n=>n.s==='HOME')['1'].find(n=>n.s==='Calories Value')['66']=literal;
assert.throws(()=>withoutHomeNativeData(missingSource),/unexpected_template/);
console.log('Passed: Home native-data diagnostic changes exactly nine text sources and three variables beyond City-Off; every node, condition, action, clock, Calendar source and other tab preserved.');

const clockOff=withoutHomeLiveClock(original),expectedClock=structuredClone(nativeOff);
expectedClock['1'].find(n=>n.s==='HOME')['1'].find(n=>n.s==='Hero Time')['66']=[{'5':'Custom Text','6':'Text','25':'12:34'}];
expectedClock['3']=clockOff['3'];expectedClock['4']=clockOff['4'];assert.deepEqual(clockOff,expectedClock);
const minimal=withMinimalHome(original),expectedMinimal=structuredClone(clockOff);
const keep=n=>n.z==='11'||/^(HOME|CALENDAR|WEATHER|FITNESS) Nav /.test(n.s)||n.s==='Full Graphite Background';
expectedMinimal['1'].find(n=>n.s==='HOME')['1']=expectedMinimal['1'].find(n=>n.s==='HOME')['1'].filter(keep);
expectedMinimal['3']=minimal['3'];expectedMinimal['4']=minimal['4'];assert.deepEqual(minimal,expectedMinimal);
assert.equal(minimal['1'].find(n=>n.s==='HOME')['1'].length,15);
assert.equal(count(clockOff['1'])-count(minimal['1']),373);
const walk=function*(ns){for(const n of ns){yield n;if(n.z==='13')yield*walk(n['1']);}};
const ids=new Set([...walk(minimal['1'])].map(n=>n.d0));
for(const n of walk(minimal['1']))if(n['1a'])for(const id of n['1a'].slice(7).split(/[-,]/).map(Number))assert(ids.has(id),'Dangling tap target '+id);
assert.deepEqual(original,unchanged);
console.log('Passed: Clock-Off changes only one source beyond Native-Data-Off; Minimal removes exactly 373 Home nodes and keeps all variables, other tabs and valid navigation.');

const minimalClock=withMinimalHomeLiveClock(original),withoutAddedClock=structuredClone(minimalClock);
const approvedClock=original['1'].find(n=>n.s==='HOME')['1'].find(n=>n.s==='Hero Time');
const minimalClockHome=minimalClock['1'].find(n=>n.s==='HOME');
assert.deepEqual(minimalClockHome['1'].find(n=>n.s==='Hero Time'),approvedClock);
assert.equal(minimalClockHome['1'].length,16);
assert.equal(count(minimalClock['1'])-count(minimal['1']),1);
withoutAddedClock['1'].find(n=>n.s==='HOME')['1']=withoutAddedClock['1'].find(n=>n.s==='HOME')['1'].filter(n=>n.d0!==approvedClock.d0);
withoutAddedClock['3']=minimal['3'];withoutAddedClock['4']=minimal['4'];
assert.deepEqual(withoutAddedClock,minimal); // Every source, variable, other tab and retained layer matches fast B.
assert.deepEqual(original,unchanged);
const clockOrder=new Set(minimalClockHome['1'].map(n=>n.d0));
assert.deepEqual(minimalClockHome['1'].map(n=>n.d0),original['1'].find(n=>n.s==='HOME')['1'].filter(n=>clockOrder.has(n.d0)).map(n=>n.d0));
const wrongClock=structuredClone(original);
wrongClock['1'].find(n=>n.s==='HOME')['1'].find(n=>n.s==='Hero Time')['66'][0]['6']='HH:mm';
assert.throws(()=>withMinimalHomeLiveClock(wrongClock),/unexpected_template/);
console.log('Passed: Minimal Live Clock differs from fast Minimal by exactly one unchanged approved live-clock layer plus metadata, with identical sources/variables/other tabs and original layer order.');

const minimalEvents=withMinimalHomeEvents(original),withoutEvents=structuredClone(minimalEvents);
const eventIDs=new Set([6111,80206,6113,6112]);
const eventsHome=minimalEvents['1'].find(n=>n.s==='HOME');
assert.equal(eventsHome['1'].length,20);
assert.equal(count(minimalEvents['1'])-count(minimalClock['1']),4);
for(const id of eventIDs)assert.deepEqual(eventsHome['1'].find(n=>n.d0===id),original['1'].find(n=>n.s==='HOME')['1'].find(n=>n.d0===id));
withoutEvents['1'].find(n=>n.s==='HOME')['1']=withoutEvents['1'].find(n=>n.s==='HOME')['1'].filter(n=>!eventIDs.has(n.d0));
withoutEvents['3']=minimalClock['3'];withoutEvents['4']=minimalClock['4'];
assert.deepEqual(withoutEvents,minimalClock);
assert.deepEqual(original,unchanged);
const eventsOrder=new Set(eventsHome['1'].map(n=>n.d0));
assert.deepEqual(eventsHome['1'].map(n=>n.d0),original['1'].find(n=>n.s==='HOME')['1'].filter(n=>eventsOrder.has(n.d0)).map(n=>n.d0));
assert(!eventsHome['1'].flatMap(n=>n['66']||[]).some(s=>s['5']==='Agenda (Today)'));
const badEvent=structuredClone(original);
badEvent['1'].find(n=>n.s==='HOME')['1'].find(n=>n.d0===6113)['66'][0]['25']='Example';
assert.throws(()=>withMinimalHomeEvents(badEvent),/unexpected_template/);
console.log('Passed: Minimal Events adds exactly four original Home calendar text layers to the fast clock control; all variables/sources/other tabs unchanged, no native reminder source restored, correct layer order.');

const normalUnchanged=structuredClone(normal);
const progressOff=withoutHomeProgressArtwork(normal),expectedProgress=structuredClone(normal);
expectedProgress['1'].find(n=>n.s==='HOME')['1']=expectedProgress['1'].find(n=>n.s==='HOME')['1']
  .filter(n=>!/^Steps Goal Ring · \d+%$/.test(n.s)&&!/^Day Progress Fill · \d+%$/.test(n.s));
expectedProgress['3']=progressOff['3'];expectedProgress['4']=progressOff['4'];
assert.deepEqual(progressOff,expectedProgress);
assert.deepEqual(normal,normalUnchanged);
assert.equal(count(normal['1'])-count(progressOff['1']),200);
assert.equal(count(progressOff['1'].find(n=>n.s==='HOME')['1']),189);
assert.deepEqual(progressOff['36'],normal['36']);
assert.throws(()=>withoutHomeProgressArtwork(original),/unexpected_template/); // Reject legacy equality-ring baseline.
const duplicate=structuredClone(normal),duplicateHome=duplicate['1'].find(n=>n.s==='HOME');
duplicateHome['1'].find(n=>n.s==='Day Progress Fill · 2%').s='Day Progress Fill · 1%';
assert.throws(()=>withoutHomeProgressArtwork(duplicate),/unexpected_template/);
const remainingIDs=new Set([...walk(progressOff['1'])].map(n=>n.d0));
for(const n of walk(progressOff['1']))if(n['1a'])for(const id of n['1a'].slice(7).split(/[-,]/).map(Number))assert(remainingIDs.has(id),'Dangling tap target '+id);
console.log('Passed: Progress-Off removes exactly 200 drawing layers from full regular Home (389 to 189); all data sources, map, original clock, other layers and valid navigation retained.');

// Test what each actual copy-page URL exports, including clipboard handling.
const weatherArtOff=withoutHomeWeatherArtwork(normal),expectedWeather=structuredClone(progressOff);
const weatherIDs=new Set([80000,80001,80002,80003,80004,80005,80006,80007,80008,80009,80010,80070,80083,80096]);
expectedWeather['1'].find(n=>n.s==='HOME')['1']=expectedWeather['1'].find(n=>n.s==='HOME')['1'].filter(n=>!weatherIDs.has(n.d0));
expectedWeather['3']=weatherArtOff['3'];expectedWeather['4']=weatherArtOff['4'];
assert.deepEqual(weatherArtOff,expectedWeather);
assert.deepEqual(normal,normalUnchanged);
assert.equal(count(progressOff['1'])-count(weatherArtOff['1']),137);
assert.equal(count(weatherArtOff['1'].find(n=>n.s==='HOME')['1']),52);
const weatherRemainingIDs=new Set([...walk(weatherArtOff['1'])].map(n=>n.d0));
for(const n of walk(weatherArtOff['1']))if(n['1a'])for(const id of n['1a'].slice(7).split(/[-,]/).map(Number))assert(weatherRemainingIDs.has(id),'Dangling tap target '+id);
const badWeather=structuredClone(normal);
badWeather['1'].find(n=>n.s==='HOME')['1'].find(n=>n.d0===80000).s='Unknown';
assert.throws(()=>withoutHomeWeatherArtwork(badWeather),/unexpected_template/);
console.log('Passed: Weather-Art-Off removes only 14 weather-icon alternatives (137 nodes) beyond Progress-Off; all actual data, approved clock, map, weather text, other artwork and navigation unchanged.');

const html=readFileSync(new URL('./widgy-home-map-diagnostic.html',import.meta.url),'utf8');
assert(html.includes('./widgy-home-map-diagnostic.js?v=minimal-events-1'));
assert(html.includes('?home=minimal&amp;v=minimal-events-1'));
const source=readFileSync(new URL('./widgy-home-map-diagnostic.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
const elementIDs=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
for(const [query,expectedExport] of [
  ['',diagnostic],['?city=off',cityOff],['?home=data-off',nativeOff],
  ['?home=clock-off',clockOff],['?home=minimal',minimal],['?home=progress-off',progressOff],
  ['?home=weather-art-off',weatherArtOff],['?home=minimal-clock',minimalClock],
  ['?home=minimal-events',minimalEvents]
]){
  const elements=Object.fromEntries(elementIDs.map(id=>[id,{textContent:'',hidden:true,classList:{toggle(){}},handlers:{},addEventListener(type,fn){this.handlers[type]=fn;}}]));
  let payload='',copied='';
  const context=vm.createContext({
    document:{getElementById:id=>{assert(elements[id],id);return elements[id];}},
    window:{location:{search:query},addEventListener(){}},URLSearchParams,
    URL:{createObjectURL:b=>{payload=b.parts[0];return 'blob:synthetic';},revokeObjectURL(){}},
    Blob:class{constructor(parts){this.parts=parts;}},
    navigator:{clipboard:{writeText:async value=>{copied=value;}}},
    prepareWidget:async()=>({payload:JSON.stringify(normal)}),
    perf5DiagnosticBaseline,withoutHomeMap,withoutHomeMapAndCityLookup,withoutHomeNativeData,
    withoutHomeLiveClock,withMinimalHome,withMinimalHomeLiveClock,withMinimalHomeEvents,withoutHomeProgressArtwork,withoutHomeWeatherArtwork
  });
  await new vm.Script(source).runInContext(context);
  assert.deepEqual(JSON.parse(payload),expectedExport,query);
  assert.equal(elements.copy.disabled,false);
  await elements.copy.handlers.click();
  assert.equal(copied,payload);
  if(query==='?home=progress-off'){
    assert.equal(elements.download.download,'Widgy_Home_Progress_Off_Diagnostic.json');
    assert(elements.explanation.textContent.includes('200'));
    assert(elements.comparison.textContent.includes('השעון הישן'));
  }
  if(query==='?home=weather-art-off'){
    assert.equal(elements.download.download,'Widgy_Home_Weather_Art_Off_Diagnostic.json');
    assert(elements.comparison.textContent.includes('Progress-Off'));
    assert.equal(elements['next-test'].hidden,true);
  }
  assert.equal(elements['baseline-test'].hidden,!['?home=minimal-clock','?home=minimal-events'].includes(query));
  if(query==='?home=minimal-clock'){
    assert.equal(elements.download.download,'Widgy_Home_Minimal_Live_Clock_Diagnostic.json');
    assert(elements.comparison.textContent.includes('בדיקה ב׳ המקורית'));
    assert.equal(elements['next-test'].hidden,true);
  }
  if(query==='?home=minimal-events'){
    assert.equal(elements.download.download,'Widgy_Home_Minimal_Events_Diagnostic.json');
    assert.equal(elements['baseline-link'].href,'./widgy-home-map-diagnostic.html?home=minimal-clock&v=minimal-events-1');
    assert.equal(elements['next-test'].hidden,true);
  }
}
console.log('Passed: all nine diagnostic URLs export and copy the intended comparison; add-back pages link to their respective unchanged controls.');
