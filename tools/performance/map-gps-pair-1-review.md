# Map GPS Pair 1

2026-10-05, branch `f50-widget-test`, parent `056b88f553196da1c54105615ef1abb9d65d0f67`.

## New evidence and scope

At 20:20:17 Asia/Jerusalem the owner reports “אין עיכובים הכל נראה תקין” for Map Minute URL 1. Appearance and subjective speed pass in that run, as do the preceding constant-script, text-variable and direct image controls. Native invocation counts, fresh requests and location/image freshness remain unmeasured. Minimal Pair's earlier intermittent waits are retained as contrary evidence.

Restore location on the now-fast minimal baseline, with only its necessary primary source pair. Earlier Minimal Pair kept four coordinate definitions and the generic cityMapRuntime wrapper even though enabled=true selects the two primary inputs. The legacy pair remains syntactically referenced in that older script. This proves extra definitions/dependencies exist, not that four GPS requests occur. Do not relabel this new three-variable/simple-script probe as identical to the earlier five-variable trial.

## Exact change

`withMapGPSPair` starts from `withMapMinuteURL`. Clone exactly the original map_latitude_max5/map_longitude_max5 definitions, preserving IDs, numeric formatting metadata, source kind and all other fields. Add them before the existing map_request definition. Replace only map_request script body with a short synchronous main() reading these two native variables, validating coordinates with the original strict decimal parser, and forming the same base URL plus coordinates and minute t. Change name/description. All other document fields are byte-for-value identical after serialization.

Keep 21 layers and three variables total, the existing image binding/frame/provider/cache flag/parent/order, navigation/static Calendar, full lossless3306×1558 PNG and current server/cache policies. Keep primary coordinate values without adding rounding. The native format setting is preserved, not independently interpreted as a guarantee of five decimal places. The parser handles decimal comma/Unicode minus and bounds90/180 exactly like the original. Invalid/missing coordinates stay explicitly empty and never fall back to IP. Valid coordinates including0,0 are preserved. No default/last-known fake location is injected.

No legacy Latitude/Longitude definitions, city source, geocoder, fetch, timer, asynchronous callback, generic city wrapper or unrelated Home data. Existing private client cache/CDN no-store remain. A real marker/coordinate label now changes rendered pixels, image size and location cache key as well as native source evaluation. Thus a slowdown would not prove GPS hardware alone responsible.

The import preparation fetches only the public template; it never reads device GPS or private calendars. Actual coordinates are resolved by Widgy on the phone and supplied to the existing map endpoint as previously authorized. Agent checks use synthetic values only and never replay owner coordinates, invoke a client-only geocoder or bypass restricted logs.

## Verification

`node tools/test-map-gps-pair.mjs` and `node tools/test-map-minute-url.mjs` pass. Full-document comparisons prove only the two native definitions/script/name/description differ from Minute URL, and all layers/navigation/global settings also match old Minimal Pair. Input remains immutable. Original source definitions are deep-equal; all three variable IDs and21 layer IDs are unique; four taps remain valid. Only two Location sources, one Javascript/Script and five Custom Text layer sources remain. No discarded legacy UUID, calendar token or dangling reference survives.

Twenty synthetic coordinate cases at two sides of a minute boundary yield40 exact URL comparisons against the actual original Minimal Pair script with enabled=true and deliberately different legacy values. Cases cover zeros, signs, decimal comma, Unicode minus, precision, legal bounds, out-of-range, missing/unresolved, partial pairs and invalid text. Outputs match byte-for-byte. Removing coordinate values equals the fast Minute URL output. The real server parser/resolver yields explicit coordinates or null with no IP fallback. Network/timer/async traps are not called. This uses safe synthetic substitution to test JS, not an emulation of Widgy interpolation, GPS acquisition or scheduling.

Unexpected variable identities/source kinds and invalid origins fail. Real controller/HTML copy/download/retry/pageshow/failure/blocked-clipboard flows pass against synthetic public fixtures. Before handoff verify deployment success, exact public bytes of the three runtime files and a full-resolution PNG from a synthetic location request only. Phone marker position/freshness and speed remain unverified.

## Device gate and next decision

Import `Widgy Map GPS Pair 1` from `/tools/widgy-map-gps-pair.html?v=map-gps-pair-1`, retaining fast Minute URL1 in the same slot/network. Wait for the full map AND a marker near the expected location with coordinate label. No city name is expected. Missing map, missing marker or wrong location must be reported before performance; a fast map with unavailable coordinates does not validate active location. No request to copy/share actual coordinates is needed.
Then try three Calendar↔Home cycles and a natural later return after a minute or two. No stopwatch, video or second phone. If fast with correct marker, keep this as the location prototype and check freshness/city separately before restoring full Home. If slow, isolate native dependency work from location-specific image/cache work on the same small baseline, without declaring a unique culprit. Original Minimal Pair differed in two extra fallback definitions and script structure, so any improvement cannot be attributed uniquely to removing those definitions. Preserve Lean1 and full approved Ring2; final dynamic city spelling Ashkelon and the approved design remain required. No production promotion, branch deletion or asset cleanup.

## Device result — 2026-10-05 20:38:41 Asia/Jerusalem

Owner reports a small delay after leaving the phone untouched for several minutes, then transitions start improving with use. This is not a stable no-delay pass. No exact duration, GPS freshness or marker correctness was separately confirmed. Next matched control: Map Fixed Marker1, retaining the same marked live-image path with synthetic0,0 and minute URL while removing native coordinate bindings/definitions. See map-fixed-marker-1-review.md. Do not infer a unique GPS, network or cold-function cause from the idle/warm pattern.
