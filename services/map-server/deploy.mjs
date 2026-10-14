// Plan by default. Only --execute invokes a billable build/deployment.
import {execFileSync} from 'node:child_process';
import {readFileSync, readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root = fileURLToPath(new URL('../../', import.meta.url));
const [project, contextArg, mode] = process.argv.slice(2);
if (!project || !/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(project) || !contextArg || (mode && mode !== '--execute')) {
  throw Error('Usage: node services/map-server/deploy.mjs PROJECT_ID BUILD_CONTEXT [--execute]');
}
const context = resolve(contextArg);
const branch = execFileSync('git', ['branch', '--show-current'], {cwd: root, encoding: 'utf8'}).trim();
if (branch !== 'f50-widget-test') throw Error('Deployment is restricted to f50-widget-test');
const commit = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim();
const manifest = JSON.parse(readFileSync(resolve(context, 'source-manifest.json')));
if (manifest.schema !== 2 || !manifest.files?.length) throw Error('Prepare a fresh build context first');
const expectedFiles = new Set(['.gcloudignore', '.dockerignore', 'source-manifest.json']);
const sourceFiles = [];
for (const file of manifest.files) {
  if (!/^(Dockerfile|api\/night-map\.js|lib\/[a-zA-Z0-9_./-]+\.js|services\/map-server\/[a-z-]+\.mjs|tools\/build-map-cache\.mjs|assets\/earth\/[a-zA-Z0-9_.-]+|package(?:-lock)?\.json)$/.test(file.path) || file.path.includes('..')) throw Error('Unexpected build input');
  const source = file.path === 'Dockerfile' ? 'services/map-server/Dockerfile' : file.path;
  if ((file.source && file.source !== source) || expectedFiles.has(file.path)) throw Error('Unexpected manifest entry');
  expectedFiles.add(file.path);
  sourceFiles.push(source);
  for (const path of [resolve(context, file.path), resolve(root, source)]) {
    const actual = createHash('sha256').update(readFileSync(path)).digest('hex');
    if (actual !== file.sha256) throw Error('Source/context changed; prepare a fresh context');
  }
}
for (const path of ['Dockerfile', 'package.json', 'package-lock.json', 'services/map-server/server.mjs']) {
  if (!expectedFiles.has(path)) throw Error('Incomplete build context');
}
const actualFiles = [];
function inspect(directory, prefix = '') {
  for (const entry of readdirSync(directory, {withFileTypes: true})) {
    const path = prefix + entry.name;
    if (entry.isDirectory()) inspect(resolve(directory, entry.name), path + '/');
    else if (entry.isFile()) actualFiles.push(path);
    else throw Error('Build context cannot contain links or special files');
  }
}
inspect(context);
if (actualFiles.length !== expectedFiles.size || actualFiles.some(path => !expectedFiles.has(path))) throw Error('Unexpected file in build context');
for (const path of ['.gcloudignore', '.dockerignore']) {
  if (readFileSync(resolve(context, path), 'utf8') !== '.git\nnode_modules\n') throw Error('Build ignore rules changed');
}
const sourceClean = !execFileSync('git', ['status', '--porcelain', '--untracked-files=all', '--', ...sourceFiles,
  'services/map-server/deploy.mjs', 'tools/prepare-cloud-run-map.mjs'], {cwd: root, encoding: 'utf8'}).trim();
if (mode === '--execute' && !sourceClean) throw Error('Commit the reviewed deployment sources on f50-widget-test first');
const secrets = {
  WIDGY_LOCATION_ACCESS_TOKEN: 'widgy-location-access-token',
  BIGDATACLOUD_API_KEY: 'widgy-bigdatacloud-api-key',
  UPSTASH_REDIS_REST_URL: 'widgy-upstash-rest-url',
  UPSTASH_REDIS_REST_TOKEN: 'widgy-upstash-rest-token'
};
const args = ['run', 'deploy', 'widgy-map-test', '--project', project, '--region', 'me-west1',
  '--source', context, '--execution-environment', 'gen2', '--port', '8080',
  '--cpu', '1', '--memory', '1Gi', '--cpu-throttling', '--cpu-boost',
  '--min', '0', '--max', '2', '--min-instances', '0', '--max-instances', '2',
  '--concurrency', '2', '--timeout', '30s', '--allow-unauthenticated',
  '--service-account', `widgy-map-runtime@${project}.iam.gserviceaccount.com`,
  '--build-service-account', `projects/${project}/serviceAccounts/widgy-map-builder@${project}.iam.gserviceaccount.com`,
  '--set-secrets', Object.entries(secrets).map(([key, name]) => `${key}=${name}:1`).join(','),
  '--labels', `purpose=widgy-map-trial,source-commit=${commit}`, '--quiet'];
console.log(JSON.stringify({execute: mode === '--execute', project, region: 'me-west1', branch, commit, sourceClean,
  profile: {billing: 'request-based', minimum: 0, maximum: 2, cpu: 1, memory: '1Gi', concurrency: 2},
  image: {format: 'PNG', width: 3306, height: 1558},
  costs: 'Metered compute, network, builds, images and secrets; no fixed monthly commitment. Instance maximum is not a spending cap.',
  command: ['gcloud', ...args]}, null, 2));
if (mode !== '--execute') process.exit(0);

const gcloudJSON = extra => JSON.parse(execFileSync('gcloud', [...extra, '--project', project, '--format=json'], {encoding: 'utf8'}));
const projectInfo = gcloudJSON(['projects', 'describe', project]);
if (projectInfo.projectId !== project || projectInfo.lifecycleState !== 'ACTIVE') throw Error('Project is not active');
for (const suffix of ['runtime', 'builder']) {
  const identity = gcloudJSON(['iam', 'service-accounts', 'describe', `widgy-map-${suffix}@${project}.iam.gserviceaccount.com`]);
  if (identity.disabled) throw Error('Service identity is disabled');
}
for (const name of Object.values(secrets)) {
  const version = gcloudJSON(['secrets', 'versions', 'describe', '1', '--secret', name]);
  if (version.state !== 'ENABLED') throw Error('Required secret version is not enabled');
}
const sink = gcloudJSON(['logging', 'sinks', 'describe', '_Default']);
const requiredFilter = 'resource.type="cloud_run_revision" AND resource.labels.service_name="widgy-map-test" AND log_id("run.googleapis.com/requests")';
if (!sink.exclusions?.some(exclusion => !exclusion.disabled && exclusion.filter.replace(/\s+/g, ' ').trim() === requiredFilter)) {
  throw Error('Configure the documented map request-log exclusion before deployment');
}
const existing = gcloudJSON(['run', 'services', 'list', '--region', 'me-west1']);
const prior = existing.find(service => service.metadata?.name === 'widgy-map-test');
if (prior && prior.metadata?.labels?.purpose !== 'widgy-map-trial') throw Error('Refusing to overwrite an unrelated service');
execFileSync('gcloud', args, {stdio: 'inherit'});
