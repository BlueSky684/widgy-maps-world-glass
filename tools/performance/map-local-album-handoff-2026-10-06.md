# Complete server PNG to a native album source: initial handoff

## File-backed Base64 variable renders and exports — 2026-10-07 13:44 Israel

Current result: owner confirms the map loaded after selecting the text file as
the variable source and JSON export succeeded. IMG_0032 shows the live map,
an English city and MAP TIME 2026-10-07 13:09:53 ISRAEL. This is initial file
binding/render/export success; replacement refresh without reselecting the file,
current live rendering on the actual Home screen, and navigation remain pending.
Do not repeat static image/export diagnostics.

Earlier at 12:38 owner confirmed the Custom Text variable test both displayed
on the Home screen and exported. They later requested the import link again;
the newly imported test is the one configured through the screenshots below.
Copy page: tools/widgy-full-map-variable-copy.html (same existing branch URL).
Static public map remains a fixture only; current live export is private and is
NOT to be committed or published.

Shortcut ownership explicitly established by user:
- Working/final shortcut: "הצגת תוכן" (without 2).
- Backup: "הצגת תוכן 2"; leave untouched.
The existing location/English-city lookup and Vercel map download are preserved.
Existing Save File still overwrites map-current.png in iCloud Drive/Shortcuts.
Added Encode Base64 of the map download's Contents of URL, line breaks None.
Added Save File of that Base64 output in Shortcuts/map-current-base64.txt:
Ask Where to Save OFF; Overwrite If File Exists ON.
IMG_0026 confirms the text file exists (5.3 MB, 13:10) alongside the PNG.
Existing Show Content/Quick Look precedes encoding, so it must be dismissed
for the shortcut to finish. No unattended schedule is configured.

Observed native UI binding path (no invented serialized bookmark):
Widgy Full Map Variable Test -> Edit Widget -> Variables {} ->
map_png_base64 -> Text [Custom Text] row -> Replace -> Files in left column ->
Files in right column -> choose map-current-base64.txt with native file picker.
Owner completed this path and supplied a 10,898,515-byte JSON export at 13:43.
Private attachment file_00000000124481f49f7ecd0952ffdffd was downloaded and parsed.
Native source verified:
- variable name map_png_base64, source fields 5=Files and 6=Files;
- source field 31 contains the native compressed file reference; decompression
  confirms the exact filename map-current-base64.txt. Do not synthesize or publish it.
- source field 25 still retains the old 5,433,956-character Custom Text base64,
  matching the public static fixture SHA. It is residual serialized text, not
  proof of current live content; do not blindly use it when inspecting this export.
- image source remains Javascript; unchanged 156-character synchronous main()
  returns data:image/png;base64 from the variable.
- image field 2 contains a DIFFERENT live PNG result, 3,966,121 bytes,
  3306x1558 RGBA, successfully decoded. Original live download bytes were not
  supplied separately, so exact source-byte equality was not tested.
- export root format 0=30 (previous prepared test 29); do not infer app version.

Next gate: run the working shortcut again, dismiss its map preview so text saving
finishes, then inspect the assigned test widget on the actual Home screen for a
new MAP TIME without reselecting the file or replacing the variable. A stale
widget first requires distinguishing reload timing from file-binding failure.
Only after refresh is proven proceed to a separate full-widget integration and
navigation check. Preserve one complete full-quality PNG, fixed bounded storage,
no export-time source swaps, no active full-widget changes at this stage.


## Embedded full map PASSED; variable bridge prepared — 2026-10-07 11:08 Israel

Owner confirms export success at 10:34 and correct displayed whole map at 11:07.
This validates the single full PNG returned directly by synchronous Javascript
for static rendering and JSON export on their Widgy 27.0.1 App Store setup.
Do not repeat that test. Dynamic local updates and navigation remain unproven.

Next isolated copy page: tools/widgy-full-map-variable-copy.html, commit
b59a839f6e25caa8510d62f8a009291939264cf9 on f50-widget-test.
Only one image and one String variable map_png_base64. Moves the exact public
static PNG base64 into Custom Text variable, uses 156-character synchronous
image main() to return data URL. Empty/unresolved variable returns empty string;
no fallback image that could falsely pass. Local VM JSON generation and byte-exact
PNG roundtrip passed; resulting JSON 5,434,965 bytes. Native import/render/export
PENDING. Check outside editor on Home screen, not only editor preview.

Why this gate: September 23, 2026 user report says file-backed variable + async
image script displays only in editor; no verified resolution located:
https://www.reddit.com/r/widgy/comments/1wnznyy/image_shows_only_when_editing/
This new test retains synchronous main(), unlike that report. Existing Oct4
full-dashboard Custom Text variable -> Web URL base64 trial FAILED AT IMPORT;
this is isolated one-variable -> Javascript image, not repeating that route.

Owner asks if continuing yesterday's Shortcuts solution: YES. Preserve existing
Shortcut Vercel download -> overwrite map-current.png. Candidate next step is
encode downloaded PNG bytes as one-line base64 into fixed local text file, then
select it as variable source on device. Not yet configured or proven; no guessed
file permission/bookmark fields, no automatic scheduling, no growing album,
no changes to active full widget or Shortcut, no before/after-export source swaps.


## Chrome copy delivery — 2026-10-07 10:30 Israel

Published tools/widgy-full-map-embedded-copy.html on f50-widget-test, commit
a5e47b98afe21e4399919f1420a41c7073b0470d; Vercel GitHub status success.
The page fetches the already-public generated static diagnostic PNG, validates
SHA-256 c4ccdacd84dec137bd46c6061a4f5b69ed4d210e5cec0bc5e2d08865ffc17df9,
and assembles the embedded test JSON locally, with Clipboard API and legacy fallback.
Public fixture verified identical to the prior supplied static PNG (4,075,465 bytes).
No uploaded user PNG or embedded JSON was committed. Native rendering/export remains pending.
URL: https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/tools/widgy-full-map-embedded-copy.html


## Creative single-image route: embedded PNG feasibility — 2026-10-07 10:06 Israel

Owner sent developer email themselves at 08:05; response pending. At 10:06
owner explicitly requested further creative investigation in the meantime.
Continue preserving ONE complete full-quality image, fast navigation, bounded
storage, no imagegen, no repeated completed tests, no production edits yet.

