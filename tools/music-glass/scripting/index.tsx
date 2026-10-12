import { Dialog, MediaLibrary, Script, Storage, Widget } from "scripting"
import { ERROR_KEY } from "./model"

async function main() {
  if (!Script.hasFullAccess()) {
    await Dialog.alert({
      title: "Music Glass M1",
      message: "שליטה ישירה ב־Apple Music דורשת Scripting PRO. העיצוב כבר מותקן. לאחר הפעלת PRO, פתח שוב את Music Glass.",
      buttonLabel: "הבנתי",
    })
    Script.exit()
    return
  }
  try {
    // Ask for the system media-library permission from the foreground, once.
    // Do not ask for permission from a widget or an audio intent.
    await MediaLibrary.getSongs(undefined, { limit: 1 })
    const error = Storage.get<{ message: string }>(ERROR_KEY)
    if (error) {
      await Dialog.alert({ title: "Music Glass — בדיקת הכפתור", message: error.message })
    }
    Widget.reloadAll()
    if (!Storage.get<boolean>("music-glass.setup-shown")) {
      await Dialog.alert({
        title: "Music Glass M1 מוכן לתצוגה",
        message: "הפעל שיר ב־Apple Music. במסך הבית הוסף ווידג׳ט קטן של Scripting, ודרך עריכת הווידג׳ט בחר Music Glass M1. כפתורי הניגון מיועדים להפעלה ישירה. זו גרסה ראשונה לבדיקה על האייפון.",
        buttonLabel: "הצג את הווידג׳ט",
      })
      Storage.set("music-glass.setup-shown", true)
    }
    await Widget.preview({ family: "systemSmall" })
  } catch (error) {
    await Dialog.alert({
      title: "Music Glass — גישה למוזיקה",
      message: `יש לאפשר ל־Scripting גישה למדיה ול־Apple Music בהגדרות האייפון.\n\n${String(error)}`,
    })
  }
  Script.exit()
}

main()
