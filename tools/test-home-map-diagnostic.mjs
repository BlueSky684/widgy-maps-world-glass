import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {loadHomeStaticMapDataURL} from './widget-home-static-map-data.js';
import {parseMapRequest} from '../lib/native-map-request.js';
import {resolveLocation} from '../lib/home-map-v122.js';
import {loadHomeBackdropDataURL} from './widget-home-backdrop-data.js';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {personalizedWidget} from './calendar-connect-widget.js';
import {perf5DiagnosticBaseline,withoutHomeMap,withoutHomeMapAndCityLookup,withoutHomeNativeData,withoutHomeLiveClock,withMinimalHome,withMinimalHomeLiveClock,withMinimalHomeEvents,withMinimalHomeTimeText,withMinimalHomeNativeData,withMinimalHomeBackdrop,withMinimalHomeEmbeddedBackdrop,withCompleteHomeArtwork,withCompleteHomeMap,withCompleteHomeStaticMap,withCompleteHomeStaticMap1653,withCompleteHomeEmbeddedStaticMap,withCompleteHomeMapWithoutCityFetch,withCompleteHomeSynchronousMap,withCompleteHomeStableMapURL,withCompleteHomeStableNativeCity,withCompleteHomeFixedLocationMap,withCompleteHomeDirectFixedMap,withCompleteHomeDirectImageURL,withCompleteHomeUnusedGPSOff,withCompleteHomeCDNFixedMap,withCompleteHomeDirectLiveMap,withCompleteHomeNativeLocationMap,withHomeMapBindingProbe,withoutHomeProgressArtwork,withoutHomeWeatherArtwork} from './widget-home-map-diagnostic.js';
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

const minimalTime=withMinimalHomeTimeText(original),withoutTimeText=structuredClone(minimalTime);
const isTimeText=n=>n.z==='1' && /^(Greeting |Header |Day Progress )/.test(n.s);
const originalTimeNodes=original['1'].find(n=>n.s==='HOME')['1'].filter(isTimeText);
const timeHome=minimalTime['1'].find(n=>n.s==='HOME');
assert.equal(originalTimeNodes.length,13);
assert.equal(timeHome['1'].length,33);
assert.equal(count(minimalTime['1'])-count(minimalEvents['1']),13);
assert.deepEqual(timeHome['1'].filter(isTimeText),originalTimeNodes);
withoutTimeText['1'].find(n=>n.s==='HOME')['1']=withoutTimeText['1'].find(n=>n.s==='HOME')['1'].filter(n=>!isTimeText(n));
withoutTimeText['3']=minimalEvents['3'];withoutTimeText['4']=minimalEvents['4'];
assert.deepEqual(withoutTimeText,minimalEvents);
assert.deepEqual(original,unchanged);
const timeOrder=new Set(timeHome['1'].map(n=>n.d0));
assert.deepEqual(timeHome['1'].map(n=>n.d0),original['1'].find(n=>n.s==='HOME')['1'].filter(n=>timeOrder.has(n.d0)).map(n=>n.d0));
assert(!timeHome['1'].some(n=>n.s.startsWith('Day Progress Fill')));
const missingDate=structuredClone(original);
missingDate['1'].find(n=>n.s==='HOME')['1']=missingDate['1'].find(n=>n.s==='HOME')['1'].filter(n=>n.d0!==80312);
assert.throws(()=>withMinimalHomeTimeText(missingDate),/unexpected_template/);
console.log('Passed: Minimal Time Text adds exactly 13 original greeting/date/day-progress text layers to Minimal Events; scripts, conditions, approved date-weight layers and all other content preserved; no graph fills added.');

const minimalNative=withMinimalHomeNativeData(original),withoutNative=structuredClone(minimalNative);
const nativeAddedNames=new Set([...fieldNames,'Events Summary · 4','Steps Value','Steps Label']);
const nativeAddedHome=minimalNative['1'].find(n=>n.s==='HOME');
assert.equal(nativeAddedHome['1'].length,45);
assert.equal(count(minimalNative['1'])-count(minimalTime['1']),12);
assert.deepEqual(nativeAddedHome['1'].filter(n=>nativeAddedNames.has(n.s)),baselineHome['1'].filter(n=>nativeAddedNames.has(n.s)));
withoutNative['1'].find(n=>n.s==='HOME')['1']=withoutNative['1'].find(n=>n.s==='HOME')['1'].filter(n=>!nativeAddedNames.has(n.s));
for(const name of variableNames){
  assert.deepEqual(minimalNative['36'].find(v=>v['1']===name),original['36'].find(v=>v['1']===name));
  withoutNative['36'].find(v=>v['1']===name)['3']['66']=structuredClone(minimalTime['36'].find(v=>v['1']===name)['3']['66']);
}
withoutNative['3']=minimalTime['3'];withoutNative['4']=minimalTime['4'];
assert.deepEqual(withoutNative,minimalTime); // No other source, retained layer or tab changes.
assert.deepEqual(original,unchanged);
assert.deepEqual(jsonFields(minimalNative),jsonFields(minimalTime));
const nativeOrder=new Set(nativeAddedHome['1'].map(n=>n.d0));
assert.deepEqual(nativeAddedHome['1'].map(n=>n.d0),baselineHome['1'].filter(n=>nativeOrder.has(n.d0)).map(n=>n.d0));
const nativeIDs=new Set([...walk(minimalNative['1'])].map(n=>n.d0));
for(const n of walk(minimalNative['1']))if(n['1a'])for(const id of n['1a'].slice(7).split(/[-,]/).map(Number))assert(nativeIDs.has(id),'Dangling tap target '+id);
const missingSteps=structuredClone(original);
missingSteps['1'].find(n=>n.s==='HOME')['1']=missingSteps['1'].find(n=>n.s==='HOME')['1'].filter(n=>n.s!=='Steps Value');
assert.throws(()=>withMinimalHomeNativeData(missingSteps),/unexpected_template/);
console.log('Passed: Minimal Native Data adds exactly 12 original text layers and restores three real shared sources; original styles/order, other sources, JSON bindings and navigation preserved.');

const minimalBackdrop=withMinimalHomeBackdrop(original),withoutBackdrop=structuredClone(minimalBackdrop);
const backdropHome=minimalBackdrop['1'].find(n=>n.s==='HOME');
const approvedBackdrop=baselineHome['1'].find(n=>n.s==='Approved Glass · Chrome and Frames');
assert.equal(backdropHome['1'].length,46);
assert.equal(count(minimalBackdrop['1'])-count(minimalNative['1']),1);
assert.deepEqual(backdropHome['1'].find(n=>n.d0===approvedBackdrop.d0),approvedBackdrop);
withoutBackdrop['1'].find(n=>n.s==='HOME')['1']=withoutBackdrop['1'].find(n=>n.s==='HOME')['1'].filter(n=>n.d0!==approvedBackdrop.d0);
withoutBackdrop['3']=minimalNative['3'];withoutBackdrop['4']=minimalNative['4'];
assert.deepEqual(withoutBackdrop,minimalNative); // All variables, sources, tabs and retained layers identical.
assert.deepEqual(original,unchanged);
const backdropOrder=new Set(backdropHome['1'].map(n=>n.d0));
assert.deepEqual(backdropHome['1'].map(n=>n.d0),baselineHome['1'].filter(n=>backdropOrder.has(n.d0)).map(n=>n.d0));
const wrongBackdrop=structuredClone(original);
wrongBackdrop['1'].find(n=>n.s==='HOME')['1'].find(n=>n.d0===approvedBackdrop.d0)['2']='https://example.test/other.png';
assert.throws(()=>withMinimalHomeBackdrop(wrongBackdrop),/unexpected_template/);
console.log('Passed: Minimal Backdrop adds only the exact approved glass/frames image; original order, every source and variable, other tabs and prior live-text control preserved.');