New candidate: PNG data URL returned by one native Javascript image source.
Historical primary community example:
https://www.reddit.com/r/widgy/comments/1fvf17h/
A commenter proposes base64 images returned via sendToWidgy. This is a lead,
NOT validated Widgy 27.0.1 support. Another prior user reported base64 failures:
https://www.reddit.com/r/widgy/comments/1973jip/ . Keep native result uncertain.
File URLs/JS filesystem access are not assumed supported; historical sandbox
report at https://www.reddit.com/r/widgy/comments/xh7ufa/ .

Prepared PRIVATE deliverable widgy-full-map-embedded-test.json, 5,434,531 bytes.
One image layer, name Widgy Full Map Embedded Test. Root derived from owner's
one-image Eriaera export; Javascript source schema (1=Javascript, 22=main code)
from existing native Home Glass source. Returns data:image/png;base64 of exact
original static full map (4,075,465 bytes, 3306x1558 RGBA), SHA256:
c4ccdacd84dec137bd46c6061a4f5b69ed4d210e5cec0bc5e2d08865ffc17df9.
Original PNG bytes fully preserved. JSON parsing, base64 roundtrip, JS main()
execution and returned payload hash verified locally. No network call in script.
No native rendering/export, dynamic update or performance result yet. Result
PENDING. This tests whether embedded source avoids automatic image upload;
do not claim that it does or that static success is a finished live solution.
Future local-text-variable binding to replace one base64 text file would need
native feasibility proof and memory/refresh testing; not implemented or promised.
Do not publish embedded personal/uploaded image JSON to repo or invent .widgy
binary format. Deliver as private JSON; existing Import JSON clipboard route
is established, file-import acceptance for plain JSON is not independently proven.

## DPI-only full map FAILED — 2026-10-07 07:46 Israel

Owner screenshot IMG_0017 shows Eriaera, one Image layer, Both Modes / Files,
Image Upload Failed, server rejected HTTP 422 for map-full-72dpi-test.png.
Changing pHYs alone to 72.009 dpi is therefore NOT a fix. Do not repeat it.
User requires a SINGLE full-quality map image and rejects permanent tiling.
No permanent solution established. Remaining causal uncertainty is in native
export processing/request or server validation, inaccessible via exported JSON.
Need server rejection detail or developer confirmation for root-cause certainty;
do not assert an undocumented numeric size limit. Native version confirmed
27.0.1 App Store. No further arbitrary metadata trial is currently justified.

Developer escalation evidence, if owner elects to send (NOT sent):
- New one-image widget reproduces HTTP 422 with valid 3306x1558 RGBA map.
- Same full map fails via Files and Photos with PNG transparency.
- Source URL layers export successfully.
- Same-size RGBA flat blue control exports even as 4,326,777-byte PNG.
- Quarter-map on blue exports; hosted output 2411x1136, 1,026,698 bytes.
- All four exact 1653x779 crops export together; hosted sizes total 4,349,977
  bytes, individual sizes 599086/1490296/1536007/724588; dimensions unchanged.
- ICC replacement, lossless compression below 4,000,000 bytes, and DPI-only
  change all fail for whole map. PNG integrity verified.
Ask developer for actual validation failure/body/log and per-image processed
payload rules, and a supported single-image full-resolution remedy. Do not
publish private user exports/images or send messages without authorization.

## Owner requires ONE complete map file; DPI-only trial — 2026-10-07 07:43 Israel

Owner rejects four-part map as the permanent approach. Keep the four-part
success as diagnostic evidence ONLY. Do not proceed with tile positioning or
multi-file Shortcut changes. Goal: one full-quality complete map, fixed local
file refresh and normal export without before/after source swapping.

Prepared map-full-72dpi-test.png from original static map: only pHYs changed
from 1000x1000 pixels/metre (25.4 dpi) to 2835x2835 (72.009 dpi), with new CRC.
All other chunk bytes, including every IDAT and ICC, unchanged. 4,075,465 bytes,
3306x1558 RGBA. Full decode and exact decoded pixel + ICC equality passed.
This isolates density metadata without resampling or color/alpha changes.
DPI as cause is speculative; successful blue/quarter controls had original DPI,
so no claim that 25.4 universally fails. No repeated completed test. Native
full-image DPI-only export result PENDING. User to select in a one-image
throwaway widget via System > Files and export JSON. No runtime changes.

## Four-part Files export PASSED and hosted images checked — 2026-10-07 07:28 Israel

Owner supplied native JSON after putting all four crops into four Image layers
in Eriaera. JSON contains four Web URL images; all four successfully downloaded
and decoded. Each hosted image remains 1653x779 RGBA (no resizing). Layer order:
0 bottom-right: 599,086 bytes, decoded pixels EXACT;
1 top-left: 1,490,296 bytes, 102 pixels differ, max RGB difference 12;
2 top-right: 1,536,007 bytes, 97 pixels differ, max RGB difference 12;
3 bottom-left: 724,588 bytes, 13 pixels differ, max RGB difference 1.
Every alpha value and ALL opaque RGB pixels match original crops exactly.
All differences are confined to non-opaque edge pixels. Do not call the hosted
exports entirely pixel-identical/lossless against original. Source crop ZIP
itself reconstructs original RGBA exactly. Compared against ZIP-contained crops
because an unpacked local source tile unexpectedly failed decode; archive
source crops decoded successfully, as did all four downloaded hosted images.

This establishes successful four-part export of the complete static map through
Files on Widgy 27.0.1 App Store. It does not establish exact cause/limit behind
full-image 422, working dynamic four-file updates, fast navigation or final
layout. Current test screenshot has stretched map; no final aspect ratio yet.
Next implementation gate: correct four-part geometry in a separate test copy,
then coordinated updates from one complete map frame and check navigation.
Do not modify the working one-file Shortcut/full widget before that is ready.
Uploaded JSON changes Files references to hosted Web URL in exported copy;
do not mistake reimported URL layers for preserved dynamic local bindings.

## Confirmed app version; four-part full-quality diagnostic prepared — 2026-10-07 morning

Owner confirms Widgy 27.0.1 installed from App Store, not TestFlight. Do not ask
again. Current App Store release notes do not explicitly identify a matching
422 export fix; targeted public search found no verified matching fix.

Prepared widgy-map-four-parts.zip, containing four exact 1653x779 crops of the
uploaded static 3306x1558 map (not the live personal map). Original RGBA pixels,
ICC and DPI retained. Exact reassembly verified byte-for-byte against decoded
original RGBA, and ZIP integrity passed. Tile sizes in reading order:
1-top-left.png 1,309,594 bytes; 2-top-right.png 1,536,777;
3-bottom-left.png 572,319; 4-bottom-right.png 561,090.
ZIP 3,980,234 bytes. No resize, quantization or flattening.

