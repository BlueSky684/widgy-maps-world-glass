// Operator-only check. No credentials leave the existing Google project/service.
// A temporary synthetic cache entry tests the deployed runtime's own identity.
import {execFileSync} from 'node:child_process';
import {createHash, randomInt} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {databaseName, encodeValue, decodeValue} from '../services/map-server/firestore.mjs';

const [project, mode] = process.argv.slice(2);
const database = databaseName({FIRESTORE_PROJECT_ID: project});
if (mode && mode !== '--execute') throw Error('Use PROJECT_ID [--execute]');
const root = fileURLToPath(new URL('../', import.meta.url));
if (execFileSync('git', ['branch', '--show-current'], {cwd: root, encoding: 'utf8'}).trim() !== 'f50-widget-test') throw Error('Use f50-widget-test only');
console.log(JSON.stringify({execute: !!mode, database, service: 'widgy-map-test',
  action: 'Create one short-lived synthetic city-cache entry, read it through the deployed service, then delete it.',
  budget: 'Read only; this pre-handoff check requires the budget document to be absent.',
  credentials: 'Read privately from Google; never printed or written to a file.'}, null, 2));
if (!mode) process.exit(0);

let phase = 'service', cleanup = null, result, failure, cleanupFailed = false;
const cloud = args => {
  try {return execFileSync('gcloud', [...args, '--project', project, '--quiet'],
    {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000});}
  catch {throw Error('google_command_failed');}
};
const check = (condition, code) => {if (!condition) throw Error(code);};
try {
  const service = JSON.parse(cloud(['run', 'services', 'describe', 'widgy-map-test', '--region', 'me-west1', '--format=json']));
  check(service.status?.conditions?.some(c => c.type === 'Ready' && String(c.status) === 'True'), 'service_not_ready');
  check(service.metadata?.labels?.purpose === 'widgy-map-trial', 'unexpected_service');
  const spec = service.spec?.template?.spec;
  check(spec?.serviceAccountName === `widgy-map-runtime@${project}.iam.gserviceaccount.com`, 'unexpected_identity');
  const origin = new URL(service.status.url);
  check(origin.protocol === 'https:' && origin.hostname.endsWith('.run.app') &&
    !origin.username && !origin.password && !origin.search && !origin.hash && origin.pathname === '/', 'unexpected_service_url');
  const health = await fetch(new URL('/health', origin), {signal: AbortSignal.timeout(30000), redirect: 'error'});
  check(health.ok && (await health.json()).status === 'ready', 'health_failed');

  phase = 'google_identity';
  const bearer = cloud(['auth', 'print-access-token']).trim();
  const firestore = async (path, {method = 'GET', value, exists, updateTime} = {}) => {
    const url = new URL(`https://firestore.googleapis.com/v1/${database}/documents/${path}`);
    if (exists !== undefined) url.searchParams.set('currentDocument.exists', String(exists));
    if (updateTime) url.searchParams.set('currentDocument.updateTime', updateTime);
    const response = await fetch(url, {method, signal: AbortSignal.timeout(15000), redirect: 'error',
      headers: {Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json'},
      ...(value === undefined ? {} : {body: JSON.stringify({fields: encodeValue(value).mapValue.fields})})});
    if (response.status === 404 && ['GET', 'DELETE'].includes(method)) return null;
    check(response.ok, `firestore_http_${response.status}`);
    return method === 'DELETE' ? null : response.json();
  };
  phase = 'budget_read';
  const budgetPath = 'widgyControl/bdc-budget-v1';
  check(await firestore(budgetPath) === null, 'budget_already_exists_use_post_handoff_checks');

  phase = 'secrets';
  const secret = (variable, expectedName) => {
    const ref = spec.containers?.[0]?.env?.find(item => item.name === variable)?.valueFrom?.secretKeyRef;
    check(ref?.name === expectedName && ref.key === '1', 'unexpected_secret_reference');
    return cloud(['secrets', 'versions', 'access', ref.key, '--secret', ref.name]);
  };
  const access = secret('WIDGY_LOCATION_ACCESS_TOKEN', 'widgy-location-access-token');
  const provider = secret('BIGDATACLOUD_API_KEY', 'widgy-bigdatacloud-api-key');
  check(access.length >= 32 && provider.length > 0, 'invalid_secret');

  // Synthetic open-ocean coordinates, unrelated to the user's location.
  const point = {latitude: -40 - randomInt(1, 999999) / 1e6, longitude: -140 - randomInt(1, 999999) / 1e6};
  const key = createHash('sha256').update(JSON.stringify([access, provider, point.latitude, point.longitude, 'en'])).digest('hex');
  const path = `widgyCityCache/${key}`;
  const entry = {...point, city: 'Synthetic storage probe', countryName: 'Synthetic', observedAt: Date.now()};
  phase = 'cache_create';
  const seeded = await firestore(path, {method: 'PATCH', exists: false,
    value: {entry, expiresAt: new Date(Date.now() + 120000)}});
  check(typeof seeded?.updateTime === 'string', 'missing_update_time');
  cleanup = () => firestore(path, {method: 'DELETE', updateTime: seeded.updateTime});

  phase = 'runtime_cache_read';
  const url = new URL('/api/fetch-probe', origin);
  url.search = new URLSearchParams({location_shared: '1', location_key: access,
    lat: String(point.latitude), lon: String(point.longitude)});
  let response, body;
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await fetch(url, {signal: AbortSignal.timeout(30000), redirect: 'error'});
    body = await response.json();
    if (response.ok) break;
    if (response.status !== 502) break;
  }
  check(response?.ok, `runtime_http_${response?.status}`);
  check(body.state === 'SHARED' && body.entry?.city === entry.city &&
    body.entry?.latitude === point.latitude && body.entry?.longitude === point.longitude, 'shared_cache_not_verified');

  phase = 'budget_unchanged';
  check(await firestore(budgetPath) === null, 'budget_changed_during_check');
  const stored = await firestore(path);
  check(stored?.updateTime === seeded.updateTime &&
    decodeValue({mapValue: {fields: stored.fields}}).entry.city === entry.city, 'probe_document_changed');
  result = {status: 'ready_for_budget_handoff', firestoreRuntimeRead: 'SHARED',
    serviceURL: origin.origin, revision: service.status.latestReadyRevisionName,
    sourceCommit: service.metadata.labels['source-commit'], budget: 'absent_unchanged'};
} catch (error) {
  // Do not expose fetch URLs, Google responses, command output or credentials.
  const code = /^[a-z_0-9]+$/.test(error.message) ? error.message : 'check_failed';
  failure = {status: 'check_failed', phase, code};
} finally {
  if (cleanup) {
    try {await cleanup();} catch {cleanupFailed = true;}
  }
}
if (failure || cleanupFailed) {
  console.error(JSON.stringify({...failure, status: 'check_failed',
    ...(cleanupFailed ? {cleanup: 'not_confirmed_short_TTL_set'} : {cleanup: cleanup ? 'deleted' : 'not_created'})}));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({...result, syntheticEntry: 'deleted'}));
  console.log('WIDGY_CLOUD_STORAGE_OK');
}
