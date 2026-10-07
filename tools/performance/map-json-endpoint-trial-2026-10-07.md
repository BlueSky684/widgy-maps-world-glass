# Native image JSON Endpoint gate

Branch: `f50-widget-test`; base `326e254f50a44fc4cb1255a893aea2235ccf36a2`.

## Scope

Add a small, stable public metadata URL `/tools/widgy-map-source.json` with two fields: `image` (an HTTPS URL) and `revision` (initially `A`, then `B`, now `C` for the imported navigation-copy update test). It points to already-deployed, non-personal full-resolution static controls built by the unchanged deployment scripts. No new image is committed, no private export or bookmark is uploaded, and no image is fetched or rendered by the metadata request. No storage service, credentials, active Shortcut, production branch, renderer or existing widget JSON is modified.

The separate helper page copies the endpoint URL and explains native Image > Web And Maps > JSON Endpoint setup. Configure the native provider on the phone: its serialized schema has not been verified, so this patch does not fabricate a native JSON Endpoint widget definition. No variables/Base64/JavaScript are required inside Widgy. The browser helper's clipboard JavaScript is unrelated to widget rendering.

## A/B protocol

1. A: existing `/assets/diagnostics/Home_Map_Static_3306x1558.png`, 3306x1558, 4,075,465 bytes; approved static control, no location. Expected SHA-256 `c4ccdacd84dec137bd46c6061a4f5b69ed4d210e5cec0bc5e2d08865ffc17df9`.
2. Owner selects `image` in the native JSON picker. Confirm full appearance, editor exit/re-entry and export. Request the exported JSON to inspect whether it retains the endpoint, rather than converting to a fixed uploaded image. Import that export as a separate copy.
3. Only after A succeeds, change this SAME metadata URL's pointer to existing `/assets/diagnostics/map-mask-compare-1/night.png` and revision B. This second image is already created by the unchanged deployment build, has a distinctly all-night appearance, 3306x1558 and 4,540,058 bytes, SHA-256 `b47b3c2f4b58c1a6d2648a7fb59316e40a816b1108ffa95856a0edc669f30c1c`. No image recompression or new image upload is needed. Do not mutate A's image bytes in place.
4. Observe native scheduled/manual refresh without editing the image field or selecting another local file. Confirm both original and imported copy follow B. Then apply the verified provider to a copy of the existing minimal two-screen navigation control to compare repeated Home returns.

HTTP no-store on the tiny JSON prevents HTTP caches from holding A after publication of B; it does not schedule Widgy refreshes or prove its internal cache behavior. The image itself keeps its existing static delivery/cache policy. Loading a new image still entails transfer and decoding. The A/B images are fixed public fixtures, not a live solution. This gate neither establishes background reliability nor resolves image export HTTP422 by assumption.

If native export still rejects the image, stop: JSON Endpoint has not bypassed the sharing limitation. If image binding/export/update succeeds but navigation is slow, investigate native re-fetch/decode behavior before provisioning production storage. Final live preparation, persistent private images, auth and atomic pointer publication remain separate unimplemented work.

## Owner result and B gate — 2026-10-07 21:23 Asia/Jerusalem

Owner reports the map displays and JSON export is possible. This is a positive display/export result for A. The exported file has not yet been received; native endpoint serialization, round-trip import, editor-exit persistence, navigation latency and live/background refresh remain unverified. Do not infer those from the two reported successes.

Advance the pointer behind the same metadata URL to the existing all-night B image. Retain HTTP policies and all image bytes. Ask the owner to check the preview outside the editor without changing the source URL or rerunning the JSON picker, and attach the successful export. If B does not appear, distinguish app preview caching from native manual/background refresh before changing configuration. Export inspection and imported-copy update verification remain pending.

## B result and native export inspected — 2026-10-07 21:29 Asia/Jerusalem

Owner supplied result B: the screenshot clearly shows all-night lights in Europe, Asia and Australia, distinct from A's day/night map. In response to the requested no-configuration-change check, this is a positive A-to-B display result; no precise refresh latency or all-day/background reliability is established. The supplied native JSON export is 687 bytes, one image layer, schema version29. It retains provider1=`JSON Endpoint`, endpoint8=`/tools/widgy-map-source.json`, method9=`GET`, path13=`["image"]`; field2 contains the resolved B image URL. Field11 contains only the native Authorization/Bearer header-name/prefix defaults, no authentication value. No variables, Files bookmark, Base64 or uploaded Widgy CDN image appears. The private file itself is not committed. Native re-import/update after re-import remains untested.

