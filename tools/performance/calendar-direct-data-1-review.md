# Calendar Direct Data Test 1 — 2026-10-08

## Outcome: failed city-display gate; retired as a candidate

At 22:34 Asia/Jerusalem the owner identifies IMG_0104.jpeg as the latest
version. Calendar shows its pin but no city or country text. The date, grid,
separators, dots and empty-day panel are visible. The screenshot does not
establish Home-map behavior, transition speed or populated-event rendering.
Do not count this as a successful optimization or request more trials tonight.
Keep Calendar Compact Stable Test 1 as the last known working control and the
older Native Steps Ring 2 backup. Compact Stable is not proven immune to the
intermittent city/map issues. Retain this candidate only for reproduction.

Rechecked the actual delivered 915426-byte JSON, SHA256
26fad1361d77da5349e30e16cbf586a3487e9c613cfdaca14b40d6a3a573f8eb:
it exactly equals the tested transform of Compact Stable. The whole-document
whitelist test passes, including every retained variable, city layer, fallback
guard and Home node. This verifies file structure, not native rendering.
Neither source equality nor this screenshot establishes whether the data-source
move caused the blank city, or an existing intermittent binding problem recurred.
Do not blame Widgy, the network, or the nine moved fields as a proven cause.

Preview dpl_6hRFu7bCrp93MVKG1yHzp7PH4HJ5 was READY at source commit
5f258a5dd578c4ae0bc56d48c2b369ea0aa6b9e4, target null. The three public copy
files matched local bytes over HTTP 200. The synthetic 0,0/Example agent probe
completed 19:27:28.747 UTC, request
sfo1::fra1::x9stz-1791487645190-22c58cb8db38, with a complete nonblack
3306x1558 PNG of 4359983 bytes. Exclude it from native observations.

Read-only logs for 19:28:00–19:35:30 UTC, with no agent map/provider requests
inside that window, show:

- 26 city-cache responses: two MISS then 24 HIT; HIT server time 0.1–0.4 ms.
  HIT logs do not prove Calendar received or displayed the city, and contain no
  per-widget-copy attribution or raw city/location.
- Four prepared map responses, all 200/full-body/nonconditional: three MISS
  at 999.3, 945.5 and 961.8 ms, then HIT at 1 ms. PNGs are 4348076–4349763
  bytes. The last request changes only minute_stamp but reuses identical image
  bytes. The first previous-key comparison includes the earlier synthetic
  probe and is not evidence of user movement. Prepared is not phone delivery.
- 26 today-data responses: two provider MISS at 448.7 and 264.7 ms and 24
  REUSE at 5.5–10.4 ms. Two offset-zero dot responses at 76.6 and 1.4 ms,
  each 7513 bytes. All selected responses are 200. These server timings are
  not end-to-end phone timings or a controlled per-copy speed comparison.

Next investigation must isolate city data availability, variable substitution
and fallback visibility in the native widget before more speed variants. No
new widget, backend change or production publication accompanies this record.

## Original trial and prepublication checks

At22:18 Israel the owner requests one final test before sleep. Direct City1
failed its city-display gate and remains retired. Start from the exact current
Compact Stable1 export, not the country-only candidate. Its source SHA256 is
751bdc23d63c2914a1d66aef0cdf1adf0f65936176b8f0e61199219f6d448e16.

Move nine single-use Calendar JSON Endpoint source objects into their existing
native Text consumers. They are start/end fields of four event rows (eight
fields), plus calendar_bridge_count. No formatting, URL, auth, method or JSON
path is rebuilt: copy the original source object exactly and remove only its
unformatted String-variable wrapper after proving no other name/UUID consumer.

Keep all1190 nodes and their IDs, frames, fonts, source order, conditions and
navigation. Variables55→46, with all retained variables identical. Preserve
all HOME/WEATHER/FITNESS nodes, map_request, calendar_city_prefix,
calendar_native_city, the complete native-city fallback and spelling handling,
GPS precision, full-resolution PNG, native gauges, live clock, all25months,
dots and separators. The four calendar_home_* fields and steps_label stay in
their original variables. No server, endpoint, cache, source asset, account or
production changes. An optional selection predicate on the existing inlining
helper leaves the previous default behavior unchanged.

This source placement was part of the older combined fixed-map experiment,
but was deliberately absent from the current Compact Stable live-map baseline.
The new test isolates just the nine Calendar data bindings; it is not another
city-parser, city-cache or map-image variant. It does not reduce the number of
data fields and makes no claim about HTTP counts or native evaluation order.
Direct native layers may behave differently from global String variables; only
the phone can determine whether presentation remains correct or speed changes.

Validation: test-calendar-direct-data.mjs checks whole-document mutation
whitelist, immutable input, exact provider source objects and all retained
variables, untouched city/fallback/Home, no dangling references, unique IDs,
valid taps,64 parseable JS snippets and the native day gauge. The generic helper
still finds its previous14 eligible sources by default, including steps_label;
the new candidate limits selection to nine inside Calendar only. Exact clipboard
content, decryption integrity, wrong-key/tamper rejection and manual fallback
pass on the new page. Configured build runs before preview publication.

Private output: Widgy_Calendar_Direct_Data_Test_1.json,915426 bytes; SHA256
26fad1361d77da5349e30e16cbf586a3487e9c613cfdaca14b40d6a3a573f8eb.
Only AES-GCM/gzip ciphertext is public; key fragment stays outside Git. AAD:
widgy-calendar-direct-data-copy:v1:20261008. The existing baseline copy page is
unchanged. Deliver after preview READY and exact public helper-byte checks.

Phone gate: import separately, keep Compact Stable alongside it. Confirm map,
city and Calendar content first, then two Home–Calendar–Home cycles. Report
“בוצע נתונים ישירים”, display correctness and faster/similar/slower. If there are
no events today, this checks the empty display/count only; future populated-row
native display remains unverified. Stop on any missing content and keep Compact
Stable. If no meaningful benefit, record the result and end tonight's tests;
do not silently promote a lower variable count as a speed success.
