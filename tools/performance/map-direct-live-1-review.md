# Map Direct Live 1

2026-10-05, branch `f50-widget-test`, parent `c0625005cf5c2bd0d01e6fdb383e5437e75c589a`.

## Evidence and question

At 16:19:59 Asia/Jerusalem the owner reports “גם כאן הכל תקין ואין עיכובים” for Map Static Only 1: map normal, no perceived delays. Navigation Only was also immediate; Map Source Only reported no delays but its resolved-URL text gate was not separately confirmed; Map Minimal Pair with the variable-bound live image intermittently waited. No numeric Widgy timing is available. Do not infer permanent stability or prove GPS innocent.

Test the existing server-generated image path on precisely the now-fast static-image control. Earlier direct-URL tests retained the large widget and were inconclusive/no improvement. This trial is justified by the new matched small-document control, not a repeat that ignores those outcomes.

## Only change

`withMapDirectLive(original, origin)` starts from `withMapStaticOnly`. Change image6170's URL to:

`/api/night-map?mode=live&width=3306&presentation=glass&atlas=r6&reuse=60&lat=&lon=`

Also set trial name/description. Preserve every other serialized field: 21 layers, zero variable definitions, image frame/provider/cache flag/ID/parent/order, two roots, four Home/Calendar taps, static Calendar title/background, font/color metadata. No GPS, JavaScript, calendar data, location marker, city, timestamp, `at`, synthetic CDN flag or backend/cache change. Invalid/non-HTTPS origins are still rejected by the baseline transform.

The actual `parseMapRequest` and `resolveLocation` code confirms explicit empty coordinates return null even with synthetic Vercel IP coordinates present. Thus no IP-based marker sneaks into this comparison. The import page fetches only the public C16 template, uses inert calendar placeholders internally, and strips them before output. It requests no image, GPS, geocoder or private calendar export. Phone image loading is separate.

Server code uses current time when `at` is absent and keeps existing per-instance 60-second reuse for this explicit-coordinate URL. It retains private browser caching and CDN no-store. Cache entries are not guaranteed across instances. A constant URL does not ensure a new request on every tab switch or fresh pixels within 60 seconds in Widgy. This is a diagnostic, not a validated final refresh strategy.

The URL delta changes delivery through the live endpoint rather than a prepared static file, cache behavior and time-dependent pixels. It does not isolate server CPU from transfer, decoding, client cache or scheduling. Resolution/PNG quality are unchanged at 3306×1558; no asset is resized or re-encoded.

## Validation

`node tools/test-map-direct-live.mjs` passes using synthetic fixtures only. A whole-document comparison proves only URL plus name/description differ from the fast static control, with immutable input, 21 unique IDs, zero variable references, one Web URL image and valid taps. Original image cache flag and every other field remain exact. Tests use the real location resolver to prove empty lat/lon suppress IP fallback, and the exact seven query values prohibit incidental time/cache parameters. Public-only copy/download/failure/retry/pageshow and blocked clipboard flows pass against the real controller and HTML.

Before handoff, require test-branch deployment success, byte identity for the three new public runtime files, and one GET of the public explicit-empty-location endpoint: HTTP200, image/png, PNG3306×1558, server-now, unavailable location. Public endpoint checks are not native transition measurements. No restricted Vercel logs, real owner coordinates, private export or geocoder requests are used.

## Device gate and next decision

Import `Widgy Map Direct Live 1` from `/tools/widgy-map-direct-live.html?v=map-direct-live-1` into the same slot/network. Keep the fast Static Only copy. Wait for the whole map, then three Calendar↔Home cycles; naturally try again after a minute or two without timing tools. No marker/city is expected. A later return does not guarantee a new network request. Ask only whether immediate throughout, intermittently waiting, or missing map. A missing map invalidates a speed conclusion.

If fast, investigate variable-bound image URL/native location/minute-changing URL next, one comparison at a time. If slow, isolate the server-generated image/delivery/cache path on this small baseline before restoring dynamic data. Do not call either outcome proof of one stage's fault. No Home components or city are restored yet; preserve Lean 1 and full approved Native Steps Ring 2. No production promotion or branch/asset deletion.
