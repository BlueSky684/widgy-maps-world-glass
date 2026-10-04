# Small alternate-host experiment

2026-10-04. Only `f50-widget-test`; baseline Consolidated 1 and all widget exports unchanged.

User feedback on Compact Dots 1: no speed improvement; dots remain below the dates. The user then asked for a few small tests with another server before sleep. No candidate is promoted.

`tools/widgy-host-timing.html` runs six public requests on one button: three rounds comparing Vercel static delivery with jsDelivr. This is a delivery experiment, **not a migration of the live map renderer or city lookup**, and not a Widgy transition timer.

Both services deliver the existing `assets/earth/Terrain_Master_3306x1558.png`: full 3306×1558, 3,048,628 bytes, SHA-256 `82d5ef93612689b4e5d48d06503292832fa743bad528d0b14b31630a03350907`. This is the terrain source, not the composited day/night map. No new binary asset or duplicated renderer is added. The jsDelivr URL pins existing commit `ce01dd4ac62c2f0da8f02cb780b8363fb358400a`.

Sequential requests avoid mutual bandwidth competition. First-host order is randomized and alternates each round. First-round values remain separate from the mean of the two subsequent samples. `cache: no-store` bypasses browser cache; CDN behavior may also be affected. The hosting page may already warm Vercel's connection, and repeated samples can warm connection/edge state. This short experiment cannot establish a stable provider advantage or isolate cold origin execution.

Timings cover response headers, body download and browser Image load. SHA-256 verification is outside the timed load interval, and mismatched bytes/dimensions/hash invalidate the sample. This is not a measurement of browser painting or native image decoding. Two successful repeat samples are required for a repeat mean. Per-request timeout is 20 seconds. Cancellation and backgrounding the page stop the run. All results remain on the device; there is a copy button and manual-copy fallback.

No GPS, geocoder, private export, calendar token or calendar data is requested. Fetch credentials and referrer are omitted. Approximately 18 MB are downloaded per completed run. Neither Vercel settings nor the user's widget are changed.

Validation: `node tools/test-map-host-timing.mjs` checks file identity, sequential balanced order, timings without hash double-counting, first/repeat separation, invalid response exclusion, timeout and cancellation. Public HTTP checks verify identical source bytes and PNG MIME type at both providers. Device results are still pending; no speed improvement is claimed.

Provider documentation: <https://www.jsdelivr.com/?docs=gh> and <https://github.com/jsdelivr/jsdelivr>. This uses the documented commit-pinned GitHub CDN file endpoint for an existing public file below the per-file limit.
