# Calendar response diagnostics — 2026-10-08

At 17:08 Asia/Jerusalem the owner reports no perceived speed improvement in
Calendar after its city became visible in the unchanged City Reuse Test 1.
The supplied native export contains 39 JSON source definitions sharing one
today endpoint and 25 month-dot URL variables. These are definition counts,
not observed network requests, native script executions or decoded images.

The current handler already coalesces provider work per token/month for up to
60 seconds in a warm instance. iCloud month reads use the sealed collection
URL directly, without repeating account discovery. The Google access-token
exchange has its own bounded cache. Same-month today/dot responses share the
provider promise. Do not add these existing optimizations a second time.

Read-only Vercel runtime queries show no Calendar error clusters in the last
hour. The existing Calendar handler emits no operational logs, so the absence
of its records in grouped console logs says nothing about request count. The
Observability schema query returned metric names only; two query attempts were
rejected with HTTP 400 and supplied no measurements. No plan/account change
or paid monitoring feature was enabled.

## Narrow change

`api/calendar-widget.js` emits `calendar_response_v1` started/prepared/failed
records. Fields identify normalized method, validated view/bounds/month offset,
counts of selected provider types, validation duration, provider-cache outcome,
provider wait duration, response-preparation duration, status and dot PNG bytes.
Failures record a fixed stage only. No URLs, tokens, credentials, event content,
calendar identifiers, dates, location, headers or raw error messages are logged.

The surrounding Vercel record supplies request correlation. Prepared means
server preparation only; it does not measure transfer or Widgy rendering.
Provider wait includes awaiting an already in-flight request, not necessarily
a new external call. A warm REUSE does not prove cache sharing across instances.
The 25 possible offsets allow investigation of hidden-month traffic without
recording the owner's actual calendar dates or adding provider queries.

There is no widget export/copy-page, map, city, navigation, artwork, event
selection, HTTP caching, authentication or provider algorithm change. The
existing installed widget uses this preview endpoint without re-importing.

## Verification

`test-calendar-response-diagnostics.mjs` compares before/after handlers using
synthetic data and a fixed clock: statuses, bodies and cache/privacy headers
match for today/Widgy JSON, full/grid dots, HEAD and rejected requests. It checks
in-flight coalescing (eight simultaneous requests, one provider read), expiry,
failure recovery, approved log fields and exclusion of sensitive sentinels.
The 21 existing unified Calendar tests pass. The configured build is required
before publishing on `f50-widget-test`; production remains unchanged.

Next correlate ordinary Home/Calendar transitions with prepared server records.
Do not claim a speed fix from instrumentation or ask for another full import.

## Observed native transitions, 17:45–17:48 Asia/Jerusalem

The owner completed the requested Home/Calendar transitions and reported done
at17:48:26. The runtime window14:43–14:48:58Z contains no agent HTTP probes.
At17:17 an earlier, separate agent check used the installed today URL once;
its body was not printed or saved. It must not be counted as a native request.

In the native window, eight repeated today responses reused provider data and
prepared in6.7–11.1ms. The two MISS responses prepared in676.7ms and254.0ms;
provider waits were618.6ms and235.5ms respectively. One dots request used the
current month, bounds=grid, REUSE, prepared in75.1ms and produced7,513bytes.
All observed Calendar requests used offset0; there is no observed fetch of
all25 month panes in this window. Provider-type counts were2Google,2iCloud,
1holiday. These are selected-source counts, not repeated external-call counts.
No matching runtime errors were returned. A fast prepared response does not
measure native GPS/geocoding, network transfer, decoding or display latency.

The map prepared four200/MISS images in about39seconds at17:47–17:48, each
roughly4.07MB and739–846ms. This supports investigating repeated map work; it
does not prove identical requests, actual downloads, or the black-frame cause.
See map-response-diagnostics-20261008.md for the next diagnostic boundary.
