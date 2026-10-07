# Native image JSON Endpoint gate

Branch: `f50-widget-test`; base `326e254f50a44fc4cb1255a893aea2235ccf36a2`.

## Scope

Add a small, stable public metadata URL `/tools/widgy-map-source.json` with two fields: `image` (an HTTPS URL) and `revision` (initially `A`, now `B` for the update test). It points to already-deployed, non-personal full-resolution static controls built by the unchanged deployment scripts. No new image is committed, no private export or bookmark is uploaded, and no image is fetched or rendered by the metadata request. No storage service, credentials, active Shortcut, production branch, renderer or existing widget JSON is modified.

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
