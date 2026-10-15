# Google Cloud Run map trial

Target: **BlueSky684/widgy-maps-world-glass, f50-widget-test only**.
This adds a separate map and city service. Calendar's city-label request moves
with the map; calendar events, Weather and Health keep their current endpoints.
The trial was deployed on 2026-10-15. Health and a full-resolution synthetic map
have passed hosted checks; see `verification-hosted-20261015.json`. The installed
widget and live city-provider cutover remain pending.

## Runtime and trial configuration

- Region `me-west1` (Tel Aviv); Node 24 Linux container, existing locked packages.
- Request-based billing, minimum 0 instances, maximum 2, 1 vCPU and 1 GiB each,
  concurrency 2, 30-second request timeout. The maximum instance setting is
  capacity control, not a hard monetary cap. Cold starts remain a phone test.
- Exactly the existing PNG renderer, approved masters, fonts, projection,
  dynamic GPS/English city and server-time day/night mask. Width stays 3306.
- No new image URL variant, image resize, WebP conversion, static snapshot or
  permanent city substitution. Default map cache still expires after 60 seconds.
- Every image request requires the existing `location_key`. Only `/health`
  is public without that key. Public HTTP invocation is required because Widgy
  cannot supply Google IAM identity tokens; application authorization remains.
- City names still come from the existing BigDataCloud account. Image creation,
  city-result storage, quota counters and secrets are managed in Google Cloud.
- The Cloud Run service uses Firestore Native Standard in `me-west1`, with its
  attached service account and short-lived Google identity. There are **no
  Upstash credentials or Upstash requests in the Cloud Run execution path**.
- Private city cache documents use hashed IDs in `widgyCityCache`, one-hour
  freshness and six-hour application retention. An `expiresAt` TTL policy
  removes old documents asynchronously (physical deletion can lag). No TTL
  applies to `widgyControl/bdc-budget-v1`, the durable usage ledger.
- The 40,000-call rolling-window ceiling and 10/minute rule are preserved by
  conditional Firestore writes. Missing/corrupt state fails closed; it never
  silently creates a fresh allowance. Ambiguous writes are not refunded.
- Shared Vercel modules remain installed because the existing default route
  still uses them; this adapter injects Google storage and its quota function.

Request-billed CPU may stop when a response ends. The adapter therefore waits
for the already-bounded city/cache task before ending the HTTP response. It
preserves the existing 1500ms city decision and coordinate-only image fallback.
A slow lookup can add response latency; it is not disguised as a successful
city result. Normally the task completes while the PNG is being rendered.

## Verified locally

Run `node --experimental-vm-modules tools/test-cloud-run-map.mjs` from the repo.
The oracle is the deployed route at commit
`6fcfc958a62fafdf7fdfac937b7db0feaadaa5d3`, with synthetic coordinates/provider.
Two full-resolution PNGs are byte-identical to that oracle, including ICC data.
Live cache reuse, HEAD, 304, authorization, provider-outage fallback, private
cache TTL and city-task completion before response end are covered using real
local Node HTTP connections. No live provider calls are made by these tests.

See `verification-firestore-20261014.json` for the current adapter and
`verification-20261014.json` for the initial Cloud Run preparation. The recorded peak belongs to the whole
test process, including the baseline oracle; it is not a Cloud Run measurement.
Cloud Build and hosted PNG delivery subsequently passed the checks recorded in
`verification-hosted-20261015.json`. Native Widgy still requires validation.

The older `test-map-city-resilience-15.mjs` also passed its route/image and
authorization checks, then failed an existing client-only assertion at line
110: it expects a missing timer API to block fetch, while the current native
client explicitly permits it. Both that test and the client are identical to
the baseline commit; this is recorded separately from the passing Cloud Run
suite and is not a hosting regression.

## Prepare a secret-free build context

From the repository on `f50-widget-test`:

```sh
node tools/prepare-cloud-run-map.mjs /tmp/widgy-map-cloud-build
```

The output directory must be empty and outside the checkout. Only the renderer/server import closure, approved assets, package files,
Dockerfile and build metadata are copied. No widget
JSON, private exports, environment files, diagnostic images or unrelated APIs
are uploaded. `source-manifest.json` records every copied source and Dockerfile
hash. Deployment rejects extra files, links, altered inputs and uncommitted
deployment sources. The
precomputed raster cache is rebuilt inside the container from approved assets.

## Google account handoff

Use a dedicated Google Cloud project for this trial. Confirm its Project ID,
billing/trial eligibility and the intended short trial before executing setup.
No Google credentials or private API keys should be pasted into chat or Git.
Google Cloud Shell can perform deployment without installing another phone app.

