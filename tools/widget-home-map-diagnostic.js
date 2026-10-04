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

// Add back one untouched layer to the user's fast Minimal control. This is
// different from comparing two active clock providers in the full widget.
export function withMinimalHomeLiveClock(original){
  const widget=withMinimalHome(original);
  const originalHome=original['1'].find(n=>n.s==='HOME');
  const clocks=originalHome['1'].filter(n=>n.s==='Hero Time');
  const clock=clocks[0],source=clock?.['66'];
  if(clocks.length!==1 || source?.length!==1 || source[0]['5']!=='Date And Time' ||
      source[0]['6']!=='Live Timer (24 hours, No Seconds)' ||
      clock['1']!=='HomeGlassTime-Light')throw Error('unexpected_template');
  const home=widget['1'].find(n=>n.s==='HOME');
  const layers=new Map(home['1'].map(n=>[n.d0,n]));
  if(layers.has(clock.d0))throw Error('unexpected_template');
  layers.set(clock.d0,structuredClone(clock));
  home['1']=originalHome['1'].filter(n=>layers.has(n.d0)).map(n=>layers.get(n.d0));
  if(home['1'].length!==16)throw Error('unexpected_template');
  widget['3']='Widgy Home Minimal Live Clock Diagnostic';
  widget['4']='Exact fast Minimal control with only the original approved Hero Time layer restored, including Live Timer (24 hours, No Seconds), HomeGlassTime-Light font, frame, color and original layer order. Home has 16 nodes instead of 15. All variables, frozen sensor inputs, TEST city label, absent map, other tabs and navigation remain identical to Minimal. This tests the presence of the live clock layer, including its source and drawing, not a specific internal cause or a proposed replacement. Keep this private calendar export private.';
  return widget;
}

// The user reports Minimal + the approved live clock is fast. Restore only
// the four Home calendar-bound text layers on that exact measured baseline.
export function withMinimalHomeEvents(original){
  const widget=withMinimalHomeLiveClock(original);
  const originalHome=original['1'].find(n=>n.s==='HOME');
  const home=widget['1'].find(n=>n.s==='HOME');
  const layers=new Map(home['1'].map(n=>[n.d0,n]));
  for(const [name,field] of [
    ['Events Summary · 1','count'],['Events Summary · 2','event_word'],
    ['Next Event Title','title'],['Next Event Label','meta']
  ]){
    const matches=originalHome['1'].filter(n=>n.s===name),n=matches[0];
    const variables=original['36'].filter(v=>v['1']==='calendar_home_'+field);
    if(matches.length!==1 || n.z!=='1' || layers.has(n.d0) ||
        n['66']?.length!==1 || n['66'][0]['5']!=='Custom Text' ||
        n['66'][0]['25']!=='${widgy.calendar_home_'+field+'}' ||
        variables.length!==1 || variables[0]['3']['66']?.[0]?.['5']!=='JSON Endpoint')throw Error('unexpected_template');
    layers.set(n.d0,structuredClone(n));
  }
  home['1']=originalHome['1'].filter(n=>layers.has(n.d0)).map(n=>layers.get(n.d0));
  if(home['1'].length!==20)throw Error('unexpected_template');
  widget['3']='Widgy Home Minimal Events Diagnostic';
  widget['4']='Compared with the fast Minimal Live Clock copy, restore only four original Home calendar text layers: event count, event/events wording, full event title, and status/time line. Their actual native JSON bindings, fonts, frames, colors and original order are preserved. All 80 variables and their sources, approved live clock, remaining layers and other tabs are identical. No new endpoint or variable, no reminders source restored, no map or decorative backdrop. Tests the display/evaluation of this four-layer group, not proof of four network requests or a single slow provider. Keep this private export private.';
  return widget;
}

// Keep the clock/event control and restore the remaining time-related text.
// The 100 progress fill drawings are deliberately not part of this comparison.
export function withMinimalHomeTimeText(original){
  const widget=withMinimalHomeEvents(original);
  const originalHome=original['1'].find(n=>n.s==='HOME');
  const home=widget['1'].find(n=>n.s==='HOME');
  const layers=new Map(home['1'].map(n=>[n.d0,n]));
  const restored=[
    [6101,'Greeting White'],[6102,'Greeting Lime · MORNING'],
    [80103,'Greeting Lime · AFTERNOON'],[80104,'Greeting Lime · EVENING'],[80105,'Greeting Lime · NIGHT'],
    [6103,'Header Weekday'],[6104,'Header Month'],[6105,'Header Day'],
    [80312,'Header Day · Weight'],[80313,'Header Day · Weight'],
    [6122,'Day Progress Label'],[6123,'Day Progress Value'],[80205,'Day Progress Unavailable']
  ];
  for(const [id,name] of restored){
    const matches=originalHome['1'].filter(n=>n.d0===id),n=matches[0];
    if(matches.length!==1 || n.z!=='1' || n.s!==name || layers.has(id))throw Error('unexpected_template');
    layers.set(id,structuredClone(n));
  }
  home['1']=originalHome['1'].filter(n=>layers.has(n.d0)).map(n=>layers.get(n.d0));
  if(home['1'].length!==33)throw Error('unexpected_template');
  widget['3']='Widgy Home Minimal Time Text Diagnostic';
  widget['4']='Compared with Minimal Events, restore only 13 original time-related text layers: five greeting layers, weekday/month and three approved day-number layers, plus the day-progress label/value/unavailable text. All original scripts, native date sources, conditions, fonts, frames, colors and drawing order are preserved. All 80 variables, clock, event fields, other layers and tabs remain identical. The graphical progress fills, weather artwork, map and decorative backdrop remain absent. Tests this text/source group and its interactions, not a single layer or a proposed design change. Keep this private export private.';
  return widget;
}

