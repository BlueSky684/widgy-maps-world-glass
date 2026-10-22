# Map download reliability audit — 22 October 2026

Scope: existing `f50-widget-test` Preview, installed 0.6.5 and the prepared
0.6.6 candidate. Investigation only; no new phone release or runtime changes
were made during this audit. The 0.6.6 candidate is **held for further work**.
Its source/package had been prepared before the owner's request to investigate
more deeply. No recommendation to install it follows from this audit.

## Decision

The mechanism can be made more resilient. Increasing the acceptance deadline
alone is insufficient. Priorities are bounded recovery, honest durable outcome
tracking, less repeated file work, and a publication/recovery design that remains
safe if an invocation disappears. Resumable background transfer is a larger
architectural option, not a drop-in API substitution in the current Shortcut.

Do not promise every 15-minute update succeeds, or that a fresh map is available
without connectivity. Distinguish four separate outcomes: invocation happened,
response arrived, verified image was published, and Widgy displayed it.

## Incident evidence and its limits

The 11:54 phone screenshot lists eight automatic successes, following a manual
success, then `NATIVE_LATE` at 11:50:36 with a 35.5-second duration. The earlier
09:30:28 failure occurred around first-run permission interaction. These are
observations, not an estimated long-term failure rate.

The temporally matching Preview request on 22 October completed as follows:

| Israel time | Event | Evidence |
| --- | --- | --- |
| 11:50:37.992 | Handler started | Preview `/api/night-map` |
| 11:50:38.268 | Location decision | City available; 281.2 ms elapsed |
| 11:50:40.056 | Prepared | HTTP 200, 2,602,221-byte body, 2080.6 ms |
| 11:50:40.069 | Server finished | HTTP 200, 2093.1 ms |
| 12:05:39.196 | Subsequent request finished | HTTP 200, 1805.5 ms |

The 12:05 request establishes later server activity, not successful phone
publication. Correlation is by time, not an end-to-end token exposed in the
phone history. Server `finished` means the server handed off its response;
it does not prove receipt by Shortcuts, completion of the second Intent, or
successful display. The 0.6.5 record cannot locate the missing time among
transport, Shortcuts handoff, and file finalization. It also does not establish
that the rejected file was complete: the time guard can reject before reading it.

The existing 0.6.5 guard counted the entire prepare/download/finalize interval
against 20 seconds. The held 0.6.6 candidate permits transfer age below 120 seconds
and separately limits pre-publication finalizer work to 20 seconds, while keeping
the original location-age guard. These are application policies, not OS execution
allowances. A 35.5-second handoff can pass; a 35.5-second pause within finalization
still cannot. The actual failed run cannot be retroactively classified as a
would-be success.

## New investigations performed

### Six targeted client fault/behavior checks

`tools/audit-native-map-reliability-20261022.cjs` loads the unchanged 0.6.6
module graph through its existing harness, real SQLite, and mocked native APIs.
All six checks completed with the following results:

| Scenario | Observed result | Implication |
| --- | --- | --- |
| Normal full cycle | 8 binary reads and 3 binary writes | Repeated bridge/file work is a measurable optimization target. This is an operation count, not an iPhone duration or peak-memory measurement. |
| Download never returns and completion watch is missed | At minute 15, only failure is recorded; a new URL is issued at minute 30 | One regular slot is lost to reporting. A recovery-aware scheduler should record the previous failure and safely start a fresh attempt without wasting that slot. |
| Completion watch runs at two minutes | Failure reported; only regular tick remains | The native path has no immediate bounded retry. Legacy `recovery.ts` is bypassed by native prepare/finalize routing. |
| Last-report JSON write fails after publication | Quiet success and `done` preserved | Existing diagnostic-file error isolation works. An initial hypothesis of false failure here was falsified. |
| SQLite completion update fails after verified publication | Valid new image exists, but journal becomes `failed` | File publication and completion bookkeeping need reconciliation and a distinct outcome; an uncertain acknowledgment should not be described as a failed download. |
| Current-file overwrite is interrupted before completion | Backup remains valid, current may be partial, retained mutex blocks later attempt | Backup alone is not sufficient for automatic recovery. The interruption model deliberately prevents the original invocation's cleanup; it is not an actual iOS kill test. |

