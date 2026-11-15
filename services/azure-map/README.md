# Azure Home Glass trial — deployment paused

The user selected Microsoft Azure on 2026-11-15. This adds an isolated Node 24
HTTP adapter for Azure Container Apps. It does not replace the Vercel handler,
change the phone, create a cloud resource, enable billing, or prove a fix.

Baseline: `cf2a4cef2744726cb598be0e2cdd63a05dbfed6f`, the Vercel revision inspected
before this trial. The renderer, authentication, PNG metadata, transfer UUID,
60-second render reuse and 1500ms city decision are reused without modification.
The literal protocol identifier `vercel-file-v1` is retained intentionally.

## Runtime

- Expose only `GET/HEAD /health` and authenticated `GET/HEAD /api/night-map`.
- Native 2400×1131 PNG attachment only; ordinary map/image variants are rejected.
- Use the same BigDataCloud account and **existing** Upstash quota ledger.
  Never initialize, reset, migrate, unfence or bypass that ledger during setup.
- Credentials are injected at runtime as Container Apps secret references.
  The container image and repository contain no production credentials.
- Keep the existing location provider reservation-before-request behavior.
  A quota/provider failure falls back to a map without a city label.
- Vercel Runtime Cache is not available here. City caching is process-local,
  including the existing bounded cache and same-coordinate request deduplication.
  This is an explicit comparison limitation: a new replica can make another
  quota-counted geocoder call. Do not describe this as an identical cache setup.
- Optional pending city work does not hold the PNG response open. It is best
  effort across replica termination. Shutdown attempts to drain pending work;
  it cannot guarantee completion after a forced host termination.
- Adapter logs exclude URLs, query strings, headers, credentials, coordinates,
  city names and raw exception text. Existing native response logs retain hashed
  transfer correlation. Cloud access/ingress logs need a separate privacy review.
- Admission is limited to two concurrent handlers per process. Overflow returns
  503 without another city lookup. This is for a single-user trial, not HA.

## Local verification

```sh
npm ci --omit=dev --no-audit --no-fund
node tools/build-map-cache.mjs
node tools/test-azure-map.mjs
node tools/test-native-map-file.mjs
node tools/test-location-budget.mjs
node tools/test-map-response-completion.mjs
```

`test-azure-map.mjs` uses real localhost HTTP with synthetic credentials and
coordinates. It compares full PNG bytes against the unchanged production
handler at fixed day/night instants, decodes the result, checks the native
transfer marker and tests invalid requests, unavailable city/quota, bounded
concurrency, complete HTTP responses, and sanitized logs. It makes no external
geocoder, quota-store, Azure or iPhone requests.

Build from the repository root:

```sh
docker build --platform linux/amd64 -f services/azure-map/Dockerfile -t homeglass-azure-trial .
```

The Dockerfile-specific allowlist excludes git metadata, `.env`, local files,
phone bundles and unrelated application assets. Approved map assets are
validated/precomputed during the build. The server runs as the `node` user.
The image was built and tested on a standard GitHub-hosted Linux runner on
2026-11-15. Workflow `azure-trial-image-check.yml` uses read-only repository
permissions and no cloud credentials. It starts the real image with 1 vCPU,
2 GiB, a read-only filesystem, non-root user and external networking disabled.
The smoke test verified health, access rejection, complete PNG decoding,
2400x1131 dimensions, color profile and the native transfer marker. The image
was 392,651,350 bytes and the test PNG 2,835,207 bytes. Run:
https://github.com/BlueSky684/widgy-maps-world-glass/actions/runs/43750626856

This CI run does not publish an image or deploy Azure resources. Hosted health
and PNG checks with the real runtime configuration remain required. ACR Tasks
currently pauses builds using free credits; a future deployment needs a
separately reviewed image-transfer path rather than assuming `az acr build` works.

## Proposed Azure setup, not deployed

`trial-plan.json` is a reviewable plan, **not** an ARM deployment template.
Start with Consumption, 1 vCPU, 2 GiB RAM, minimum zero replicas, maximum one,
one active revision, HTTPS ingress to port 8080 and `/health` probes.

Select an available region after inspecting the owner's subscription, then
compare measured phone/server timings. Do not assume the nearest region is
automatically best. Use a private image registry and retained sanitized app
logs; review registry and log costs before creating them. Avoid an automatic
quickstart that silently creates a registry or logging workspace.

Deployment is paused while the hosting choice is reassessed. No Container App,
registry or logging workspace has been deployed, and no runtime credentials
have been transferred. Account-specific findings are kept out of this public
repository. Verify account eligibility, current quotas and costs before any
future deployment. Cloud credentials must never enter CI or the container image.

When connecting the existing quota ledger, its Vercel aliases `KV_REST_API_URL`
and `KV_REST_API_TOKEN` map to the adapter's `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN`. Use the existing store, not a newly initialized one.

## Cost boundaries checked against Microsoft documentation, 2026-11-15

The Consumption monthly grant per subscription is 180,000 vCPU-seconds,
360,000 GiB-seconds and 2 million requests. At 1 vCPU + 2 GiB, the two compute
grants both correspond to **50 allocated hours**, not 50 hours of CPU work.
Other apps in the subscription can consume the same grants.

At one map per 15 minutes, 30 days is 2,880 requests, excluding retries. An
illustrative 2.7 MB response gives about 7.8 GB outbound data. Microsoft lists
the first 100 GB/month of Internet egress free, subject to account/service terms.
These calculations do **not** establish a zero total bill.

Startup and time before scale-to-zero matter. With minimum zero, replicas above
the minimum are charged at the active rate. If each request keeps a replica
alive for 300 seconds, that alone is 864,000 vCPU-seconds and 1,728,000 GiB-seconds
per month, above the grants. For 2,880 calls the equal-share compute allowance
is 62.5 seconds of replica lifetime per call. HTTP scaling behavior and actual
billable lifetime must be measured; do not assume a cooldown change works until
validated on the deployed service. A two-second handler is not a two-second bill.

An eligible new Azure free account includes $200 trial credit for up to 30 days.
Microsoft says charges require an explicit move to pay-as-you-go; continued use
after the trial needs that move. Identity/card verification may be required.
Do not assume eligibility or activate pay-as-you-go from provider selection alone.
Monthly grant limits are not a spending cap. Budgets notify; they are not a hard
stop. Registry, builds, logs and optional infrastructure have separate terms.

Official references:
- https://learn.microsoft.com/azure/container-apps/billing
- https://learn.microsoft.com/en-us/azure/container-apps/scale-app
- https://learn.microsoft.com/en-us/azure/container-apps/containers
- https://learn.microsoft.com/en-us/azure/container-apps/log-options
- https://azure.microsoft.com/en-us/pricing/details/bandwidth/
- https://azure.microsoft.com/en-us/free/

## Phone trial still required

Home Glass 0.9.0 pins the old origin in both URL construction (`bridge.ts`) and
save-command validation (`nativeTransfer.ts`). Its Shortcut must also be reviewed.
Do not replace a URL ad hoc or weaken origin validation. Once Azure has a verified
endpoint, prepare a separate trial build with that exact HTTPS origin and a
dedicated trial key. The production build/automation remains the rollback path.

Compare open and locked/Sleep runs with the same 2400px incoming-folder flow.
Record scheduled/request time, caller-declared condition, hashed transfer
correlation, handler start/finish, downloaded bytes and verified publication.
Check widget display separately. Correlate every slow phone run to retained
server logs; no matching log is not proof a request was never delivered.
Do not infer reliability from one successful run or from server HTTP 200 alone.
Host migration cannot directly fix a stall inside local pre-download validation.