Next phone test: only in disposable test widget, use four Image layers, one
Files tile per layer, and export once with all four present. Overlap/placement
is immaterial for this upload-only diagnostic; precise final layout comes later.
Result PENDING. This tests a possible lossless partition approach, not a proven
fix or known server limit. If successful, still verify actual arrangement,
refresh and navigation performance before adopting it; coordinated four-file
Shortcut update is not implemented. No production or Shortcut changes made.

## Morning quarter-map export inspected — 2026-10-07 07:14 Israel

Owner supplied the successful quarter-map native JSON. Its image source is
Web URL on Widgy's image storage, like the previous blue-control export.
Downloaded and visually verified the referenced PNG: 1,026,698 bytes,
2411x1136 RGBA; sRGB, EXIF and DPI metadata. SHA256:
6879ddfebaba6a62dd44751aa781635fbd1782c82d9a5ba52438e5437ae7d9fc.
The source diagnostic was 1,630,238 bytes, 3306x1558 RGBA. The hosted blue
control was 60,423 bytes at the SAME 2411x1136 dimensions. Real map detail
therefore survives successful export, with the same output dimensions as blue.
No precise upload threshold or permanent repair is proven. Failure payloads
remain unavailable; hosted byte sizes are not necessarily request-body sizes.
JSON root field 9 differs (155 versus previous 140); semantics unverified,
so do not infer an app upgrade/version from it. Installed Widgy version remains
unknown. Next request: actual Widgy version and whether App Store or TestFlight,
to establish the affected build before prescribing further image changes.
No production code, Shortcut or approved image changes.

## Final diagnostic PASSED; stop for tonight — 2026-10-07 00:31 Israel

Owner reports "זה עובד" (it works) for widgy-map-detail-test.png selected
through System > Files and exported as JSON. The 3306x1558 RGBA diagnostic
containing the exact upper-right map quarter on the successful blue background
therefore exports successfully. This completes tonight's final requested test.
Do not request more tests tonight; continue in the morning from this result.

Together with the prior failed full maps and successful blue controls, this
shows real map detail can export when limited to this quarter of the canvas.
It does not prove a numeric size limit, the exact rejection cause, or a permanent
fix. The partial-map export's hosted image has not been supplied or inspected.
The permanent full-quality map export fix remains OPEN. No renderer, Shortcut,
automation, working widget or approved master asset was changed.

## Last diagnostic for tonight; resume in morning — 2026-10-07 00:25 Israel

The owner requests only ONE final test tonight, then sleep and continuation in
the morning. Do not request further experiments tonight after their result.

Prepared widgy-map-detail-test.png (1,630,238 bytes): full 3306x1558 RGBA canvas
with the original map's exact alpha plane and non-IDAT metadata/structure.
The upper-right quarter retains the original map pixels exactly; the remaining
RGB area is the same flat blue as the successful control. No resampling.
CRC/full decode, quarter-pixel equality, alpha and metadata checks passed.
This is a diagnostic copy, not approved artwork or a proposed final design.

The one requested native action is to select this image in the existing test
widget through Files and try JSON export. Result PASSED at 00:31 (see above). Record the result
without inferring a numeric upload limit or immediately asking another test.
The actual successfully hosted blue image was transformed to 2411x1136/60,423
bytes as documented below; input PNG size does not establish request-body size.

Resume from the recorded result in the morning. Main goal remains a permanent
export solution preserving the working map update path and quality. No runtime,
Shortcut, full widget or approved asset was changed. No scheduled task requested.

## Native JSON inspected; hosted image is transformed — 2026-10-07 00:22 Israel

The owner supplied the successful blue-control export as a 433-byte text file.
It is valid JSON for Eriaera with one image layer. The image's source field is
"Web URL" and its value is a PNG on widgy.fra1.digitaloceanspaces.com/images/.
The JSON contains no native Files path/bookmark for that layer. This confirms
conversion of the source in the exported document, not mutation of the working
widget's source. Root field 0 is 29; field 9 is 140 but its semantics are not
established, so neither is an independently confirmed installed app/build number.

The exact hosted image referenced by the export was downloaded successfully:
HTTP 200, Content-Type image/png, 60,423 bytes, dimensions 2411x1136, RGBA.
It has sRGB, eXIf, pHYs (~72 dpi), iDOT and four IDAT chunks, no embedded iCCP.
Its dimensions differ from the original 3306x1558 controls (32,917 / 4,326,777
bytes), so this is demonstrably transformed output, not byte-preserved storage.
The exported-image SHA256 is
4c0ab21bf9a27019a296650e91cf823968a1a4d59d2b51bc301a8de8aa2ef018.

The transformation occurred somewhere in the export/upload/storage pipeline.
This observation alone does NOT locate it before vs after the upload request.
It explains why the large-file control cannot settle the actual request-body
size of a detailed map. No upload-body capture, validation response body,
documented byte limit or proven permanent repair is available yet.

Consequences:
- Stop attempting small input PNG recompression/profile tweaks as established
  fixes; shared images are processed by the native/service export pipeline.
- A JSON produced by this tested share path is not a faithful backup of the
  original dynamic Files binding. Do not invent bookmarks or promise that
  re-importing it will continue following map-current.png.
- Installed Widgy version/build remains a requested diagnostic; do not confuse
  the document format or an unknown numeric JSON field with that version.
- Keep all successful/failed native tests above; no repeat requested.
No runtime/Shortcut/full widget/approved image was changed. Personal images and
raw exports are not committed; only synthetic-control measurements are recorded.

## Large equivalent control also exports — 2026-10-07 00:18 Israel

The owner confirms successful JSON export of widgy-same-image-large.png
(4,326,777 bytes). Both the 32,917-byte and 4,326,777-byte versions of the
pixel-identical full-size RGBA control export. The latter exceeds the sizes
of all supplied failed map trials. Original local PNG byte length alone
therefore does not explain the observed failures.

Do not equate input-file size with upload payload size: native decoding,
resampling/re-encoding or other processing before upload has not been observed.
This success does not prove that the upload service accepts a 4.33 MB body.
The map's pixel content/complexity and its handling remain relevant unresolved
differences. No blanket resolution, alpha, ICC or input-size restriction was
demonstrated. Do not repeat either successful blue-image control.

