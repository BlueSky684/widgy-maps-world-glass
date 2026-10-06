# Live map refresh without blocking Home — investigation checkpoint

## Current checkpoint — restored speed, 2026-10-06 08:40 Asia/Jerusalem

The owner confirms that speed returned following the requested rollback to Interpolate and Normal. At08:14 IMG_9922 identified the tested copy as the minimal Refresh Clock diagnostic; the assistant clarified testing the assigned widget on the iPhone Home Screen. Read the latest section of `map-mask-capability-2026-10-06.md`. Close the animation-off trial; no live-refresh solution or native mask support has been established.

Next: the existing Map Five Minute1 candidate, still without a reported phone result. Preserve the restored Refresh Clock copy and import/assign Five Minute1 separately, leaving its prepared cached Web URL source intact. This is a behavior/tradeoff trial, not a single-variable comparison with the owner's manually modified No Caching copy. Judge actual advancing MAP TIME and fast subsequent ordinary Home returns. Exact-coordinate changes may alter the URL sooner, and a first return at a time-bucket boundary may still stall. No timed idle chore or arbitrary interval increase. Current code verification passed64 synthetic cases and the copy/import/failure flows; server, renderer, assets and hosting remain unchanged.

## Next concrete gate — small-mask capability, 2026-10-06

Update08:11:27: In response to the animation-off trial, the owner says the transition feels slower. Record as a subjective negative result; exact settings and map freshness were not independently confirmed. Requested rollback to Interpolate with Blend Mode0/Normal. Rollback result pending. Do not repeat the same Off trial or treat it as an improvement. Verify restoration before another device change; no new image split, runtime change, or service migration is justified by this result.

Update08:02:57: IMG_9920 and IMG_9921(2) verify numeric Blend Mode0=Normal and17=Plus Lighter. The latter screenshot has no visible map and an Images0.0MB editor label; the cause is not established. Restore0 and confirm the image returns. This is not verified arbitrary-mask support. Read the latest section of `map-mask-capability-2026-10-06.md`. The next bounded native check changes only Layer Contents Updated Animation, Interpolate→Off, after restoring the control; no result yet. Preserve image source, URL, other transitions, and the actual-freshness gate. Do not request all18 mode screenshots or migrate services on this evidence.

Update07:48:57: IMG_9912–9919 confirm Image Effects has Blend Mode Normal and three active animation/transition settings. No explicit mask-source option is visible, and the blend-mode choices are not open. Read the appended screenshot findings in `map-mask-capability-2026-10-06.md`. Ask only for the Blend Mode choices next, not another full Effects scroll. Animation-off has no documented controlled test yet and is a separate candidate, not a proven cause.

Read `map-mask-capability-2026-10-06.md`. A new offline benchmark found a full-resolution solar-only grayscale mask of108–144KB, distinct from the earlier1.39–2.28MB replacement overlay. Eight-bit weights introduce measured one-level pixel differences; native mask support and independent layer sampling remain unverified. The next user action is one screenshot of the existing Image Effects options, without changing the working source. No new import, service or renderer change was made.

## Whole-widget scope — 2026-10-06 07:21–07:28 Asia/Jerusalem

Read `whole-widget-delivery-2026-10-06.md` for the latest direction. The owner wants measurable speed improvement across map, calendar, weather, fitness and future tabs, and will consider a small service payment. A new source inventory confirms native weather/pedometer/health ownership; a fresh local resource benchmark sizes the existing full PNG service. Railway is a comparison candidate, not a selected subscription or verified fix. No new import, runtime change or paid service was created. The image split remains an offline candidate with unresolved appearance/native-lifecycle gates.

## Current goal — owner clarification 2026-10-06 07:09 Asia/Jerusalem

Read `map-refresh-session-policy-2026-10-06.md` first. The owner now accepts occasional waiting when the map refreshes, especially after idle, but wants repeated Home taps during active use to remain fast. This relaxes the prior zero-wait-on-every-refresh gate. Pause Files preparation. The already-built, not yet device-tested Map Five Minute1 is now the bounded next trial. It preserves the original cached Web URL provider; exact coordinates can still change the URL inside a time bucket, and it is neither an idle detector nor a guaranteed five-minute downloader. Judge actual bitmap freshness, non-regression, and subsequent ordinary navigation; do not demand a timed idle chore.

## Continuation completed in the next session

