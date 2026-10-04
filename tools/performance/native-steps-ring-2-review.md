# Native Steps Ring 2

The first native trial imported and rendered on the owner's phone (IMG_9891).
At 8010 steps the arc appears consistent with roughly 80% progress, but the lime
stroke is much too thick and covers part of the walking symbol.

Pixel inspection at rows 915, 918 and 920 finds a 46px lime span at the right-hand
stroke (x698–743); row 923 is 47px. The approved reference uses a 13px stroke.
This confirms a visual regression in trial 1, not its runtime cause or speed.

Revision 2 changes only the native Start Scale and End Scale from 30 to 8.5,
plus the trial name/description. The ratio `30 * 13 / 46.5 ≈ 8.4` guides this
empirical first correction. Linearity of native scale is not verified; final
thickness, outer radius and track alignment must be checked on the phone.

All 100 manual ring shapes remain absent. Layer count remains 1514, with one
native chart, original frame and lime, native Pedometer / Steps and goal 10000.
The original 81 variables, all other Home/Calendar content, live map/city and
navigation are unchanged. Trial 1 remains available through its existing page.

The structural test restores the two scale values and metadata and requires the
entire result to equal trial 1. Both page controllers pass the synthetic
copy/download/login-expiry checks. No actual transition timing is claimed.
