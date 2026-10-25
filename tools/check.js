// Project checks: JS syntax, Lua syntax, app registry integrity (unique ids + unique icons). Usage: npm run check
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
let failed = 0;
const fail = (msg) => { failed++; console.log('✗', msg); };
const pass = (msg) => console.log('✓', msg);

// 1. JavaScript syntax
const jsFiles = ['html/js', 'html/data'].flatMap((d) => fs.readdirSync(path.join(root, d)).filter((f) => f.endsWith('.js')).map((f) => path.join(d, f)));
for (const f of [...jsFiles, 'tools/serve.js', 'tools/check.js']) {
  try { execFileSync(process.execPath, ['--check', path.join(root, f)], { stdio: 'pipe' }); } catch (e) { fail(`${f}: ${e.stderr.toString().split('\n')[4] || e.message}`); }
}
pass(`${jsFiles.length + 2} JavaScript files parsed`);

// 2. Lua syntax (FiveM `hash` literals are replaced before parsing)
let luaparse;
try { luaparse = require('luaparse'); } catch { console.log('! luaparse not installed, run npm install'); }
if (luaparse) {
  const luaFiles = ['config.lua', 'fxmanifest.lua', ...['client', 'server'].flatMap((d) => fs.readdirSync(path.join(root, d)).filter((f) => f.endsWith('.lua')).map((f) => `${d}/${f}`))];
  for (const f of luaFiles) {
    const src = fs.readFileSync(path.join(root, f), 'utf8').replace(/`[A-Za-z0-9_]+`/g, '0');
    try { luaparse.parse(src, { luaVersion: '5.3' }); } catch (e) { fail(`${f}: ${e.message}`); }
  }
  pass(`${luaFiles.length} Lua files parsed`);
}

// 3. Registry: unique ids, unique glyphs, every engine exists
const sandbox = { window: {}, console };
const apps = [];
sandbox.ZX = { register: (l) => apps.push(...l) };
vm.createContext(sandbox);
for (const f of ['html/js/icons.js', 'html/js/registry.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), sandbox, { filename: f });
const own = sandbox.window.ZX_APP_ICONS || {};
const ids = new Set(), glyphs = new Map();
for (const a of apps) {
  if (ids.has(a.id)) fail(`duplicate app id: ${a.id}`); ids.add(a.id);
  const g = own[a.id] ? 'own:' + a.id : a.icon;
  if (glyphs.has(g)) fail(`icon "${g}" shared by ${glyphs.get(g)} and ${a.id}`); else glyphs.set(g, a.id);
}
const engineSrc = jsFiles.map((f) => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
for (const e of new Set(apps.map((a) => a.engine).filter(Boolean))) if (!new RegExp(`engines\\.${e}\\s*=`).test(engineSrc)) fail(`engine "${e}" is not implemented`);
for (const a of apps.filter((x) => !x.engine)) if (!new RegExp(`RENDER\\.${a.id}\\s*=`).test(engineSrc)) fail(`app "${a.id}" has no renderer`);
const games = apps.filter((a) => a.engine === 'game').map((a) => a.cfg.game);
for (const g of games) if (!new RegExp(`G\\.${g}\\s*=`).test(engineSrc)) fail(`game "${g}" is not implemented`);
pass(`${apps.length} apps registered, ${glyphs.size} unique icons, ${games.length} games`);

if (failed) { console.log(`\n${failed} problem(s) found.`); process.exit(1); }
console.log('\nAll checks passed.');
