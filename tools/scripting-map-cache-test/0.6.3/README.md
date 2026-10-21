# World Glass daily-use trial — 0.6.3

Interim release after the owner's successful 2400 x 1131 / 15-minute phone
trial. Successful Shortcut updates are silent; failures request one concise
local notification. The temporary menu remains for diagnostics and setup.
A later final release without a menu or result notifications is the owner's
next goal after several days of ordinary use; it is not this interim release.

## Owner handoff

1. Import Map_Cache_Test_2400_0.6.3.scripting as an UPDATE to Map Cache Test,
   not a second script. Keep its existing name so the Shortcut stays connected.
2. In the existing Shortcut "בדיקת מפה", delete ONLY the final
   "הצגת העדכון" / Show Notification action. Leave the Scripting Run action,
   location, dates and Text input unchanged. The old unconditional action would
   otherwise continue displaying a notification, even for an empty result.
3. Run that Shortcut once. A successful run produces no result notification.
   In Scripting, "תוצאת העדכון האחרון" shows the fresh success and its time.
4. Tap "בדיקת התראת כשל" once and check Notification Center. This is an
   explicitly labelled test notification; it does not simulate a map failure,
   change the map, overwrite the latest result or change scheduling.

The existing repeating 15-minute schedule continues. No repeated one-hour
phone trial, new Shortcut, map-file selection or Widgy layout change is needed.
Keep the existing Scripting notification permissions: the recurring
World Glass Map Tick notification drives the owner's working automation.
Removing result banners is separate from this scheduling mechanism.

## Behavior and limits

The intent calls the structured writer outcome, never parses a Hebrew success
message. Success returns empty text and never schedules a result notification.
A caught update failure requests one immediate error notification under a title
and purpose DIFFERENT from World Glass Map Tick; tapping it cannot run the
script. No retry loop or new recurring schedule is introduced.

The most recent completed Shortcut result is saved, best effort, in one bounded
app-group JSON record (MapCacheTest-last-update.json): completion time, version,
success/failure, safe diagnostic text and notification-request status. It does
not log coordinates, authenticated URLs, the map key or raw native errors.
Diagnostic write failures never block a real failure alert or convert a
successful map publication into a map failure. Missing/corrupt reports are
reported explicitly; always inspect the recorded timestamp for freshness.
A test notification does not overwrite this record.

Notification.schedule accepting a request is not proof that iOS displayed it.
A failed notification request is recorded as ALERT_FAILED and retained in the
Shortcut result. Failures before Scripting is invoked, a killed process and
missed automations cannot reliably be reported by this script. No alerts alone
are therefore not proof of successful updates. The latest-result view exists
for occasional checking during the daily-use trial.

## Preserved map pipeline

Every new manual/Shortcut download requests, validates and publishes exactly
2400 x 1131 PNG bytes without resizing or re-encoding on the phone. The same
f50-widget-test permanent Vercel Preview alias and BigDataCloud service are used.
The script name, intent input, folder bookmark, writer binding, SQLite mutex,
map-current.png path, PNG validation, native decode, verified writes, backup,
rollback, fresh-input checks and deadlines remain unchanged. Old saved
3306 x 1558 maps remain readable only for recovery; new candidates must be 2400.
The only scheduler change is its explanatory status text.

Only tools/scripting-map-cache-test/0.6.3 is added on f50-widget-test.
No server renderer, source image, colors, labels, layout, Production setting or
paid-plan change is part of this release. Never commit private-config.json or
the owner .scripting archive. The archive retains the existing private config.

## Verification

```sh
python3 tests/make-fixture.py
node tests/verify-053.cjs
node tests/verify-download-053.cjs
node tests/verify-endpoint-060.cjs
node tests/verify-2400-062.cjs
node tests/verify-schedule-062.cjs
node tests/verify-menu-055.cjs /absolute/path/to/typescript.js
node tests/verify-quiet-063.cjs /absolute/path/to/typescript.js
```

90 local checks passed, using mocked native APIs. The 11 new checks execute the
actual intent/quiet/writer/bridge/core graph with native boundaries mocked.
They cover silent success, network/input/publication failures, report failure,
notification failure, unexpected exceptions, safe diagnostics, preserved
scheduling and the explicit notification test. See VALIDATION.txt.
Official notification API: https://scriptingapp.github.io/guide/Device%20Capabilities/Notification/
