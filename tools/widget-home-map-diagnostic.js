// Transform only a private in-browser export; never publish user calendar data.
// The normal export has a separate ring correctness fix. Keep existing
// diagnostic comparisons on their measured perf-5 baseline until they finish.
// This compatibility transform must never be used by the regular copy flow.
export function perf5DiagnosticBaseline(original){
  if(original['3']!=='Widgy Calendar Unified')throw Error('unexpected_template');
  const widget=structuredClone(original);
  const rings=widget['1'].find(n=>n.s==='HOME')?.['1'].filter(n=>/^Steps Goal Ring · \d+%$/.test(n.s));
  if(rings?.length!==100 || rings.some(n=>![0,5].includes(n.o1?.['1'])))throw Error('unexpected_template');
  for(const n of rings)n.o1['1']=0;
  return widget;
}

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

// A broad source-group probe, not a release or proof of one slow provider.
export function withoutHomeNativeData(original){
  const widget=withoutHomeMapAndCityLookup(original);
  const literal=value=>[{'5':'Custom Text','6':'Text','25':value}];
  const variables=[
    ['wx_status','Weather (Now)','Status (Full)','Clear'],
    ['wx_wind_speed','Weather (Now)','Wind Speed','0'],
    ['steps_today','Pedometer','Steps','100']
  ];
  for(const [name,provider,field,value] of variables){
    const matches=widget['36'].filter(v=>v['1']===name);
    const source=matches[0]?.['3']['66'];
    if(matches.length!==1 || source?.length!==1 || source[0]['5']!==provider || source[0]['6']!==field)throw Error('unexpected_template');
    matches[0]['3']['66']=literal(value);
  }
  const home=widget['1'].find(n=>n.s==='HOME');
  const fields=[
    ['Events Summary · 3','Agenda (Today)','Reminder Events Today','0'],
    ['Sunrise Time','Sun And Moon','Sunrise','06:00'],
    ['Sunset Time','Sun And Moon','Sunset','18:00'],
    ['Weather Temp','Weather (Now)','Temperature','20°'],
    ['Weather Status','Weather (Now)','Status (Simple)','TEST DATA'],
    ['Weather High','Weather (Now)','Max. Temperature Today','25°'],
    ['Weather Low','Weather (Now)','Min. Temperature Today','15°'],
    ['Distance Value','Pedometer','Distance','0.1 km'],
    ['Calories Value','Health (Daily)','Active Energy Burned','10 kcal']
  ];
  for(const [name,provider,field,value] of fields){
    const matches=home['1'].filter(n=>n.s===name);
    const source=matches[0]?.['66'];
    if(matches.length!==1 || source?.length!==1 || source[0]['5']!==provider || source[0]['6']!==field)throw Error('unexpected_template');
    matches[0]['66']=literal(value);
  }
  widget['3']='Widgy Home Native-Data-Off Diagnostic';
  widget['4']='Temporary diagnostic based on Map-City-Off. Nine Home text sources and three variables use synthetic TEST DATA instead of weather, pedometer, active energy, reminder count, sunrise and sunset. Every layer, shape, condition, font, frame and tap action is retained; Calendar endpoints, the live clock, date calculations, GPS inputs and static artwork remain. Sample inputs may select different existing weather/ring states, so a faster result implicates this source/visibility group, not any single provider. Keep private; restore the normal widget after testing.';
  return widget;
}

export function withoutHomeLiveClock(original){
  const widget=withoutHomeNativeData(original);
  const clocks=widget['1'].find(n=>n.s==='HOME')['1'].filter(n=>n.s==='Hero Time');
  const source=clocks[0]?.['66'];
  if(clocks.length!==1 || source?.length!==1 || source[0]['5']!=='Date And Time' ||
      source[0]['6']!=='Live Timer (24 hours, No Seconds)')throw Error('unexpected_template');
  clocks[0]['66']=[{'5':'Custom Text','6':'Text','25':'12:34'}];
  widget['3']='Widgy Home Clock-Off Diagnostic';
  widget['4']='Compared with Native-Data-Off, only the Hero Time data source becomes the static literal 12:34. All layers, frames, fonts, conditions, actions and variables are retained. This tests the live-clock source/rendering path, not a proven fix. The map remains blank; Home sensor values are synthetic TEST DATA and Calendar city is TEST. Keep this private export private.';
  return widget;
}

export function withMinimalHome(original){
  const widget=withoutHomeLiveClock(original);
  const home=widget['1'].find(n=>n.s==='HOME');
  const retained=new Set([5021,5022,5023,5024,5012,5013,80310,80311,5015,5016,5017,5018,6195,5020,5001]);
  home['1']=home['1'].filter(n=>retained.has(n.d0));
  if(home['1'].length!==retained.size || home['1'].filter(n=>n.z==='11').length!==4 ||
      home['1'].find(n=>n.d0===5001)?.s!=='Full Graphite Background')throw Error('unexpected_template');
  widget['3']='Widgy Home Minimal Diagnostic';
  widget['4']='Temporary minimal-Home control based on Clock-Off. Home keeps only its original solid background, four tap areas and ten navigation drawings/labels. All variables, other tabs, their data and navigation are retained. The otherwise empty Home is intentional and not the approved design or a release. A faster result implicates the removed Home content/evaluation; it does not identify a particular layer. Keep this private export private.';
  return widget;
}
