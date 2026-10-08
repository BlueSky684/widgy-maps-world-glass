# Calendar Direct City Test 1 — 2026-10-08

## RETIRED — native city missing at 22:13 Israel

The owner's IMG_0103 shows Calendar on the iPhone Home Screen with only
“Israel” in the location bar, no city. The required display gate failed; no
successful speed result was reported. Return to the already-installed
Widgy Calendar Compact Stable Test 1. Direct City is not a new baseline and
must not be offered as a working optimization. No replacement import is needed.

This demonstrates that the direct-layer extraction did not produce visible city
text in this run. It does not identify interpolation, async ordering, missing
source data or parser execution as the unique cause, and cannot establish that
all native variable-to-layer usage is unsupported. The previous shared-city
copy's native fallback may mask the same missing extraction; its city visibility
alone never established which provider supplied the displayed value.

The22:06–22:13:10 window on preview dpl_J3ku1v2yPfvrT1Br4qbmUHJ5kRZe contains
six prepared map GETs: four MISS at809–858.1ms and two HIT at0.9/0.8ms,
4,368,719–4,371,787 bytes each, all200/full-body/nonconditional. At22:11:41 and
22:12:05 a changed URL returned the same image for the render key; differences
include city_observation_time and other_url_fields, plus minute_stamp for the
latter. Multiple retained copies were visible in the owner's earlier overview,
and there is no per-copy identifier in these logs. Do not attribute this whole
window or those differences uniquely to Direct City or claim a clean A/B.

City reads:13HIT and2MISS; HIT0.1–0.6ms. Calendar today REUSE6.5–9.4ms;
MISS451.6/303.9/263.2ms. Dots offset0 only,76.9/39.1ms. Origin cache availability
does not prove accepted client data, text binding or completed native display.
Exclude the agent probe at22:03:53, requestcnnfw-1791486229955-1577bfa30d44:
that separate request returned a complete decoded3306x1558PNG of4,378,901bytes.
All three delivered copy-page files were200 and byte-identical at publication.

Keep Compact Stable as the current functioning comparison and Native Steps
Ring2 as an older design backup. The owner may remove Direct City from the phone;
source/ciphertext and the private saved export remain reproducible. Do not repeat
this same inline-parser experiment or call the country-only screenshot a pass.
No runtime, production, map asset or current working widget was changed by this
outcome record. The performance goal remains unresolved.

## Historical preparation

Owner authorized the final evening experiments at 21:56 Israel. Baseline is
the exact installed Calendar Compact Stable Test 1 (SHA256
751bdc23d63c2914a1d66aef0cdf1adf0f65936176b8f0e61199219f6d448e16).
The preceding controlled log window contained one image request and seven city
cache reads, not evidence of one PNG request per transition. It does not identify
the native consumer that initiated each city read or measure native rendering.

This isolated copy moves the exact synchronous city URL parser from variable
calendar_city_prefix into Text layer80337. It reads ${widgy.map_request} there,
without adding fetch, geocoding, timers, memory caches or unsupported APIs.
Remove the old prefix variable and its visibility guard. Preserve the original
layer ID, frame, font, color, country source and position in Calendar.

The prefix variable also guarded the native-city fallback group81871, so keeping
that guard would retain the dependency this probe is meant to remove. Remove
that group and its two city layers81869/81870, then remove the now-unreferenced
calendar_native_city variable. Successful map-city output is identical to the
old parser; when the map city is absent/unresolved/invalid, this candidate shows
only the original native country. This explicit transient difference was told
to the owner and is stated on the copy page. It is not a full fallback-preserving
release. Do not claim identical missing-city behavior or a guaranteed speed fix.

Counts:1190→1187 layer/group nodes,55→53 variables,64 parseable script snippets.
Every retained variable, complete HOME/WEATHER/FITNESS tree, precise GPS inputs,
map source/URL/provider, minute refresh, city-cache scope, clock, native gauges,
all Calendar months/dots/separators and navigation are unchanged. No API, assets,
rendering, network caching or production configuration changes.

Test-calendar-city-direct-layer checks full-document equality after restoring
only the declared changes; input immutability; unique IDs/tap targets; no dangling
references; successful-city parser identity and34 synthetic cases covering
encoded punctuation, Unicode, control characters, long names, malformed and
unresolved values. Actual safe map-URL interpolation is exercised. Node cannot
simulate Widgy variable ordering, layer evaluation, city visibility or latency.
The same map variable may still be evaluated every refresh: reduced requests
are a hypothesis, not a consequence proved by this transform.

Private JSON: Widgy_Calendar_Direct_City_Test_1.json,916103 bytes; SHA256
884410d52ab15dd288c9360115e8711d0b3f7e7ffb87ff00bc11a120e9b629b1.
Only AES256-GCM+gzip ciphertext is published. The unique key stays in the private
copy-link fragment, excluded from Git. AAD is
widgy-calendar-direct-city-copy:v1:20261008. Exact clipboard, integrity,
wrong-key/tamper rejection and manual fallback checks pass. Run the configured
build before preview deployment; confirm READY and exact deployed helper bytes.

Phone gate: retain Compact Stable, import as a separate copy and assign to the
same Home Screen position. First check map and matching Calendar city. If only
country appears or map/city is absent, stop this trial rather than judging speed.
If complete, two Home–Calendar–Home cycles; report faster/similar/slower with
“בוצע עיר ישירה”. Correlate origin logs while excluding agent probes. A failure
returns to the current baseline. No further city/cache variants tonight unless
this result provides a specific new reason.