The retained mutex is intentional protection against a suspended writer later
resuming. Deleting it after an arbitrary timeout would introduce concurrent-write
races. A timer is not proof that the prior writer is dead. Recovery must use a
supported ownership/serialization mechanism; publication needs verified atomic
replacement or a compatible immutable-file/pointer scheme. Compatibility with
Widgy's existing file binding must be proved on the phone.

The normal path rereads/validates the old image for preparation and baseline,
then again for finalization, and validates the incoming PNG twice. Some work can
be consolidated within one lock acquisition by carrying verified metadata with
the bytes. Do not remove checksum, token, freshness, ownership, or readback checks
just to improve speed. No claim is made that this repeated work caused 11:50.

### Actual Preview transport, without credentials

Three sequential public synthetic map requests were made from the executor.
No real location, geocoder call, private key, or redirect was used. All returned
HTTP 200 and a complete PNG with valid chunk CRCs, 2400×1131 dimensions and
2,602,682 bytes:

| Sample | Time through response headers | Body read | Total |
| --- | ---: | ---: | ---: |
| 1 | 7.252 s | 0.816 s | 8.068 s |
| 2 | 5.826 s | 0.685 s | 6.511 s |
| 3 | 5.863 s | 0.408 s | 6.272 s |

These measurements include the executor's network path and cannot predict the
phone's cellular path or locked-device scheduling. This public route does not
exercise native attachment authorization/handoff. An authenticated live probe
was rejected by automatic approval review because it would send the packaged
private key externally. It was not retried or represented as a completed test;
the credential-free route was used instead. Native attachment behavior was
checked locally with a synthetic key only.

### Resumption protocol and lossless compression

`tools/audit-map-transfer-format-20261022.mjs` exercises the actual local handler
and renderer, with synthetic input and no external/provider calls.

- A `Range: bytes=100-` request returns HTTP 200 and the entire body, not 206.
- `Accept-Ranges` is absent. There is no implemented partial-download protocol.
- The native ETag is derived only from the transfer token. Rendering different
  instants with that token produces different PNG bytes under the same ETag.
  This is not causing partial-file assembly today, because range resumption is
  not implemented. It must be corrected before introducing resumable transfers:
  an immutable object and content-derived validator are required.
- Each sampled compression option preserved decoded pixels and ICC profile.
  PNG ancillary transfer metadata must be added/verified after any re-encoding;
  these experiments are not drop-in native output files.

For one representative 2,602,742-byte synthetic native map:

| PNG compression | Adaptive filtering | Bytes | Size saving | Local re-encode |
| --- | --- | ---: | ---: | ---: |
| Level 6 | No | 2,602,867 | ~0% | 104 ms |
| Level 6 | Yes | 2,425,014 | 6.8% | 266 ms |
| Level 9 | No | 2,571,192 | 1.2% | 212 ms |
| Level 9 | Yes | 2,416,134 | 7.2% | 749 ms |

These are one-image local experiments, not a production benchmark or an iPhone
measurement. Adaptive filtering may offer a modest lossless improvement. Its
benefit is secondary to recovery and scheduling, and it does not explain the
35.5-second delay. Lower resolution, lossy conversion, and hosting upgrades are
not justified by the evidence collected.

## Platform capabilities verified

1. Scripting's documented `BackgroundURLSession` can manage native background
   downloads/resumption, but is available only with `Script.env === "index"`.
   The current Shortcut uses `intent.tsx`. It cannot simply call this API in
   its existing background Intent. A main-app/native-host design would need a
   proven start/completion path and would change the workflow.
2. Scripting documents Intent file URL inputs and separate foreground/background
   execution. It recommends foreground execution for large images/files due to
   memory limits. No evidence in this incident proves memory termination.
