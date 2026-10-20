import { Intent, Script } from "scripting"
import { runShortcutUpdate } from "./writer"

// Same existing Run Intent Script shortcut, now with explicitly prepared
// folder write access and a shared writer mutex. Scheduling is managed only
// by explicit foreground buttons; an update never creates another schedule.
async function main() {
  const parameter = Intent.shortcutParameter
  const message = await runShortcutUpdate(parameter?.type === "text" ? parameter.value : undefined)
  Script.exit(Intent.text(message))
}
void main()
