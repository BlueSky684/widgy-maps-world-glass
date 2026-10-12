import { fonts } from "./glyphs"

type Weight = "Regular" | "Bold"
export function canOutline(value: string, weight: Weight): boolean {
  return [...value].every(char => !!fonts[weight].glyphs[char])
}

function width(value: string, cap: number, weight: Weight): number {
  const font = fonts[weight]
  return [...value].reduce((total, char, index, chars) => total +
    font.glyphs[char].advance + (index ? font.kern[chars[index - 1] + char] || 0 : 0), 0) * cap / font.cap
}

function ellipsis(value: string, cap: number, weight: Weight, max: number): string {
  if (width(value, cap, weight) <= max) return value
  let text = value
  while (text.length && width(text + "...", cap, weight) > max) text = text.slice(0, -1)
  return text.trimEnd() + "..."
}

export function linesFor(value: string, cap: number, weight: Weight, max: number, count: number): string[] {
  const words = value.trim().split(/\s+/)
  const lines: string[] = []
  let line = ""
  for (let index = 0; index < words.length; index++) {
    const candidate = line ? line + " " + words[index] : words[index]
    if (line && width(candidate, cap, weight) > max && lines.length < count - 1) {
      lines.push(ellipsis(line, cap, weight, max))
      line = words[index]
    } else line = candidate
  }
  if (line) lines.push(ellipsis(line, cap, weight, max))
  return lines.slice(0, count)
}

// Outlines keep the exact approved Phenomena shapes without installing a font.
// Hebrew and other scripts use native Text, preserving their characters/shaping.
export function textSVG(value: string, w: number, h: number, cap: number,
  weight: Weight, color: string, count = 1, align: "start" | "end" = "start"): string {
  const font = fonts[weight], scale = cap / font.cap
  const lines = linesFor(value, cap, weight, w, count)
  let paths = ""
  lines.forEach((line, row) => {
    let x = align === "end" ? w - width(line, cap, weight) : 0
    const y = cap + row * cap * 1.32
    const chars = [...line]
    chars.forEach((char, index) => {
      if (index) x += (font.kern[chars[index - 1] + char] || 0) * scale
      const glyph = font.glyphs[char]
      paths += `<path d="${glyph.path}" transform="translate(${x.toFixed(3)} ${y.toFixed(3)}) scale(${scale} ${-scale})"/>`
      x += glyph.advance * scale
    })
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w * 2}" height="${h * 2}" viewBox="0 0 ${w} ${h}"><g fill="${color}">${paths}</g></svg>`
}
