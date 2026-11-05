# Annual calendar data reuse

The widget's 12 months of a calendar year previously required several adjacent
three-month provider windows. `reuse=year-v1` now reads the requested local
calendar year's events once, including the January and December overflow days.
All 12 months use that annual snapshot. A different year gets a different key;
the existing navigable offsets -12 through +12 are unchanged and span 3 years.
Legacy URLs and `reuse=months-v1` retain their behavior.

The shared provider deadline remains 60 seconds, measured from the provider
read. Hits do not extend it. When it expires, the next request reads a new
annual snapshot. All month PNGs and indexes belong to that snapshot, so no
sibling month image can survive into the next server generation. This is
request-driven refresh, not a scheduled job or a promise that Widgy refreshes
every displayed/downloaded image at the same instant. Existing private client
response freshness (at most 30 seconds) remains; CDN caching remains disabled.

The annual day index is prepared once instead of parsing/sorting annual events
again for each month. Each view takes its own exact slice, and up to 12 month
PNG entries are retained per provider entry. Images are rendered on demand,
not downloaded or rendered as a burst of 12 additional requests. The existing
50,000 retained day/event-reference limit is enforced. A denser annual index
falls back to monthly indexing without retaining the annual day expansion.

Provider capacity errors (`event_limit`, `provider_response_too_large`,
`recurrence_limit`) use the original monthly range. A bounded 60-second hint
avoids repeating the rejected annual read on each month change in the same
function instance. It contains hashes only, expires without sliding, and is
limited to 50 entries. Authentication and other provider errors are not hidden
by this fallback. Annual requests retain all existing pagination, response-size
and recurrence limits; a very busy year can need multiple provider HTTP pages.

The annual first load may take longer than a monthly or three-month first load.
The main gain is avoiding repeated provider reads and repeated event indexing
when moving to other months. Local and server timings do not measure iPhone
tap-to-display time or guarantee how Widgy schedules its refreshes.

Validation:

- 4,800 month coverage cases over the Gregorian 400-year leap cycle.
- Jerusalem, New York and Kiritimati date handling, DST, leap day, year
  boundaries, all-day and recurring events, moved exceptions and cancellations.
- 72 byte-identical original/annual PNG comparisons and exact TODAY snapshots.
- Handler tests: 12 simultaneous months -> 1 logical provider read; all 25
  visible offsets -> 3 annual reads; 12 separately cached month PNGs; a new
  provider generation replaces every month's image/index together.
- Exact legacy JSON/PNG, existing three-month URLs, cross-instance shared cache,
  account isolation, TTL boundary, capacity fallback/cooldown, auth-before-cache,
  error propagation and HEAD behavior.
- Widget validation: exactly 62 URL flag changes. Every other field is
  preserved, including all 500 objects, map, native Today circles, scripts,
  layout and navigation actions. ZIP contains one raw-DEFLATE `.widgy` file.

```sh
node tools/test-calendar-year-window.mjs
node tools/test-calendar-year-handler.mjs
node tools/test-calendar-month-handler.mjs
node tools/test-calendar-provider-cache.mjs
node tools/test-calendar-tab-cache.cjs
python3 tools/build-widget-year-reuse.py /private/version5.json /private/output
python3 tools/test-widget-year-reuse.py /private/version5.json /private/output
```

Private widget JSON, `.widgy` and ZIP files contain account-bound endpoint
credentials. Keep them out of repository fixtures and commits.
