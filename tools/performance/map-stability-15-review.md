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