Next request: the actual successfully exported JSON from the NEW blue-control
widget, and the installed Widgy version/build (not Widget Format 29). Inspect
the export to learn what image source/reference Widgy serializes and whether
any uploaded-image properties are accessible; do not promise it contains an
upload trace, validation message, original Files bookmark or a root-cause answer.
No more speculative minor PNG recompression trials are currently requested.
Working map refresh stays unchanged; no permanent fix or runtime edit is claimed.

## Full-size RGBA control exports successfully — 2026-10-07 00:14 Israel

The owner confirms that widgy-fullsize-control.png exports successfully. This
positive native result accepts the failed map's dimensions, actual alpha plane,
ICC/DPI metadata and PNG chunk-type layout together for simple RGB content.
Do not repeat this test, the small RGB control, or claim that Files, RGBA,
3306x1558 dimensions or ICC metadata alone is categorically unsupported.

Next paired diagnostic: widgy-same-image-large.png, 4,326,777 bytes versus the
successful control's 32,917. The decoded pixels, alpha, metadata, scanline data,
and chunk types/order/count are identical. Only DEFLATE coding differs: an
initial region uses stored blocks and the rest stronger lossless compression.
The entire zlib stream and PNG CRCs fully decode correctly; native export is
pending. This is a diagnostic fixture, not an attempted production map fix.

If the paired large control fails, input encoding/length handling becomes a
strong suspect. If it succeeds, original local file length alone cannot explain
the map failures; Widgy could re-encode the simple image before upload, so actual
upload-payload size would still be unknown. Do not claim a numeric server limit
or infer that a local 4 MB file necessarily creates a 4 MB upload request.

The owner still requires an automatic permanent solution without recurring
source changes, loss of approved image quality or speculative runtime edits.
No production map, renderer, Shortcut or full widget was modified.

## Below-4-million-byte trial failed — 2026-10-07 00:10 Israel

The owner reports the same error for map-lossless-under4m.png (3,992,384 bytes).
The under-4,000,000-byte lossless variant is NOT a fix. Do not repeat that trial
or infer that size is fully excluded; a lower limit remains possible. Profile
normalization and small lossless re-encoding changes have now both failed.

Next diagnostic prepared: widgy-fullsize-control.png, 32,917 bytes. It is a flat
blue technical control with the failed map's exact 3306x1558 RGBA dimensions,
full alpha plane, ICC profile, DPI, and all non-IDAT chunks byte-for-byte. Chunk
types/order/count also match (497 IDAT chunks), and decoded storage is the same
20,602,992 RGBA bytes. Only RGB content and consequently compressed image data
differ. PNG CRCs, full decode, metadata, alpha and structure checks passed.
It contains no map/location content and is not a proposed design replacement.

Native export is pending. A success would show that the map's dimensions,
alpha shape and color metadata can be accepted together for simple content;
then focus on payload size/content/encoding handling. A failure would show
that lowering local compressed size alone is insufficient for this matching
format and prompt format/dimension controls. Neither outcome reveals the
actual native upload body or proves a specific server validation rule.

Keep the working widget untouched; select this file only in the new diagnostic
widget and try JSON export. Installed Widgy version/build remains unconfirmed.
No new renderer/Shortcut/approved-art changes. No permanent fix is claimed.

## Color-profile trial failed — 2026-10-07 00:04 Israel

The owner reports the same export error for map-srgb-test.png. Replacing only
iCCP with sRGB is therefore NOT sufficient. Do not repeat this completed trial,
implement that metadata change as a fix, or describe it as successful.

Next prepared diagnostic: map-lossless-under4m.png, based on the failed static
map. Its PNG filtering/compression and IDAT packing were changed; it is now
3,992,384 bytes versus 4,075,465. Dimensions remain 3306x1558, mode remains RGBA,
every decoded pixel including alpha matches exactly, and ALL non-IDAT chunks
(including original ICC profile and DPI) are byte-identical. Full decoding and
chunk CRC checks passed. No pixel/color reduction, resizing or flattening.

This is the first supplied map trial below 4,000,000 decimal bytes. The previously
failed static PNG was already below 4 MiB, so do not conflate those thresholds.
There is NO documented/proven upload limit. A successful result would implicate
encoding/size handling, not prove a specific size threshold: compression and
chunk packing changed together, and the actual native upload body is unknown.
A failure would not rule out a smaller size threshold or a dimension limit.
The native export result for this new candidate remains pending.

No production renderer/Shortcut/approved master was changed. The working Files
refresh remains intact. A permanent producer change requires a positive native
result and must handle varying future frames, not merely fit this one sample.
Installed Widgy version/build is still unknown.

## Positive Files export control — 2026-10-06 23:58 Israel

The owner reports selecting IMG_7352.PNG through Files and successfully exporting
JSON. This establishes that local Files-image export can work in the current
environment; do not continue describing a blanket Files upload failure or ask
for the tiny synthetic control again. The exact native widget used for this
successful control is not independently captured in this message.

The supplied successful image is a valid 503,594-byte, 1320x2868, 8-bit RGB PNG
without alpha. It has sRGB (intent 0), eXIf, pHYs (~144 dpi) and iTXt/XMP chunks,
and no embedded iCCP. The failed static map is 4,075,465 bytes, 3306x1558, RGBA,
with an embedded sRGB ICC profile and 25.4 dpi. Size, dimensions, alpha and color
metadata all differ; no single cause is proven. Do not infer a PNG corruption,
an alpha prohibition, or a numeric upload limit from this comparison.

One isolated full-quality trial was prepared as map-srgb-test.png:
- Based on the failed static map, not the approved master or the working file.
- Only replaces the iCCP chunk with an sRGB chunk (intent 0).
- All original IDAT bytes, dimensions, decoded RGBA pixels, alpha and DPI match.
- Valid CRCs/full decode checked; 4,075,147 bytes (318 bytes smaller).
- Native JSON export result is pending. It is a diagnostic, not a verified fix.

The producer code currently uses withIccProfile('srgb') before PNG encoding in
lib/home-map-day-night.js. If the isolated metadata trial succeeds, confirm the
same behavior with the live producer's output before making normalization
permanent. No runtime code, Shortcut, current map or approved asset was changed.
If it fails, color-profile representation alone is insufficient; next select a
different controlled payload variable rather than repeating the same tests.
Installed Widgy version/build remains unconfirmed.

