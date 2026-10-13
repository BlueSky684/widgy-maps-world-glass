# Music Glass W2 — album title

Source of truth: `source/Widgy_Music_Glass_W1_phone.json`, the user's working phone export uploaded on 2026-10-13. The home-screen screenshot confirms artwork, song and artist display correctly. The corrected providers are `Music Player - Album Art`, `Music Player / Song` and `Music Player / Artist`.

W2 adds one text layer for `Music Player / Album`, cloned from the working Artist layer. It shares the Artist font, x coordinate and width. Its 530px-design frame is `[314, 325, 174, 28]`; the Artist frame remains `[314, 278, 174, 42]`. Muted color opacity is 80%. This places the additional line below the artist with 18px clearance above the playback panel. No album text or sample song is hardcoded.

All eight existing layers are preserved exactly. The widget remains Small, with the same embedded background and large album artwork. Controls, playback state, time and progress have not been connected.

Build: `node tools/music-glass/build-widgy-w2.mjs`.

Output: `tools/Widgy_Music_Glass_W2.json`; import using `tools/widgy-music-glass-copy.html`.

Validation: the build verifies unchanged existing layers, unique IDs, matching text alignment and no overlap with the Artist frame or playback panel. The new Album binding and automatic text fitting still need confirmation on the phone; local layout inspection does not reproduce Widgy's native text engine.
