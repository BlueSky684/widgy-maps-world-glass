# Map Mask Live 1 — 2026-10-06

## Evidence and purpose

At 10:20 Asia/Jerusalem the owner reported that ORIGINAL temporarily stopped loading while MASK remained visible. IMG_9924 and IMG_9925 show both real-map compositions. At 10:22 the owner confirmed ORIGINAL recovered. The reference and both comparison mask assets currently return HTTP 200 with the published SHA-256 values. The earlier disappearance is unresolved; this does not establish a server, cache or memory cause.

The screenshots look broadly similar. After converting their embedded Display P3 profiles to sRGB and aligning the rectangular crops, mean absolute channel difference was about 1.49, with the 95th percentile at 6. JPEG artifacts, screenshot processing and subpixel alignment prevent treating this as exact rendering parity. No explicit owner approval of full appearance or live-mask speed has been received. Compare1 uses a fixed solar instant and cannot prove refresh.

Live1 is the next separate diagnostic: retain full-size fixed day/night textures and load only small, time-dependent masks. Remove the full-size ORIGINAL reference image from Calendar. Preserve Five Minute1 and Compare1 unchanged.

## Implementation

- `api/solar-mask.js` renders only the public solar field, without terrain, GPS, geocoder, IP-based location or account sources. Exact URL: `/api/solar-mask?rev=live-1&part=day|night&t=<five-minute epoch in milliseconds>`.
- Each 522×246 lossless PNG has an explicit sRGB profile. The solar instant is the requested epoch, not arrival time. The revision and epoch therefore identify deterministic bytes. Successful responses are publicly cacheable for one day; invalid requests are not. ETag/HEAD/304 are supported. An eight-epoch process cache coalesces paired requests. No background schedule is added.
- Both image URL scripts reference the same synchronous `mask_epoch` variable and return a whole URL through one native image binding. That establishes an intended common epoch, not atomic loading or a verified Widgy dependency schedule. There are four cached Web URL images and three synchronous variables.
- The actual day PNG contains a D date/time stamp; the night PNG contains an N stamp. Times are Asia/Jerusalem, including DST. The other half of each stamp band is zero. Advancing matching D/N stamps therefore demonstrate which two bitmap epochs were displayed; an independent text clock cannot create a false positive.
- Two diagnostic static map derivatives provide white/black plates for these stamps in the bottom 114 of 1558 rows. All pixels above that strip are byte-identical to Compare1 day/night textures. Both approved 3306×1558 master files remain unchanged. This strip is temporary and is not an approved map redesign.
- Keep captured native Multiply/Plus Lighter objects, frames and existing Home/Calendar visibility actions. Calendar is blank apart from a static test heading. No extra Reload action, marker, city, weather, fitness or calendar account is present in this isolated copy. Full-widget reintegration remains later work.

## Verification

`node tools/test-map-mask-live.mjs` passed. It exercises real PNG rendering, decoded solar pixels, five-minute advancement of both solar field and bitmap stamps, independent stamp halves, summer/winter time labels, route validation, cache coalescing, ETag/304/HEAD, IP independence, static texture pixel preservation, native frames/providers/navigation, unchanged input template, variable dependencies and bucket boundaries, and the actual copy/download/failure/recovery controller.

At the synthetic epoch 2026-10-06T07:30:00Z, day/night PNG sizes are 19,416 and 19,864 bytes: 39,280 bytes together. This is one measured case, not a universal size bound. Local Server-Timing was 15.6 ms; this is not a hosted cold-start, network or iPhone navigation measurement. Two static map downloads remain about 3.18 and 4.51 MB for initial loading. Smaller recurring downloads do not prove lower native rendering cost or retained decoded-image memory.

Runtime commit `f4cdb070f2b62f980e44388b47f1c89319ae03e0` has a successful Vercel deployment. All six public page/module/manifest/static-map files returned HTTP 200 and matched local bytes. The four real API requests for day/night at two consecutive synthetic epochs also returned HTTP 200, exact locally rendered PNG bytes and the correct epoch/revision/part headers. See `map-mask-live-1-public-verification.json`. This verifies deployed construction and delivery, not native Widgy freshness or navigation speed. The candidate is ready for the device gate.

## Device gate

Import and assign `Widgy Map Mask Live 1` separately. First capture both D/N stamps. Then use the phone normally and navigate Calendar → Home; when stamps advance, report whether their times match, whether either regresses or disappears, and whether the first and subsequent returns remain acceptable. No timed idle chore and no claim of guaranteed five-minute refresh or zero delay. If one stamp is absent/stale, investigate paired loading before extending the widget. The recovered ORIGINAL incident remains open and should not be used as proof that split maps solve disappearance.

Chrome import page after publication: `googlechromes://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/tools/widgy-map-mask-live.html?v=map-mask-live-1`.
