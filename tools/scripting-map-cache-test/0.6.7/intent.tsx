import { Intent, Script } from "scripting"
import { runQuietUpdate } from "./quiet"
import { beginNative, finishNative, NATIVE_PREFIX } from "./native-transfer"

// Explicit native two-phase handoff; old four-line input remains compatible.
// The regular schedule is changed only by foreground buttons. Native prepare
// may reserve one recovery watch. Once spent, only a non-triggering reminder
// is scheduled until verified success; no unbounded download retry loop.
async function main() {
  const parameter = Intent.shortcutParameter
  const input = parameter?.type === "text" || parameter?.type === "url" ? parameter.value : undefined
  const message = typeof input === "string" && input.startsWith(NATIVE_PREFIX)
    ? await beginNative(input.slice(NATIVE_PREFIX.length))
    : typeof input === "string" && input.startsWith("https://")
      ? await finishNative(input, Intent.fileURLsParameter)
      : await runQuietUpdate(input)
  Script.exit(Intent.text(message))
}
void main()

