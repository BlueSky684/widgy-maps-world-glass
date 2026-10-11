import {number,uvLevel} from './model.js';

// Unix instants choose the next event; the location's IANA zone formats its
// wall-clock time, including tomorrow's offset when daylight saving changes.
export function nextSolarEvent(data,now=Date.now()){
  if(!data?.zone||!Number.isFinite(now))return null;
  const events=(data.days||[]).flatMap(day=>['sunrise','sunset'].map(kind=>({kind,at:day[kind+'At'],date:day.date})))
    .filter(event=>number(event.at)!==null&&event.at>now).sort((a,b)=>a.at-b.at);
  const event=events[0];if(!event)return null;
  try{return {...event,label:event.kind==='sunrise'?'Sunrise':'Sunset',time:new Intl.DateTimeFormat('en-GB',{timeZone:data.zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(event.at))};}
  catch{return null;}
}

// Global Solar UV Index bands. Round once so number, label and active segments
// cannot disagree at a boundary (e.g. a provider value of 2.6 displays 3).
export function uvPresentation(value){
  const valid=number(value)!==null&&value>=0&&value<=30;
  const index=valid?Math.round(value):null;
  const color=n=>n<3?'#68ba64':n<6?'#eacb54':n<8?'#ee974a':n<11?'#e95960':'#b17dea';
  return {index,label:uvLevel(index),color:index===null?'#788997':color(index),
    activeBand:index===null?null:index<3?0:index<6?1:index<8?2:index<11?3:4,
    bands:[0,3,6,8,11].map(color),
    segments:Array.from({length:11},(_,i)=>index!==null&&i<Math.min(11,index)?color(i+1):'#304048')};
}