// Restore the remaining native Home text sources to the measured fast control.
// The three shared native variables also return to their original real sources.
export function withMinimalHomeNativeData(original){
  const widget=withMinimalHomeTimeText(original);
  const originalHome=original['1'].find(n=>n.s==='HOME');
  const home=widget['1'].find(n=>n.s==='HOME');
  const layers=new Map(home['1'].map(n=>[n.d0,n]));
  const restored=[
    [80207,'Events Summary · 3'],[80208,'Events Summary · 4'],
    [6121,'Sunrise Time'],[6124,'Sunset Time'],
    [6131,'Weather Temp'],[6132,'Weather Status'],[6133,'Weather High'],[6134,'Weather Low'],
    [6141,'Steps Value'],[6142,'Steps Label'],[6143,'Distance Value'],[6144,'Calories Value']
  ];
  for(const [id,name] of restored){
    const matches=originalHome['1'].filter(n=>n.d0===id),n=matches[0];
    if(matches.length!==1 || n.z!=='1' || n.s!==name || layers.has(id))throw Error('unexpected_template');
    layers.set(id,structuredClone(n));
  }
  home['1']=originalHome['1'].filter(n=>layers.has(n.d0)).map(n=>layers.get(n.d0));
  for(const name of ['wx_status','wx_wind_speed','steps_today']){
    const source=original['36'].filter(v=>v['1']===name);
    const target=widget['36'].filter(v=>v['1']===name);
    if(source.length!==1 || target.length!==1 || source[0]['0']!==target[0]['0'])throw Error('unexpected_template');
    target[0]['3']['66']=structuredClone(source[0]['3']['66']);
  }
  if(home['1'].length!==45)throw Error('unexpected_template');
  widget['3']='Widgy Home Minimal Native Data Diagnostic';
  widget['4']='Compared with the fast Minimal Time Text copy, restore 12 original Home text layers: reminder count and label, sunrise/sunset, four weather fields, steps and label, distance and calories. Also restore the original real wx_status, wx_wind_speed and steps_today variable sources; these shared variables may affect other tabs. All 80 variable identities, every other source, retained layer and tab structure, styles, conditions and drawing order remain unchanged. TEST city and absent map remain; no progress fills, weather-icon alternatives, decorative backdrop or static icons are restored. This broad source/display comparison tests a group and its interactions, not a single provider or proven optimization. Keep this private export private.';
  return widget;
}

// Isolate the original web-image backdrop on the live-text control. A device
// difference includes image fetching/decoding/rendering, not just layer count.
export function withMinimalHomeBackdrop(original){
  const widget=withMinimalHomeNativeData(original);
  const originalHome=original['1'].find(n=>n.s==='HOME');
  const matches=originalHome['1'].filter(n=>n.d0===80309),backdrop=matches[0];
  if(matches.length!==1 || backdrop.s!=='Approved Glass · Chrome and Frames' ||
      backdrop.z!=='5' || backdrop['1']!=='Web URL' ||
      backdrop['2']!=='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/assets/home-glass/Home_Glass_Chrome_C8.png')throw Error('unexpected_template');
  const home=widget['1'].find(n=>n.s==='HOME');
  const layers=new Map(home['1'].map(n=>[n.d0,n]));
  if(layers.has(backdrop.d0))throw Error('unexpected_template');
  layers.set(backdrop.d0,structuredClone(backdrop));
  home['1']=originalHome['1'].filter(n=>layers.has(n.d0)).map(n=>layers.get(n.d0));
  if(home['1'].length!==46)throw Error('unexpected_template');
  widget['3']='Widgy Home Minimal Backdrop Diagnostic';
  widget['4']='Compared with Minimal Native Data, restore only the original Approved Glass / Chrome and Frames image layer, with its exact web URL, frame, rendering options and original drawing order. Home count 45 to 46. All 80 variables and sources, live text, approved clock, existing layers, other tabs and navigation stay identical. Map, progress fills, weather-icon alternatives and remaining static icons are still absent. This tests the complete backdrop image path and its interactions, including possible fetching, decoding and rendering; it does not isolate network latency or prove a permanent fix. Keep this private export private.';
  return widget;
}

// Experimental data-URL transport. Widgy display support must be confirmed on
// the phone before timing this copy; a missing image invalidates the comparison.
export function withMinimalHomeEmbeddedBackdrop(original,dataURL){
  if(typeof dataURL!=='string' || dataURL.length!==82658 ||
      !dataURL.startsWith('data:image/png;base64,iVBORw0KGgo') ||
      !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(dataURL))throw Error('backdrop_image_failed');
  const widget=withMinimalHomeBackdrop(original);
  widget['1'].find(n=>n.s==='HOME')['1'].find(n=>n.d0===80309)['2']=dataURL;
  widget['3']='Widgy Home Embedded Backdrop Trial';
  widget['4']='Compatibility and timing trial based on Minimal Backdrop. Only the Home glass/frames image source string changes from HTTPS to a data:image/png;base64 URL containing the byte-identical approved PNG. No new JavaScript source inside Widgy, no resampling, no layer/variable/source changes elsewhere. The copy page validates SHA-256 before embedding. Widgy support for this data URL is not yet verified on the phone. First confirm all glass/frames appear exactly as in Minimal Backdrop; if missing or altered, report incompatibility and do not interpret faster switching as an improvement. If appearance matches, compare repeated transitions with Minimal Backdrop. This isolates source transport and its interactions, not a measured network request count or proven fix. Keep this private export private.';
  return widget;
}

