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

## Device feedback and correction, 2026-10-05

At 10:17:54 Asia/Jerusalem the owner reports improved Home transition speed. At 10:18:47 they clarify that it is not consistent: sometimes it gets a little stuck and then goes to Home. Preserve both observations: some subjective improvement, with intermittent stalls still present. This is not stable performance validation, a measured delta, proof the 12 definitions caused the lag or evidence all were evaluated.

A proposed six-variable weather/Home-calendar add-back was paused before testing or publication after this clarification. Its three newly drafted files were removed; no new import route, widget or runtime change was published. Do not continue a chain of variants based on a presumed stable faster baseline.

Next inexpensive distinction: during a stall, does Calendar stay visible and then Home appear all at once, or does Home appear before the map? This observation can distinguish the user-visible phase, although it cannot alone locate network/native/rendering cause. Keep Lean 1 unchanged until that answer; preserve the full Sync Recovery control.

## Owner steering after the pause

At 10:21:20 Asia/Jerusalem the owner reaffirms that removing the variables definitely improved something in their comparison. Preserve this as a meaningful subjective improvement alongside the intermittent stalls, not as no benefit. It still does not quantify or isolate a provider. At 10:22:10 they suspect the map is the main issue; at 10:22:57 and 10:23:18 they explicitly prioritize stable map/location loading before returning any other Home components.

The briefly resumed add-back draft was removed again, unpublished. Source add-back is deferred by user priority. Current baseline remains Lean 1; next map-only comparison is documented in `map-cache-url-1-review.md`.
