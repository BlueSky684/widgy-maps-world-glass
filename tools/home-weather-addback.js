import assert from 'node:assert/strict';
import {withHomeSourceAddback} from './home-source-addback.js';
export const WEATHER_IDS=new Set([80029,80028,80049,6130,6131,6132,6133,6134]);
export function withHomeWeatherAddback(full){
 const widget=withHomeSourceAddback(full),home=widget['1'].find(n=>n.d0===245),original=full['1'].find(n=>n.d0===245);
 const keep=new Set(home['1'].map(n=>n.d0));
 home['1']=structuredClone(original['1'].filter(n=>keep.has(n.d0)||WEATHER_IDS.has(n.d0)||n.d0===80309));
 assert.equal(home['1'].filter(n=>WEATHER_IDS.has(n.d0)).length,8);
 const chrome=home['1'].find(n=>n.d0===80309);
 chrome.s='Weather Card · Exact original chrome region';
 chrome['2']='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/assets/home-glass/Home_Weather_Card_Addback_1.png';
 widget['3']='Widgy Home Weather Addback Test 1';
 widget['4']='Compare with Home Source Addback Test 1, reported equally fast. Restore only the original Home weather icon condition trees and temperature/status/high/low layers, with identical sources, geometry, order and conditions. Restore only the weather-card region from the approved chrome PNG, lossless on the original full-size transparent canvas. All 55 definitions, full Calendar, city spelling/stacking, GPS, live full-quality map, navigation and other tabs remain unchanged. No clock, events, fitness, day gauge or header. This tests the complete weather card including its image and conditional artwork, not the weather provider alone. Phone speed and appearance require testing.';
 return widget;
}
