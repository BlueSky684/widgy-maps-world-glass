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
recording the owner's actual calendar dates or querying private calendars.

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
