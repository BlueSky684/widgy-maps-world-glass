# Home Sync Map Lean 1

2026-10-05, branch `f50-widget-test`, source parent `1ac8459fc46868f64381511375aa0a6f12936521`.

## Evidence

At 10:08:06 Asia/Jerusalem the owner reports Home Sync Map Only 1 is “still a little slow”. Residual lag is present, but the report does not establish an exact delta versus the full Home or prove no improvement. There is no numeric native timing and no new report of a missing map.

Dependency inspection of a synthetic current export found exactly 12 Home-only definitions with no name/ID references outside that group after Home display removal. Their providers are two Weather (Now), four Javascript calculations, one Pedometer, one Custom Text target, and four JSON Endpoint fields. The four JSON fields do not establish four requests. Unreferenced definitions may not be evaluated at all in Widgy.

## Matched change

`withHomeSyncMapLean` calls the existing current `withHomeSyncMapOnly` transform, then removes exactly the 12 definitions. Every other field remains identical except trial name/description. Variables decrease from 81 to 69; all retained IDs, source objects and ordering remain exact. No layer is changed: 15 Home descendants and 1289 document nodes in both controls. The same map/GPS/synchronous URL, minute timestamp, full lossless image, frame, Calendar data/native city fallback, navigation and remaining tabs are retained. Home continues to show live coordinates rather than a city.

The transform fails on unexpected counts, duplicated IDs/names, missing removed IDs or any remaining reference to a removed variable name/ID. These definitions are required by the full Home, so this is only a sparse-copy experiment, not authorization to delete live functionality from the full version.

## Validation

`node tools/test-home-sync-map-lean.mjs` passes with public C16 and synthetic example.test calendar endpoints. Deep equality proves the entire document is identical after restoring only the variable array and metadata. Tests also verify the exact 12-variable delta, retained ordering, map/layer/navigation preservation, valid dependencies/tap targets, immutable input and rejection of dangling name or ID references. Actual import controller passes copy/download, expired-session clearing, retry/page restoration and blocked clipboard fallback. No private export, calendar data, real GPS or geocoder was accessed by the agent. No network/server/provider/cache configuration change.

## Device gate

Compare Widgy Home Sync Map Lean 1 with the immediately previous Home Sync Map Only 1 in the same slot/network after first map and marker load. Both should look exactly the same. Three Calendar-to-Home returns; report clearly faster / similar / slower, and missing map separately. No stopwatch or second phone.

If clearly faster, split the removed definition group to locate a contributing source group, without assuming an individual request/provider caused it. If similar, stop unused-definition deletion variants; the comparison supplies no evidence of meaningful cost from this group. Investigation would then require better evidence about the remaining map/native transition path, rather than repeating old hosting/artwork trials. Any outcome remains subjective and does not by itself diagnose Widgy, network, rendering or the server. The full control remains available; no production promotion.

Page: `/tools/widgy-home-sync-map-lean.html?v=home-sync-map-lean-1`.
