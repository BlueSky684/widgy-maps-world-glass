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

Nine automated suites cover input validation, complete documented weather code
mapping, null values, day/night/severe-weather priority, local dates/midnight,
Kathmandu offset, repeated DST hours, missing coverage, stale provider data,
single-flight/cache/failure/expiry, PNG dimensions and content, HTTP method/HEAD/
ETag/private caching, whole-widget isolation and all native reference targets.

Whole-document comparison permits only Weather plus title/description/maximum
ID metadata changes. Home, Calendar, Fitness, shared Home/Calendar group, all
variables, fonts, live map, native clock/gauges and navigation are byte-equivalent
as JSON objects. Existing Weather tap actions remain exact. Cleanup checks
preserve 186 existing runtime/design files and all five prior encrypted exports.

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


### Deployment function limit

The first Preview build hit the Hobby plan's 12-function limit. The Weather
handler now lives in `lib/weather/handler.js`; a narrow `/api/weather-panel`
rewrite dispatches through `api/fetch-probe.js`. Ordinary fetch-probe responses
and headers are covered by regression tests. This keeps 12 deployed functions
without changing map/calendar handlers or any production routing. The public
Weather URL and encrypted widget payload remain identical.

## Revision 2 — menu consistency and small-icon legibility

The first on-device screenshot exposed that the technical mockup's menu used
Phenomena outlines and drawn symbols, unlike the real BarlowCondensed-Light /
native-symbol menu. R2 removes all menu text/icons from the static chrome and
clones the eight exact native Home/Calendar/shared navigation layers. Only
Weather's selected color changes; the four tap actions remain exact. Regression
checks compare font, glyph, frame, size, and every other visual property with
the existing menu. The runner is the original `figure.run` symbol.

Hourly icon boxes: 46 → 60 pixels (+30%); daily: 35 → 46 (+31%). Precipitation
indicators: 13 → 20 and 12 → 18 (+54% / +50%). No approved icon path is changed.
Visual inspection of the combined actual SVG/PNG confirms spacing and row fit.
Header, city/country and menu remain native overlays and are verified in JSON;
a new iPhone screenshot is still needed to confirm the final native rendering.

Chrome R1 and the v=1 dynamic image preserve the prior import's appearance.
R2 uses chrome-r2.png and v=2. There are no new network requests or variables;
the only new native layers are the eight lightweight menu elements. Home,
Calendar, Fitness and shared groups remain object-identical to the baseline.

All nine Weather suites, cleanup/build gates, and exact multiline JSON copy /
clipboard fallback / key / tamper tests passed for the new payload. R2 JSON:
928690 bytes, SHA256 a045d4ff2cd6e3a7f0acf21bbb2b02f6c21de70fe4189560f04948f5d506fb7f.
The existing owner key is reused with a fresh encryption IV; it is never saved
in the repository. The same copy page now serves Widgy Weather Premium 2.


## Revision 3 — balanced current-conditions card

Reorganizes only the hero interior: temperature 110 → 82 cap height (−25%),
approved icon 141 → 180 box (+28%), Celsius follows actual number width,
condition text sits under the pair, and all six metrics have consistent aligned
centers. Wind direction is omitted as requested; speed and km/h remain live.
The hero frame size and position are exact. Native menus and all R2 forecast
icon sizes are retained. No request, variable, layer, or provider was added.

Nine Weather suites, private full-JSON round-trip/copy fallbacks, build and
cleanup checks pass. Pixel checks confirm chrome outside the hero and live
forecast/footer pixels remain identical to R2. Null, negative, zero and high
temperatures were rendered without malformed text. The revised card was also
visually inspected. Native iPhone review remains outstanding.

R3 JSON: 928791 bytes; SHA256
f569261aa0233f652c5747ac8d7d03b331b87aef4725d6a46fb7c498c2874cfc.
AQI availability was investigated separately; AQI is not part of this revision.
