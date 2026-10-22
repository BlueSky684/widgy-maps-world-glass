# Map Cache Test 2400 — 0.6.6

## Why this change

On 22 October the phone recorded eight successful scheduled runs followed by
NATIVE_LATE at 11:50:36, duration 35.5 seconds. The correlated server request
finished HTTP 200 in 2.093 seconds at 11:50:40 Asia/Jerusalem. The existing
history does not distinguish network/Shortcuts handoff time from finalizer time.
It does not prove that the downloaded file was valid or that iOS caused a pause.

0.6.5 imposed a 20-second wall-clock budget across preparation, the independent
Shortcuts download, and the second Intent. This rejected even a valid file that
arrived after 20 seconds although the pending-request watch and input freshness
already allowed two minutes. 0.6.6 separates these concerns:

- Transfer/request deadline remains less than 120 seconds from preparation.
- Original location freshness remains at most 120 seconds, with the existing
  60-second future-clock tolerance. Neither deadline resets on finalizer entry.
- A separate 20-second cooperative finalizer deadline begins at function entry,
  including lock/database work. It is checked after file read, before staging,
  and immediately before current-file overwrite. An in-progress native I/O call
  cannot be forcibly cancelled by this guard; completed writes still require
  readback and failed writes retain the existing rollback behavior.
- Request token, newest waiting row, PNG size/CRC/dimensions, native decode,
  current-file baseline, SQLite ownership, backup and readback are unchanged.
- Expired transfers report NATIVE_EXPIRED; stale location reports
  NATIVE_LOCATION_AGE; delayed finalization reports NATIVE_SAVE_LATE.
- The report/history distinguish time before finalizer entry from time inside
  finalization. Before-finalizer time includes preparation tail, download,
  Shortcuts scheduling and Intent handoff, not just network transfer.
- An additive timing table stores only durations and fixed stage labels, pruned
  with the 64-run history. Old history stays visible; no URL, key, GPS, private
  file path or image bytes are recorded. Diagnostic storage failure cannot
  itself convert a verified image publication into failure.

This fixes premature rejection in our code. It does not fix or establish the
cause of the observed 35.5-second delay, guarantee background scheduling, or
prove a successful overnight run.

## Upgrade from the configured 0.6.5

1. Stop the 15-minute schedule before import and allow any active run to finish.
2. Import this archive as an update to the SAME Map Cache Test script identity.
3. Do not edit the existing two-Run Shortcut, native download, Files binding,
   notification condition or local Widgy map-file binding.
4. Run the existing בדיקת מפה Shortcut once. Inspect the latest result and history
   for version 0.6.6, success and separate phase times. Inspect Widgy separately.
5. After success, enable the existing 15-minute schedule again.

The menu includes first-install instructions only for a Shortcut that has not
already been converted to the native two-step flow. Legacy four-line input
continues to run the older transport; the menu's old manual update button does
not validate the native flow.

## Existing protections and monitoring

No timer steals a retained writer lock. Duplicate, obsolete or superseded
continuations do not overwrite the current map. The existing two-minute
completion watch and no-native-retry policy remain unchanged. If iOS never
invokes the automation, immediate alerts cannot be guaranteed. A new success
does not erase a prior failure from history. Output remains empty on success;
failures contain לא הושלם for the existing Shortcut notification condition.

Map size stays 2400 x 1131. Private configuration is copied unchanged from the
owner's previous archive. No endpoint, renderer, server, city-label source,
provider quota, Production deployment or widget configuration is changed.

## Verification

143 local checks passed: 37 native-handoff checks plus 106 retained regression
checks. These use actual modules, real SQLite and mocked native APIs/time.
Native compilation and forced TSX import/presentation checks passed.
See VALIDATION.txt. No server re-test was necessary: server code is unchanged.

Run tests with Node 24; generate the synthetic fixture using
`python3 tests/make-fixture.py`. The tests accepting a TypeScript argument use
the installed `typescript/lib/typescript.js` absolute path.

## API reference

https://scriptingapp.github.io/guide/Intent/Quick%20Start documents separate
Shortcut calls, file URL input and background Run Script. It does not promise
that our timing limits are an OS runtime allowance.