const approvedPNG=readFileSync(new URL('../assets/home-glass/Home_Glass_Chrome_C8.png',import.meta.url));
const backdropDataURL=await loadHomeBackdropDataURL(async(url,options)=>{
  assert(url.pathname.endsWith('/assets/home-glass/Home_Glass_Chrome_C8.png'));
  assert.equal(options.credentials,'omit');
  return new Response(approvedPNG);
});
assert.deepEqual(Buffer.from(backdropDataURL.split(',')[1],'base64'),approvedPNG);
const alteredPNG=Buffer.from(approvedPNG);alteredPNG[100]^=1;
await assert.rejects(()=>loadHomeBackdropDataURL(async()=>new Response(alteredPNG)),/backdrop_image_failed/);
await assert.rejects(()=>loadHomeBackdropDataURL(async()=>new Response('',{status:404})),/backdrop_image_failed/);
await assert.rejects(()=>loadHomeBackdropDataURL(async()=>{throw Error('offline');}),/backdrop_image_failed/);
const embeddedBackdrop=withMinimalHomeEmbeddedBackdrop(original,backdropDataURL);
const expectedEmbedded=structuredClone(minimalBackdrop);
expectedEmbedded['1'].find(n=>n.s==='HOME')['1'].find(n=>n.d0===approvedBackdrop.d0)['2']=backdropDataURL;
expectedEmbedded['3']=embeddedBackdrop['3'];expectedEmbedded['4']=embeddedBackdrop['4'];
assert.deepEqual(embeddedBackdrop,expectedEmbedded); // One source string only; no other layer or script changed.
assert.deepEqual(original,unchanged);
assert.throws(()=>withMinimalHomeEmbeddedBackdrop(original,'data:image/png;base64,wrong'),/backdrop_image_failed/);
console.log('Passed: embedded backdrop contains byte-identical approved PNG; integrity/network failures rejected; only one source string differs, with unchanged provider, rendering options, variables and all other content. Phone image compatibility remains unverified.');

