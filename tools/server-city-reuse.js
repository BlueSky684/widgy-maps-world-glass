import {cityMapRuntime} from './widgy-city-map-script.mjs';

// Separate opt-in export: existing widget runtimes are left intact.
export function withServerCityReuse(input, scope) {
  if (!/^[a-f0-9]{32}$/.test(scope)) throw Error('Invalid private cache scope');
  const widget = structuredClone(input), variables = widget['36'].filter(v => v['1'] === 'map_request');
  const sources = variables[0]?.['3']?.['66'], original = cityMapRuntime.toString();
  if (variables.length !== 1 || sources?.length !== 1 || sources[0]['5'] !== 'Javascript' ||
      sources[0]['6'] !== 'Async + No main()' || !sources[0]['10'].startsWith(original + '\ncityMapRuntime(')) {
    throw Error('Unexpected map script; keep the existing widget unchanged');
  }
  let runtime = original;
  function replace(from, to) {
    if (runtime.split(from).length !== 2) throw Error('Unexpected city runtime');
    runtime = runtime.replace(from, to);
  }
  replace('  var finished = false;', `  var finished = false, cityObservedAt = 0;
  endpoint += '&city_cache_v1=map&city_cache_scope=${scope}';`);
  replace(" + '&t=' + stamp;", " + '&t=' + stamp + (city && cityObservedAt ? '&city_cache_time=' + cityObservedAt : '');");
  replace('      finish(mapURL(saved.city));', '      cityObservedAt = saved.time;\n      finish(mapURL(saved.city));');
  replace("  var lookup = 'https:", "  function lookupFreshCity() {\n  var lookup = 'https:");
  replace('      if (memory && city) {', '      cityObservedAt = city ? Date.now() : 0;\n      if (memory && city) {');
  replace('city:city, time:Date.now()', 'city:city, time:cityObservedAt');
  replace("  } catch (error) {\n    finish(mapURL(''));\n  }\n}", `  } catch (error) {
    finish(mapURL(''));
  }
  }
  // One tiny same-origin read; no location lookup runs on the server. A miss,
  // rejected response, invalid JSON or fetch failure uses the original lookup.
  var fallbackStarted = false;
  function fallback() {
    if (fallbackStarted || finished) return;
    fallbackStarted = true;
    lookupFreshCity();
  }
  try {
    fetch(base.replace('&city_cache_v1=map', '&city_cache_v1=read')).then(function (response) {
      if (!response || response.ok === false ||
          (typeof response.status === 'number' && (response.status < 200 || response.status >= 300))) throw new Error('City cache unavailable');
      return response.json();
    }).then(function (data) {
      var saved = data && data.state === 'HIT' && data.entry;
      var age = saved && typeof saved.observedAt === 'number' ? Date.now() - saved.observedAt : -1;
      if (!saved || saved.latitude !== lat || saved.longitude !== lon || age < 0 ||
          age >= cityReuseSeconds * 1000 || typeof saved.city !== 'string') { fallback(); return; }
      var city = Array.from(saved.city.replace(/[\\u0000-\\u001f\\u007f]/g, '').trim()).slice(0, 80).join('');
      if (!city) { fallback(); return; }
      cityObservedAt = saved.observedAt;
      if (memory) {
        try { memory.__homeGlassCityV1 = {latitude:lat, longitude:lon, city:city, time:cityObservedAt}; } catch (error) {}
      }
      finish(mapURL(city));
    }).catch(fallback);
  } catch (error) { fallback(); }
}`);
  sources[0]['10'] = runtime + sources[0]['10'].slice(original.length);
  widget['3'] = 'Widgy Server City Cache Test 1';
  widget['4'] = 'Opt-in city cache trial. Reuses the last city for the exact GPS coordinates for up to one hour across surviving map-server requests; a cold cache falls back to the original phone geocoder. Same design, GPS, city, clock, native day gauge and full-resolution PNG. Keep the normal copy. Native speed benefit is unverified.';
  return widget;
}
