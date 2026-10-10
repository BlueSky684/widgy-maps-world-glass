import assert from 'node:assert/strict';
import {polishHomeSolar} from './home-solar-polish.js';
export const PREVIEW='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app';
const scalar=(value,kind=160)=>({a:[{a:value,b:kind,c:0,d:kind}],b:0});
export function withWeatherPremium(source){
  const widget=structuredClone(source),weather=widget['1'].find(n=>n.d0===246),calendar=widget['1'].find(n=>n.d0===247),shared=widget['1'].find(n=>n.d0===83010),home=widget['1'].find(n=>n.d0===245);
  assert(weather&&calendar&&shared&&home,'Expected latest Lean Clock and Data widget');
  assert(source['36'].some(v=>v['1']==='calendar_refresh_minute'),'Expected existing Calendar minute clock');
  let id=84000;
  function clone(node){const n=structuredClone(node);function visit(n){n.d0=++id;n.s=n.s?.replace(/Calendar/g,'Weather');if(Array.isArray(n['1']))n['1'].forEach(visit);}visit(n);return n;}
  const taps=weather['1'].filter(n=>n.z==='11');assert.equal(taps.length,4);
  const top=shared['1'].filter(n=>n.z==='1'&&n.s?.startsWith('Header')).map(clone);
  const location=calendar['1'].filter(n=>[81871,83204,80338].includes(n.d0)).map(clone);
  assert.equal(location.length,3);
  // Reuse the real native menu, including exact Barlow font, symbol, frame and
  // selected color. Do not recreate it with the technical mockup's geometry.
  const nav=[
    ...calendar['1'].filter(n=>/^HOME Nav (Icon|Label)$/.test(n.s)),
    ...home['1'].filter(n=>/^CALENDAR Nav (Icon|Label)$/.test(n.s)),
    ...shared['1'].filter(n=>/^(WEATHER|FITNESS) Nav (Icon|Label)$/.test(n.s))
  ].map(clone);
  assert.equal(nav.length,8);
  const active=home['1'].find(n=>n.s==='HOME Nav Label').f;
  for(const n of nav)if(n.s.startsWith('WEATHER Nav'))n.f=active;
  // These proven native sources keep working with the existing paired-map and
  // native fallback city, including Ashkelon spelling; no new geocoder/variable.
  const image=(name,url,y,h)=>({z:'5',d0:++id,s:name,'1':'Web URL','2':url,'3':true,b:scalar(0),c:scalar(y*1600/1184),d:scalar(1600),e:scalar(h*1600/1184)});
  weather['1']=[...taps,...top,...location,...nav,
    image('Weather · Live current, six hours and five days',PREVIEW+'/api/weather-panel?lat=${widgy.map_latitude_max5}&lon=${widgy.map_longitude_max5}&v=10&refresh=${widgy.calendar_refresh_minute}',240,804),
    image('Weather · Approved glass with native navigation',PREVIEW+'/assets/weather-premium/chrome-r6.png',0,1184)];
  widget['3']='Widgy Weather Premium 10';
  widget['4']='Revision 10: approved option B raises main cloud and partly-cloudy icons 12 units from revision 9 and shrinks only standalone hourly sun 10%, preserving temperature positions and sizes. Revision 9.1: Weather image URL reuses the existing local Calendar minute clock to invalidate an unchanged image URL when Widgy evaluates it; automatic refresh cadence remains controlled by Widgy/iOS. Revision 9 design retained: main cloudy icon raised by 12 logical units; hourly icon-to-temperature gap increased from 10 to 16 units; hourly icon and temperature centered together by visible bounds, with equal highlight side padding; condition caption aligned with the temperature left edge; larger optically centered hourly and daily icons with bounded daily height; AQI-only caption; preserves bounded first-load AQI fix; cached AQI refreshes in the background; combined high/low cell; balanced current-conditions card, smaller temperature with attached Celsius unit, larger approved icon, compact aligned metrics, wind speed only. Original native navigation and enlarged forecast/rain icons retained. Approved Weather artwork and all eleven approved icons. Live Open-Meteo current conditions, next six model hours, and five-day forecast in Celsius/kmh. Shared forecast cache; native paired city/country and header. Home solar icons now distinguish sunrise/sunset with arrows, and native solar times are centered in the visible icon/track gaps. R6 atlas line intensity increased 5% under the existing night gate. Calendar, Fitness, all existing variables, live GPS/map and month navigation unchanged. Multiline full JSON copy. Keep Lean Clock and Data 1 as backup. On-device appearance and timing need verification.';
  widget.a2=Math.max(widget.a2,id);
  return polishHomeSolar(widget);
}
