import assert from 'node:assert/strict';
import {withHomeClockAddback} from './home-clock-addback.js';
export const EVENT_IDS=new Set([6191,6111,80206,80207,80208,6112,6113]);
export function withHomeEventsAddback(full){
 const widget=withHomeClockAddback(full),home=widget['1'].find(n=>n.d0===245),original=full['1'].find(n=>n.d0===245);
 const existing=new Map(home['1'].map(n=>[n.d0,n]));
 home['1']=original['1'].filter(n=>existing.has(n.d0)||EVENT_IDS.has(n.d0)).map(n=>existing.get(n.d0)??structuredClone(n));
 assert.equal(home['1'].filter(n=>EVENT_IDS.has(n.d0)).length,7);
 widget['3']='Widgy Home Events Addback Test 1';
 widget['4']='Paired with Home Clock Addback Test 1, reported a very small slowdown but still fast. Add only the seven original Home event/reminder text and calendar-icon layers, preserving sources, coordinates, fonts and conditions. All 55 variables, clock/header/weather, map/GPS/city, complete Calendar, other tabs and navigation remain identical. No new chrome/image/server changes; the event divider embedded in the full chrome remains absent as in the control. Fitness and day gauge remain absent. Tests the event summary group including active data consumption, not an isolated provider. Native performance and event output require phone verification.';
 return widget;
}
