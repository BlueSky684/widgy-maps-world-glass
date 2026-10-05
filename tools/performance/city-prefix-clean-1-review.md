# City Prefix Clean 1

2026-10-05, branch `f50-widget-test`, parent `3b568d48f6599316f1eb62cc10e7fa844f75afa3`.

## New information and current baseline

At 13:13:10 Asia/Jerusalem the owner reports installed Widgy version 27.0.1. The compatibility question is answered; do not suggest updating to that same version or infer that no Widgy issue can remain. Lean 1 remains the control with partial perceived improvement and intermittent pre-Home stalls. Stable URL and independent-map-parent trials gave no perceived speed benefit. Keep those out of this candidate. The owner still prioritizes map/location before restoring Home content.

## Source finding

Lean's `calendar_city_prefix` is still `Javascript / Async + No main()`. The prior bypass/recovery chain intentionally retained its source mode and four GPS placeholders while changing the custom lookup result to empty text. Its script still substitutes map_latitude_max5/map_longitude_max5/Latitude/Longitude, parses coordinates, constructs a no-city map URL and then extracts the absent city query to send empty text. No external fetch remains. Both valid and invalid-coordinate paths finish with `mapURL('')`; the endpoint itself contains no city query. The empty prefix activates the existing native Calendar Location/City and Country fallback, including Ashqelon-to-Ashkelon spelling. Home's map already uses a separate synchronous script.

This is a redundant dependency/async job at source level. There is no measurement showing four GPS requests, actual waiting for each placeholder, repeated hidden-layer evaluation or this job causing the Home stall. Earlier literal TEST experiments used a nonempty prefix and selected a different Calendar display path on another baseline. The new change keeps the already-empty prefix and current native fallback path, so it is not the same comparison.

## Narrow change

`withCityPrefixClean` starts from `withHomeSyncMapLean` and changes only the single source object of calendar_city_prefix to `{'5':'Custom Text','6':'Text','25':''}`, plus trial name/description. Keep the variable itself and its ID, all 69 variables and their ordering, 1289 layers, all conditions/taps/calendar data, and the entire map layer/script/URL/GPS/timestamp/cache/resolution pipeline exact. No new data source is restored, no GPS definition removed, no visible design rebuilt, no server change. Home still shows map/navigation and coordinates without city. The agent does not run location/geocoder/private calendar requests.

The transform validates the expected bypassed async source, exactly two empty-city completion paths, safe no-city endpoint, unchanged GPS tokens and enabled/reuse settings. It refuses an endpoint carrying a city value or an altered source/completion. This is intentionally scoped to the current temporary empty-prefix control, not removal of the full production city mechanism.

## Validation

`node tools/test-city-prefix-clean.mjs` passes. It executes the old source in a local sandbox with synthetic coordinates only, missing/invalid/locale-formatted inputs, independent fallback values and time boundaries: 40 cases return exactly one empty result, matching the literal. Full-document deep equality after restoring the one source/metadata proves the map and all other fields are unchanged. Five synthetic native-city states choose the same native fallback/spelling layer, including empty source and Ashqelon. Unique IDs, remaining references and navigation targets are valid. Actual import controller copy/download/auth expiry/retry/pageshow/blocked clipboard flows pass with synthetic calendar links. No private data was fetched or published.

Code equivalence describes a completed script value. Widgy's handling of an empty Custom Text variable during native substitution/conditions and resulting transition timing still requires phone verification. The installed release's async fixes do not prove any particular behavior here. An immediate empty value may change transient scheduling; that is the intended experiment, not evidence of a confirmed bug.

## Device gate

Page: `/tools/widgy-city-prefix-clean.html?v=city-prefix-clean-1`, widget `Widgy City Prefix Clean 1`.

Import as a separate copy in the same slot/network as Lean 1. Confirm original map/frame/live marker and correct Calendar city/fallback. Make three Calendar-to-Home-and-back transitions. Record faster/similar/slower and missing map/city separately. No stopwatch or video. If there is no perceived benefit, do not call the redundant path the main cause, and do not repeat empty-prefix variants or assume a server move will help. Preserve the outcome for the map-first investigation. Any full-design restoration remains deferred until map/location stability.

## Device result — 2026-10-05 13:26 Asia/Jerusalem

Owner: “אין שיפור” (no improvement). Record no perceived transition benefit; no numeric timing or separate stability confirmation. Do not adopt this trial, call the retired prefix the main cause, or repeat empty-prefix variants. Lean 1 remains the working control. The next separate probe removes the rest of the whole widget while keeping Lean's map pipeline exact; see map-minimal-pair-1-review.md.
