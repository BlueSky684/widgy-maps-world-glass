// Diagnostic-only phone timestamp pair. The caller must already have
// authorized and validated a native transfer. Ignore malformed optional data;
// never change the image, freshness contract, cache key or HTTP outcome.
export function readNativeHandoffTiming(url, handlerEnteredAt) {
  try {
    const values = url.searchParams.getAll('handoff_v1');
    if (values.length !== 1 || !Number.isSafeInteger(handlerEnteredAt)) return null;
    const m = /^([1-9][0-9]{12}),([1-9][0-9]{12})$/.exec(values[0]);
    if (!m) return null;
    const exitSnapshotAt = Number(m[1]), readyAt = Number(m[2]), tailMs = readyAt - exitSnapshotAt;
    if (tailMs < 0 || tailMs > 86400000) return null;
    // Keep signed differences: the device/server clocks may disagree. This
    // measures neither pure network latency nor arrival at the Vercel edge.
    return {version:1, exitSnapshotAt, readyAt, tailMs, handlerEnteredAt,
      readyToHandlerMs:handlerEnteredAt - readyAt};
  } catch { return null; }
}
