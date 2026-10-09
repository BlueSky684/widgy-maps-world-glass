# Runtime 2 — month navigation regression correction

The owner reports a slight improvement switching Calendar/Home with Runtime 1,
but either month arrow returns to Home (2026-10-09, 10:34 Israel).

Runtime 1 shortened 48 native button action lists from 33 targets to 2–4,
omitting explicit Calendar-show and Home-hide directives. Its JS simulation
treated omitted visibility targets as persistent state. That model passed
473 transitions but did not establish Widgy's actual button semantics; the
owner's observation invalidates it as sufficient evidence for that change.

Runtime 2 restores every month-arrow action byte-for-byte from Shared Home
Calendar Cleanup 1. No partial shortening is retained. The shared caption
calculations and merged Home vectors stay in place. Against the delivered
Runtime 1 JSON, only 48 action strings and title/description differ. There are
still 1194 nodes, 67 variables, 26 JS definitions, all 25 months and no tap dots.

The regression check compares actual complete exported action strings; it
does not rely solely on a state simulation. It explicitly verifies Calendar
show/Home hide, and a whole-document restoration checks all unrelated content.
The map API, renderer, GPS/city runtime, exact image resolution, native day
gauge, weather, fitness, font geometry, event sources and refresh rules are
unchanged. Native phone behavior cannot be executed in the build environment.

Publish only on f50-widget-test after the build and full JSON-copy checks.
