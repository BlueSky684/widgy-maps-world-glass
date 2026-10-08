# City Reuse Test 1 — 2026-10-08

At 17:08 the owner reports no perceived Calendar transition speed improvement
with the city now visible. Do not promote sharing as a performance fix or remove
the working city path on this evidence. Next inspect actual Calendar request
latency/counts; see `calendar-response-diagnostics-20261008.md`.

## Follow-up at 16:54–16:56 — city visible in the unchanged trial

The owner supplied native export `20261008-135420` (949,056 bytes), titled
`Widgy City Reuse Test 1`, then confirmed that the city is currently visible.
IMG_0096 shows `Ashdod, Israel` in Calendar on the Home Screen. Inspection of
the supplied export finds all 81 variables identical to the original trial;
after decoding native custom-shape JSON, the only document difference is the
next-ID field `a2` (82316 to 82318). There are still 1,415 layer/group nodes.
The independent-city recovery payload was therefore not the source of this
export. Do not describe the observed city return as a recovery-code success.

The current Calendar city script already extracts the encoded city from
`map_request` and contains no fetch or reverse-geocoder. One custom geocoder
implementation remains, in the map source. This is a source-code fact, not
proof of one physical lookup per native refresh: variable re-evaluation and
JS-context cache retention remain unmeasured.

The screenshot cannot distinguish the shared-map city path from the native
Location/City fallback, because both intentionally have the same appearance.
It also supplies no timing or movement/freshness result. The earlier blank-city
observation still stands, but the stronger inference that the dependency never
works is unwarranted. Preserve the owner's currently working copy while checking
ordinary Calendar transition latency and recurrence. Do not send another import
or restore the shared trial as the copy-page default solely from this screenshot.
The existing recovery page and server code remain unchanged.

## RETIRED at 16:24 — Calendar city missing on Home Screen

IMG_0094 shows Calendar on the iPhone Home Screen: location icon and date are
visible, city/country text is blank. After the requested native check, this
candidate has not preserved the required dynamic Calendar location display.
The new synchronous dependency on the asynchronous map variable is not accepted
for release. This does not prove the exact native evaluation or fallback cause;
passing VM substitution tests did not establish actual native dependency support.

Restore Calendar's independent asynchronous city source using the exact full
stable v5 export, including the corrected gauge order. The existing trial copy
page now loads `widgy-city-reuse-recovery-1.enc.json` through controller v2 under
the same owner fragment key. Its title/instructions explicitly describe the
recovery and identify `Widgy Stable Map + Native Day Gauge Test`. The dedicated
stable page is untouched. Stable bytes:917066; SHA-256:
`e99b0036a462fb8729126517669f6fff6e622f1133542d9551edd41c289c703a`.

The failed transform and ciphertext are retained only for reproducibility.
Recovery restores a previous source, not a proven speed gain or a demonstrated
fix for intermittent map disappearance. Native city visibility must still be
confirmed. No map, GPS, clock, layout, server caching or diagnostics is changed.
Exact-copy, wrong-key/tamper, manual fallback, document-integrity checks and the
configured build pass before preview publication; production is untouched.

The sections below are the historical trial record.

## Phone update at 15:48–15:50 Asia/Jerusalem

IMG_0091 shows the Widgy overview named City Reuse Test 1 with a black/empty map
frame; the native day-gauge fill is visible. The owner then reports that the map
returned and says this is the previous stable map version. It remains unclear
whether it returned in the same candidate or after switching widget copies.
Do not label this a permanent failure or attribute it uniquely to the new
dependency. The narrow recent preview error/fatal log query returned no groups;
that does not establish successful native image requests.

A recovery page was prepared locally, then canceled before any GitHub/Vercel
publication when the return was reported. The active deployment remains 8e09f53;
the stable and trial copy pages remain as previously published. Next establish
which widget copy recovered before choosing a rollback or another experiment.

