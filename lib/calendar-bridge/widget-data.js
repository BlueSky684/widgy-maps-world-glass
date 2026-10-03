import {DateTime} from 'luxon';
import {eventsByDay} from './dots.js';

function homeEvent(today,zone,now,dayEnd) {
  const instant=now.getTime();
  // Home is a time-based summary. TODAY/dots retain their English-first order.
  // Stable sorting preserves that order when two starts are identical.
  const timed=today.filter(event=>!event.allDay).map(event=>({event,
    start:DateTime.fromISO(event.start,{zone}).setZone(zone),
    end:DateTime.fromISO(event.end,{zone}).setZone(zone)
  })).filter(item=>item.end.toMillis()>instant || item.start.toMillis()>instant)
    .sort((a,b)=>a.start.toMillis()-b.start.toMillis());
  const next=timed[0];
  if(next){
    const active=next.start.toMillis()<=instant;
    return {label:active?'NOW':'NEXT EVENT',title:next.event.title || '(Untitled event)',
      time:`${next.start.toFormat('h:mm a')} – ${next.end.toFormat('h:mm a')}`,compact:1,
      validUntil:Math.min(dayEnd,active?next.end.toMillis():next.start.toMillis())};
  }
  const allDay=today.find(event=>event.allDay);
  return {label:allDay?'TODAY · ALL DAY':'TODAY',
    title:allDay?(allDay.title || '(Untitled event)'):(today.length?'No more events today':'No events today'),
    time:'',compact:0,validUntil:dayEnd};
}

// TODAY and dots share ordering, overlap, duplicate removal and the four-event limit.
// Keep all of today's events (including finished ones), matching the month's dots.
export function widgetSnapshot(events, window, now = new Date()) {
  const date=DateTime.fromJSDate(now,{zone:window.zone}).toISODate();
  const today=eventsByDay(events,window).find(day=>day.date===date)?.events || [];
  const validUntil=DateTime.fromJSDate(now,{zone:window.zone}).startOf('day').plus({days:1}).toMillis();
  return {version:2,ok:true,date,zone:window.zone,generatedAt:now.toISOString(),
    validUntil,total:today.length,home:homeEvent(today,window.zone,now,validUntil),
    rows:today.slice(0,4).map(event=>({title:event.title || '(Untitled event)',location:event.location || '',
      color:event.color,allDay:event.allDay?1:0,
      start:DateTime.fromISO(event.start,{zone:window.zone}).setZone(window.zone).toFormat('H:mm'),
      end:DateTime.fromISO(event.end,{zone:window.zone}).setZone(window.zone).toFormat('H:mm')}))};
}

export function sourceDiagnostics(events, window, sources, now = new Date()) {
  const days=eventsByDay(events,window),date=DateTime.fromJSDate(now,{zone:window.zone}).toISODate();
  return sources.map(source=>{
    const matches=event=>event.source===source.id && (!event.provider || event.provider===source.provider);
    return {...source,daysWithEvents:days.filter(day=>day.events.some(matches)).length,
      todayEvents:days.find(day=>day.date===date)?.events.filter(matches).length || 0};
  });
}
