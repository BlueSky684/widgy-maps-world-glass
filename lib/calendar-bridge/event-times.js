import {DateTime} from 'luxon';

// Only derived time values, owned by the event object's lifetime. This is not
// an event-response cache: provider refresh, authentication and TTLs are intact.
// Keep one zone per object and invalidate if a caller changes either ISO value.
let times = new WeakMap(), insertions = 0;
const MAX_PARSED_EVENTS = 2048;
export function eventTimes(event, zone) {
  const previous = times.get(event);
  if (previous && previous.zone === zone && previous.startISO === event.start && previous.endISO === event.end) return previous;
  const start = DateTime.fromISO(event.start, {zone});
  const end = DateTime.fromISO(event.end, {zone});
  const value = {zone, startISO:event.start, endISO:event.end, start, end,
    startMs:start.toMillis(), endMs:end.toMillis()};
  // A dense set of provider entries must not accumulate millions of DateTime
  // objects. Reset only this optional derived cache at its insertion budget.
  if (!previous && ++insertions > MAX_PARSED_EVENTS) {
    times = new WeakMap(); insertions = 1;
  }
  times.set(event, value);
  return value;
}
