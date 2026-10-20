import { api, SafeMapError } from "./platform"
import { DEFAULT_SIZE, ORIGINAL_SIZE, MapSize } from "./core"

const settingPath = () => api("FileManager").appGroupDocumentsDirectory + "/MapCacheTest-resolution.json"
export function sizeFor(width: number): MapSize {
  if (width === 2400) return DEFAULT_SIZE
  if (width === 3306) return ORIGINAL_SIZE
  throw new SafeMapError("רזולוציית המפה אינה נתמכת [RESOLUTION_CONFIG].")
}
// Read within the existing writer lock, in both app and Shortcut environments.
// Importing the script does not read/write settings or start a download.
export async function selectedSize(): Promise<MapSize> {
  const fm = api("FileManager")
  try {
    if (!(await fm.exists(settingPath()))) return DEFAULT_SIZE
    const value = JSON.parse(await fm.readAsString(settingPath()))
    if (value?.schema !== 1) throw new Error()
    return sizeFor(value.width)
  } catch (_) {
    throw new SafeMapError("פתח את Scripting ובחר שוב ״עדכון ב־2400״ או ״חזרה לרזולוציה המקורית״ [RESOLUTION_CONFIG].")
  }
}
// Caller holds the same lock used by scheduled updates. Persist the choice
// before downloading; a failed download keeps the last valid map on disk.
export async function selectSize(width: number): Promise<MapSize> {
  const size = sizeFor(width)
  const text = JSON.stringify({schema: 1, width: size.width})
  const fm = api("FileManager")
  try {
    await fm.writeAsString(settingPath(), text)
    if (await fm.readAsString(settingPath()) !== text) throw new Error()
    return size
  } catch (_) {
    throw new SafeMapError("לא ניתן לשמור את בחירת הרזולוציה. המפה לא הוחלפה [RESOLUTION_CONFIG].")
  }
}
