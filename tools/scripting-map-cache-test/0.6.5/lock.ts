import { api, SafeMapError } from "./platform"

// A committed UNIQUE row is the mutex. Do not hold a SQL transaction across
// JS awaits: Scripting's transaction API is a declarative list of SQL steps.
// No timer may steal ownership from a suspended writer. After OS termination
// a retained row deliberately blocks writes until explicit recovery is added.
export async function withMapLock<T>(work: () => Promise<T>,
  observe: <R>(label: string, operation: () => Promise<R>) => Promise<R> = (_, operation) => operation(),
): Promise<T> {
  let db: any, owner: string
  try {
    owner = api("UUID").string()
    db = api("SQLite").open(
      api("FileManager").appGroupDocumentsDirectory + "/MapCacheTest-writer.sqlite",
      { busyMode: "immediateError" },
    )
    await observe("הכנת נעילה", () => db.execute("CREATE TABLE IF NOT EXISTS map_writer (slot INTEGER PRIMARY KEY CHECK(slot = 1), owner TEXT NOT NULL)"))
  } catch (_) {
    throw new SafeMapError("לא ניתן להפעיל את מנגנון השמירה בגרסת Scripting המותקנת [LOCK_UNAVAILABLE]. המפה לא שונתה.")
  }
  try {
    await observe("קבלת נעילה", () => db.execute("INSERT INTO map_writer (slot, owner) VALUES (1, ?)", [owner]))
  } catch (_) {
    throw new SafeMapError("לא ניתן להתחיל עדכון נוסף כרגע. אם הרצה קודמת הסתיימה וההודעה חוזרת, שלח את התוצאה [MAP_BUSY].")
  }
  try { return await work() }
  finally {
    try { await observe("שחרור נעילה", () => db.execute("DELETE FROM map_writer WHERE slot = 1 AND owner = ?", [owner])) }
    catch (_) { throw new SafeMapError("ההרצה הסתיימה אך נעילת השמירה לא שוחררה. בדוק את המפה ושלח את התוצאה [LOCK_RELEASE].") }
  }
}

