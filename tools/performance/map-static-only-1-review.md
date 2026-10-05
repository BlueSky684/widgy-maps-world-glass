# Map Static Only 1

2026-10-05, branch `f50-widget-test`, parent `b7872e5f097c66c9d5c828cb442e2e39d4c5c6b6`.

## Evidence and scope

At 14:42:04 Asia/Jerusalem the owner reports “אין עיכובים” (no delays) in Map Source Only 1. Navigation Only 1 was also immediate, while Minimal Pair 1 intermittently waited. Resolved https text was requested as a display gate but is not separately confirmed in this latest reply; do not overstate successful active GPS consumption, identical Text/Image scheduling or zero GPS latency. These observations strengthen the combined image path as a hypothesis if text resolved. They do not identify networking, server rendering, cache, decode or native presentation as the cause.

Continue map-first isolation on the now-small document. Earlier full-resolution static-image tests were inside the large four-tab widget with other sources, and their outcomes were mixed/no dramatic improvement. This is a new matched add-back to the immediate 20-layer Navigation Only control, not a claim those previous tests succeeded or were never done. The prior failed embedded-image import and unsuccessful half-resolution/native-local experiments are not repeated here.

## Exact change and existing asset

`withMapStaticOnly` starts from Minimal Pair. Preserve original image6170 exactly except for its `2` Web URL string, which becomes the direct same-origin public `/assets/diagnostics/Home_Map_Static_3306x1558.png`. Delete all five map/GPS variable definitions. Name/description identify the trial. Every other field is unchanged: 21 layers, two roots, navigation/tap actions, image frame/provider/cache flag/ID/parent/sibling position, static Calendar, fonts/colors/settings. Compared with fast Navigation Only, only the one static image object and metadata are added. No native Location, JavaScript, calendar source or variable reference remains. Font metadata is retained as in the control; no guarantee about all OS activity is made.

Existing asset is built by unchanged `tools/build-home-map-static-diagnostic.mjs`: full lossless 3306x1558 PNG, glass/r6, fixed 2026-10-04T06:00:00Z, null location (no personal marker/city). Bytes 4075465, SHA-256 `c4ccdacd84dec137bd46c6061a4f5b69ed4d210e5cec0bc5e2d08865ffc17df9`. Reuse it; do not resize, re-encode, regenerate approved art, embed base64, add a cache-buster or modify renderer/API/cache policy. A stable static URL and static delivery change several parts of the image pipeline together versus the original live map, including pixels/time/location label; acknowledge those differences.

The preparation controller uses the existing public-only template/placeholder chain. The output contains neither calendar tokens nor private endpoints. It fetches no map image during preparation and needs no calendar session. The actual static image is requested by the image provider on the phone. The agent only verifies the already-public, no-location file, never actual GPS/geocoder/private export.

## Validation

`node tools/test-map-static-only.mjs` passes. Deep comparisons prove precisely the URL/five-definition delta against Minimal Pair, and the one-image add-back against Navigation Only. The full input is immutable; 21 IDs are unique and all four tap actions reference surviving roots. Zero variables and no dynamic text sources remain; no discarded variable UUID/name reference or calendar/API/token appears. Five Custom Text/Text sources remain for the existing navigation and Calendar title. Invalid origins (non-HTTPS, credentials, paths, query) are rejected. Controller copy/download/public-template failure/retry/pageshow/blocked clipboard paths are exercised with only synthetic public fixtures.

The exact existing local PNG signature, dimensions, byte count and full SHA are checked. Public deployed-file identity must also be checked before handing over the link. These tests verify export/value/asset integrity, not native import or iPhone timing.

## Device gate and follow-up

Page `/tools/widgy-map-static-only.html?v=map-static-only-1`, name `Widgy Map Static Only 1`. Same slot/network as the immediate Navigation Only control. Wait until the whole map is visible, then three Calendar→Home-and-back cycles. The map deliberately has fixed day/night time and no personal location. Ask whether all returns are immediate or occasional waiting occurs. Missing map invalidates timing. No screenshot, stopwatch or second phone.

If fast, next compare a direct server-generated image on the same small baseline and consider dynamic URL binding separately; do not declare per-request rendering proven responsible. If slow, investigate static image delivery/cache/decode/display before blaming the geocoder or buying hosting. No live location/city or automatic refresh behavior is validated by a static file. The final map must stay live; preserve Lean/full approved versions and both prior controls. Do not promote this still as the final solution.
