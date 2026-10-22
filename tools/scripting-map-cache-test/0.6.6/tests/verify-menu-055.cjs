// Usage: node verify-menu-055.cjs /absolute/path/to/typescript.cjs
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const assert = require('node:assert/strict');
const ts = require(process.argv[2] || 'typescript');
const root = path.resolve(__dirname, '..');
const sources = fs.readdirSync(root).filter(f => /\.tsx?$/.test(f));
function compile(forceTSX) {
  const output = {};
  for (const file of sources) {
    const result = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
      fileName: forceTSX ? file.replace(/\.ts$/, '.tsx') : file,
      reportDiagnostics: true,
      compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React, jsxFactory: 'UI.createElement' },
    });
    assert.equal(result.diagnostics.length, 0, file + ': ' + result.diagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText, ' ')).join('; '));
    output[file.replace(/\.tsx?$/, '')] = result.outputText;
  }
  return output;
}
async function run(compiled, fault) {
  const views = [], alerts = [], cache = {};
  let exits = 0, dismiss;
  const scripting = {
    Navigation: { useDismiss: () => () => dismiss(), present: options => {
      views.push(options.element);
      if (fault === 'present') throw new TypeError('SECRET native details');
      return new Promise(resolve => { dismiss = resolve; });
    } },
    Script: { env: 'index', exit: () => { exits++; } },
    Dialog: { alert: async options => { alerts.push(options); } },
    useState: value => [value, () => {}],
  };
  for (const name of ['Button','List','NavigationStack','Section','Text']) scripting[name] = name;
  const context = vm.createContext({
    Uint8Array, Date, Promise, console,
    setTimeout: () => { throw Error('Menu must not start timers'); },
    clearTimeout: () => {},
    UI: { createElement: (type, props, ...children) => typeof type === 'function'
      ? type({...props, children}) : ({type, props, children}) },
  });
  function load(name) {
    if (name === 'scripting') return scripting;
    name = name.replace(/^\.\//, '');
    if (name === 'menu' && fault === 'load') throw new SyntaxError('SECRET native details');
    if (cache[name]) return cache[name].exports;
    assert.ok(compiled[name], 'Missing module: ' + name);
    const module = cache[name] = {exports: {}};
    const code = compiled[name].replace('void main();', 'globalThis.finished = main();');
    vm.runInContext('(function(require,module,exports){' + code + '\n})', context, {filename:name})(load,module,module.exports);
    return module.exports;
  }
  load('./index');
  if (!fault) {
    assert.equal(views.length, 1); assert.equal(exits, 0); assert.equal(alerts.length, 0);
    assert.match(JSON.stringify(views), /Map Cache Test 2400 · 0\.6\.6/);
    assert.match(JSON.stringify(views), /עצירת העדכונים האוטומטיים/);
    assert.match(JSON.stringify(views), /הפעלה כל 15 דקות/);
    assert.doesNotMatch(JSON.stringify(views), /3306|מפה A|מפה B|רזולוציה המקורית|הפעלה כל 5 דקות/);
    dismiss();
  }
  await context.finished;
  assert.equal(exits, 1);
  if (fault) {
    assert.equal(alerts.length, 1);
    assert.match(alerts[0].message, new RegExp(fault === 'load' ? 'MENU_LOAD' : 'MENU_PRESENT'));
    assert.ok(!JSON.stringify(alerts).includes('SECRET'));
  }
}
(async () => {
  const tsFiles = compile(false), tsxFiles = compile(true);
  console.log('PASS all modules compile with native extensions and forced TSX');
  await run(tsFiles); console.log('PASS actual import graph presents menu and waits for dismissal');
  await run(tsxFiles); console.log('PASS TSX import graph presents menu without starting I/O or timers');
  await run(tsxFiles, 'load'); console.log('PASS module load failure produces safe MENU_LOAD result');
  await run(tsxFiles, 'present'); console.log('PASS presentation failure produces safe MENU_PRESENT result');
  console.log('5 menu checks passed; native iPhone presentation remains unverified.');
})().catch(error => {console.error(error);process.exitCode = 1;});
