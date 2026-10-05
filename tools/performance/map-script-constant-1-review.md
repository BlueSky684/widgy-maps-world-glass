# Map Script Constant 1

2026-10-05, branch `f50-widget-test`, parent `2fc7ddf313a76e9c83e4eb628c94670ef47ed0cd`.

## New evidence

At 16:54:00 Asia/Jerusalem the owner reports “אין עיכובים הכל נראה תקין” for Map URL Variable 1. Image appearance and subjective speed passed. Direct Live, Static Only and Navigation Only also passed. Minimal Pair with native GPS, synchronous script and minute-dependent URL intermittently waited. Source Only's no-delay report has a separate unconfirmed resolved-text gate.

Keep the fast constant-variable image as the matched baseline. Its success does not measure native source invocation count or exclude caching, refresh-dependent network waits, GPS or script interactions in the full widget. No host or backend change is justified by these observations alone.

## Export delta

`withMapScriptConstant` starts from `withMapURLVariable`. Replace the single map_request source object from Custom Text/Text with Javascript/Script. Generate a synchronous `function main() { return <JSON-quoted original URL>; }`. This source mode matches the already-exported synchronous Minimal Pair source, not an invented format. JSON quoting prevents accidental script interpolation. Also change the trial name/description. Every other serialized field remains identical.

One variable, 21 layers, exact image binding/frame/provider/cache flag/ID/parent/order, four native Home/Calendar taps, static Calendar background/title and original fonts/colors. No GPS, city, native location sources, nested variable references, Date, minute timestamp, fetch, timer, sendToWidgy or asynchronous completion. Same full lossless 3306×1558 PNG, same seven-parameter current-time server URL and explicit empty lat/lon, same cache behavior. No asset, API, deployment configuration or provider modification.

The page keeps the public C16-only preparation flow; no account, private export or geocoder request. Inert calendar placeholders are stripped before output and are never fetched. The phone's image request remains separate from script evaluation.

## Validation

`node tools/test-map-script-constant.mjs` and `node tools/test-map-url-variable.mjs` pass. A complete-document equality check reverses only the source-object and name/description changes; it proves all other fields identical and the original input immutable. The generated script executes in a local VM twenty times, each returning the exact constant control URL. Trap functions for network, async callback, timers and clock use are not called. This tests JavaScript output, NOT Widgy scheduling or latency. One variable, one image, 21 unique IDs, all four valid taps, no dangling GPS UUIDs, five native Custom Text sources plus one Script source are verified. Invalid origin and unexpected variable identity are rejected. The real controller's public-only copy/download/retry/pageshow/failure/blocked-clipboard paths pass with synthetic fixtures.

Before handoff, require successful test-branch deployment and byte identity of the three new public runtime files. The unchanged no-location endpoint and PNG dimensions were verified with Direct Live; do not replay owner GPS, private data or restricted Vercel logs. No claim about native import, invocation count, image freshness or transition timing is made before the phone result.

## Device gate and decision

Import `Widgy Map Script Constant 1` from `/tools/widgy-map-script-constant.html?v=map-script-constant-1` in the same slot/network; retain Map URL Variable 1. Wait for the complete map, with no marker/city expected. Test three Calendar↔Home cycles and another natural return after a minute or two. No stopwatch/video required. Missing image invalidates a speed conclusion.

If immediate, next isolate a minute-dependent URL without native GPS, then consider GPS dependencies separately. If delayed, reconfirm the fast text-variable control and investigate this synchronous Script/image consumption path; do not generalize to all JavaScript or blame rendering without evidence. If blank, treat as compatibility failure. Constant output can still be cached/lazily evaluated, so a fast run does not prove changing GPS-dependent scripts cheap. Keep Lean 1 and full approved Ring2; final live location/city and all approved Home/Calendar functionality remain required. No production promotion or deletions.
