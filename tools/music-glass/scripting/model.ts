import { MediaLibrary, Script, Storage, SystemMusicPlayer, UIImage } from "scripting"

export const BUILD = "M1"
export const ERROR_KEY = "music-glass.last-action-error"
export type MusicSnapshot = {
  title: string
  artist: string
  duration: number
  elapsed: number
  playing: boolean
  hasItem: boolean
  artwork: UIImage | null
  blocked: boolean
  issue: string | null
}

export function cleanSeconds(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0
}

export function formatTime(value: number): string {
  const seconds = Math.floor(cleanSeconds(value))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
}

export async function readMusic(): Promise<MusicSnapshot> {
  const empty: MusicSnapshot = {
    title: "Not playing", artist: "Start a song in Music", duration: 0,
    elapsed: 0, playing: false, hasItem: false, artwork: null,
    blocked: false, issue: null,
  }
  if (!Script.hasFullAccess()) {
    return { ...empty, title: "Setup needed", artist: "Scripting PRO", blocked: true,
      issue: "SystemMusicPlayer requires Scripting PRO." }
  }
  try {
    const item = SystemMusicPlayer.getNowPlayingItem()
    if (!item) return empty
    const duration = cleanSeconds(item.playbackDuration)
    const elapsed = cleanSeconds(SystemMusicPlayer.getCurrentPlaybackTime())
    const snapshot: MusicSnapshot = {
      ...empty,
      title: item.title || "Untitled",
      artist: item.artist || item.albumArtist || "Unknown artist",
      duration,
      elapsed: duration > 0 ? Math.min(elapsed, duration) : elapsed,
      playing: SystemMusicPlayer.getPlaybackState() === "playing",
      hasItem: true,
    }
    // Artwork is optional. A missing cover must never break playback controls.
    try {
      snapshot.artwork = await MediaLibrary.getArtwork(item.persistentID, {
        width: 300, height: 300,
      })
    } catch (error) {
      console.log("Music Glass artwork unavailable:", String(error))
    }
    return snapshot
  } catch (error) {
    return { ...empty, title: "Open Music Glass", artist: "Check music access",
      blocked: true, issue: String(error) }
  }
}

export function lastActionFailed(): boolean {
  const error = Storage.get<{ message: string; at: number }>(ERROR_KEY)
  return !!error && Date.now() - error.at < 120_000
}
