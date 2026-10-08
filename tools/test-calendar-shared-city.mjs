import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {withSharedCalendarCity, calendarCityFromMap} from './calendar-shared-city.js';
import {buildCityMapScript} from './widgy-city-map-script.mjs';

// No real geocoder, GPS, calendar or personal endpoint is requested.
const source = process.argv[2] || new URL('./Widgy_Home_Glass_Calendar_C16.json', import.meta.url);
const original = JSON.parse(readFileSync(source));
const before = structuredClone(original);
const candidate = withSharedCalendarCity(original);
const variable = (w, name) => w['36'].find(v => v['1'] === name);
const citySource = w => variable(w, 'calendar_city_prefix')['3']['66'][0];
const restored = structuredClone(candidate);
citySource(restored)['6'] = citySource(original)['6'];
citySource(restored)['10'] = citySource(original)['10'];
restored['3'] = original['3']; restored['4'] = original['4'];
assert.deepEqual(restored, original, 'Only Calendar city mode/script and trial metadata change');
assert.deepEqual(original, before, 'Stable input remains untouched');
assert(!/fetch\s*\(|sendToWidgy|reverse-geocode-client/.test(citySource(candidate)['10']));
assert.deepEqual([...citySource(candidate)['10'].matchAll(/\$\{widgy\.([^}]+)\}/g)].map(m => m[1]), ['map_request']);

const base = 'https://example.test/api/night-map?mode=live&width=3306&presentation=glass&atlas=r6&reuse=60&lat=0&lon=0';
function execute(url) {
  // The known map source percent-encodes city and coordinates; its HTTPS
  // endpoint is fixed. City text is never substituted directly into JS.
  assert(!/["\n\r\\]/.test(url));
  const script = citySource(candidate)['10'].replace('${widgy.map_request}', () => url);
  return vm.runInNewContext(script + '\nmain();', {});
}
const names = ['Example', 'Ashqelon', 'O\'Example', 'A&B + Place', 'עיר לדוגמה',
  'A"B\\C\nD', '😀'.repeat(60), ''];
for (const city of names) {
  const url = base + (city ? '&city=' + encodeURIComponent(city) : '') + '&t=1791450000000';
  const expected = city.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 80);
  assert.equal(execute(url), expected ? expected + ', ' : '');
}
for (const url of ['', '${widgy.map_request}', base, base + '&city=%ZZ', base + '&city=', base + '#city=Example']) {
  assert.equal(execute(url), '', 'Missing/invalid city keeps existing native fallback active');
}

// Run the original phone map algorithm against mocked responses, then the
// candidate's actual synchronous source. One source performs the lookup;
// no browser/native request coalescing is inferred from this simulation.
async function pipeline({lat='0', lon='0', data={latitude:0, longitude:0, lookupSource:'coordinates',city:'Example'}, fail=false, cached=false}={}) {
  let requests = 0, calls = 0, resolve;
  const result = new Promise(r => resolve = r);
  const script = buildCityMapScript('https://example.test/api/night-map?mode=live&width=3306&presentation=glass&atlas=r6',
    {enabled:true,reuseSeconds:60,cityReuseSeconds:3600});
  const values = {map_latitude_max5:lat,map_longitude_max5:lon,Latitude:lat,Longitude:lon};
  const context = {Date:{now:() => 1791450000000},sendToWidgy(value){calls++;resolve(value);},
    fetch(url){requests++;assert(url.startsWith('https://api.bigdatacloud.net/'));return fail ? Promise.reject(Error('offline')) : Promise.resolve({ok:true,status:200,json:async()=>data});}};
  if(cached)context.__homeGlassCityV1={latitude:0,longitude:0,city:'Example',time:1791449999000};
  vm.runInNewContext(script.replace(/\$\{widgy\.([^}]+)\}/g, (_,key) => values[key]),context);
  const url=await result;await Promise.resolve();
  assert.equal(calls,1);
  return {url, city:execute(url), requests};
}
assert.deepEqual((({city,requests})=>({city,requests}))(await pipeline()), {city:'Example, ',requests:1});
assert.equal((await pipeline({cached:true})).requests,0);
for (const options of [{fail:true},{data:{lookupSource:'ip',city:'Wrong'}},{data:{latitude:2,longitude:0,lookupSource:'coordinates',city:'Wrong'}},{lat:''},{lon:'181'}]) {
  const out=await pipeline(options);assert.equal(out.city,'');assert.equal(new URL(out.url).searchParams.get('width'),'3306');
}
for(const change of [w=>citySource(w)['6']='Script',w=>variable(w,'map_request')['3']['66'][0]['10']+='${widgy.calendar_city_prefix}',w=>variable(w,'calendar_native_city')['3']['66'][0]['6']='Country']) {
  const invalid=structuredClone(original);change(invalid);assert.throws(()=>withSharedCalendarCity(invalid),/unexpected_template/);
}
assert.equal(calendarCityFromMap(base+'&city=Example'),'Example, ');
console.log(JSON.stringify({unchangedMapAndLayout:true,stableInputPreserved:true,calendarSourceHasNoNetwork:true,
  synchronousParser:true,encodedCityCases:names.length,missingInvalidCityFallback:true,mockedMapPipeline:true,
  nativeSchedulingAndSpeed:'pending phone check'}));
