# Map Minute URL 1

2026-10-05, branch `f50-widget-test`, parent `4190473094859b94a964b4d838bf3eab3cda37f4`.

## Evidence and hypothesis

At 20:10:04 Asia/Jerusalem the owner reports “אין עיכובים הכל נראה תקין” for Map Script Constant 1. Appearance and subjective transition speed pass in that run. Direct Live and native Custom Text URL controls also passed; Minimal Pair with four native GPS definitions and the original minute-dependent script intermittently waited. No transition measurements, invocation counts or image-refresh observations are available. Do not assume continuous testing since the prior message.

Next isolate a time-dependent URL without native GPS. The earlier Map Cache URL 1 removed t on the larger Lean document and was reported without improvement; retain that evidence. This small add-back differs because all unrelated screens/sources are removed and the constant-script control is now reported immediate. Do not claim deleting t is an established fix or ignore possible multiple causes.

## Exact delta

`withMapMinuteURL` starts from `withMapScriptConstant`. Change only source key10 (script text), plus name/description. The same synchronous main() now reads Date.now once, computes `Math.floor(instant / 60000) * 60000`, and appends `&t=<stamp>` to the exact previous constant URL. This matches the original reuse=60 minute bucket, in epoch milliseconds, not a timestamp changing on every click.

Keep all 21 layers, the one variable identity/type/metadata, Javascript/Script mode, image binding/frame/provider/cache flag/parent/order, navigation/static Calendar and all other document fields. Base URL still requests full lossless3306×1558 glass/r6 with reuse60 and explicit empty lat/lon. No native GPS, city lookup, fetch, async completion, timer, external provider or backend/cache-policy/asset change.

The timestamp changes only WHEN Widgy reevaluates the source in a new minute. There is no timer or promise of evaluation/network/image refresh every minute. Existing api/night-map uses current server time, ignores t for rendering and cache key, and retains per-instance60-second reuse plus private client caching/CDN no-store. A changed client URL may affect image reuse/download, but that behavior is not established from source code. This trial combines clock-dependent source output with downstream image/cache behavior; it cannot by itself attribute a delay to a particular stage.

## Verification

`node tools/test-map-minute-url.mjs` and `node tools/test-map-script-constant.mjs` pass. Whole-document reversal proves only source key10 and name/description changed; input is immutable. The actual exported script runs with a controlled clock at 12 instants spanning intra-minute values, minute boundaries and year rollover. It reads the clock once per call, returns the same value inside a minute and changes at the next minute. Removing only t yields the byte-identical constant URL. Real request parser/location resolver retains explicit empty coordinates with no IP fallback, even with synthetic headers. No fetch/async callback/timers are invoked. These are JS/export tests, not a Widgy emulator or timing benchmark.

One variable, one image, 21 unique IDs, four valid navigation taps, five Custom Text/Text sources and one Javascript/Script source remain. No discarded GPS UUIDs, calendar tokens or unexpected variable references remain. Public-template-only controller copy/download/retry/pageshow/failure/blocked-clipboard paths pass using synthetic fixtures. Invalid origins and mismatched original variable identity fail closed.

Before handoff verify test-branch deployment success, exact bytes of the three new public files, and a public no-location PNG response using t rounded from the current time. Do not replay owner GPS, request private exports/geocoder or bypass restricted Vercel logs. Native import, reevaluation and transition timing require the phone.

## Device procedure and next decision

Import `Widgy Map Minute URL 1` from `/tools/widgy-map-minute-url.html?v=map-minute-url-1`, same slot/network, retaining Script Constant 1. Wait for the complete map. No marker/city is expected. Do three Calendar↔Home cycles, then stay on Calendar for a natural minute or two and return to Home. Ask whether immediate throughout, only delayed on that later return, intermittently delayed, or missing map. No stopwatch/video; later return does not prove a new request occurred. Missing map invalidates a speed conclusion.

If fast, restore native location dependencies separately before city/full Home. If delayed, reconfirm constant control and investigate URL change with image reload/cache/evaluation; do not declare server CPU, network, cache or GPS uniquely responsible. Preserve the older contrary Lean result and final live-refresh requirements. No production promotion, cleanup/deletion or unrelated Home restoration. Lean1 and full approved Ring2 remain preserved.