// Restore all remaining artwork to the confirmed embedded-image control.
// Use the repaired normal template so the approved cumulative ring is correct.
export function withCompleteHomeArtwork(original,dataURL){
  const originalHome=original['1'].find(n=>n.s==='HOME');
  const rings=originalHome?.['1'].filter(n=>/^Steps Goal Ring · \d+%$/.test(n.s));
  if(rings?.length!==100 || rings.some(n=>n.o1?.['1']!==5))throw Error('unexpected_template');
  const widget=withMinimalHomeEmbeddedBackdrop(original,dataURL);
  const home=widget['1'].find(n=>n.s==='HOME');
  const retained=new Map(home['1'].map(n=>[n.d0,n]));
  const added=originalHome['1'].filter(n=>!retained.has(n.d0) && n.s!=='Home Hero World Map');
  const walk=ns=>ns.flatMap(n=>[n,...(n.z==='13'?walk(n['1']):[])]);
  const nodes=walk(added);
  // The legacy 1x1 sun is a literal text glyph, not a live weather source.
  const staticSun=n=>n.d0===6130 && n.z==='1' && n.s==='Weather Sun' &&
    n['66']?.length===1 && n['66'][0]['5']==='Custom Text' && n['66'][0]['25']==='☀︎';
  if(nodes.length!==342 || nodes.some(n=>!['2','4','13'].includes(n.z) && !staticSun(n)) ||
      added.filter(n=>n.s?.startsWith('WX · ')).length!==14 ||
      added.filter(n=>/^Day Progress Fill · \d+%$/.test(n.s)).length!==100)throw Error('unexpected_template');
  for(const n of added)retained.set(n.d0,structuredClone(n));
  home['1']=originalHome['1'].filter(n=>retained.has(n.d0)).map(n=>retained.get(n.d0));
  if(walk(home['1']).length!==388)throw Error('unexpected_template');
  widget['3']='Widgy Home Complete Artwork Diagnostic';
  widget['4']='Compared with the visually confirmed Embedded Backdrop trial, restore all remaining original Home graphics: 100 cumulative steps-ring segments, 100 day-progress fills, 14 weather-icon alternatives containing 137 nodes, and five static graphic layers. Home count 46 to 388. Use the approved repaired >= steps-ring conditions, not the old diagnostic equality transform. Every existing layer, the embedded byte-identical backdrop, all 80 variables and sources, other tabs and navigation are unchanged. No map/map_request or custom city lookup restored; Calendar city remains TEST. Tests the entire remaining artwork group and its interactions with live data, not individual drawings or a proven optimization. The regular full export remains unchanged. Keep this private export private.';
  return widget;
}

// Add the original map pipeline to the full-artwork control, keeping the
// independent Calendar city lookup frozen so it does not confound the result.
export function withCompleteHomeMap(original,dataURL){
  const widget=withCompleteHomeArtwork(original,dataURL);
  const originalHome=original['1'].find(n=>n.s==='HOME');
  const maps=originalHome['1'].filter(n=>n.s==='Home Hero World Map'),map=maps[0];
  const vars=original['36'].filter(v=>v['1']==='map_request'),request=vars[0];
  if(maps.length!==1 || map.z!=='5' || map['1']!=='Web URL' || map['2']!=='${widgy.map_request}' ||
      vars.length!==1 || request['3']['66']?.length!==1 ||
      request['3']['66'][0]['6']!=='Async + No main()')throw Error('unexpected_template');
  const home=widget['1'].find(n=>n.s==='HOME');
  const layers=new Map(home['1'].map(n=>[n.d0,n]));
  const variables=new Map(widget['36'].map(v=>[v['0'],v]));
  if(layers.has(map.d0) || variables.has(request['0']))throw Error('unexpected_template');
  layers.set(map.d0,structuredClone(map));
  variables.set(request['0'],structuredClone(request));
  home['1']=originalHome['1'].map(n=>layers.get(n.d0));
  widget['36']=original['36'].map(v=>variables.get(v['0']));
  if(home['1'].some(n=>!n) || widget['36'].some(v=>!v) || widget['36'].length!==81)throw Error('unexpected_template');
  widget['3']='Widgy Home Map Add-Back Diagnostic';
  widget['4']='Compared with Complete Artwork, restore only the original Home Hero World Map image and its exact map_request variable/script, in original layer/variable order. Home count 388 to 389 and variable count 80 to 81. The map uses its existing native location inputs, client-side city lookup and server-rendered lossless image pipeline. No map renderer, API, assets or cache changes. The independent Calendar city lookup remains the literal TEST; all other variables/sources, embedded backdrop, artwork, approved clock and navigation are identical to Complete Artwork. Wait until the map is actually visible before comparing repeated Calendar-to-Home transitions; distinguish initial image load from repeated switching. This tests the whole map pipeline and its interactions, not a specific server/network/rendering cost. Keep this private export private.';
  return widget;
}

// Keep the complete map layer and variable identity, but replace its dynamic
// script with a static PNG URL. The image still loads/decodes through Web URL.
export function withCompleteHomeStaticMap(original,dataURL){
  const widget=withCompleteHomeMap(original,dataURL);
  const request=widget['36'].find(v=>v['1']==='map_request');
  request['3']['66']=[{'5':'Custom Text','6':'Text','25':'https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/assets/diagnostics/Home_Map_Static_3306x1558.png'}];
  widget['3']='Widgy Home Static Map Diagnostic';
  widget['4']='Compare with the much slower Map Add-Back copy. Only map_request source changes: replace the original asynchronous map URL/geocoder script with a literal URL to a prebuilt public 3306x1558 lossless PNG from the exact approved renderer/assets, glass/r6, fixed 2026-10-04T06:00Z, no location marker/city. The map layer, frame, Web URL provider, all 81 variable identities, other sources, artwork, clock and embedded backdrop are unchanged. Native GPS variables remain, but the custom map script does not run; the static file requires no per-request map render or time-bucket URL change. Calendar city remains TEST. The still image intentionally has fixed day/night and no personal location. First ensure it appears, then compare repeated transitions. This broad comparison includes script, geocoder, URL/cache behavior and server rendering; it does not separate those costs or prove a specific cause. Static and dynamic images are not pixel-identical because time/location differ. Keep this private export private.';
  return widget;
}

// Approved only for a separate resolution diagnostic, not the regular export.
export function withCompleteHomeStaticMap1653(original,dataURL){
  const widget=withCompleteHomeStaticMap(original,dataURL);
  const source=widget['36'].find(v=>v['1']==='map_request')['3']['66'][0];
  source['25']=source['25'].replace('Home_Map_Static_3306x1558.png','Home_Map_Static_1653x779.png');
  widget['3']='Widgy Home Static Map 1653 Diagnostic';
  widget['4']='Resolution diagnostic authorized only for testing on 2026-10-04. Compare with Static Map (option A): only the literal map image URL changes to a 1653x779 Lanczos3 resize of the exact existing 3306x1558 public static PNG. Same fixed time, no location/city, same image provider/binding/frame, 81 variables, other data sources, artwork, clock, tabs and navigation. PNG encoding is lossless but resizing removes detail; this is not pixel-identical to the master. Tests image-size-related transfer, decoding, scaling and memory costs together, not a measured decoder or memory bottleneck alone. After the complete image appears, compare three Calendar-to-Home transitions in the same slot/network against option A; also report visible quality and Widgy Images counter. Approved masters, normal full-resolution export and live endpoint defaults are unchanged. Do not promote without explicit approval. Keep this private export private.';
  return widget;
}

