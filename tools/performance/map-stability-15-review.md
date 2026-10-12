# Weather 15: controlled native image stability gate

2026-10-12. Preview only, branch `f50-widget-test`. This is a diagnostic candidate, not a proven map fix.

The current daily private export SHA-256 is
`4af8c286f333f3dcded3891f81ac267bb1711fc080a0923bbc637880cef970e7`.
Candidate: **Widgy Weather 15 — Stability**, 1204 layers, 74 variables.
Only Image6170's provider fields, the now-unused map_request URL, and document
name/description change. Reversing those fields exactly reconstructs the entire
daily export. The original daily copy/envelope and approved assets are untouched.

## Native mechanism

Use the Image JSON Endpoint schema obtained from the owner's successful native
export on 2026-10-07. One stable metadata URL selects one full-size PNG. No native
GPS/minute substitution is used for this map source. Other native widget data
continues to operate. The selected fixture has no live position or solar time.

Two synthetic, lossless 3306x1558 fixtures are built with the approved renderer
at fixed instants (2026-10-12T04:00Z and 16:00Z), without personal location. The
renderer outputs 4,277,405 and 4,202,500 bytes, both below 4.5 million bytes. The
build asserts exact byte lengths and SHA-256 values before publication. No
resizing, tiling, masks, second image layer or modified master artwork is used.

## Test controls

- A/B: select one known image. Each selection gets a new image URL revision;
  successful old URLs still serve the original byte-identical fixture.
- Auto: alternate fixtures by elapsed 30-minute buckets, evaluated only when
  Widgy requests metadata. It is not an iOS refresh schedule or a background
  job, and does not proactively download images. Typical upper intent is one
  new ~4.2 MB image per half hour, not per minute; retries are still possible.
- JSON error: metadata responds 503 for at most five minutes.
- Image error: valid metadata directs the phone to an image request returning
  503 for at most five minutes.
- Slow: the image handler waits six seconds before delivering a valid full PNG.
  This deliberately bounded fault is within the diagnostic function's 15s
  duration; it is not a durable workflow. The mode expires after five minutes.
- Recovery: server selection returns to valid B on the first request after
  expiry or immediately after selecting B. Phone display still needs a Widgy
  refresh; automatic server recovery does not guarantee immediate screen repair.

The helper reads status only. It never requests the image/source on page load,
so a browser preview cannot falsely appear as a native image fetch. No polling
or scheduler is installed. Manual status refresh and optional owner observation
buttons suffice. Request telemetry measures server receipt and server response
completion, never native delivery/decode/display.

## Isolation / storage

The `/api/map-stability` alias dispatches through the existing fetch-probe
function; no thirteenth function is introduced. Existing Weather/location/probe
branches are unchanged. The live `/api/night-map` endpoint is unchanged.

Small state and the last 32 events use a separate Redis key
`widgy:map-stability:15:v1` with a seven-day TTL, using the existing configured
Upstash account. No new service or paid plan is provisioned, and no existing
location/budget key is read or modified. No images are stored in Redis.

Read and control capabilities are distinct random 256-bit tokens. The repo
contains their SHA-256 hashes only. Full personalized widget and control token
are distributed in an AES-256-GCM encrypted, gzipped envelope; the decryption
key stays in the private Chrome link fragment. Control requires a bearer token
and rejects other web origins. The copied widget contains only its read token.
Application diagnostics omit raw URLs, keys, coordinates and personal data.
Infrastructure may log URLs for the read endpoint as for other HTTP requests;
the read capability authorizes only this synthetic test, never control or live
personal data. Keys/private plaintext exports are not publication files.

## Verification / native gate

Local real-HTTP tests cover authentication separation, invalid controls, full
PNG integrity/dimensions, old image immutability, deliberate metadata/image
failures, timed recovery, delay selection, automatic revision changes, telemetry
separation, encrypted roundtrip and exact full-document preservation. The local
state implementation is a test double; live Redis Lua must also be exercised
on the isolated Preview endpoint before handoff.

Browser UI and clipboard checks validate the helper, not Widgy. Initial native
gate: import this one copy, place it instead of daily15, confirm complete map,
select B and confirm a real image change. Only then try one controlled fault
and correlate the receipt record with the screenshot/report. A failure phase
with no native request is inconclusive. Retained pixels without a new fetch
cannot prove last-good behavior. Longer normal-use observation follows if the
controlled gate succeeds. A/B/C need not occupy screen space.

