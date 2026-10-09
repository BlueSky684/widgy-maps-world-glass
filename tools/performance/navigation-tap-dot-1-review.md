# Navigation dot experiment — 2026-10-09

Owner explicitly requested proceeding with a navigation marker without a second
camera, after being told immediate native touch feedback is unverified.

## Matched copies

- Widgy Day Tap Dot Test 1 derives from the delivered Home Day Addback Test 1.
- Widgy Full Tap Dot Test 1 derives from Native City Spelling Test 2 (full Home).
- These are explicitly identified current controls, not an assertion about the
  still-unconfirmed version identities in the 08:35 screen recording.

## Change and interpretation

Two initially hidden native `circle.fill` symbol layers are placed frontmost,
above the HOME and CALENDAR navigation labels. Existing navigation actions show
the destination dot and hide the other; WEATHER and FITNESS hide both. The
original Calendar reset targets and month navigation actions are preserved.
No scripts, timers, providers, requests, images, animations, or resolution
changes are added. The indicator remains until the next navigation action;
repeated taps on the same active tab do not flash it.

This is a **last-action indicator**, not a proven touch-down timestamp. Widgy
owns the render scheduling; both the dot and the new page may appear in the same
update. If so, the dot cannot measure the wait before that update. Do not
interpret dot-to-page timing as total tap-to-page latency without independent
confirmation of immediate feedback. New layers could themselves slightly
affect rendering; both copies receive the same two symbols.

## Verification

`test-navigation-tap-dot.mjs` reverses only the two new layers, added action
targets and title/description, then deep-compares each copy with its exact
source. It also checks unique IDs, valid action targets, dot state per tab and
16 changed navigation actions. All map/GPS/city/Calendar data and geometry,
sources, scripts, variables and artwork remain exact.

The two encrypted Copy Full JSON pages must each pass full-byte clipboard,
missing/wrong-key, corruption rejection and manual clipboard fallback tests.
The configured Vercel build must pass before preview publication. Phone
visibility and marker timing remain unverified until the owner tests them.

Completed before publication: both reverse comparisons and both encrypted-copy
suites passed; all 64 existing scripts parse, 55 variables are preserved, and
the original native day gauge remains in each. Layer counts are 1190 (Day) and
1191 (Full). The configured four-step build completed with exit code 0.
No live map endpoint was requested during these checks.

## Recording protocol

Warm each copy once. Record three Calendar-to-Home cycles per named copy on the
phone Home Screen, waiting for each transition to settle. First ask whether the
dot appears before or together with the destination content. Keep the original
copies. No production deployment is authorized.
