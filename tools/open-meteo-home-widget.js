import assert from 'node:assert/strict';

// Patch the user's current export, preserving Health changes and native art.
export function withOpenMeteoHome(source){
  const w=structuredClone(source);
  const home=w['1'].find(n=>n.d0===245),weather=w['1'].find(n=>n.d0===246);
  const panel=weather?.['1'].find(n=>n.s==='Weather · Live current, six hours and five days');
  assert(home&&panel&&panel['2'].includes('/api/weather-panel?'),'Expected live Weather panel');
  panel['2']=panel['2'].replace(/([?&])v=\d+/,'$1v=12');
  const url=panel['2']+'&format=json';
  const endpoint=field=>[{'5':'JSON Endpoint','6':'Endpoint','19':'GET','18':url,'23':[field]}];
  for(const [id,field] of [[6121,'sunrise'],[6124,'sunset'],[6131,'temperature'],[6132,'status'],[6133,'high'],[6134,'low']]){
    const layer=home['1'].find(n=>n.d0===id);assert(layer,`Missing Home layer ${id}`);layer['66']=endpoint(field);
  }
  const status=w['36'].find(v=>v['1']==='wx_status'),wind=w['36'].find(v=>v['1']==='wx_wind_speed');
  assert(status&&wind,'Expected native weather selector variables');
  status['3']['66']=endpoint('icon_status');wind['3']['66']=endpoint('wind_speed');
  // Select windy artwork with the same condition priority as Weather (storm,
  // snow, rain and fog win over wind). Avoid divergent speed thresholds.
  function visit(n){
    if([80012,80034,80042,7008].includes(n.d0))n.o1={'0':status['0'],'1':n.d0===7008?2:3,'2':'Windy'};
    if(Array.isArray(n['1']))n['1'].forEach(visit);
  }
  home['1'].forEach(visit);
  return w;
}
