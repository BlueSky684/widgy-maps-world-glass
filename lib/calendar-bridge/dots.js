import {DateTime} from 'luxon';
import sharp from 'sharp';
import ICAL from 'ical.js';
import {BridgeError} from './security.js';
import {DOT_FRAME} from './dots-frame.js';

export const COLORS = Object.freeze(['#46A8EF','#B67ADE','#EAB14B','#9ACF68']);
export const DEFAULT_ZONE = 'Asia/Jerusalem';
const displayText = (value, fallback = '') => String(value || fallback).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 500);
// Ignore leading emoji, punctuation and numbers; mixed titles follow their first letter.
// Keep the same language groups in TODAY and dots, before the four-event limit.
function titleLanguageRank(title) {
  const firstLetter = String(title || '').match(/\p{Letter}/u)?.[0] || '';
  if (/\p{Script=Latin}/u.test(firstLetter)) return 0;
  if (/\p{Script=Hebrew}/u.test(firstLetter)) return 1;
  return 2;
}
export function monthWindow({offset = 0, zone = DEFAULT_ZONE, now = new Date()} = {}) {
  if (!Number.isInteger(offset) || offset < -12 || offset > 12) throw new BridgeError('invalid_month');
  const month = DateTime.fromJSDate(now, {zone}).startOf('month').plus({months:offset});
  if (!month.isValid) throw new BridgeError('invalid_timezone');
  const lead = month.weekday % 7;
  const weeks = Math.ceil((lead + month.daysInMonth) / 7);
  const start = month.minus({days:lead});
  const end = start.plus({days:weeks * 7});
  return {month, start, end, weeks, zone};
}
export function googleEvents(items, source) {
  return items.filter(e => e.status !== 'cancelled' && e.start && e.end).map(e => ({
    uid:e.iCalUID || `${source.id}:${e.id}`, source:source.id, color:source.color,
    provider:source.provider, title:displayText(e.summary, '(Untitled event)'), location:displayText(e.location),
    allDay:Boolean(e.start.date), start:e.start.date || e.start.dateTime, end:e.end.date || e.end.dateTime
  }));
}
export function icalEvents(objects, source, window) {
  const result = [];
  for (const object of objects) {
    if (typeof object.data !== 'string' || object.data.length > 5000000) throw new BridgeError('invalid_calendar_data',502);
    const root = new ICAL.Component(ICAL.parse(object.data));
    for (const z of root.getAllSubcomponents('vtimezone')) {
      const id = z.getFirstPropertyValue('tzid');
      if (id) ICAL.TimezoneService.register(id, new ICAL.Timezone(z));
    }
    const components = root.getAllSubcomponents('vevent');
    const masters = components.filter(c => !c.hasProperty('recurrence-id'));
    const exceptions = components.filter(c => c.hasProperty('recurrence-id'));
    function append(event, start, end) {
      if (String(event.component.getFirstPropertyValue('status') || '').toUpperCase() === 'CANCELLED') return;
      if (!start || !end) throw new BridgeError('invalid_calendar_data',502);
      const asString = (t,property) => {
        if (t.isDate) return t.toString();
        if (t.zone === ICAL.Timezone.localTimezone) {
          // Floating values have no UTC offset: interpret them in the chosen widget zone.
          const tzid=event.component.getFirstProperty(property)?.getParameter('tzid');
          const dt = DateTime.fromISO(t.toString(),{zone:tzid || window.zone});
          if (!dt.isValid) throw new BridgeError('invalid_calendar_data',502);
          return dt.toISO();
        }
        return t.toJSDate().toISOString();
      };
      const startISO=asString(start,'dtstart'), endISO=asString(end,'dtend');
      const s=DateTime.fromISO(startISO,{zone:window.zone}), e=DateTime.fromISO(endISO,{zone:window.zone});
      if (s >= window.end || e < window.start) return;
      if (result.length >= 20000) throw new BridgeError('event_limit',502);
      result.push({uid:event.uid, source:source.id, provider:source.provider, color:source.color,
        title:displayText(event.summary, '(Untitled event)'), location:displayText(event.location),
        allDay:start.isDate, start:startISO, end:endISO});
    }
    for (const component of masters) {
      const event = new ICAL.Event(component);
      if (String(component.getFirstPropertyValue('status') || '').toUpperCase() === 'CANCELLED') continue;
      for (const c of exceptions) if (c.getFirstPropertyValue('uid') === event.uid) event.relateException(new ICAL.Event(c));
      if (!event.isRecurring()) { append(event, event.startDate, event.endDate); continue; }
      const iterator = event.iterator();
      let time, steps = 0;
      while ((time = iterator.next())) {
        if (++steps > 50000) throw new BridgeError('recurrence_limit',502);
        // Include overrides separately below, including ones moved into the window.
        if (time.toJSDate().getTime() >= window.end.toMillis()) break;
        const occurrence = event.getOccurrenceDetails(time);
        append(occurrence.item, occurrence.startDate, occurrence.endDate);
      }
    }
    // Expanded CalDAV responses can consist solely of RECURRENCE-ID components.
    // Also preserve moved exceptions whose original occurrence was beyond the range.
    for (const c of exceptions) { const e = new ICAL.Event(c); append(e,e.startDate,e.endDate); }
  }
  return result;
}
export function eventsByDay(events, window) {
  const days = Array.from({length:window.weeks * 7},(_,i) => ({date:window.start.plus({days:i}).toISODate(), events:[]}));
  const boundaries=days.map(day=>{const start=DateTime.fromISO(day.date,{zone:window.zone});return {start,end:start.plus({days:1})};});
  const seen = new Set();
  const sorted = events.map(event => {
    if (!Number.isInteger(event.color) || !COLORS[event.color]) throw new BridgeError('invalid_color');
    const start = DateTime.fromISO(event.start,{zone:window.zone});
    const end = DateTime.fromISO(event.end,{zone:window.zone});
    if (!start.isValid || !end.isValid || end < start) throw new BridgeError('invalid_event_dates',502);
    return {event,start,end,languageRank:titleLanguageRank(event.title)};
  }).sort((a,b) => a.languageRank-b.languageRank || a.start.toMillis()-b.start.toMillis() || Number(Boolean(b.event.allDay))-Number(Boolean(a.event.allDay)) || a.event.color-b.event.color ||
    String(a.event.uid).localeCompare(String(b.event.uid)) || String(a.event.source).localeCompare(String(b.event.source)));
  for (const {event,start,end} of sorted) {
    // UID + occurrence boundaries deduplicates copies of the same invitation.
    // Distinct holiday publishers remain separate when the owner selects both.
    const key = `${event.uid || event.source}|${start.toISO()}|${end.toISO()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    for (const [i,day] of days.entries()) {
      const {start:dayStart,end:dayEnd}=boundaries[i];
      const overlaps = end.equals(start) ? start >= dayStart && start < dayEnd : start < dayEnd && end > dayStart;
      if (overlaps) day.events.push(event);
    }
  }
  return days;
}
export function dayDots(events, window) {
  return eventsByDay(events,window).map(day => ({date:day.date,count:day.events.length,dots:day.events.slice(0,4).map(e=>e.color)}));
}
export async function renderDots(events, window, {bounds='full'}={}) {
  if(!['full','grid'].includes(bounds))throw new BridgeError('invalid_bounds');
  const days = dayDots(events,window);
  const circles = days.flatMap((day,i) => day.dots.map((color,j) => {
    const cx = 48 + (i % 7 + .5) * 554/7 + (j - (day.dots.length-1)/2) * 11;
    const cy = 423 + (Math.floor(i/7) + .5) * 560/window.weeks + 42;
    return `<circle cx="${cx}" cy="${cy}" r="3.5" fill="${COLORS[color]}"/>`;
  })).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1135" height="1184" viewBox="0 0 1135 1184">${circles}</svg>`;
  const image=sharp(Buffer.from(svg),{density:144});
  // Crop after the exact original SVG rasterization: preserve every visible
  // pixel, density and subpixel position, including the anti-aliased edges.
  if(bounds==='grid')image.extract({left:DOT_FRAME.left*DOT_FRAME.scale,top:DOT_FRAME.top*DOT_FRAME.scale,
    width:DOT_FRAME.width*DOT_FRAME.scale,height:DOT_FRAME.height*DOT_FRAME.scale});
  return image.png().toBuffer();
}
