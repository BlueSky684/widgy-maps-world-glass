// Operator-only readback of the completed migration and the live city probe.
// Never writes data, calls the provider, or exports credentials.
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createFirestore, databaseName} from '../services/map-server/firestore.mjs';
import {BUDGET_DOCUMENT, budgetState} from '../services/map-server/firestore-budget.mjs';

const [project, mode] = process.argv.slice(2);
const env = {FIRESTORE_PROJECT_ID: project, FIRESTORE_DATABASE_ID: '(default)'};
const target = databaseName(env);
if (mode && mode !== '--execute') throw Error('Use PROJECT_ID [--execute]');
const root = fileURLToPath(new URL('../', import.meta.url));
if (execFileSync('git', ['branch', '--show-current'], {cwd: root, encoding: 'utf8'}).trim() !== 'f50-widget-test') throw Error('Use f50-widget-test only');
console.log(JSON.stringify({execute: !!mode, target,
  action: 'Read the active migrated ledger and persisted synthetic Ashkelon city probe.',
  writes: false, providerRequests: 0, credentials: 'Read privately from Google; never saved or printed.'}, null, 2));
if (!mode) process.exit(0);

let phase = 'service';
const check = (condition, code) => {if (!condition) throw Error(code);};
const cloud = args => {
  try {return execFileSync('gcloud', [...args, '--project', project, '--quiet'],
    {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000});}
  catch {throw Error('google_command_failed');}
};
try {
  const service = JSON.parse(cloud(['run', 'services', 'describe', 'widgy-map-test', '--region', 'me-west1', '--format=json']));
  check(service.status?.conditions?.some(c => c.type === 'Ready' && String(c.status) === 'True'), 'service_not_ready');
  check(service.metadata?.labels?.purpose === 'widgy-map-trial', 'unexpected_service');
  const spec = service.spec?.template?.spec;
  check(spec?.serviceAccountName === `widgy-map-runtime@${project}.iam.gserviceaccount.com`, 'unexpected_identity');

  phase = 'google_identity';
  const bearer = cloud(['auth', 'print-access-token']).trim();
  const store = createFirestore({env: () => env, tokenProvider: async () => bearer});
  phase = 'budget_read';
  const budget = (await store.get(BUDGET_DOCUMENT, {timeoutMs: 15000}))?.value;
  check(budget?.target === target && budget.source === 'upstash-import' &&
    budget.importedAt instanceof Date, 'unexpected_budget');
  const {used} = budgetState(budget);

  phase = 'secrets';
  const secret = (variable, expectedName) => {
    const ref = spec.containers?.[0]?.env?.find(item => item.name === variable)?.valueFrom?.secretKeyRef;
    check(ref?.name === expectedName && ref.key === '1', 'unexpected_secret_reference');
    return cloud(['secrets', 'versions', 'access', ref.key, '--secret', ref.name]);
  };
  const access = secret('WIDGY_LOCATION_ACCESS_TOKEN', 'widgy-location-access-token');
  const provider = secret('BIGDATACLOUD_API_KEY', 'widgy-bigdatacloud-api-key');
  check(access.length >= 32 && provider.length > 0, 'invalid_secret');

  // Public city-centre test coordinates; never the user's device location.
  const point = {latitude: 31.6688, longitude: 34.5743};
  const key = createHash('sha256').update(JSON.stringify([access, provider, point.latitude, point.longitude, 'en'])).digest('hex');
  phase = 'persisted_city_read';
  const cached = (await store.get(`widgyCityCache/${key}`, {timeoutMs: 15000}))?.value;
  const entry = cached?.entry, now = Date.now();
  check(entry?.latitude === point.latitude && entry?.longitude === point.longitude &&
    entry?.city === 'Ashkelon' && entry?.countryName === 'Israel', 'city_probe_not_persisted');
  check(Number.isSafeInteger(entry.observedAt) && entry.observedAt >= budget.importedAt.getTime() &&
    entry.observedAt <= now && now - entry.observedAt < 3600000 &&
    cached.expiresAt instanceof Date && cached.expiresAt.getTime() > now, 'city_probe_not_fresh');
  console.log(JSON.stringify({status: 'handoff_verified', budgetState: budget.state,
    used, limit: 40000, persistedCity: entry.city, persistedCountry: entry.countryName,
    observedAt: new Date(entry.observedAt).toISOString(),
    sourceCommit: service.metadata.labels['source-commit']}));
  console.log('WIDGY_GOOGLE_CITY_READY');
} catch (error) {
  const code = /^[a-z_0-9]+$/.test(error.message) ? error.message : 'check_failed';
  console.error(JSON.stringify({status: 'check_failed', phase, code}));
  process.exitCode = 1;
}
