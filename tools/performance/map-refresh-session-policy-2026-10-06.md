# Map refresh: accept occasional refresh cost, keep ordinary navigation fast

Date: 2026-10-06. Repository: BlueSky684/widgy-maps-world-glass. Branch: f50-widget-test. Starting head: 7d6b5ddb6143dd44059519255ae0c3f11df882a0.

## User direction

At07:09:34 Asia/Jerusalem the owner clarifies: occasional delay when the map updates after not using the phone is acceptable; repeated waiting on Home taps during active use is not. Do not continue treating every fresh-image delay as a failure. Fresh day/night/location and the approved 3306×1558 lossless appearance remain required.

This is a user-authorized bounded freshness/reuse tradeoff, not permission to freeze the map permanently, reduce resolution/GPS precision, or repeatedly lengthen update intervals.

## Screenshot evidence and older contrary result

IMG_9910 and IMG_9911 show the native Image source picker, System category. IMG_9910 visibly offers Files. They show the small21-layer map diagnostic; the editor image indicator reads14.7MB. This indicator is not an instrumented measurement of extension RSS. MAP TIME is2026-10-06 07:01:13 in both editor captures. That confirms displayed pixels for that instant, not background refresh cadence or fast Home Screen navigation. Do not record or replay the visible personal coordinates.

A further read of home-transition-audit.json, localStaticMapProcedure, finds an older full-size native Files trial completed2026-10-04 17:02:15 with no perceived speed improvement. It used the larger static-map baseline, so it does not prove that all local-file approaches fail or validate a separate updater. It is contrary evidence missing from the prior architecture report's shortlist and must be retained. Do not present simple selection of Files as a new performance breakthrough or repeat that old comparison unchanged. No Files source serialization or file replacement/freshness behavior has been captured in this session.

## Decision

Pause Files setup in light of the clarification. No new local-file page/export, Shortcuts automation, file bookmark or changed native source was created. Use the already-prepared Widgy Map Five Minute1 trial. Its code and all runtime dependencies are unchanged. Only the instructions and research records change.

The original cached Web URL provider is retained; the synchronous script emits t=floor(now/300000)*300000. At identical coordinates, repeated evaluations inside one bucket produce exactly the same image URL. When a bucket boundary is crossed and Widgy next evaluates the source, the URL changes. The server uses actual render time, unchanged private reuse60, and a burned-in MAP TIME diagnostic. No city fetch, additional reload tap, timer or server change.

Caveats: native GPS jitter or actual travel can change the URL sooner; no rounding has been introduced. HTTP/private reuse60 remains distinct from Widgy's own image cache. The template neither detects active/idle use nor guarantees a new image every five minutes or a maximum of one download per bucket. A boundary can occur during active use, even seconds after initial import. Compared with the user's manually selected No Caching copy, both provider and time URL differ; this is a behavior trial for the clarified goal, not a single-variable causal experiment.

## Device gate

Keep the existing working copies. Import the existing Five Minute1 export through its copy page, assign this specific copy to the tested Home Screen slot, and leave its image source settings as prepared. Confirm map, expected marker and readable MAP TIME.

Use the phone normally. Observe repeated Calendar-to-Home returns and the next natural return after a break. A single delay accompanying a newer map can pass the owner's tolerance if subsequent ordinary transitions are fast and the newer timestamp stays retained. Frequent stalls on unchanged MAP TIME, backward timestamps, a missing map, or persistently frozen pixels fail. Repeated stalls with frequently advancing MAP TIME suggest repeated fresh loads but do not prove GPS or any unique cause. Do not request personal coordinate logging, travel, a stopwatch, a video, or timed six-minute idle periods.

Do not restore city/full Home before this small map path passes; no small-widget result guarantees full-widget performance. If Five Minute1 fails, inspect the actual installed export and unchanged/new stamp pattern before another candidate. In particular, exact-coordinate URL churn is a concrete unresolved risk; do not paper over it by calling this one download per five minutes.

## Verification

Re-ran tools/test-map-five-minute-url.mjs:64 synthetic location/time cases and real controller copy/download/error/retry behavior pass. Confirm live page/dependency byte identity after publication. Native freshness, cache retention, location acquisition, and navigation latency still await owner observation.

Page: https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/tools/widgy-map-five-minute-url.html?v=map-five-minute-use-1
Chrome: googlechromes://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/tools/widgy-map-five-minute-url.html?v=map-five-minute-use-1