No native result exists yet. If the new provider still blanks on an observed
failed fetch, stop presenting backend changes as a complete solution: native
retention needs addressing. The full live producer/GPS migration is intentionally
not built before this capability is demonstrated.

## Deployment and remaining approval gate

Preview commit `6029d21978c2a837fc3278c609a0f07430fa2a12`, deployment
`dpl_G7xtgYbG7r3QuSUoWCmiR7GzsVbm`, READY. The existing branch alias was
verified through Vercel. Browser page decryption and authenticated status read
succeeded: initial A, zero source/image requests. The Copy button reported
success; the cloud clipboard bridge returned no items, so the copied bytes
were not independently read back through that bridge. Encryption roundtrip
and exact candidate content were independently verified locally.

Live fault/image verification from the executor was rejected by automatic
approval review for transmitting test read/control capabilities to Vercel.
A local scope audit proved those keys were generated for this synthetic test,
authorize no personal/service data, and point to the verified owned Preview.
A narrowed fixed-origin/no-redirect retry was also rejected for lack of explicit
user permission to transmit the test keys. No more retries or tool switching.
Explicit user authorization for those two test capabilities to that Preview
endpoint is required before completing live fault/delay/PNG checks. Do not
claim that these live checks passed. Local HTTP tests remain passed, and the
owner has not yet imported or tested the native candidate.


## Live verification completed with explicit owner authorization

2026-10-12 10:54–10:56 UTC (13:54–13:56 Asia/Jerusalem). The owner explicitly
authorized use of both synthetic-test read/control capabilities against this
Preview. The previously blocked live verification then completed successfully
(exit 0), with fixed origin/path validation and redirects disabled.

- A: HTTP 200, image/png, 4,277,405 bytes, exact configured SHA-256, 3306x1558.
- B: HTTP 200, image/png, 4,202,500 bytes, exact configured SHA-256, 3306x1558.
- The original A URL remained byte-identical after switching the selected state to B.
- Metadata-failure mode: HTTP 503 with no-store; its Redis state deadline was
  exactly 300,000 ms after selection.
- Image-failure mode: valid HTTP 200 metadata followed by HTTP 503/no-store image.
- Delay mode: full B PNG remained byte-identical; end-to-end executor duration
  was 12,575 ms including transport. Vercel recorded 6,122 ms server completion
  with an intentional 6,000 ms delay. Ordinary image server completions were
  127–150 ms; executor timings are not iPhone timings.
- Automatic mode selected A in its initial half-hour bucket.
- Finally restored healthy A, new revision 8-0. Six source and five image requests
  are investigator-generated counts, not native user evidence. No source/image
  request for revision 8-0 was issued by the investigator.

The live run exercised actual Redis Lua persistence and control, not the local
state double. Vercel runtime logs independently corroborated matching revisions,
200/503 statuses, image byte sizes and completed responses on the Preview
branch. Automatic five-minute wall-clock recovery and a real half-hour bucket
transition were not waited out in the live test; time advancement for those
paths was covered by the local tests. Do not imply they were observed live.

The owner has not yet supplied native results for this candidate. Start with one
full widget replacing daily15, then confirm a genuine A-to-B image change.
Trigger one image-failure phase and correlate the phone result with a request
for that revision. A phase with no native image request is inconclusive. Restore
healthy B, then use auto mode for ordinary-use observation over roughly 24 hours
if the controlled gate passes. Do not use tab changes before recording a black
map, because navigation previously repaired the symptom. Phone-side image
retention and background update stability remain the decisive unverified gates.


## Native image-failure gate: FAILED (2026-10-12)

Owner explicitly confirmed successful A/B visual changes at 14:08:20 Jerusalem.
Vercel corroborated full A revision 12-0 at 14:07:26 (4,277,405 bytes, HTTP 200)
and B revision 13-0 at 14:07:40 (4,202,500 bytes, HTTP 200).

Owner selected image-error at 14:09:30, revision 14. At 14:09:41 the native
sequence reached valid metadata (HTTP 200, revision 14-0), then the intended
image endpoint (HTTP 503, revision 14-0, completed response). At 14:09:57 the
owner reported a black map after the requested manual refresh. The investigator
did not fetch source/image in this native phase; its requests were status only.

