# Map Refresh Clock 1

2026-10-05, branch `f50-widget-test`, parent `78d3e147a00c624e263e0134767fe871e7889181`.

## Evidence / purpose

At 21:38:18 Asia/Jerusalem the owner reports Stable GPS1: “גם אחרי 4 דקות החזרה נשארה מהירה”. The preceding21:32 screenshot showed the map, a location marker and coordinate label; do not store/replay its actual coordinates. Together these support visible location output and subjective speed after four idle minutes, not independent GPS accuracy/freshness or a fresh map request. Preserve Stable GPS1 as the fast candidate. Do not restore city/full Home until freshness is understood.

Add a visible timestamp to the map bitmap itself, not to a separate native-text layer, JS counter, page preview or request-arrival header. This is a diagnostic with small additional rendering work/pixels, not a new speed baseline or a final design change.

## Implementation

Widget `withMapRefreshClock` starts from Stable GPS1 and adds only the constant `diagnostic=refresh-v1` query parameter (plus name/description). Same21 layers, three variables, two native sources/parser, stable URL at unchanged coordinates, unchanged minute-clock calculations, image binding/provider/frame/cache flag, navigation/static Calendar and full3306x1558 lossless PNG. No t/cache buster, reload tap, no-cache source, timer, extra fetch or source.

API existing normal diagnostic key remains false; old location diagnostic key remains true. Only refresh-v1 uses the distinct string key, so stamped images cannot contaminate ordinary/location responses. Same existing private reuse60/cache expiry/ETag/conditional304/HEAD behavior and CDN no-store. No public caching of owner locations; synthetic-CDN opt-in remains unavailable to this extra-parameter diagnostic. No provider/region/asset/TTL changes.

Renderer draws MAP TIME date+HH:MM:SS ISRAEL from the same `date` passed to the solar compositor and stored in X-Map-Rendered-At. Asia/Jerusalem formatting handles summer/winter time. The strip is within x60..3245/y1340..1497 of the existing full raster; timestamp glyphs remain in that strip. Actual live renders use the server render-start instant, not necessarily response completion. Fixed-at geometric tests show their explicitly supplied solar instant and are not used for the user's export. The whole stamped PNG and its original stamp are cached together; cache hits/304s do not paint a newer clock over old pixels.

No changes to original masters. Existing normal render output must remain byte-identical for identical inputs. Technical generated test PNGs are reproducible scratch verification artifacts only, not AI mockups or published owner files.

## Verification

Passed `node tools/test-map-refresh-clock.mjs`, `node tools/test-map-stable-gps.mjs`, `node tools/test-map-refresh-server.mjs`, and `git diff --check`. Full widget equality restricts changes to constant query/name/description; no new sources. Actual public-template controller copy/download/retry/failure/pageshow/blocked-clipboard behavior passes.

The server test executes the actual API route with a controlled clock/stub render bytes and real cache/parser/resolver. It covers separate normal/location/refresh keys, unknown diagnostic retaining old false key, MISS/HIT preservation of old time/PNG/ETag, remaining max-age, conditional304, expiry then new timestamp/body/ETag, HEAD/405, unchanged explicit synthetic CDN and rejection of public caching for the diagnostic. The first test harness run omitted the VM's URLSearchParams binding; adding that standard global corrected the harness before tests passed. No product behavior change was needed for it.

Actual full-size PNG tests compare the current default renderer byte-for-byte against parent source; assert the diagnostic changes pixels only inside the stamp rectangle; validate Israel summer/winter label text. A full-size synthetic0,0 raster was visually inspected: complete readable timestamp and location label, no clipped text. These tests validate code/rendering, not Widgy scheduling or location acquisition. Before handoff check deployment status, public runtime bytes and an opt-in synthetic PNG whose visible Israel time matches its render header. No real owner coordinates/geocoder/private calendars or restricted logs.

## Device gate

Keep Stable GPS1. Import Refresh Clock1, confirm map/marker/MAP TIME strip, note the printed time. It should not tick like a normal clock. Calendar, four minutes untouched, then Home without a manual refresh/reimport. Report old/new printed times and transition speed; no stopwatch/video/second phone needed.

Changed time proves a newer rendered bitmap is displayed; it does not by itself prove regular automatic refresh or unchanged-coordinate URL revalidation, because native coordinate values may also change. Unchanged time means no newer render is displayed in that observation, not proof of permanent freezing or a uniquely identified cache layer. If unchanged, check a longer natural interval/normal supported refresh next with explicit distinction between manual/automatic behavior; do not silently add a cache buster and declare victory. If refreshed and fast, confirm natural location changes when practical before gradually restoring city/other Home. Do not ask the user to travel for this test.

No production promotion, asset/branch deletion or cleanup. Final approved appearance, full dynamic map/location/city, Ashkelon spelling and Calendar behavior remain required.
