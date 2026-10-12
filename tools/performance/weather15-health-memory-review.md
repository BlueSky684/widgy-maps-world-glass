# Weather 15: isolated Health artwork memory reduction

Date: 2026-10-12. Target: f50-widget-test Preview only.

## Evidence and limitation

The native editor displayed the map at 16:44–16:45 Asia/Jerusalem after an earlier black preview. Its header showed Images: 104.6 MB and Layers: 1204; Warnings showed Images memory usage: 48 MB and 15 instances during reload because of Text/Hero Time. These are distinct counters with undocumented scope. They must not be summed or treated as proof that 15 complete map bitmaps are retained. Successful server response completion also does not establish iPhone receipt, decoding or rendering.

The approved Health background was a 2270×2368 RGBA PNG, while Home and Calendar backgrounds were 1320×1377. This release isolates one asset change to reduce the former's decoded pixel footprint. It is not a proven fix for the intermittent black map.

## Change

- Re-render the exact clean Health SVG at 1320×1377, with all vector geometry, viewBox, colors and text paths retained.
- Retain the removal of the current-day row background highlight.
- Publish at a new asset URL so imported older widgets remain reversible.
- In the full private Weather 15 JSON, change only image node 85059's URL and the document description.
- Keep the name Widgy Weather 15, all 1204 layers/groups and 74 variables.
- Keep the map at 3306×1558, the live clock, city resilience repair, navigation, weather, Health values and 500 Cal goal.

## Validation

- Rebuilding the old SVG produced a byte-identical copy of the approved 320,725-byte PNG.
- The new PNG is 168,686 bytes and 1320×1377, RGBA.
- Single decoded RGBA allocation estimate: 20.505 MiB before, 6.934 MiB after; theoretical saving 13.572 MiB (66.2%). This is not a measurement of actual Widgy memory.
- Visual side-by-side review at 606×632 and a full candidate review at 1135×1184: labels and icons remain legible, panels and the clean weekly table retain their layout.
- Mean absolute channel difference at 606-pixel display width: 0.301/255, PSNR 48.37 dB. At 1135-pixel width: 0.662/255, PSNR 40.26 dB. These quantify raster differences, not native-device quality.
- Deep comparison restores only the asset URL and description and then requires exact equality with the prior full widget. All other fields pass unchanged.
- AES-GCM and gzip round-trip validation passes. New JSON: 922,356 bytes; SHA-256 7860dfd8215dfd6a2852d8582d19a4fba568394b1b36e58333e96f94f032e23f.
- Existing copy-page DOM harness passes real WebCrypto, all 3,377 formatted lines, compact mode, wrong/missing-key rejection and clipboard fallback.

## Native observation still required

Use one widget on the Home Screen, replacing the current slot; retain the old copy only inside Widgy as backup. Check Health sharpness once, then capture the editor header and Images memory usage warning under the same Home-tab conditions as the baseline. Use the widget normally; if the map goes black, record the local time and whether it is the editor or Home Screen. No repeated refresh loop or deliberate server fault is needed.

Do not claim stability from a single successful import. The new asset reduces a known pixel footprint; only native observation can establish whether it addresses the map failure.