// A byte-identical static PNG control, carried inside the private export.
// Keep the image/variable binding and all other fields. This changes transport
// and data-URL handling together, not the renderer or the pixel workload.
export function withCompleteHomeEmbeddedStaticMap(original,dataURL,mapDataURL){
  if(typeof mapDataURL!=='string' || mapDataURL.length!==5433978 ||
      !mapDataURL.startsWith('data:image/png;base64,iVBORw0KGgo'))throw Error('static_map_image_failed');
  const widget=withCompleteHomeStaticMap(original,dataURL);
  widget['36'].find(v=>v['1']==='map_request')['3']['66'][0]['25']=mapDataURL;
  widget['3']='Widgy Home Embedded Static Map Trial';
  widget['4']='Compare only with Static Map: replace its one literal HTTPS map_request source with a data:image/png;base64 URL containing the exact same public fixed-time PNG. Copy page verifies SHA-256 and byte count before embedding. Same 3306x1558 lossless image, no resizing/re-encoding, same single Custom Text source, image binding/frame, all 81 variables and remaining sources/layers, full approved artwork/clock, embedded backdrop and navigation. Both comparison maps deliberately have fixed 2026-10-04T06:00Z day/night and no personal marker/city; Calendar city stays TEST. No live GPS/script/geocoder is consumed by either map. Larger export adds about 5.4 MB of text; import, variable interpolation and data-URL handling may introduce their own cost. Confirm the whole map displays in both copies before timing three repeated Calendar-to-Home transitions in the same slot/network after initial loading. Embedded backdrop support does not prove support for this much larger image. A faster result implicates transport/data-source handling together; equal speed does not prove a specific decoding, memory or layer cause. Diagnostic only, not a final static map replacement. No server, renderer, normal-export or quality change. Keep this private export private.';
  return widget;
}

// Preserve the existing map URL builder/runtime mode, but finish immediately
// with GPS and no city instead of waiting for a client reverse-geocoder.
export function withCompleteHomeMapWithoutCityFetch(original,dataURL){
  const widget=withCompleteHomeMap(original,dataURL);
  const source=widget['36'].find(v=>v['1']==='map_request')['3']['66'][0];
  const script=source['10'];
  const marker='  // Best effort within a surviving JS context only.';
  const start=script.indexOf(marker),call=script.lastIndexOf('\ncityMapRuntime(');
  if(start<0 || start!==script.lastIndexOf(marker) || call<=start ||
      !script.startsWith('function cityMapRuntime(') ||
      !script.slice(start,call).includes('reverse-geocode-client'))throw Error('unexpected_template');
  source['10']=script.slice(0,start)+"  finish(mapURL(''));\n}"+script.slice(call);
  if(source['10'].includes('fetch(') || source['10'].includes('reverse-geocode-client'))throw Error('unexpected_template');
  widget['3']='Widgy Home Live Map No City Fetch Diagnostic';
  widget['4']='Compared with Map Add-Back, change only map_request script: retain the exact coordinate parser/input arguments, endpoint, minute URL bucket, reuse=60, sendToWidgy completion and Async + No main() provider, but replace the city cache/fetch block with immediate finish(mapURL(empty city)). Live GPS marker and day/night server rendering remain; no custom reverse-geocoder request runs. The map temporarily displays short coordinates instead of a city name. Calendar city remains TEST. All 81 variable identities, other sources, map layer/frame, approved artwork/clock and embedded backdrop stay unchanged. Compare repeated transitions after the live map appears, especially against the faster Static Map. This isolates waiting for the client city cache/fetch path relative to the original dynamic control, not all map/network costs. Device appearance, timing and updates still require confirmation. Keep this private export private.';
  return widget;
}

// Compare Widgy runtime modes while preserving the existing URL builder.
// All work in the no-city control is synchronous already; only completion
// changes from sendToWidgy in Async mode to main() returning in Script mode.
export function withCompleteHomeSynchronousMap(original,dataURL){
  const widget=withCompleteHomeMapWithoutCityFetch(original,dataURL);
  const source=widget['36'].find(v=>v['1']==='map_request')['3']['66'][0];
  const script=source['10'];
  const completion='sendToWidgy(url);';
  if(source['5']!=='Javascript' || source['6']!=='Async + No main()' ||
      script.split(completion).length!==2 || script.includes('mapResult') ||
      script.includes('function main('))throw Error('unexpected_template');
  source['6']='Script';
  source['10']="function main() {\n  var mapResult = '';\n"+
    script.replace(completion,'mapResult = url;')+'\n  return mapResult;\n}';
  widget['3']='Widgy Home Synchronous Map Diagnostic';
  widget['4']='Compare with Live Map No City Fetch, which returned extreme slowness. Change only map_request runtime/completion: Javascript Script with main() returning the URL, instead of Async + No main() with sendToWidgy. Preserve the exact coordinate parser and max5 input arguments, live endpoint, width=3306, glass/r6, reuse=60 and minute timestamp bucket. Neither copy fetches a city; short coordinates temporarily replace the city label. Preserve all 81 variable identities, remaining sources, map binding/frame, complete approved artwork/clock, embedded backdrop and navigation. Calendar city remains TEST. First confirm the live map and location marker appear, then compare repeated Calendar-to-Home transitions against No City Fetch in the same slot/network. Synthetic equivalence tests do not establish actual Widgy runtime behavior or improved speed. Normal export unchanged; keep this private export private.';
  return widget;
}

