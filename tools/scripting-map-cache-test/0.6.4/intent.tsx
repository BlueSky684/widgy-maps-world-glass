import { Intent, Script } from "scripting"
import { runQuietUpdate } from "./quiet"

// Same existing Run Intent Script shortcut, now with explicitly prepared
// folder write access and a shared writer mutex. The regular schedule is only
// managed by foreground buttons. A caught timeout may request one fresh tick.
async function main() {
  const parameter = Intent.shortcutParameter
  const message = await runQuietUpdate(parameter?.type === "text" ? parameter.value : undefined)
  Script.exit(Intent.text(message))
}
void main()