const fullArtwork=withCompleteHomeArtwork(normal,backdropDataURL);
const fullArtworkHome=fullArtwork['1'].find(n=>n.s==='HOME');
const approvedFullHome=structuredClone(normal['1'].find(n=>n.s==='HOME'));
approvedFullHome['1']=approvedFullHome['1'].filter(n=>n.s!=='Home Hero World Map');
approvedFullHome['1'].find(n=>n.d0===approvedBackdrop.d0)['2']=backdropDataURL;
assert.deepEqual(fullArtworkHome,approvedFullHome); // Complete approved Home, except map absence and backdrop transport.
assert.equal(count(fullArtworkHome['1']),388);
assert.equal(count(fullArtwork['1'])-count(embeddedBackdrop['1']),342);
const beforeGraphics=new Set(embeddedBackdrop['1'].find(n=>n.s==='HOME')['1'].map(n=>n.d0));
const withoutAddedGraphics=structuredClone(fullArtwork);
withoutAddedGraphics['1'].find(n=>n.s==='HOME')['1']=withoutAddedGraphics['1'].find(n=>n.s==='HOME')['1'].filter(n=>beforeGraphics.has(n.d0));
withoutAddedGraphics['3']=embeddedBackdrop['3'];withoutAddedGraphics['4']=embeddedBackdrop['4'];
assert.deepEqual(withoutAddedGraphics,embeddedBackdrop); // No changes to prior layers, variables, sources or other tabs.
assert.throws(()=>withCompleteHomeArtwork(original,backdropDataURL),/unexpected_template/); // Reject the legacy broken ring.
assert.deepEqual(normal,personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic','https://example.test/api/calendar-widget?token=synthetic'));
const fullIDs=new Set([...walk(fullArtwork['1'])].map(n=>n.d0));
for(const n of walk(fullArtwork['1']))if(n['1a'])for(const id of n['1a'].slice(7).split(/[-,]/).map(Number))assert(fullIDs.has(id),'Dangling tap target '+id);
console.log('Passed: Complete Artwork restores exactly 342 original graphic nodes; full approved Home except map/backdrop source, cumulative ring correct, prior content and sources unchanged, valid navigation.');

const mapAddback=withCompleteHomeMap(normal,backdropDataURL);
const expectedMapAddback=structuredClone(normal);
expectedMapAddback['1'].find(n=>n.s==='HOME')['1'].find(n=>n.d0===approvedBackdrop.d0)['2']=backdropDataURL;
expectedMapAddback['36'].find(v=>v['1']==='calendar_city_prefix')['3']['66']=structuredClone(fullArtwork['36'].find(v=>v['1']==='calendar_city_prefix')['3']['66']);
expectedMapAddback['3']=mapAddback['3'];expectedMapAddback['4']=mapAddback['4'];
assert.deepEqual(mapAddback,expectedMapAddback); // Full normal, except embedded backdrop and frozen Calendar city.
const mapRemoved=structuredClone(mapAddback);
mapRemoved['1'].find(n=>n.s==='HOME')['1']=mapRemoved['1'].find(n=>n.s==='HOME')['1'].filter(n=>n.s!=='Home Hero World Map');
mapRemoved['36']=mapRemoved['36'].filter(v=>v['1']!=='map_request');
mapRemoved['3']=fullArtwork['3'];mapRemoved['4']=fullArtwork['4'];
assert.deepEqual(mapRemoved,fullArtwork);
assert.equal(count(mapAddback['1'])-count(fullArtwork['1']),1);
assert.equal(mapAddback['36'].length,81);
assert.deepEqual(normal,personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic','https://example.test/api/calendar-widget?token=synthetic'));
const badMap=structuredClone(normal);
badMap['36'].find(v=>v['1']==='map_request')['3']['66'][0]['6']='Text';
assert.throws(()=>withCompleteHomeMap(badMap,backdropDataURL),/unexpected_template/);
console.log('Passed: Map Add-Back restores only the original map image/variable/script in original order; all else matches Complete Artwork, including frozen independent Calendar city. No live geocoder or private endpoint invoked.');

const staticMap=withCompleteHomeStaticMap(normal,backdropDataURL),staticExpected=structuredClone(mapAddback);
const staticURL='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/assets/diagnostics/Home_Map_Static_3306x1558.png';
staticExpected['36'].find(v=>v['1']==='map_request')['3']['66']=[{'5':'Custom Text','6':'Text','25':staticURL}];
staticExpected['3']=staticMap['3'];staticExpected['4']=staticMap['4'];
assert.deepEqual(staticMap,staticExpected); // Exactly one variable source, no image-layer or frame changes.
assert.deepEqual(staticMap['1'],mapAddback['1']);
assert.equal(staticMap['36'].length,81);
assert(!staticMap['36'].flatMap(v=>v['3']['66']||[]).some(s=>s['6']==='Async + No main()'));
assert(!JSON.stringify(staticMap['36']).includes('reverse-geocode-client'));
assert.deepEqual(jsonFields(staticMap),jsonFields(mapAddback));
assert.deepEqual(normal,personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic','https://example.test/api/calendar-widget?token=synthetic'));
console.log('Passed: Static Map changes exactly one source beyond Map Add-Back; all 81 variable identities, map layer, frames, other sources, tabs and taps unchanged, custom async geocoders absent.');

const staticPNG=readFileSync(new URL('../assets/diagnostics/Home_Map_Static_3306x1558.png',import.meta.url));
const smallStaticPNG=readFileSync(new URL('../assets/diagnostics/Home_Map_Static_1653x779.png',import.meta.url));
assert.equal(createHash('sha256').update(staticPNG).digest('hex'),'c4ccdacd84dec137bd46c6061a4f5b69ed4d210e5cec0bc5e2d08865ffc17df9');
const [fullMeta,smallMeta]=await Promise.all([sharp(staticPNG).metadata(),sharp(smallStaticPNG).metadata()]);
assert.equal(smallMeta.width,1653);assert.equal(smallMeta.height,779);
assert.equal(smallMeta.format,'png');assert.equal(smallMeta.channels,4);
assert.equal(fullMeta.width*fullMeta.height,4*smallMeta.width*smallMeta.height);
assert.deepEqual(smallMeta.icc,fullMeta.icc);
assert(smallStaticPNG.length<staticPNG.length);
const staticMap1653=withCompleteHomeStaticMap1653(normal,backdropDataURL);
const smallStaticExpected=structuredClone(staticMap);
smallStaticExpected['36'].find(v=>v['1']==='map_request')['3']['66'][0]['25']=staticURL.replace('3306x1558','1653x779');
smallStaticExpected['3']=staticMap1653['3'];smallStaticExpected['4']=staticMap1653['4'];
assert.deepEqual(staticMap1653,smallStaticExpected);
assert.deepEqual(staticMap1653['1'],staticMap['1']);
assert.equal(staticMap1653['36'].length,81);
assert.deepEqual(normal,personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic','https://example.test/api/calendar-widget?token=synthetic'));
console.log('Passed: separate 1653x779 resolution trial changes only map URL and metadata; original full PNG hash, ICC, layer geometry, tabs, data and normal export preserved.');
const staticMapDataURL=await loadHomeStaticMapDataURL(async(url,options)=>{
  assert(url.pathname.endsWith('/assets/diagnostics/Home_Map_Static_3306x1558.png'));
  assert.equal(options.credentials,'omit');assert.equal(options.cache,'force-cache');
  return new Response(staticPNG);
});
assert.equal(staticMapDataURL.length,5433978);
assert.deepEqual(Buffer.from(staticMapDataURL.split(',')[1],'base64'),staticPNG);
const corruptStaticPNG=Buffer.from(staticPNG);corruptStaticPNG[100]^=1;
await assert.rejects(()=>loadHomeStaticMapDataURL(async()=>new Response(corruptStaticPNG)),/static_map_image_failed/);
await assert.rejects(()=>loadHomeStaticMapDataURL(async()=>new Response(staticPNG.subarray(0,100))),/static_map_image_failed/);
await assert.rejects(()=>loadHomeStaticMapDataURL(async()=>new Response('',{status:404})),/static_map_image_failed/);
await assert.rejects(()=>loadHomeStaticMapDataURL(async()=>{throw Error('offline');}),/static_map_image_failed/);
const embeddedStaticMap=withCompleteHomeEmbeddedStaticMap(normal,backdropDataURL,staticMapDataURL);
const embeddedStaticExpected=structuredClone(staticMap);
embeddedStaticExpected['36'].find(v=>v['1']==='map_request')['3']['66'][0]['25']=staticMapDataURL;
embeddedStaticExpected['3']=embeddedStaticMap['3'];embeddedStaticExpected['4']=embeddedStaticMap['4'];
assert.deepEqual(embeddedStaticMap,embeddedStaticExpected); // Exactly one source string plus metadata.
assert.deepEqual(embeddedStaticMap['1'],staticMap['1']);
assert.equal(embeddedStaticMap['36'].length,81);
for(const value of [undefined,'data:image/png;base64,wrong',staticURL]){
  assert.throws(()=>withCompleteHomeEmbeddedStaticMap(normal,backdropDataURL,value),/static_map_image_failed/);
}
assert.deepEqual(normal,personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic','https://example.test/api/calendar-widget?token=synthetic'));
console.log('Passed: Embedded Static Map carries the exact 4,075,465 PNG bytes; digest/size and HTTP errors reject; only one source string differs from Static Map, with identical design/binding and immutable original. Large data-URL compatibility and speed remain device checks.');

const mapNoCity=withCompleteHomeMapWithoutCityFetch(normal,backdropDataURL);
const noCitySource=mapNoCity['36'].find(v=>v['1']==='map_request')['3']['66'][0];
const noCityExpected=structuredClone(mapAddback);
noCityExpected['36'].find(v=>v['1']==='map_request')['3']['66'][0]['10']=noCitySource['10'];
noCityExpected['3']=mapNoCity['3'];noCityExpected['4']=mapNoCity['4'];
assert.deepEqual(mapNoCity,noCityExpected); // Only script body changed; original provider and URL/image fields stay.
assert.equal(noCitySource['6'],'Async + No main()');
assert(!noCitySource['10'].includes('fetch('));
assert(!JSON.stringify(mapNoCity['36']).includes('reverse-geocode-client'));
const fakeNow=1791096000123;
for(const [lat,lon,expectedLat,expectedLon] of [['0','0','0','0'],['42,125','−8.5','42.125','-8.5'],['','0','','0'],['999','bad','','']]){
  let fetches=0;const outputs=[];
  const script=noCitySource['10'].replaceAll('${widgy.map_latitude_max5}',lat).replaceAll('${widgy.map_longitude_max5}',lon)
    .replaceAll('${widgy.Latitude}','1').replaceAll('${widgy.Longitude}','2');
  vm.runInNewContext(script,{Date:class extends Date{static now(){return fakeNow;}},
    fetch(){fetches++;throw Error('No network allowed');},sendToWidgy:url=>outputs.push(url)},{timeout:1000});
  assert.equal(fetches,0);assert.equal(outputs.length,1);
  const url=new URL(outputs[0]);
  assert.equal(url.origin,'https://example.test');assert.equal(url.pathname,'/api/night-map');
  assert.equal(url.searchParams.get('lat'),expectedLat);assert.equal(url.searchParams.get('lon'),expectedLon);
  assert.equal(url.searchParams.get('width'),'3306');assert.equal(url.searchParams.get('presentation'),'glass');
  assert.equal(url.searchParams.get('atlas'),'r6');assert.equal(url.searchParams.get('reuse'),'60');
  assert.equal(url.searchParams.get('t'),String(Math.floor(fakeNow/60000)*60000));
  assert(!url.searchParams.has('city'));
}
assert.deepEqual(normal,personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic','https://example.test/api/calendar-widget?token=synthetic'));
const changedCityScript=structuredClone(normal);
changedCityScript['36'].find(v=>v['1']==='map_request')['3']['66'][0]['10']=noCitySource['10'];
assert.throws(()=>withCompleteHomeMapWithoutCityFetch(changedCityScript,backdropDataURL),/unexpected_template/);
console.log('Passed: Live Map No City Fetch changes only the map script; synthetic VM completes immediately once with zero network calls, preserved GPS normalization/live endpoint/minute cache, including unavailable coordinates.');

const synchronousMap=withCompleteHomeSynchronousMap(normal,backdropDataURL);
const synchronousSource=synchronousMap['36'].find(v=>v['1']==='map_request')['3']['66'][0];
const synchronousExpected=structuredClone(mapNoCity);
const expectedSyncSource=synchronousExpected['36'].find(v=>v['1']==='map_request')['3']['66'][0];
expectedSyncSource['6']='Script';expectedSyncSource['10']=synchronousSource['10'];
synchronousExpected['3']=synchronousMap['3'];synchronousExpected['4']=synchronousMap['4'];
assert.deepEqual(synchronousMap,synchronousExpected); // Only runtime mode and completion body change.
assert.equal(synchronousSource['5'],'Javascript');
assert.equal(synchronousSource['6'],'Script');
assert(!synchronousSource['10'].includes('sendToWidgy'));
assert(!synchronousSource['10'].includes('fetch('));
const substituteCoordinates=(script,lat,lon)=>script.replaceAll('${widgy.map_latitude_max5}',lat)
  .replaceAll('${widgy.map_longitude_max5}',lon).replaceAll('${widgy.Latitude}','1').replaceAll('${widgy.Longitude}','2');
for(const instant of [fakeNow,Math.floor(fakeNow/60000)*60000+59999,Math.floor(fakeNow/60000)*60000+60000]){
  for(const [lat,lon] of [['0','0'],['42.12345','-8.54321'],['42,125','−8.5'],['','0'],['999','bad'],['90','-180']]){
    const asyncResults=[];
    const clock=class extends Date{static now(){return instant;}};
    const noNetwork=()=>{throw Error('No network allowed');};
    vm.runInNewContext(substituteCoordinates(noCitySource['10'],lat,lon),
      {Date:clock,fetch:noNetwork,sendToWidgy:url=>asyncResults.push(url)},{timeout:1000});
    const syncContext=vm.createContext({Date:clock,fetch:noNetwork,
      sendToWidgy:()=>{throw Error('Synchronous mode must return, not call sendToWidgy');}});
    vm.runInContext(substituteCoordinates(synchronousSource['10'],lat,lon),syncContext,{timeout:1000});
    assert.equal(asyncResults.length,1);
    assert.equal(vm.runInContext('main()',syncContext,{timeout:1000}),asyncResults[0]);
    assert.equal(vm.runInContext('main()',syncContext,{timeout:1000}),asyncResults[0]); // Repeated calls stay isolated.
    if(lat==='42.12345')assert.equal(new URL(asyncResults[0]).searchParams.get('lat'),'42.12345');
  }
}
assert.deepEqual(normal,personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic','https://example.test/api/calendar-widget?token=synthetic'));
console.log('Passed: Synchronous Map changes only map_request provider mode/completion; identical URLs to async control across synthetic precision, invalid inputs and minute boundaries, with no fetch/callback and immutable input.');

const stableMapURL=withCompleteHomeStableMapURL(normal,backdropDataURL);
const stableSource=stableMapURL['36'].find(v=>v['1']==='map_request')['3']['66'][0];
const stableExpected=structuredClone(synchronousMap);
stableExpected['36'].find(v=>v['1']==='map_request')['3']['66'][0]['10']=stableSource['10'];
stableExpected['3']=stableMapURL['3'];stableExpected['4']=stableMapURL['4'];
assert.deepEqual(stableMapURL,stableExpected); // No provider, layer, coordinate input or source changes elsewhere.
assert.equal(stableSource['6'],'Script');
assert(!stableSource['10'].includes('Date.now'));
assert(!stableSource['10'].includes("'&t='"));
const runMapMain=(source,lat,lon,instant)=>{
  const reject=()=>{throw Error('No network or callback allowed');};
  const context=vm.createContext({Date:class extends Date{static now(){return instant;}},fetch:reject,sendToWidgy:reject});
  vm.runInContext(substituteCoordinates(source['10'],lat,lon),context,{timeout:1000});
  return vm.runInContext('main()',context,{timeout:1000});
};
for(const [lat,lon] of [['0','0'],['42.12345','-8.54321'],['42,125','−8.5'],['','0'],['999','bad'],['90','-180']]){
  const stableURL=runMapMain(stableSource,lat,lon,fakeNow);
  for(const instant of [fakeNow,fakeNow+60000,fakeNow+3600000]){
    const timedURL=runMapMain(synchronousSource,lat,lon,instant);
    const stripped=timedURL.replace(/&t=\d+$/,'');
    assert.notEqual(stripped,timedURL);
    assert.equal(stableURL,stripped);
    assert.equal(runMapMain(stableSource,lat,lon,instant),stableURL);
  }
  assert(!new URL(stableURL).searchParams.has('at')); // The server still uses its own current time.
}
assert.notEqual(runMapMain(stableSource,'42.12345','-8.54321',fakeNow),runMapMain(stableSource,'42.12346','-8.54321',fakeNow));
assert.deepEqual(normal,personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic','https://example.test/api/calendar-widget?token=synthetic'));
console.log('Passed: Stable Map URL changes only map_request timestamp logic; identical URL minus t, stable across time, responsive to precise coordinate changes, invalid/locale inputs unchanged, no network, immutable input.');

const stableNativeCity=withCompleteHomeStableNativeCity(normal,backdropDataURL);
const stableNativeSources=stableNativeCity['36'].find(v=>v['1']==='map_request')['3']['66'];
const stableNativeExpected=structuredClone(stableMapURL);
stableNativeExpected['36'].find(v=>v['1']==='map_request')['3']['66'].push(
  {'5':'Custom Text','6':'Text','25':'&city_text='},
  structuredClone(normal['36'].find(v=>v['1']==='calendar_native_city')['3']['66'][0]));
stableNativeExpected['3']=stableNativeCity['3'];stableNativeExpected['4']=stableNativeCity['4'];
assert.deepEqual(stableNativeCity,stableNativeExpected);
assert.equal(stableNativeSources.length,3);
assert.deepEqual(stableNativeSources[0],stableSource); // GPS builder is byte-identical; city never enters JS.
// Model text concatenation only. Real mixed-provider image binding remains an on-device check.
const nativeCityURL=(lat,lon,city)=>runMapMain(stableNativeSources[0],lat,lon,fakeNow)+stableNativeSources[1]['25']+city;
for(const city of ['Example','עיר לדוגמה',"Example O'City",'Example "City"','A & B + C','Example&lat=90&lon=180','Example&cache=synthetic-60','Example`City','Example\\Backslash']){
  const url=parseMapRequest(nativeCityURL('42.125','-8.5',city));
  assert.deepEqual(resolveLocation(url),{latitude:42.125,longitude:-8.5,city,source:'coordinates'});
  assert.equal(url.searchParams.get('width'),'3306');assert(!url.searchParams.has('t'));assert(!url.searchParams.has('cache'));
}
for(const city of ['','${widgy.calendar_native_city}','Example`\\${anything}','undefined','null']){
  assert.equal(resolveLocation(parseMapRequest(nativeCityURL('0','0',city))).city,'');
}
assert.equal(resolveLocation(parseMapRequest(nativeCityURL('bad','','Example')),{'x-vercel-ip-latitude':'0','x-vercel-ip-longitude':'0'}),null);
for(const kind of ['missing','wrong','duplicate']){
  const broken=structuredClone(normal),city=broken['36'].find(v=>v['1']==='calendar_native_city');
  if(kind==='missing')broken['36']=broken['36'].filter(v=>v!==city);
  if(kind==='wrong')city['3']['66'][0]['6']='Country';
  if(kind==='duplicate')broken['36'].push(structuredClone(city));
  assert.throws(()=>withCompleteHomeStableNativeCity(broken,backdropDataURL),/unexpected_template/);
}
assert.deepEqual(normal,personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic','https://example.test/api/calendar-widget?token=synthetic'));
console.log('Passed: Stable Native City adds only native city text outside the unchanged working GPS script; synthetic parser checks for punctuation/query injection, missing city/GPS and template guards. Widgy mixed-provider image binding is not simulated.');

const fixedLocationMap=withCompleteHomeFixedLocationMap(normal,backdropDataURL);
const fixedLocationSource=fixedLocationMap['36'].find(v=>v['1']==='map_request')['3']['66'][0];
const fixedExpected=structuredClone(stableMapURL);
const fixedExpectedSource=fixedExpected['36'].find(v=>v['1']==='map_request')['3']['66'][0];
for(const name of ['map_latitude_max5','map_longitude_max5','Latitude','Longitude']){
  fixedExpectedSource['10']=fixedExpectedSource['10'].replace(JSON.stringify('${widgy.'+name+'}'),JSON.stringify('0'));
}
fixedExpected['3']=fixedLocationMap['3'];fixedExpected['4']=fixedLocationMap['4'];
assert.deepEqual(fixedLocationMap,fixedExpected); // Exactly four script arguments; native definitions and every other layer/source retained.
assert.equal(fixedLocationSource['6'],'Script');
assert(!fixedLocationSource['10'].includes('${widgy.'));
const fixedURL=runMapMain(fixedLocationSource,'','',fakeNow);
assert.equal(fixedURL,runMapMain(stableSource,'0','0',fakeNow));
for(const instant of [fakeNow,fakeNow+60000,fakeNow+3600000]){
  assert.equal(runMapMain(fixedLocationSource,'42.12345','-8.54321',instant),fixedURL);
  assert.equal(runMapMain(fixedLocationSource,'unavailable','bad',instant),fixedURL);
}
const parsedFixedURL=parseMapRequest(fixedURL);
assert.equal(parsedFixedURL.searchParams.get('lat'),'0');
assert.equal(parsedFixedURL.searchParams.get('lon'),'0');
assert(!parsedFixedURL.searchParams.has('t'));assert(!parsedFixedURL.searchParams.has('at'));
assert.deepEqual(resolveLocation(parsedFixedURL,{'x-vercel-ip-latitude':'1','x-vercel-ip-longitude':'2','x-vercel-ip-city':'Example'}),
  {latitude:0,longitude:0,city:'',source:'coordinates'});
const brokenGPSInput=structuredClone(normal);
const brokenGPSSource=brokenGPSInput['36'].find(v=>v['1']==='map_request')['3']['66'][0];
brokenGPSSource['10']=brokenGPSSource['10'].replace('${widgy.Latitude}','0');
assert.throws(()=>withCompleteHomeFixedLocationMap(brokenGPSInput,backdropDataURL),/unexpected_template/);
assert.deepEqual(normal,personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic','https://example.test/api/calendar-widget?token=synthetic'));
console.log('Passed: Fixed Location Map replaces exactly four native coordinate arguments with synthetic zero; no map-script dependencies, same stable live-image path and native definitions elsewhere, explicit zero coordinates override IP fallback, immutable input.');

const directFixedMap=withCompleteHomeDirectFixedMap(normal,backdropDataURL);
const directFixedSources=directFixedMap['36'].find(v=>v['1']==='map_request')['3']['66'];
const directFixedExpected=structuredClone(fixedLocationMap);
directFixedExpected['36'].find(v=>v['1']==='map_request')['3']['66']=[{'5':'Custom Text','6':'Text','25':fixedURL}];
directFixedExpected['3']=directFixedMap['3'];directFixedExpected['4']=directFixedMap['4'];
assert.deepEqual(directFixedMap,directFixedExpected); // Exactly one provider change, same URL and every remaining source/layer.
assert.equal(directFixedSources.length,1);
assert.deepEqual(directFixedSources[0],{'5':'Custom Text','6':'Text','25':fixedURL});
assert(!directFixedSources[0]['25'].includes('${'));
for(const instant of [fakeNow,fakeNow+60000,fakeNow+3600000]){
  assert.equal(directFixedSources[0]['25'],runMapMain(fixedLocationSource,'','',instant));
}
const unexpectedMapArguments=structuredClone(normal);
const unexpectedMapSource=unexpectedMapArguments['36'].find(v=>v['1']==='map_request')['3']['66'][0];
unexpectedMapSource['10']=unexpectedMapSource['10'].replace('width=3306','width=1653');
assert.throws(()=>withCompleteHomeDirectFixedMap(unexpectedMapArguments,backdropDataURL),/unexpected_template/);
assert.deepEqual(normal,personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic','https://example.test/api/calendar-widget?token=synthetic'));
console.log('Passed: Direct Fixed Map changes only map_request to literal text; URL is byte-identical to the synthetic Script control over time, same marker/server/image binding and all remaining data/design, guarded JSON argument parsing without eval, immutable input.');

const directImageURL=withCompleteHomeDirectImageURL(normal,backdropDataURL);
const directImageExpected=structuredClone(directFixedMap);
directImageExpected['1'].find(n=>n.s==='HOME')['1'].find(n=>n.s==='Home Hero World Map')['2']=fixedURL;
directImageExpected['3']=directImageURL['3'];directImageExpected['4']=directImageURL['4'];
assert.deepEqual(directImageURL,directImageExpected); // Exactly one image field plus diagnostic metadata.
assert.deepEqual(directImageURL['36'],directFixedMap['36']); // Do not combine variable deletion with binding change.
assert.equal(directImageURL['36'].length,81);
const directImage=directImageURL['1'].find(n=>n.s==='HOME')['1'].find(n=>n.s==='Home Hero World Map');
assert.equal(directImage['2'],directFixedSources[0]['25']);
assert.equal(directImage['1'],'Web URL');
const badImageBinding=structuredClone(normal);
badImageBinding['1'].find(n=>n.s==='HOME')['1'].find(n=>n.s==='Home Hero World Map')['2']='${widgy.unknown_map}';
assert.throws(()=>withCompleteHomeDirectImageURL(badImageBinding,backdropDataURL),/unexpected_template/);
assert.deepEqual(normal,personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic','https://example.test/api/calendar-widget?token=synthetic'));
console.log('Passed: Direct Image URL changes only image variable substitution to the identical literal URL; all 81 variables, image provider/options/frame and remaining widget preserved, invalid binding rejected, normal input unchanged.');

const unusedGPSOff=withCompleteHomeUnusedGPSOff(normal,backdropDataURL);
const unusedGPSNames=new Set(['Latitude','Longitude','map_latitude_max5','map_longitude_max5']);
const unusedGPSExpected=structuredClone(directFixedMap);
unusedGPSExpected['36']=unusedGPSExpected['36'].filter(v=>!unusedGPSNames.has(v['1']));
unusedGPSExpected['3']=unusedGPSOff['3'];unusedGPSExpected['4']=unusedGPSOff['4'];
assert.deepEqual(unusedGPSOff,unusedGPSExpected); // No change to any layer, URL, provider or remaining variable.
assert.equal(unusedGPSOff['36'].length,77);
assert(unusedGPSOff['36'].some(v=>v['1']==='calendar_native_city')); // Native location is not globally disabled.
for(const v of directFixedMap['36'].filter(v=>unusedGPSNames.has(v['1']))){
  assert(!JSON.stringify(unusedGPSOff).includes('${widgy.'+v['1']+'}'));
  assert(!JSON.stringify(unusedGPSOff).toLowerCase().includes(v['0'].toLowerCase()));
  // A remaining native variable is a genuine dependency consumer. Both text
  // substitution and condition UUID references must block deletion.
  for(const ref of ['${widgy.'+v['1']+'}',v['0'],v['0'].toLowerCase()]){
    const dangling=structuredClone(normal);
    dangling['36'].find(n=>n['1']==='calendar_native_city')['3']['66'].push({'5':'Custom Text','6':'Text','25':ref});
    assert.throws(()=>withCompleteHomeUnusedGPSOff(dangling,backdropDataURL),/unexpected_template/);
  }
  const badProvider=structuredClone(normal);
  badProvider['36'].find(n=>n['1']===v['1'])['3']['66'][0]['5']='Unknown';
  assert.throws(()=>withCompleteHomeUnusedGPSOff(badProvider,backdropDataURL),/unexpected_template/);
}
assert.deepEqual(normal,personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic','https://example.test/api/calendar-widget?token=synthetic'));
console.log('Passed: Unused GPS Off removes only four unreferenced native definitions (81 to 77); exact control map URL/binding/layers and remaining native city preserved, name/UUID references fail closed, normal input unchanged.');

const cdnFixedMap=withCompleteHomeCDNFixedMap(normal,backdropDataURL);
const cdnFixedSource=cdnFixedMap['36'].find(v=>v['1']==='map_request')['3']['66'][0];
const cdnFixedExpected=structuredClone(directFixedMap);
cdnFixedExpected['36'].find(v=>v['1']==='map_request')['3']['66'][0]['25']+='&cache=synthetic-60';
cdnFixedExpected['3']=cdnFixedMap['3'];cdnFixedExpected['4']=cdnFixedMap['4'];
assert.deepEqual(cdnFixedMap,cdnFixedExpected);
assert.equal(cdnFixedSource['25'],fixedURL+'&cache=synthetic-60');
assert.deepEqual(normal,personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic','https://example.test/api/calendar-widget?token=synthetic'));
console.log('Passed: CDN Fixed Map appends only the synthetic cache opt-in; exact same literal image path/style/location and all other widget layers and sources, immutable input.');

const directLiveMap=withCompleteHomeDirectLiveMap(normal,backdropDataURL);
const directSource=directLiveMap['36'].find(v=>v['1']==='map_request')['3']['66'][0];
const directExpected=structuredClone(staticMap);
directExpected['36'].find(v=>v['1']==='map_request')['3']['66'][0]['25']=directSource['25'];
directExpected['3']=directLiveMap['3'];directExpected['4']=directLiveMap['4'];
assert.deepEqual(directLiveMap,directExpected); // Exactly one literal URL, all other data/layers unchanged.
assert.equal(directSource['5'],'Custom Text');assert.equal(directSource['6'],'Text');
assert(!directSource['25'].includes('${'));
const directURL=parseMapRequest(directSource['25']);
assert.equal(directURL.origin,'https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app');
assert.equal(directURL.pathname,'/api/night-map');
assert.equal(directURL.searchParams.get('width'),'3306');assert.equal(directURL.searchParams.get('atlas'),'r6');
assert.equal(directURL.searchParams.get('presentation'),'glass');assert.equal(directURL.searchParams.get('reuse'),'60');
assert.equal(directURL.searchParams.get('lat'),'');assert.equal(directURL.searchParams.get('lon'),'');
assert(!directURL.searchParams.has('at'));assert(!directURL.searchParams.has('t'));
assert.equal(resolveLocation(directURL,{'x-vercel-ip-latitude':'0','x-vercel-ip-longitude':'0','x-vercel-ip-city':'Example'}),null);
assert.deepEqual(normal,personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic','https://example.test/api/calendar-widget?token=synthetic'));
console.log('Passed: Direct Live Map changes only the static literal URL; live rendering requested without map JS/interpolation, explicit empty coordinates block IP fallback, all other content unchanged.');

const nativeLocationMap=withCompleteHomeNativeLocationMap(normal,backdropDataURL);
const nativeImage=nativeLocationMap['1'].find(n=>n.s==='HOME')['1'].find(n=>n.s==='Home Hero World Map');
const nativeSources=nativeLocationMap['36'].find(v=>v['1']==='map_request')['3']['66'];
const nativeExpected=structuredClone(directLiveMap);
nativeExpected['36'].find(v=>v['1']==='map_request')['3']['66']=structuredClone(nativeSources);
nativeExpected['3']=nativeLocationMap['3'];nativeExpected['4']=nativeLocationMap['4'];
assert.deepEqual(nativeLocationMap,nativeExpected); // One variable source list; every image/frame/style preserved.
assert.equal(nativeImage['2'],'${widgy.map_request}');
assert.equal(nativeSources.length,6);
assert.deepEqual(nativeSources.filter(s=>s['5']==='Location').map(s=>s['6']),['Latitude (Decimal)','Longitude (Decimal)','City']);
assert.equal(nativeSources[4]['25'],'&city_text=');
assert(!JSON.stringify(nativeSources).includes('${'));assert(!JSON.stringify(nativeSources).includes('Javascript'));
// Model native source values offline; actual Widgy concatenation is not simulated/proven.
const nativeRequest=(latitude,longitude,city)=>parseMapRequest(nativeSources.map(s=>s['5']==='Custom Text'?s['25']:({'Latitude (Decimal)':latitude,'Longitude (Decimal)':longitude,'City':city})[s['6']]).join(''));
for(const city of ['Example','עיר לדוגמה','A & B + C','Example&lat=90&lon=180']){
  const url=nativeRequest('42.125','-8.5',city);
  assert.deepEqual(resolveLocation(url),{latitude:42.125,longitude:-8.5,city,source:'coordinates'});
  assert.equal(url.searchParams.get('width'),'3306');assert.equal(url.searchParams.get('atlas'),'r6');
  assert(!url.searchParams.has('t'));assert(!url.searchParams.has('at'));
}
assert.equal(resolveLocation(nativeRequest('0','0','Example')).latitude,0);
assert.equal(resolveLocation(nativeRequest('','','Example'),{'x-vercel-ip-latitude':'0','x-vercel-ip-longitude':'0'}),null);
assert.equal(resolveLocation(nativeRequest('${widgy.Latitude}','${widgy.Longitude}','Example')),null);
// Locale formatting is deliberately not normalized by this diagnostic; verify on device.
assert.equal(resolveLocation(nativeRequest('42,125','−8.5','Example')),null);
const brokenNativeCity=structuredClone(normal);
brokenNativeCity['36'].find(v=>v['1']==='calendar_native_city')['3']['66'][0]['6']='Country';
assert.throws(()=>withCompleteHomeNativeLocationMap(brokenNativeCity,backdropDataURL),/unexpected_template/);
assert.deepEqual(normal,personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic','https://example.test/api/calendar-widget?token=synthetic'));
console.log('Passed: Native Location Map 2 changes one source list, preserves all image bindings and other sources/layers; offline synthetic coordinates and city-tail parsing handle missing GPS and parameter-like city text safely. Device substitution/locale/refresh remain unverified.');

const bindingProbe=withHomeMapBindingProbe(normal,backdropDataURL);
const bindingHome=bindingProbe['1'].find(n=>n.s==='HOME');
const probeLayers=bindingHome['1'].filter(n=>n.s?.startsWith('Map Binding Probe · '));
assert.equal(probeLayers.length,8);assert.equal(bindingProbe['36'].length,82);
assert.deepEqual(bindingProbe['36'].slice(0,81),nativeLocationMap['36']);
const probeVariable=bindingProbe['36'][81];
assert.equal(probeVariable['1'],'map_probe_tail');assert.equal(probeVariable['3']['66'][0]['25'],'lat=');
assert.deepEqual(probeVariable['3']['66'].slice(1),nativeSources.slice(1));
const restoredProbe=structuredClone(bindingProbe);
const restoredProbeHome=restoredProbe['1'].find(n=>n.s==='HOME');
restoredProbeHome['1']=restoredProbeHome['1'].filter(n=>!n.s?.startsWith('Map Binding Probe · '));
const controlURL=restoredProbeHome['1'].find(n=>n.s==='Home Hero World Map')['2'];
assert.equal(controlURL,directSource['25']);
restoredProbeHome['1'].find(n=>n.s==='Home Hero World Map')['2']='${widgy.map_request}';
restoredProbe['36'].pop();
for(const key of ['3','4','a2'])restoredProbe[key]=nativeLocationMap[key];
assert.deepEqual(restoredProbe,nativeLocationMap);
for(const row of probeLayers){
  assert(row.b.a[0].a>=31 && row.c.a[0].a>=208);
  assert(row.b.a[0].a+row.d.a[0].a<=1568 && row.c.a[0].a+row.e.a[0].a<=938);
  assert(!row.o1 && row.a!==false);
  assert(!JSON.stringify(row).includes('/api/calendar-'));
  assert(!JSON.stringify(row).includes('Javascript'));
}
assert.deepEqual(probeLayers.find(n=>n.s==='Map Binding Probe · URL')['66'],[{'5':'Custom Text','6':'Text','25':'${widgy.map_request}'}]);
assert.deepEqual(probeLayers.find(n=>n.s==='Map Binding Probe · Tail')['66'],[{'5':'Custom Text','6':'Text','25':'4 JOIN: [${widgy.map_probe_tail}]'}]);
const bindingIDs=[...walk(bindingProbe['1'])].map(n=>n.d0);
assert.equal(new Set(bindingIDs).size,bindingIDs.length);assert(bindingIDs.every(id=>id<bindingProbe.a2));
assert.equal(new Set(bindingProbe['36'].map(v=>v['0'])).size,82);
assert.deepEqual(normal,personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic','https://example.test/api/calendar-widget?token=synthetic'));
console.log('Passed: Map Binding Check preserves failed source chain, adds eight bounded readout layers and one short native probe; direct no-location image control; no new JS, telemetry or private calendar URL readout; unique IDs and immutable input.');

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
assert(html.includes('./widgy-home-map-diagnostic.js?v=direct-image-url-1'));
assert(html.includes('?home=minimal&amp;v=minimal-events-1'));
const source=readFileSync(new URL('./widgy-home-map-diagnostic.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
assert(!source.includes('withCompleteHomeStableNativeCity')); // Failed mixed-source export cannot be reissued by the page.
const elementIDs=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
for(const [query,expectedExport] of [
  ['',diagnostic],['?city=off',cityOff],['?home=data-off',nativeOff],
  ['?home=clock-off',clockOff],['?home=minimal',minimal],['?home=progress-off',progressOff],
  ['?home=weather-art-off',weatherArtOff],['?home=minimal-clock',minimalClock],
  ['?home=minimal-events',minimalEvents],['?home=minimal-time',minimalTime],['?home=minimal-native',minimalNative],['?home=minimal-backdrop',minimalBackdrop],['?home=embedded-backdrop',embeddedBackdrop],['?home=full-artwork',fullArtwork],['?home=map-addback',mapAddback],['?home=static-map',staticMap],['?home=map-no-city',mapNoCity],['?home=direct-live-map',directLiveMap],['?home=native-location-map',nativeLocationMap],['?home=map-binding-check',bindingProbe],['?home=sync-map',synchronousMap],['?home=stable-map-url',stableMapURL],['?home=fixed-map-location',fixedLocationMap],['?home=unused-gps-off',unusedGPSOff],['?home=direct-fixed-map&compare=unused-gps',directFixedMap],['?home=direct-image-url',directImageURL],['?home=direct-fixed-map&compare=image-url',directFixedMap],['?home=direct-fixed-map',directFixedMap],['?home=cdn-fixed-map',cdnFixedMap],['?home=stable-native-city',stableMapURL],['?home=embedded-static-map',embeddedStaticMap],['?home=static-map&compare=embedded',staticMap],['?home=static-map-1653',staticMap1653],['?home=static-map&compare=resolution',staticMap]
]){
  const elements=Object.fromEntries(elementIDs.map(id=>[id,{textContent:'',hidden:true,classList:{toggle(){}},handlers:{},addEventListener(type,fn){this.handlers[type]=fn;}}]));
  let payload='',copied='',backdropLoads=0,staticMapLoads=0,exportLoads=0;
  const context=vm.createContext({
    document:{getElementById:id=>{assert(elements[id],id);return elements[id];}},
    window:{location:{search:query},addEventListener(){}},URLSearchParams,
    URL:{createObjectURL:b=>{payload=b.parts[0];return 'blob:synthetic';},revokeObjectURL(){}},
    Blob:class{constructor(parts){this.parts=parts;}},
    navigator:{clipboard:{writeText:async value=>{copied=value;}}},
    prepareWidget:async()=>{exportLoads++;return {payload:JSON.stringify(normal)};},
    loadHomeBackdropDataURL:async()=>{backdropLoads++;return backdropDataURL;},
    loadHomeStaticMapDataURL:async()=>{staticMapLoads++;return staticMapDataURL;},
    perf5DiagnosticBaseline,withoutHomeMap,withoutHomeMapAndCityLookup,withoutHomeNativeData,
    withoutHomeLiveClock,withMinimalHome,withMinimalHomeLiveClock,withMinimalHomeEvents,withMinimalHomeTimeText,withMinimalHomeNativeData,withMinimalHomeBackdrop,withMinimalHomeEmbeddedBackdrop,withCompleteHomeArtwork,withCompleteHomeMap,withCompleteHomeStaticMap,withCompleteHomeStaticMap1653,withCompleteHomeEmbeddedStaticMap,withCompleteHomeMapWithoutCityFetch,withCompleteHomeSynchronousMap,withCompleteHomeStableMapURL,withCompleteHomeStableNativeCity,withCompleteHomeFixedLocationMap,withCompleteHomeDirectFixedMap,withCompleteHomeDirectImageURL,withCompleteHomeUnusedGPSOff,withCompleteHomeCDNFixedMap,withCompleteHomeDirectLiveMap,withCompleteHomeNativeLocationMap,withHomeMapBindingProbe,withoutHomeProgressArtwork,withoutHomeWeatherArtwork
  });
  await new vm.Script(source).runInContext(context);
  if(query==='?home=embedded-static-map'){
    assert.equal(payload,'');assert.equal(exportLoads,0);assert.equal(backdropLoads,0);assert.equal(staticMapLoads,0);
    assert.equal(elements.copy.disabled,true);assert.equal(elements.download.hidden,true);assert.equal(elements.retry.hidden,true);
    assert(elements.status.textContent.includes('כשל בייבוא'));
    assert.equal(elements['baseline-link'].href,'./widgy-home-map-diagnostic.html?home=static-map&compare=embedded&v=embedded-import-stop-1');
    await elements.copy.handlers.click();assert.equal(copied,'');
    continue;
  }
  assert.deepEqual(JSON.parse(payload),expectedExport,query);
  assert.equal(backdropLoads,['?home=embedded-backdrop','?home=full-artwork','?home=map-addback','?home=static-map','?home=map-no-city','?home=direct-live-map','?home=native-location-map','?home=map-binding-check','?home=sync-map','?home=stable-map-url','?home=fixed-map-location','?home=unused-gps-off','?home=direct-fixed-map&compare=unused-gps','?home=direct-image-url','?home=direct-fixed-map&compare=image-url','?home=direct-fixed-map','?home=cdn-fixed-map','?home=stable-native-city','?home=embedded-static-map','?home=static-map&compare=embedded','?home=static-map-1653','?home=static-map&compare=resolution'].includes(query)?1:0);
  assert.equal(staticMapLoads,query==='?home=embedded-static-map'?1:0);
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
  assert.equal(elements['baseline-test'].hidden,!['?home=minimal-clock','?home=minimal-events','?home=minimal-time','?home=minimal-native','?home=minimal-backdrop','?home=embedded-backdrop','?home=full-artwork','?home=map-addback','?home=static-map','?home=map-no-city','?home=direct-live-map','?home=native-location-map','?home=map-binding-check','?home=sync-map','?home=stable-map-url','?home=fixed-map-location','?home=unused-gps-off','?home=direct-fixed-map&compare=unused-gps','?home=direct-image-url','?home=direct-fixed-map&compare=image-url','?home=direct-fixed-map','?home=cdn-fixed-map','?home=stable-native-city','?home=embedded-static-map','?home=static-map&compare=embedded','?home=static-map-1653','?home=static-map&compare=resolution'].includes(query));
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
  if(query==='?home=direct-image-url' || query==='?home=direct-fixed-map&compare=image-url'){
    const direct=query==='?home=direct-image-url';
    assert.equal(elements.download.download,direct?'Widgy_Home_Direct_Image_URL_Diagnostic.json':'Widgy_Home_Direct_Fixed_Map_Diagnostic.json');
    assert.equal(elements['baseline-link'].href,direct?'./widgy-home-map-diagnostic.html?home=direct-fixed-map&compare=image-url&v=direct-image-url-1':'./widgy-home-map-diagnostic.html?home=direct-image-url&v=direct-image-url-1');
    assert(elements.explanation.textContent.includes(direct?'0°,0°':'כבר מיובא ומופיע בתוך Widgy'));
    assert.equal(elements['next-test'].hidden,true);
  }
  if(query==='?home=unused-gps-off' || query==='?home=direct-fixed-map&compare=unused-gps'){
    const removed=query==='?home=unused-gps-off';
    assert.equal(elements.download.download,removed?'Widgy_Home_Unused_GPS_Off_Diagnostic.json':'Widgy_Home_Direct_Fixed_Map_Diagnostic.json');
    assert.equal(elements['baseline-link'].href,removed?'./widgy-home-map-diagnostic.html?home=direct-fixed-map&compare=unused-gps&v=unused-gps-off-1':'./widgy-home-map-diagnostic.html?home=unused-gps-off&v=unused-gps-off-1');
    assert(elements.explanation.textContent.includes(removed?'מקורות מיקום אחרים עדיין קיימים':'אין צורך לייבא אותו שוב'));
    assert.equal(elements['next-test'].hidden,true);
  }
  if(query==='?home=static-map-1653' || query==='?home=static-map&compare=resolution'){
    const smaller=query==='?home=static-map-1653';
    assert.equal(elements.download.download,smaller?'Widgy_Home_Static_Map_1653_Diagnostic.json':'Widgy_Home_Static_Map_Diagnostic.json');
    assert.equal(elements['baseline-link'].href,smaller?'./widgy-home-map-diagnostic.html?home=static-map&compare=resolution&v=static-map-1653-1':'./widgy-home-map-diagnostic.html?home=static-map-1653&v=static-map-1653-1');
    assert(elements.comparison.textContent.includes('38.8 MB'));
    assert(elements.explanation.textContent.includes(smaller?'ההקטנה מפחיתה פרטים':'אין צורך לייבא אותו שוב'));
    assert.equal(elements['next-test'].hidden,true);
  }
  if(query==='?home=static-map&compare=embedded'){
    assert.equal(elements.download.download,'Widgy_Home_Static_Map_Diagnostic.json');
    assert.equal(elements['baseline-link'].href,'./widgy-home-map-diagnostic.html?home=stable-map-url&v=embedded-import-stop-1');
    assert(elements.comparison.textContent.includes('באותו חיבור רשת'));
    assert.equal(elements['next-test'].hidden,true);
  }
  if(query==='?home=stable-native-city'){
    assert.equal(elements.download.download,'Widgy_Home_Stable_Map_URL_Diagnostic.json');
    assert.equal(elements['baseline-link'].href,'./widgy-home-map-diagnostic.html?home=stable-map-url&v=stable-map-recovery-1');
    assert(elements.comparison.textContent.includes('שהמפה וסימון המיקום חוזרים להופיע'));
    assert(elements.explanation.textContent.includes('שם העיר במפה חסר זמנית'));
    assert.equal(JSON.parse(payload)['36'].find(v=>v['1']==='map_request')['3']['66'].length,1);
    assert.equal(elements['next-test'].hidden,true);
  }
  if(query==='?home=cdn-fixed-map'){
    assert.equal(elements.download.download,'Widgy_Home_CDN_Fixed_Map_Diagnostic.json');
    assert.equal(elements['baseline-link'].href,'./widgy-home-map-diagnostic.html?home=direct-fixed-map&v=cdn-fixed-map-1');
    assert(elements.explanation.textContent.includes('0°,0°'));
    assert(elements.comparison.textContent.includes('וסימון הדוגמה יופיעו'));
    assert.equal(elements['next-test'].hidden,true);
  }
  if(query==='?home=direct-fixed-map'){
    assert.equal(elements.download.download,'Widgy_Home_Direct_Fixed_Map_Diagnostic.json');
    assert.equal(elements['baseline-link'].href,'./widgy-home-map-diagnostic.html?home=fixed-map-location&v=direct-fixed-map-1');
    assert(elements.explanation.textContent.includes('0°,0°'));
    assert(elements.comparison.textContent.includes('וסימון הדוגמה יופיעו'));
    assert.equal(elements['next-test'].hidden,true);
  }
  if(query==='?home=fixed-map-location'){
    assert.equal(elements.download.download,'Widgy_Home_Fixed_Location_Map_Diagnostic.json');
    assert.equal(elements['baseline-link'].href,'./widgy-home-map-diagnostic.html?home=stable-map-url&v=fixed-map-location-1');
    assert(elements.explanation.textContent.includes('0°,0°'));
    assert(elements.comparison.textContent.includes('וסימון הדוגמה יופיעו'));
    assert.equal(elements['next-test'].hidden,true);
  }
  if(query==='?home=stable-map-url'){
    assert.equal(elements.download.download,'Widgy_Home_Stable_Map_URL_Diagnostic.json');
    assert.equal(elements['baseline-link'].href,'./widgy-home-map-diagnostic.html?home=sync-map&v=stable-map-url-1');
    assert(elements.comparison.textContent.includes('וסימון המיקום יופיעו'));
    assert(elements.comparison.textContent.includes('אחרי דקה'));
    assert.equal(elements['next-test'].hidden,true);
  }
  if(query==='?home=sync-map'){
    assert.equal(elements.download.download,'Widgy_Home_Synchronous_Map_Diagnostic.json');
    assert.equal(elements['baseline-link'].href,'./widgy-home-map-diagnostic.html?home=map-no-city&v=sync-map-1');
    assert(elements.comparison.textContent.includes('וסימון המיקום יופיעו'));
    assert.equal(elements['next-test'].hidden,true);
  }
  if(query==='?home=map-binding-check'){
    assert.equal(elements.download.download,'Widgy_Home_Map_Binding_Check.json');
    assert.equal(elements['baseline-link'].href,'./widgy-home-map-diagnostic.html?home=direct-live-map&v=map-binding-check-1');
    assert(elements.comparison.textContent.includes('אין צורך לבדוק מעברים'));
    assert.equal(elements['next-test'].hidden,true);
  }
  if(query==='?home=native-location-map'){
    assert.equal(elements.download.download,'Widgy_Home_Native_Location_Map_2.json');
    assert.equal(elements['baseline-link'].href,'./widgy-home-map-diagnostic.html?home=direct-live-map&v=native-location-map-2');
    assert(elements.comparison.textContent.includes('ושם העיר הנכון מופיעים'));
    assert.equal(elements['next-test'].hidden,true);
  }
  if(query==='?home=direct-live-map'){
    assert.equal(elements.download.download,'Widgy_Home_Direct_Live_Map_Diagnostic.json');
    assert.equal(elements['baseline-link'].href,'./widgy-home-map-diagnostic.html?home=static-map&v=direct-live-map-1');
    assert(elements.explanation.textContent.includes('תדירות העדכון האוטומטי תיבדק בנפרד'));
    assert.equal(elements['next-test'].hidden,true);
  }
  if(query==='?home=map-no-city'){
    assert.equal(elements.download.download,'Widgy_Home_Live_Map_No_City_Fetch_Diagnostic.json');
    assert.equal(elements['baseline-link'].href,'./widgy-home-map-diagnostic.html?home=static-map&v=map-no-city-1');
    assert(elements.comparison.textContent.includes('וסימון המיקום יופיעו'));
    assert.equal(elements['next-test'].hidden,true);
  }
  if(query==='?home=static-map'){
    assert.equal(elements.download.download,'Widgy_Home_Static_Map_Diagnostic.json');
    assert.equal(elements['baseline-link'].href,'./widgy-home-map-diagnostic.html?home=map-addback&v=static-map-1');
    assert(elements.comparison.textContent.includes('שתמונת המפה תופיע'));
    assert.equal(elements['next-test'].hidden,true);
  }
  if(query==='?home=map-addback'){
    assert.equal(elements.download.download,'Widgy_Home_Map_Add_Back_Diagnostic.json');
    assert.equal(elements['baseline-link'].href,'./widgy-home-map-diagnostic.html?home=full-artwork&v=map-addback-1');
    assert(elements.comparison.textContent.includes('עד שהמפה עצמה מופיעה'));
    assert.equal(elements['next-test'].hidden,true);
  }
  if(query==='?home=full-artwork'){
    assert.equal(elements.download.download,'Widgy_Home_Complete_Artwork_Diagnostic.json');
    assert.equal(elements['baseline-link'].href,'./widgy-home-map-diagnostic.html?home=embedded-backdrop&v=full-artwork-1');
    assert.equal(elements['next-test'].hidden,true);
  }
  if(query==='?home=embedded-backdrop'){
    assert.equal(elements.download.download,'Widgy_Home_Embedded_Backdrop_Trial.json');
    assert.equal(elements['baseline-link'].href,'./widgy-home-map-diagnostic.html?home=minimal-backdrop&v=embedded-backdrop-1');
    assert(elements.comparison.textContent.includes('אם הן חסרות'));
    assert.equal(elements['next-test'].hidden,true);
  }
  if(query==='?home=minimal-backdrop'){
    assert.equal(elements.download.download,'Widgy_Home_Minimal_Backdrop_Diagnostic.json');
    assert.equal(elements['baseline-link'].href,'./widgy-home-map-diagnostic.html?home=minimal-native&v=minimal-backdrop-1');
    assert.equal(elements['next-test'].hidden,true);
  }
  if(query==='?home=minimal-native'){
    assert.equal(elements.download.download,'Widgy_Home_Minimal_Native_Data_Diagnostic.json');
    assert.equal(elements['baseline-link'].href,'./widgy-home-map-diagnostic.html?home=minimal-time&v=minimal-native-1');
    assert.equal(elements['next-test'].hidden,true);
  }
  if(query==='?home=minimal-time'){
    assert.equal(elements.download.download,'Widgy_Home_Minimal_Time_Text_Diagnostic.json');
    assert.equal(elements['baseline-link'].href,'./widgy-home-map-diagnostic.html?home=minimal-events&v=minimal-time-1');
    assert.equal(elements['next-test'].hidden,true);
  }
}
console.log('Passed: thirty-three diagnostic URLs export/copy their intended controls; failed embedded map route blocks export, downloads and clipboard without loading private data.');
