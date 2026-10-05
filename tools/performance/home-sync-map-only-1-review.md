# Home Sync Map Only 1

2026-10-05, branch `f50-widget-test`, source parent `9c1b1383825968225b857d4ae7e15bee033fee59`.

## Evidence and question

At 09:17:47 Asia/Jerusalem the owner reports the map appears correctly on all tested returns in Map Sync Recovery 1; Calendar transition is normal, Home still slow. This supports retaining that control for now; it does not establish a permanent reliability repair or a speed benefit.

Review of recorded comparisons found no clear benefit from the native ring, removing progress/weather artwork alone, lowering resolution or changing CDN. The earlier sparse Map Only City was fast but also removed 12 Home variable definitions (81 to 69). The earlier variable add-back was prepared but never tested as attention shifted to the city lookup. Its old custom city/async control differs from the current successful map source. Do not present that old untested page as a current matched comparison.

## Narrow current comparison

`withHomeSyncMapOnly` begins with the exact `withMapSyncRecovery` output. It keeps the unchanged map and 14 original Home navigation nodes, in their original order, and removes only other Home display nodes. All 81 variable definitions, their IDs/order/sources, live GPS parsing, synchronous map URL logic, minute refresh, full lossless 3306x1558 image, image frame/options, other tabs, fonts and remaining document fields match the full control. Name/description identify the temporary diagnostic.

Home descendants decrease from 240 to 15; total document nodes from 1514 to 1289. These are structural counts, not measured work or speed. Removed nodes include inline native data consumers: this comparison isolates the removed Home display/source-consumer group and interactions, not drawing alone. Unreferenced variables may be lazily evaluated; keeping definitions does not establish they all run. No real GPS, private export, calendar feed or geocoder was fetched by the agent.

Home's live marker remains labeled by coordinates; Calendar retains the current native city fallback. Restoring a matching English city on the map is still open. No production promotion or permanent design change.

## Validation

`node tools/test-home-sync-map-only.mjs` passes with a public C16 fixture and synthetic calendar endpoints. Deep equality after restoring the removed Home children and metadata proves all remaining fields exact. Checks include retained map/navigation fields and ordering, 81 unchanged variables, valid tap targets/variable references, unique layer IDs, source immutability and unexpected-template rejection. The actual import controller passes JSON copy/download, unauthorized-session clearing, retry/pageshow and blocked-clipboard fallback checks. The control page/source are not modified.

## Device gate and next decision

Import Widgy Home Sync Map Only 1 separately; assign to the same slot used for Map Sync Recovery 1 and use the same network. Wait for map and marker before three Calendar-to-Home transitions. Report clearly faster / similar / slower; report a missing map separately. No stopwatch or second phone. The blank surroundings are intentional, and the full control remains available.

If clearly faster, isolate groups of the removed Home consumers on this exact current baseline. If similar, do not repeat artwork deletion; revisit source dependencies and map path with evidence on the sparse control. Neither outcome alone diagnoses Widgy, DNS/network, server, decoding or an individual layer. Do not run a batch of additional phone variants without this result.

Page: `/tools/widgy-home-sync-map-only.html?v=home-sync-map-only-1`.
