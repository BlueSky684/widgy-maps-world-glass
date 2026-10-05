# Map Five Minute 1

2026-10-05, branch f50-widget-test, parent86c7b36405c9187bcef2912e08b1bda0c9bdeb0b.

## Why this trial

The stable cached Refresh Clock1 showed fast transitions but retained21:48:29 across reported waiting tests. A new22:30:30 appeared after the manual-reload instruction, then the owner reported a return to the old time. After the instructed UI change to Web URL (No Caching), the owner reports slight slowness at22:56 and supplies a screenshot with MAP TIME22:55:30. This implicates the combined refresh/image path, not exclusively the host, download, decoding, GPS or Widgy scheduler. A screenshot immediately after editing is not proof of ongoing automatic refresh or a repaired timestamp regression. The provider change is understood from context; no phone export verifies its serialization. Do not store actual owner coordinates.

Earlier minute-URL/no-GPS trials were initially reported fast; GPS Pair and fixed-marker minute-URL trials later delayed after idle. Stable Marker and Stable GPS were fast after four minutes. The older full-widget Cache URL1 did not improve. Retain these limitations instead of declaring that all changing URLs are slow or caching alone solves the widget.

## Exact changes

`withMapFiveMinuteURL` starts from the original generated Refresh Clock1, keeping its Web URL provider and every image field,21 layers/three variables, primary native coordinate definitions, parser, all navigation and static Calendar. Only the synchronous map_request body and trial name/description differ. The existing Date.now/minute calculation becomes Math.floor(instant/300000)*300000, emitted as one t parameter. No new variable, network call, timer, async callback, geocoder or city.

Same coordinates yield the same URL within a five-minute epoch bucket. Crossing its boundary yields a new URL WHEN Widgy evaluates the source. A coordinate change can change the URL sooner, with no new rounding/precision reduction. Missing coordinates remain explicitly empty without IP fallback. This is an image-identity experiment, not a five-minute refresh schedule, a background worker or a guarantee of request frequency.

Compared with the owner's manually edited No Caching copy, both image-provider choice and URL behavior differ. The isolated code comparator is the retained original cached Refresh Clock1. The phone's no-caching JSON is not guessed. The new import's image settings are already prepared; the user should not manually select No Caching for this candidate.

The API/renderer/private reuse60 cache, diagnostic stamp and full3306x1558 lossless PNG remain untouched. t does not control solar time or server-cache key; the route uses server render time. A new URL can receive an existing server bitmap no more than60 seconds old under this cache policy. No CDN/region/assets/production change. Any new-image load may still delay the first Home return; this candidate explores a bounded tradeoff, not a completed repair.

## Validation

Passed `node tools/test-map-five-minute-url.mjs`, `node tools/test-map-refresh-clock.mjs` and `git diff --check`. Full-document equality restricts changes to script/name/description.64 synthetic coordinate/time cases cover five-minute and internal minute boundaries, year rollover, zero/valid/invalid/blank inputs, decimal commas/Unicode minus and unchanged parser output compared with the control. Native coordinate changes still change URLs. Source code executes with traps for fetch, timers and async completion. Exactly one map,21 unique layer IDs and three variables remain, with no calendar tokens.

The actual public controller is exercised with a public-only template, clipboard/copy/download, preparation failure clearing stale payload, retry/pageshow and blocked clipboard fallback. The download payload exactly equals the transform result. Existing older generator remains unchanged. Native rendering/scheduling are not emulated by these tests.

Before handoff verify test-branch deployment and byte identity of all three new public runtime files; use only synthetic coordinates for any public API check. No restricted Vercel runtime logs or private owner exports/coordinates are read. No backend test expansion needed because server code is unchanged and expiry/ETag behavior was just verified for the previous result.

## Device gate

Keep the prior copies. Import Map Five Minute1 and assign this exact copy to the Home Screen widget being tested. Wait for the map/marker/MAP TIME. Note the stamp, test two Calendar → Home transitions, then leave on Calendar about six minutes and observe the first Home return without manual reload/reimport. Report speed, new stamp and any backward timestamp. Six minutes spans a URL bucket boundary but is not a promise of OS refresh. A faster warm return alone is insufficient.

If the stamp still rolls back, investigate stored navigation states/actual evaluated URL rather than declaring this solved. If first returns remain delayed, a longer bucket only reduces frequency and does not fix the delay itself; do not keep increasing intervals indefinitely. If fresh and sufficiently fast, validate natural refresh/location before restoring city/full Home. Do not ask the owner to travel or record a video for this gate.

Preview page: https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/tools/widgy-map-five-minute-url.html?v=map-five-minute-url-1
