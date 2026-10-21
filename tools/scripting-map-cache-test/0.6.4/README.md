# World Glass bounded recovery — 0.6.4

Adds one fresh automation invocation after a caught pre-publication timeout.
The observed 0.6.3 failure took 67.2 s, with a 61.2 s observer gap at image
validation. The correlated Preview request finished HTTP 200 in 1.626 s.
These observations do not establish whether the client paused, a native bridge
blocked, or another device-side condition caused the gap. This release improves
recovery; it does not claim to fix iOS suspension or the unknown root cause.

## Owner handoff

1. Import Map_Cache_Test_2400_0.6.4.scripting as an UPDATE to Map Cache Test.
   Keep the existing name and the existing 15-minute automation.
2. Keep the already-working Shortcut condition unchanged:
   If Result contains `לא הושלם`, Show Notification with that Result.
   Otherwise do nothing. Do not restore an unconditional success notification.
3. Run the original Shortcut once. In the menu, `תוצאת העדכון האחרון` must
   show a fresh success with version 0.6.4. Empty Shortcut output alone is not
   proof of success: it can also mean that a single retry was requested.
4. Continue ordinary use. After a caught timeout, a fresh tick is requested for
   approximately one minute later. A fresh successful result following that
   timeout is the device evidence needed to confirm recovery delivery.

No new Shortcut, file selection, layout change, resolution change or repeating
schedule setup is required. Keep Scripting's master Allow Notifications ON and
the owner's hidden presentation settings unchanged. Visible failure alerts are
provided by the conditional Shortcuts action. `silent: true` only suppresses
sound; it does not itself hide a banner.

## Recovery policy

- Eligible codes: UPDATE_TIME, DOWNLOAD_TIMEOUT, DOWNLOAD_LATE_HTTP,
  DOWNLOAD_LATE_BODY and DOWNLOAD_LATE_CONVERT, only before current publication.
- Require exactly one recognized existing 15-minute World Glass Map Tick.
  A stopped/unknown schedule is never enabled by an update.
- Atomically reserve slot 1 in map_recovery_v1 in the existing app-group SQLite
  database. The durable UNIQUE row prevents a chain of retries across runs.
- Schedule one nonrepeating 60-second notification with the same exact title
  used by the owner's automation, a separate purpose, and an opaque token.
  Verify that it is pending and that the regular tick still exists. Check that
  the reservation is still owned and scheduling has not itself been delayed.
- Only after verification, defer the first failure banner. Record ok=false and
  alert=retry-queued; never record a queued retry as map success.
- The automation runs the original Shortcut again, obtaining new location and
  dates and invoking Scripting in a new intent. No old bytes, input timestamp,
  request URL or elapsed-time budget is reused or refreshed in place.
- A later failure returns safe failure text immediately. No additional retry is
  permitted until a successful Shortcut update clears the reservation.
- Success cancels any pending recovery tick and clears only the reservation it
  observed. If cleanup fails, keep recovery disarmed; never turn a verified
  publication into a reported map failure.
- If scheduling/state verification fails, report the original failure at once.
  Input, file, lock, corrupt-image, HTTP and generic network failures remain
  immediate in this version. Publication failures retain existing rollback.
- Foreground Stop removes both regular and one-off pending notifications.

PNG structure checking and native image decoding now have separate operation
timings. Native decode, CRC/dimension checks, deadlines, mutex, freshness guards,
verified writes, backup and rollback remain enabled. New images remain exactly
2400 x 1131. The map server, Preview URL and Production are unchanged.

## Limits

Notification registration is not evidence of delivery or automation execution.
The one-minute delay is requested, not guaranteed. If iOS kills the process,
does not deliver the tick, or does not run the Shortcut, this script cannot
guarantee an alert. The next ordinary run can resolve the pending failure; the
latest-result timestamp remains useful for occasional checks. Retained writer
locks after termination remain an existing fail-closed limitation.

The exact cause of the device delay and automatic delivery of the new one-off
tick still need device observation. This is an interim recovery release, not
the final no-menu/no-notifications script.

## Verification

106 local checks passed, including 14 new recovery checks. Recovery tests execute
the actual intent/quiet/writer/publisher/recovery graph with real SQLite
uniqueness and mocked native boundaries. They reproduce the 61.2-second decode
pause, confirm no publication, fresh invocation recovery, conditional alert
output, reservation persistence, no retry chain, safe rollback, stopped/uncertain
schedules, expired input, concurrent reservation and cancellation.

Run from this directory:

```sh
python3 tests/make-fixture.py
node tests/verify-053.cjs
node tests/verify-download-053.cjs
node tests/verify-endpoint-060.cjs
node tests/verify-2400-062.cjs
node tests/verify-schedule-062.cjs
node tests/verify-menu-055.cjs /absolute/path/to/typescript.js
node tests/verify-quiet-063.cjs /absolute/path/to/typescript.js
node tests/verify-recovery-064.cjs /absolute/path/to/typescript.js
```

Source lives only on f50-widget-test. Never commit private-config.json or the
owner archive. The package retains the owner's existing private configuration.

Primary API references:
- https://scriptingapp.github.io/guide/Device%20Capabilities/Notification/
- https://scriptingapp.github.io/guide/Utilities/SQLite/Executing%20SQL%20and%20Query
