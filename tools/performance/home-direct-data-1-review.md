# Home data paths — 2026-10-09

At 11:33 Asia/Jerusalem the owner reported slight improvement with the server
colour-pass update and requested work on the other Home components: steps,
location, clock, day progress and weather. The same-map sparse Home experiment
supports investigating these components together. Incremental addbacks produced
small subjective changes; the owner later withdrew confidence in their size.
Neither those observations nor source counts identify a single proven cause.

Baseline: delivered Runtime 2 JSON, SHA256
`1ffb4537810bbb03310ed251f4a38874d3073b7261cd7ae7051e58e10f15b547`,
with current preview server commit `088f74ad75ac986842aaa8ec60eea2b23c2dc35c`.

## Source inventory and decisions

| Home component | Existing path | Candidate |
| --- | --- | --- |
| Step count | Native Pedometer → numeric variable → formatting JS String variable → Text | Same Pedometer/numeric variable → original formatting JS directly in Text |
| Step ring | Native Pedometer / Steps, goal 10000 | Exact native ring retained |
| Distance / calories | Direct Pedometer / Distance and Health (Daily) / Active Energy Burned | Already direct; exact sources retained |
| Home event count, event word, title, metadata | Four JSON Endpoint fields → four single-use String variables → Text | Move each original source object directly to its original Text layer |
| Reminders | Native Agenda (Today) / Reminder Events Today | Exact source retained |
| Greeting | Clock-only JS variable → four conditional static Text copies | One original Text layer with the exact original clock-only JS |
| Live clock | Native Live Timer (24 hours, No Seconds) | Already native; no replacement or polling |
| Day percentage / gauge | One clock-only JS variable for text, one standalone JS for the native linear gauge | Retained; routing the gauge through a global variable would add a dependency |
| Sunrise / sunset | Direct native Sun And Moon fields | Already direct; no external API added |
| Weather values | Four direct Weather (Now) text sources; Status (Full) and Wind Speed variables shared by icon conditions | Exact sources and shared variables retained |
| Weather artwork | 41 conditional groups, 40 drawing leaves | Four single-symbol wrappers removed; exact predicates move onto their symbols |
| Location / city | Native GPS pair → existing client resolver → live map; independent native Calendar city | Exact pipeline retained for this Home-only candidate |

Native Weather, Health and Pedometer retrieval is controlled by Widgy, not by
our Vercel API. The step ring and numeric step variable both name Pedometer,
but source definitions do not establish duplicate OS queries. Weather's six
fields likewise do not establish six HTTP requests. Do not add another weather
provider, Health upload, persistent stale value or invented native cache field.

Calendar still has 39 JSON field bindings to the same URL. Moving four of them
to Home text does not reduce field count or prove fewer HTTP requests. It
removes one explicit variable-substitution stage on each path. Native source
scheduling/coalescing cannot be executed in this environment. The earlier
Calendar Direct Data trial moved different fields and failed its city gate;
this candidate leaves all Calendar layers and retained variables unchanged.

## Changes

- Whole widget: 1194 → 1187 nodes; 67 → 61 global variables.
- Home descendants: 124 → 117. Weather groups: 41 → 37.
- Greeting: four layers/four conditions → one layer with no global dependency.
- Steps and Home events: five intermediate String variables removed.
- JavaScript definitions remain 26: two scripts move to their consumers.
  There is no new weather classifier, async job, network source or timer.

The four weather wrappers have no effects, manual visibility or tap targets.
Their constant frames match the enclosed symbols' automatic bounds. Moving
their predicates preserves the entire ordered drawing list, every ancestor
predicate, original leaf geometry/material and paint order. Other weather
wrappers remain because they implement required combinations and fallbacks.

The 1×1 legacy sun/fitness placeholders, overprinted date-weight layers and
working native gauges were not deleted on appearance assumptions. No source
supports promising that removing them would solve the remaining delay.

## Verification

`test-home-direct-data.mjs` checks input immutability, exact source objects,
all retained variable definitions, original paths/request options, 86,400
greeting-second cases, 13 step-format cases, all 40 weather drawing/predicate
records, every navigation action, unique layer IDs, 26 script parses and a
whole-document reversal limited to the declared changes. Unexpected extra
consumers, group effects, geometry and greeting styles are rejected.

The map, native city, full Calendar, shared date, other tabs, repaired month
arrows, time, day gauge, ring, GPS and all direct sensor sources are structurally
identical. This is not native UI execution or a measured phone speedup.

The complete candidate is `Widgy Home Direct Data 1`, 921327 bytes, SHA256
`07ed041dff447529cc107f8121356bf209ad33f9883b31f0f3b184714cdd497d`.
Encrypted Copy Full JSON checks cover exact clipboard bytes, bad/missing keys,
tampering and manual fallback. Full configured build is required before the
preview publication, then verify the three served assets byte-for-byte.
Public files contain ciphertext only; the key remains in the private link
fragment. Keep Runtime 2 as backup. No additional timed phone trial is requested.

Scope: `f50-widget-test` preview only. No production or server API change.
