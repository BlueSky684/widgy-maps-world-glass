import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
assert.deepEqual(readdirSync(new URL('../api/', import.meta.url)).sort(), ['ip-probe.js']);
