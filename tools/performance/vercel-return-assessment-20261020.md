# Vercel return assessment — 2026-10-20

Status: local compatibility and authenticated hosted PNG checks passed.
Four actual full-resolution PNG transfers and full decodes succeeded in Preview.
This is not a phone-network reliability result or authorization to migrate.
User-approved temporary Preview access was created; no phone configuration,
project-wide protection setting, quota ledger, production route or hosting
subscription was changed.

## Current deployment and access

The connected project is `widgy-maps-world-glass`, branch `f50-widget-test`.
Preview deployment `dpl_EgoeCF73wdifJxYBYjcPaPZ2CQwY` is READY at commit
`658f9170e04f05ef890af7467f12ce4d9b7fd911`. The preceding server-adapter change
does not run in the normal Vercel route; it is still not deployed to Cloud Run.

One unauthenticated synthetic base-map request followed a login redirect and
returned HTML, not a PNG. Its timing is not a map performance measurement.
The authorized connector can read project, deployment and environment metadata.
No authenticated Vercel CLI is available in this workspace.

The initial connector operation to obtain a Preview access link was rejected by the
automatic approval review: the operation can create a bearer link granting
access without login for up to 23 hours, which was not explicitly authorized.
No link was obtained at that stage and no alternative bypass was attempted.
After explicit user approval at 15:19 Israel time, the connector created a new
link expiring 2026-10-21 at 11:20:12 UTC, within the approved 23 hours.
The link was used only for the pinned Preview. The temporary credential file
was removed and cookies remained in memory only. No link or cookie is included
in this repository, widget or report. Project-wide protection remains enabled.

A 30-minute query for `night_map_response_v1` in the current Preview returned
no matching logs. The earlier 1-hour request was rejected as outside retention.
Neither result proves image delivery or a runtime failure. The API error
identified the account as Hobby for runtime-log retention.

## Authenticated hosted verification

The existing deployment was tested without renderer, response transport or
image-quality changes. All requests used synthetic coordinates (0,0), the
label `Sample City`, explicit fixed UTC dates and the original PNG format.
No city-provider or quota reservation was invoked. The initial deployment-root
404 set the access cookie; the four subsequent map requests returned PNG200.

| Sample UTC instant | Body bytes | Server render ms | Full client download ms |
| --- | ---: | ---: | ---: |
| 2026-10-20 12:00 | 4,081,284 | 1,411.3 | 8,869.6 |
| 2026-12-21 00:00 | 4,531,629 | 724.5 | 7,471.1 |
| Same winter instant, repeat | 4,531,629 | 700.9 | 7,174.7 |
| 2026-10-20 01:00 | 4,499,648 | 691.8 | 7,074.9 |

Every Content-Length matched the received body. Every image fully decoded at
3306x1558. The repeated winter image was byte-identical (SHA256). Response
headers reported `BYPASS` for the renderer cache, so these were actual rendering
requests, not cached-PNG hits. All reported precomputed atlas assets `HIT`.
Correlated runtime logs show all four requests prepared and finished successfully;
all four used one instance, whose first observed request took longer to render.

The 4,531,629-byte image succeeded through the existing `res.send` handler.
There is no demonstrated payload-limit failure requiring a transport rewrite
for these samples. This does not establish the limit for every possible map.
The largest local sample was 15 bytes smaller than its hosted counterpart;
the hosted image itself, not just the local estimate, was fully validated.

Client timings include this workspace's network route, TLS and protected Preview
access. They are not measurements on the user's iPhone or Israeli cellular
network, and cannot establish that Vercel is faster than the current Cloud Run
path. The same-case Cloud Run comparison has not been run. The server timings
show only map rendering. Results and hashes are in
`vercel-hosted-map-20261020.json` without credentials or authenticated URLs.

## Full-resolution payload survey

Run `node tools/check-vercel-map-payload.mjs` to reproduce the local survey.
`vercel-map-payload-20261020.json` contains all 32 samples, sizes and hashes:
24 hourly instants on October 20 plus four instants on each solstice date.
All use synthetic coordinates and the same `Sample City` label. There are no
real provider calls or quota mutations.

- Every PNG decoded fully at 3306 by 1558.
- Across all samples: 3,785,295 to 4,531,614 bytes.
- October 20 samples: 4,055,034 to 4,499,607 bytes.
- One sample exceeded 4,500,000 bytes; none exceeded 4,718,592 bytes.

Vercel's documentation states a 4.5 MB function response limit without an exact
byte threshold on the referenced page. These local results therefore do not
prove a hosted limit violation. They show why payload headroom must be checked
instead of assuming every map stays at the earlier observed 4.08 MB. Samples
are not a proof of a global maximum over all dates, locations and city labels.
Local text rendering may differ slightly from the hosted Linux font stack.

Vercel documents streaming responses as exempt from the ordinary response
payload limit. A supported streaming delivery path can retain the original PNG
without shrinking or changing its pixels. The current handler uses `res.send`;
the actual hosted checks above returned Content-Length and full PNG bodies,
so no transport change is justified by this sample set.

At one full download every 15 minutes continuously for 30 days, the measured
October range implies 11.68–12.96 GB of image bodies. This is an arithmetic
scenario, not metered usage. Hobby includes 10 GB of Fast Origin Transfer.
Other endpoints, headers and retries add traffic; conditional reuse can reduce
it. Do not assume a free 15-minute around-the-clock migration fits the allowance.
No paid plan upgrade is authorized or performed by this check.

## City and quota compatibility

The default Vercel route already uses `waitUntil` for work beyond its 1500ms
city deadline. It does not use the Cloud Run adapter's extra drain before PNG
delivery. This is a real code-path difference, not evidence of better mobile
end-to-end performance.

Environment metadata confirms the branch-specific map access/provider keys and
Preview KV variables exist. Their secret values were not exposed or edited.
The attempted reads of KV URL/read-only-token metadata did not return usable
values, so the current Redis ledger was **not** read during this assessment.

The Vercel resolver uses regional Runtime Cache and the Redis budget module.
The active Cloud Run path uses Firestore cache and budget storage. The committed
October 15 handoff report records successful migration of the ledger to
Firestore. The migration code fences the old Redis ledger, deliberately making
old Vercel provider reservations fail closed. A live reverse migration or
current fence state has not been independently checked today.

Do not reset counters, silently initialize a new quota, or restore the old
Redis flag while Cloud Run remains active. A full return needs the existing
controlled handback procedure and current Google access. An incremental option
is to render/deliver PNGs in Vercel while using the current Google city endpoint
under the existing city deadline; this preserves one ledger but retains a
Google dependency. That option is a design proposal, not implemented here.

## Migration decision and remaining integration

Vercel passed the full-resolution image-delivery feasibility gate. Keep the
approved renderer and image quality unchanged. Four successful synthetic
downloads are not proof that the prior intermittent mobile timeout is fixed.

The remaining migration work is concrete: select and implement one city/quota
path (controlled full handback, or a bounded bridge to the current city service),
verify it in Preview, and provide a durable app-authorized delivery URL that
does not depend on this expiring test link. Account for the monthly transfer
scenario before promising the Hobby plan is sufficient. Retain the phone's
last-good-file behavior. Do not dismantle Google or change the phone hostname
based only on these PNG checks. No additional timed phone experiment is needed
to perform the server-side integration work.

## Primary references checked

- https://vercel.com/docs/functions/limitations
- https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions
- https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package
- https://vercel.com/docs/plans/hobby
