import {withMapRefreshClock} from './map-refresh-clock.js?v=map-refresh-clock-1';

// Test a coarser image identity boundary; this is not a background timer.
export function withMapFiveMinuteURL(original,origin){
  const widget=withMapRefreshClock(original,origin);
  const source=widget['36'].find(v=>v['1']==='map_request')['3']['66'][0];
  const bucket='Math.floor(instant / 60000) * 60000';
  const end='encodeURIComponent(lon));';
  if(source['10'].split(bucket).length!==2 || source['10'].split(end).length!==2)
    throw Error('unexpected_template');
  source['10']=source['10']
    .replace(bucket,'Math.floor(instant / 300000) * 300000')
    .replace(end,"encodeURIComponent(lon)) + '&t=' + stamp;");
  widget['3']='Widgy Map Five Minute 1';
  widget['4']='Diagnostic candidate after the stable cached map showed old pixels and manual Web URL (No Caching) showed a new bitmap with some perceived delay. Start from the known original cached Refresh Clock1 export, not an unverified phone JSON edit. Change only the synchronous map_request script and trial metadata: emit t using a five-minute epoch bucket, with exact original native coordinates and parser. Same21 layers/three variables, image provider/frame/cache flag, navigation, diagnostic timestamp, full3306x1558 lossless PNG and server/private reuse60 policy. No city/geocoder/fetch/timer/async callback or new source. A constant coordinate pair gives the same URL within a bucket and a new URL at the next boundary WHEN Widgy evaluates the script; this does not schedule five-minute updates or guarantee a new request, background loading, current location or fast first return. Coordinate changes can change the URL sooner. The server ignores t for solar time/cache key and uses its actual render time; a new URL may still receive a <=60-second cached server bitmap. Navigation freshness regression and occasional reload delay remain device gates. This tradeoff trial is not a proven final fix or restoration of full Home.';
  return widget;
}
