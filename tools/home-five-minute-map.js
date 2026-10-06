import {withMapSyncRecovery} from './native-city-url.js?v=map-sync-recovery-1';
import {withMapFiveMinuteURL} from './map-five-minute-url.js?v=map-five-minute-url-1';

// Restore full Home/Calendar around the exact source tested in Five Minute1.
// Reuse the known no-custom-geocoder full baseline. Never mutate the input.
export function withHomeFiveMinuteMap(original,origin){
  const widget=withMapSyncRecovery(original);
  const minimal=withMapFiveMinuteURL(original,origin);
  const variable=(w,name)=>{
    const matches=w['36'].filter(v=>v['1']===name);
    if(matches.length!==1)throw Error('unexpected_template');
    return matches[0];
  };
  const map=w=>w['1'].find(n=>n.s==='HOME')?.['1'].find(n=>n.s==='Home Hero World Map');
  if(!map(widget) || JSON.stringify(map(widget))!==JSON.stringify(map(minimal)))
    throw Error('unexpected_template');
  for(const name of ['map_latitude_max5','map_longitude_max5'])
    if(JSON.stringify(variable(widget,name))!==JSON.stringify(variable(minimal,name)))
      throw Error('unexpected_template');
  const target=variable(widget,'map_request'),tested=variable(minimal,'map_request');
  const restored=structuredClone(tested);
  restored['3']['66'][0]['10']=target['3']['66'][0]['10'];
  if(JSON.stringify(restored)!==JSON.stringify(target))throw Error('unexpected_template');
  target['3']['66'][0]['10']=tested['3']['66'][0]['10'];
  widget['3']='Widgy Home Five Minute Map 1';
  widget['4']='Full-widget integration candidate after the owner reported advancing MAP TIME and relatively fast transitions without serious slowdown in minimal Map Five Minute1 on 2026-10-06. Preserve the complete Map Sync Recovery1 baseline: 1514 layers, 81 variables and IDs, Home design/clock/weather/fitness, Calendar content/month navigation/native city fallback, and Weather/Fitness placeholder tabs. Replace only the map_request script with the exact tested Five Minute1 source, plus trial metadata. Keep the identical cached Web URL image and native primary coordinate definitions, full3306x1558 lossless PNG, diagnostic timestamp, private reuse60 and current server. Both custom city lookup paths remain bypassed; Home temporarily displays coordinates, not the final city label. No new asynchronous map work, network source, timer, animation setting or data provider. Same coordinates keep the URL inside a five-minute wall-clock bucket; coordinate changes can change it sooner. Native evaluation/refresh cadence, image retention, first-load delay and full-widget speed remain unverified. MAP TIME must advance without regression during ordinary use. Keep the fast minimal control and this personalized calendar export private.';
  return widget;
}
