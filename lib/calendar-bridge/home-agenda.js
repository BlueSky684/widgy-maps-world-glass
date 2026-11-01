import {eventTimes} from './event-times.js';

// The compact Home agenda uses the full, deduplicated day. Calendar's four
// visible rows and full-day count keep their existing meaning.
export function homeAgenda(preparedDays, snapshot) {
  const today=preparedDays.find(day=>day.date===snapshot.date)?.events || [];
  const instant=Date.parse(snapshot.generatedAt);
  let remaining=0, next=null, allDay=null, validUntil=snapshot.validUntil;
  for(const event of today){
    if(event.allDay){remaining++;allDay ||= event;continue;}
    const times=eventTimes(event,snapshot.zone);
    if(times.endMs<=instant && times.startMs<=instant)continue;
    remaining++;
    if(!next || times.startMs<next.startMs)next={event,...times};
    // A non-selected overlapping event can finish first and change the count.
    if(times.endMs>instant)validUntil=Math.min(validUntil,times.endMs);
    if(times.startMs>instant)validUntil=Math.min(validUntil,times.startMs);
  }
  const title=next?`${next.start.toFormat('HH:mm')} · ${next.event.title || '(Untitled event)'}`:
    allDay?`All day · ${allDay.title || '(Untitled event)'}`:
    today.length?'No more events today':'No events today';
  return {remaining,title,meta:remaining>1?`TODAY · ${remaining} EVENTS`:'TODAY',validUntil};
}

export function homeAgendaFields(agenda) {
  return {
    calendar_home_agenda_meta:agenda?.meta || 'TODAY',
    calendar_home_agenda_title:agenda?.title || 'Calendar unavailable',
    calendar_home_agenda_remaining:agenda?.remaining ?? -1
  };
}
