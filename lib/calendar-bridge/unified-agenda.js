import {DateTime} from 'luxon';
import {eventTimes} from './event-times.js';
import {widgetSnapshot} from './widget-data.js';
import {presentAgenda} from './agenda-presentation.js';
import native from './native-calendar.cjs';

// One complete provider snapshot owns selection, ordering, count, titles,
// clocks, flight formatting and empty state. Native Agenda indices/counts are
// intentionally NOT joined to it: the OS may filter/reindex them independently.
const rowKeys=['color','all_day','title_layout','detail_icon','flight','start_label',
  'end_label','flight_title','flight_number','flight_start','flight_end'];
const blank=()=>({visible:0,title:'',location:'',start:'',end:'',kind:'',text:'',
  color:-1,all_day:0,title_layout:0,detail_icon:-1,flight:0,start_label:'',end_label:'',
  flight_title:'',flight_number:'',flight_start:'',flight_end:''});
export function unavailableAgenda(reason='provider-unavailable') {
  const fields={ready:0,state:'unavailable',message:'Calendar unavailable',
    count:0,total:0,count_label:'Calendar unavailable',spacious:0,overflow:'',home_visible:0};
  for(const prefix of ['home',...Array.from({length:4},(_,i)=>`event_${i+1}`)])
    for(const [key,value] of Object.entries(blank()))fields[`${prefix}_${key}`]=value;
  return {version:1,reason,generatedAt:'',validUntil:0,fields};
}

export function isCurrentAgenda(candidate,zone,nowMs=Date.now()) {
  const local=DateTime.fromMillis(nowMs,{zone:zone||'invalid'}),f=candidate?.fields;
  const age=nowMs-Date.parse(candidate?.generatedAt);
  if(candidate?.version!==1||!local.isValid||candidate.zone!==zone||candidate.date!==local.toISODate()
    ||!(age>=-60000&&age<=120000)||!(candidate.validUntil>nowMs)||f?.ready!==1)return false;
  // Reject truncated/mixed contracts rather than delivering ready=1 with
  // absent text fields. Default fields are also the versioned shape contract.
  if(Object.entries(unavailableAgenda().fields).some(([k,v])=>typeof f[k]!==typeof v))return false;
  if(!Number.isSafeInteger(f.count)||!Number.isSafeInteger(f.total)||f.count<0||f.total<f.count)return false;
  if(f.state!==(f.count?'remaining':f.total?'finished':'empty')||f.home_visible!==Number(f.count>0))return false;
  for(let i=1;i<=4;i++)if(f[`event_${i}_visible`]!==Number(i<=f.count))return false;
  return !f.count||Boolean(f.home_title.trim());
}

export function unifiedAgenda(days,window,now=new Date(),profiles=[],automatic=true) {
  const output=unavailableAgenda('invalid-snapshot');
  const instant=now.getTime(),local=DateTime.fromJSDate(now,{zone:window.zone});
  if(!local.isValid)return output;
  const date=local.toISODate(),day=days.find(d=>d.date===date);
  // Missing day is not a successful empty day.
  if(!day||!Array.isArray(day.events))return output;
  const total=day.events.length,dayEnd=local.startOf('day').plus({days:1}).toMillis();
  const classified=day.events.map((event,index)=>({event,index,...eventTimes(event,window.zone)}));
  if(classified.some(e=>!Number.isFinite(e.startMs)||!Number.isFinite(e.endMs)||e.endMs<e.startMs))return output;
  const remaining=classified.filter(e=>e.event.allDay||e.endMs>instant);
  // Keep the established language/order policy for Calendar, packing rows only
  // AFTER expiry. Home chooses the earliest active/upcoming timed event across
  // the ENTIRE day, then all-day. It is not limited to Calendar's four slots.
  const timed=remaining.filter(e=>!e.event.allDay).sort((a,b)=>a.startMs-b.startMs||a.index-b.index);
  const home=timed[0]||remaining[0];
  const state=remaining.length?'remaining':total?'finished':'empty';
  const message=state==='finished'?'No more events today':state==='empty'?'No events today':'';
  const format=entries=>{
    const selected=[{date,events:entries.map(e=>e.event)}];
    const raw=widgetSnapshot([],window,now,selected);
    const presented=presentAgenda(raw,selected,profiles,automatic);
    return raw.rows.map((row,index)=>{
      const display=presented.rows[index];
      const fields=Object.fromEntries(rowKeys.map(key=>[key,native.rowField(row,raw,presented,key,[],display)]));
      const allDay=fields.all_day===1,flight=fields.flight===1;
      return {...blank(),...fields,visible:1,title:row.title,location:row.location,
        start:allDay?'':display.start,end:allDay?'':display.end,
        kind:flight?'flight':allDay?'all-day':'event',text:allDay?'ALL DAY':''};
    });
  };
  const rows=format(remaining.slice(0,4)),homeRow=home?format([home])[0]:blank();
  Object.assign(output,{reason:'complete',generatedAt:now.toISOString(),date,zone:window.zone,
    validUntil:Math.min(dayEnd,...remaining.flatMap(e=>e.event.allDay?[]:[e.startMs,e.endMs].filter(t=>t>instant)))});
  Object.assign(output.fields,{ready:1,state,message,count:remaining.length,
    count_label:remaining.length?`${remaining.length} remaining`:'0 remaining',
    spacious:remaining.length>0&&remaining.length<=2&&rows.some(r=>r.flight===1)?1:0,
    overflow:remaining.length>4?`+${remaining.length-4} more`:'',total});
  for(const [prefix,row]of [['home',homeRow],...Array.from({length:4},(_,i)=>[`event_${i+1}`,rows[i]||blank()])])
    for(const [key,value]of Object.entries(row))output.fields[`${prefix}_${key}`]=value;
  return output;
}
