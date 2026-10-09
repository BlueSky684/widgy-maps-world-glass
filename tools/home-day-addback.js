import assert from 'node:assert/strict';
import {withHomeFitnessAddback} from './home-fitness-addback.js';
export const DAY_IDS=new Set([6121,6122,80205,6123,6124,82317]);
export function withHomeDayAddback(full){
 const widget=withHomeFitnessAddback(full),home=widget['1'].find(n=>n.d0===245),original=full['1'].find(n=>n.d0===245);
 const existing=new Map(home['1'].map(n=>[n.d0,n]));
 home['1']=original['1'].filter(n=>existing.has(n.d0)||DAY_IDS.has(n.d0)).map(n=>existing.get(n.d0)??structuredClone(n));
 assert.equal(home['1'].filter(n=>DAY_IDS.has(n.d0)).length,6);
 const chrome=home['1'].find(n=>n.d0===80309);chrome.s='Weather Fitness and Day · Original chrome regions';chrome['2']='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/assets/home-glass/Home_Day_Cards_Addback_1.png';
 widget['3']='Widgy Home Day Addback Test 1';
 widget['4']='Paired with Home Fitness Addback Test 1: owner reported more delay but still less than full Home. Restore only original native day gauge, label/value/unavailable state and sunrise/sunset time layers. Original variables, sources, frames, conditions, DST/location logic and gauge options are unchanged. Add only original day-strip chrome pixels to existing cards canvas. All other layers, map/GPS/city, full Calendar and 55 variables remain identical. Remaining full chrome and graphite background remain absent. Tests the day group and artwork, not a single provider. Phone speed and appearance require verification.';
 return widget;
}
