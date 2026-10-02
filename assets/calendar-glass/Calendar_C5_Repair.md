# Calendar C5 repair

## Device evidence

The user reports that either C4 month arrow waits for several seconds and then
shows Home, and that tab/button responses are slow. C4's native dots and arrow
appearance were verified in IMG_9682. Navigation was not working on device.

## Corrected button semantics

C4's local test wrongly modeled ordinary buttons as incremental visibility
updates. Ordinary Widgy buttons reset unspecified layers to default; additive
buttons are a distinct feature (developer announcement:
https://www.reddit.com/r/widgy/comments/1dszp3p/announcing_widgy_v34/).

C4 month actions showed a month child but omitted Calendar (default hidden) and
Home (default visible). The regression test now reproduces that Home reset.
C5 shows both Calendar 247 and the target month, hides Home/Weather/Fitness,
and hides all other months. Selected-Calendar reset uses the same full state.
The emitted multi-layer show list still needs on-device confirmation; the
local test verifies intended state, not Widgy's native parser or runtime.

## Reduced repeated computation

C4 introduced 25 global JavaScript month-row calculations. C5 replaces them
with one date-only script producing an offset/row-count lookup. Existing native
contains conditions select the 4/5/6-week layouts. Global variables decrease
from 59 to 35, without reducing the +/-12-month range or altering appearance.

The 75 native month layers and the C3 title/date overlays remain. No on-device
timing or memory profile is available, so reduced script count is not proof of
a particular latency improvement, nor proof of a memory-related crash.

Build: `node tools/build_widgy_calendar_c5.mjs`

Verify: `node tools/test_widgy_calendar_c5.mjs`

Tests reproduce the C4 reset and verify 75 navigation/entry/reset cases against
default-restoring semantics, 8,100 month/date combinations, unchanged visual
layers and Home, and preservation of the original R12/C2 copy handler.

Native Agenda marker placement is unchanged; moving markers below the date
still requires an observed export for the Agenda Symbol Offset Y setting.
