# Runtime cleanup and next performance priorities

2026-10-04. Work branch: `f50-widget-test`. Baseline: `4f21b52e295dd728c1bcdd7402b4e5d574c5886c`.

## Changes

- Move the existing solar and location helper functions verbatim into `lib/map-astronomy-location.js`. The historical v122 renderer re-exports them for compatibility. The current night-map renderer no longer imports that historical renderer.
- Resolve current map assets through six literal paths. Package those six assets plus the font licence instead of explicitly including every historical Earth asset. Both approved masters, both fonts, the asset contract and the generated r6 cache remain available.
- Remove `tools/widgy-v78.html`, `tools/widgy-v78.json`, `tools/widgy-v80.html` and `tools/widgy-v80.json`: all four were byte-identical to their v77 counterparts, and no tracked source referred to the removed filenames. Explicit rewrites preserve all four public import URLs and their contents. Removed duplicate source bytes: 137,550.
- No widget export, source binding, navigation action, refresh interval, clock, image dimensions or drawing changes in this cleanup.

The locally prepared Earth directory contained 51 files / 36,331,590 bytes including its generated cache. The isolated current runtime needs 7 files / 13,418,046 bytes, excluding 22,913,544 bytes of historical materials. These are **local asset-selection counts**, not a measurement of Vercel's final function bundle, storage usage or cold-start duration. Historical maps remain in the repository for the legacy map API, existing import links and reproducible approved-master construction.

## Verification

`node tools/test-night-map-isolation.mjs` builds two isolated local runtime trees: the baseline and the new dependency closure. Only approved current assets are present in the new tree. A fixed synthetic 0,0 / Example map at 3306×1558 is byte-identical for both r6 and F50, including decoded pixels, PNG bytes and embedded colour profile. Removing the generated cache from the isolated tree still produces the exact same r6 result using the approved source masters. No geocoder or private endpoint is called.

The existing consolidation equivalence and copy-controller checks also pass: 18,450 weather cases, identical ordered drawings, predicates, native sources and tap targets. This does not measure iPhone transition speed. Public rewrite and map smoke checks follow the branch deployment.

## Branch inventory and access limitation

GitHub reports three branches and no open pull requests:

- `main`: production, retained.
- `f50-widget-test`: active work, retained.
- `day-night-widget`: head `273907681c2b41a903a45f42885631422d4aa5ae`, fully included in the work branch (115 commits ahead, zero behind). It is a deletion candidate from Git history alone.

Deletion is deferred because deployed-site use of the old branch could not be checked. Vercel's project and deployment read operations returned a 403 team-scope authorization error for `blue-sky12`. No alternative credentials, browser or CLI were used to bypass that denial. No branch or deployment was deleted. Branch deletion alone is not a Home transition optimization.

## Device evidence carried forward

- The user reported that the original live map with city lookup loads quickly when Home contains only the map and navigation.
- After Consolidated 1 the user reported a substantial qualitative improvement, with a small remaining Calendar-to-Home delay. Home and Calendar screenshots show the expected map, clock, native weather, fitness, date and empty agenda. Nonempty event rows have not yet been visually verified on the phone.
- An older literal-image-URL diagnostic felt about one second faster to the user. That comparison also changes the city/GPS dependency, uses synthetic coordinates and an embedded backdrop; it does not isolate a single cause.

## Recommended next work

1. Keep Consolidated 1 as the full-function baseline. Home's condition factoring already removed 50 wrappers; further changes must retain drawing order and full native visibility predicates. The 100 step segments and 100 day-progress states have distinct cumulative/rounded geometry, so deleting them as duplicates is not valid.
2. Prioritize Calendar's state and data paths. It retains 25 navigable month panes, 75 native month-layout drawings and 95 alternative current-day highlight positions. These are legitimate alternatives, not all simultaneously displayed. Its 39 native JSON field bindings share one URL; actual request coalescing and hidden-pane evaluation remain unknown in Widgy. Establish those behaviors before replacing the existing working native sources with a new asynchronous dependency chain.
3. Evaluate one city result path shared by Home and Calendar. The current Home city script caches for up to an hour in a surviving JS context with exact coordinate matching, while the Calendar city script is separate. A server-key geocoder plus bounded shared caching is an option, not an established speedup; it requires a server-appropriate provider key and must invalidate correctly as the user moves. Never replay device GPS against the provider's free client endpoint from a server or test runner.
4. Compare hosting only after those dependencies are understood. A geographically closer server cannot remove native widget evaluation costs. No paid subscription or new hosting account was created.

Provider research: [BigDataCloud server reverse geocoding](https://www.bigdatacloud.com/reverse-geocoding), [Cloud Run locations](https://docs.cloud.google.com/run/docs/locations), [Vercel includeFiles configuration](https://vercel.com/docs/project-configuration/vercel-json).
