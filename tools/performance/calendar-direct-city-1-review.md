# Calendar Direct City Test 1 — 2026-10-08

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