## New one-layer reproduction — 2026-10-06 23:52 Israel

The owner created a NEW widget ("Eriaera"), added a NEW Image layer, and selected
Home_Map_Static_3306x1558.png through System -> Files. The screenshot shows one
layer, one data source, and HTTP 422 at Layer 1 / Image / Both Modes / Files.
This reproduces the failure without the original full document or its old layer.
"Widget Format: 29" is a document-format field, not the installed app version.

The newly supplied PNG was checked separately: 4,075,465 bytes, 3306x1558, 8-bit
RGBA, valid chunk CRCs, successful full decoding, no trailing bytes, sRGB ICC,
25.4 dpi and alpha range 0..255. It is a different valid image but shares the
previous map's dimensions, RGBA structure, ICC and DPI profile. It is NOT the
small unrelated-image control; do not infer that every local PNG upload fails.
No general file-size threshold or metadata cause has been established.

A separate synthetic control was prepared: widgy-upload-control-64.png, 64x64,
RGB, opaque, no ancillary metadata, 182 bytes. Its decoded dimensions/mode were
verified. It contains no map/location/user data and does not modify approved
artwork. The owner can select this control in the new one-layer widget and try
JSON export. That result and the installed Widgy version/build remain pending.
If the control succeeds, narrow the map-payload differences individually; if it
also fails, focus on native upload/app/service behavior. No new runtime change.

## Export investigation — permanent fix required, 2026-10-06

The owner confirms that existing URL-source map versions export JSON, whereas
the Files-source versions fail. The Photos-with-PNG-transparency trial also failed,
so the evidence points to the local-image sharing/upload path rather than Files
alone. The owner explicitly rejects changing the source before every export and
restoring it afterwards. The old export-copy workaround below is superseded as
the next action; it is not an accepted permanent solution.

### What is established

- Both the minimal map widget and the full widget fail on their map image layer.
  Layer count and Home variables therefore cannot alone explain the export error.
- The PNG is valid and renders; alternative lossless encoding and a new Photos
  source did not resolve HTTP 422. These checks do NOT exclude an undocumented
  payload/dimension/metadata restriction or a bug in Widgy's upload conversion.
- URL-source export success is an owner observation on URL-source versions,
  not a captured upload request/response or proof of the server's validation rule.
- No Widgy app/build number has been confirmed. The App Store page inspected on
  this date lists 27.0.1 (September 17). No explicit fix for this HTTP 422 case
  was found in its release notes. A historical Shortcut transparency-image
  upload fix is a different issue and must not be presented as this fix.
- We do not have the native upload request, response body, Widgy server logs,
  or native app source. No permanent repair has been verified.

### Public reports and their limits

1. July 2021: a user reports that QR sharing fails with Stash images; copying
   layers to a new widget and trying JPG/PNG/GIF did not help. This is evidence
   of a similar generic upload failure, not proof of the same HTTP status/root.
   https://www.reddit.com/r/widgy/comments/ok75ax
2. September 2022: a user reports file export failing with "image upload failed"
   and describes a downloaded image selected from Files.
   https://www.reddit.com/r/widgy/comments/xi5bzm
3. Developer duke4e identifies a missing referenced image as a common cause in
   another sharing-error thread; the original poster confirms it fixed their
   case. The original post is deleted and the surviving comment does not
   establish HTTP 422. Our valid file/reselection results do not establish
   this diagnosis for the current widget.
   https://www.reddit.com/r/widgy/comments/1bzb8r9/comment/kyp0j8r/
4. A recent user asks about "image upload failed" while publishing; no confirmed
   fix is visible in the retrieved discussion. Do not call it a confirmed
   current widespread 422 outage.
   https://www.reddit.com/r/widgy/comments/1vkm1g3/my_wallpaper_and_widgets/
5. Community discussion describes local Files/Stash/Photos images being uploaded
   during sharing. Another recommends images at about 1000 pixels for widget
   use. Neither establishes a current documented upload size/dimension limit.
   https://www.reddit.com/r/widgy/comments/toh80z
   https://www.reddit.com/r/widgy/comments/1amgbca
6. Official release history checked:
   https://apps.apple.com/us/app/widgy-widgets-home-lock-watch/id1524540481

Some historical threads were available through indexed search text but not
through direct page retrieval. The developer reply, recent complaint, official
App Store history and current beta discussion were directly readable. Searches
did not locate a verified public permanent fix matching our PNG + local source
+ HTTP 422 combination. Unrelated products also named Widgy are excluded.

### Next discriminating check (not performed)

Record the installed Widgy version/build. In a NEW blank diagnostic widget,
select one small, unrelated PNG through System -> Files and try JSON export.
This is a one-time control experiment, not a source-switching export workflow.
Do not alter the working full widget or repeat map refresh/navigation tests.

- If this control also returns 422, investigate the app/build and upload service
  with the Widgy developer; there is no basis to modify Vercel map rendering yet.
- If it succeeds, select the original map in that same new diagnostic widget
  and attempt export. Success would implicate old layer/document state; failure
  would focus investigation on the map payload or its native upload handling.
- Only after a map-specific failure is isolated should dimensions, byte size
  or metadata be varied individually. A validated necessary normalization can
  be made permanent in the producer while retaining map-current.png and Files;
  do not degrade or alter approved map artwork speculatively.
- A Widgy upload bug requires a Widgy-side fix. A useful escalation includes
  app/iOS builds, exact source/error, this control result and PNG characteristics.
  No external message has been sent and no personal image/location is published.

Acceptance requires export from the normal Files-configured widget without
manual source edits, plus native re-import behavior checked separately. Do not
assume a successful export preserves the dynamic local file binding on import.
Manual map refresh remains verified; automation and Calendar city work are paused.

## Export blocker — PNG validated; two native sources fail, 2026-10-06 23:34 Israel

The owner prioritizes restoring JSON export before the proposed shared Calendar
city binding. Export remains unresolved; no native Files serialization was obtained.

The uploaded map-current.png is a valid 3306x1558, 8-bit RGBA PNG of 4,272,509
bytes. Every PNG chunk CRC passed, zlib and full pixel decoding passed, and the
embedded sRGB ICC profile parsed successfully. No trailing bytes or corruption
were found. A separately saved map-export-test.png uses alternative lossless
encoding (4,190,914 bytes); decoded RGBA pixels and ICC bytes are exactly identical.
No server upload limit was established; do not claim that size caused HTTP 422.

