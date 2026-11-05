# Native divider A/B candidate

## Outcome: rejected after on-device trial (2026-11-05)

The user reports no improvement and noticeably worse transitions with this
candidate. No stopwatch timings were supplied. Do not promote this trial as
an optimization or use it as the baseline for further changes. The working
native-month-heading version, with 500 objects and 24 JS divider images, remains
the preferred baseline. Its original archive was preserved separately.

The extra 48 conditional leaves may outweigh the removed JavaScript work, but
the report does not isolate the rendering or scheduling cause. Structural and
pixel equivalence checks establish correctness only; they did not predict
phone performance.

The working widget uses 24 JavaScript image sources to select one of three
embedded PNGs for the non-current months' week dividers. The current month
already uses three conditional native custom shapes. This candidate copies
those established shapes into the other 24 month panels, using each panel's
existing 4/5/6-week calendar-grid predicate and preserving their paint position.
The next-layer-ID counter is advanced past the 48 new identities so later
edits do not collide with them.

The candidate removes all 24 divider JavaScript sources (42 total JS sources
become 18) and adds 48 leaves (450 become 498; 50 groups remain). Each panel
still selects one divider variant when its layout value is available. This is
a tradeoff between script/image work and native layer processing, not a proven
performance gain. There is no iPhone/Widgy runtime or phone timing here.

No navigation action, date heading, date grid, Today marker, data endpoint,
global value, map, tab, refresh policy, backend code, or provider data changes.
The current month is byte-for-byte unchanged as a JSON subtree. If the shared
layout value is unavailable, native dividers follow the same predicates as
the date grids; the old JS image's local-date fallback is removed along with
its script. Native date grids already depend on that shared layout value.

Validation compares all unrelated export fields and ordered visible elements.
Both reset and persistent navigation models cover all 25 months. An independent
Gregorian calendar reference covers 120,000 month/offset pairs over 400 years.
Every RGBA pixel of all 72 prior divider PNGs is compared with area-sampled
coverage of the new native polygons at the PNG source scale. This establishes
geometry and ink equivalence, not identical final iOS antialiasing. The archive
contains only `Widgy Weather.widgy` and passes raw-deflate/ZIP round-trip checks.

On-device A/B: preserve the working widget, import the candidate as a separate
copy and assign the same slot for comparison. Compare initial and repeated
month changes, Home↔Calendar, and months with different row counts. Check
headings, Today marker, event dots and divider alignment. Timing must be
measured on the phone before selecting the candidate as the preferred version.
The original remains the fallback if the extra layers negate the JS reduction.

Run:

```sh
python3 tools/build-widget-native-dividers.py /private/baseline.json /private/trial --compressor /path/to/zopfli
python3 tools/test-widget-native-dividers.py /private/baseline.json /private/trial
```

Pillow is required for the pixel comparison. Private exports and authenticated
URLs must never be checked into the repository.
