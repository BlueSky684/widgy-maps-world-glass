# Home Weather Addback Test 1

Paired control: Home Source Addback Test 1, reported unchanged/fast on 2026-10-09 at 07:43 Israel time. User authorized weather-only addback at 07:44.

Restore Home top-level weather nodes 80029, 80028, 80049, 6130–6134 from Native City Spelling Test 2 verbatim, including every descendant condition/icon. Retain all 55 definitions exactly. Original full chrome contains unrelated Home content; restore its weather-card pixels only on an otherwise transparent original-size canvas. Chrome node geometry/options/order are preserved; only URL and descriptive name change. The extracted lossless PNG includes original card frame, background, divider and high/low arrows. Build script verifies exact decoded pixels. This adds one image request relative to the bare Home control; the experiment tests the complete card, not a single provider.

1063 → 1156 total layers. Calendar, map image, async resolver/GPS, navigation, other tabs and every other field are deep-equal after reversing the explicitly added weather nodes and title/description. No map/server/provider change. No clock, events, fitness, day gauge or header added.

Checks: transform reversibility against actual Source Addback export; unique layer IDs/navigation targets; embedded script syntax; exact encrypted clipboard bytes, missing/wrong key and tamper rejection, manual-copy fallback; configured project build. Original chrome region visually inspected; native appearance/speed remains to be tested.

Phone protocol: keep Source Addback Test 1 next to Weather Addback Test 1. After initial loading, compare three Calendar → Home returns each; report whether fast return remains or slowdown returns, weather appearance and Calendar city. No stopwatch required. No improvement/cause claim before outcome. Preview branch only; production unchanged.

## Owner outcome — 2026-10-09 07:54 Asia/Jerusalem
Owner: still a fast transition. Weather-card restoration did not produce a noticeable slowdown in this run. No numeric timing or separate native visual confirmation was supplied. This does not establish performance under every condition or clear cumulative interactions. Next paired experiment adds the original clock/header group only.
