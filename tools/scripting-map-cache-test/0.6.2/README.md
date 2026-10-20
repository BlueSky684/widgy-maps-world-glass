# Map Cache Test 2400 — 0.6.2

Dedicated test package for 2400 x 1131 maps using the existing
f50-widget-test Vercel Preview alias and BigDataCloud city service.
Every manual and Shortcut update requests, validates and saves that exact
resolution. There is no resolution selector or dependency on the old
MapCacheTest-resolution.json setting. Opening/importing the script does not
start a download or change an existing schedule.

The menu provides one manual update, saved-map preview, fixed 15-minute
scheduling, schedule status/stop and the existing Shortcut connection repair.
The old A/B and original-resolution controls are removed. Internal sample
URL helpers retained for regression tests also request only 2400px.

## Compatibility and recovery

Install as an update to **Map Cache Test**, not as a second script. Its package
name, Shortcut entry point, notification title, folder bookmark, writer binding,
shared lock and /MapCacheTest/map-current.png remain unchanged. The existing
three- and four-line Shortcut inputs remain supported. No new Shortcut,
Widgy layout change or map-file reselection is needed.

Only already-saved current/backup maps may have the legacy 3306 x 1558 size.
This read-only compatibility preserves the last good image during migration
or a failed write. Newly downloaded candidates must be 2400 x 1131; legacy-size
responses cannot be published. Received PNG bytes are stored without iPhone
resizing or re-encoding. CRC, full-file structure, native decode, verified writes,
backup/rollback, fresh-location checks and time budgets are preserved.

Existing 5-minute schedules are recognized for status and replacement only.
The start button replaces the old schedule with exactly one repeating 900-second
notification using the existing World Glass Map Tick automation. Import does not
silently alter scheduling. Stop remains available. Notification delivery and
Widgy onscreen refresh depend on their native apps and iOS.

## Owner handoff

1. If updates are running, stop them in the existing script.
2. Import Map_Cache_Test_2400_0.6.2.scripting as an update to Map Cache Test.
3. Choose "עדכון ב־2400" once. Confirm success and 2400 x 1131.
4. Choose "הפעלה כל 15 דקות". Keep the existing Shortcut and Widgy file binding.

The prior 3306/2400 widget screenshots were visually compared at the presented
widget size, with no apparent loss of sharpness. Pixel identity is not claimed.
This release does not require another long image comparison or A/B phone test.
A native import/success check remains necessary; local mocks cannot prove iOS
background delivery or immediate Widgy refresh.

## Verification

```sh
python3 tests/make-fixture.py
node tests/verify-053.cjs
node tests/verify-download-053.cjs
node tests/verify-endpoint-060.cjs
node tests/verify-2400-062.cjs
node tests/verify-schedule-062.cjs
node tests/verify-menu-055.cjs /absolute/path/to/typescript.js
```

79 checks cover publication, input freshness, network failures, fixed resolution,
legacy recovery, the actual manual/Shortcut paths, scheduling and menu imports.
Tests use mocked native APIs; see VALIDATION.txt for precise coverage.
The fixture PNG is generated locally and must not be packaged or committed.

The server already supports 2400px; no server renderer, source masters, colors,
city labels, layout, Production deployment or paid-plan settings change in this
release. Only f50-widget-test is updated. Never commit private-config.json or the
owner .scripting package. The owner package retains the existing key and stable
Preview URL, with no temporary share link.