// Remove only the time-driven URL change from the visible-but-slow Script
// control. GPS still keys the URL, so movement/jitter may change it. The server
// uses its own current time; Widgy's refresh cadence is unverified here.
export function withCompleteHomeStableMapURL(original,dataURL){
  const widget=withCompleteHomeSynchronousMap(original,dataURL);
  const source=widget['36'].find(v=>v['1']==='map_request')['3']['66'][0];
  const timedURL="    var instant = Date.now();\n"+
    "    var stamp = reuseSeconds === 60 ? Math.floor(instant / 60000) * 60000 : instant;\n"+
    "    return base + (city ? '&city=' + encodeURIComponent(city) : '') + '&t=' + stamp;";
  if(source['6']!=='Script' || source['10'].split(timedURL).length!==2)throw Error('unexpected_template');
  source['10']=source['10'].replace(timedURL,"    return base + (city ? '&city=' + encodeURIComponent(city) : '');");
  widget['3']='Widgy Home Stable Map URL Diagnostic';
  widget['4']='Compare with Synchronous Map, whose map/marker displayed but transitions stayed slow. Change only map_request mapURL(): remove Date.now/minute-bucket calculation and t query parameter. Retain synchronous Script/main() completion, exact coordinate parser/max5 inputs, live endpoint, full 3306 lossless PNG, glass/r6 and reuse=60. URL is stable only while coordinates stay identical; GPS movement/jitter still changes it. The server uses current time independently of t; its existing at-most-60-second private cache and revalidation policy remain unchanged. Widgy may keep a stable-URL image longer, so automatic day/night refresh must be established before promotion. Keep all 81 variables, remaining sources/layers, approved artwork/clock, embedded backdrop and navigation unchanged. Short coordinates still replace map city; Calendar city remains TEST. Wait for map/marker, compare three consecutive Calendar-to-Home transitions and one more after a minute. Missing map/marker invalidates speed comparison. No server changes or proven fix; normal export unchanged. Keep this private export private.';
  return widget;
}

// Keep the working synchronous GPS URL builder byte-for-byte. Append native
// city as text data, never as interpolated JavaScript. The existing API treats
// city_text as the final query tail. Mixed-source image binding needs a phone
// compatibility check; the earlier all-native URL composition was blank.
// FAILED ON DEVICE 2026-10-04: map did not load. Retained for reproducible
// comparison only; the copy page now routes this mode to Stable Map URL.
export function withCompleteHomeStableNativeCity(original,dataURL){
  const widget=withCompleteHomeStableMapURL(original,dataURL);
  const matches=widget['36'].filter(v=>v['1']==='calendar_native_city');
  const native=matches[0]?.['3']?.['66'];
  const request=widget['36'].find(v=>v['1']==='map_request');
  if(matches.length!==1 || native?.length!==1 || native[0]['5']!=='Location' || native[0]['6']!=='City' ||
      request['3']['66'].length!==1 || request['3']['66'][0]['6']!=='Script')throw Error('unexpected_template');
  request['3']['66'].push({'5':'Custom Text','6':'Text','25':'&city_text='},structuredClone(native[0]));
  widget['3']='Widgy Home Stable Native City Trial';
  widget['4']='Compatibility-first restoration based on Stable Map URL, which displayed the live GPS marker and was reported slightly faster. Preserve its exact synchronous Script/main() URL source, native max5 coordinates, stable URL and all existing variables/layers. Append only literal &city_text= and native Location/City as two text sources in map_request. City is data outside JavaScript; no custom city fetch, city code interpolation or new variable. Unlike the earlier blank all-native composition, the GPS URL still comes from the working synchronous builder. Mixed Script/Text/Location composition in an image-bound variable is not yet verified in Widgy and may still fail; first confirm map, actual marker and correct city before timing. Same full 3306 lossless PNG, approved artwork/clock, embedded backdrop and navigation. Calendar city remains TEST. Compare three Calendar-to-Home transitions against Stable Map URL in the same slot/network, then again after a minute. Native city spelling/language, GPS/city synchrony and automatic day/night refresh still need device verification. No server, cache-policy or normal-export changes; this is not a confirmed speed fix. Keep this private export private.';
  return widget;
}

// Keep the same stable-URL script and marker rendering, but remove its native
// GPS substitutions. Use an explicit synthetic location, never user GPS.
// Native location variables elsewhere remain unchanged in this comparison.
export function withCompleteHomeFixedLocationMap(original,dataURL){
  const widget=withCompleteHomeStableMapURL(original,dataURL);
  const source=widget['36'].find(v=>v['1']==='map_request')['3']['66'][0];
  const names=['map_latitude_max5','map_longitude_max5','Latitude','Longitude'];
  for(const name of names){
    const token=JSON.stringify('${widgy.'+name+'}');
    if(source['10'].split(token).length!==2)throw Error('unexpected_template');
    source['10']=source['10'].replace(token,JSON.stringify('0'));
  }
  if(source['10'].includes('${widgy.'))throw Error('unexpected_template');
  widget['3']='Widgy Home Fixed Location Map Diagnostic';
  widget['4']='Compare with Stable Map URL, reported only slightly improved. Replace only the four native coordinate substitutions in map_request with literal strings 0: latitude/longitude max5 and both fallback arguments. Keep the exact synchronous Script/main() body, coordinate parser, live endpoint, reuse=60, absent time stamp, full 3306 lossless PNG and glass/r6 rendering. The map marker and short label intentionally show synthetic 0,0, not the device location. No user GPS is captured or embedded. All 81 variable definitions, including native location providers, and remaining sources/layers stay unchanged, so other widget location work may still run. Preserve approved clock/artwork, embedded backdrop and navigation; Calendar city stays TEST. Wait for the map and example marker before comparing three consecutive Calendar-to-Home transitions and another after a minute in the same slot/network. This removes map-script GPS substitution/availability and coordinate-driven URL/cache variation together; improvement would not separate those costs or prove GPS acquisition alone is responsible. Widgy live-image refresh remains unverified with a stable URL. No API/renderer/normal-export changes; diagnostic only. Keep this private export private.';
  return widget;
}

