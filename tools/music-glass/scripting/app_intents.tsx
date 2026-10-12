import { AppIntentManager, AppIntentProtocol, Storage, SystemMusicPlayer, Widget } from "scripting"
import { ERROR_KEY } from "./model"

type PlaybackAction = "toggle" | "previous" | "next"

export const MusicGlassPlayback = AppIntentManager.register<PlaybackAction>({
  name: "MusicGlassPlaybackM1",
  protocol: AppIntentProtocol.AudioPlaybackIntent,
  perform: async (action) => {
    try {
      // Read actual state at tap time: the widget's displayed snapshot may be old.
      // Never replace the Music queue and never launch a URL or Shortcut.
      if (action === "toggle") {
        const state = SystemMusicPlayer.getPlaybackState()
        if (state === "playing" || state === "seekingForward" || state === "seekingBackward") {
          await SystemMusicPlayer.pause()
        } else {
          await SystemMusicPlayer.play()
        }
      } else if (action === "previous") {
        await SystemMusicPlayer.skipToPreviousItem()
      } else if (action === "next") {
        await SystemMusicPlayer.skipToNextItem()
      } else {
        throw new Error("Unknown playback action")
      }
      Storage.remove(ERROR_KEY)
    } catch (error) {
      Storage.set(ERROR_KEY, { message: String(error), at: Date.now() })
      console.error("Music Glass playback:", String(error))
    } finally {
      Widget.reloadAll()
    }
  },
})

export const MusicGlassRefresh = AppIntentManager.register({
  name: "MusicGlassRefreshM1",
  protocol: AppIntentProtocol.AppIntent,
  perform: async () => { Widget.reloadAll() },
})
