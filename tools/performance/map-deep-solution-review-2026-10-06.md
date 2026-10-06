# Deep solution review: complete map presentation outside navigation

Date: 2026-10-06. Branch: `f50-widget-test`. Remote baseline:
`1e9e7a76185737fcb7ad6e95000054a8894a03cc` (local tree-equivalent `4f803ad`).
Request: investigate possible solutions deeply after the Fixed Alpha1 result.

## Decision and new finding

There is still no demonstrated end-to-end fix for the small-mask composition.
Keep the owner's fast Appeared Off1 result and the advancing, reasonably fast
single-image Five Minute1 as separate controls. Do not interpret the new research
as a successful phone test, abandon masks, or silently promote full Home.

**A documented capability changes the next investigation:** Widgy added an App
Intent that exports a widget as an image in version 4.1. The developer's own
announcement explicitly describes use through Shortcuts [1]. The current official
release history retains this feature [2]. This is a real producer candidate;
it is not a discovered `drawingGroup` property for an ordinary Widgy group.

Proposed design: prepare a complete map separately, then let Home display one
already-local image. If the producer can retain the static maps and acquire only
new solar masks, this preserves the small-network-update goal while moving
multi-layer composition out of Home navigation. That retention and the image
handoff remain unverified. Merely running the rendering action from the Home
button would put the expensive work back in the same path.

The first remaining gate is the rendering action's actual input/output contract,
not another mask import. No public parameter schema or working shared Shortcut
for this specific action was verified. Do not invent an AppIntent identifier,
resolution parameter, source-ready callback, atomic swap or `.shortcut` file.

## What the evidence distinguishes

| Evidence | Supported conclusion | Not established |
|---|---|---|
| Owner reports fast navigation in Appeared Off1 | Preserve that speed success | Complete map presentation; measured touch latency |
| Alpha1 removes white exposure but retains black day/N-before-D | Changing mask representation alone did not fix partial appearance | Exact native faulty operation |
| Fixed Alpha1 reproduces with zero variables and literal URLs | Variable evaluation and epoch changes are not necessary for this defect | No HTTP, decoding, cache lookup or native rendering work |
| Native warning about blends and transitions, plus repeated recordings | Native composition/presentation is a serious suspect | All masking is impossible, or the server has zero cost |
| Five Minute1 owner report: time advances, transitions relatively fast | A single completed image has positive device evidence | Full-widget integration; exact five-minute scheduling; zero stalls |

The editor's 79 MB image indicator is not measured process RSS. Tiny encoded
masks do not prove tiny native rendering cost. The approved 3306×1558 masters,
engraving, fonts and final appearance remain constraints, not optimization knobs.

## Capabilities checked against primary sources

1. **Image export through Shortcuts exists.** The developer announcement also
   identifies a Shortcuts screen under Transparency or Manage → More Settings.
   It does not document dimensions, PNG/color behavior, waiting for new image
   sources, locked-phone execution or output freshness [1,2]. A successfully
   flattened stale or incomplete map would still fail our requirements.
2. **Latest-photo consumption exists.** The developer documents a newest-photo
   album source including PNG support, more reliable local/album-image refresh,
   and slot-targeted reload improvements [3]. The owner's image-source screenshots
   independently show `Image Library - Newest Photo From Album` and its PNG
   transparency variant. A dedicated diagnostic album could avoid replacing a
   Files bookmark. This is an architecture inference, not proof of reliable
   switching, original-byte retention, alpha/color fidelity or timing.
3. **Inline compositions rendered as one image are a different feature.** The
   developer describes this for inline widgets [3]. There is no verified way to
   insert it as an arbitrary full-color map group in this large Home widget.
4. **Canvas inside Widgy JavaScript is not a verified escape hatch.** A firsthand
   report in the 4.1 announcement says `document`/canvas image code stopped
   working; the developer acknowledges the engine change and promises to inspect
   it [1]. This is historical evidence, not proof canvas is still broken today.
   No current DOM/canvas API, durable bitmap storage or completion contract was
   verified. Adding browser-only code to the existing source would be speculative.
5. **Native app-author APIs offer stronger control.** Apple documents background
   download completion followed by timeline reload, and future timeline entries
   for predictable events [4,5]. Solar position is predictable from time, so a
   custom renderer can prepare future solar frames. Widgy template access to
   those hooks was not verified. These are options for a companion/native app or
   Widgy development, not JSON settings available to this project.
6. **Scheduling is a separate requirement.** Apple's Shortcuts guide provides
   time-of-day/event triggers, with daily/weekly/monthly recurrence for the time
   trigger [6]. It does not establish an unrestricted five-minute background
   loop. A five-minute image URL bucket is also not a timer. Do not promise that
   every five minutes either a refresh or a Home delay must occur.

The exact Apple WidgetKit Markdown documentation was fetched and read directly
in this session because the web extractor could not parse its Markdown MIME
type. Search results for unrelated projects named Widgy were rejected. Some
historical Reddit blend threads and one recent Web Screenshot black-flash report
could not be opened; their search snippets are not used as a confirmed diagnosis
or as evidence for a current developer workaround. No developer message was sent.

## Candidate comparison

