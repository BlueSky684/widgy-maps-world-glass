import {DateTime} from 'luxon';
import {eventsByDay} from './dots.js';
import {eventTimes} from './event-times.js';

function homeEvent(today,zone,now,dayEnd) {
  const instant=now.getTime();
  // Home is a time-based summary. TODAY/dots retain their English-first order.
  // Select the earliest eligible start in one pass. Strict < preserves the
  // original stable-sort tie order without allocating/sorting another list.
  let next;
  for(const event of today){
    if(event.allDay)continue;
    const times=eventTimes(event,zone);
    if((times.endMs>instant || times.startMs>instant) && (!next || times.startMs<next.startMs)) next={event,...times};
  }
  if(next){
    const active=next.startMs<=instant;
    return {label:active?'NOW':'NEXT EVENT',title:next.event.title || '(Untitled event)',
      time:`${next.start.toFormat('HH:mm')} – ${next.end.toFormat('HH:mm')}`,compact:1,
      validUntil:Math.min(dayEnd,active?next.endMs:next.startMs)};
  }
  const allDay=today.find(event=>event.allDay);
  return {label:allDay?'TODAY · ALL DAY':'TODAY',
    title:allDay?(allDay.title || '(Untitled event)'):(today.length?'No more events today':'No events today'),
    time:'',compact:0,validUntil:dayEnd};
}

// TODAY and dots share ordering, overlap, duplicate removal and the four-event limit.
// Keep all of today's events (including finished ones), matching the month's dots.
export function widgetSnapshot(events, window, now = new Date(), preparedDays = eventsByDay(events,window)) {
  const localNow=DateTime.fromJSDate(now,{zone:window.zone}),date=localNow.toISODate();
  const today=preparedDays.find(day=>day.date===date)?.events || [];
  const validUntil=localNow.startOf('day').plus({days:1}).toMillis();
  return {version:2,ok:true,date,zone:window.zone,generatedAt:now.toISOString(),
    validUntil,total:today.length,home:homeEvent(today,window.zone,now,validUntil),
    rows:today.slice(0,4).map(event=>({title:event.title || '(Untitled event)',location:event.location || '',
      color:event.color,allDay:event.allDay?1:0,
      start:eventTimes(event,window.zone).start.toFormat('H:mm'),
      end:eventTimes(event,window.zone).end.toFormat('H:mm')}))};
}

export function sourceDiagnostics(events, window, sources, now = new Date()) {
  const days=eventsByDay(events,window),date=DateTime.fromJSDate(now,{zone:window.zone}).toISODate();
  return sources.map(source=>{
    const matches=event=>event.source===source.id && (!event.provider || event.provider===source.provider);
    return {...source,daysWithEvents:days.filter(day=>day.events.some(matches)).length,
      todayEvents:days.find(day=>day.date===date)?.events.filter(matches).length || 0};
  });
}
