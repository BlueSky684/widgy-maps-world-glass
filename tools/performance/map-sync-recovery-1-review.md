# Map Sync Recovery 1

2026-10-05, branch `f50-widget-test`, source parent `a32ed1117cc558453d6e0b21852dfe6b52641dd4`.

## Current evidence and limit

At 08:04 Asia/Jerusalem the owner said Native City Recovery 1 loaded its map, Calendar was fast, Home slightly slower. At 08:11 they clarified that some Calendar-to-Home transitions still fail to show the map; IMG_9895 shows the black map panel while the other Home content renders. Recovery is therefore not established as reliable. Correct native Calendar city has not been explicitly confirmed.

The connected Vercel runtime log request for `/api/night-map`, 04:55–05:12 UTC, failed with 403 permission denied. It returned no logs; this is not an empty-log result. No alternative credentials, CLI or browser access was used to bypass that denial.

Three sequential public synthetic 0,0 requests with successive minute `t` values returned HTTP 200 and PNGs that passed image validation, each 3306x1558 and 4,163,370 bytes. States were MISS, HIT, HIT; server timing 753.8, 0.1, 0.1 ms. End-to-end tool-environment times were 8.24, 10.66 and 5.54 seconds. Those times include the execution environment network and are not phone or Widgy timings. The sample did not reproduce the native missing-map failure and does not rule out an intermittent network/backend problem. No owner GPS, calendar URL or geocoder request was used.

Official references checked:

- https://vercel.com/docs/functions/limitations documents the function payload limit; the sampled PNG bodies are below 4.5 MB. That does not establish all possible rendered images are below it or prove a payload failure occurred.
- https://apps.apple.com/us/app/widgy-widgets-home-lock-watch/id1524540481 lists prior Async JavaScript fixes in version 27.0.1. This does not establish the installed version or a current Widgy defect. It is not a diagnosis of this failure.

## Narrow change

Recovery's map URL script no longer makes any asynchronous network call, yet remains an Async + No main() source with `sendToWidgy`. `withMapSyncRecovery` changes only that map variable's source mode to Script and wraps its exact logic in `main()`, assigning its previous completion value to a local return value. The other city script, all 81 variables, 1514 layers, image binding/frame, live GPS parsing and inputs, minute timestamp, renderer, lossless resolution, cache policy, Calendar native fallback, navigation and other widget fields remain unchanged. Name/description identify the trial.

This is a native execution-mode stability comparison. It is not a verified repair, network-off test, new image cache, retained-last-good-image mechanism or city-on-map implementation. Home still shows live coordinates without city; Calendar retains its native city fallback. Do not claim the mode is the cause unless device evidence supports it.

An earlier Synchronous Map diagnostic in a different full-artwork configuration loaded but did not materially improve transitions. That historical result remains valid. The reason for this new narrow comparison is intermittent map disappearance in the current Recovery control, not a claim that synchronous code is inherently faster. Do not run further execution-mode variants without a new signal.

## Validation

`node tools/test-map-sync-recovery.mjs` passes 40 coordinate/time combinations. The candidate returns the byte-identical URL to Recovery's immediate callback for valid, signed, comma-decimal, missing, unresolved and out-of-range inputs, across minute boundaries and repeated/fresh evaluations. It receives no `sendToWidgy` capability and makes no custom fetch. Deep equality verifies every field except map source body/mode and trial metadata. The actual import controller is verified for the generated JSON, copy/download, expired session, retry/page restoration and blocked clipboard fallback. Existing `test-native-city-url.mjs` also passes, preserving the prior import route.

## Device gate

Import `Widgy Map Sync Recovery 1`, wait for map and marker, then switch Calendar → Home several times. First report whether the map stays visible every time. Only if it does, compare speed with Native City Recovery 1, same slot/network. No stopwatch or second phone needed. No production promotion until native stability, refresh/location and city functionality are established.

Page: `/tools/widgy-map-sync-recovery.html?v=map-sync-recovery-1`.
