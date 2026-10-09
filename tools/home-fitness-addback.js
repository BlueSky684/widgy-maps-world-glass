import assert from 'node:assert/strict';
import {withHomeEventsAddback} from './home-events-addback.js';
export const FITNESS_IDS=new Set([6193,80209,6140,6141,6142,6143,6144]);
export function withHomeFitnessAddback(full){
 const widget=withHomeEventsAddback(full),home=widget['1'].find(n=>n.d0===245),original=full['1'].find(n=>n.d0===245);
 const existing=new Map(home['1'].map(n=>[n.d0,n]));
 home['1']=original['1'].filter(n=>existing.has(n.d0)||FITNESS_IDS.has(n.d0)).map(n=>existing.get(n.d0)??structuredClone(n));
 assert.equal(home['1'].filter(n=>FITNESS_IDS.has(n.d0)).length,7);
 const chrome=home['1'].find(n=>n.d0===80309);chrome.s='Weather and Fitness Cards · Exact original chrome regions';chrome['2']='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/assets/home-glass/Home_Weather_Fitness_Cards_Addback_1.png';
 widget['3']='Widgy Home Fitness Addback Test 1';
 widget['4']='Paired with Home Events Addback Test 1, reported a further very small subjective slowdown. Restore seven original Home fitness layers including the native 10000-step goal ring, steps, distance and calories, unchanged sources/geometry/conditions. Add only original fitness-card pixels to the existing weather chrome canvas. Weather pixels remain exact; image layer count/options remain unchanged. All 55 variables, clock/header/events/weather, map/GPS/city, full Calendar and other tabs are unchanged. Day gauge/sunrise/sunset and remaining full chrome stay absent. Tests the complete fitness card plus its artwork and current-content interactions; not an isolated health provider. Native speed and output require phone verification.';
 return widget;
}
