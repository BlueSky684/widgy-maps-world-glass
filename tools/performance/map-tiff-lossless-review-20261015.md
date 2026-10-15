# Lossless TIFF native decoder trial

Prepared 2026-10-15 on `f50-widget-test`. **Local and hosted pixel verification passed. The owner deployed the
option to Google; native acceptance is pending. This is not a demonstrated fix.**

## Why this is a different experiment

The Google-hosted PNG still disappeared on Calendar → Home at 09:12 Israel
time. HTTP 200/finished records did not prove native receipt or rendering.
Prior work already tried smaller PNGs, lossless WebP, split images, static
delivery and hosting changes. No TIFF map trial was found in the reviewed
records. WebP's phone failure does not establish TIFF compatibility either.

The owner explicitly requires identical pixels and colors. A locally measured
JPEG 100/4:4:4 prototype was therefore discarded before publication: even its
small numerical changes and flattened corners violate that requirement.
No JPEG option is included in the runtime change.

`format=tiff-lossless-v1` converts the approved renderer's PNG to a classic,
single-page, strip-based TIFF using lossless LZW and horizontal prediction.
It preserves 3306×1558, all 8-bit RGBA samples (including transparent RGB),
unassociated alpha and the exact embedded sRGB ICC bytes. There is no resize,
palette reduction, matte, crop, color conversion, layer split or provider
change. Time, precise coordinates and the English city still drive the same
renderer. This tests another image container/decoder path.

Apple documents TIFF as an iOS-supported image format. That is not a guarantee
that Widgy's Web URL loader accepts TIFF or that its native lifecycle bug is
fixed. A different container does not reduce the full decoded RGBA surface:
20,602,992 bytes (19.65 MiB), before other native allocations.

References checked 2026-10-15:
- https://developer.apple.com/library/archive/documentation/2DDrawing/Conceptual/DrawingPrintingiOS/LoadingImages/LoadingImages.html
- https://developer.apple.com/library/archive/documentation/GraphicsImaging/Conceptual/ImageIOGuide/imageio_basics/ikpg_basics.html
- https://sharp.pixelplumbing.com/api-output/#tiff

## Verification and costs of this choice

Six existing independently rendered fixtures cover multiple UTC hours,
coordinates/city labels and seasons. All decoded RGBA bytes and all embedded
ICC bytes match each source PNG in **both Sharp/libvips and Pillow/libtiff**.
Each PNG also remains byte-identical to its recorded fixture. A separate
fixture checks nonzero RGB hidden under alpha 0 and partially transparent
pixels. TIFF tags confirm LZW, four 8-bit samples, one page and unassociated
alpha. DPI is equivalent within TIFF floating-point representation.

TIFF files are **4,587,496–5,172,010 bytes**, compared with PNG
3,958,173–4,477,739. Local extra encoding took 232–290ms. These are local Linux
measurements, not phone/network timings. The payload is larger; neither a
speedup nor reduced native memory use is claimed. Use the Google origin for
this trial; these files exceed the existing Vercel response-size constraint.

`tools/test-map-tiff-lossless.mjs` also passed 16 real local HTTP requests
through the actual Cloud Run adapter: format/MIME/content length, dynamic
time and coordinates, separate PNG/TIFF caches and ETags, 304, cross-format
ETags, HEAD, token rejection, method rejection, transparent location layer,
private cache headers, sanitized logs, existing lossless WebP and reversal
to the identical cached PNG. The existing Cloud Run regression suite also
passed, including byte equality to its pre-migration PNG oracle and Google
storage/city-task lifecycle checks. All provider/storage data in these tests
is synthetic; no real geocoder call or quota write was made.

Reproduce:

```sh
node tools/research-map-transfer-fixtures-20261014.mjs /absolute/temp/fixtures
node tools/test-map-tiff-lossless.mjs /absolute/temp/fixtures
node --experimental-vm-modules tools/test-cloud-run-map.mjs
```

For independent decoding, open each `.png` / `.tiff` pair with Pillow,
compare `convert('RGBA').tobytes()` and `info['icc_profile']` byte for byte.
Machine-readable results: `map-tiff-lossless-verification-20261015.json`.

## Controlled phone handoff

1. Deploy the branch with the existing reviewed Cloud Run deployment helper
   and a fresh source context. Ordinary requests continue to return PNG.
2. Before editing Widgy, verify the Google service really returns `image/tiff`
   and `X-Map-Format: tiff-lossless-v1` for an authenticated synthetic request,
   fully decode it and compare its RGBA/ICC to the same hosted fixed-time PNG.
   An old server silently ignoring the new parameter is not a TIFF success.
3. In the **existing** Map Home Test widget, append exactly
   `&format=tiff-lossless-v1` to the Google `map_request` value, without quotes.
   Do not change `calendar_location_pair`, secrets, coordinates, size, other
   layers, or the manually added native Memory Used label. The current URL
   has no `city_text` tail. Do not import an older full widget export.
4. First acceptance gate: the complete map, city, colors and transparent
   corners display. If blank or visibly incorrect, remove that one parameter
   and stop this format trial. No cache clearing, reassignment or reset loop.
5. If accepted, repeat the failing Calendar → Home transition ten times,
   including returns after at least 70 seconds so the server cache expires.
   Then lock for five minutes and return. Record disappearance time and
   whether only the map or the whole widget disappears. A first successful
   image is not a stability result; normal use must still be observed.

Rollback is simply removing `&format=tiff-lossless-v1` from `map_request`.
This leaves the established Google storage/budget handoff intact. Do not reset
the budget, delete the old ledger, or restore old Vercel city URLs.

## Hosted verification after owner deployment

At 10:24 Israel time the owner supplied a successful Cloud Run deployment
screenshot identifying source commit `4aefcae6b4d6eee65aae6b6bbe84314a3dec085a`.
Authenticated synthetic fixed-time PNG and TIFF requests both returned 200
from the Google origin, with matching Content-Length and the correct MIME.
TIFF additionally returned `X-Map-Format: tiff-lossless-v1`. Both files were
fully decoded using Pillow/libtiff: all 3306×1558 RGBA samples and all ICC
bytes are identical. Payloads were 4,062,122 and 4,687,526 bytes respectively.
The synthetic request did not use shared-location lookup or call the city
provider. Credentials remained in memory and were not printed or saved.
Native phone acceptance and Calendar → Home stability remain pending.
