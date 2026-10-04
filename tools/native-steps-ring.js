// Browser-only ring trial. Generic native fields from the owner's Widgy export
// 20261004-202443; no private export, tokens or user data are included here.
// 8/9 = start/end scale; 10 = fill material; 20 = manual exclusive maximum.
// Native defaults (observed in the supplied screenshots) supply clockwise,
// top origin, 360 degrees, rounded ends, transparent inactive material and min 0.
export const NATIVE_STEPS_RING={z:'9','1':'Pedometer','2':'Steps','20':10000,
  '8':{b:0,a:[{a:30,c:0,d:1403,b:1403}]},
  '9':{b:0,a:[{a:30,c:0,b:1404,d:1404}]},
  '10':'uicol_widgy5-100'};
const fail=()=>{throw Error('unexpected_native_ring_template');};
const ringName=/^Steps Goal Ring · (\d+)%$/;

export function replaceHomeStepsWithNativeRing(original,nativeRing=NATIVE_STEPS_RING){
  if(original['3']!=='Widgy Compact Dots 1' || nativeRing?.z!=='9' ||
      nativeRing['1']!=='Pedometer' || nativeRing['2']!=='Steps' ||
      nativeRing['20']!==10000 || nativeRing['8']?.a?.[0]?.a!==30 ||
      nativeRing['9']?.a?.[0]?.a!==30 || typeof nativeRing['10']!=='string')fail();
  const widget=structuredClone(original);
  const home=widget['1'].find(n=>n.s==='HOME' && n.d0===245);
  if(!home || widget['1'].some(n=>n.z==='9'))fail();
  const old=home['1'].filter(n=>ringName.test(n.s||''));
  const first=home['1'].indexOf(old[0]);
  if(old.length!==100 || new Set(old.map(n=>n.s)).size!==100 ||
      !old.every((n,i)=>home['1'][first+i]===n && n.z==='2' &&
        Number(ringName.exec(n.s)[1])===100-i && n.o1?.['1']===5))fail();
  for(const layer of old){
    for(const key of ['b','c','d','e']){
      if(layer[key]?.a?.length!==1 ||
          layer[key].a[0].a!==old[0][key].a[0].a)fail();
    }
  }
  // Reuse a removed ID and preserve the exact draw-order position. Copy only
  // the approved frame; no old shape path or 100 visibility predicates survive.
  const ring=structuredClone(nativeRing);
  ring.d0=old[0].d0;
  ring.s='Steps Goal Ring · Native';
  // The fill key is verified by the native export. Reuse the existing exact
  // lime material rather than publishing the temporary green from the sample.
  if(typeof old[0].g!=='string' || !old.every(n=>n.g===old[0].g))fail();
  ring['10']=old[0].g;
  for(const key of ['b','c','d','e'])ring[key]=structuredClone(old[0][key]);
  home['1'].splice(first,100,ring);
  widget['3']='Widgy Native Steps Ring 1';
  widget['4']='Compact Dots 1 trial: replace all 100 manual Home steps-ring shapes with one native Ring Chart. Native Pedometer / Steps, manual 10000 goal, original frame and lime material, 30% start/end scale from the device export. Total 1514 layers. All other Home/Calendar content, 81 variables, map/city and navigation retained. Ring thickness/track alignment, edge cases and transition speed still require native phone verification. Keep this private export private.';
  return widget;
}

// IMG_9891 measured 46–47 screenshot pixels at the right-hand stroke for the
// 30% trial, against the approved 13px track. 30 * 13 / 46.5 ≈ 8.4.
// Use 8.5 as a first empirical correction; native scaling is not proven linear.
// Keep the first trial reproducible and alter only its two known scale fields.
export function thinNativeStepsRing(original){
  const widget=replaceHomeStepsWithNativeRing(original);
  const ring=widget['1'].find(n=>n.d0===245)['1'].find(n=>n.s==='Steps Goal Ring · Native');
  ring['8'].a[0].a=8.5;
  ring['9'].a[0].a=8.5;
  widget['3']='Widgy Native Steps Ring 2';
  widget['4']='Native Steps Ring 1 thickness correction: only Start Scale and End Scale change from 30 to 8.5, based on the first phone screenshot. Same single native Pedometer ring, 10000 goal, original frame/lime and full Compact Dots 1 content; all 100 manual ring layers remain removed. Total 1514 layers and 81 variables. Native thickness/track alignment, edge cases and speed still require phone verification; proportional scale calibration is an estimate. Keep this private export private.';
  return widget;
}
