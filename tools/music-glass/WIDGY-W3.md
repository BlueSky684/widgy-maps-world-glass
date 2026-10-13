# Music Glass W3 — clean Play symbol

The user confirmed W2 album metadata in IMG_0350.png, then requested removal of the circular Play surround. W3 removes the two SVG circles centered at `(265,459)` with radii 43 and 39.5. Their fills and strokes are gone; the native green Play symbol stays exactly as in W2.

Build with `node tools/music-glass/build-widgy-w3.mjs`. The build creates the revised SVG/PNG background and embeds it into `tools/Widgy_Music_Glass_W3.json`.

All eight non-background layers are asserted unchanged, including title, artist, album title, artwork, refresh and three playback symbols. This is a visual edit only; playback actions and live progress remain unconnected.

Import using `tools/widgy-music-glass-copy.html` and assign **Widgy Music Glass W3** to the existing Small slot.
