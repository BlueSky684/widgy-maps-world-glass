import {withHomeSyncMapLean} from './home-sync-map-lean.js?v=home-sync-map-lean-1';

// Lean's retired custom-city path always emits ''. Its native city fallback
// already supplies Calendar. Keep that same value without GPS/async work here.
export function withCityPrefixClean(original){
  const widget=withHomeSyncMapLean(original);
  const matches=widget['36'].filter(v=>v['1']==='calendar_city_prefix');
  const sources=matches[0]?.['3']?.['66'],source=sources?.[0],code=source?.['10'];
  if(matches.length!==1 || sources?.length!==1 || source['5']!=='Javascript' ||
     source['6']!=='Async + No main()' || typeof code!=='string' ||
     /fetch\s*\(|reverse-geocode-client|__homeGlassCityV1/.test(code) ||
     code.split("finish(mapURL(''));").length!==3 ||
     code.split('finish(mapURL(').length!==3 ||
     !code.includes("sendToWidgy(city ? city + ', ' : '');"))throw Error('unexpected_template');
  const call=/\ncityMapRuntime\(([^\n]+)\);$/.exec(code);
  let args,url;
  try{args=JSON.parse('['+call[1]+']');url=new URL(args[2]);}
  catch{throw Error('unexpected_template');}
  if(args.length!==8 || args[3]!==true || args[6]!==60 || args[7]!==60 ||
     args[0]!=='${widgy.map_latitude_max5}' || args[1]!=='${widgy.map_longitude_max5}' ||
     args[4]!=='${widgy.Latitude}' || args[5]!=='${widgy.Longitude}' ||
     url.protocol!=='https:' || url.pathname!=='/api/night-map' ||
     url.searchParams.has('city') || url.hash)throw Error('unexpected_template');
  sources[0]={'5':'Custom Text','6':'Text','25':''};
  widget['3']='Widgy City Prefix Clean 1';
  widget['4']='Temporary matched comparison against Home Sync Map Lean 1. Replace only calendar_city_prefix source: its retired Async + No main() city script always returns empty text but still references four GPS fields. Supply that same empty value as Custom Text instead. Keep its variable ID, all 69 definitions and 1289 layers, existing native Calendar City/Country fallback and Ashkelon spelling, Home map/GPS synchronous script, minute timestamp, full lossless image, geometry and all navigation exactly unchanged. Home still has only map/navigation and a coordinate label, not restored city text. This removes an unnecessary source dependency and async job, not a measured network request or proven cause. Confirm native Calendar city/fallback and map before comparing both transition directions. Widgy empty-text substitution and speed need phone verification. Keep this private calendar export private.';
  return widget;
}
