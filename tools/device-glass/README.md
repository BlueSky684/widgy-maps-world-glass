# Device Glass 2

Revision 2 responds to the owner's `IMG_0252.png` native export. Revision 1
remains available as an unchanged JSON and artwork pair.

- The battery text displayed 60%, while its chart displayed no active arc.
  Revision 1 incorrectly used the text category `System Info` for the chart.
  Revision 2 uses `1-Segment Info / Battery Level`. Published native chart
  exports use this category for battery (for example the creator's JSON at
  https://www.reddit.com/r/widgy/comments/lb0337/). This source correction is
  not yet validated in the owner's current native ring renderer.
- The first PNG had transparent six-pixel gutters. Widgy's white background
  showed through them, and its native corner mask clipped the 49px artwork
  corners. Revision 2 is fully opaque, with the rim inset eight pixels. Its
  continuous-corner curve is fitted to the native 530px alpha mask (radius
  120.4, exponent 2.833; boundary fit RMS 0.47px).
- Native caps requested as 53/23/19/31px appeared as 50/21/18/29px. Native line
  boxes increase from 1.65 to 1.75 times target cap height, retaining their
  measured baselines. Hours retain their native unit with a separating space.

The layer count remains 13. Re-check the ring and frame in Widgy; the SVG proof
cannot execute the native chart. It is not evidence that the arc now works.

Separate native Widgy trial on `f50-widget-test`. Baseline commit:
`e86659da861ce47ea82cbac1acdd0e0e9c281b37` (Weather 15).

The selected design has a metallic battery dial, device details and one lower
panel: connectivity above storage/time. Storage uses three rounded offset
layers. Original Phenomena outlines are baked into static labels; live text
uses the existing `Phenomena-Regular` and `Phenomena-Bold` font names.

| Component | Widgy layers |
| --- | ---: |
| Embedded glass, frame, dial, labels and fixed icons | 1 |
| Native battery ring | 1 |
| Battery percentage, model, iOS, storage, estimated time | 5 |
| Wi-Fi and Bluetooth ON/OFF, separate active/inactive colours | 4 |
| Original charging smart symbol | 1 |
| Original refresh tap action | 1 |
| Total | 13 |

`native-source.json` retains the eleven necessary layers and top-level settings
from the owner's 107-layer iPhone Status export of 2026-10-11. It contains
provider definitions, no recorded readings or credentials. Provider bindings,
number formatting, charging symbol and refresh behavior are preserved.
Percentage punctuation moves to the static background; storage's redundant
`GB Free` replacement is removed. Native storage/time units remain native and
share the number's font size, avoiding extra unit layers and hardcoded GB.

The background is a 1060px indexed PNG embedded as a data URL, using the image
transport previously validated by the Home embedded-backdrop trial. There is
no JavaScript or remote artwork URL in the imported widget. This does not imply
instant updates: Widgy/iOS still control provider values and refresh scheduling.

Build from repository root:

```sh
node tools/build-device-glass.mjs
node tools/device-glass/test.mjs
node tools/build-public-site.mjs
```

Generated import: `tools/Widgy_Device_Glass_2.json`.
Copy page: `/tools/widgy-device-glass-copy.html`.
Internal proof: `work/device-glass/layout-proof.png` (illustrative readings,
not a phone screenshot and not used in the widget).

## First phone validation

Verify in the editor and the large home-screen slot: fonts and text fitting,
battery ring correspondence/direction at the current value, charging symbol
while plugging/unplugging, Wi-Fi/Bluetooth after toggling and refreshing, and
storage/time units. The ring uses the exported native chart schema with an
estimated first thickness calibration; native iPhone rendering is authoritative.
Estimated battery hours are Widgy's estimate, not a guaranteed runtime.

Weather/runtime hashes are checked against the baseline. Public-site changes
only append this widget's copy page, script and JSON; existing entries stay.
