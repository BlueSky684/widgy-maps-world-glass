# Map Stable Marker 1

2026-10-05, branch `f50-widget-test`, parent `1afbb5bdaa13f2e2bb29d2cf1619cc5fe85bc64e`.

## Evidence

At 20:48:48 Asia/Jerusalem the owner reports for Fixed Marker1: “ההחזרה הראשונה טובה, דקה לא נוגע בטלפון, בודק ההחזרה איטית ואז משתפרת”. First return good; after about one minute untouched, return slows and subsequent use improves. The exported Fixed Marker1 has no native Location source, so native GPS evaluation is not necessary for this reported delay. It does not prove GPS never adds delay in the complete widget. No measured duration/request trace or separately confirmed marker freshness/position.

Two existing boundaries are relevant in source code: the emitted t suffix changes per wall-clock minute WHEN Widgy evaluates the script, and the existing private render/client cache expires no later than60 seconds from rendering. These are different clocks and cannot be equated to the user's approximate one-minute observation. Earlier Minute URL1 was reported normal without delays; preserve this contrary result, not a retrospective reinterpretation. The older Cache URL1 stable-URL trial on Lean1 with69 variables/1289 layers gave no improvement. New reason for this small matched test: idle slowdown now reproduces in21 layers/one variable with synthetic location and no native GPS.

## Exact experiment

`withMapStableMarker` starts from Fixed Marker1. Remove only the trailing ` + '&t=' + stamp` from the returned URL and change trial name/description. Deliberately leave Date.now and minute-stamp calculations present so script evaluation is not simplified at the same time; this temporary unused result is documented test control, not final cleanup.

All21 layers, one synchronous map_request variable, coordinate parser/synthetic0,0 values, image source binding/provider/cache flag/frame/parent/order, navigation and static Calendar remain exact. Full lossless3306x1558 live day/night renderer and marked image path stay; no city, GPS, geocoder, synthetic-CDN flag, fixed rendering instant, added data or backend/TTL/provider/region change. Stable URL is identical across time. Existing server still selects current time on an actual render, but this does not guarantee Widgy refetches/revalidates or displays current pixels. Image freshness must be checked before adopting this in the final widget.

## Verification

Passed `node tools/test-map-stable-marker.mjs`, `node tools/test-map-fixed-marker.mjs`, and `git diff --check`. Full-document equality permits only script/name/description differences. Generated URL equals the old one with only t removed across six times around minute boundaries and later minutes/hour; clock calculations retained. Real parser/resolver accepts0,0 and does not use IP fallback. All21 unique layers/one variable remain; no native coordinate bindings/private tokens. Actual public-template import/copy/download/retry/failure/pageshow/clipboard-blocked paths pass. Published status and exact new runtime bytes must be checked before handoff, plus one synthetic-only full-size PNG request verifying unchanged private/CDN no-store behavior. No request for owner location/calendar and no restricted logs used.

## Device gate / decision

Import Stable Marker1 at the same place/network, retaining Fixed Marker1. Confirm full map plus deliberate0,0 marker; switch to Calendar, leave phone untouched about a minute as just reported, return to Home, then repeat two or three transitions. No stopwatch or video. Compare the first post-idle return rather than only warm repeats.

If delayed as before, changing t is not necessary for the symptom either; next isolate expiring image/render cache/revalidation using a strictly synthetic opt-in control. If immediate, stable URL becomes a candidate pending reproducibility and actual map freshness, not a completed fix or proof that t was the sole cause. Do not restore dynamic city or full Home until the dynamic map/location path is stable. Preserve Lean1/full Ring2 design; no production promotion or deletions.
