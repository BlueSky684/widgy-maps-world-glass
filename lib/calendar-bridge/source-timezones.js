import {DateTime, IANAZone} from 'luxon';

// Preserve only zones explicitly supplied by the calendar provider. A response
// offset, event title, location or the viewer's zone cannot establish the
// departure/arrival zone of a flight. Provider types such as `fromGmail` are
// provenance, not a flight classification (they also include reservations).
export function sourceZone(value) {
  return typeof value === 'string' && value.length <= 100 && IANAZone.isValidZone(value)
    ? value : '';
}

function endpoint(iso, zone) {
  const validZone = sourceZone(zone);
  // Do not reinterpret floating wall times in another zone.
  const hasOffset = typeof iso === 'string' && /(?:Z|[+-]\d{2}:?\d{2})$/i.test(iso);
  const instant = hasOffset && validZone ? DateTime.fromISO(iso, {setZone:true}) : null;
  if (!instant?.isValid) return {zone:validZone, time:'', date:'', offset:''};
  const local = instant.setZone(validZone);
  return {zone:validZone, time:local.toFormat('HH:mm'), date:local.toISODate(), offset:local.toFormat('ZZ')};
}

export function sourceTimeMetadata(event) {
  if (!event || event.allDay) return null;
  const start = endpoint(event.start, event.startTimeZone);
  const end = endpoint(event.end, event.endTimeZone);
  return {provider:event.provider || '', providerType:event.providerEventType || '',
    complete:Boolean(start.time && end.time), start, end};
}

// Opt-in diagnostics for the same four already-authorized TODAY rows. Existing
// snapshots/fields and their time-zone policy stay unchanged until a new native
// widget explicitly consumes verified source metadata.
export function withSourceTimeMetadata(snapshot, preparedDays) {
  const events = preparedDays.find(day => day.date === snapshot.date)?.events || [];
  return {...snapshot, rows:snapshot.rows.map((row,index) =>
    ({...row, sourceTimes:sourceTimeMetadata(events[index])}))};
}

export function sourceTimeFields(snapshot) {
  const fields = {};
  for (let index=0; index<4; index++) {
    const data=snapshot?.rows?.[index]?.sourceTimes, prefix=`calendar_event_${index+1}_`;
    fields[prefix+'source_timezones_complete']=data?.complete ? 1 : 0;
    fields[prefix+'source_provider_type']=data?.providerType || '';
    for (const side of ['start','end']) for (const key of ['zone','time','date','offset'])
      fields[prefix+side+'_source_'+key]=data?.[side]?.[key] || '';
  }
  return fields;
}
