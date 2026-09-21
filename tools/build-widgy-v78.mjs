// v78 withdrawn: its corner parameter caused rectangular rain ends on-device.
// Restore the exact v77 files; retain this URL for existing links.
import {copyFileSync} from 'node:fs';
for (const ext of ['json','html']) copyFileSync(new URL(`widgy-v77.${ext}`,import.meta.url),new URL(`widgy-v78.${ext}`,import.meta.url));
