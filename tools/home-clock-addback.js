import assert from 'node:assert/strict';
import {withHomeWeatherAddback} from './home-weather-addback.js';
export const CLOCK_IDS=new Set([6190,6101,6102,80103,80104,80105,6103,6104,80312,80313,6105,6110]);
export function withHomeClockAddback(full){
 const widget=withHomeWeatherAddback(full),home=widget['1'].find(n=>n.d0===245),original=full['1'].find(n=>n.d0===245);
 const existing=new Map(home['1'].map(n=>[n.d0,n]));
 home['1']=original['1'].filter(n=>existing.has(n.d0)||CLOCK_IDS.has(n.d0)).map(n=>existing.get(n.d0)??structuredClone(n));
 assert.equal(home['1'].filter(n=>CLOCK_IDS.has(n.d0)).length,12);
 widget['3']='Widgy Home Clock Addback Test 1';
 widget['4']='Paired with Home Weather Addback Test 1, reported still fast. Add only the exact original Home clock, time-dependent greeting, weekday/month/day and header date divider, retaining original font, coordinates, ordering, source and conditions. All weather layers and extracted card chrome, 55 variables, map/GPS/city resolver, complete Calendar, other tabs and navigation remain unchanged. Events, fitness and day gauge remain absent. Tests this combined clock/header group, not an isolated time provider. Native speed and visual result require phone verification.';
 return widget;
}
