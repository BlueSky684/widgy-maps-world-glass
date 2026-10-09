import assert from 'node:assert/strict';
import {flatten,pruneUnused} from './compact-widget-structure.js';
export const SHARED_GROUP_ID=83010;
export const SHARED_PAIRS=[
 [6190,80328],[6103,80329],[6104,80330],[80312,80331],[80313,80332],[6105,80333],
 [5017,80324],[5018,80325],[6195,80326],[5020,80327]
];
export function withSharedHomeCalendar(original){
 assert.equal(original['3'],'Widgy Native City Spelling Test 2');
 const w=structuredClone(original),home=w['1'].find(n=>n.d0===245),calendar=w['1'].find(n=>n.d0===247);
 assert(home && calendar);assert(!flatten(w['1']).some(n=>n.d0===SHARED_GROUP_ID));
 const visual=n=>Object.fromEntries(Object.entries(n).filter(([k])=>!['s','d0'].includes(k)));
 const homeIDs=new Set(SHARED_PAIRS.map(([h])=>h)),calendarIDs=new Set(SHARED_PAIRS.map(([,c])=>c));
 const common=[];
 for(const [h,c]of SHARED_PAIRS){
  const hn=home['1'].find(n=>n.d0===h),cn=calendar['1'].find(n=>n.d0===c);
  assert(hn && cn);assert.deepEqual(visual(hn),visual(cn),'Only exact matching visuals may be shared');
  common.push(hn);
 }
 home['1']=home['1'].filter(n=>!homeIDs.has(n.d0));
 calendar['1']=calendar['1'].filter(n=>!calendarIDs.has(n.d0));
 const shared={z:'13',d0:SHARED_GROUP_ID,s:'Shared Home and Calendar · Date and inactive navigation',
  d:structuredClone(home.d),e:structuredClone(home.e),'1':common};
 w['1'].unshift(shared);
 for(const n of flatten(w['1'])){
  if(n.z!=='11' || !/^(HOME|CALENDAR|WEATHER|FITNESS) Tap$/.test(n.s))continue;
  const [show,hide]=n['1a'].slice(7).split('-').map(s=>s.split(',').map(Number));
  (show.includes(245)||show.includes(247)?show:hide).push(SHARED_GROUP_ID);
  n['1a']=`button_${show.join(',')}-${hide.join(',')}`;
 }
 // The current map invocation explicitly selects the first GPS pair. Its
 // fallback arguments can never be read, but their template substitutions
 // still reference two additional native Location variables. Drop only those
 // arguments after verifying the literal true mode; keep live GPS and script
 // body, exact coordinates, city reuse, errors and minute refresh unchanged.
 const map=w['36'].find(v=>v['1']==='map_request')['3']['66'][0];
 const suffix=',true,"${widgy.Latitude}","${widgy.Longitude}",60,3600);';
 assert(map['10'].endsWith(suffix));
 map['10']=map['10'].slice(0,-suffix.length)+',true,"","",60,3600);';
 const pruned=pruneUnused(w);assert.deepEqual(pruned,['Latitude','Longitude','calendar_city_prefix']);
 w['3']='Widgy Shared Home Calendar Cleanup 1';
 w['4']='Full approved widget with ten identical date/navigation visuals shared between Home and Calendar; keeps original fonts, overprinted date weight, positions and artwork. Removes the unused Calendar city-prefix script and two unread fallback GPS inputs from the literal true-mode map call. Active GPS sources, exact coordinates, city and map runtime behavior are preserved. All 25 months and Today badges retained. Server direct PNG pipeline and shared Calendar day index reduce measured server work; native transition speed remains unmeasured. No tap-dot markers.';
 return w;
}
