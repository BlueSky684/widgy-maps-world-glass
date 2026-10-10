# Health Premium 1 — native integration candidate

2026-10-10. Branch: `f50-widget-test`. Preview only. Based on Weather Premium 10
(commit b1856e540a86538ac3a111bcb23e07d8f7b77d08).

## Implemented

- Replace the unused Fitness shell (group 195) with the approved Health composition.
- Local native Health, Activity and Pedometer sources; 12 new native variables.
  No HTTP endpoint, network script or server-side health data processing.
- Original Home/Calendar/Weather navigation geometry and actions retained. The
  fourth tab becomes Health with `heart.fill`; Cardio uses the approved runner.
- Approved moon: outer size 33.0939, outer radius 19, cutout centre 31/18 and radius
  17.97641556. Existing approved contours retained in the static artwork.
- Three native activity rings and one native today-steps gauge. Existing Home
  steps ring/source and Home activity data remain untouched.
- Weather rendering revision 11 reduces only the standalone hero sun from 180
  to 138 units. Subsequent on-device feedback raises its centre 12 units from
  Y=371 to Y=359, matching the partly-cloudy centre, and moves it 8 units toward
  the temperature (X=165 to X=173), retaining the approved 138-unit size.
  The first on-device candidate used 162;
  feedback requested a further reduction (162 → 138, about 14.8%). Revisions
  1–10 retain their previous output; hourly/daily artwork remains unchanged.
- Encrypted full-widget export and separate multiline Copy Full JSON page.
  No plaintext personalized export or decryption key belongs in the repository.

## Honest boundaries of this candidate

The owner's source-picker video establishes exact category/field names. It does
not establish native serialization of a historical-day selection or sample-date
format. Those properties have not been guessed.

- Six previous daily step/energy rows are unconnected and display dashes. The
  bottom row and its gauge use today's real sources. Weekday labels roll locally.
- No measurement timestamps: `LATEST` labels deliberately replace example times.
- Daily sleep duration is bound as `Sleep Analysis (Duration)` under Health
  (Daily); no claim that this is the most recent complete night's sleep or a
  sleep-quality score. Native aggregation needs inspection.
- Breathing is the last Apple Sleeping Breathing Disturbances quantity, without
  diagnostic classification, alert, AHI label or fabricated unit.
- Preserve native unit strings. Do not infer kcal/kJ or m/km from bare numbers.
- Until absence behavior is inspected on the phone, zero-valued health readings
  (including a potentially genuine zero breathing value) are conservatively
  hidden. Activity zeros are retained. The original Home behavior is unchanged.
- Health permission, latest-record age, actual unit output, native text fit and
  ring scales require an on-device import. Server rendering cannot verify Widgy.
- No Apple Watch readings are expected solely from importing this candidate.

## Verification

- Seven Health tests: no input mutation, exact existing variables/sources,
  allowed-only Home/Calendar/Weather changes, unique IDs/navigation, native field
  mappings, empty/zero/unresolved-variable handling, local-only Health bindings,
  sample-free shipped artwork, weather pixel-command isolation and endpoint v11.
- Existing Weather/AQI suite: 15 reported passes. Its optional old-baseline
  integration test has no baseline here; Health's own exact baseline comparison
  covers the full current private widget separately.
- Build completed with the explicit public manifest. Public files contain only
  static art, copy UI and authenticated encryption envelope for this feature.
- Copy controller passed a DOM harness with real WebCrypto, full JSON round-trip,
  multiline/compact toggles, clipboard fallback, and missing/wrong key rejection.
  Local Chromium download failed; this is not a native browser verification.
  `tools/verify-health-copy.cjs` remains available for a browser-equipped runner.

## Next evidence needed

The first on-device screenshots show 348 steps, 267 m and 10.8 Cal loading in
Health. The remaining health readings show dashes; this does not verify those
bindings, historical activity, or ring behavior. The main Weather sun still
looked too dominant, prompting the isolated 138-unit server-renderer adjustment.
The existing Health Premium 1 export already requests revision 11 with its
minute refresh parameter, so this adjustment needs no new JSON import. Device
image refresh scheduling remains controlled by Widgy/iOS.

Import Health Premium 1 as a separate copy and inspect its actual layout and data.
To finish historical days and measurement times, capture/export one configured
native historical Health text/chart source and one latest-reading date source
(if exposed by Widgy). Do not mark those features complete without that evidence.
