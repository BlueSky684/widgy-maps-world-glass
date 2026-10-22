# Map Cache Test 2400 — 0.6.7

Controlled device-test candidate, 22 October 2026. Implements findings from
`docs/investigations/map-reliability-audit-20261022.md`; it is not a claim of
uninterrupted iOS execution or crash-atomic file replacement.

## Changes from installed 0.6.5 and held 0.6.6

The separate transfer/finalization deadlines and phase diagnostics from 0.6.6
are retained. Transfer age stays below 120 seconds, original location age stays
within 120 seconds, and pre-publication finalizer work has its own 20-second
cooperative guard. A native call already in progress cannot be forcibly stopped
by that guard. No timestamp is reset to make stale data appear fresh.

### One durable recovery budget, including GET failures without a finalizer

Before a scheduled native transfer, the existing SQLite recovery slot is
reserved with the transfer token. Its two-minute completion watch uses the
existing `World Glass Map Tick` automation. Verified success cancels the watch
and resets the budget. If GET never reaches the finalizer, a fresh invocation
can mark that attempt incomplete and begin a new request immediately, using
new Shortcut location/timestamps and a new transfer token.

Once that budget is spent, subsequent completion watches use the DISTINCT
`World Glass · בדיקת השלמת המפה` title. They are reminders to inspect status,
not automation triggers. Thus a second missing GET does not form a retry chain.
The budget remains spent across process restarts and regular failures until
verified publication succeeds. Ordinary 15-minute invocations remain enabled.
The reminder is deliberately not a definite failure claim: failed cancellation
or delayed delivery can otherwise create a false alert after success.

Caught pre-publication elapsed-time failures may move the attempt's own planned
recovery to 60 seconds from the failure. Cancellation of the original watch and
ownership of its durable budget must be verified first. Corrupt/missing/wrong
files, permission errors, writer contention and started overwrites are not
eligible for this additional scheduled retry.

An expired waiting attempt is retired and a new URL can be returned in the SAME
fresh invocation. This also applies if either the original or retry watch was
missed. It avoids spending the next regular slot only reporting a failure.
Shortcuts does not pass notification purpose to this script; the design does
not guess it from elapsed time. The non-triggering second watch is what bounds
extra invocations. Manual runs remain possible; stopping the schedule cancels
all this script's pending watches and never enables new ones behind the user.

### Less repeated file work

The publisher exposes only the fingerprint of its private, validated prior
snapshot while the writer lock is held. Preparation and finalization reuse that
metadata instead of rereading the same current map. A healthy native cycle now
performs 6 binary reads instead of 8, with the same 3 verified writes. This is
an operation count, not an iPhone speed or memory benchmark. Incoming PNG
structural validation is still repeated at the publisher boundary. Native
image decode, token binding, freshness, baseline comparison, backup and all
post-write byte comparisons remain in place.

### Verified publication and journal acknowledgment are distinct

A small additive candidate table stores token, byte count and fingerprint
before any new file publication. If the final completion UPDATE fails after
verified write/readback, the last report still records successful publication
with `NATIVE_ACK_PENDING`; the row remains `publishing`, not falsely `failed`.

A later invocation must acquire the writer lock normally. It can reconcile the
row only if the current PNG passes structure/CRC/dimensions, expected token,
expected byte count/fingerprint and native decode. It then records
`OK_RECONCILED` and may prepare a new request. Missing evidence, different bytes
or a retained writer lock block this path. Persistent acknowledgment failure is
reported as a history problem without declaring a failed map download. Lock
release failure after verified publication is likewise reported separately.

The candidate and timing tables are pruned with the 64-run journal. They contain
no URL, credential, GPS, private file path or image bytes. Existing 0.6.5 history
and the original failure records remain available.

## Remaining boundary: interrupted native overwrite

Caught I/O errors retain the verified rollback behavior. However, termination
or suspension in the middle of native current-file overwrite can still leave
partial current bytes and a valid backup while the writer mutex remains held.
The code intentionally NEVER deletes that mutex based on age: a suspended
writer may resume. Reconciliation does not bypass a retained mutex. Scripting's
inspected API does not establish atomic replacement of this externally bound
file. Resolving this requires a proven host API or a separately validated
immutable-file binding, not merely a longer timeout. This candidate does not
solve or hide that architectural limitation.

## Controlled upgrade and device acceptance

1. Stop the 15-minute schedule and allow an active invocation to finish.
2. Import as an update to the SAME `Map Cache Test` identity. Preserve existing
   Shortcut actions, Files binding, notification condition and local Widgy map.
3. Run the existing `בדיקת מפה` Shortcut once. The old manual-update menu button
   tests a different transport and is not acceptance for this flow.
4. Inspect version 0.6.7, successful native-route history, both phase durations,
   and the displayed map separately. A blank Shortcut result alone is not proof.
5. After success, resume the existing 15-minute schedule. Observe a controlled
   offline/reconnection case and a locked-device run. Verify at most one extra
   recovery, cancellation after success, and that the reminder title does not
   match a broader notification automation rule. If it does, stop and correct
   that automation filter before testing recovery.

Device gates still outstanding: native file handoff with this candidate,
offline/reconnection, cellular/Wi-Fi transition, long locked-device run, and
controlled interruption at staging/write/acknowledgment. Do not label it a
validated permanent fix before those observations. No phone state is changed
by creating or downloading this archive.

## Verification and scope

162 local checks passed: 56 native integration/fault checks and 106 retained
regression checks. Actual modules and real SQLite are exercised; native APIs,
clock and notification delivery are mocked. See VALIDATION.txt.

No server, renderer, deployment configuration, resolution, city-label source,
provider quota, Production environment or widget JSON is changed. Private
configuration is copied byte-for-byte from the owner's previous archive and
never committed to the repository.

Run with Node 24. Generate `tests/test-fixture.png` with `tests/make-fixture.py`;
pass the installed `typescript/lib/typescript.js` path to tests accepting it.
