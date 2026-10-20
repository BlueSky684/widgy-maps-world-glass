# Map Cache Test 0.6.0 — Vercel Preview delivery

Release status: server verification completed on 2026-10-20; packaged for owner
installation. The existing map key was explicitly authorized and saved as a
sensitive variable scoped only to Preview branch `f50-widget-test`.

Three real authenticated PNG downloads passed full decoding at 3306 x 1558.
Missing and incorrect keys returned 403. The first uncached city lookup exceeded
the 1500 ms city deadline, so that image had coordinates without a city label;
the next two returned the correct London label from the city cache. This is
not proof that all cellular downloads will complete within the client deadline.

This version changes the map URL to the existing permanent `f50-widget-test`
Preview alias with `delivery=vercel-file-v1`. The download must carry the new
service marker before its PNG can be published. Full resolution, PNG bytes,
the 20-second download budget, location freshness, backup, bookmark, mutex,
Shortcut's four-line input and schedule behavior are unchanged from 0.5.7.
The script name remains `Map Cache Test` so an owner import can update the
existing script. No import starts an update or changes the schedule.

The server initially bridges city lookups to the existing Google service.
After the controlled quota handback it can use Vercel + BigDataCloud directly;
that server-side change does not require another client import.

Never commit `private-config.json` or an owner `.scripting` package. The private
owner package must contain the existing `mapAccessKey`; the example file is
not a working credential. No temporary Vercel share URL belongs in the package.

Install: import as an update to the existing script, keep the existing
Shortcut and map-file selection, then run the Shortcut once. Native import and
device rendering cannot be verified by the local mocked tests.

Keep automatic runs paused during this handoff. Start with one normal Shortcut
run after import. A continuous 15-minute schedule is not a cost-free guarantee:
the full-resolution monthly transfer scenario exceeds the current Hobby origin
allowance; no paid plan change or Google-to-Redis quota handback was performed.

## Reproduction

```sh
python3 tests/make-fixture.py
node tests/verify-053.cjs
node tests/verify-download-053.cjs
node tests/verify-endpoint-060.cjs
node tests/verify-menu-055.cjs /absolute/path/to/typescript.js
```

The inherited test filenames identify their original test suite, not the
current runtime version. See the server migration report for deployment state.
