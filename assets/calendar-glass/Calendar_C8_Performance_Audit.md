# C8 — repair, footprint audit, and controlled latency isolation

Date: 2026-10-02. User evidence: IMG_9690 (3,427 steps, only the endpoint of
the ring visible) and IMG_9691 (1,884 layers, editor image counter 94.7 MB).

## What was proved and repaired

C7 changed `>=` to equality on 100 steps layers. Unlike the day-progress bar,
these are not cumulative full arcs: R3/R4 deliberately made short, overlapping
convex capsules to avoid Widgy filling the central hole. Equality left only
one capsule. C8 restores the exact C6 polygons and conditions, with the same
10,000-step goal. No font or ring thickness changes. The regression is
reproduced by rasterizing C7 at 34%; C8 is checked at every integer percentage,
including continuity, the hollow center, and the unfilled remainder.

## Image footprint

The editor's image counter is not a tap-time measurement or proof that every
image is resident on every tab. The following are calculated RGBA buffer
sizes of our production assets, not measurements of Widgy's process RSS:

| Asset | Before | C8 | Decoded bytes before → after |
|---|---:|---:|---:|
| Home chrome | 3306 × 3449 | 1320 × 1377 | 45,609,576 → 7,270,560 |
| Calendar chrome | 2268 × 2366 | 1320 × 1377 | 21,464,352 → 7,270,560 |
| Live map | 3306 × 1558 | unchanged | 20,602,992 → unchanged |

The two chrome buffers together drop from 63.97 MiB to 13.87 MiB, about
78.3%. They are rendered from the exact approved SVGs, with the same colors,
shapes, sRGB and lossless PNG encoding, at a resolution above the 1134-pixel
large-widget reference. This reduces raster resolution of chrome only; it is
not a claim of byte-identical pixels or a 78% improvement in tap latency.
The map and its two approved master assets are untouched.

The map buffer calculation is exactly `3306 * 1558 * 4` bytes. Image-counter
overhead/alignment and other native rendering allocations are not established.
We do not claim to explain the entire 94.7 MB number with these three buffers.

Visible-pixel comparison at 1134 × 1182 is saved in
`Calendar_C8_Chrome_Check.json`; sampled borders and ring were also inspected.

## Layer and stale-resource audit

Total: **1,884 → 1,765**. The 119 removed layers consist of:

- 19 explicitly hidden legacy layers with no button references, replaced
  earlier by the chrome/map artwork. Their IDs and names are in Build Stats.
- 70 redundant Calendar controls: 25 identical reset targets become one;
  50 arrow symbols become four shared symbols including the two boundary
  states. All month actions explicitly retain the selected tab, month and
  correct arrows. The complete +/-12-month range stays available.
- 30 impossible Today-badge layers in six-row months. Reachability is checked
  for all 146,097 days of a 400-year Gregorian cycle.

Also removed: 16 obsolete custom-weather image URLs and five unused font
catalog entries. Current weather art uses native vector shapes/SF Symbols;
all Text/Calendar fonts with consumers are kept. No font is uninstalled.

Remaining hidden layers have purposes: inactive tabs/months, alternative
4/5/6-week layouts, weather states, language branches and progress states.
The two tiny `CALENDAR Nav Binding` shapes are the calendar icon's binding
tabs, not unused data bindings. Deleting them would damage the icon.

## Calendar rendering

One native calendar grid is selected for the active month and row layout. Stored grids include alternate layouts. Native Agenda, JavaScript startup and iOS scheduling still require profiling on the phone.

## Event dots: not silently marked complete

Dots remain above the date in C8. The native offset field has not been
identified in the user's exported Calendar samples or a reliable public
format reference. The format is not a stable public schema. Guessing fields
or adding a duplicate calendar solely to move dots would introduce new
rendering risk/work. One small native export with Agenda Symbol Y offset
changed remains the precise input needed. A native Today Color export could
also replace the manual Today-badge tree, if supported as expected.

## Primary sources read

- Developer: hidden layers skipped; tap reloads widget:
  https://www.reddit.com/r/widgy/comments/qnh7m6/question_on_memory/
- Developer: variables first, layers second:
  https://www.reddit.com/r/widgy/comments/1wgx4k4/variables_order/
- Developer: large Agenda data can slow rendering:
  https://www.reddit.com/r/widgy/comments/1kghea6/load_times/
- Developer: original image size, gradients and symbols affect memory:
  https://www.reddit.com/r/widgy/comments/ux4jws/why_isnt_the_content_loading_in_my_widget_stack/
- Developer: the serialized widget format changes:
  https://www.reddit.com/r/widgy/comments/1byi24z/documentation_for_widgy_uri_schema_widgy_binary/

Source statements are supporting context, not substitutes for phone profiling.