Only these two Google Secret Manager secrets are required at runtime:

| Secret Manager name | Runtime environment variable / existing source |
| --- | --- |
| `widgy-location-access-token` | `WIDGY_LOCATION_ACCESS_TOKEN` |
| `widgy-bigdatacloud-api-key` | `BIGDATACLOUD_API_KEY` |

The runtime identity is `widgy-map-runtime@PROJECT_ID.iam.gserviceaccount.com`.
Give it Secret Accessor only on those two secrets. The build identity is
`widgy-map-builder@PROJECT_ID.iam.gserviceaccount.com` with `roles/run.builder`;
it must not receive access to runtime secrets. Enable Cloud Run, Cloud Build,
Artifact Registry, IAM, Secret Manager, Firestore and Cloud Logging APIs in that project.

### Firestore setup and counter handoff

Run the reviewed storage setup in the existing authenticated Cloud Shell. It
prints a plan unless `--execute` is present:

```sh
node tools/setup-cloud-run-firestore.mjs PROJECT_ID --execute
```

It enables Firestore, creates `(default)` only if absent (Standard/Native,
Tel Aviv, deletion protection), grants the runtime identity data access scoped
by an IAM condition to that database, and configures cache TTL and selected
index exemptions. It refuses an existing database with a different region or
mode. It does not transfer or initialize usage counters. IAM changes can need
several minutes to propagate. TTL operations are asynchronous. Operations,
storage and TTL deletions are metered; this is not a zero-cost guarantee.

Before the counter handoff, verify the deployed service's own Firestore read:

```sh
node tools/check-cloud-run-storage.mjs PROJECT_ID --execute
```

This operator-only check privately reads the existing Google secret versions,
creates one short-lived synthetic open-ocean city entry with a create-only
precondition, and requires the deployed city endpoint to return `SHARED`. It
deletes that same entry in a `finally` block with an update-time precondition.
The ledger must be absent before and after the check; it is never initialized,
so no provider request can be reserved during this pre-handoff test. The tool
prints only sanitized status and deployment metadata. An execution failure
must be resolved before handoff.

**Do not copy an empty ledger or reset the existing Upstash ledger.** After the
Google endpoint and its identity/storage access are verified, transfer the
existing ledger once:

```sh
node tools/migrate-cloud-run-budget.mjs PROJECT_ID --execute
```

The operator enters the current Upstash URL and read/write token into hidden
terminal prompts, once, to access the existing counters. They are never put in
shell history, Google secrets, Git, output, or the Cloud Run container. No
secret is retrieved through a write-only Vercel environment-variable workaround.

The transfer atomically fences the old Redis ledger and saves an immutable
snapshot, then creates a pending Google ledger **only if absent**. It records source
acknowledgment before activating Google; a deleted previously activated ledger
is treated as data loss and cannot be recreated from the old snapshot. Already-reserved
in-flight requests are included. Retries resume the same handoff without
resetting counters; an interruption may intentionally pause new city lookups
on both backends until the same command is rerun. Missing/corrupt source state
is not treated as zero usage.

**Cutover effect:** old Vercel deployments, including older still-running
instances, can no longer reserve fresh BigDataCloud calls after handoff. Their
cached city results may still work; otherwise the existing coordinate-only
fallback applies. The renderer still returns its map. This is an exclusive
counter handoff, not an independent second quota. Transfer only when ready to
switch the installed test widget to Google.

A rollback must return the *updated* counters before using Vercel for new city
lookups:

```sh
node tools/migrate-cloud-run-budget.mjs PROJECT_ID --return-to-upstash
```

It first fences Google using a conditional write, then returns all counters to
the old ledger. Repeating rollback cannot overwrite subsequent usage. Do not
manually flip `_initialized`, delete the Google ledger or re-import the first
snapshot. A second forward cutover after rollback requires a reviewed new
migration; the tool deliberately refuses to overwrite a returned Google ledger.

### Request-log privacy

The existing widget puts GPS and its access key in the query string. Cloud Run
generates request logs independently of the sanitized application logs. Before
the first real widget request, exclude the following from the dedicated
project's `_Default` logging sink:

```text
resource.type="cloud_run_revision"
AND resource.labels.service_name="widgy-map-test"
AND log_id("run.googleapis.com/requests")
```

