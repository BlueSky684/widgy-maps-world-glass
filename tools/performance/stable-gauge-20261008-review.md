# Stable map and native day gauge — 2026-10-08

Branch: `f50-widget-test`. Production is not promoted or modified.

## Exact recovered export and copy page

Recovered `Widgy_Stable_Map_Native_Day_Gauge_Test.json`, current Library version 4.
The private plaintext is not committed. The public copy page uses an encrypted,
gzip-compressed payload; its decryption key is supplied only in the owner's URL
fragment. No calendar endpoint is fetched by this page.

- Original bytes: 917,066.
- SHA-256: `147e02f9ebc77f611c1892482ec97a6587096072530a9affa21df23b0fd0d134`.
- Page: `/tools/widgy-stable-copy.html` with the owner's complete fragment.
- Runtime tests decrypt the actual envelope and require exact clipboard-string
  equality to the source, rejecting missing/wrong keys and damaged ciphertext.
- Published browser UI loaded, enabled Copy Full JSON, and displayed successful
  copy. The remote browser clipboard inspection API returned an empty list, so
  independent native clipboard readback was not established by that browser.

The export is kept byte-for-byte: one native Linear Gauge replaces the prior
100 Day Progress Fill shapes. The original `map_request`, single Web URL image
binding, live GPS/city, time, full-size map pipeline and artwork remain intact.
This does not reintroduce the base64-variable or split-mask experiments.

## Structural and network audit

- 1,415 nodes; unique IDs and valid navigation targets. 89 scripts parse.
- Descendants: Home 141, Calendar 1,222, Weather 24, Fitness 24, plus four roots.
- No identical sibling duplicates (ignoring IDs/names); no empty groups.
- `steps_progress` is unused after the native ring conversion. It is retained
  to preserve exact source identity; removing it is not an established speed fix.
- 81 variables. Calendar's 25 month panes are functional, not duplicate data.
- 39 source URL occurrences point to calendar-widget. This is a document count,
  not evidence of 39 actual requests per transition.
- Home and Calendar have separate asynchronous custom reverse-geocoder scripts.
  Reuse requires an unchanged coordinate pair and a surviving JS context; Home
  allows 3,600 seconds, Calendar 60. Shared contexts are not established in Widgy.
  Both can wait for the request to settle before returning their value. Existing
  phone experiments already implicated these paths; do not repeat failed native
  multi-placeholder, no-city, lower-resolution or split-mask trials as new fixes.

## Live and local map evidence

Two preview GETs with explicitly synthetic 0,0/Example coordinates returned
HTTP 200, PNG 3306×1558, 4,012,395 bytes and identical hashes. Server-Timing:
MISS 1,503.0 ms; HIT 0.1 ms. Private freshness decreased from 58 to 35 seconds;
the shared CDN remained MISS, as expected for private location images.

Two authenticated Calendar GETs returned 200, valid native JSON (40 fields),
no error, and private max-age 30. No titles or account data are recorded here.
End-to-end requests in the execution environment took approximately 18–25 s,
including its network/proxy. They are not measurements from Israel or the iPhone
and must not be attributed to Vercel rendering or extrapolated to native speed.

Eight synthetic local full-resolution renders across today's UTC hours used
4,011,973–4,459,873 bytes. These samples do not prove a universal payload bound.
The last-30-minute preview error/fatal log query returned no groups; older logs
were unavailable under the current retention window. No historical cause of the
phone's missing map is established by this limited sample.

## Safe Calendar optimization

Google OAuth exchange results now share a bounded in-memory cache across month
reads in one warm instance. Concurrent reads coalesce. Reuse lasts at most 60 s,
also bounded by Google's declared expiry minus 30 s; unknown expiry is not reused.
Keys isolate refresh credentials and app configuration; clock rollback, failures,
expiry and eviction races are covered. Secrets are neither logged nor persisted.
Provider event queries and existing event/dots freshness policies are unchanged.

Synthetic integration: 25 month reads → one OAuth exchange and 25 event requests.
An additional read still performs its event query. This proves removal of redundant
authentication, not an iPhone speed percentage. Calendar response headers now expose
server duration and provider-cache MISS/REUSE without returning private data.

Validation: all 40 Google-cache/provider/holiday/Calendar regression tests pass;
map city-reuse and actual route MISS/HIT/304/expiry tests pass; old default PNG is
byte-identical; the complete configured build passes before preview publication.

## Required native result

Import the exact stable combined export as a separate copy, confirm the map/city,
GPS marker, native day gauge and Calendar, then leave the editor and switch
Calendar → Home repeatedly. The previous symptom (map missing over 30 s but
restored by switching tabs) cannot be reproduced in this environment. The stable
pipeline is restored, but disappearance resolution and actual Home/Calendar
transition speed remain pending phone verification. Do not mark them fixed or
change production based on server-only evidence.
