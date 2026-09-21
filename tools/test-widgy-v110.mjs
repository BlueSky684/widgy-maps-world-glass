import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {greetingAt, dayPercentAt, greetingScript, dayPercentScript} from './widgy-time-logic.mjs';
import {buildWidget, allNodes, ids, findNativeScriptEntry} from './build-widgy-v110.mjs';

const before = JSON.parse(readFileSync(new URL('widgy-v109.json', import.meta.url), 'utf8'));
const native = JSON.parse(readFileSync(new URL('widgy-native-javascript-source.json', import.meta.url), 'utf8'));
assert.equal(native.codeKey, '10');
assert.deepEqual(native.entry, {'5':'Javascript', '6':'Script', '10':'function main() {\n  return 1;\n}'});
assert.deepEqual(findNativeScriptEntry({'66':[native.entry]}), {entry:native.entry, codeKey:'10'});
const data = JSON.parse(JSON.stringify(buildWidget(before, native)));
const nodes = allNodes(data);
const greetingNodes = nodes.filter(n => n.o1?.['0'] === ids.greeting);
const fillNodes = nodes.filter(n => n.o1?.['0'] === ids.progress);
assert.throws(() => findNativeScriptEntry(before));
assert.equal(greetingNodes.length, 4);
assert.equal(fillNodes.length, 100);
assert(!nodes.some(n => n.s === 'Time Test'));
assert.equal(data['36'].find(v => v['1'] === 'day_progress')['3']['66'][0]['10'], dayPercentScript);
assert.equal(data['36'].find(v => v['1'] === 'day_greeting')['3']['66'][0]['10'], greetingScript);
assert.equal(nodes.find(n => n.d0 === 6123)['66'][0]['25'], '${widgy.day_progress}%');

const boundaries = [[0,'NIGHT'],[4,'NIGHT'],[5,'MORNING'],[11,'MORNING'],[12,'AFTERNOON'],[16,'AFTERNOON'],[17,'EVENING'],[21,'EVENING'],[22,'NIGHT'],[23,'NIGHT']];
for (const [hour, expected] of boundaries) assert.equal(greetingAt(new Date(2026, 8, 21, hour)), expected);
for (let minute = 0; minute < 1440; minute++) {
  const date = new Date(2026, 8, 21, 0, minute);
  const percent = dayPercentAt(date);
  const visibleGreeting = greetingNodes.filter(n => n.o1['2'] === greetingAt(date));
  assert.equal(visibleGreeting.length, 1);
  assert.equal(visibleGreeting[0]['66'][0]['25'], greetingAt(date));
  const widths = fillNodes.filter(n => percent >= Number(n.o1['2'])).map(n => n.d.a[0].a);
  assert.equal(Math.max(0, ...widths), 995 * percent / 100);
}
for (const date of [new Date(2026,8,21,0),new Date(2026,8,21,5),new Date(2026,8,21,12),new Date(2026,8,21,17),new Date(2026,8,21,22),new Date(2026,8,21,23,59,59),new Date(2026,8,22,0)]) {
  class TestDate extends Date { constructor() { super(date.getTime()); } }
  assert.equal(runInNewContext(greetingScript + '\nmain()', {Date: TestDate}), greetingAt(date));
  assert.equal(runInNewContext(dayPercentScript + '\nmain()', {Date: TestDate}), dayPercentAt(date));
}
assert.equal(dayPercentAt(new Date(2026,8,21,12)), 50);
assert.equal(dayPercentAt(new Date(2026,8,21,23,59,59)), 99);
assert.equal(dayPercentAt(new Date(2026,8,22,0)), 0);
console.log('PASS: native Javascript schema, every minute, greeting boundaries, matching fill width, midnight reset, script parity, complete preservation of unrelated layers. Device rendering pending.');