// Remove the map JavaScript provider while requesting the exact same image
// URL as Fixed Location Map. Parse generated JSON arguments; never eval code.
export function withCompleteHomeDirectFixedMap(original,dataURL){
  const widget=withCompleteHomeFixedLocationMap(original,dataURL);
  const request=widget['36'].find(v=>v['1']==='map_request');
  const source=request['3']['66'][0];
  const call=source['10'].match(/\ncityMapRuntime\(([^\n]+)\);\n  return mapResult;\n}$/);
  let args;
  try{args=call && JSON.parse('['+call[1]+']');}catch{throw Error('unexpected_template');}
  if(source['6']!=='Script' || !args || args.length!==8 || args[0]!=='0' || args[1]!=='0' ||
      args[3]!==true || args[4]!=='0' || args[5]!=='0' || args[6]!==60)throw Error('unexpected_template');
  const endpoint=new URL(args[2]);
  if(endpoint.protocol!=='https:' || endpoint.pathname!=='/api/night-map' ||
      endpoint.searchParams.get('width')!=='3306' || endpoint.searchParams.get('reuse')!=='60' ||
      ['lat','lon','t','at','city','city_text'].some(key=>endpoint.searchParams.has(key)))throw Error('unexpected_template');
  request['3']['66']=[{'5':'Custom Text','6':'Text','25':args[2]+'&lat=0&lon=0'}];
  widget['3']='Widgy Home Direct Fixed Map Diagnostic';
  widget['4']='Compare with Fixed Location Map, reported the same speed with no additional slowdown. Replace only map_request source from Javascript Script/main() to Custom Text/Text containing the exact URL returned by that script. Same live endpoint, literal synthetic 0,0 marker and short label, width=3306 lossless PNG, glass/r6, reuse=60 and no time stamp. No map-script execution, coordinate substitution or city fetch. All 81 variable identities and other sources, native location definitions, map image binding/frame, complete approved artwork/clock, embedded backdrop and navigation stay identical; Calendar city remains TEST. Wait for map and example marker, then compare repeated Calendar-to-Home transitions in the same slot/network against Fixed Location Map. URL equality isolates the map source provider and its interactions, not all widget JavaScript or GPS work. Server image/cache and native image decoding remain possible costs; time of request and cache history may differ. Fixed location and unverified stable-URL refresh are diagnostic only. No server, renderer or normal-export changes. Keep this private export private.';
  return widget;
}

// Isolate the image's variable substitution from the literal Web URL path.
// Keep the now-unused literal variable and all native providers unchanged.
export function withCompleteHomeDirectImageURL(original,dataURL){
  const widget=withCompleteHomeDirectFixedMap(original,dataURL);
  const maps=widget['1'].find(n=>n.s==='HOME')?.['1'].filter(n=>n.s==='Home Hero World Map');
  const requests=widget['36'].filter(v=>v['1']==='map_request');
  const sources=requests[0]?.['3']?.['66'];
  const url=sources?.[0]?.['25'];
  if(maps?.length!==1 || maps[0].z!=='5' || maps[0]['1']!=='Web URL' ||
      maps[0]['2']!=='${widgy.map_request}' || requests.length!==1 ||
      sources?.length!==1 || sources[0]['5']!=='Custom Text' || sources[0]['6']!=='Text' ||
      typeof url!=='string' || url.includes('${') || !url.endsWith('&lat=0&lon=0'))throw Error('unexpected_template');
  maps[0]['2']=url;
  widget['3']='Widgy Home Direct Image URL Diagnostic';
  widget['4']='Compare only with Direct Fixed Map. Change one Home Hero World Map image field from ${widgy.map_request} to the exact literal URL stored in that variable. Keep all 81 variable definitions, including now-unused literal map_request and native coordinates, so variable removal is not combined with binding removal. Same Web URL provider/options/frame, live synthetic 0,0 marker, full 3306x1558 lossless renderer, remaining layers/data, approved clock/artwork, embedded backdrop and navigation; Calendar city TEST. No request, cache, server or normal-export changes. Earlier local-file static map did not show improvement, but changed the provider and transport as well; no speed expectation is established. Confirm map and example marker before three Calendar-to-Home transitions in the same slot/network against Direct Fixed Map. Tests image variable substitution and its native handling, not GPS-off or a demonstrated cache defect. Other location sources remain; fixed marker and stable-URL refresh are diagnostic only. Keep this private export private.';
  return widget;
}

// Earlier fixed-coordinate trials kept these native providers defined. Remove
// only providers that have no remaining name or UUID references in this copy.
// Other location-dependent sources stay active: this is not a GPS-off widget.
export function withCompleteHomeUnusedGPSOff(original,dataURL){
  const widget=withCompleteHomeDirectFixedMap(original,dataURL);
  const removed=[];
  for(const [name,field] of [
    ['Latitude','Latitude (Decimal)'],['Longitude','Longitude (Decimal)'],
    ['map_latitude_max5','Latitude (Decimal)'],['map_longitude_max5','Longitude (Decimal)']
  ]){
    const matches=widget['36'].filter(v=>v['1']===name),v=matches[0];
    const sources=v?.['3']?.['66'];
    if(matches.length!==1 || typeof v['0']!=='string' || !v['0'] ||
        sources?.length!==1 || sources[0]['5']!=='Location' || sources[0]['6']!==field)throw Error('unexpected_template');
    removed.push(v);
  }
  widget['36']=widget['36'].filter(v=>!removed.includes(v));
  const rest=JSON.stringify(widget),folded=rest.toLowerCase();
  for(const v of removed){
    if(rest.includes('${widgy.'+v['1']+'}') || folded.includes(v['0'].toLowerCase()))throw Error('unexpected_template');
  }
  widget['3']='Widgy Home Unused GPS Off Diagnostic';
  widget['4']='Compare only with Direct Fixed Map. Remove its four unreferenced native coordinate variable definitions: Latitude, Longitude, map_latitude_max5 and map_longitude_max5. Variable count 81 to 77. Export fails if any name-token or UUID reference remains. Same literal map_request, image binding, live synthetic 0,0 URL, full 3306x1558 lossless renderer, all layers, approved artwork/clock, other providers and navigation. Calendar city remains TEST; its native City fallback and other location-dependent weather/sun sources remain, so this does not disable all location work. Whether Widgy evaluates unused coordinate definitions is unknown. First confirm map and example marker, then compare three Calendar-to-Home transitions against the unchanged control in the same slot/network after initial loading. This isolates removing unused definitions, not the browser geolocation API or all native GPS work. Fixed example marker and unverified stable-URL refresh are diagnostic only. Normal export and server unchanged. Keep this private export private.';
  return widget;
}

