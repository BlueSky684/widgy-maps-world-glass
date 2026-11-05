// Models the intended native Edit Date contract, not Widgy's private renderer.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const read = p => JSON.parse(fs.readFileSync(p));
const children = n => Array.isArray(n['1']) ? n['1'] : [];
const walk = n => children(n).flatMap(c => [c, ...walk(c)]);
const before = read(process.argv[2]), after = read(process.argv[3]);
const old = new Map(walk(before).map(n => [n.d0, n]));
const nodes = new Map(walk(after).map(n => [n.d0, n]));
const month = new Intl.DateTimeFormat('en-US', {month:'long'});
const panels = Array.from({length:25}, (_, i) => {
  const offset = i - 12;
  const group = nodes.get(81106 + offset);
  const heads = children(group).filter(n => ['Month','Year'].includes(n.s)).map(n => {
    const source = old.get(n.d0)['66'][0];
    const previous = source['5'] === 'Javascript'
      ? new Function('Date', source['10'] + '; return main();') : null;
    return {n, source, previous};
  });
  const grids = children(group).filter(n => n.s?.startsWith('Dates · '));
  return {offset, heads, grids};
});

function component(value, edit) {
  if (edit === '0') return value;
  const [mode, amount] = edit.split('_').map(Number);
  if (mode === 1) return amount;
  if (mode === 2) return value + amount;
  if (mode === 3) return value - amount;
  throw new Error('Unknown Edit Date operation');
}
function nativeDate(n, now) {
  const [y,m,d,h,min] = (n['29'] || '0|0|0|0|0').split('|');
  // Apply edits to civil components before constructing the date. In particular
  // day=1 avoids Jan 31 + one month normalizing into March.
  return new Date(component(now.getFullYear(),y), component(now.getMonth()+1,m)-1,
    component(now.getDate(),d), component(now.getHours(),h), component(now.getMinutes(),min));
}
let cases = 0;
function check(now) {
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now.getTime()])); }
    static now() {return now.getTime();}
  }
  for (const {offset,heads,grids} of panels) {
    const expected = new Date(now.getFullYear(), now.getMonth()+offset, 1, 12);
    for (const grid of grids) {
      assert.equal(grid['44']?.a[0].a || 0, offset);
    }
    for (const {n,previous} of heads) {
      const actualDate = nativeDate(n,now);
      assert.equal(actualDate.getFullYear(), expected.getFullYear());
      assert.equal(actualDate.getMonth(), expected.getMonth());
      const result = n.s === 'Month' ? month.format(actualDate) : String(actualDate.getFullYear());
      if (previous) assert.equal(result, previous(Clock));
      assert.ok(result.length > 0 && !/^[—–-]+$/.test(result));
      cases++;
    }
  }
}
for (let y=2000;y<2400;y++) for (let m=0;m<12;m++) {
  check(new Date(y,m,1,12));
  check(new Date(y,m+1,0,12));
}
for (const t of ['2026-12-31T21:59:59Z','2026-12-31T22:00:00Z',
  '2026-10-24T22:59:59Z','2026-10-24T23:00:00Z',
  '2026-03-26T23:59:59Z','2026-03-27T00:00:00Z',
  '2028-02-29T23:59:59Z']) check(new Date(t));

// Screenshot fixture: current Nov 5, four months ahead, previous Feb 28 in
// the Sunday column and 31 active days. The heading must be March 2027.
const reference = new Date(2026,10,5,12);
const march = panels.find(p=>p.offset===4);
assert.equal(month.format(nativeDate(march.heads.find(h=>h.n.s==='Month').n,reference)),'March');
assert.equal(nativeDate(march.heads.find(h=>h.n.s==='Year').n,reference).getFullYear(),2027);
assert.equal(new Date(2027,2,1).getDay(),1);
assert.equal(new Date(2027,2,0).getDate(),28);
assert.equal(new Date(2027,3,0).getDate(),31);
console.log(`PASS ${process.env.TZ}: ${cases} modeled heading outputs; 400-year leap cycle, month ends, year rollover, DST instants and screenshot fixture. Not an iPhone render test.`);