This demonstrates that this native JSON Endpoint configuration does not retain
its previously visible image through an observed failed replacement image fetch.
It does not establish the cause of earlier spontaneous blanking in daily15/C,
and does not measure a background refresh or native memory use. Reject this
candidate as a proven last-good-image solution; do not infer reliability from
successful server-side generation or move directly to a 24-hour stability claim.

Recorded owner observation blank against image-error revision 14 at 14:10:25,
then restored healthy B at 14:10:26, revision 15. Native recovery not confirmed
yet. Next useful native distinction, only after recovery: failed metadata while
a known-good image is visible. Any future solution must preserve the visible
native asset until replacement succeeds; server retention alone cannot cover
phone-side download/decode failures. No production/daily export changed.


## Native metadata-failure gate: FAILED (2026-10-12)

After healthy B revision 15-0 was delivered at 14:12:56 Jerusalem, the owner
confirmed native recovery at 14:14:27. Investigator recorded visible against
revision 15 and selected json-error revision 16 at 14:15:10.

At 14:16:51 a native metadata request reached revision 16-0 and completed with
intentional HTTP 503. There was no subsequent image request: lastImage remained
the healthy B revision 15-0. At 14:17:07 the owner reported a black map. This
isolates blanking to metadata failure as well as the separate image-download
failure already reproduced, under the requested manual refresh procedure.
The investigator only used status/control during the native phase, so neither
source nor image evidence is contaminated by an investigator fetch.

Recorded blank against json-error revision 16 at 14:17:32 and restored healthy
B revision 17 at 14:17:32. Native recovery from this second fault has not yet
been confirmed. No additional failure phase or auto-cycle trial was started.

Decision: the current native JSON Endpoint candidate fails both last-good-image
retention gates. It is not a robust repair and should not proceed to a 24-hour
stability acceptance run. These controlled manual-refresh failures do not prove
the trigger of the original spontaneous daily15/C blanking. Server-side last-good
responses can reduce upstream failures but cannot guarantee native retention
through failed metadata transport, image transport, or decoding. A proposed
local-file/album mechanism also needs its own retention/export validation,
given the owner's earlier local-source disappearance/export reports; do not
present that alternative as already proven. No claim that smaller images,
a new host, or a paid tier would fix this evidence is justified.


## Healthy-response recovery did not restore native display

2026-10-12: owner reported at 14:20:52 Jerusalem that the map stayed black
after one manual refresh. Native source revision 17-0 completed HTTP 200 at
14:20:26.147, followed by a healthy B image revision 17-0 completed HTTP 200
at 14:20:26.841, 4,202,500 bytes with handler integrity checks. Server status
confirmed mode b, no active fault, matching latest source/image revisions.
No investigator source/image requests were made in this phase.

Recorded blank against healthy revision 17. This is a failed observed
recovery after server restoration, not evidence of a still-active 503 phase.
Server completion does not prove native delivery/decode/display, so do not
label a precise cache, memory, or rendering defect as confirmed. One
Calendar-to-Home transition is the next minimal recovery/discrimination step;
its result and any new source/image requests should be correlated afterward.


At 14:24:50 Jerusalem the owner again reported a black map after refreshing.
Vercel confirms another metadata 200 at 14:24:14.671 and image 200 at
14:24:15.358, unchanged healthy B revision 17-0, 4,202,500 bytes, completed
response with handler hash validation. Status at 14:25:20 remained healthy B,
19 source and 13 image requests. No new fault or revision was introduced.
The owner's wording still says refresh; a Calendar-to-Home transition has not
been explicitly confirmed in this phase. Do not mark navigation recovery as
failed or prescribe repeated identical manual refreshes. Server completions
still cannot establish client receipt/decode/display. Retain the failed
candidate for diagnosis rather than treating it as a finished daily replacement.


## Stop repeating the failed recovery gate

At 14:38:22 Jerusalem the owner reported approximately four manual refreshes
with the map still black. The accumulated matching healthy revision 17-0 image
responses completed at 14:20:26, 14:24:15, 14:31:25, and 14:37:31, each HTTP 200
and 4,202,500 bytes; the fixture hash is validated by the handler before serving.
Healthy metadata was requested before each. Status at 14:38:49 confirms mode b,
revision 17, until 0, 21 source requests and 15 image requests total. The agent
performed status-only reads in this phase and did not fetch the images.