After the alternative encoding trial, the 23:29 screenshot still reports HTTP 422
for Layer 240 / HOME / Home Hero World Map / Both Modes / Files in the full widget.
After selecting Image Library (With PNG Transparency), the 23:33 screenshot
explicitly names that new source and reports the same HTTP 422. Thus this failure
is not unique to the Files source. Do not repeat either completed trial or assert
that image-library export is a verified workaround. The active original should
keep its proven Files binding to map-current.png; the photo source is diagnostic
only and does not follow Shortcut file overwrites.

Next proposed recovery: in an export-only duplicate, remove only Home Hero World
Map and attempt JSON export. This has NOT been performed or verified yet. It is
an incomplete backup workaround, not a permanent export fix. Preserve the working
widget and Shortcut. If export succeeds, inspect the current native document and
restore/rebind the map explicitly after edits/import; never invent Files bookmarks.
If another image layer fails, retain its exact error rather than deleting unrelated
content indiscriminately. Do not change Vercel runtime or approved assets speculatively.

The proposed shared city-current.txt mechanism remains unimplemented. Manual map
refresh in the full widget remains verified; automation is still not configured.
Uploaded images and personal location information are not included in this repo.

## Current result — manual refresh works in full widget, 2026-10-06 22:58 Israel

The owner explicitly reports running the update Shortcut and seeing the time
advance. The supplied Home Screen image shows the full Native Steps Ring 2
layout with MAP TIME 22:57:16, replacing the previous 22:18:15 frame. The English
city and location marker remain visible. This is positive evidence of manual
fixed-file replacement being consumed by the full widget after native Files
selection. The earlier non-refresh interpretation is closed by the 22:56
clarification and this successful actual run; do not request that test again.

The earlier reported navigation improvement and residual delay relative to the
small consumer remain the latest explicit speed evidence. No new latency
measurement or speed report accompanied this screenshot. Do not call the full
widget equally fast or fully optimized. Background refresh while remaining on
Home, scheduling/locked execution, failed-download retention and an English city
binding shared with Calendar remain unverified. Automation is not configured.

Next priority is the owner's requested Home dependency work. Inspect the actual
Variables screen in the working full copy before asking for native edits; its
Files binding cannot currently be exported due to the HTTP 422 sharing error.
The generated-baseline audit below identifies map_request, steps_goal and
steps_progress as no longer reachable after removing the old map image consumer,
but their deletion alone is not a measured speed fix. Preserve functional Home
weather/health/calendar data and Calendar's remaining coordinate dependencies.
The temporary MAP TIME strip may be removed from the producer URL when moving to
the clean presentation; it is part of the PNG, not a separate Home text layer.
Do not edit approved assets or replace the working local map path.

## Correction — no Shortcut run before full-widget check, 2026-10-06 22:56 Israel

The owner clarifies that they did NOT run the update Shortcut before checking the
new full widget and sending its screenshot. The previous 22:48 interpretation of
the unchanged MAP TIME as a failed full-widget update was premature. The displayed
22:18:15 frame is the last saved image and is expected without another producer
run. Full-widget replacement freshness is UNTESTED, not a demonstrated failure.

The reported navigation improvement, residual delay compared with the small
consumer, Files selection and source audit remain valid. Automatic scheduling
has not been configured, so no new production was expected merely by waiting or
switching tabs. Do not diagnose caching, file mismatch or save failure from the
old timestamp. The proposed Files-output investigation is not needed unless an
actual update attempt fails.

Next: run the already working map update Shortcut once and let it finish, then
return to the new full widget and switch Calendar -> Home. Observe whether MAP
TIME advances and whether navigation remains improved. This is the first explicit
producer-to-full-widget replacement check, not a repeat of the completed small
consumer checks. Preserve the diagnostic strip for this observation and continue
the Home dependency work without attributing all delay to variable count.

## Current result — full widget uses Files; freshness unresolved, 2026-10-06 22:48 Israel

The small consumer's successful manual replacement and fast navigation remain
valid. Do not repeat those completed tests or generalize them to the full widget.

Export of the working small consumer was blocked: the supplied native dialog
says Image Upload Failed, HTTP 422, for HOME / Home Hero World Map / Both Modes /
Files. The owner reports that JSON export also fails. No Files source
serialization, bookmark or native export was obtained. Do not fabricate one.

The owner was guided to Edit As A Copy of Widgy Native Steps Ring 2 and selected
Home Hero World Map -> Image -> System -> Files, using the same map-current.png.
Aspect Fit and Both Modes were retained. The 22:42 editor screenshot shows Files
selected, 1514 layers and MAP TIME 22:18:15; the 22:45 Home Screen screenshot shows
the full widget and that same map time. The native Images indicator changed from
38.8 MB to 13.0 MB; this is not a measured extension RSS or performance result.
The diagnostic strip overlaps the Home event area and is not final artwork.

After being asked to run the existing update Shortcut and return Calendar -> Home,
at 22:48 the owner reports that the map time does not change, and navigation is
faster but still slower than the small map test. Record this as partial speed
improvement with unresolved full-widget freshness. The owner also explicitly
requests attention to additional Home variables. Their causal contribution has
not yet been isolated. Automatic scheduling is still not configured.

### Source audit for the installed full baseline

The public Native Steps Ring 2 generation chain was inspected using inert
example.test calendar URLs only. Its 1514 layers and 81 variables match the
visible native counts, but no export verifies all current phone-side fields.

- Replacing the map image consumer does not itself delete variable definitions.
  With the old map_request consumer excluded, map_request, steps_goal and
  steps_progress are unreachable by name/ID from the remaining generated
  document. The last two were already unused after the native ring replacement.
  Widgy may skip unused definitions; pruning them is not a proven speed fix.
- calendar_city_prefix remains an active, separate asynchronous city lookup,
  with dependencies on Latitude, Longitude, map_latitude_max5 and
  map_longitude_max5. Do not delete these four coordinate definitions while that
  consumer remains. A shared saved English city binding is still unverified.
- Home still consumes weather status/wind, greeting/day-progress calculations,
  the steps_today -> steps_label formatting chain and four calendar_home_* JSON
  fields. It also has direct native weather, sunrise/sunset, clock, reminders,
  distance, energy and ring bindings. Four JSON fields do not prove four requests.
  Native data must remain functional; blanket variable deletion is inappropriate.
