// v80 withdrawn after native rendering truncated the custom rain contour.
// Restore exact v77 content at the existing URL.
import {copyFileSync} from 'node:fs';
for (const ext of ['json','html']) copyFileSync(new URL(`widgy-v77.${ext}`,import.meta.url),new URL(`widgy-v80.${ext}`,import.meta.url));
