// Flat values are bound directly to Widgy's JSON Endpoint sources. Do not put
// event text through Javascript variable interpolation: evaluation order is not
// guaranteed when the iOS widget is rebuilt after a tab action.
export const DETAIL_ICON_CASES=[
  ['zoom.us',0],['Zoom',0],['zoom',0],['ZOOM',0],['teams.microsoft',0],
  ['Teams',0],['teams',0],['TEAMS',0],['Skype',0],['skype',0],['SKYPE',0],
  ['meet.google',0],['Google Meet',0],['Conference',1],['Room',1],['room',1],
  ['חדר',1],['tel:',2],['Phone',2],['phone',2],['טלפון',2],['Notes',3],['Updates',3]
];
export function widgyFields(snapshot) {
  const ready=snapshot?.version===2 && snapshot.ok===true && Array.isArray(snapshot.rows);
  const data=ready?snapshot:{version:2,ok:false};
  const home=ready?snapshot.home:null;
  const result={
    // Retain compatibility with already imported perf-2 widgets.
    encoded:encodeURIComponent(JSON.stringify(data)),
    calendar_bridge_ready:ready?1:0,
    calendar_remaining_today:ready?snapshot.total:-1,
    calendar_bridge_count:ready?`${snapshot.total} ${snapshot.total===1?'event':'events'} today`:'— events today',
    calendar_home_count:ready?String(snapshot.total):'—',
    calendar_home_event_word:ready && snapshot.total===1?'event •':'events •',
    calendar_home_title:home?home.title:'Calendar unavailable',
    calendar_home_meta:home?home.label+(home.time?' · '+home.time:''):''
  };
  for(let index=0;index<4;index++){
    const row=ready?snapshot.rows[index]:null,prefix=`calendar_event_${index+1}_`;
    for(const field of ['title','location','start','end'])result[prefix+field]=row?row[field]:'';
    result[prefix+'color']=row?row.color:-1;
    result[prefix+'all_day']=row?row.allDay:-1;
    result[prefix+'title_layout']=!row || !/[\u0590-\u05ff]/.test(row.title)?0:
      Array.from(row.title).length>18 || /[\r\n]/.test(row.title)?2:1;
    result[prefix+'detail_icon']=row?
      (DETAIL_ICON_CASES.find(([text])=>String(row.location || '').includes(text))?.[1] ?? 4):-1;
  }
  return result;
}
