# Music Glass W1 — native Widgy build

Import `tools/Widgy_Music_Glass_W1.json` through the copy page
`tools/widgy-music-glass-copy.html`, then assign a **Small** slot.
No Scripting application, ZIP installer or remote music service is required.

## Implemented
- Eight native layers, schema 29 and small-widget size copied from the working Device Glass 9 export.
- Approved A/SPLIT geometry, enlarged 236 × 236 album artwork, D9 background/rim gradients and Phenomena fonts.
- Native Apple Music album art, Song (Now Playing), Artist (Now Playing).
- Native editable SF Symbol layers for previous, play and next. These have **no tap actions yet**.
- Refresh area copied from the proven Device Glass default refresh Tap Action.
- Embedded lossless PNG background (no external image fetch).

## Pending phone validation
Import compatibility, Apple Music permission/data availability, native text wrapping and artwork corner radius must be checked on the actual device. Native text fitting is not reproduced exactly by the local SVG layout proof. Music source names are taken from creator-published exports, not a current export from the user's phone; if unavailable, reselect the corresponding Music sources in Widgy and export that phone version before further changes.

Playback controls, play/pause state, elapsed time and progress are not wired. The unfilled track and `--:--` values intentionally avoid fictional playback information. No Shortcut URL is embedded. Header/placeholder visuals are in the embedded background; live art and metadata stay native and editable.

## Build
`node tools/music-glass/build-widgy.mjs`

QA-only layout image is written under `work/music-glass/`; sample title/artist exist only in that image, never in the import JSON.

## Schema provenance
- Current frame/text/symbol/refresh schema: `tools/Widgy_Device_Glass_9.json` (phone-export-derived).
- Music provider keys and album source: creator's export at https://www.reddit.com/r/widgy/comments/j41cfe/ and https://www.reddit.com/r/widgy/comments/nehwnr/ (field 66).
- A artwork foundation: `assets/music-glass/chrome-m1.svg`.