Read `map-refresh-architecture-2026-10-05.md` and its JSON measurements first. New research found a direct historical developer answer about the missing cached-image refresh/fallback behavior; current v27 capabilities and complete Apple lifecycle documentation were checked. A real static-base/dynamic-overlay prototype saves47–65% recurring PNG bytes but has a failed sampling-parity gate and doubles theoretical full-size RGBA surfaces. It was NOT deployed. No Widgy-only nonblocking live-refresh solution is verified. The next bounded feasibility direction is a completed local PNG refreshed by an independent updater; current Files serialization, replacement/refresh behavior, and acceptable automation cadence require verification. Do not send another five-minute import as the next step.

Saved 2026-10-05, after the owner's 23:03 request for a deep investigation and 23:09 screenshot reporting that this conversation is too long. This is an INCOMPLETE investigation checkpoint, not a verified fix.

## Resume here
Repository BlueSky684/widgy-maps-world-glass; work only on f50-widget-test.
Runtime baseline commit: 13ebfaa10c0c9458fa6103c1df500d4b05b63efa.
Read this file, home-next-session-plan.txt, map-refresh-clock-1-review.md, and perf-5-audit.json before proposing another trial.

The owner wants a genuinely updating day/night map and location with immediate Calendar ↔ Home navigation, preserving the approved full 3306×1558 lossless image and appearance. Do not substitute a permanently cached image for freshness. City and other Home sources remain deferred until the map/location path is stable. No mockups. Links should open in Chrome. Avoid more repeated imports or manual timing chores without new evidence.

## Latest evidence
- Stable GPS / Refresh Clock: owner reports fast returns after four and fifteen idle minutes, but the PNG's burned-in MAP TIME remained 21:48:29. That supports reuse of an old bitmap, not successful live refresh.
- A later screenshot showed 22:30:30; user then reported regression to the old time. Exact regressed value/trigger were not provided.
- Audit of generated Refresh Clock export: 21 layers, 3 variables, one map Image (6170), cached Web URL bound to ${widgy.map_request}, visibility-only navigation with no extra Reload action.
- User was instructed to choose Web URL (No Caching) manually and keep ${widgy.map_request}. The dialog screenshots confirm the literal binding, not the selected provider or final serialization.
- Latest IMG_9908 shows MAP TIME 22:55:30 while phone time is 22:56; owner reports slight delay returned. This confirms another displayed bitmap; it does not identify network, render, decode, or Widgy as the sole cause or prove regular background refresh.
- Real coordinates from screenshots are not to be persisted or replayed in measurements.

## Five-minute trial status
Map Five Minute 1 was built before the broader research request:
- Starts from original cached Refresh Clock export. URL t changes by five-minute epoch bucket only WHEN the script is evaluated; exact native coordinate behavior retained. Not a timer or refresh guarantee.
- Keeps 21 layers / 3 variables, full PNG, current server, private reuse60, navigation, source provider and frame.
- 64 synthetic coordinate/time cases plus full-document isolation and actual copy/download/failure/retry/controller tests passed. Refresh Clock tests also passed.
- Commit 13ebfaa10c0c9458fa6103c1df500d4b05b63efa has successful Vercel status.
- All three new public runtime files fetched HTTP200 and byte-identical to local source: tools/widgy-map-five-minute-url.html (3878 bytes), tools/widgy-map-five-minute-url.js (2540), tools/map-five-minute-url.js (2011).
- Page: https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/tools/widgy-map-five-minute-url.html?v=map-five-minute-url-1
- Chrome: googlechromes://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/tools/widgy-map-five-minute-url.html?v=map-five-minute-url-1
No reported device result. It is NOT the final solution: it could merely move the stall to the first request after a bucket boundary. Relative to the manually modified No Caching copy, both provider and time URL differ. Do not treat it as a single-variable causal comparison or keep lengthening intervals to hide stale content.

## Findings from code inspection this turn
api/night-map.js uses private client/render reuse up to60 seconds, plus CDN no-store for real location responses. Only an exact synthetic0,0 query can opt in to CDN delivery. No real-location CDN experiment was enabled.
The backend uses current server time, not t, for rendering. Fixed at is reproducibility-only and absent from normal exports.
lib/home-map-day-night.js composites terrain, lights, etched coasts, location marker and label, optional diagnostic timestamp, and clipping into one full image. A fresh output is a full PNG, even for a small solar/location change.
Existing lib/map-precomputed.js caches decoded static inputs and engraving; it is NOT a schedule of finished future maps.
Current server uses Frankfurt (fra1). Changing hosting alone does not eliminate phone-side image fetching/decoding or Widgy navigation scheduling.
A full RGBA3306×1558 buffer is20602992 bytes (19.65 MiB). Do not claim actual Widgy RSS from theoretical pixel size.

