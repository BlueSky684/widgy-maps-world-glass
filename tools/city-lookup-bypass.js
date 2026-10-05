// Isolate the two custom city lookup paths in the current full widget.
// This diagnostic intentionally uses a visibly artificial city label.
export function bypassCityLookups(original){
  if(original['3']!=='Widgy Native Steps Ring 2')throw Error('unexpected_template');
  const widget=structuredClone(original);
  for(const name of ['map_request','calendar_city_prefix']){
    const matches=widget['36'].filter(v=>v['1']===name);
    const sources=matches[0]?.['3']?.['66'];
    if(matches.length!==1 || sources?.length!==1 || sources[0]['5']!=='Javascript' ||
        sources[0]['6']!=='Async + No main()')throw Error('unexpected_template');
    const source=sources[0],script=source['10'];
    const marker='  // Best effort within a surviving JS context only.';
    const start=script?.indexOf(marker),call=script?.lastIndexOf('\ncityMapRuntime(');
    if(!script?.startsWith('function cityMapRuntime(') || start<0 ||
        start!==script.lastIndexOf(marker) || call<=start ||
        !script.slice(start,call).includes('reverse-geocode-client'))throw Error('unexpected_template');
    // Preserve coordinate parsing, missing-location handling, minute bucket,
    // original call arguments, native source mode and one-shot completion.
    // Both finish implementations remain exact: map URL vs Calendar prefix.
    source['10']=script.slice(0,start)+"  finish(mapURL('CITY TEST'));\n}"+script.slice(call);
    if(/fetch\s*\(|reverse-geocode-client|__homeGlassCityV1/.test(source['10']))throw Error('unexpected_template');
  }
  widget['3']='Widgy City Lookup Bypass 1';
  widget['4']='Temporary full-widget comparison against Native Steps Ring 2. Only the map_request and calendar_city_prefix JavaScript bodies change: bypass their custom city cache/fetch/validation path and return the artificial label CITY TEST immediately for valid coordinates. Keep native source mode, coordinate parsing, GPS inputs, original function arguments, minute refresh, live full-resolution map/marker, all 1514 layers and all 81 variable definitions/IDs. The displayed city label is intentionally not a real city. All other Home, Calendar, weather, steps and navigation settings remain unchanged. Compare both tab-transition directions after first map load. This isolates the combined custom city lookup paths, not a measured root cause or a finished replacement city mechanism. Keep this private export private.';
  return widget;
}