Next copy: `Widgy Map JSON Navigation 1`, helper `/tools/widgy-map-json-navigation.html`. Start from the existing fast Map Static Only control. Change just the image provider fields to the verified native schema and identifying document metadata. Keep all 21 layers, frame, IDs, order, navigation, fonts and zero variables. Remove old Web URL field3 to match native JSON Endpoint defaults; the provider/cache behavior therefore differs from the direct Web URL control and must be tested rather than assumed equal. No live rendering/GPS/city/calendar data is added.

Native gate: import the prepared copy, confirm the map is complete, compare three Calendar-to-Home returns, then a first return after one minute idle in the same slot/network. Report delays or disappearing map. The 687-byte export is not the network image size; B remains 4,540,058 bytes and must still be transferred/decoded when needed. A fast result is limited to this prepared-image/minimal-widget path. Actual update after importing, full-widget performance and live producer/storage integration remain pending.

## Navigation result and imported-copy update gate — 2026-10-07 21:39 Asia/Jerusalem

Owner reports a fast transition after two minutes idle. This supports fast idle return in Map JSON Navigation 1 with an unchanged prepared B image; it does not establish uncached-image latency, full-widget performance or background live-map refresh.

Advance the SAME metadata URL to C: existing `/assets/diagnostics/map-mask-compare-1/reference.png`, the fixed 2026-10-06T04:30:00Z approved-renderer day/night reference. Full dimensions3306x1558; 4,030,894 bytes; SHA-256 `cb77d96e914c9d04a288927ce36e429c00cad3f9d5a1650293c6ba57c85a4b69`. Image bytes and HTTP policies are unchanged. This is neither a new image upload nor a live renderer request. The original helper now accepts revision C as valid.

The navigation generator deliberately keeps its native last-resolved field2 at B while endpoint8 selects the current C. Ask the owner to use the already-imported navigation copy, without editing or importing again. C should show the day/night division again with most Asian/Australian city lights absent, unlike all-night B. Check both actual image change and return speed. This resolves whether the imported copy follows its JSON binding rather than remaining frozen on field2. The file may have been seen in earlier mask trials and the app may prefetch; do not call this a guaranteed cold-cache measurement. Dynamic producer/storage and full-widget integration remain pending.

## C result and full-widget copy — 2026-10-07 21:46 Asia/Jerusalem

Owner reports that after one minute the image changed again; return was relatively fast, slightly slower but still acceptable without appreciable delay. This is a positive imported-copy binding/update result with a modest subjective cost. No precise latency, cold-cache condition or all-day reliability was measured.

Prepare `Full Widget External Map Test 1` from the latest available full private export supplied earlier today (1514 layers, schema29, 82 variables). Change Image82316 from JavaScript reading map_png_base64 to the verified native JSON Endpoint provider, retaining its exact original frame/name/ID/order. Remove only map_png_base64 and map_request after proving neither has a remaining name nor UUID consumer. map_request was already unused; its removal prevents retaining an unnecessary old source definition but does not establish it was executing. Keep all four GPS definitions because calendar_city_prefix still consumes them. Keep calendar_city_prefix and every other calendar/weather/fitness/navigation source and layer unchanged.

The local builder asserts exact whole-document equality after restoring the allowed provider fields, two removed variable definitions and identifying name/description. Output: 1,514 layers, 80 variables, 1,101,726 bytes. Private input/output and any calendar URLs are not published in GitHub. The output is delivered privately. `/tools/widgy-private-json-copy.html` reads a user-selected local file and copies the exact JSON text to the clipboard; it does not upload or fetch file contents, and its CSP prohibits connect requests.

Full-widget native gate: import as a separate copy, confirm full-map visibility, test Home/Calendar transitions including first return after two minutes idle. This copy retains C's fixed public map without a personal marker; it does not yet integrate live map preparation or storage. If the full widget is slower, existing calendar city/network dependencies remain candidates; do not blame the external image without a matched comparison. Original full widget and active Shortcut are preserved.


## Full-widget structural optimization requested

Before delivery of Full Widget External Map Test 1, the owner required reducing
Calendar variables and excessive layers. The1514-layer test file was not delivered.
See `compact-structure-1-review.md`:225 separator drawings consolidated;25 dot
URL scripts share one minute clock;14 single-use text sources inlined;2 dead
step variables pruned. Candidate1289layers/40variables versus original1514/82.
Local equivalence/geometry checks pass; native rendering and full-widget latency
remain untested. The map remains the fixed external test image. Today badge
and day-progress native redesign still require verified export capabilities.
