# Native appeared-transition capability — 2026-10-06

The owner's IMG_9928–9937 show a current Widgy warning that blending and
transitions on the same layer or across the same group break blend modes.
The screenshot-confirmed Off choice belongs to **Layer Appeared Transition**.
Layer Contents Updated Animation remains Interpolate; Layer Disappeared
Transition remains Reversed 'In' Transition. This is a different setting from
the earlier unsuccessful full-image content-animation Off trial.

The 18,970-byte Persistent1 native export received at12:17 Asia/Jerusalem
contains this sole `r0` field, on image84011, Live day Mask · Bitmap Time:

```json
{"b":0,"a":[{"d":736,"a":-1,"b":736,"c":0}]}
```

All four image sources, frames and blend objects otherwise match generated
Persistent1. The three variables are identical. Other native round-trip changes
include document9/a2, group bounds/omitted visibility defaults, and four navigation
binding shape fields. They are not incorporated into the transition preparation.
No original private export or raw screenshot is committed.

`map-mask-image-appeared-off.js` prepares ONLY the four observed image fields.
Its test reconstructs actual Persistent1 and proves whole-document equality after
removing those four additions, as well as no input mutation and rejection of
unsupported node types. It is intentionally not connected to an import page.

The native export has no group or shape `r0`. Existing JSON exports and54 packed
widget exports contain no additional captured `r0` example. Do not infer group
or shape source identifiers from image736 (other known effect identifiers differ
between images and groups). Also do not invent an explicit disappeared-transition
field or claim reversed In has been verified to disable exit transitions.

## Exact next capture

In the existing **Widgy Map Mask Persistent1**, retain the day image's Off.
Within **Persistent Map · Not A Navigation Target** set **Layer Appeared
Transition → Off** in Effects on:

1. The **Night group itself** (not its image).
2. Its sibling shape **Full Graphite Background** (id84040).

Share that same widget's JSON once. These two different layer types provide
the remaining native mappings for the three map groups and background. Leave
Interpolate, blend modes, sources and other settings as they are. No new import,
performance verdict, hosting migration or hierarchy variant is needed now.

After capture, finish a separate composition-wide appeared-Off copy against the
generated Persistent1 baseline (four images, three groups, one background),
without adopting incidental export normalization. Verify exact isolation and
real import-controller flows, publish and check public bytes before handing off.
The on-device gate remains no N-before-D/black-day blink on normal Home returns,
blank Calendar and matching advancing D/N stamps in ordinary use. Neither the
warning nor this export proves a speed fix or automatic five-minute refresh.
