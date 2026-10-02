// Separate diagnostic copies only. Never overwrite the normal widget.
export function withoutMap(widget){
 const w=structuredClone(widget),home=w['1'].find(n=>n.d0===245);
 const version=w['3']?.match(/^Widgy Home Glass Calendar (C8|C9)$/)?.[1];
 if(!version)throw Error('Expected C8 or C9');
 home['1']=home['1'].filter(n=>n.d0!==6170);
 const removed=new Set(['map_request','map_latitude_max5','map_longitude_max5','Latitude','Longitude']);
 w['36']=w['36'].filter(v=>!removed.has(v['1']));
 const rest=JSON.stringify(w['1'])+JSON.stringify(w['36']);
 for(const name of removed)if(rest.includes('${widgy.'+name+'}'))throw Error('Map binding still referenced');
 w['3']=`Widgy Calendar ${version} Map-Off Test`;
 w['4']=`Diagnostic copy: ${version} with only the Home map layer and its five input/URL variables removed. Home map area is intentionally empty. Calendar, native agenda, steps, weather, all controls and other sources are identical to ${version}. Compare Calendar month taps after first load. This is not the daily-use release.`;
 return w;
}