// Same public 0,0 image, with opt-in CDN delivery. Server admits only this
// exact synthetic query; ordinary real-location maps retain private caching.
export function withCompleteHomeCDNFixedMap(original,dataURL){
  const widget=withCompleteHomeDirectFixedMap(original,dataURL);
  const source=widget['36'].find(v=>v['1']==='map_request')['3']['66'][0];
  if(source['5']!=='Custom Text' || source['6']!=='Text' || !source['25'].endsWith('&lat=0&lon=0'))throw Error('unexpected_template');
  source['25']+='&cache=synthetic-60';
  widget['3']='Widgy Home CDN Fixed Map Diagnostic';
  widget['4']='Compare with Direct Fixed Map, reported no improvement. Append only cache=synthetic-60 to the same literal map_request URL. The server allows public CDN caching only for the exact synthetic 0,0/no-city/full-size/glass/r6 query, for the remaining original 60-second image lifetime; no stale extension. Ordinary real-location maps retain private/CDN-no-store behavior. Same renderer, lossless pixels/resolution, marker, image binding/frame, all variables and other sources/layers, approved clock/artwork, embedded backdrop and navigation. Calendar city TEST; marker is still the public example 0,0. No map JavaScript or GPS interpolation. Wait for map/marker, compare three repeated Calendar-to-Home transitions and one after a minute against Direct Fixed Map. Tests CDN delivery policy and interactions, not GPS or server region. Backend cache hits alone do not establish Widgy speed or refresh cadence. Fixed location is diagnostic only; normal export unchanged. Keep this private export private.';
  return widget;
}

// Keep the known faster literal-source path, requesting the existing live
// renderer instead of a prebuilt PNG. Empty coordinates prohibit IP fallback.
export function withCompleteHomeDirectLiveMap(original,dataURL){
  const widget=withCompleteHomeStaticMap(original,dataURL);
  widget['36'].find(v=>v['1']==='map_request')['3']['66'][0]['25']='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/api/night-map?mode=live&width=3306&presentation=glass&atlas=r6&reuse=60&lat=&lon=';
  widget['3']='Widgy Home Direct Live Map Diagnostic';
  widget['4']='Compare with the faster Static Map: change only its literal map_request URL from a prebuilt PNG to the unchanged live night-map endpoint, same width=3306/presentation=glass/atlas=r6, reuse=60, explicit empty lat/lon. No map JavaScript, city fetch, GPS interpolation or changing timestamp in this URL. Empty coordinates suppress the server IP-location fallback; no personal marker or city is displayed. Native GPS variables elsewhere are retained exactly, so this does not disable all widget location work. All 81 variables, all layers/frames and other data remain identical to Static Map. The server renders current day/night when requested; automatic refresh cadence inside Widgy with a stable URL is unverified and must not be treated as a finished live-update fix. Compare repeated transitions after the map appears. This separates a stable direct live-image URL from the broader slow client-driven pipeline, not script vs coordinates vs cache behavior individually. Keep this private export private.';
  return widget;
}

// Keep the proven single-variable image binding. Compose its URL using native
// text sources, without JS or nested interpolation. city_text is the last part.
export function withCompleteHomeNativeLocationMap(original,dataURL){
  const widget=withCompleteHomeDirectLiveMap(original,dataURL);
  const native=[];
  for(const [name,field] of [['map_latitude_max5','Latitude (Decimal)'],['map_longitude_max5','Longitude (Decimal)'],['calendar_native_city','City']]){
    const matches=widget['36'].filter(v=>v['1']===name);
    const sources=matches[0]?.['3']?.['66'];
    if(matches.length!==1 || sources?.length!==1 || sources[0]['5']!=='Location' || sources[0]['6']!==field)throw Error('unexpected_template');
    native.push(structuredClone(sources[0]));
  }
  const text=value=>({'5':'Custom Text','6':'Text','25':value});
  widget['36'].find(v=>v['1']==='map_request')['3']['66']=[
    text('https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/api/night-map?mode=live&width=3306&presentation=glass&atlas=r6&reuse=60&lat='),
    native[0],text('&lon='),native[1],text('&city_text='),native[2]
  ];
  widget['3']='Widgy Home Native Location Map 2';
  widget['4']='Second native-location trial after the first showed a blank map both in Widgy preview and on the Home Screen. Restore the unchanged image Web URL ${widgy.map_request}, the single-variable binding used by working controls. Relative to Direct Live Map, change only map_request sources: concatenate literal URL parts with native Location Latitude (Decimal), Longitude (Decimal) and City sources. No JavaScript, nested variable placeholders, custom external city fetch or timestamp. All 81 variable identities, remaining sources, all layers/frames, full-resolution renderer, artwork, clock, embedded backdrop and navigation remain unchanged. Calendar city stays TEST. Native coordinates use their own formatting; the separate max5 variables remain but their formatting is not applied to these new native source entries. city_text is last for the existing safe-tail parser. Device concatenation, URL encoding, coordinate format, city spelling/language, GPS/city synchrony and automatic day/night refresh remain unverified. Confirm the map, marker and correct city before testing speed; a missing map or marker invalidates the comparison. Keep this private export private.';
  return widget;
}