- The phone-side Files edit is not reflected in the generated public JSON.
  No new widget import, variable removal, runtime deployment or source mutation
  has been performed by this checkpoint.

Next discriminating observation: inspect the actual map-current.png in Files
after the last Shortcut run and read its burned-in MAP TIME. A new time there
locates the unresolved problem downstream of saving (consumer binding/refresh);
an old time there requires inspecting the producer/output path first. Do not
assume caching, a wrong file, or a failed Shortcut from the unchanged widget alone.
Keep the diagnostic strip until this is resolved. Then optimize the active
full-widget dependencies while preserving layout/data, verify the shared
Calendar city, and configure native automatic updates.

Raw screenshots, GPS coordinates, personal resolved URLs and calendar data are
not committed.

## Current result — English city, coordinates and fast navigation, 2026-10-06 22:20 Israel

This supersedes the location-pending status at 20:50 below. The update Shortcut
now obtains Current Location once, extracts latitude and longitude, and calls
BigDataCloud's reverse-geocode-client endpoint on the phone with those current
coordinates and localityLanguage=en. Get Dictionary Value with key city reads
that GET response. Its output replaces the native Hebrew City token after the
final city_text parameter of the existing map URL. The map GET and fixed-file
overwrite remain in place. Geocoding belongs to the update Shortcut, outside
Home/Calendar tap actions; no backend geocoder was added.

At 22:18 the supplied image shows the English city label, location marker,
coordinate caption and MAP TIME 22:18:15. At 22:20 the owner explicitly confirms
that repeated Calendar -> Home transitions remain fast, the city and location
are displayed correctly, and the new timestamp remains. This is a positive
manual update and qualitative navigation result in the small test consumer.

Two earlier issues were isolated: the resolved map URL contained the literal
separator =lon& instead of &lon=, producing no valid location; correcting it
restored marker/coordinates. The native Hebrew city then rendered missing-glyph
boxes in the map font. The phone-side English city lookup resolves the observed
label issue. Do not misdiagnose an actual URL separator error as bidi display.
Keep city_text last because the parser consumes the entire remaining tail.

Remaining work: preserve this working Shortcut and small consumer; integrate
the fixed-file image into a separate copy of the full widget; verify a shared
city binding for Calendar; then configure and test automatic updates. Freshness
while staying on Home, scheduled/locked-device execution, failed-download
retention, locality fallback for an empty city, and full-widget performance are
not yet verified. Do not promise automatic refresh or zero local storage.
The temporary Show Content diagnostic still exists unless the owner removes it.

No runtime code, masters, layout or service plan changed in this checkpoint.
No device screenshots, raw GPS coordinates or resolved personal URLs are stored.

## Current result — fixed-file replacement and fast navigation, 2026-10-06 20:50 Israel

The owner returned to the Shortcuts/iCloud route after reviewing web alternatives.
The working native Shortcut downloads the complete server PNG using URL -> Get
Contents of URL -> Save File. It does not use Render Widgy Widget To Image.
The expanded Save File screenshot shows destination Shortcuts, Ask Where to Save
off, subpath `map-current.png`, and Overwrite If File Exists on. The instructed
destination is iCloud Drive/Shortcuts; the full destination-picker path was not
independently captured. No Photos action is part of this producer.

The initial output and native consumer show MAP TIME 20:16:42. After a later
manual Shortcut run, the Home screen shows 20:48:08. The owner explicitly confirms
that the image updated without editing Widgy or reselecting the source, and that
Calendar -> Home remains fast and retains the new timestamp. This supersedes the
earlier untested-Files status below: same-file replacement and qualitative fast
navigation now have a positive native-device result in the small test consumer.

The test URL keeps explicit empty lat/lon and renders no device location. Its
server PNG was separately verified as 3306x1558. Native byte preservation, refresh
while staying on Home, scheduled or locked-device execution, failed-download
recovery, cache retention, and performance in the full widget remain unverified.
Do not infer a timer, zero local storage, or full-widget success from this result.

Next: add one native Get Current Location action to the update Shortcut, then
derive latitude, longitude and city from that location. The existing renderer
can composite marker, coordinates and city into the PNG. Verify native numeric
formatting and city language before connecting the URL; the explicit-coordinate
server path does not reverse geocode. Use the same saved city for Calendar only
after its binding is verified. Keep acquisition outside Home/Calendar taps.
Automatic scheduling follows the location test and is not configured yet.

No runtime, approved master, widget layout or service plan changed. Raw device
images and personal coordinates are not committed.

## Owner storage constraint — 2026-10-06 17:14 Israel

The owner does not want accumulated images on the phone and requests cloud
storage. Stop the proposed growing Photos-album automation. The prior successful
album A-to-B/navigation result remains valid evidence, not the final architecture.
No photos are deleted and no new account, paid resource or runtime change is made.

The map renderer already runs on Vercel. Adding remote object storage alone does
not establish the fast local-consumer behavior for Web URL sources. Official
Vercel Blob public-storage documentation supports hosted image URLs and browser
conditional requests, with a minimum configurable cache lifetime of60seconds;
it does not prove Widgy sends conditional requests or updates a stable URL quickly.
No direct-URL speed or cache-retention promise follows from these service features.
Source: https://vercel.com/docs/vercel-blob/public-storage (checked2026-10-06).

