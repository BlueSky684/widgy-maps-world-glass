// Transform only a private in-browser export; never publish user calendar data.
export function withoutHomeMap(original){
  if(original['3']!=='Widgy Calendar Unified')throw Error('unexpected_template');
  const widget=structuredClone(original);
  const home=widget['1'].find(n=>n.s==='HOME');
  const maps=home?.['1'].filter(n=>n.s==='Home Hero World Map');
  if(maps?.length!==1||maps[0].z!=='5'||maps[0]['2']!=='${widgy.map_request}')throw Error('unexpected_template');
  home['1']=home['1'].filter(n=>n!==maps[0]);
  const removed=new Set(['map_request']);
  if(widget['36'].filter(v=>removed.has(v['1'])).length!==1)throw Error('unexpected_template');
  widget['36']=widget['36'].filter(v=>!removed.has(v['1']));
  const rest=JSON.stringify(widget);
  for(const name of removed)if(rest.includes('${widgy.'+name+'}'))throw Error('unexpected_template');
  widget['3']='Widgy Home Map-Off Diagnostic';
  widget['4']='Separate perf-5 diagnostic copy. Only the Home map image and its map_request variable are removed. The map area is intentionally empty. The independent Calendar city lookup and its shared GPS inputs are retained. All other visual layers, buttons, Calendar sources and conditions are identical to the normal personalized export. Import separately and compare Home transitions in the same slot and network. Restore the normal widget after testing. Keep this private calendar export private.';
  return widget;
}

// Compare against Map-Off: change exactly one source, keeping its variable ID,
// all GPS inputs, Calendar endpoints, layer conditions and tap actions intact.
export function withoutHomeMapAndCityLookup(original){
  const widget=withoutHomeMap(original);
  const matches=widget['36'].filter(v=>v['1']==='calendar_city_prefix');
  const city=matches[0];
  if(matches.length!==1 || city['3']['66']?.length!==1 ||
      city['3']['66'][0]['6']!=='Async + No main()' ||
      !city['3']['66'][0]['10']?.includes('reverse-geocode-client'))throw Error('unexpected_template');
  // A nonempty, visibly synthetic label keeps the successful-lookup visibility
  // path selected. Empty text would activate the separate native-city fallback
  // and confound the comparison with a different source/layer path.
  city['3']['66']=[{'5':'Custom Text','6':'Text','25':'TEST, '}];
  widget['3']='Widgy Home Map-City-Off Diagnostic';
  widget['4']='Separate diagnostic copy based on the Map-Off test. The only additional change is replacing calendar_city_prefix with the literal TEST, so no custom reverse-geocoder runs. The nonempty label preserves the successful-lookup visibility path. All GPS inputs, native location/weather/health sources, Calendar endpoints, layers, conditions and tap actions remain unchanged. The map area is intentionally empty and the Calendar city reads TEST. This is a temporary comparison, not a speed fix or a daily-use release. Keep this private calendar export private.';
  return widget;
}
