import {withMapScriptConstant} from './map-script-constant.js?v=map-script-constant-1';

// Add the original minute-bucket URL suffix, with no native GPS dependencies.
export function withMapMinuteURL(original,origin){
  const widget=withMapScriptConstant(original,origin);
  const source=widget['36'][0]?.['3']?.['66']?.[0];
  const prefix='function main() {\n  return ',suffix=';\n}';
  if(widget['36'].length!==1 || source?.['5']!=='Javascript' || source['6']!=='Script' ||
      !source['10']?.startsWith(prefix) || !source['10'].endsWith(suffix))throw Error('unexpected_template');
  const baseURL=JSON.parse(source['10'].slice(prefix.length,-suffix.length));
  if(baseURL!==origin+'/api/night-map?mode=live&width=3306&presentation=glass&atlas=r6&reuse=60&lat=&lon=')
    throw Error('unexpected_template');
  source['10']='function main() {\n  var instant = Date.now();\n'+
    '  var stamp = Math.floor(instant / 60000) * 60000;\n'+
    '  return '+JSON.stringify(baseURL)+" + '&t=' + stamp;\n}";
  widget['3']='Widgy Map Minute URL 1';
  widget['4']='Temporary matched follow-up after Map Script Constant 1 was reported normal with no delays. Change only its synchronous script body to append t using the original epoch-millisecond minute bucket: Math.floor(Date.now()/60000)*60000. Identical within a minute and different at a minute boundary WHEN Widgy evaluates the source; this does not schedule refreshes or guarantee a network request every minute. Keep one variable, all 21 layers, image binding/frame/provider/cache flag/parent/order, navigation and every other field except trial name/description. No GPS, city, geocoder, fetch, timers or async completion. Same full lossless 3306x1558 PNG and explicit empty coordinates; existing server uses its own current time and ignores t for rendering/cache key. No backend/cache policy/provider change. This probes time-dependent URL evaluation and image cache/reload behavior together, not one proven cause. Compare after first map and a later return. Native freshness, source execution and timing remain unmeasured. Final location/city and full Home are not restored yet.';
  return widget;
}
