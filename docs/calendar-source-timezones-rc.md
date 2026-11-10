# Calendar source time zones — RC groundwork

This opt-in read path preserves explicit start/end time-zone metadata before
provider normalization discards it. It does not classify events as flights or
change existing Widgy field values, permissions, tokens, event ordering, dates,
Home selection, month dots, Health data or native widget geometry.

For an already authorized `view=today` request, `time_metadata=source-v1` adds
`sourceTimes` to the existing four rows. With `format=widgy`, corresponding flat
`calendar_event_N_*_source_*` fields are also returned. These use `HH:mm` and
include the local date, explicit source zone and offset. All-day rows have no
source time metadata. Missing, invalid or floating endpoint data stays incomplete;
it is not inferred from event titles, cities, UTC offsets or the current device.

Google `fromGmail` is retained only as provenance. It also covers non-flight
reservations, so it must never enable an aircraft icon by itself. No flight icon
or airport inference is implemented in this RC groundwork.

Existing endpoint timestamps and all default JSON fields retain their behavior.
Day membership and elapsed time still use instants in the configured calendar
zone. Displaying local endpoint dates must not alter recurrence, all-day exclusive
end dates, DST, day counts, or source data. Metadata is subject to the same sealed
read capability and private caching; it is never logged.

Validation: `node --test tools/test-calendar-source-timezones.mjs
tools/test_calendar_bridge.mjs tools/test_calendar_unified.mjs
tools/test_calendar_apple_holidays.mjs tools/test-calendar-fast-year-handler.mjs`

45 tests passed. Includes separate endpoint zones, missing zones, floating times,
UTC-only events, holidays, reservations, meetings, midnight, DST, unchanged legacy
fields, opt-in authorization and failure clearing. Live source metadata must be
checked before selecting a display policy for a particular travel event.

Primary provider references:
- https://developers.google.com/workspace/calendar/api/v3/reference/events
- https://developers.google.com/workspace/calendar/api/concepts/events-calendars
- https://developers.google.com/workspace/calendar/api/guides/event-types
