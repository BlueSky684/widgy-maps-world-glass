import { SafeMapError } from "./platform"

// Reserve roughly ten seconds of the usual 30-second App Intent allowance for
// verified publication and cleanup. This is not an OS runtime guarantee.
export const PREPARATION_BUDGET_MS = 20000
export class UpdateTiming {
  private started: number
  private last: number
  private phases: string[] = []
  constructor(private now: () => number = () => Date.now()) {
    this.started = this.last = this.now()
  }
  remaining(capMs = PREPARATION_BUDGET_MS): number {
    const remaining = PREPARATION_BUDGET_MS - (this.now() - this.started)
    if (remaining <= 0) {
      throw new SafeMapError("העדכון נעצר לפני החלפת המפה כדי לא להתחיל שמירה באיחור [UPDATE_TIME].")
    }
    return Math.min(capMs, remaining)
  }
  mark(label: string) {
    const current = this.now()
    this.phases.push(`${label}: ${((current - this.last) / 1000).toFixed(1)}`)
    this.last = current
  }
  total(): string { return ((this.now() - this.started) / 1000).toFixed(1) }
  summary(): string { return "זמנים בשניות — " + this.phases.join(" · ") }
}

