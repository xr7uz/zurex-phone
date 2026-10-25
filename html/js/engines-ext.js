/*
 * Integrations on the NUI side:
 *  - engines.external: apps registered by other resources (exports['zurex-phone']:AddApp) run in an iframe.
 *    The iframe talks to the phone with postMessage: { zurex: 'notify' | 'close' | 'rpc' | 'open', ... }.
 *  - 'config' message: applies config.lua (disabled apps, defaults, tints, places, docs, quiz) at start.
 */
(() => {
  'use strict';
  const { $, esc, engines, body } = ZX;

  engines.external = (app) => {
    ZX.head(app.name, app.cfg.tagline || 'App');
    body.classList.add('flush');
    body.innerHTML = `<iframe class="ext-frame" src="${esc(app.cfg.url)}" allow="clipboard-write" title="${esc(app.name)}"></iframe>`;
    const frame = body.querySelector('iframe');
    // Tell the app who is using it, once it has loaded.
    frame.addEventListener('load', () => frame.contentWindow.postMessage({ zurex: 'init', app: app.id, owner: ZX.S.owner, theme: { tint: app.tint, accent: ZX.S.accent } }, '*'));
  };

  window.addEventListener('message', async (e) => {
    const d = e.data;
    if (!d || typeof d !== 'object') return;
    // Messages from external app iframes
    if (d.zurex) {
      const frame = document.querySelector('.ext-frame');
      if (!frame || e.source !== frame.contentWindow) return;
      const app = ZX.appMeta(ZX.current && ZX.current.id);
      if (!app || app.engine !== 'external') return;
      if (d.zurex === 'notify') ZX.notify(app.id, d.title || app.name, d.text || '', null, app.id);
      if (d.zurex === 'close') ZX.home();
      if (d.zurex === 'open' && ZX.appMeta(d.app)) ZX.open(d.app);
      // Forwarded to the app's own NUI callback / server handler: op is namespaced to the app.
      if (d.zurex === 'rpc') { const r = await ZX.rpc(`ext.${app.id}.${d.op}`, d.args || {}); e.source.postMessage({ zurex: 'rpc:result', id: d.id, result: r }, '*'); }
      return;
    }
    // Config + runtime app registrations pushed by client.lua
    if (d.action === 'config') applyConfig(d.config || {});
    if (d.action === 'addApp' && d.app) addExternal(d.app);
  });

  // Server pushes that only need a banner.
  ZX.onPush('notify', (d) => ZX.notify(d.app || 'messages', d.title || 'Zurex', d.text || '', null, ZX.appMeta(d.app) ? d.app : null));
  ZX.onPush('bank:in', (d) => { ZX.S.bank.tx.unshift({ id: ZX.uid(), label: d.from, note: d.note || 'Eingang', amount: d.amount, t: Date.now() }); ZX.save(); ZX.notify('bank', 'Zahlung erhalten', `${ZX.money(d.amount)} von ${d.from}`, null, 'bank'); });
  ZX.onPush('like', (d) => ZX.notify(d.app, ZX.appMeta(d.app)?.name || 'Social', `${d.name} gefällt dein Beitrag`, null, d.app));
  ZX.onPush('comment', (d) => ZX.notify(d.app, `${d.name} hat kommentiert`, d.text || '', null, d.app));
  ZX.onPush('app', (d) => { if (d.title) ZX.notify(d.app, d.title, d.text || '', null, d.app); });

  function addExternal(def) {
    if (ZX.appMeta(def.id)) return;
    ZX.register([{ id: def.id, name: def.name, cat: def.category || 'tools', icon: def.icon || 'sparkle', tint: def.color, engine: def.url ? 'external' : def.engine, cfg: { url: def.url, tagline: def.tagline, ...(def.cfg || {}) }, desc: def.description, preinstalled: def.preinstalled !== false }]);
    if (def.preinstalled !== false && ZX.S.installed && !ZX.S.installed.includes(def.id)) { ZX.S.installed.push(def.id); ZX.save(); }
    if (!ZX.layers.home.hidden) ZX.renderHome();
  }

  // Lua sends empty tables as {} — normalise every list field to an array.
  const arr = (v) => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : []);
  function applyConfig(c) {
    const apps = c.apps || {};
    apps.disabled = arr(apps.disabled); apps.preinstalled = apps.preinstalled ? arr(apps.preinstalled) : null; c.externalApps = arr(c.externalApps);
    if (Array.isArray(apps.overrides)) apps.overrides = {};
    // Disabled apps disappear completely (store, home, library).
    (apps.disabled || []).forEach((id) => { const i = ZX.APPS.findIndex((a) => a.id === id); if (i >= 0) ZX.APPS.splice(i, 1); });
    if (ZX.S.installed) ZX.S.installed = ZX.S.installed.filter((id) => ZX.appMeta(id) && !(apps.disabled || []).includes(id));
    // Per-app overrides: name, tint, cfg fields.
    Object.entries(apps.overrides || {}).forEach(([id, o]) => { const a = ZX.appMeta(id); if (!a) return; if (o.name) a.name = o.name; if (o.color) a.tint = o.color; if (o.cfg) a.cfg = { ...(a.cfg || {}), ...o.cfg }; });
    // Default installs for new players.
    if (apps.preinstalled && !ZX.S.configured) { ZX.S.installed = [...new Set([...ZX.APPS.filter((a) => a.core).map((a) => a.id), ...apps.preinstalled.filter((id) => ZX.appMeta(id))])]; ZX.S.configured = true; }
    if (apps.allInstalled) ZX.S.installed = ZX.APPS.map((a) => a.id);
    // Content
    if (c.places) Object.assign(window.ZX_PLACES, c.places);
    if (c.docs) Object.assign(window.ZX_DOCS, c.docs);
    if (c.quiz) Object.assign(window.ZX_QUIZ, c.quiz);
    if (c.casino) Object.assign(ZX.casinoCfg ||= {}, c.casino);
    if (c.ui) {
      if (c.ui.defaultAccent && !ZX.S.accentSet) ZX.S.accent = c.ui.defaultAccent;
      if (c.ui.defaultWallpaper && !ZX.S.wallSet) ZX.S.wall = c.ui.defaultWallpaper;
      if (c.ui.carrier) $('#sbCarrier').textContent = c.ui.carrier;
    }
    if (c.network) {
      const n = c.network;
      if (n.carriers) window.ZX_NETWORK.carriers = arr(n.carriers);
      if (n.wifi) window.ZX_NETWORK.wifi = arr(n.wifi);
      if (n.numbers) window.ZX_NETWORK.numbers = n.numbers;
      if (n.defaultCarrier) window.ZX_NETWORK.defaultCarrier = n.defaultCarrier;
      if (ZX.network) ZX.network.tick();
    }
    if (c.cards) window.ZX_CARDS = arr(c.cards);
    (c.externalApps || []).forEach(addExternal);
    ZX.save(); ZX.applySettings();
  }
})();
