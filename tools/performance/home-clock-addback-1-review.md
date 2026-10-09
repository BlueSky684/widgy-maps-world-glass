# Home Clock Addback Test 1

Control: Home Weather Addback Test 1, reported still fast at 07:54 Israel time on 2026-10-09.

Add only 12 original Home nodes: header date divider 6190; greeting 6101/6102/80103/80104/80105; weekday/month/day 6103/6104/80312/80313/6105; clock 6110. Full original fields, fonts, coordinates, source data, conditions and relative ordering preserved. Weather card including extracted chrome is unchanged. All 55 variables, live map/GPS/city, complete Calendar and other tabs remain identical. No extra image or server change. Total layers 1156 to 1168; events, fitness and day gauge still absent.

Verified transform against actual Weather Addback export: removing only the 12 additions and restoring title/description produces deep equality with control. Exact encrypted clipboard roundtrip, wrong/missing key and tamper rejection, manual fallback, IDs/navigation, script syntax, and configured full build checked before publication. Native rendering and speed require phone verification.

After initial load, compare three Calendar-to-Home returns with Weather Addback Test 1. Ask if return remains fast or slows, and whether clock/greeting/date are correct. This tests the combined clock/header group, not one isolated provider. Preview f50-widget-test only; production untouched.