Repeated manual-refresh recovery is clearly unsuccessful for this candidate in
this native session. Do not request a fifth identical refresh or start a long
acceptance soak. There is still no explicit report of a Calendar/Home transition
in this phase; do not invent its outcome. Recommend restoring the saved original
daily15 to the home-screen slot and preserving the Stability copy within Widgy.
This rollback restores the previous configuration, not a proven map stability fix.
Further implementation must address native retention/recovery and respect the
single full-resolution map constraint; exact native cause remains unverified.


## Next bounded diagnostic: isolate the same image, not its resolution

2026-10-12 afternoon. Prepared `Widgy Map Isolation 15` as a browser-local
transformation of the already encrypted full Stability copy. Exactly two layers
remain: the original HOME parent and its original image node, both with their
exact frames, provider fields and capabilities. One full 3306x1558 image is still
used. Variables and unused custom font definitions are removed. The original
full export/envelope, map bytes, live endpoint, and existing test server state
are unchanged. No injected failure is activated by copying or opening the page.

The 3,265-byte diagnostic export contains only the synthetic read capability,
not the control capability or other service URLs. Its SHA-256 is
`0e61a1d86ffbf86b34acc52e41670cd34bb9d687ab4773731c38f12567b6d349`.
Local assertions cover exact map and parent equivalence, the precise allowed
whole-document delta, zero variables, one image, original input immutability,
URL scope, and absence of the control capability. The original daily design is
not changed; the diagnostic intentionally omits all other visible content.

Native gate is only initial healthy rendering at the same screen slot; no
repeat fault/refresh loop. If the fresh minimal document works, compare a fresh
FULL document before assigning causality to layer load: new document state and
shared native caches are confounders. If the minimal copy also fails, preserve
it as a compact reproduction of the transport/decode/display path, not proof of
a specific memory bug. A successful initial rendering alone cannot establish
failed-fetch retention or background stability. There is no measured iPhone
memory profile and no claim of a 30 MB threshold for this particular widget.

Review of the earlier local-input experiments found the later isolated failures
in a Files -> Base64 String variable -> JS/Web URL bridge, with explicitly empty
variable input outside the editor. Direct native file loading had earlier
manual-refresh successes plus sharing HTTP 422 failures. Neither local source
should be described as universally impossible or already reliable. A local
replacement route still requires independently verified persistence, file access,
replacement semantics, export/import behavior and actual native refresh.


### Isolation helper deployment verification — 2026-10-12

- Preview commit `70e40d6e896706cfe72b231d4d264d5fca7056af`, deployment `dpl_FRDTsDZb5uMAL6hX8sUBtyGWhd5Q`: READY. Production unchanged.
- Branch helper loaded the new map-only section, decrypted its existing envelope, and the map-only copy action reported success in the browser UI.
- Browser clipboard bridge returned an empty string; native clipboard bytes/import were not independently verified. The local transformation test already validated the generated JSON. Native map-only rendering remains the next gate.
- Status-only page read showed a later native fetch at 14:45:14 (metadata) and 14:45:15 (image), still healthy image B; 22 metadata and 16 image requests total. This does not establish iPhone display. No fault or image mode change performed for helper verification.


### Native isolation result and fresh full control — 2026-10-12 15:03:33 Asia/Jerusalem

User reported “המפה מופיעה” after the map-only import instructions. This establishes user-reported map visibility in the isolated variant, not a long-running stability result or a memory measurement. The report did not explicitly distinguish editor preview from home-screen visibility.

Next comparison: `Widgy Weather 15 — Fresh Control`, imported as a separate full document and placed in the same screen slot. Its only export changes relative to the full Stability candidate are document name and description (root fields 3 and 4). All layers, variables, geometry, providers and URLs are preserved exactly; the map is identical to the isolated variant. A distinct name does not promise native cache invalidation or a new internal identity. No guessed undocumented identity fields are modified.

The helper now offers a clearly named fresh-full copy action above prior copies and collapses image-switch controls to keep the initial check focused. No server state, image, secret, backend or daily export change. First gate: does the map display on the iPhone home screen? Further fault testing/soak remains deferred. If both newly imported documents work, layer-count causation is not established; if only the full copy fails, document load/dependencies become a stronger lead, still without measuring memory.
