# Music Glass M1

An installable Scripting project implementing the approved **A / Split** design
as an iOS small Home Screen widget. This is a first device-test build, not a Widgy
JSON and not an HTML widget.

## Install

1. Install [Scripting](https://apps.apple.com/il/app/scripting/id6479691128).
   Its **SystemMusicPlayer and MediaLibrary APIs require Scripting PRO**.
2. Open `tools/music-glass-install.html` in the project's Preview deployment;
   choose Import. It imports `tools/Music_Glass_M1.zip` through Scripting's
   documented remote ZIP import. The archive contains one `Music Glass M1` folder.
3. Run Music Glass M1 once inside Scripting and grant Media & Apple Music access.
4. Start a song in Apple Music. Add a **small Scripting widget**, edit it and choose
   **Music Glass M1**. Use full-color Home Screen appearance for the approved colors.

The installed script includes all decorative assets. It does not fetch images
or music metadata from a server. The user's playback data stays on the device.

## Design

- 530-unit coordinate system scales to `Widget.displaySize`, square small family.
- Exact base and rim gradients from Device Glass D9, no cyan diagonal reflection.
- White `#F4F7FA`, lime `#C5FF0A`, muted `#AEB7C6`.
- Square 236-unit cover, title/artist at right, lower progress and controls panel.
- Phenomena outlines from the same repository font data preserve typography
  without a font installation. Other scripts, including Hebrew, use native Text.
- Four native `Button` elements: previous, play/pause, next, refresh. The three
  audio controls have 124×124-unit hit regions, about 44 points at a 188pt widget.
- Empty state shows a music note; no demonstration song or cover ships as data.

## Playback and refresh

`app_intents.tsx` registers one `AudioPlaybackIntent` for the three audio actions
and an ordinary `AppIntent` for refresh. Toggle reads the system player's state
when tapped, rather than trusting the last widget rendering. No queue replacement,
URL launch, Shortcuts invocation, or foreground navigation occurs in these intents.

The system music player shares playback with Apple's Music app. This build does
not claim Spotify or general cross-app playback control. Artwork is read from the
local media library and can be absent for some streaming-only tracks.

The widget requests a refresh after each action and a timeline reload after one
minute. **iOS decides the actual timeline schedule.** Progress is a snapshot, not a
live counter or seek control. Music changes outside the widget may require tapping
refresh. An amber indicator marks a recent action error; opening the script shows
its details. A missing cover does not disable controls.

## Build and verification

Run `node tools/music-glass/build.mjs` from the repo. It generates the decorative
PNG, compact font outlines, readable source bundle and deterministic ZIP. It uses
the repository's existing `sharp` dependency and Python's standard ZIP library.

Run `MUSIC_TYPESCRIPT_PATH=/path/to/typescript node tools/music-glass/verify.mjs`.
Checks use TypeScript 5.9.3 syntax transpilation and a mocked Scripting API:

- Playing/paused transitions use current player state, previous/next map correctly.
- Failed playback is recorded and reloads; a successful retry clears the error.
- Missing artwork, no item and unavailable PRO produce usable states.
- Latin title wrapping/truncation and native fallback preserve unsupported scripts.
- The built view has four AppIntent buttons and no redirect URL.

The layout was inspected with a local rendering of the generated view tree.
This validates our coordinates and outline assets, **not SwiftUI on an iPhone**.
No full SDK typecheck, on-device compilation, permission flow, audio-background
execution or Home Screen interaction test has been performed here.

First device acceptance: import → allow media access → add small widget → inspect
cover/title → play/pause several times without a foreground transition → next and
previous → inspect icon and artwork refresh. Use a downloaded Apple Music track
for the first test to avoid conflating missing library artwork with layout issues.

## Primary API references

- https://scriptingapp.github.io/guide/Widget/Widget%20Quick%20Start
- https://scriptingapp.github.io/guide/Widget/Widget%20API
- https://scriptingapp.github.io/guide/AppIntent
- https://scriptingapp.github.io/guide/Interactive%20Widget%20and%20LiveActivity
- https://scriptingapp.github.io/guide/Device%20Capabilities/SystemMusicPlayer
- https://scriptingapp.github.io/guide/Device%20Capabilities/MediaLibrary
- https://scriptingapp.github.io/guide/Script/Script
- https://scriptingapp.github.io/guide/Views/SVG

Only the Music Glass files and four public-manifest entries are added. Existing
Home, Calendar, Weather, Health and Device widgets are unchanged.