Next bounded-storage candidate: one fixed-name PNG in iCloud Drive, overwritten
rather than appended. iCloud Drive is accessible through Files (Apple source:
https://support.apple.com/en-us/118443). A local downloaded copy/cache can remain;
cloud storage is not zero device storage. Do not claim exactly one native cache.
The owner's Image->System menu visibly includes Files, but live image replacement
through that source has NOT been tested. It may import a snapshot or lose access
when replaced. Existing album evidence cannot substitute for a Files A-to-B test.

Smallest next setup: inspect the native Shortcut Save File action's expanded
options for an explicit destination, stable filename and overwrite behavior.
Use a dedicated map-only folder/file. Then test one existing PNG and a later PNG
at that same path through an isolated native Files image consumer, confirming
both freshness and fast Calendar-to-Home navigation. Preserve the album control.
Do not invent native bookmarks/IDs, automatic cleanup or a reliable schedule.
The no-accumulation/cloud constraint takes precedence over the earlier next step.

## Latest result — album replacement with fast navigation, 2026-10-06 17:11 Israel

The earlier 15:26 speed result was for a fixed Photos image: the 16:20 source
screenshot showed `Image Library (With PNG Transparency)` selected. That also
explains why the first attempted album replacement was inconclusive.
At16:25 the owner reached the native Albums picker after being instructed to
select `Image Library - Newest Photo From Album (With PNG Transparency)`.
The dedicated album is displayed as `Widgy Map Local Tes`.
At16:27 the Home widget showed MAP TIME15:31:41, establishing the new baseline.
After the owner was asked to save a fresh PNG to that same album, the 17:08
Home screenshot shows MAP TIME17:07:26 and the changed day/night composition.
At17:10:38 the owner explicitly says the update happened when tapping Calendar
and then Home. At17:10:59 and17:11:25 they confirm transitions remain fast.

This is a positive manual producer-to-album replacement and qualitative
navigation result in the small consumer. It does not establish exact latency,
background refresh while remaining on Home, automatic scheduling, locked-device
execution, original-byte retention in Photos/Widgy, or full Home performance.
No native source JSON or album identifier has been extracted or invented.

Next: build a separate native Shortcut with URL -> Get Contents of URL (GET)
-> Save to Photo Album, using the existing full PNG endpoint and the selected
album. Verify one actual run and the resulting MAP TIME through normal navigation.
Keep the existing images until the new frame is validated; no automatic deletion,
blank placeholder, Render Widgy action, image resizing, conversion, or new reload
step is introduced in this initial producer test. Reload is not yet demonstrated
necessary for this navigation-based refresh. Scheduling/locked execution and
last-good-image retention under failed acquisition are separate remaining gates.
Do not attach downloading to each Home tap or promise a five-minute timer.

Apple primary sources checked on2026-10-06:
- https://support.apple.com/he-il/guide/shortcuts/apd58d46713f/ios documents URL
  input, Get Contents of URL and GET requests.
- https://support.apple.com/he-il/guide/shortcuts/apdaf74d75a5/ios documents saving
  photos into a specified album. Exact on-device fields remain screenshot-led.

No runtime, approved master, template, animation setting or hosting plan changed.
Raw phone screenshots and personal album listings are not stored in this repo.

2026-10-06, after the owner agreed at14:48 Israel to the distinct local-image route.
Branch f50-widget-test; baseline401df3632713bcd319a23526d095356c0d695c6c.

## Scope

The failed Widgy-rendered Alpha output is not reused. Use the existing approved
server renderer for a complete original-size PNG, saved separately on the phone.
This changes recurring acquisition from tiny masks to approximately4MB images.
Local native decoding/rendering, album ordering, refresh and automatic scheduling
remain device gates. No faster-navigation or background-update success is claimed.
No rendering/updating Shortcut is attached to the Home button.

## Verified existing producer

The existing endpoint was checked with explicit empty lat/lon, preventing both
GPS and IP-derived location. It renders a new complete server-now image and burns
the actual map time into a temporary diagnostic strip. No server/cache change.

URL: https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/api/night-map?mode=live&width=3306&presentation=glass&atlas=r6&diagnostic=refresh-v1&lat=&lon=

HTTP200, PNG3306×1558, 3942092 bytes.
SHA256 of inspected response: 7a717ddd23857564eb7cb14bde066604b2e54f11aec47ec66e1b2ce6a82ada1e.
Response render time: 2026-10-06T11:50:23.983Z (14:50 Israel).
X-Map-Location-Source: unavailable. Cache-Control: private,no-store,max-age=0.
The original server image was visually inspected: complete day/night composition,
no missing-night white plate. Original PNG file remains a scratch inspection
input, not a newly published art asset or an approved-master edit.

## Native consumer setup

Reuse the existing minimal `Widgy Map Static Only 1`, not Alpha's four images
or Five Minute's active coordinate/script variables. Its original21-node baseline
has zero variables and one Web URL map; it is NOT a local consumer until the
owner changes that one image source. All navigation/fonts/frame remain intact.
Existing import page fetchedHTTP200 and byte-identical to the branch.

1. Open the current PNG in Chrome, save the image into Photos and add it to a
   dedicated album, `Widgy Map Local Test`. Preserve the PNG without conversion,
   cropping or scaling. Native Photos/Widgy original-resolution retention is a
   device check, not proven just by server dimensions.
2. Import a separate Static Only1 from its existing copy page, or use a copy.
3. Select its Home Hero World Map image. In Image → System choose the option
   already observed in the owner's screenshot:
   `Image Library - Newest Photo From Album (With PNG Transparency)`.
   Select the dedicated album using the native picker; no album ID, bookmark or
   source-schema fields are guessed. This menu was observed; selection/output
   still need phone confirmation. If a different picker appears, inspect it.
4. Once the saved current MAP TIME is visible, verify ordinary Calendar→Home
   navigation. A fixed saved image establishes only the initial local-display
   gate, not live refresh. Request the observed result, not another timed video.

Then add a later complete image B to the same album, verify the shown timestamp
changes and does not regress to A. If it needs reload, inspect the observed
Widgy Reload action and selected slot; do not assume a reload preserves the tab.
Keep A until B is validated. Test offline/failed acquisition separately, then
an acceptable automated producer trigger. Native local serialization may be
captured from this non-private diagnostic when needed for repeatable imports.

No runtime files, endpoint, master image, template or paid hosting plan changed.
This checkpoint records a verified producer link and native setup instructions;
it does not claim the phone consumer is already configured or tested.

## First owner speed result — 2026-10-06 15:26:40 Israel

After the local-image instructions, the owner reports: “המעברים מהירים מאוד”
(the transitions are very fast). Preserve this positive qualitative result for
the current small consumer and saved map. It is not measured zero latency,
full Home integration, automatic updating or confirmed original-byte retention.
At15:24 the owner described a Photos-only image picker; we clarified Files →
Share → Save Image, then add to the dedicated Photos album. No new screenshot
or native export yet verifies the exact newest-album binding, so a successful
A→B replacement is still a meaningful gate and cannot be assumed.

Next: save a later current complete PNG B into the same album, retain A, return
to the existing Home widget without editing its source or manually reloading.
Observe whether MAP TIME changes to B. If it does, make two normal Calendar→Home
returns and report speed and whether the timestamp stays at B. If it does not,
inspect the actual source/album selection before assuming a scheduling fault
or adding Reload. No new import, animation change, server or paid service.
The link may add a literal diagnostic t value to avoid reopening the old browser
page; the existing server ignores t for solar time and still renders server-now.