## Do not repeat rejected work as new
Read perf-5-audit.json: previous PNG adaptive filtering saved~0.6% with materially slower encoding; level9 saved~1.6% while roughly doubling encoding time; WebP trials changed some transparent pixels and were not adopted; raster overlay caching was inconsistent/worse and reverted. No new codec benchmark has been run in this turn.
Map Separate Layer1 reparented the SAME full image behind all tabs; owner said no improvement. That is distinct from a future actual split of terrain/mask/marker, but it does not prove background prefetch or decoded-image retention.
Earlier minute-URL test initially had no waiting; preserve this contrary result. Fixed-marker/synthetic0,0 later also slowed after idle, so native GPS is not necessary for that symptom.
The full-widget stable-URL trial previously gave no improvement. Do not generalize minimal-widget success to the full widget.
The 100-layer step-ring replacement preserved appearance but gave no perceived speed improvement.

## Public primary sources checked on 2026-10-05
1. Apple, Making network requests in a widget extension:
https://developer.apple.com/documentation/widgetkit/making-network-requests-in-a-widget-extension
Search-accessible Apple text states inline/background requests are possible during extension activity; recommends background requests, onBackgroundURLSessionEvents, storing completion handlers, and WidgetCenter timeline reload after download completion. This is an API for the APP AUTHOR, not a facility we can assume a Widgy JSON can invoke.
2. Apple, Keeping a widget up to date:
https://developer.apple.com/documentation/widgetkit/keeping-a-widget-up-to-date
Regular widget refresh is system-managed; do not promise continuously running map code or a guaranteed one/five-minute cadence. Canonical web page requested JS; Markdown-link retrieval failed this turn. Re-read the full primary text before deriving precise limits.
3. Widgy developer duke4e FAQ:
https://www.reddit.com/r/widgy/comments/v3jslo/widgywatchy_faq_and_feature_requests_megathread/
Historical developer FAQ separates data fetching (~15min) from minute display changes and mentions Reload Widget tap. It also discusses image/symbol memory limits. This is historical, not a guaranteed exact schedule for27.0.1.
4. Official Widgy App Store release history:
https://apps.apple.com/us/app/widgy-widgets-home-lock-watch/id1524540481
27.0.1 describes fixes for Async JavaScript completing twice/late/interrupting queued work.27 mentions per-slot refresh, variables, live animation/solar automation and improved image memory. Earlier4.1 describes a leaner JS engine supporting fewer functions;4.20 added btoa/atob. Do not assume browser DOM/canvas/service-worker/setInterval support from browser JavaScript examples. No documented arbitrary PNG download/decode background handoff API for JSON was found yet. Absence of documentation is not proof of impossibility.
5. Apple ImageIO WebP documentation:
https://developer.apple.com/documentation/imageio/webp-data
ImageIO WebP metadata exists, but this does not establish Widgy's web-image provider accepts WebP or preserves all approved pixels.

## Next research and implementation decisions
A. Finish actual Widgy capability investigation: can an image be refreshed independently of navigation, retaining last-good pixels, with new image committed only after load? Look for developer documentation or verified exported schema. Do not invent cache-field meanings or propose WebView service workers in a native widget.
B. Candidate architecture: immutable map terrain/night textures, minimal time-dependent mask/lighting and small native marker/city label. Measure real encoded size, exact composite pixel parity and number of decoded full-size surfaces first. Extra layers can INCREASE memory; splitting alone is no guarantee. A static noon/night approximation is unacceptable.
C. Candidate architecture: pre-render future non-personal world frames and serve ready assets, decoupled from private GPS marker. This can remove cold rendering but still requires image download/decode and a supported client update path. Do not enable public caching of private location data.
D. Candidate architecture: last-good local image + background downloader + atomic update. Technically supported when controlling a native WidgetKit app; not verified accessible through Widgy. Shortcuts/file workflow and cadence need feasibility validation; do not sell it as automatic real-time.
E. Benchmark only an evidence-backed change not already rejected. Use fixed synthetic dates and synthetic locations, precise decoded-RGBA equality, cold/warm stages, image byte sizes and load semantics. Existing remote benchmarks include execution-environment proxy/ingress and are not phone transition timings.
F. If Widgy does not expose necessary lifecycle control, explain the actual boundary and options honestly; a custom WidgetKit app still has OS refresh limits, and a live web/app view is not an equivalent Home Screen widget.

No architecture or runtime changes were made during the deeper investigation. No new live-refresh solution is verified. Do not ask the owner for repeated imports before the next useful candidate is grounded in measurements.
