# Map Cache Test 0.6.0 — Vercel delivery candidate

Release status: prepared, not released to the phone. The Preview secret and
live integrated-city verification are still pending explicit authorization.

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
not a working credential. Do not install until the server and app-key check
have passed. No temporary Vercel share URL belongs in the package.

Once released: import as an update to the existing script, keep the existing
Shortcut and map-file selection, then run the Shortcut once. Native import and
device rendering cannot be verified by the local mocked tests.

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
