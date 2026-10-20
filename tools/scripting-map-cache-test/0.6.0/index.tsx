import { Script } from "scripting"
import { api } from "./platform"

// Load the menu inside the guard so an imported module's parse/evaluation
// error can be reported before Navigation.present. No updater runs on open.
async function main() {
  let phase = "MENU_LOAD"
  try {
    const menu = require("./menu")
    phase = "MENU_PRESENT"
    await menu.presentMenu()
  } catch (error) {
    const allowed = ["SyntaxError", "ReferenceError", "TypeError", "RangeError"]
    const name = error instanceof Error && allowed.includes(error.name) ? error.name : "Error"
    // Avoid native messages: they can contain private paths or URLs.
    try {
      await api("Dialog").alert({
        title: "Map Cache Test 0.6.0",
        message: "פתיחת התפריט לא הושלמה.\nקוד: " + phase + " · " + name +
          "\nצלם את ההודעה ושלח אותה. פתיחת התפריט אינה מפעילה עדכון מפה.",
        buttonLabel: "סגירה",
      })
    } catch (_) { /* The host may already be dismissing this script. */ }
  } finally { Script.exit() }
}
void main()
