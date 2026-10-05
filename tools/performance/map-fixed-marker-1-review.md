# Map Fixed Marker 1

2026-10-05, branch `f50-widget-test`, parent `7b1d9f40b9ba9bfbf770e7258a6df5377d4fe4f3`.

## Observed result and question

At 20:38:41 Asia/Jerusalem the owner reports for Map GPS Pair 1: “התחיל עיכוב קטן לאחר שאני לא נוגע כמה דקות בטלפון לאחר מכן זה מתחיל להסתדר”. Small delay after several minutes of phone inactivity, improving during subsequent use. No stopwatch, request trace or exact idle interval. Marker correctness/freshness was requested but not separately confirmed by this message; do not invent confirmation or infer four GPS calls, a server cold start, Wi-Fi sleep or a Widgy bug.

Fast Map Minute URL1 has no native coordinates/marker; GPS Pair1 adds both native dependencies and location-dependent image/cache work. Preserve prior results and compare the first return after inactivity, not only immediate repeats.

## Matched control

`withMapFixedMarker` starts from GPS Pair1. Replace its two quoted native bindings with the synthetic string "0"; remove exactly those two native variable definitions. Preserve the coordinate parser, sync main(), minute t calculation, URL endpoint/parameter structure/reuse60, map_request variable identity/other fields, image source binding/frame/provider/cache flag/parent/order, all21 layers, navigation and static Calendar. Change trial name/description. One variable remains.

0,0 is a deliberately synthetic valid location in the ocean south of West Africa. It must render a marker and coordinate label; no city name is expected. Do not call this the owner's location or a final frozen-location solution. GPS/native sources, geocoder, city lookup and fetch/timers/async code are absent from the exported widget. The import page only fetches the public C16 template and strips inert calendar placeholders.

Keep the existing full lossless3306x1558 live renderer. No cache=synthetic-60 opt-in, fixed at time, backend/provider/region/cache-policy change or source-asset modification. Synthetic0,0 alone does not enable the server's separate synthetic CDN path. Actual marked PNG pixels/byte length and cache key differ from the owner's location; URLs no longer vary with coordinates. Therefore this removes native dependency evaluation AND real coordinate variability, not just GPS hardware. It cannot equalize network/cold-instance/cache warmth. Earlier fixed-GPS/no-city tests on the large widget were inconclusive and remain recorded; this is a matched21-layer follow-up, not a silent repeat/reinterpretation.

## Verification and gate

Local checks passed: `node tools/test-map-fixed-marker.mjs`, `node tools/test-map-gps-pair.mjs`, and `git diff --check`. Public deployment verification follows publication; the phone idle test remains pending.

Run the focused fixed-marker test and existing GPS-pair test. Validate full document equality except the declared variables/name/description, original parser/script/minute URL/cache behavior, valid0,0 rather than IP fallback,21unique layers/one variable/no Location sources and actual public import/copy/download/retry paths. Validate public deployment status and exact bytes of the three new runtime files. Use only a synthetic location for one public full-size PNG check. Native idle delay, marker appearance and actual request/refresh behavior cannot be measured in this Node test.

On the phone, import Fixed Marker1 in the same place/network and retain GPS Pair1/Minute URL1. First confirm the full map plus0,0 marker. Switch to Calendar and leave the phone untouched for a few minutes as in the reported symptom; then compare the first return to Home with two or three repeats. No stopwatch/video/second phone. Missing map or marker invalidates the intended marked-image control.

If the first return is immediate, the next narrow check is native coordinate evaluation/coordinate-driven URL variability, with a matched idle repeat of GPS Pair if needed. If it also pauses then improves, marked-image rendering/loading/cache is still involved even with no native location source; do not declare a server cause without evidence. Keep map/location isolated; restore city and other Home only after a stable dynamic-location path. Preserve Lean1 and full approved Ring2, final Ashkelon spelling, navigation, high-quality map and design. No production promotion or cleanup/deletion.
