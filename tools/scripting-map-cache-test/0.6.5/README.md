# Map Cache Test 2400 — 0.6.5 native-handoff candidate

This is a controlled transport experiment, not a claim that iOS background
execution has been fixed. In the 0.6.4 overnight run, repeated download timeouts
lasted minutes, followed by a 3.6-second successful update at 05:40. These client
observations alone do not identify the responsible runtime, network or server.

## Owner setup

Import as an update to **Map Cache Test**, preserving the script identity.
Stop the 15-minute schedule while editing the original **בדיקת מפה** Shortcut.
Keep a duplicate of the old Shortcut as a backup, but do not schedule it.
The complete Hebrew step-by-step setup is in the installed menu under
**הוראות שינוי הקיצור — 0.6.5**, sourced from `setup.ts`.

The new Shortcut flow:

1. Keep location and the two original ISO date measurements. Prefix the existing
   four-line Text input with `NATIVE2400` on a new first line.
2. Run Map Cache Test with that Text as Parameter. Rename this result
   **כתובת המפה**. It contains a private credential: never notify/log/share it.
3. If that result begins with `https://`, Get Contents of URL with it, method GET.
   Pass the downloaded file directly, with no image conversion or resizing.
4. Run Map Cache Test a second time: Parameter = the FIRST result URL;
   **File URLs** = Get Contents of URL's downloaded file. Texts and URLs empty.
5. If the SECOND result contains `לא הושלם`, Show Notification with that result.
   Otherwise nothing. In the outer Otherwise branch, notify only if the FIRST
   result contains `לא הושלם`. Remove the old condition outside this structure.
6. Run manually with scheduling stopped. Verify a new native-history entry is
   successful, version 0.6.5 and the result explicitly says native Shortcuts
   download + script publication. Inspect Widgy separately. Empty output is not
   proof of a successful update.
7. Enable 15-minute updates only after that manual success. Verify two automatic
   entries before another locked overnight test. Inspect history BEFORE a manual
   run in the morning. Keep existing notification preferences unchanged.

Import alone DOES NOT switch transport. Unmodified three/four-line Shortcuts
and the foreground manual-update button deliberately retain the old path.
The existing automation title **World Glass Map Tick**, saved-map path and
Widgy binding do not change. This package does not install or edit Shortcuts.

## Native protocol and safety

- Preparation validates fresh input, existing folder authority and saved map,
  writes one durable waiting record, then returns the private download URL.
  It does not make an HTTP request or hold a writer lock during the download.
- An opt-in authenticated Preview endpoint returns the original 2400 x 1131
  PNG plus one CRC-protected tEXt transfer identifier. The pixels, ICC profile,
  compressed image chunks and renderer are unchanged. Ordinary callers retain
  the original response. Native responses are no-store binary attachments;
  even conditional GETs return a complete body, never 304.
- Finalization accepts exactly one local file, checks PNG structure, CRCs,
  dimensions, transfer ID and native image decoding. It validates the current
  pending token under the existing SQLite writer lock and rejects an old or
  duplicate continuation. If another writer changed current, it is preserved.
- A 20-second wall-clock handoff budget and the original 120-second input age
  guard are not reset by delays or a new runtime. A late continuation cannot
  begin overwriting current. Staging, backup, verified readback and caught-write
  rollback remain enabled. No claim of crash-atomic writes is made.
- A committed writer lock is never stolen on a timer. A terminated writer or
  unconfirmed publication intentionally fails closed and requires investigation.
- Up to 64 native runs are retained in app-group SQLite, including previous
  failures after a later success. No coordinates, URLs, key, file paths or image
  bytes are stored in that history. The latest result remains available too.

## Detecting a Shortcut that stops during download

Get Contents of URL can terminate the Shortcut before the second script action.
A local catch in Scripting cannot intercept that separate action.

With exactly one recognized 15-minute schedule, prepare therefore registers one
nonrepeating completion check for approximately 120 seconds later, using the
same existing automation title and a distinct token/purpose. Successful or
explicitly failed finalization cancels only its own check. No new regular
schedule or native retry chain is started. Stopped scheduling permits manual
testing but does not silently turn on monitoring.

If a later invocation finds an overdue waiting record, it reports
NATIVE_INCOMPLETE, preserves current and returns without starting another
download. A subsequent regular tick may start a fresh attempt. This means
"no completion recorded", NOT a proven network outage. A late original download
cannot publish after that failure was recorded or a newer attempt was created.

The watch depends on notification delivery and on iOS invoking the automation.
It is NOT an independent daemon and cannot guarantee real-time alerts if the
device suppresses/terminates both paths. The ordinary next tick also checks for
an overdue attempt. Foreground Stop cancels future regular and one-off ticks;
an already running invocation may finish. Failure text is returned for the
Shortcut's conditional notification, with no success banner.

## Validation and rollback

See `VALIDATION.txt` for test scope. Native Shortcuts type coercion, file access
and locked-device delivery require owner observation. Unit/integration mocks
cannot prove those native behaviors. The request-bound PNG marker intentionally
fails closed if Shortcuts silently re-encodes the image.

To return to 0.6.4: stop scheduling, restore the backed-up Shortcut, import the
previous package as an update under the same name, verify one manual success,
then re-enable scheduling. Do not erase the saved-map folder or SQLite locks.

Source and opt-in server changes belong only to **f50-widget-test / Preview**.
Never commit private-config.json or the owner-specific archive. The archive
retains the owner's existing configuration unchanged.

## Reproduce local checks

From this directory, generate the synthetic fixture using
`python3 tests/make-fixture.py`. Run all `tests/verify-*.cjs` with Node 24, passing
the absolute path to TypeScript's `lib/typescript.js` as the first argument.
From the repository root run `node tools/test-native-map-file.mjs` and
`node tools/test-vercel-file-delivery.mjs`.

Primary API references:
- https://scriptingapp.github.io/guide/Intent/Quick%20Start
- https://scriptingapp.github.io/guide/Device%20Capabilities/Notification/
- https://scriptingapp.github.io/guide/Utilities/SQLite/Executing%20SQL%20and%20Query
- https://support.apple.com/guide/shortcuts/request-your-first-api-apd58d46713f/ios
