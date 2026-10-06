# Widgy image-rendering intent: first saved-output result

Date: 2026-10-06, 14:04–14:06 Asia/Jerusalem. Branch: `f50-widget-test`.
Baseline remote `fdbbd78376cae33567217d6a26638fdc1564c311`; local tree-equivalent `f75dd4f`.

## Result

The rendering action exists, accepts a native `.widgy` file, and returns a savable
PNG. **This output fails the complete-composition and original-resolution gates.**
Do not use it as a Home image or build an automatic album/reload chain on it.
This is a failure of this tested export, not proof that all image preparation or
all masking in Widgy is impossible. Approved source masters are unchanged.

## Observed phone contract

- IMG_9944 lists Render Widgy Widget To Image and separate Reload actions.
- IMG_9945 shows one displayed parameter, Widgy File; selection opens Files
  (IMG_9946). No resolution or wait-for-sources setting was observed.
- Fixed Alpha1 was initially selected in Widgy but corrected to the live Alpha1;
  the actual rendered heading confirms ALPHA MASK.
- IMG_9948 shows a selected `.widgy` file. UUID filename alone is not version proof.
- IMG_9950 preview has D 06/10 13:50, a white right plate, and excessive brightness.
- IMG_9951 confirms Save File receives the rendering action's output directly.
- The original saved PNG uploaded at 14:04 has D 06/10 14:00 and the same white
  right plate. The advancing D stamp establishes day-source advancement between
  the two observed outputs; it does not establish complete paired freshness.
- At 14:05 and 14:06 the owner explicitly rejects the appearance.

## Original-file inspection

Input: `widgyImage-B0E0AAD6-1547-479F-A709-75ECADE8B24E.png`.
SHA256: `4a7afc83b94c2277561904999faa4ac11be6024bec9e1d80d68dc3fffe6857af`.
Size: 889,734 bytes. PNG, 8-bit RGBA, sRGB chunk, 1170×1170 pixels.
All output alpha values are 255. The configured background is opaque, so this
is not evidence that the action can never preserve transparency.

The map occupies approximately x23..1145, y154..683, about 1123×530 pixels
including its diagnostic strip. The whole-widget dimensions must not be quoted
as the map's dimensions. Neither preserves the approved 3306×1558 map raster.
PNG losslessness does not reverse this reduction. No resolution control has yet
been observed; do not claim none exists anywhere or invent one.

The interior of the right diagnostic plate (x587..1143, y648..679) contains
17,824/17,824 exact white RGB pixels. There is no N timestamp there. The left
plate shows D 06/10 14:00. Static night.png deliberately has a white right plate;
the dynamic night alpha mask should turn that into black with a white N label.
Thus the saved output itself is defective, not just the Shortcuts preview.

## Bounded composition analysis

Read the actual static-asset builder and Alpha1 implementation. Source alpha
masks are black in RGB and encode inverse solar/stamp weight in alpha. Generate
both for 2026-10-06T11:00:00Z (14:00 Israel), resize the unchanged static maps and
masks independently to the approximate exported map bounds, and compare
RGB-byte-space compositions to the uploaded output. Exclude the stamp band and
an 8-pixel boundary (1,567,512 sampled color channels).

| Approximate model | Mean absolute channel error (0–255) |
|---|---:|
| Both day and night masked | 16.704 |
| Day masked, night unmasked | 2.203 |
| Day unmasked, night masked | 22.406 |
| Both unmasked | 8.333 |

This strongly supports an effectively unapplied night mask in the saved output,
consistent with the white night plate and lights across daytime terrain. It is
an inference, not an exact native-renderer proof: native subpixel sampling,
color handling and blend order are not reproduced exactly by this approximation.
The failure could involve source readiness, export-time loading, or native
composition; no claim is made that the server failed, the variable was wrong,
or a specific Widgy internal operation is known. A delay *after* an already
returned PNG cannot repair that PNG. No readiness control was observed.

## Next decision

Close this export configuration as unsuitable for the intended final image.
Do not request more arbitrary animation toggles, identical exports, or a frozen
Alpha re-import. A future retry needs a concrete readiness/resolution capability.
No consumer, background loop, reload action or paid-host migration is warranted
by this result. Preserve fast Appeared Off1 and advancing Five Minute1 controls.

The next distinct, evidence-backed route is a full-resolution PNG produced by
the approved server renderer, then an isolated local-image consumer, if the
owner continues that route. It abandons tiny-mask-only downloads for that test
and must be described honestly. It still needs native file/album source binding,
freshness, last-good retention, navigation and automatic-trigger verification.
Do not silently promote it or claim those gates passed. Native/companion local
composition remains a separate software project, not an available Widgy setting.

No runtime, master asset, widget layout, phone configuration or hosting plan is
changed in this checkpoint. Only findings are committed; user source PNG and
screenshots remain outside the repository.
