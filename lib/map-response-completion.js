// Node response lifecycle only. A finish event is a handoff to the server's
// transport, not proof that Vercel's edge or the phone received/displayed PNG.
// Do not retain or log request URLs, headers, location, city or response bytes.
export function observeMapResponseCompletion(res, report) {
  if (typeof res.once !== 'function') return;
  let recorded = false;
  const record = phase => {
    if (recorded) return;
    recorded = true;
    try {
      report(phase, {
        status: Number.isInteger(res.statusCode) ? res.statusCode : null,
        headersSent: res.headersSent === true,
        writableEnded: res.writableEnded === true,
        writableFinished: res.writableFinished === true
      });
    } catch {} // Diagnostic failure must not interrupt image delivery.
  };
  res.once('finish', () => record('finished'));
  res.once('close', () => record(res.writableFinished === true ? 'closed_after_flush' : 'closed_early'));
}