| Route | Potential benefit | Remaining blocker / disposition |
|---|---|---|
| Existing four-image native mask composition | Very small solar payload; owner-reported fast transition | Partial presentation reproduced. Stop arbitrary hierarchy, alpha-color, frozen-time or blanket-animation variants. |
| Widgy rendering intent → complete local image | Keeps composition out of consumer Home; could reuse existing masks and static maps | New priority for a capability check. Output size, complete/fresh input, background execution and consumer refresh are unknown. |
| Complete PNG from current server → local Files/album | Exact approved renderer available; consumer has one image | Larger download; local replacement/refresh, retention and automatic trigger still unverified. Useful separate fallback producer, not proof masks work. |
| Complete ready PNG through current cached Web URL | Existing positive Five Minute1 device evidence; simplest supported consumer | First acquisition, new image decoding, possible eviction and full-widget integration remain. Preserve as control. |
| Faster host / persistent renderer / CDN | Can improve render readiness, connection or download time | Cannot guarantee native multi-layer presentation. Prior ready-image delivery and CDN tests did not establish a complete fix. No paid migration justified. |
| Web Screenshot of a canvas map | Could flatten a browser composition into one image | Source-ready capture, resolution, WebView cost and last-good retention not verified. Not a justified immediate replacement for native image export. |
| One packed mask, gradient, alternate blend or light-only overlay | Possible reduction in inputs | One URL is not one presentation unit. Prior sampling/approved-formula comparisons have unresolved fidelity; no new verified native handoff. |
| Custom native widget/companion renderer | Can own complete frame state, cache validation, background completion and timelines | New software and device validation required; OS scheduling still applies. Consider if the Widgy handoff gate fails. |

Re-read the active `api/night-map.js`, not just the legacy `api/home-map.js`.
The active path already has bounded private ready-image reuse, an ETag and timing
headers; public CDN behavior is confined to an exact synthetic query. Changing
ordinary personalized map responses to public caching is not part of this review.

The earlier local resource benchmark recorded ~428–472 ms for subsequent fresh
renders and ~0.19–0.27 ms for ready-image reuse. These are handler measurements,
not iPhone timings. The prior phone-browser ready-image measurement still needed
about 977 ms overall for roughly 4 MB. See `whole-widget-delivery-2026-10-06.md`.
Thus a warmer server can reduce one component, but paying for one is not evidence
that Home becomes instant. Existing lossless PNG compression investigations need
not be repeated without a new hypothesis.

## Smallest useful next gate

First inspect the actual Widgy image-rendering action in Shortcuts, with its
options expanded. A screenshot of the available Widgy actions, or the actual
rendering action if identifiable, is enough to establish the next instruction.
This does not require changing the current widget or redoing animation settings.

Then, only if that contract permits it:

1. Use a separate non-private map producer. Render one completed map to an image
   without attaching the action to Home. Check the actual output file, dimensions,
   alpha/color handling, full map coverage and burned-in D/N time. Preserve the
   approved resolution; reject an implicit smaller widget screenshot as equivalent.
2. Advance the producer's solar state and export again. Both contributions must
   be complete and current. A stale export or N-before-D baked into the image is
   a failed producer gate. Do not assume the action refreshes all sources first.
3. Only after producer success, make an isolated consumer with one native local
   image source and the existing two-button navigation. Start with a dedicated
   album using the observed newest-PNG source, or a captured native Files binding.
   Do not handcraft permissions/bookmarks or put a self-referential consumer in
   the producer. Retain the previous complete image until a new output succeeds.
4. Verify A→B freshness, repeated navigation, no regression to A, offline/failure
   retention, and reload without opening Widgy or resetting the selected tab.
   Album ordering, file replacement and last-good retention are device gates.
   Do not delete A as part of the first diagnostic.
5. Only then select an acceptable automatic trigger and test it while locked.
   Do not adopt an always-running Shortcut loop or claim five-minute reliability.
   Full Home, Calendar, weather and fitness follow after the map passes.

If image rendering is unavailable or cannot preserve the map output, stop that
route before building a complex Shortcut. Keep Five Minute1 as the proven narrow
control and evaluate the complete-server-PNG local consumer separately. Any move
to a custom app or a paid service is a separate concrete decision.

## Other cards

Only the map is proposed for image preparation. Clock, weather, fitness and
Calendar should remain independently useful and interactive. Fitness currently
uses native Pedometer/Health sources; moving our map server does not accelerate
those sources. Weather currently uses Widgy's provider, not our map endpoint.
Calendar already has its own server snapshot path. Reuse validated values across
cards where supported, but do not bake all cards into one slowly updated bitmap
or forward health data to a hosting provider. The existing source inventory and
integration gates remain in `whole-widget-delivery-2026-10-06.md`.

## Sources checked 2026-10-06

- [1] Widgy developer duke4e, 4.1 announcement and canvas exchange:
  https://www.reddit.com/r/widgy/comments/1mjiook/widgy_41_released_to_the_app_store/
- [2] Official App Store release history:
  https://apps.apple.com/us/app/widgy-widgets-home-lock-watch/id1524540481
- [3] Widgy developer duke4e, v27 capabilities and fixes:
  https://www.reddit.com/r/widgy/comments/1w5rb1m/announcing_widgy_v27_public_beta_next_week/
- [4] Apple, network requests and background completion:
  https://developer.apple.com/documentation/widgetkit/making-network-requests-in-a-widget-extension.md
- [5] Apple, future timelines and adaptive reload scheduling:
  https://developer.apple.com/documentation/widgetkit/keeping-a-widget-up-to-date.md
- [6] Apple, Shortcuts event triggers:
  https://support.apple.com/en-il/guide/shortcuts/apd932ff833f/ios

This commit records research and a capability-gated next step. No runtime, mask,
source master, template, phone configuration or hosting plan is changed. No new
device test or automatic refresh mechanism is claimed as implemented or passed.
