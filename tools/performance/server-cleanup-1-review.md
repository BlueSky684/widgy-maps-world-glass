# Home / Calendar autonomous performance review — 2026-10-09

Owner requested independent investigation instead of more phone trials. Scope:
`f50-widget-test` preview, full approved design, exact live GPS/city, lossless
3306×1558 map and complete Calendar. Production is unchanged. No further phone
timing task is required for this delivery.

## Findings

Control: `Widgy Native City Spelling Test 2`, the full Home counterpart of the
add-back tests, with working frontmost native city. 1189 stored JSON nodes,
55 variables, 64 JS occurrences.

| Area | Finding | Action |
| --- | --- | --- |
| Home | 142 nodes; conditional weather icons include alternative states | Keep approved dynamic artwork; different guards do not mean redundant visible icons. |
| Calendar | 997 nodes; 25 month panes, 75 native month/layout grids | Keep month range and 4/5/6-week layouts. |
| Today | 95 conditional placements / 475 nodes, including triple-drawn bold numeral | Keep approved weight and positioning. These are alternate states, not evidence all render at once. No verified dynamic-position export supports collapsing them safely. |
| Shared visuals | Ten date/navigation leaves match exactly across Home and Calendar | Share one group, preserving source, font, geometry, color, weight and overlapping paint order. |
| GPS | Literal `true` map invocation only reads the first of two GPS pairs | Remove unread fallback arguments and their two native coordinate variables; active exact-coordinate sources stay unchanged. |
| City | `calendar_city_prefix` is unreachable after native city repair | Remove its script/dependency; native city, Ashkelon normalization and live map city mechanism remain. |
| Calendar server | Repeatedly parses/sorts/indexes the same cached month | Reuse that day index within the original private provider-cache entry. |
| Map server | Copies composite RGBA into JS and then back into sharp for encoding | Use one continuous native pipeline at full resolution. |

Read-only sample retrieved 06:15:44Z: latest 100 matching `prepared` log records
within 45 minutes. This capped sample is not a census or attributed to a widget:

- Calendar today: 65 reused results, median 7.1 ms (5.1–25.2); seven misses,
  median 256.7 ms (229.6–598.5).
- Calendar dots: eight reused results, median 42 ms; PNGs 7513 bytes.
- Map: 14 misses, median 847.1 ms (800.4–1549.4); six hits, median 1 ms.
  All sampled map responses sent complete 4.10–4.15 MB PNGs. No conditional
  304 observed; several hit URLs differed only by minute stamp.
- Separate city sample: 42 hits / 13 misses; server preparation 0.1–0.9 ms.
  This excludes network and fallback geocoding time.
- Error/fatal query for 05:57–06:27Z returned no matches. A wider query was
  rejected by retention. This does not resolve historical black-map reports.

No live map, private calendar or geocoder request was generated for this
analysis. Server preparation does not prove delivery, decode or native display.
Phone evidence supports a faster map-only Home; incremental add-back differences
remain subjective. The dot trial did not expose physical touch time.

## Implemented safeguards

Map masters, solar maths, exact GPS, text, clipping, PNG settings, sRGB profile,
resolution and cache freshness are unchanged. Removing the intermediate
3306×1558×4 buffer avoids materializing 20,602,992 bytes; this is a data-flow
reduction, not measured resident-memory savings. Smaller legacy widths retain
their original post-composite resize order.

The Calendar index belongs to its original private, account/month-specific
60-second provider entry. No new request or extended freshness. NOW/NEXT and
generatedAt are still recalculated at each current instant. Dense calendars
above 50,000 retained event references are not memoized (at most 50 provider
entries implies at most 2.5 million additional retained references).

Full native cleanup: 1189 → 1180 stored nodes, 55 → 52 variables, 64 → 61 JS
occurrences, four → two native GPS coordinate definitions. Ten duplicate leaves
removed; one shared group added. Home 132 / Calendar 987 / shared group 11.
No original visible artwork removed; no tap dots.

The existing 16 navigation actions show the shared group for Home/Calendar and
hide it for Weather/Fitness. Month reset and arrows stay exact. Its frame
matches the existing 1600×1600 tab frames. Hoisting is rejected if it reverses
the order of previously overlapping drawings; date-weight order is retained.

## Verification and measured scope

- Twelve fixtures captured before modification: PNG bytes, decoded RGBA,
  dimensions and metadata all match exactly afterward, across seasons,
  null/out-of-projection locations, precise synthetic GPS, edge and long/escaped
  labels, atlas/presentation choices, diagnostics and legacy smaller widths.
- Local alternating warm benchmark, newly rendered maps: 515.0 → 392.5 ms,
  457.9 → 355.6 ms, 488.5 → 360.6 ms at three solar instants: 22.3–26.2% saved.
  PNG byte size is unchanged. See `server-cleanup-1-benchmark.json`.
- Reused Calendar index, 30 synthetic requests per size: snapshot medians
  1.650 → 0.044 ms (0 events), 1.971 → 0.043 (10), 4.144 → 0.170 (100),
  14.050 → 0.376 (500). These are processing components, not network totals.
- Prepared-day parity: 96 date/zone states, DST, leap years, midnight,
  deduplication, language order, NOW/NEXT boundaries, entry/window isolation,
  retention bound and exact dot PNGs in six layout/bounds combinations.
- 38 Calendar tests pass; response diagnostics retain bodies, headers,
  coalescing and private logging behavior.
- Full JSON reversal verifies the change whitelist. Twenty mocked map runs
  retain complete callback URLs and fetch sequences with precision, locale,
  invalid coordinates, cache hit/miss/memory and offline paths. No real geocoder.
- Encrypted copy tests cover exact bytes, missing/wrong keys, tampering and
  clipboard fallback. All 61 remaining scripts parse.

These remove verified wasted work; they do not establish a 22–26% faster native
transition or resolve black maps. Widgy scheduling/rendering/decode remain
unmeasured. Server changes benefit existing preview-branch copies; the optional
new JSON is only required for layer/variable cleanup. No new user trial requested.

## Unadopted changes

Full PNG transfer remains about 4 MB. Minute URL changes, split image layers,
smaller resolution, WebP and static substitution have earlier unresolved
behavior/fidelity evidence; do not repeat them as new fixes. Replacing native
date weight or Today placements needs verified bindings or fidelity evidence.
Adding extra JS globals is not inherently faster.

Official PNG settings reference checked: https://sharp.pixelplumbing.com/api-output/ .
Prior compression/adaptive-filter investigations already reject their CPU/size
tradeoff; this change leaves encoder settings intact.
