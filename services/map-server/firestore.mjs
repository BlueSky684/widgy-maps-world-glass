// Google-only runtime storage. Cloud Run's attached service account supplies
// short-lived OAuth tokens; no downloaded key or Redis credential is required.
const PROJECT = /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/;
const DATABASE = /^(?:\(default\)|[a-z][a-z0-9-]{2,61}[a-z0-9])$/;
const DOCUMENT = /^(?:widgyCityCache\/[a-f0-9]{64}|widgyControl\/bdc-budget-v1)$/;

export function databaseName(env) {
  const project = env.FIRESTORE_PROJECT_ID, database = env.FIRESTORE_DATABASE_ID || '(default)';
  if (!PROJECT.test(project || '') || !DATABASE.test(database)) throw Error('firestore_not_configured');
  return `projects/${project}/databases/${database}`;
}

export function encodeValue(value) {
  if (value === null) return {nullValue: null};
  if (typeof value === 'boolean') return {booleanValue: value};
  if (typeof value === 'string') return {stringValue: value};
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number.isSafeInteger(value) ? {integerValue: String(value)} : {doubleValue: value};
  }
  if (value instanceof Date && Number.isFinite(value.getTime())) return {timestampValue: value.toISOString()};
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    return {mapValue: {fields: Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encodeValue(v)]))}};
  }
  throw Error('invalid_firestore_value');
}

export function decodeValue(value) {
  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) {
    const n = Number(value.integerValue);
    if (!Number.isSafeInteger(n)) throw Error('invalid_firestore_integer');
    return n;
  }
  if ('doubleValue' in value && Number.isFinite(value.doubleValue)) return value.doubleValue;
  if ('timestampValue' in value) {
    const date = new Date(value.timestampValue);
    if (!Number.isFinite(date.getTime())) throw Error('invalid_firestore_timestamp');
    return date;
  }
  if ('mapValue' in value) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([k, v]) => [k, decodeValue(v)]));
  throw Error('invalid_firestore_value');
}

export function createFirestore({env = () => process.env, fetcher = fetch, tokenProvider, now = Date.now} = {}) {
  let cachedToken, refresh;
  async function identity(signal) {
    if (tokenProvider) return tokenProvider(signal);
    if (cachedToken && cachedToken.until > now() + 60000) return cachedToken.token;
    if (!refresh) {
      refresh = (async () => {
        const response = await fetcher('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', {
          headers: {'Metadata-Flavor': 'Google'}, signal, redirect: 'error'
        });
        if (!response.ok) throw Error('google_identity_unavailable');
        const data = await response.json();
        if (typeof data.access_token !== 'string' || !data.access_token || !(data.expires_in > 60)) throw Error('google_identity_unavailable');
        cachedToken = {token: data.access_token, until: now() + Number(data.expires_in) * 1000};
        return cachedToken.token;
      })().finally(() => {refresh = null;});
    }
    return refresh;
  }
  async function request(path, {method = 'GET', value, updateTime, exists, timeoutMs = 1500} = {}) {
    if (!DOCUMENT.test(path)) throw Error('invalid_firestore_document');
    const signal = AbortSignal.timeout(timeoutMs);
    try {
      const token = await identity(signal);
      const url = new URL(`https://firestore.googleapis.com/v1/${databaseName(env())}/documents/${path}`);
      if (updateTime !== undefined) url.searchParams.set('currentDocument.updateTime', updateTime);
      if (exists !== undefined) url.searchParams.set('currentDocument.exists', String(exists));
      const response = await fetcher(url, {method, signal, redirect: 'error',
        headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'},
        ...(value === undefined ? {} : {body: JSON.stringify({fields: encodeValue(value).mapValue.fields})})});
      if (response.status === 404 && method === 'GET') return null;
      const data = await response.json();
      if (!response.ok) {
        if (['ABORTED', 'FAILED_PRECONDITION', 'ALREADY_EXISTS'].includes(data.error?.status)) throw Error('firestore_conflict');
        throw Error('firestore_unavailable');
      }
      if (typeof data.updateTime !== 'string' || !data.fields) throw Error('firestore_unavailable');
      return {value: decodeValue({mapValue: {fields: data.fields}}), updateTime: data.updateTime};
    } catch (error) {
      // Never expose Google errors: they can contain document contents or URLs.
      if (error.message === 'firestore_conflict') throw error;
      throw Error('firestore_unavailable');
    }
  }
  return {
    get: (path, options) => request(path, options),
    put: (path, value, options) => request(path, {...options, method: 'PATCH', value})
  };
}
