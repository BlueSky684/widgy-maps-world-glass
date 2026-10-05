# Map URL Variable 1

2026-10-05, branch `f50-widget-test`, parent `1585940995d497e3b72b8d0a6300ebe7d77de7d6`.

## Evidence and scope

At 16:44:32 Asia/Jerusalem the owner reports “אין עיכובים הכל תקין” for Map Direct Live 1, after an explicit clarification of that version. Map appearance and subjective transition speed passed in this run. Static Only and Navigation Only were also fast. Map Source Only had no perceived delays, with an unconfirmed resolved-text gate. Minimal Pair, which retains all five map definitions, synchronous script and minute-dependent URL, intermittently waited.

A constant direct URL may be cached without a new request on each tab switch, so this does not prove server rendering always fast or exclude timing/refresh effects. It does provide a matched immediate live-endpoint image control. Keep the same server and full PNG; do not restore the rest of Home yet.

## Exact change

`withMapURLVariable(original, origin)` starts from `withMapDirectLive`. Add one definition, cloning original map_request identity/type/frame/metadata and replacing its entire source array with a single Custom Text/Text value equal byte-for-byte to the direct-control image URL. Change image6170 URL from that literal to `${widgy.map_request}`. Change trial name/description. Every other serialized field remains identical to Direct Live.

Output: 21 layers, one constant native text variable, no JavaScript/native GPS/calendar sources or city lookup. Same full lossless 3306×1558 image, provider/cache flag/frame/parent/order, all four Home/Calendar tap actions and static Calendar. The URL still has the exact seven parameters mode=live, width=3306, presentation=glass, atlas=r6, reuse=60, lat empty, lon empty. No timestamp, at or synthetic CDN flag. No backend, asset, cache policy or provider change. Explicit empty coordinates still suppress IP fallback as verified by the existing Direct Live test. Variable source metadata comes from the known original definition, not an invented schema.

Preparation fetches only the existing public template. It requests no map, owner GPS, geocoder, calendar session or private export. Internal inert calendar placeholders are removed by the established minimal chain and never fetched. The resulting JSON contains no calendar token or data. Never publish the private owner export.

## Verification and limitations

`node tools/test-map-url-variable.mjs` and `node tools/test-map-direct-live.mjs` pass. Tests prove input immutability, whole-document equality after undoing only the variable/binding/metadata delta, exact original variable shell, 21 unique layer IDs, one image, four valid taps, only one map variable token, six Custom Text/Text source objects and no discarded GPS IDs. Invalid origins and an unexpected original variable ID are rejected. Existing public-only controller flow is exercised against the real HTML/controller with synthetic fixtures, including copy/download/failure/retry/pageshow and blocked clipboard.

The test substitutes the exported text value locally only to assert its byte identity with the direct URL. It does NOT emulate Widgy or prove native variable resolution, scheduling, freshness or timing. Those require the phone. A blank map must be reported as binding/import failure, never as a performance improvement.

Before handoff, check test-branch Vercel success and byte identity of the three new public runtime files. The unchanged endpoint was already verified for the preceding control; no real device location or restricted Vercel logs are needed. Do not promote or delete prior controls.

## Device gate and next decision

Import `Widgy Map URL Variable 1` from `/tools/widgy-map-url-variable.html?v=map-url-variable-1`; keep Direct Live 1 for comparison in the same slot/network. Wait for the full map. No marker/city is expected. Try three Calendar↔Home cycles and another natural return after a minute or two, without stopwatch or video. Ask only immediate / intermittent delay / missing map.

If fast, next isolate synchronous JavaScript returning the same constant URL before native GPS/minute changes. If delayed, confirm the immediate direct control and investigate this native variable/image binding without claiming all Widgy variables or the server are slow. If blank, resolve compatibility first. A constant source can be cached/lazily evaluated, so even a fast result does not establish the cost of changing native GPS/script sources. Final approved live location/city and the full design remain required; Lean 1 and Native Steps Ring 2 are preserved.

## Deployment and owner result

Published as `2fc7ddf313a76e9c83e4eb628c94670ef47ed0cd`, Vercel success. The three new runtime files returned HTTP200 and matched tested local bytes (transform2017, controller2522, HTML3806 bytes). No backend or endpoint change was made.

At 2026-10-05 16:54:00 Asia/Jerusalem the owner reports “אין עיכובים הכל נראה תקין”: no delays and everything looks normal. Treat this as a positive image-display gate and subjective speed result for the constant-variable probe. Native invocation count, caching and refresh are not measured. This does not establish performance of changing values or GPS/script dependencies.

Next: Map Script Constant 1 changes only that variable's source object from Custom Text to synchronous Javascript/Script main() returning the exact same literal URL, plus identifying metadata. No GPS, time or async/network work enters the script. See `map-script-constant-1-review.md`.
