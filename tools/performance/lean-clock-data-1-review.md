# Deep current-widget audit and Lean Clock and Data 1 — 2026-10-09

Scope: BlueSky684/widgy-maps-world-glass, preview branch f50-widget-test.
Baseline commit c2a80846fc091070a528ad32df4cc494b6520ee5; private full export
Widgy Calendar City Country 1, SHA256
27da272a0b6cf0d01d5ea9dfe3ab89f6b75665f06e680f18973d121da6f2cd17.

## Actual inventory, not assumed runtime counts

`audit-latest-widget.mjs` follows both `${widgy.name}` and native UUID references
through every variable and layer. The public audit contains only safe inventory
names/counts; no private sources, event text, coordinates or scripts.

- 1192 nodes, 63 variables; all variables reachable, no dependency cycles.
- Home: 118 nodes including its root; Calendar: 1013 including its root.
- Calendar: 25 months, 75 native month grids, 95 Today placements and 285
  intentional date/weight text drawings. They are alternate states and approved
  overprints, not 285 simultaneous visible dates or accidental duplicate layers.
- 39 native JSON field definitions share exactly one literal URL. This does not
  prove 39 requests or perfect native request coalescing.
- 180 custom-shape libraries contain no unused items.
- The nine eligible single-use Calendar event-time/count wrappers were already
  trialled in Calendar Direct Data 1 and retired after a city-display failure.
  Cause was not established. They are not silently reapplied as a new discovery.
- Remaining one-child weather groups carry different predicates, often wrapped
  around a child that already has a predicate. Removing the wrapper would lose
  part of the condition. No guessed multi-predicate schema or JS classifier is
  substituted for the current native Weather conditions.
- The longest explicit variable dependency is three definitions:
  native GPS -> async map_request -> calendar_location_pair. The paired city
  label can depend on the map URL lookup, even though it does not download/decode
  the PNG itself. This remains a possible scheduling bottleneck, not a proven
  measured duration. Removing it would change the newly requested city/country
  behavior; the verified native fallback and map pair are retained.
- Steps, live clock, native day gauge, Weather, SunAndMoon and Health remain
  native. Equal provider names do not prove duplicate underlying OS queries.
  No claim is made that Vercel accelerates their private native evaluation.

## Fresh operational evidence

Read-only latest-preview logs, 13:54–14:24 UTC, contain an observed cluster at
14:17–14:18 UTC (no agent API probes in that interval):

| Response | Observations | Server preparation |
| --- | ---: | --- |
| Today, provider reuse | 4 | 1.6, 1.8, 1.9, 2.1 ms |
| Today, provider miss | 1 | 439.5 ms; provider wait 382.1 ms |
| Month dots, provider reuse | 1 | 70.2 ms; PNG 7513 bytes |
| Map miss | 1 | 1699.4 ms; PNG 4041461 bytes |
| Map hit, same render key/image, new minute URL | 1 | 0.9 ms; full 4041461 bytes, nonconditional |

These are preparation timings, not delivery/decode/tap-to-display measurements.
They support investigating transport and native scheduling rather than claiming
small arithmetic savings solve the entire transition. The first 1h log query
was rejected by retention; a corrected 30m query succeeded. No auth change.

## Delivered changes

1. Home percentage text now runs its existing local clock arithmetic directly
   in the original text layer. Remove the global day_progress variable and
   two conditional checks; remove its old -1 fallback layer, which the valid
   local clock can never produce. Native linear gauge, clock source, percent
   rounding, font, frame, colors and refresh mechanism are unchanged.
2. Calendar month layout computes the first weekday once and advances by the
   correct Gregorian month length. Month-name rotation uses a modulo index.
   Across these 13 scripts, Date construction goes from 75 to 14 per full
   evaluation. Script count/evaluation scheduling is unchanged; no new shared
   async variable, cache, clock cadence or dependency is introduced.
3. Server event time parsing is reused by the day index, Home event selector
   and Calendar rows. Numeric milliseconds replace repeated DateTime coercion
   inside overlap loops. Home selects its next event in one pass, preserving
   stable tie order, instead of filtering/mapping/sorting a second event list.
   An object-identity WeakMap retains only derived times,
   invalidates on ISO/zone changes and resets at 2048 insertions. It cannot retain
   event keys beyond their existing lifetimes. Provider expiry, authentication,
   NOW/NEXT boundaries, generatedAt and private HTTP caching remain unchanged.

The full widget becomes 1191 nodes / 62 variables. This is intentionally a
small native cleanup, not evidence of a large phone speed increase. Server
changes also benefit existing copies that use the preview alias.

## Validation and measured limits

- 146132 date cases: every date of the 400-year Gregorian cycle plus timezone,
  skipped civil day, leap day, DST and new-year cases. Every complete layout
  string and month label equals the prior code exactly.
- All 86400 seconds of a day yield the same percentage. Existing native gauge
  is byte-identical. Map/GPS/city/country sources and Calendar drawing tree exact.
- Whole-document restoration permits only the declared changes; native action
  strings, including all 48 month arrows, remain verbatim. Unique IDs, all
  reference/target resolution and parseable scripts verified.
- Independent old code from the pinned baseline is the event-data oracle:
  36 month/zone indices, 2700 boundary snapshots and six exact dot PNGs match.
  Cache mutation/zone/object isolation, size reset and invalid data tested.
- 41 existing Calendar/provider/security/cache tests pass with synthetic input.
- Alternating local benchmarks are in event-time-reuse-benchmark.json. Warm
  Home/Calendar snapshot processing for 100 same-day events: 1.484 -> 0.053 ms;
  500 events: 7.232 -> 0.092 ms. Empty day: 0.035 -> 0.030 ms. Cold 500-event
  indexing: 14.192 -> 11.532 ms. Cold 10-event indexing slightly regressed,
  1.625 -> 1.662 ms; do not imply all cases improved. These are synthetic CPU components, excluding
  provider/network/native work. The actual empty-day phone should not be promised
  a significant speed gain from this server change.
- Full encrypted copy, wrong/missing key, tampering, exact tokens, default
  multiline copying, compact toggle and both clipboard fallbacks verified.
  The owner confirmed multiline visibility on the preceding copy at 16:45 Israel;
  preserve that format by default. New native widget speed remains unmeasured.
- Configured four-step Vercel build passed before branch publication.

Private candidate: Widgy_Lean_Clock_And_Data_1.json, 924233 bytes, SHA256
b9f652d1faeda6198127656f6909129f6e4e5b236f27599e884a6b6d872b324d.
Only AES-GCM/gzip ciphertext and its copy UI enter Git; the key stays in the
private URL fragment. Keep City Country 1 as backup. No timing homework or
multiple trial imports. Intermittent black map is not declared fixed.
