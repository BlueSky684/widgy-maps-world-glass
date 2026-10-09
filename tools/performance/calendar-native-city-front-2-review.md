# Native City Spelling Test 2 — 2026-10-09

07:22 owner IMG_0105: Spelling Test 1 still has no city or country and no
perceived speed improvement. Retire Test 1 as a display candidate.

Concrete rendering defect found: its Calendar location group 81871 is after
Static Chrome 80408, so behind it in Widgy's first-entry-on-top paint order.
Original C13 appended this fallback after the background. The main prefix row
was above chrome, explaining why source availability and fallback visibility
must not be conflated. Native City Spelling 1 removed the main row but preserved
the covered fallback. Prior source/geometry equality tests missed paint order.

Actual Calendar_Glass_Chrome_C8.png is 1320x1377. Location bounds map to
(114,186)-(649,247); all 32635 pixels have alpha 255. Even a correctly selected
and populated fallback would be covered. This is a concrete defect, not proof
that every earlier intermittent city symptom has the same cause.

Test 2 moves that exact group before Full Date 80338, at the former main city's
place in the stack. No group/source/condition/geometry/variable/other-node field
changes. Ashqelon-to-Ashkelon remains conditional and dynamic. Map/Home/GPS,
all Calendar data, clock and gauges remain exact. All source evaluation remains
as before: this is a display fix, not a speed optimization.

Regression: restore the one array move and metadata and deep-compare the entire
document; check city precedes date and chrome; inspect the actual chrome alpha
over the full location bounds. Verify encrypted copy and configured build.
Phone must confirm visible city and country and their persistence on tab return.
Native condition/data issues remain possible even after fixing this ordering.

Configured build, whole-document reorder regression, actual chrome alpha check,
exact encrypted clipboard, invalid-key/tamper rejection and clipboard fallback
passed. Output 917655 bytes; SHA256
912ee6d51d62395f62610d3ca7b35d723ccaab128bda3f50a033cec83e40a986.
At 07:25 the owner asks how this helps speed. Clarified it does not promise
speed improvement: this repairs display correctness before further latency
work. No native transfer/decode timing has yet isolated the remaining delay.
