# City Timing Test 1 — 2026-10-08

At18:13:50 Asia/Jerusalem the owner reports that the second Home return was
significantly slower. In the correlated native pair, the second map response
was prepared in0.5ms from the same instance/cache and the same GPS/city/options;
the full4,098,212-byte PNG response was prepared. Calendar REUSE was8–10.4ms.
This excludes a new map rendering as the explanation for that recorded second
response. It does not measure geocoding before the image request, phone transfer,
native source scheduling, other Home inputs, decoding or display.

At18:24 the owner specifically raises the city mechanism and other Home parts.
Both remain candidates. The earlier combined city-lookup bypass was much faster,
but earlier Map-Off/native-data-off and other isolation outcomes were mixed.
Do not claim one root cause from a fast handler or remove functional Home layers.

## Narrow phone measurement

Start from the exact owner-supplied16:54 export, City Reuse Test1, rather than
the independent-city recovery copy. `withCityTimingDiagnostic` accepts only the
known unchanged map runtime and preserves its existing invocation arguments.
Only its script body and document name/description change. The Calendar shared
city script, fallback, all81 variables,1,415 nodes, native day gauge, native step
ring, tap actions, GPS precision, full3306x1558 PNG and approved design remain.

Read Date.now at script entry and immediately before its one sendToWidgy call.
Append `city_trace_v1=path:milliseconds` to that existing map URL. Fixed paths:
memory, fetch (accepted city), empty (response without an accepted city), failed,
none (disabled/unavailable GPS). Invalid/negative/over-one-hour clock differences
are omitted. This adds no fetch, timer, wait, callback, GPS or city lookup.
All original URL fields and completion behavior remain after removing the suffix.

The server accepts only one bounded trace value and logs only its fixed path
and client-reported duration as clientCityPath/clientCityScriptMs. Raw trace
strings are never logged. Render-cache identity and all HTTP/image bytes are
unchanged by the field. Unknown/invalid/duplicate trace values are ignored.
Normal existing exports have no new trace field and retain their current behavior.

Interpretation limits:
- Duration is total script execution up to completion, including fetch/JSON wait
  when present; it is not a separate network-only stopwatch.
- GPS placeholder acquisition before JS, native scheduling after completion,
  other Home sources, PNG transfer/decode/display are outside this measurement.
- A Calendar-only re-evaluation that never triggers an image GET is unobserved.
  No trace does not prove a fast or absent lookup. The field is client-reported.
- The changing suffix changes native/HTTP URL identity and can induce another
  image fetch. This copy must NOT be used as a clean transition-speed comparison.
  Its purpose is timing the preexisting city stage. Keep the normal copy.

## Artifact and validation

Private file Widgy_City_Timing_Test_1.json:913,959bytes, SHA256
15fad19918e9044474f108bbacca7b54d6a75faf4f900d78b8ec5eab9716ad79.
The public copy page contains only AES-GCM/gzip ciphertext; its decryption key
stays in the private URL fragment and is excluded from the repository. The
existing stable/recovery copy pages and production remain unchanged.

`test-city-timing-diagnostic.mjs` passes with synthetic input and the exact
private export: one-script/metadata equality, immutable input, all original
URL values, one callback, no added fetch, memory/fetch/failure/empty/missing-GPS
paths, clock anomalies and strict trace parsing. Existing route diagnostics,
parent-equivalent HTTP/cache tests and full-size PNG pixel regression pass.
The actual encrypted copy controller is tested for exact913,959-byte clipboard
content, missing/wrong keys, tampering, manual-copy fallback,1,415 unique layer
IDs, valid taps,89 parseable scripts and one native day gauge. Run the configured
build before publication to the f50-widget-test preview only.

Phone gate: import separately, assign City Timing Test1 to the same Home Screen
slot, confirm map and correct city, then two Home/Calendar/Home cycles and report
done. No coordinate screenshot, manual stopwatch, video or provider setup.
Correlate only subsequent native requests, excluding the agent's synthetic probe.
After diagnosis return to the normal copy; this is not a performance fix.

## Native city measurement, 18:57 Israel

The owner reports completion at18:57:41. In the native-only18:40–18:57:58
window on b19aad7, the two map responses report clientCityPath=fetch and
clientCityScriptMs=618/605. The GPS/city/options key is identical and both
requests use instance97451da6-7813-42ee-b121-f927a721407a. The first map is
MISS1497.3ms at18:57:13.921; the second is HIT0.6ms at18:57:23.899. Both
prepare HTTP200,4,170,206-byte full PNG bodies, with no conditional request.
This confirms repeated accepted external city lookup in these executions;
it does not establish why the best-effort JS memory was unused or explain
the full perceived Home wait. The changing timing suffix remains a native
image-cache confound. Calendar initially takes800.4ms, dots83.5ms, then
today REUSE6.2–8.2ms. No agent request occurs in this correlation window.

Next opt-in trial is documented in server-city-cache-1-review.md. Do not keep
the timing copy installed as a speed fix.

## Offline codec check, not adopted (details)

Using the unchanged renderer at synthetic0,0/Example and2026-10-08T15:10:00Z,
the PNG is4,106,607bytes. Pillow12.3.0 WebP lossless with exact=True and the
original ICC preserved all decoded RGBA bytes and ICC bytes in a local check:
method0:2,950,460bytes(-28.15%),806.5ms conversion; method2:2,618,952(-36.23%),
2700.3ms; method4:2,607,968(-36.49%),2916ms. Decode times115.6–131.9ms are from
this environment, not iOS. These are post-PNG conversion times, not an optimized
replacement encoder benchmark. Unlike earlier unspecified WebP configurations,
explicit preservation of transparent-pixel color passed exact equality here.
Installed Sharp0.34.5 does not expose that exact option. Native Widgy support
and net speed benefit are unverified; no codec, dependency or renderer was changed.
