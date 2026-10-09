# Weather Premium 1 — 2026-10-09

Baseline: f50-widget-test at 05309083e0600bb3a7eb257d01e6704613428f4d,
private Widgy Lean Clock and Data 1 export. Scope: replace Weather placeholder.

## User-visible result

The approved technical layout, outlined Phenomena typography, and all eleven
revision 04 approved icons are compiled from their original code/geometry.
Current conditions, feels-like/high/low, humidity, wind, UV, six chronological
model hours (current hour plus five), and five local dates are live. Forecast
icons switch by condition and actual day/night state. The local date and paired
map city/country reuse the proven native Calendar definitions, including the
Ashkelon correction and missing-country fallback. The source and update time
occupy the gap between the daily card and navigation. This attribution is the
only extra visible line relative to the mockup.

Weather is a dynamic, lossless server-rendered panel over immutable chrome, not
a screenshot of sample values. This preserves exact icon geometry/typography
with one weather image request instead of many per-field/per-icon requests or
native conditional branches. It is not a claim that Widgy skips hidden images.

## Data and performance behavior

- New Weather uses Open-Meteo model data. Home retains its existing native
  provider; temperatures/conditions can differ between them.
- Existing precise native GPS variables feed the endpoint. The Weather server
  alone uses rounded 0.01-degree cells to reuse forecasts; map GPS is unchanged.
- One batch contains current, hourly and daily data. Regional Runtime Cache
  keeps the last success for one hour and treats it as fresh for ten minutes.
  Failures can use the previous result with a visible last-update timestamp;
  after the limit, values are dashes with an unavailable message, never examples.
  Empty/invalid GPS never triggers IP geolocation or a fake zero coordinate.
- Same-process simultaneous requests share one pending provider request. A
  bounded rendered-image cache reuses bytes. Device caching is private, five
  minutes with revalidation; precise location URLs are not publicly CDN-cached.
- Current Weather refresh is governed by Widgy's own refresh scheduling. No
  background refresh interval or instant tap-response claim is introduced.
- Weather now has 21 native nodes versus 25 placeholder nodes. Total 1187
  versus 1191; variables remain 62. No new global JavaScript/async variable.
- Chrome is 306304 bytes at 2270×2368. A representative live transparent panel
  is about 172 KB at 2270×1608. No runtime external font requests.
- Local live provider test: first read 4257 ms; same-cell cached read 1 ms;
  PNG rendering took roughly 300–380 ms in the local environment. Local SDK
  explicitly fell back to memory; these do not prove regional-cache behavior
  on Vercel or tap-to-display performance on iPhone.

## Verification before publication

Eight automated suites cover input validation, complete documented weather code
mapping, null values, day/night/severe-weather priority, local dates/midnight,
Kathmandu offset, repeated DST hours, missing coverage, stale provider data,
single-flight/cache/failure/expiry, PNG dimensions and content, HTTP method/HEAD/
ETag/private caching, whole-widget isolation and all native reference targets.

Whole-document comparison permits only Weather plus title/description/maximum
ID metadata changes. Home, Calendar, Fitness, shared Home/Calendar group, all
variables, fonts, live map, native clock/gauges and navigation are byte-equivalent
as JSON objects. Existing Weather tap actions remain exact. Cleanup checks
preserve 187 existing runtime/design files and all five prior encrypted exports.

New encrypted JSON: 925595 bytes, SHA256
ea2adbd230a9ff0dc80570b4f913f8cfc6bcfe153ee1e9c8659834c79d19329e.
The new copy script passes exact JSON-token round-trip, multiline default,
compact toggle, both clipboard fallbacks, missing/wrong key and tampering gates.
Only encrypted content is published; the key stays in the owner's URL fragment.

Local headless browser was unavailable and its download failed. Programmatic
copy-runtime tests passed; deployed page/browser verification is a separate
release check. Native Widgy itself has not run in this environment. Visuals and
refresh timing on the owner's iPhone remain to be confirmed. Keep Lean Clock
and Data 1 as backup. Production is outside this change's scope.