// Instrument the failed native source chain on-device. This is deliberately
// not a performance comparison: temporary readouts cover the clock/event area.
export function withHomeMapBindingProbe(original,dataURL){
  const widget=withCompleteHomeNativeLocationMap(original,dataURL);
  const home=widget['1'].find(n=>n.s==='HOME');
  const map=home['1'].find(n=>n.s==='Home Hero World Map');
  const request=widget['36'].find(v=>v['1']==='map_request');
  const reference=home['1'].find(n=>n.d0===6124);
  const background=home['1'].find(n=>n.d0===5001);
  if(!reference || !background || !Number.isInteger(widget.a2))throw Error('unexpected_template');
  const text=value=>({'5':'Custom Text','6':'Text','25':value});
  const tail=structuredClone(request);
  tail['0']='C5D5F231-73AF-48A7-B003-000000000001';tail['1']='map_probe_tail';
  if(widget['36'].some(v=>v['0']===tail['0'] || v['1']===tail['1']))throw Error('unexpected_template');
  tail['3'].s='Variable: map_probe_tail';tail['3']['66'][0]=text('lat=');
  widget['36'].push(tail);
  // One literal, location-free image request is the visual network control.
  // The failing composed URL is only displayed as text, never opened here.
  map['2']='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/api/night-map?mode=live&width=3306&presentation=glass&atlas=r6&reuse=60&lat=&lon=';
  const scalar=value=>({a:[{a:value,b:168,c:0,d:168}],b:0});
  const frame=(node,x,y,width,height)=>{
    node.b=scalar(x);node.c=scalar(y);node.d=scalar(width);node.e=scalar(height);
    return node;
  };
  const row=(name,sources,y,height=62)=>{
    const node=structuredClone(reference);
    node.d0=widget.a2++;node.s='Map Binding Probe · '+name;node['66']=sources;
    delete node.a;delete node.o1;delete node['28'];delete node['2'];
    return frame(node,75,y,1450,height);
  };
  const rows=[
    row('Title',[text('MAP BINDING CHECK - NOT A SPEED TEST')],482,52),
    row('Latitude',[text('1 LAT: ['),structuredClone(request['3']['66'][1]),text(']')],540),
    row('Longitude',[text('2 LON: ['),structuredClone(request['3']['66'][3]),text(']')],605),
    row('City',[text('3 CITY: ['),structuredClone(request['3']['66'][5]),text(']')],670),
    row('Tail',[text('4 JOIN: [${widgy.map_probe_tail}]')],735,60),
    row('URL Label',[text('5 ACTUAL URL BELOW:')],801,40),
    row('URL',[text('${widgy.map_request}')],848,44)
  ];
  const panel=structuredClone(background);panel.d0=widget.a2++;panel.s='Map Binding Probe · Panel';
  frame(panel,55,476,1490,443);
  home['1'].unshift(...rows,panel);
  widget['3']='Widgy Home Map Binding Check';
  widget['4']='Readout-only diagnostic after Native Location Map 2 also showed a blank map in Widgy preview. Preserve its native-composed map_request exactly; display native latitude, longitude and city, a short identically composed map_probe_tail variable, and the actual full map_request as text. No new JavaScript, external geocoder, private calendar endpoint readout, or telemetry. Change the map image to the known direct no-location URL as a visual control. Add one native probe variable and eight temporary overlay layers, covering clock/events only in this diagnostic copy. Values are visible on your device and any screenshot you choose to share. This is not a speed test and not the approved final design. A screenshot of this panel is needed to distinguish native source formatting, variable composition and image URL binding. Keep this private export private.';
  return widget;
}

// Start from the FULL, repaired normal export, not the earlier stripped probes.
// Leave every data source active: isolate the two sets of conditional drawings.
export function withoutHomeProgressArtwork(original){
  if(original['3']!=='Widgy Calendar Unified')throw Error('unexpected_template');
  const widget=structuredClone(original);
  const home=widget['1'].find(n=>n.s==='HOME');
  if(!home)throw Error('unexpected_template');
  const removed=new Set();
  for(const [prefix,variable,operator] of [
    ['Steps Goal Ring','steps_progress',5],
    ['Day Progress Fill','day_progress',0]
  ]){
    const vars=widget['36'].filter(v=>v['1']===variable);
    const nodes=home['1'].filter(n=>n.s?.startsWith(prefix+' · '));
    if(vars.length!==1 || nodes.length!==100)throw Error('unexpected_template');
    for(let p=1;p<=100;p++){
      const matches=nodes.filter(n=>n.s===`${prefix} · ${p}%`);
      const n=matches[0];
      if(matches.length!==1 || n.z!=='2' || n.o1?.['0']!==vars[0]['0'] ||
          n.o1['1']!==operator || n.o1['2']!==String(p))throw Error('unexpected_template');
      removed.add(n);
    }
  }
  home['1']=home['1'].filter(n=>!removed.has(n));
  widget['3']='Widgy Home Progress-Off Diagnostic';
  widget['4']='Temporary comparison against the FULL regular widget, including its original approved live clock. Only 100 Steps Goal Ring drawings and 100 Day Progress Fill drawings are removed. Their empty tracks, labels and numeric values remain. The map, real weather/fitness/calendar data, all variables, conditions on other layers, actions, other tabs and remaining artwork are identical to the regular export. No static test data, map/city removal, native-clock replacement or legacy ring transform. A faster result implicates these two drawing groups, not a particular group or proven optimization. Restore the normal widget after testing. Keep this private calendar export private.';
  return widget;
}

// Compare directly with the last Progress-Off copy. Weather data stays live;
// only the conditional icon artwork is removed from Home.
export function withoutHomeWeatherArtwork(original){
  const widget=withoutHomeProgressArtwork(original);
  const home=widget['1'].find(n=>n.s==='HOME');
  const groups=home['1'].filter(n=>n.z==='13' && n.s?.startsWith('WX · '));
  const walk=ns=>ns.flatMap(n=>[n,...(n.z==='13'?walk(n['1']):[])]);
  const nodes=walk(groups);
  if(groups.length!==14 || nodes.length!==137 ||
      nodes.filter(n=>n.z==='13' && n.o1).length!==91 ||
      nodes.some(n=>!['2','4','13'].includes(n.z)))throw Error('unexpected_template');
  const removed=new Set(groups);
  home['1']=home['1'].filter(n=>!removed.has(n));
  widget['3']='Widgy Home Weather-Art-Off Diagnostic';
  widget['4']='Final overnight comparison against Progress-Off: additionally remove only the 14 Home weather-icon alternatives, containing 91 conditional groups and 46 graphic layers (137 nodes). Weather text, temperatures, all actual data sources and variables, original live clock, map, remaining artwork and other tabs are unchanged. The two progress fills remain absent exactly as in Progress-Off. This isolates weather-icon artwork/evaluation, not the weather provider, and does not change the approved regular export. Keep private; restore the regular widget after testing.';
  return widget;
}
