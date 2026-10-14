// Operator tool: copies counters, never exports credentials to Google/Git/logs.
// Plan by default. Run in Cloud Shell after creating and testing Firestore.
import {execFileSync} from 'node:child_process';
import {createInterface} from 'node:readline/promises';
import {Writable} from 'node:stream';
import {fileURLToPath} from 'node:url';
import {createFirestore, databaseName} from '../services/map-server/firestore.mjs';
import {migrateBudget, returnBudget} from '../services/map-server/budget-migration.mjs';

const [project, mode] = process.argv.slice(2);
const env = {FIRESTORE_PROJECT_ID: project, FIRESTORE_DATABASE_ID: '(default)'};
const target = databaseName(env);
if (mode && !['--execute', '--return-to-upstash'].includes(mode)) throw Error('Unknown migration mode');
const root = fileURLToPath(new URL('../', import.meta.url));
if (execFileSync('git', ['branch', '--show-current'], {cwd: root, encoding: 'utf8'}).trim() !== 'f50-widget-test') throw Error('Use f50-widget-test only');
console.log(JSON.stringify({target, action: mode === '--return-to-upstash' ? 'return-counters' : 'transfer-counters',
  execute: !!mode, source: 'existing Upstash ledger', destination: 'Firestore',
  effect: 'Exactly one backend may reserve new city lookups after handoff. Existing cached city results remain usable.',
  credentials: 'Read privately from terminal, kept only in this process; never saved or printed.'}, null, 2));
if (!mode) process.exit(0);
if (!process.stdin.isTTY) throw Error('Use an interactive Cloud Shell terminal');

async function privatePrompt(label) {
  process.stdout.write(label);
  const muted = new Writable({write(_chunk, _encoding, next) { next(); }});
  const input = createInterface({input: process.stdin, output: muted, terminal: true});
  try { return (await input.question('')).trim(); }
  finally { input.close(); process.stdout.write('\n'); }
}
try {
  const endpoint = new URL(await privatePrompt('Existing Upstash REST URL (hidden input): '));
  if (endpoint.protocol !== 'https:' || !endpoint.hostname.endsWith('.upstash.io') || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || endpoint.pathname !== '/') throw Error();
  const token = await privatePrompt('Existing Upstash read/write REST token (hidden input): ');
  if (!token || /\s/.test(token)) throw Error();
  const redis = async command => {
    const response = await fetch(endpoint, {method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
      headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'}, body: JSON.stringify(command)});
    const result = await response.json();
    if (!response.ok || result.error) throw Error('source_operation_failed');
    return result.result;
  };
  const store = createFirestore({env: () => env, tokenProvider: async () =>
    execFileSync('gcloud', ['auth', 'print-access-token', '--project', project], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}).trim()});
  const operation = mode === '--return-to-upstash' ? returnBudget : migrateBudget;
  const result = await operation({store, redis, target});
  console.log(JSON.stringify({status: 'complete', ...result}));
} catch {
  // A failed transfer can leave BOTH sources paused intentionally. Running the
  // same command again resumes safely; do not manually reset either ledger.
  console.error('Budget transfer did not complete. No credentials were printed. Keep the counters intact; rerun the same mode to resume.');
  process.exitCode = 1;
}
