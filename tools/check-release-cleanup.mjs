import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const report=JSON.parse(readFileSync('docs/release-100-cleanup.json'));
const paths=execFileSync('git',['ls-tree','-r','--name-only',report.baseCommit,'api','lib','assets'],{encoding:'utf8'}).trim().split('\n');
for(const p of [...paths,'vercel.json','package.json','package-lock.json'])assert(readFileSync(p).equals(execFileSync('git',['show',`${report.baseCommit}:${p}`],{maxBuffer:32*1024*1024})),p);
for(const p of report.removedFiles)assert(!existsSync(p),p);
console.log(JSON.stringify({pass:true,removedFiles:report.removedFiles.length,protectedFiles:paths.length+3}));
