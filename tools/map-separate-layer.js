import {withHomeSyncMapLean} from './home-sync-map-lean.js?v=home-sync-map-lean-1';

const fail=()=>{throw Error('unexpected_template');};
const walk=nodes=>nodes.flatMap(n=>[n,...(n.z==='13'?walk(n['1']):[])]);

// A parent/visibility experiment, not a promise to keep a native image decoded.
// Widgy layer order is front to back in the existing approved exports.
export function withMapSeparateLayer(original){
  const widget=withHomeSyncMapLean(original),roots=widget['1'];
  if(roots.length!==4 || roots.map(n=>n.d0).join(',')!=='245,247,246,195')fail();
  const home=roots[0];
  // The current Home group has no origin, effect, clip or condition to transfer.
  if(Object.keys(home).sort().join(',')!=='1,d,d0,e,s,z')fail();
  for(const key of ['d','e']){
    const f=home[key];
    if(f?.b!==0 || f.a?.length!==1 || Object.keys(f).sort().join(',')!=='a,b' ||
       Object.keys(f.a[0]).sort().join(',')!=='a,b,c,d' ||
       f.a[0].a!==1600 || f.a[0].b!==1301 || f.a[0].c!==0 || f.a[0].d!==1301)fail();
  }
  const map=home['1'].find(n=>n.d0===6170);
  if(!map || map.z!=='5' || map.s!=='Home Hero World Map' || map['1']!=='Web URL' ||
     map['2']!=='${widgy.map_request}' || map.a!==undefined || map.o1!==undefined ||
     walk(roots).filter(n=>n.d0===6170).length!==1)fail();
  for(const n of walk(roots))if(n['1a']?.startsWith('button_') &&
      n['1a'].slice(7).split(/[-,]/).map(Number).includes(map.d0))fail();
  // Other tabs must retain the opaque backgrounds above the map. The PNG's
  // actual alpha coverage is checked in the paired test, not assumed from name.
  const chrome=roots[1]['1'].find(n=>n.d0===80408);
  if(chrome?.z!=='5' || chrome['1']!=='Web URL' ||
     !chrome['2']?.endsWith('/assets/calendar-glass/Calendar_Glass_Chrome_C8.png') ||
     chrome.a!==undefined || chrome.o1!==undefined)fail();
  for(const [root,id] of [[roots[2],5049],[roots[3],5073]]){
    const bg=root['1'].find(n=>n.d0===id);
    if(bg?.z!=='2' || bg.s!=='Full Graphite Background' ||
       bg.g!=='hexcol_A4F195A239A64F67A26E810CD80D1D2B-100' ||
       bg.a!==undefined || bg.o1!==undefined)fail();
  }
  home['1']=home['1'].filter(n=>n!==map);
  roots.push(map); // Exact same object/ID/frame/provider, behind all four tabs.
  widget['3']='Widgy Map Separate Layer 1';
  widget['4']='Temporary comparison against Home Sync Map Lean 1 after Calendar was reported to remain visible during the delay, then Home and map appear together. Move the one unchanged live map layer out of the neutral Home group to the back of the document, behind all four tab groups. Existing opaque Calendar/Weather/Fitness backgrounds cover its area. No tap targets include the map, so its exported visibility is independent of Home. All 69 variables, 1289 layers, GPS precision, synchronous script, minute timestamp, image URL/options/frame, full lossless PNG, Calendar data and all navigation actions stay exact. Home still shows only map/navigation, with coordinates instead of city. This does not guarantee native caching, background loading, fewer requests or speed. Check map frame/marker and that it never shows through other tabs; compare both transition directions. Revert to Lean if slower or visually wrong. Keep this private calendar export private.';
  return widget;
}
