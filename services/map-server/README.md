# Google Cloud Run map trial

Target: **BlueSky684/widgy-maps-world-glass, f50-widget-test only**.
This adds a separate map-only service; Calendar, Weather and Health keep their
current endpoints. No Cloud Run resource has been created by this preparation.

## Runtime and trial configuration

- Region `me-west1` (Tel Aviv); Node 24 Linux container, existing locked packages.
- Request-based billing, minimum 0 instances, maximum 2, 1 vCPU and 1 GiB each,
  concurrency 2, 30-second request timeout. The maximum instance setting is
  capacity control, not a hard monetary cap. Cold starts remain a phone test.
- Exactly the existing PNG renderer, approved masters, fonts, projection,
  dynamic GPS/English city and server-time day/night mask. Width stays 3306.
- No new image URL variant, image resize, WebP conversion, static snapshot or
  permanent city substitution. Default map cache still expires after 60 seconds.
- Every image request requires the existing `location_key`. Only `/healthz`
  is public without that key. Public HTTP invocation is required because Widgy
  cannot supply Google IAM identity tokens; application authorization remains.
- City lookup uses the existing BigDataCloud account and **existing Upstash
  budget ledger**. Never initialize/reset that ledger for this trial.
- The portable city cache uses private Upstash keys prefixed
  `widgy:map:cloud-run:city:v1:` with hashed identifiers, one-hour freshness and
  six-hour retention. No Vercel Runtime Cache or `waitUntil` is called by this
  service. The packages remain installed because the shared default route uses
  them when deployed on Vercel.

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

See `verification-20261014.json`. The 406 MiB observed peak belongs to the whole
test process, including the baseline oracle; it is not a Cloud Run measurement.
Docker/Cloud Build, the hosted endpoint and native Widgy still require validation.

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

The output directory must be empty and outside the checkout. Only 28 necessary
source/package/asset files are copied, plus the Dockerfile and build metadata. No widget
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

The following four Google Secret Manager secrets must hold the existing values:

| Secret Manager name | Runtime environment variable / existing source |
| --- | --- |
| `widgy-location-access-token` | `WIDGY_LOCATION_ACCESS_TOKEN` |
| `widgy-bigdatacloud-api-key` | `BIGDATACLOUD_API_KEY` |
| `widgy-upstash-rest-url` | `UPSTASH_REDIS_REST_URL` (or existing `KV_REST_API_URL`) |
| `widgy-upstash-rest-token` | `UPSTASH_REDIS_REST_TOKEN` (or existing `KV_REST_API_TOKEN`) |

The runtime identity is `widgy-map-runtime@PROJECT_ID.iam.gserviceaccount.com`.
Give it Secret Accessor only on those four secrets. The build identity is
`widgy-map-builder@PROJECT_ID.iam.gserviceaccount.com` with `roles/run.builder`;
it must not receive access to runtime secrets. Enable Cloud Run, Cloud Build,
Artifact Registry, IAM, Secret Manager and Cloud Logging APIs in that project.

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
the current branch, reads the intended project, requires the four secret
versions and identities, and checks the logging exclusion before deployment.
It does not create a billing account, project or secrets, or change Vercel.

The accompanying `cloud-run.yaml` documents the equivalent runtime template.
The deployment command also sets a service-level maximum of two instances.

## Before changing the phone

1. Build and deploy the container; record the deployed source commit and image
   digest. Check `/healthz`, the secret-free application logs, and error metrics.
2. Compare hosted fixed-time synthetic requests to the local PNG oracle, decode
   completely and check 3306x1558 and ICC metadata. Check valid-token 200, bad-
   token 403, live cache, ETag/304 and actual response completion.
3. Validate real city lookup/cache and the unchanged provider budget using the
   private token, without logging or publishing the request URL.
4. In the installed **Map Home Test** copy, change only the origin of the
   `/api/night-map` URL. Keep every query parameter, native Memory Used label,
   other tab endpoint and layer unchanged. The latest phone export is blocked,
   so do not overwrite its manually added debug label from an older export.
5. Test Calendar/Home navigation, first return after idle and normal day/night
   updates. Record missing-image times and compute/network usage during 72h.
   This document does not schedule an unattended test or promise monitoring.

A cheap trial is useful only if that same economical configuration is stable.
If it fails only after idle, assess the measured cold-start latency before
paying for a warm instance. Request success never proves native image display.
Rollback is restoring the previous map origin; the Vercel service remains.
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