At 15:54 the owner clarified: re-entering the same widget in Widgy caused the
image to load. IMG_0092 also shows the same blank map in the older Native Steps
Ring copy (1,253 layers + 261 groups, 81 variables). Thus the new Calendar
dependency is not the sole explanation. Its speed benefit remains unverified;
neither a new import nor a rollback is needed for the next server-diagnostic gate.
See `map-response-diagnostics-20261008.md`.

Work branch: f50-widget-test. Stable control: deb632c58d1dee311b770fe1c7d9c52ce905065b,
with the corrected native day-gauge order. Production remains unchanged.

## Finding and narrow experiment

The stable export independently reverse-geocodes in `map_request` and
`calendar_city_prefix`. Each can wait for its own network operation. Both have
best-effort global caches, but native JS-context persistence/sharing and actual
request counts are unmeasured. The stable map image uses only Web URL
`${widgy.map_request}`. No Shortcuts URI, iCloud file or `map-current.png`
reference remains in this export; its legacy map-refresh Shortcut is unnecessary
for this copy. An older local-file widget may still require it.

This separate candidate replaces only Calendar's city source mode and script.
It synchronously extracts the percent-encoded city from `${widgy.map_request}`,
using the same decoding, control-character removal, 80-code-unit cap and comma
suffix as the old Calendar completion callback. The existing native city
fallback stays intact for absent/unresolved/invalid city values. The map's city
lookup, exact-coordinate handling, live time, minute URL stamp, map image,
3306x1558 PNG, server caches and rendering are unchanged. Every layer and every
other variable is unchanged. The corrected gauge remains ahead of the chrome.

This removes Calendar's independent fetch implementation. It does **not** prove
one physical network request per native update: Widgy may re-evaluate the map
variable for each consumer. The new dependency may also affect native scheduling.
It does not eliminate Home's first geocoder wait, and is not claimed to fix map
disappearance. Do not promote based only on source/VM tests.

Unlike earlier no-city or mixed-source image experiments, this retains the
original working map binding and custom city lookup. No city is hard-coded,
no test coordinates enter the export, and no timers or shared globals are added.

## Artifact and verification

Separate full JSON: `Widgy_City_Reuse_Test_1.json`, 913,161 bytes.
SHA-256: `c2f91ce96eff550e16a74d2597b1fc6034fed8db407a83e403ea05f7b0b481ad`.
Private plaintext and the copy-page decryption key are excluded from Git.
The new page uses AES-GCM/gzip and a per-candidate fragment key, with exact size
and SHA-256 validation before enabling Copy Full JSON. The stable page and
stable payload remain unchanged.

- `test-calendar-shared-city.mjs` passes on the public template and the exact
  stable private export. Restoring the two source fields and metadata yields
  full-document deep equality. The input is unchanged.
- Parser tests cover Unicode, punctuation, escaped text, missing/unresolved
  input, malformed encoding, and original sanitization. The original map
  algorithm runs against mocked geocoder responses, cache hits, failures,
  mismatched coordinates and unavailable GPS; no external provider is called.
- Both stable and candidate copy controllers pass actual encryption/integrity
  and exact clipboard-string tests, missing/wrong-key/tamper rejection, and
  manual selection fallback. Candidate retains 1,415 unique layer IDs, valid
  navigation, 89 parseable scripts, and one native day gauge.
- Configured Vercel build passes before publication. The change adds only
  candidate tools, its encrypted payload and this audit; server code is unchanged.

## Original phone gate — closed by missing-city report

Import as a separate **Widgy City Reuse Test 1** and assign it on the Home Screen.
After its initial load, make three ordinary Calendar-to-Home-and-back switches.
Report whether the wait improved, stayed the same or worsened; whether the city
stays correct on both tabs; and whether the map disappears. Keep the stable
copy available. No stopwatch, GPS upload, calendar disclosure or video is needed.
Native result pending. Continue based on this result, without declaring a
successful end-to-end speed improvement or adding another confounding change.
