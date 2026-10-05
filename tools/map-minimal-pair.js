import {withHomeSyncMapLean} from './home-sync-map-lean.js?v=home-sync-map-lean-1';

const MAP_VARIABLES=new Set(['Latitude','Longitude','map_latitude_max5','map_longitude_max5','map_request']);
const HOME_NAV=new Set([5021,5022,5012,5013,80310,80311,5015,5016]);
const CALENDAR_NAV=new Set([80314,80315,80318,80319,80320,80321,80322,80323]);

// Whole-document isolation, not another sparse Home inside the full widget.
// Input is the same prepared Ring 2 used by Lean. Never mutate that input.
export function withMapMinimalPair(original){
  const widget=withHomeSyncMapLean(original);
  const home=widget['1'].find(n=>n.s==='HOME'),calendar=widget['1'].find(n=>n.s==='CALENDAR');
  const background=widget['1'].find(n=>n.s==='WEATHER')?.['1'].find(n=>n.d0===5049);
  const title=calendar?.['1'].find(n=>n.d0===80334);
  const map=home?.['1'].find(n=>n.d0===6170);
  if(home?.d0!==245 || calendar?.d0!==247 || home.a===false || calendar.a!==false ||
      background?.z!=='2' || background.s!=='Full Graphite Background' ||
      title?.z!=='1' || title['66']?.[0]?.['25']!=='CAL' ||
      map?.['2']!=='${widgy.map_request}' || widget['36'].length!==69)
    throw Error('unexpected_template');
  function navigation(group,ids){
    const nodes=group['1'].filter(n=>ids.has(n.d0));
    if(nodes.length!==8 || new Set(nodes.map(n=>n.d0)).size!==8 ||
        nodes.filter(n=>n.z==='11').length!==2)throw Error('unexpected_template');
    for(const n of nodes)if(n.z==='11'){
      if(n.s==='HOME Tap')n['1a']='button_245-247';
      else if(n.s==='CALENDAR Tap')n['1a']='button_247-245';
      else throw Error('unexpected_template');
    }
    return nodes;
  }
  home['1']=[...navigation(home,HOME_NAV),map];
  title['66']=[{'5':'Custom Text','6':'Text','25':'CALENDAR TEST'}];
  title.d.a[0].a=1400;
  title.s='Calendar Test Title';
  // Native shape is opaque, last in the group's front-to-back ordering.
  // No Calendar image, events, date, city, weather or fitness sources remain.
  calendar['1']=[...navigation(calendar,CALENDAR_NAV),title,background];
  widget['1']=[home,calendar];
  const removed=widget['36'].filter(v=>!MAP_VARIABLES.has(v['1']));
  widget['36']=widget['36'].filter(v=>MAP_VARIABLES.has(v['1']));
  if(widget['36'].length!==5 || new Set(widget['36'].map(v=>v['1'])).size!==5)
    throw Error('unexpected_template');
  widget['3']='Widgy Map Minimal Pair 1';
  widget['4']='Temporary whole-widget isolation compared with Home Sync Map Lean 1. Home retains exactly the live full-resolution map layer, frame, synchronous script, all four GPS source definitions, URL, minute timestamp and image cache setting. Only Home/Calendar navigation remains. Calendar deliberately contains a static CALENDAR TEST label and native graphite background, without calendar data. Weather and Fitness groups and all 64 non-map variable definitions are deleted from this diagnostic copy, not hidden. Colors, fonts and other document settings remain. This is a broad rest-of-widget isolation, not a finished widget, city restoration, proof that hidden sources run or a speed guarantee. Keep Lean 1 and the full widget for normal use. Device import, live marker, map reliability and repeated transitions require verification.';
  const serialized=JSON.stringify(widget),lower=serialized.toLowerCase();
  for(const v of removed)if(serialized.includes('${widgy.'+v['1']+'}') || lower.includes(v['0'].toLowerCase()))
    throw Error('unexpected_template');
  for(const m of serialized.matchAll(/\$\{widgy\.([^}]+)\}/g))
    if(!MAP_VARIABLES.has(m[1]))throw Error('unexpected_template');
  if(/\/api\/calendar-|token=/.test(serialized))throw Error('unexpected_template');
  return widget;
}
