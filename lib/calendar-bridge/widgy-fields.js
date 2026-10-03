// One native JSON Endpoint source supplies an encoded, non-executable snapshot.
// Local field scripts retain freshness checks without making network requests.
export function widgyFields(snapshot) {
  const ready=snapshot?.version===2 && snapshot.ok===true;
  const data=ready?snapshot:{version:2,ok:false};
  return {encoded:encodeURIComponent(JSON.stringify(data))};
}