3. Scripting documents `writeAsBytes` overwriting and `rename` moving files;
   the inspected documentation does not establish crash-atomic replacement of an
   existing externally bound file. Do not infer a guarantee from the method name.
4. Apple describes background URLSession and HTTP resumption, including stable
   validators and range support. Apple also documents limits on periodic
   background execution and the effect of force-quitting. These are reasons not
   to promise uninterrupted operation, not proof that iOS caused this incident.

## Engineering path before another phone release

1. **Make states and recovery explicit.** Preserve success/failure history;
   separate incomplete transfer, expired location, verified publication,
   uncertain acknowledgment, and display refresh. Reconcile file/journal state
   under proven ownership before writing or retrying.
2. **Add one fresh bounded recovery attempt.** Use new location/timestamps/token
   through the existing automation, not a loop inside an expired Intent. Record
   the attempt budget durably, deduplicate notifications, cancel after success,
   and stop after the allowed retry. Handle both a caught late result and a GET
   that never reaches finalization. A missed monitor must not waste a regular
   update opportunity. The retry itself still depends on OS invocation.
3. **Reduce work without removing protections.** Reuse the validated old snapshot
   and fingerprint within a lock; consolidate duplicate validation. Instrument
   preparation, before/after native GET, Intent entry, bytes read, validation,
   staging, current replacement and acknowledgment. The held 0.6.6 pre-finalizer
   metric combines download and handoff, so does not yet separate those.
4. **Resolve crash-safe publication.** Prove supported atomic replacement and
   lock recovery in the actual Scripting/Widgy binding. If that API is unavailable,
   evaluate a native host or an immutable-file selection design; do not substitute
   unproven timed lock deletion. Preserve the existing 2400×1131 appearance.
5. **Consider persistent/resumable downloads only if transport warrants it.**
   Use an authenticated immutable image per request, stable digest/ETag, bounded
   retention and validated Range responses. Retain privacy and freshness rules.
   A resumable transfer API requires host support and does not ensure exact
   15-minute scheduling or instant refresh of Widgy.

Release gates: successful real-device file handoff; airplane-mode/offline and
reconnection recovery; cellular/Wi-Fi transition; long locked-device run;
interruption at staging/current-write/acknowledgment; duplicate/overlapping runs;
missed completion watch; stale location; full disk/permission failure; old result
arriving after a newer result. Track invocation, received-file validity, verified
publication and display separately. A 24-hour run provides 96 scheduled slots
for observation, not mathematical proof of permanent reliability.

The 143 previously passed local checks for 0.6.6 remain useful regression
evidence; they never demonstrated iOS scheduling, atomicity or overnight phone
reliability. No runtime fix was made or package rebuilt after this audit began.

## Primary references

- [Scripting BackgroundURLSession](https://scriptingapp.github.io/guide/Utilities/URLSession/BackgroundURLSession)
- [Scripting URLSessionDownloadTask](https://scriptingapp.github.io/guide/Utilities/URLSession/URLSessionDownloadTask)
- [Scripting Intent Quick Start](https://scriptingapp.github.io/guide/Intent/Quick%20Start)
- [Scripting FileManager](https://scriptingapp.github.io/guide/Utilities/FileManager)
- [Apple: Build robust and resumable file transfers](https://developer.apple.com/videos/play/wwdc2023/10006/)
- [Apple DTS: iOS Background Execution Limits](https://developer.apple.com/forums/thread/685525)
- [Apple DTS: force-quit and background URLSession](https://developer.apple.com/forums/thread/826318)

## Reproduction

Run from the repository root using Node 24 and the local TypeScript dependency:

```sh
node tools/audit-native-map-reliability-20261022.cjs /absolute/path/to/typescript/lib/typescript.js
node tools/audit-map-transfer-format-20261022.mjs
python3 tools/audit-public-map-network-20261022.py
```

The first two are local/synthetic. The last contacts only the existing Preview
public map endpoint and sends no credential or real location. It is optional
when offline; its absence does not invalidate the local fault models.
