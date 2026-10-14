export const BUDGET_DOCUMENT = 'widgyControl/bdc-budget-v1';

// Same conservative rolling 32 UTC-day buckets and 10/minute rule as Redis.
// Missing, disabled or malformed data never initializes a new allowance.
export function budgetState(ledger, nowMs = Date.now()) {
  const day = Math.floor(nowMs / 86400000), minute = Math.floor(nowMs / 60000);
  if (!ledger || ledger.schema !== 1 || ledger.state !== 'active' ||
      !ledger.days || Object.getPrototypeOf(ledger.days) !== Object.prototype ||
      !Number.isSafeInteger(ledger.minute) || ledger.minute < 0 || ledger.minute > minute ||
      !Number.isSafeInteger(ledger.rate) || ledger.rate < 0 || ledger.rate > 10 ||
      typeof ledger.migrationId !== 'string' || !/^[a-f0-9-]{36}$/.test(ledger.migrationId)) throw Error('budget_unavailable');
  let used = 0;
  const days = {};
  for (const [key, count] of Object.entries(ledger.days)) {
    if (!/^\d+$/.test(key) || !Number.isSafeInteger(Number(key)) || Number(key) > day ||
        !Number.isSafeInteger(count) || count < 0 || count > 40000) throw Error('budget_unavailable');
    if (Number(key) >= day - 31) {days[key] = count; used += count;}
  }
  if (used > 40000) throw Error('budget_unavailable');
  return {day, minute, days, used};
}

export function createFirestoreBudget({store, now = Date.now} = {}) {
  return async function reserve() {
    const deadline = now() + 1500;
    for (let attempt = 0; attempt < 4; attempt++) {
      const remaining = () => Math.max(1, deadline - now());
      if (now() >= deadline) throw Error('budget_unavailable');
      let document;
      try { document = await store.get(BUDGET_DOCUMENT, {timeoutMs: remaining()}); }
      catch { throw Error('budget_unavailable'); }
      const ledger = document?.value, state = budgetState(ledger, now());
      if (!document.updateTime) throw Error('budget_unavailable');
      if (state.used >= 40000) throw Error('budget_exhausted');
      if (ledger.minute === state.minute && ledger.rate >= 10) throw Error('budget_rate_limited');
      const next = {...ledger, days: {...state.days, [state.day]: (state.days[state.day] || 0) + 1},
        minute: state.minute, rate: ledger.minute === state.minute ? ledger.rate + 1 : 1};
      if (now() >= deadline) throw Error('budget_unavailable');
      try {
        await store.put(BUDGET_DOCUMENT, next, {updateTime: document.updateTime, timeoutMs: remaining()});
        return {used: state.used + 1, limit: 40000};
      } catch (error) {
        // Only a confirmed failed precondition is safe to retry. An ambiguous
        // timeout may have committed: deny the provider call, never refund it.
        if (error.message !== 'firestore_conflict') throw Error('budget_unavailable');
      }
    }
    throw Error('budget_unavailable');
  };
}
