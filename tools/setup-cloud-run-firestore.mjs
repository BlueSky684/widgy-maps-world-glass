// Plan by default; --execute configures only the agreed trial's storage.
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {databaseName} from '../services/map-server/firestore.mjs';

const [project, mode] = process.argv.slice(2);
const database = databaseName({FIRESTORE_PROJECT_ID: project});
if (mode && mode !== '--execute') throw Error('Use PROJECT_ID [--execute]');
const root = fileURLToPath(new URL('../', import.meta.url));
if (execFileSync('git', ['branch', '--show-current'], {cwd: root, encoding: 'utf8'}).trim() !== 'f50-widget-test') throw Error('Use f50-widget-test only');
const commands = [
  ['services', 'enable', 'firestore.googleapis.com'],
  ['firestore', 'databases', 'create', '--database', '(default)', '--location', 'me-west1', '--type', 'firestore-native', '--edition', 'standard', '--delete-protection'],
  ['projects', 'add-iam-policy-binding', project,
    '--member', `serviceAccount:widgy-map-runtime@${project}.iam.gserviceaccount.com`,
    '--role', 'roles/datastore.user', '--condition', `expression=resource.name=="${database}",title=widgy-map-firestore`, '--format=value(etag)'],
  ['firestore', 'fields', 'ttls', 'update', 'expiresAt', '--database', '(default)', '--collection-group', 'widgyCityCache', '--enable-ttl', '--async'],
  ['firestore', 'indexes', 'fields', 'update', 'entry', '--database', '(default)', '--collection-group', 'widgyCityCache', '--disable-indexes', '--async'],
  ['firestore', 'indexes', 'fields', 'update', 'expiresAt', '--database', '(default)', '--collection-group', 'widgyCityCache', '--disable-indexes', '--async'],
  ['firestore', 'indexes', 'fields', 'update', 'days', '--database', '(default)', '--collection-group', 'widgyControl', '--disable-indexes', '--async']
];
console.log(JSON.stringify({execute: !!mode, database, region: 'me-west1', edition: 'standard',
  budgetTransfer: 'Not performed by this command. Existing counters are unchanged.',
  commands: commands.map(args => ['gcloud', ...args, '--project', project, '--quiet'])}, null, 2));
if (!mode) process.exit(0);
const call = args => execFileSync('gcloud', [...args, '--project', project, '--quiet'], {stdio: 'inherit'});
const read = args => JSON.parse(execFileSync('gcloud', [...args, '--project', project, '--format=json'], {encoding: 'utf8'}));
const identity = read(['iam', 'service-accounts', 'describe', `widgy-map-runtime@${project}.iam.gserviceaccount.com`]);
if (identity.disabled) throw Error('Runtime identity is disabled');
call(commands[0]);
const databases = read(['firestore', 'databases', 'list']);
if (!Array.isArray(databases)) throw Error('Unexpected database list');
const prior = databases.find(value => value.name === database);
if (prior && (prior.locationId !== 'me-west1' || prior.type !== 'FIRESTORE_NATIVE' ||
    (prior.databaseEdition && prior.databaseEdition !== 'STANDARD'))) throw Error('Existing default database differs; do not replace it');
if (!prior) call(commands[1]);
for (const command of commands.slice(2)) call(command);
console.log('WIDGY_FIRESTORE_SETUP_OK');
