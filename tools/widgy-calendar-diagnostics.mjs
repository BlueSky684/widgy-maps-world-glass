// Separate diagnostic copies only. Never overwrite the normal C8 widget.
export function withoutMap(widget){
 const w=structuredClone(widget),home=w['1'].find(n=>n.d0===245);
 if(w['3']!=='Widgy Home Glass Calendar C8')throw Error('Expected C8');
 home['1']=home['1'].filter(n=>n.d0!==6170);
 const removed=new Set(['map_request','map_latitude_max5','map_longitude_max5','Latitude','Longitude']);
 w['36']=w['36'].filter(v=>!removed.has(v['1']));
 const rest=JSON.stringify(w['1'])+JSON.stringify(w['36']);
 for(const name of removed)if(rest.includes('${widgy.'+name+'}'))throw Error('Map binding still referenced');
 w['3']='Widgy Calendar C8 Map-Off Test';
 w['4']='Diagnostic copy: C8 with only the Home map layer and its five input/URL variables removed. Home map area is intentionally empty. Calendar, native agenda, steps, weather, all controls and other sources are identical to C8. Compare Calendar month taps after first load. This is not the daily-use release.';
 return w;
}
