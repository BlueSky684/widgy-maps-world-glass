import {cityMapRuntime} from './widgy-city-map-script.mjs';

// Diagnostic only: the timing suffix changes the native image URL. Do not use
// this copy to compare image-cache speed with the uninstrumented widget.
export function withCityTimingDiagnostic(input) {
  const widget = structuredClone(input);
  const variables = widget['36'].filter(v => v['1'] === 'map_request');
  const sources = variables[0]?.['3']?.['66'];
  const original = cityMapRuntime.toString();
  if (variables.length !== 1 || sources?.length !== 1 || sources[0]['5'] !== 'Javascript' ||
      sources[0]['6'] !== 'Async + No main()' || !sources[0]['10'].startsWith(original + '\ncityMapRuntime(')) {
    throw Error('Unexpected map script; keep the existing widget unchanged');
  }
  let runtime = original;
  function replace(from, to) {
    if (runtime.split(from).length !== 2) throw Error('Unexpected city runtime');
    runtime = runtime.replace(from, to);
  }
  replace('  var finished = false;', "  var finished = false;\n  var cityTraceStart = Date.now(), cityTracePath = 'none';");
  replace('    sendToWidgy(url);', `    var cityTraceElapsed = Date.now() - cityTraceStart;
    if (isFinite(cityTraceElapsed) && cityTraceElapsed >= 0 && cityTraceElapsed <= 3600000) {
      url += '&city_trace_v1=' + cityTracePath + ':' + Math.floor(cityTraceElapsed);
    }
    sendToWidgy(url);`);
  replace('      finish(mapURL(saved.city));', "      cityTracePath = 'memory';\n      finish(mapURL(saved.city));");
  replace('  fetch(lookup).then', "  cityTracePath = 'fetch';\n  fetch(lookup).then");
  replace('    finish(mapURL(city));', "    if (!city) cityTracePath = 'empty';\n    finish(mapURL(city));");
  replace('  }).catch(function () {', "  }).catch(function () {\n    cityTracePath = 'failed';");
  replace("  } catch (error) {\n    finish(mapURL(''));\n  }\n}", "  } catch (error) {\n    cityTracePath = 'failed';\n    finish(mapURL(''));\n  }\n}");
  sources[0]['10'] = runtime + sources[0]['10'].slice(original.length);
  widget['3'] = 'Widgy City Timing Test 1';
  widget['4'] = 'City timing diagnostic only. Same Home, Calendar, GPS, dynamic city, clock, native day gauge and full-resolution PNG. Reports script duration and cache/fetch outcome in the existing map request; no extra fetch is added. The timing suffix changes image URL identity, so this copy is not a transition-speed comparison. GPS acquisition before JavaScript, unrelated Home sources and native decode/display remain unmeasured. Keep the normal copy.';
  return widget;
}
