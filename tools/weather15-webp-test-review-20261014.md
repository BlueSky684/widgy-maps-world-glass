# Weather 15 — WebP compatibility candidate

Prepared 2026-10-14 on `f50-widget-test`, based on deployed commit
`5ac0d89a72e1e8d274579d47db62b083c3f9e263`. The earlier crop commit and its
uncommitted work remain in the original checkout and are not included here.

## Purpose and exact changes

Test a smaller lossless transport for the existing single-image Home Start.
The map remains dynamic: the existing exact location/city lookup and server
time control the composite. The existing 60-second reuse behavior is unchanged.
Resolution remains 3306×1558. No native memory or stability improvement is yet
claimed, and no extra storage account, paid service or email is involved.

The private complete Home Start export is transformed into
`Widgy Weather 15 - WebP Test`. Its only changes are that identifying name and
appending `&format=webp-exact-v1` to the existing native `map_request` URL.
All 1,204 layers, 74 variables, navigation actions, frames, fonts, credentials
and remaining fields are otherwise identical. The import payload is encrypted
with a new AES-GCM key supplied only in the personal URL fragment. Plaintext
exports and keys stay outside the repository and the public build.

`api/night-map.js` opt-in encoding runs after the approved PNG renderer. Existing
requests still return PNG and use the same cache keys. WebP has a separate cache
key and ETag; it retains private caching, authorization, time, location and HEAD /
conditional handling. The warm cache's legacy `png` field stores the encoded
bytes in either format; the MIME type and diagnostic byte field reflect the
requested format. The new encoder loads only for the explicit opt-in request.

The renderer keeps Sharp 0.34.5 and its existing dependency graph. A pinned npm
alias, `sharp-webp-exact` → Sharp 0.35.5, provides `exact` support only for the
transport encoder. Every pre-existing package-lock dependency entry was checked
and remains identical. No unconditional renderer-library upgrade was performed.

## Verification before publication

`verify-weather15-webp-test.mjs` uses the actual encoder and route. It verifies:

- Six independently rendered time/location fixtures: the original PNG bytes
  remain identical after loading both Sharp versions; decoded WebP RGBA and
  embedded ICC bytes are identical to each PNG at 3306×1558.
- Fully transparent nonzero RGB and partial-alpha preservation.
- Actual format/MIME, fixed-time and live-time responses, different output
  for changed time and coordinates, separate PNG/WebP cache entries and ETags,
  repeated WebP reuse, 304, mismatched-format ETag, HEAD and invalid requests.
- Shared-location authorization still rejects an invalid key; authorized
  operation still works when the optional city provider is unavailable.
- Deep restoration of the transformed widget equals the complete source.
- The shipped copy controller decrypts and checks the encrypted payload, copies
  complete multiline JSON, and rejects wrong keys and corrupted metadata.
- Public-site build and map-cache/stability-asset build complete locally.

Recorded Node encoder run: 260–316 ms additional local encoding across six
frames; sizes 2,926,352–3,206,228 bytes versus PNG 3,958,173–4,477,739 bytes.
These are local measurements, not Vercel network or iPhone results. Output hashes
match the previous Pillow/libwebp exact-lossless experiment.
The full machine-readable result is
`weather15-webp-test-verification-20261014.json` (15 actual-route checks).

Reproduce with synthetic fixtures and locally supplied private exports:

```sh
node tools/research-map-transfer-fixtures-20261014.mjs /absolute/scratch/fixtures
node tools/build-weather15-webp-test.mjs /private/Home_Start.json /private/webp-output
node tools/verify-weather15-webp-test.mjs /absolute/scratch/fixtures /private/Home_Start.json /private/webp-output
```

## Publication and native gate

The intended destination is this branch's Preview only, project
`widgy-maps-world-glass`, never `main` or production. Before handing over the
copy link, verify the deployed commit, the copy/encrypted assets and a full
WebP response from the deployed code. Use public synthetic coordinates for
image verification; do not put private city/location keys in diagnostic output.

The phone gate is full map/city display with correct colors and transparency,
followed by the known Calendar → Home action. A visible first image is not
proof of sustained stability or refreshed frames. Native WebP acceptance and
subsequent updates remain pending until the owner's observation. If the codec
fails native acceptance, stop this candidate; the existing Home Start remains
available because its URL does not opt into WebP.

The raw full-size 8-bit RGBA surface is still 20,602,992 bytes (19.65 MiB).
No promise is made that Widgy's 102 MB counter will fall. No automatic PNG
fallback is used in this candidate, so a successful native display genuinely
tests WebP. Blob/CDN migration is a separate future decision after this gate.
