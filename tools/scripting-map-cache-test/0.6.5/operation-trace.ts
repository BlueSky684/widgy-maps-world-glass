import { SafeMapError } from "./platform"
import { IO, Paths } from "./core"

// Only labels defined in our code are accepted by callers. No paths, URLs,
// file contents, or native exception text are stored in the returned report.
export class OperationTrace {
  private active = false
  private closed = false
  private timer: ReturnType<typeof setTimeout> | undefined
  private previous = 0
  private gap = 0
  private slowest = { label: "", ms: 0 }
  private failed = ""
  constructor(private now: () => number = () => Date.now()) {}
  private observe() {
    if (!this.active) return
    const current = this.now()
    this.gap = Math.max(this.gap, current - this.previous)
    this.previous = current
  }
  private start() {
    if (this.active || this.closed) return
    this.active = true
    this.previous = this.now()
    const tick = () => {
      if (!this.active) return
      this.observe()
      this.timer = setTimeout(tick, 500)
    }
    this.timer = setTimeout(tick, 500)
  }
  async measure<T>(label: string, work: () => Promise<T>): Promise<T> {
    this.start()
    this.observe()
    const start = this.now()
    try { return await work() }
    catch (error) { this.failed = label; throw error }
    finally {
      this.observe()
      const ms = Math.max(0, this.now() - start)
      if (!this.closed && (!this.slowest.label || ms > this.slowest.ms)) this.slowest = {label, ms}
    }
  }
  io(source: IO, paths: Paths): IO {
    const name = (path: string) => path === paths.stage ? "זמני" : path === paths.backup ? "גיבוי" : "מפה"
    // The comma keeps this unambiguous in both TypeScript and TSX loaders.
    const run = <T,>(label: string, work: () => Promise<T>) => this.measure(label, async () => {
      try { return await work() }
      catch (_) { throw new SafeMapError("פעולת קובץ נכשלה: " + label + " [FILE_IO].") }
    })
    return {
      exists: p => run("קיום " + name(p), () => source.exists(p)),
      read: p => run("קריאת " + name(p), () => source.read(p)),
      write: (p,b) => run("כתיבת " + name(p), () => source.write(p,b)),
      remove: p => run("ניקוי " + name(p), () => source.remove(p)),
    }
  }
  finish() {
    this.observe()
    this.active = false
    this.closed = true
    if (this.timer != null) clearTimeout(this.timer)
  }
  summary() {
    return (this.slowest.label ? `פעולת מערכת ארוכה: ${this.slowest.label} · ${(this.slowest.ms / 1000).toFixed(1)} ש׳.\n` : "") +
      `פער מרבי במדידות ההרצה: ${(this.gap / 1000).toFixed(1)} ש׳.\n` +
      (this.failed ? `פעולה שדיווחה שגיאה: ${this.failed}.\n` : "")
  }
}

