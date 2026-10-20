# Vercel return assessment — 2026-10-20

Status: local compatibility checks complete; authenticated hosted PNG checks
blocked pending explicit authorization for a temporary Preview access link.
No phone configuration, deployment protection, quota ledger, production route,
hosting subscription or cloud resource has been changed by this assessment.

## Current deployment and access

The connected project is `widgy-maps-world-glass`, branch `f50-widget-test`.
Preview deployment `dpl_EgoeCF73wdifJxYBYjcPaPZ2CQwY` is READY at commit
`658f9170e04f05ef890af7467f12ce4d9b7fd911`. The preceding server-adapter change
does not run in the normal Vercel route; it is still not deployed to Cloud Run.

One unauthenticated synthetic base-map request followed a login redirect and
returned HTML, not a PNG. Its timing is not a map performance measurement.
The authorized connector can read project, deployment and environment metadata.
No authenticated Vercel CLI is available in this workspace.

The connector operation to obtain a Preview access link was rejected by the
automatic approval review: the operation can create a bearer link granting
access without login for up to 23 hours, which was not explicitly authorized.
No link was obtained and no alternative bypass was attempted. Completing the
hosted test requires authorization for that temporary access, or an existing
supported authenticated client. Do not disable Deployment Protection or place
such a link in the widget, code repository or user-visible test report.

A 30-minute query for `night_map_response_v1` in the current Preview returned
no matching logs. The earlier 1-hour request was rejected as outside retention.
Neither result proves image delivery or a runtime failure. The API error
identified the account as Hobby for runtime-log retention.

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
the actual deployment framing/limit behavior remains to be measured before
deciding whether a transport change is needed.

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

## Next concrete check

With approval for temporary authenticated Preview access, test the existing
deployment first: full PNG downloads at fixed synthetic instants, including
the largest sample; HTTP status/type; exact byte length and decode; first-byte
and total time; repeated request behavior. Never log full authenticated URLs,
access cookies, tokens or personal coordinates. An HTTP200 login page is not
a successful PNG. Keep every request pinned to the Preview deployment.

Compare hosted results before changing the phone or dismantling Google.
If a new access link is returned, verify its scope and expiry against the
approved temporary limit; do not reuse a non-expiring link under a time-limited
approval. No further timed phone experiment is required for this stage.

## Primary references checked

- https://vercel.com/docs/functions/limitations
- https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions
- https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package
- https://vercel.com/docs/plans/hobby
