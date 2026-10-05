# City Lookup Bypass 1

2026-10-05, `f50-widget-test`; full control is Native Steps Ring 2. Source parent `f0a029d72275e01a89ff3d451dfeb87184cf4f0d`.

## Evidence and purpose

At 07:23:59 Asia/Jerusalem the owner reported that entering Calendar is also slower in the version with the city name than in the no-city version. Earlier this morning they reported no slowness in the dynamic map without city text. The exact compared no-city variant is not established, so these are useful subjective observations rather than a controlled timing result.

Current source inspection confirms two custom city lookup scripts: `map_request` and `calendar_city_prefix`. Each can independently call the client geocoder. Home accepts an exact-coordinate in-context cache for up to 3600 seconds; Calendar's embedded script accepts 60 seconds. Both use the same global key, but shared/persistent JavaScript context inside Widgy has not been demonstrated. Both defer completion until lookup resolves when no valid cache is available. No duplicate-request count per tap or Widgy application defect is established.

## Change

Starting with the full Native Steps Ring 2 copy, replace only the cache/fetch/response-validation block in those two scripts with immediate `finish(mapURL('CITY TEST'))`. Preserve each script's preceding coordinate validation, invalid-coordinate behavior, map URL builder, minute time bucket, native Async + No main() source mode, call arguments and completion handler. Calendar still extracts and formats the prefix through its original handler. Home still loads the live 3306×1558 map and real GPS marker. The explicit artificial label avoids pretending a constant city is live data.

All 1514 layers and all 81 variable IDs remain. All other variable contents, images, fonts, map settings, events, weather, steps, navigation and other document fields remain byte-equivalent after restoring the two script strings and name/description. No server changes, new provider, geocoder request, real-coordinate replay, private export or owner data are part of agent validation.

## Validation

`node tools/test-city-lookup-bypass.mjs` passes with synthetic data. Deep equality enforces the narrow change. Runtime checks use synthetic coordinates 0,0 and malformed/out-of-range inputs. Both callbacks complete once in initial evaluation without a network lookup and equal the original scripts' valid-cache output for CITY TEST; original missing-location handling is preserved. The actual page controller is exercised with mocked copy/download, session expiry, retry/page restoration and clipboard errors. Native rendering, refresh and timing remain unverified.

## Phone comparison

Use `Widgy City Lookup Bypass 1` versus `Widgy Native Steps Ring 2`, same slot/network, after initial map load. Confirm the GPS marker and CITY TEST label on Home and Calendar. Compare both transition directions a few times without a stopwatch requirement.

Improvement would implicate the combined custom city paths; this experiment does not distinguish geocoder network waiting, cache misses, validation CPU or native scheduling. No improvement does not establish that city lookup is free. Preserve real city functionality in the final design; this placeholder is diagnostic only.

The previously prepared Home Map Variables 1 test is deferred while investigating this stronger city-related report.

Page: `/tools/widgy-city-lookup-bypass.html?v=city-bypass-1`.
