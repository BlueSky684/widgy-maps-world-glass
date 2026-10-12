import { Button, Capsule, Image, Path, RoundedRectangle, Script, SVG, Text, Widget, ZStack } from "scripting"
import { MusicGlassPlayback, MusicGlassRefresh } from "./app_intents"
import { formatTime, lastActionFailed, readMusic, MusicSnapshot } from "./model"
import { canOutline, textSVG } from "./typography"

const C = { white: "#F4F7FA", muted: "#AEB7C6", lime: "#C5FF0A" }

function MusicGlass({ music }: { music: MusicSnapshot }) {
  // Match the system-small footprint, rather than assuming a particular iPhone.
  const side = Math.min(Widget.displaySize.width, Widget.displaySize.height)
  const u = (value: number) => value * side / 530
  const frame = (w: number, h: number) => ({ width: u(w), height: u(h) })
  const at = (x: number, y: number) => ({ x: u(x), y: u(y) })
  const failed = lastActionFailed()

  function Copy({ value, x, y, w, h, cap, weight = "Regular", color = C.white, lines = 1,
    align = "start" }: {
    value: string; x: number; y: number; w: number; h: number; cap: number
    weight?: "Regular" | "Bold"; color?: string; lines?: number; align?: "start" | "end"
  }) {
    const clean = value.replace(/\s+/g, " ").trim().slice(0, 180)
    return canOutline(clean, weight) ?
      <SVG code={textSVG(clean, w, h, cap, weight, color, lines, align)} resizable
        frame={frame(w, h)} position={at(x + w / 2, y + h / 2)} /> :
      <Text font={u(cap * 1.08)} fontWeight={weight === "Bold" ? "semibold" : "regular"}
        foregroundStyle={color} lineLimit={lines} minScaleFactor={0.8} truncationMode="tail"
        multilineTextAlignment={/[\u0590-\u08ff]/.test(clean) ? "trailing" : "leading"}
        frame={{ ...frame(w, h), alignment: "topLeading" }}
        position={at(x + w / 2, y + h / 2)}>{clean}</Text>
  }

  const button = (action: "previous" | "toggle" | "next", symbol: string, x: number, icon: number, color: string) =>
    <Button intent={MusicGlassPlayback(action)} buttonStyle="plain" disabled={music.blocked}
      position={at(x, 459)}>
      <ZStack frame={frame(124, 124)} contentShape="rect">
        <Image systemName={symbol} resizable scaleToFit
          frame={frame(icon, icon)} foregroundStyle={color} />
      </ZStack>
    </Button>

  return <ZStack frame={{ width: side, height: side }}
    environments={{ layoutDirection: "leftToRight" }} widgetBackground="#101B23">
    <Image filePath={Path.join(Script.directory, "chrome.png")} resizable
      frame={{ width: side, height: side }} />

    {music.artwork ?
      <Image image={music.artwork} resizable scaleToFill frame={frame(236, 236)}
        clipShape={{ type: "rect", cornerRadius: u(21), style: "continuous" }}
        position={at(156, 235)} /> :
      <ZStack frame={frame(236, 236)} position={at(156, 235)}>
        <RoundedRectangle cornerRadius={u(21)} fill="#12212B" />
        <Image systemName="music.note" resizable scaleToFit frame={frame(76, 76)}
          foregroundStyle="#526674" />
      </ZStack>}

    <Copy value={music.title} x={314} y={145} w={174} h={127} cap={32} weight="Bold" lines={3} />
    <Copy value={music.artist} x={314} y={286} w={174} h={59} cap={23} color={C.muted} lines={2} />

    <Copy value={music.hasItem ? formatTime(music.elapsed) : "—"} x={45} y={381} w={64} h={29} cap={20} color={C.muted} />
    <Copy value={music.duration > 0 ? formatTime(music.duration) : "—"} x={421} y={381} w={64} h={29} cap={20} color={C.muted} align="end" />
    {music.duration > 0 && music.elapsed > 0 ?
      <Capsule fill={C.lime} frame={frame(286 * music.elapsed / music.duration, 6)}
        position={at(122 + 143 * music.elapsed / music.duration, 393)} /> : null}

    {button("previous", "backward.end.fill", 128, 25, C.white)}
    {button("toggle", music.playing ? "pause.fill" : "play.fill", 265, 35, C.lime)}
    {button("next", "forward.end.fill", 402, 25, C.white)}

    <Button intent={MusicGlassRefresh(undefined)} buttonStyle="plain" position={at(469, 65)}>
      <ZStack frame={frame(90, 100)} contentShape="rect">
        <Image systemName={failed || music.issue ? "exclamationmark.circle" : "arrow.clockwise"}
          resizable scaleToFit frame={frame(22, 22)}
          foregroundStyle={failed || music.issue ? "#FFBD66" : C.muted} />
      </ZStack>
    </Button>
  </ZStack>
}

async function main() {
  const music = await readMusic()
  // This is a snapshot, not a fake ticking timer. iOS schedules timeline updates.
  Widget.present(<MusicGlass music={music} />, {
    policy: "after", date: new Date(Date.now() + 60_000),
  })
}

main()
