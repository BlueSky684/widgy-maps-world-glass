import assert from 'node:assert/strict';
export const PREVIEW='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app';
const scalar=(value,kind=160)=>({a:[{a:value,b:kind,c:0,d:kind}],b:0});
export function withWeatherPremium(source){
  const widget=structuredClone(source),weather=widget['1'].find(n=>n.d0===246),calendar=widget['1'].find(n=>n.d0===247),shared=widget['1'].find(n=>n.d0===83010),home=widget['1'].find(n=>n.d0===245);
  assert(weather&&calendar&&shared&&home,'Expected latest Lean Clock and Data widget');
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
    image('Weather · Live current, six hours and five days',PREVIEW+'/api/weather-panel?lat=${widgy.map_latitude_max5}&lon=${widgy.map_longitude_max5}&v=4',240,804),
    image('Weather · Approved glass with native navigation',PREVIEW+'/assets/weather-premium/chrome-r4.png',0,1184)];
  widget['3']='Widgy Weather Premium 4';
  widget['4']='Revision 4: numerical US AQI from CAMS/Open-Meteo with independent background refresh; combined high/low cell; balanced current-conditions card, smaller temperature with attached Celsius unit, larger approved icon, compact aligned metrics, wind speed only. Original native navigation and enlarged forecast/rain icons retained. Approved Weather artwork and all eleven approved icons. Live Open-Meteo current conditions, next six model hours, and five-day forecast in Celsius/kmh. Shared forecast cache; native paired city/country and header. Home, Calendar, Fitness, all existing variables, live GPS/map and month navigation unchanged. Multiline full JSON copy. Keep Lean Clock and Data 1 as backup. On-device appearance and timing need verification.';
  widget.a2=Math.max(widget.a2,id);
  return widget;
}
