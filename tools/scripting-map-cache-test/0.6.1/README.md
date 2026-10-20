# Map Cache Test 0.6.1 — 2400px with original-resolution fallback

Uses the existing f50-widget-test Vercel Preview alias and map access key.
Default output is 2400 x 1131. The two manual buttons select 2400 or restore
3306 x 1558, then download a fresh map. The choice is stored in the existing
Scripting app group so the Shortcut writer uses the same size. A selection
persists even if its subsequent download fails; the last valid image remains.
The menu offers the preferred 15-minute schedule. Import itself does not
start a download, change notifications or rebind the map file.

The existing script name, map-current.png, folder bookmark, writer lock,
location checks and timeout/publication gates are retained. New candidates
must match the requested dimensions; existing current and backup files can
be either supported size. This permits migration and restoration without
invalidating the owner's last good 3306px map. The script saves the received
PNG bytes exactly and does not resize or re-encode on the phone.

The server adds 2400 to the width allowlist. The approved full-resolution
compositor, source masters, label placement, sRGB profile and rounded mask
are unchanged. The existing post-composite resizing path supplies 2400px.
Legacy clients still request and receive 3306px.

## Owner handoff

1. Pause automatic map updates if running. Import this package as an update
   to the existing Map Cache Test script, retaining the current Shortcut.
2. In Scripting choose "עדכון ב־2400" and wait for successful publication.
3. Return to the existing widget and switch Calendar -> Home once to inspect
   its ordinary display size. Do not reselect map-current.png.
4. If acceptable, choose "הפעלה כל 15 דקות". If visibly worse, choose
   "חזרה לרזולוציה המקורית" to select and download 3306px instead.

This is a visual comparison, not a new long phone reliability test. Pixel
identity with the original is not claimed. Native import, UIImage decode,
Widgy display refresh and final appearance require the owner's device.
A successful file write does not guarantee immediate onscreen Widgy refresh.

Four local scene samples averaged 4.28 MB at 3306px and 2.71 MB at 2400px,
about 36.6% less transfer. At one download every 15 minutes for 30 days the
map-only estimates are 12.3 GB and 7.8 GB. Retries, other services and traffic
are excluded; this is not a guarantee of total free-plan usage.

Never commit private-config.json or the owner .scripting package. The owner
package retains the existing mapAccessKey and contains no temporary Vercel
share link. No Production deployment or paid-plan change is part of this work.

## Reproduction

```sh
python3 tests/make-fixture.py
node tests/verify-053.cjs
node tests/verify-download-053.cjs
node tests/verify-endpoint-060.cjs
node tests/verify-resolution-061.cjs
node tests/verify-menu-055.cjs /absolute/path/to/typescript.js
```

Test filenames inherited from earlier releases identify their original suite.
The added migration suite exercises both resolution choices, recovery and the
actual Shortcut writer with mocked native APIs. See VALIDATION.txt for status.
