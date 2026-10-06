# Whole-widget delivery decision: maps, calendar, weather and fitness

Date: 2026-10-06. Branch: f50-widget-test. Baseline: 0e60aab9b76cd77ef0db26415490eb32f8b39d3b.

## Current user requirement

At 07:21–07:28 Asia/Jerusalem the owner requests the most effective solution, allowing a small recurring payment if it improves speed. Weather, fitness and future tabs must be included in the design. The earlier acceptance of occasional refresh delay remains; repeated ordinary tab transitions should be fast. Preserve the approved full 3306×1558 lossless PNG appearance and precise location. Willingness to consider a small payment is not a choice of vendor, plan or a new subscription.

## Decision

Design shared data sources and completed snapshots for the whole widget, while keeping device-native inputs on the device. Continue on the current Vercel baseline until a candidate has a measurable advantage. A small continuously running Node service is a reasonable hosting comparison candidate; merely buying a paid plan is not a verified fix. Railway Hobby is the first low-cost candidate to size, not a selected or provisioned service.

There are two independent gates: faster delivery on the server, and Widgy showing completed data without stalling navigation or restoring old images. The second gate cannot be purchased from a hosting provider. A server-ready image still needs transfer, decoding and native presentation. The previous split-layer prototype saved bytes but failed an appearance gate; it remains offline, not deployed.

## Current sources verified from a freshly generated synthetic normal export

`node tools/audit-widget-data-sources.mjs` generates `widget-data-sources-2026-10-06.json`. It uses only the public template and inert example.test calendar URLs. It follows native variable identifiers as well as text interpolation; definitions are not measurements of runtime requests.

| Area | Present source | What the design should share | What a new server can affect |
| --- | --- | --- | --- |
| Map | Our PNG endpoint plus native location and URL script | Static imagery, solar state and location result where native behavior permits | Rendering, ready-image reuse and transfer; not native image lifecycle |
| Calendar | Our calendar-widget endpoint, Google/iCloud providers, plus native reminders | One coherent event snapshot for Home and Calendar, correctly expiring at event boundaries | Provider reuse and response time; device field-request coalescing remains unmeasured |
| Weather | Widgy Weather (Now), Sun And Moon | Current conditions shared by Home and future Weather tab | Current native providers do not use our server; replacing them needs a separately validated API and freshness policy |
| Fitness | Pedometer Steps/Distance, Health (Daily) Active Energy Burned | Native values shared by Home and future Fitness tab | No direct benefit from moving the existing map API; keep these native sources |
| Navigation/clock | Widgy visibility actions and Date And Time | Existing approved clock and ordinary visibility-only navigation | Hosting cannot control native redraw scheduling |

Home already uses weather and fitness data. WEATHER and FITNESS are currently 24-node navigation shells with placeholder content, not finished data-heavy tabs. The normal export defines 39 calendar JSON field bindings to one literal endpoint and 25 month-image sources; neither number proves that many network requests per tap. Previous native-source removal and graphics reduction trials did not establish these providers as the sole cause. Do not delete functional sources or repeat those imports without new evidence.

## New local resource measurement

`node tools/benchmark-map-service-resources.mjs` executes the real current PNG route in a fresh local Node process, with four synthetic coordinates and two cache hits. No HTTP, personal GPS, calendar or health data is involved. The output is `map-service-resources-2026-10-06.json`.

- First render: 743.823 ms; subsequent fresh-location renders: 428.498–472.289 ms.
- Ready-image cache hits: 0.189–0.268 ms, with identical PNG hashes and render timestamps.
- Full PNGs: 4.239–4.244 MB; exact 3306×1558 dimensions; private/CDN-no-store retained.
- Process RSS reached 373.23 MiB in this short sequential run. This is neither Widgy memory nor a hosted billing measurement. It does not establish a leak or a sustained upper bound. A 512 MB combined-service deployment has not been validated; future calendar/weather work and concurrency need headroom.
- Import duration was 49.464 ms in this environment, not a measured cloud cold start.

These results reaffirm that ready-image reuse is already fast inside the handler. They do not justify promising subsecond navigation. The earlier actual phone-browser run took 977 ms total on a ready map even though server work was 0.2 ms; it included about 4 MB of image transfer. The prior full-widget CDN trial did not yield an additional perceived improvement. Preserve both pieces of contrary evidence.

## Hosting options and price limits checked today

| Option | Published starting price | Relevant capability | Decision |
| --- | --- | --- | --- |
| Current Vercel architecture | Public Hobby price $0; actual team plan was not returned | Existing working deployment and CDN | Keep as comparison baseline |
| Railway Hobby | $5/month minimum, includes $5 resource usage; excess billed | A persistent Node process with optional sleeping disabled can retain warm assets and host scheduled work | Candidate for an isolated comparison; no subscription created |
| Vercel Pro | $20/month base, includes usage credit; possible additional usage | Fluid function CPU setting can rise from standard 1 vCPU/2 GB to 2 vCPU/4 GB | Not justified as an automatic speed fix; upgrading alone does not select faster CPU |

Railway's published service rates are $0.00000386 per GB-second of memory, $0.00000772 per vCPU-second, and $0.05/GB egress. As an illustrative 30-day scenario, 0.5–1 GB average memory, one 4.24 MB transfer and 0.55 CPU-second every five minutes gives roughly $6.9–11.9 before taxes and other services. This is not a quote or observed usage; GPS changes, repeated native downloads and different update frequencies change the bill. Five minutes is only a cost-model assumption, not an enabled or guaranteed update schedule. Sleeping must be disabled for a continuously running comparison; a restart can still lose in-memory caches.

Vercel connector inspection confirmed the deployed baseline branch/commit and Frankfurt region. Its returned project/deployment summaries did not expose the actual Fluid setting, CPU allocation or team plan. An argument error on a broader metadata request does not establish that a paid upgrade is required. No account setting was changed.

Official references checked 2026-10-06:
- https://railway.com/pricing
- https://docs.railway.com/pricing/plans
- https://docs.railway.com/deployments/serverless
- https://vercel.com/pricing
- https://vercel.com/docs/functions/configuring-functions/memory

## Concrete engineering boundaries for the next candidate

1. Keep navigation consuming completed data where the native provider supports that behavior. Independent downloads, atomic image replacement, last-good retention and masking are requirements to verify, not invented Widgy JSON features. A last-good value must have an explicit age/failure policy, not freeze indefinitely.
2. Investigate a real fixed-terrain/fixed-lights/dynamic-mask composition using proven Widgy schema before another layered-image import. The previous replacement-pixel overlay is not a demonstrated mask API. Require matching appearance after native scaling and assess native memory.
3. Preserve calendar request sharing and event-boundary expiry. Any future persistent cache must retain credential isolation and source-failure behavior. Do not put personal calendar responses or GPS maps in a public CDN.
4. Reuse existing native Weather/Pedometer/Health definitions as later tabs are built. A custom weather backend is optional and has not been selected; it needs an appropriate provider contract and location/timezone handling. Fitness is not to be uploaded to a hosting service for this optimization.
5. A hosted comparison should use identical public synthetic PNG cases and renderer bytes on both hosts, then the same minimal native widget. Require improvement in actual fresh-map waits with fast repeated returns and advancing, non-regressing image time. Do not accept server-only timing as a phone result.

No new import is requested by this report. Map Five Minute 1 remains available but unverified, and is not the whole-widget architecture or an idle detector. This commit adds research tools, results and direction only; no deployed renderer, widget export, subscription, API credentials or provider settings are modified. A final no-delay solution is not yet verified.
