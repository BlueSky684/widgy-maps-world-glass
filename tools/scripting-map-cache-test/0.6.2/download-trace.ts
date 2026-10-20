import { SafeMapError } from "./platform"

export class DownloadError extends SafeMapError {
  constructor(message: string, public retryable: boolean) { super(message) }
}

// Wall-clock observations, not proof of iOS suspension. Never retain a URL,
// coordinates, credentials, raw native error, or arbitrary response header.
export class DownloadTrace {
  private started: number | null = null
  private lastPhase = 0
  private lastObservation = 0
  private limit = 0
  private active = false
  private timer: ReturnType<typeof setTimeout> | undefined
  private phases: string[] = []
  private phase = "HTTP"
  private maxGap = 0
  private timerLate: number | null = null
  private server: string[] = []
  private responseStatus: number | null = null
  private requestID = ""
  constructor(private now: () => number = Date.now) {}

  start(limit: number) {
    if (this.started !== null) throw new Error("Trace is single-use")
    this.started = this.lastPhase = this.lastObservation = this.now()
    this.limit = limit
    this.active = true
    const tick = () => {
      if (!this.active) return
      this.observe()
      this.timer = setTimeout(tick, 500)
    }
    this.timer = setTimeout(tick, 500)
  }
  private observe() {
    if (!this.active) return
    const current = this.now()
    this.maxGap = Math.max(this.maxGap, current - this.lastObservation)
    this.lastObservation = current
  }
  check() {
    if (!this.active) throw new DownloadError("הבקשה כבר הסתיימה [DOWNLOAD_CLOSED].", false)
    this.observe()
    const elapsed = this.now() - this.started!
    if (elapsed < 0) throw new DownloadError("שעון המכשיר השתנה בזמן הבקשה [CLOCK_CHANGED].", false)
    if (elapsed >= this.limit) {
      throw new DownloadError(`הזמן המותר להורדה חלף בשלב ${this.phase} [DOWNLOAD_LATE_${this.phase}].`, true)
    }
  }
  next(phase: string) {
    this.check()
    const current = this.now()
    this.phases.push(`${this.phase}: ${((current - this.lastPhase) / 1000).toFixed(1)}`)
    this.lastPhase = current
    this.phase = phase
  }
  timeout() {
    if (!this.active) return
    this.observe()
    this.timerLate = Math.max(0, this.now() - this.started! - this.limit)
  }
  headers(response: any) {
    if (!this.active) return
    try {
      const get = (name: string) => String(response.headers.get(name) || "")
      if (Number.isInteger(response.status) && response.status >= 100 && response.status <= 599) {
        this.responseStatus = response.status
        this.server.push(`HTTP ${response.status}`)
      }
      const render = get("server-timing").match(/(?:^|,)\s*map;dur=(\d+(?:\.\d+)?)(?:\s*(?:,|$))/)
      if (render && Number(render[1]) < 3600000) this.server.push(`עיבוד מפה בשרת: ${(Number(render[1]) / 1000).toFixed(2)} ש׳`)
      const rendered = get("x-map-rendered-at")
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(rendered) && Number.isFinite(Date.parse(rendered)))
        this.server.push(`זמן המפה UTC: ${rendered}`)
      const id = get("x-map-request-id")
      if (/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id)) this.requestID = id
    } catch (_) {} // Diagnostic headers must not break a valid download.
  }
  finish() {
    if (!this.active) return
    this.observe()
    this.phases.push(`${this.phase}: ${((this.now() - this.lastPhase) / 1000).toFixed(1)}`)
    this.active = false
    if (this.timer != null) clearTimeout(this.timer)
  }
  summary() {
    if (this.started === null) return ""
    return "פירוט ההורדה בשניות — " + this.phases.join(" · ") + "\n" +
      `פער מרבי בין נקודות מדידה: ${(this.maxGap / 1000).toFixed(1)} ש׳.\n` +
      (this.timerLate === null ? "" : `איחור טיימר העצירה: ${(this.timerLate / 1000).toFixed(1)} ש׳.\n`) +
      (this.server.length ? this.server.join(" · ") + "\n" : "טרם נצפתה תשובת HTTP.\n") +
      (this.requestID ? `מזהה בקשה: ${this.requestID}\n` : "")
  }

  // Keep the decisive download observations within a clipped notification.
  // HTTP is the native fetch await; it may include buffering. These numbers
  // do not independently identify DNS, server, network or iOS as the cause.
  compactSummary() {
    if (this.started === null) return ""
    return `שלב הורדה: ${this.phase} · תשובת HTTP: ${this.responseStatus ?? "טרם נצפתה"}\n` +
      this.phases.join(" · ") + " ש׳.\n" +
      `פער הורדה: ${(this.maxGap / 1000).toFixed(1)} ש׳` +
      (this.timerLate === null ? "" : ` · איחור עצירה: ${(this.timerLate / 1000).toFixed(1)} ש׳`) + ".\n"
  }
}
