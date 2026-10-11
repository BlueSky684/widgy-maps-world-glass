# Device Glass 4

Revision 4 responds to small secondary labels and crowded storage/time text in
`IMG_0267.jpeg`. System Status grows from 9 to 13px, Device Information from
9.5 to 13.5px, Battery from 9.5 to 13px, and Storage/Time Left from 9 to 13.5px.
Secondary labels use a brighter blue-grey. Connectivity labels grow to 14px,
ON/OFF to 20px, and the bottom captions to 13px. All retain Phenomena.

Storage/time title baselines are now 414px, value baselines 456px and caption
baselines 478px, giving 11px and 9px clear text gaps. The text columns move
eight pixels right, increasing icon clearance; icons align with the large
values. The upper panel ends at 323px and the lower panel starts at 336px.
Its bottom edge at 490px and 36px bottom corners retain the D3 rim clearance.
All earlier JSON/artwork pairs remain unchanged. There are still 13 layers.

## Battery accuracy investigation — 2026-10-11

The imported chart uses `1-Segment Info / Battery Level`, manual maximum 100,
and the owner's previously exported native ring schema. Text uses
`System Info / Battery Level`. No percentage correction has been applied.

Green-pixel circle fitting gives a radius of about 67.6px in both screenshots.
For `IMG_0255.png`, text is 55% and the visible end is about 190.8 degrees from
12 o'clock (about 53% including the end cap). In `IMG_0267.jpeg`, text is 50%
and the visible end is about 170.1 degrees (about 47%). Pixel thresholds,
JPEG edges and rounded caps limit the precision of these estimates. These
measurements establish a visible mismatch, not its cause or the real charge.

Neither screenshot includes the simultaneous iPhone status-bar percentage.
Apple staff confirm that battery API rounding is not specified:
https://developer.apple.com/forums/thread/732903
That makes rounding a possible limitation of the source, not proof that it
causes this ring/text mismatch on the owner's current iOS version.

The subsequent settings screenshots show Circle, clockwise, start 0, range
360, Fixed Origin, equal start/end scale, quantization 0 and forecast off.
The temporarily selected Custom shape was restored to Circle. The two Device
exports differ only in editing metadata and ring field `20` being set to 60
instead of the omitted default. That change did not visibly normalize the
battery ring to 60. The owner's Full Scale toggle also produced no confirmed
correction. Neither experiment establishes the semantics of these controls
for the one-segment Battery Level source. Restore Max 100 / Full Scale Yes.

Further pixel measurements, adjusting approximately for rounded caps, put
the endpoint near 100 degrees at 30%, 170 at 50%, 190 at 55% and 210 at 60%.
Correct endpoints would be 108, 180, 198 and 216 degrees. A 10-degree drawing
step is a hypothesis consistent with these images, not a confirmed Widgy bug.
Apple battery rounding alone does not establish the cause of the arc/text gap.
Exclusive Segment Mode concerns chart data selection; it is not evidence of
30 geometric arc segments. Developer reference:
https://www.reddit.com/r/widgy/comments/ps35mg/announcing_the_biggest_update_yet_v17_is_a_game/

The owner's 18:23:41 export, `Battery Info` by Bo Nyi, supplies two native ring
configurations retained in `native-ring-reference.json`. Its live ring has the
same Battery Level source and no additional correction/precision control. Its
second, low-opacity backdrop ring uses `Custom Value` and **field 21 = 100**.
This identifies a native constant input without guessing a schema field.
The reference's equal scales are 50, versus 6.405694 in Device; its frame is
1400 square, versus 424.150943. No screenshot of this reference was supplied,
so its accuracy has not been established.

`node tools/device-glass/build-ring-check.mjs` builds a separate five-layer
diagnostic: four native rings at 25, 50, 75 and 100, plus an embedded background
with input labels and exact endpoint markers. It derives constant field 21
from the supplied reference and uses Device's frame size, thickness and lime.
No battery provider, JavaScript, remote image or percentage correction is used.
Copy page: `/tools/widgy-device-ring-check.html`; import name:
`Widgy Device Ring Check 1`. A real Widgy screenshot is still needed. Static
labels show configured inputs, not readings; the background does not draw any
lime progress arcs. A short fixed-value arc would implicate rendering/settings
independently of battery data, but would not alone prove the 10-degree model.

D4 remains unchanged, with no battery-accuracy correction claimed. Its local
SVG layout proof draws an ideal arc, not Widgy's native renderer.

## Previous panel correction

Revision 3 responds to the lower panel almost touching the outer rim in the
owner's `IMG_0256.jpeg`. The panel, labels, icons and six native connectivity /
storage / time text layers move up six pixels in the 530px design coordinates.
The panel retains its width, height and 15px top corners; its bottom corner
radius increases to 36px. This leaves about 12px clearance from the outer rim
at the closest corner (about 11px from the secondary rim), compared with about
1px before. The panel-to-panel gap is 11px. Text size and internal spacing are
unchanged. Both earlier JSON/artwork pairs remain available unchanged.

The layout proof verifies this geometry with the measured native corner mask;
the revised spacing still needs inspection on the owner's iPhone. Battery
chart settings, provider bindings and other widget behavior are unchanged.

## Previous phone corrections

Revision 2 responded to the owner's `IMG_0252.png` native export:

- The battery text displayed 60%, while its chart displayed no active arc.
  Revision 1 incorrectly used the text category `System Info` for the chart.
  Revision 2 uses `1-Segment Info / Battery Level`. Published native chart
  exports use this category for battery (for example the creator's JSON at
  https://www.reddit.com/r/widgy/comments/lb0337/). This source correction is
  confirmed to draw a lime arc in `IMG_0255.png` and `IMG_0256.jpeg`. Exact
  arc-to-percentage correspondence remains under review; the local SVG proof
  cannot validate native chart precision.
- The first PNG had transparent six-pixel gutters. Widgy's white background
  showed through them, and its native corner mask clipped the 49px artwork
  corners. Revision 2 is fully opaque, with the rim inset eight pixels. Its
  continuous-corner curve is fitted to the native 530px alpha mask (radius
  120.4, exponent 2.833; boundary fit RMS 0.47px).
- Native caps requested as 53/23/19/31px appeared as 50/21/18/29px. Native line
  boxes increase from 1.65 to 1.75 times target cap height, retaining their
  measured baselines. Hours retain their native unit with a separating space.

The layer count remains 13. The SVG proof cannot execute the native chart.

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

Generated import: `tools/Widgy_Device_Glass_4.json`.
Copy page: `/tools/widgy-device-glass-copy.html`.
Internal proof: `work/device-glass/layout-proof.png` (illustrative readings,
not a phone screenshot and not used in the widget).

## Phone validation

Verify in the editor and the large home-screen slot: fonts and text fitting,
battery ring correspondence/direction at the current value, charging symbol
while plugging/unplugging, Wi-Fi/Bluetooth after toggling and refreshing, and
storage/time units. The ring uses the exported native chart schema with an
estimated first thickness calibration; native iPhone rendering is authoritative.
Estimated battery hours are Widgy's estimate, not a guaranteed runtime.

Weather/runtime hashes are checked against the baseline. Public-site changes
only append this widget's copy page, script and JSON; existing entries stay.
