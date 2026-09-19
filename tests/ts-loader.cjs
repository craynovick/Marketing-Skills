const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function loader(overrides = {}) {
  const cache = new Map();
  function load(name) {
    if (Object.hasOwn(overrides, name)) return overrides[name];
    if (!name.startsWith('@/')) return require(name);
    const base = path.join(root, name.slice(2));
    const file = ['.ts', '.tsx'].map(ext => base + ext).find(fs.existsSync);
    if (!file) throw new Error(`Missing module: ${name}`);
    if (cache.has(file)) return cache.get(file).exports;
    const loadedModule = { exports: {} };
    cache.set(file, loadedModule);
    const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    });
    const localRequire = specifier => load(specifier.startsWith('.')
      ? '@/' + path.relative(root, path.resolve(path.dirname(file), specifier))
      : specifier);
    new Function('require', 'module', 'exports', outputText)(localRequire, loadedModule, loadedModule.exports);
    return loadedModule.exports;
  }
  return load;
}
module.exports = { loader };
