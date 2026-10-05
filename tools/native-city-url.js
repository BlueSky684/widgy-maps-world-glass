import {bypassCityLookups} from './city-lookup-bypass.js?v=city-bypass-1';

// Compatibility trial after the owner reported both transitions much faster
// with City Lookup Bypass 1. City text never enters JavaScript source.
// FAILED ON DEVICE 2026-10-05: blank map in IMG_9894. Retain for reproducibility;
// the import page now uses withNativeCityRecovery instead.
export function withNativeCityURL(original){
  const widget=bypassCityLookups(original);
  const native=widget['36'].filter(v=>v['1']==='calendar_native_city');
  const sources=native[0]?.['3']?.['66'];
  const maps=widget['1'].find(n=>n.s==='HOME')?.['1'].filter(n=>n.s==='Home Hero World Map');
  if(native.length!==1 || sources?.length!==1 || sources[0]['5']!=='Location' ||
      sources[0]['6']!=='City' || maps?.length!==1 || maps[0].z!=='5' ||
      maps[0]['1']!=='Web URL' || maps[0]['2']!=='${widgy.map_request}')throw Error('unexpected_template');
  for(const name of ['map_request','calendar_city_prefix']){
    const source=widget['36'].find(v=>v['1']===name)['3']['66'][0];
    const target="  finish(mapURL('CITY TEST'));";
    if(source['10'].split(target).length!==2)throw Error('unexpected_template');
    source['10']=source['10'].replace(target,"  finish(mapURL(''));");
  }
  // The URL variable remains ONE proven JavaScript source. Append city only
  // in the image's Web URL field, outside script and outside mixed sources.
  // Keep city_text LAST for the existing safe-tail parser on the map endpoint.
  maps[0]['2']='${widgy.map_request}&city_text=${widgy.calendar_native_city}';
  // Returning an empty Calendar prefix activates its EXISTING native-city
  // fallback and Ashqelon -> Ashkelon spelling layer. No text geometry changes.
  widget['3']='Widgy Native City URL 1';
  widget['4']='Compatibility trial based on the faster City Lookup Bypass 1. Restore dynamic city using the existing native Location/City source, with no custom reverse-geocoder in either tab. Keep map_request as one immediate JavaScript source and append native city directly to the map image Web URL field as the final city_text value. No native city text is interpolated into JavaScript or mixed into the URL variable source list. Calendar uses its existing native fallback and Ashkelon spelling condition. All 1514 layers, 81 variable IDs, live GPS/map, original map frame, clock, weather, native steps ring, calendar and navigation retained. Multi-variable image URL resolution, native city availability/language, GPS/city synchrony and performance require phone verification; do not promote on source tests alone. Keep this private export private.';
  return widget;
}

// Narrow recovery from the failed trial: restore ONLY the known single-variable
// image binding, plus trial metadata. Keep native Calendar fallback and the same
// immediate no-geocoder scripts. Home temporarily labels its live coordinates.
export function withNativeCityRecovery(original){
  const widget=withNativeCityURL(original);
  const map=widget['1'].find(n=>n.s==='HOME')['1'].find(n=>n.s==='Home Hero World Map');
  if(map['2']!=='${widgy.map_request}&city_text=${widgy.calendar_native_city}')throw Error('unexpected_template');
  map['2']='${widgy.map_request}';
  widget['3']='Widgy Native City Recovery 1';
  widget['4']='Recovery diagnostic after Native City URL 1 produced a blank map on the phone. Change only its map image Web URL field back to the proven single ${widgy.map_request} binding, plus name/description. Both immediate JavaScript bodies, live coordinates, minute bucket, all 1514 layers/81 variables and design remain unchanged. No custom city lookup. Home temporarily displays the live GPS marker and coordinate label without a city name; Calendar retains its existing native City/Country fallback and Ashkelon spelling condition. This is not the finished city replacement. Confirm map, live marker and correct Calendar city before comparing transitions with City Lookup Bypass 1. The previous failed image load is not a valid speed baseline. Native restoration, city freshness/language and timing need phone confirmation. Keep this private export private.';
  return widget;
}