Retain sanitized stdout/stderr and built-in metrics. Check for any additional
or inherited sinks: a `_Default` exclusion does not suppress those destinations.
Application logs contain opaque request IDs, timing, status, sizes and cache
states, never the raw URL or GPS/city/token. Cloud Run request IDs also appear
in `X-Map-Request-ID` for correlation. This is an application-generated ID.

## Reviewed deployment command

After project, secret versions, identities and logging are configured, the
command is available from `deploy.mjs`. By default it prints a **plan only**:

```sh
node services/map-server/deploy.mjs PROJECT_ID /tmp/widgy-map-cloud-build
```

The same command with `--execute` performs the reviewed cloud build/deployment.
It requires an authenticated `gcloud` session in the user's project. It checks
the current branch, reads the intended project, requires the two secret
versions and identities, and checks the logging exclusion before deployment.
It does not create a billing account, project or secrets, or change Vercel.

The accompanying `cloud-run.yaml` documents the equivalent runtime template.
The deployment command also sets a service-level maximum of two instances.

## Before changing the phone

1. Build and deploy the container; record the deployed source commit and image
   digest. Check `/health`, the secret-free application logs, and error metrics.
   Cloud Run [reserves some URL paths ending in `z`](https://docs.cloud.google.com/run/docs/known-issues#reserved_url_paths),
   so the public health endpoint deliberately avoids that suffix.
2. Compare hosted fixed-time synthetic requests to the local PNG oracle, decode
   completely and check 3306x1558 and ICC metadata. Check valid-token 200, bad-
   token 403, live cache, ETag/304 and actual response completion.
3. Verify Firestore identity/access and cache expiration with synthetic data.
   Perform the exclusive counter handoff, then validate real city lookup/cache
   and the retained provider budget without logging the private request URL.
4. In the installed **Map Home Test** copy, change the origin of `map_request`
   (`/api/night-map`) and `calendar_location_pair` (`/api/fetch-probe?location_shared=1`)
   to the same Google service. Both use the same Google city cache and ledger.
   Keep query parameters, native Memory Used label, other endpoints and layers unchanged. The latest phone export is blocked,
   so do not overwrite its manually added debug label from an older export.
5. Test Calendar/Home navigation, first return after idle and normal day/night
   updates. Record missing-image times and compute/network usage during 72h.
   This document does not schedule an unattended test or promise monitoring.

A cheap trial is useful only if that same economical configuration is stable.
If it fails only after idle, assess the measured cold-start latency before
paying for a warm instance. Request success never proves native image display.
Rollback requires the counter-return command above and restoring the previous
map and calendar-city origins; the Vercel service remains.
Stopping this trial later requires deleting its Cloud Run service; retained
container images/build artifacts/secrets can still have small storage charges.

## Official references checked 2026-10-14

- https://docs.cloud.google.com/run/docs/deploying-source-code
- https://docs.cloud.google.com/run/docs/configuring/billing-settings
- https://docs.cloud.google.com/run/docs/configuring/min-instances
- https://docs.cloud.google.com/run/docs/container-contract
- https://cloud.google.com/run/pricing
- https://docs.cloud.google.com/sdk/gcloud/reference/run/deploy
- https://docs.cloud.google.com/sdk/gcloud/reference/logging/sinks/update

## Firestore adaptation validation

`node tools/test-cloud-run-firestore.mjs` covers competing reservations at the
quota boundary, minute throttling, rolling expiry, ambiguous writes, Google
REST identity/precondition handling, interrupted migration and rollback.
`python tools/test-cloud-run-budget-migration-lua.py` (requires `lupa`) executes
the actual handoff/return scripts alongside the unchanged old reservation Lua.
These use synthetic fixtures; live Google IAM, the hosted Firestore API and
Cloud Build remain deployment gates, not claimed local test results.

### City-provider constraint

Google Geocoding is not a compatible replacement for the city label on the
existing custom map: its non-EEA service terms section 6.2 prohibit combining
its results with a non-Google map. Hosting the custom map on Google Cloud does
not turn it into a Google Map. BigDataCloud is retained intentionally.

- https://docs.cloud.google.com/firestore/docs/reference/rest/v1/projects.databases.documents/patch
- https://docs.cloud.google.com/firestore/docs/reference/rest/v1/Precondition
- https://docs.cloud.google.com/firestore/native/docs/manage-databases
- https://docs.cloud.google.com/firestore/native/docs/security/iam
- https://docs.cloud.google.com/sdk/gcloud/reference/firestore/databases/create
- https://docs.cloud.google.com/sdk/gcloud/reference/firestore/fields/ttls/update
- https://cloud.google.com/maps-platform/terms/maps-service-terms
