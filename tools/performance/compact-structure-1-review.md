# Compact Structure 1 — 2026-10-07

The owner explicitly requested reducing the full widget's excessive layer and
Calendar variable count before receiving the next full-widget test. This copy
is based on the locally prepared Full Widget External Map Test 1; the original
private native export remains unchanged. Do not publish either private JSON.

## Inventory and implemented changes

| Item | Native source | Compact copy |
| --- | ---: | ---: |
| Total layers | 1514 | 1289 |
| Total variables | 82 | 40 |
| Calendar week separator shapes | 300 | 75 |
| Calendar dot URL scripts | 25 | 1 shared minute clock |
| Navigable month panes | 25 | 25 |
| Native month grids | 75 | 75 |
| Today cell groups | 95 | 95 |
| Home day progress drawings | 100 | 100 |

`build-full-external-map-test.mjs` first replaces the Files/Base64 map route
with the native JSON image provider verified in the owner's 687-byte export,
removing the two old map variables (82 to80). The map keeps its original frame.
It still uses the existing fixed test image, without a personal marker; this
is not a finished live location/day-night producer.

`compact-widget-structure.js` then:

- Combines each 3/4/5-line set into one native custom-shape polygon. Each
  rectangle is a closed contour; reversed, coincident left-edge connectors
  have zero winding. Original constant coordinates, fill material, ordering
  relative to other drawings, and the enclosing conditions are retained.
  This removes225 drawings without new bitmap or network resources.
- Replaces25 private dot URL scripts with one String minute-clock variable.
  Each original private URL remains on its existing native Web URL image and
  receives the same minute suffix. Native cache flag, crop, frame, provider,
  offset, authentication token and cadence expression remain unchanged.
- Inlines14 bare single-use String sources (13 Calendar JSON fields and the
  steps label script) into their sole native text consumer. The original
  provider source object is copied exactly; reused/conditional variables stay
  shared. This reduces global indirection, not the number of Calendar fields.
- Removes unreachable steps_goal and steps_progress after following both
  `${widgy.name}` substitutions and UUID consumers transitively. The native
  step ring already holds its own original10000 goal.

The candidate is1289layers/40variables and1,100,552bytes, versus1,146,465bytes
for the original private input. Layer count fell14.9%; variable count51.2%.
Do not imply that JSON bytes or measured latency fell by these percentages.

## Validation completed

Run locally with an authorized private external-map baseline:

```
node tools/build-compact-widget.mjs INPUT OUTPUT REPORT
node tools/test-compact-widget.mjs INPUT
```

Tests verify input immutability, a full-document mutation whitelist, unique
layer identifiers, valid native tap targets, no dangling variable references,
exact inlined provider objects, and byte-identical resolved calendar dot URLs
at seven epoch/minute/day/leap-day boundaries. All75 separator sets retain
rectangle coordinates within1e-9 logical units. Three distinct layouts at
367/707/1134/1600px have byte-identical SVG raster pixels (12 comparisons).
All146097 dates in400 Gregorian years retain their original today badge.
All25month panes, native month grids, navigation, Home/weather/fitness artwork,
fonts, calendar city pipeline and external map provider are unchanged from
the external-map baseline. Tests do not execute the Widgy renderer.

## Remaining work and limits

The95today badges contain475 nodes (group,disc,three text draws each). These
were introduced after earlier native Today styling did not reproduce the
approved bold date. The100day-progress shapes each have distinct rounded
geometry and a visibility state. They are not redundant copies that can be
safely deleted. Replacing them with native dynamic geometry/Live Progress
requires a real exported sample of the supported property bindings; none of
the current exports has an automated/multi-keyframe scalar or that layer type.
No speculative JSON field or loss of approved date styling was introduced.

Native import, custom-shape rendering, dot refresh, month navigation and
latency still require the phone. A lower layer/variable count is a structural
result, not a measured speedup. The map's independent minimal navigation test
was acceptable after idle and image revisions; the full candidate is untested.
The public copy helper only reads a file selected locally by the user and has
no upload/network processing of the private JSON.
