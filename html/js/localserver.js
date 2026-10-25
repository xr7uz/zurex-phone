/*
 * LocalServer: answers ZX.rpc() in the browser mockup with the same contract as server.lua,
 * so every app behaves identically with or without FiveM. Data persists in localStorage.
 */
(() => {
  'use strict';
  if (ZX.isNui) return;
  const KEY = 'zurex:server:v4';
  let DB;
  try { DB = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { DB = {}; }
  DB.posts ||= {}; DB.channels ||= {}; DB.mail ||= []; DB.portfolio ||= {}; DB.ghost ||= []; DB.invoices ||= []; DB.dispatch ||= [];
  let t = null;
  const persist = () => { clearTimeout(t); t = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch { /* full */ } }, 200); };
  const uid = ZX.uid;
  const me = () => ({ handle: ZX.S.owner.handle || 'zurex_user', name: ZX.S.owner.name, number: ZX.S.owner.number, avatar: ZX.S.owner.avatar || null });

  /* Custom number rules: 555-XXXX, VIP = same digit 4×, straight run, or ABAB. */
  function numberRules(raw) {
    const d = String(raw || '').replace(/\D/g, '');
    if (d.length !== 7 || !d.startsWith('555')) return { ok: false, error: 'Format: 555-XXXX' };
    const tail = d.slice(3), number = `555-${tail}`;
    const vip = /^(\d)\1{3}$/.test(tail) || '0123456789'.includes(tail) || '9876543210'.includes(tail) || (tail[0] === tail[2] && tail[1] === tail[3]) || /^(\d)\1(\d)\2$/.test(tail);
    const cfg = (window.ZX_NETWORK && window.ZX_NETWORK.numbers) || {};
    return { ok: true, number, vip, price: vip ? (cfg.vipPrice || 25000) : (cfg.price || 2500) };
  }

  /* Demo people for seeded content */
  const PEOPLE = [
    ['mia.kraus', 'Mia Kraus', '555-0117'], ['leon.b', 'Leon Becker', '555-0193'], ['lena_vogel', 'Lena Vogel', '555-0128'],
    ['jonas.garage', 'Jonas Werkstatt', '555-0164'], ['vinewood.vibes', 'Vinewood Vibes', '555-0301'], ['ls.foodie', 'LS Foodie', '555-0312'],
    ['nightdriver', 'Nightdriver', '555-0333'], ['ana.santos', 'Ana Santos', '555-0345'], ['kev.trades', 'Kevin Trades', '555-0356'], ['ryder.ls', 'Ryder', '555-0367'],
  ].map(([handle, name, number]) => ({ handle, name, number }));
  const pickP = () => ZX.pick(PEOPLE);
  const ago = (h) => Date.now() - h * 3600e3;

  function seedPosts(app) {
    const a = ZX.appMeta(app) || {};
    const cfg = a.cfg || {};
    const texts = cfg.seed || ['Was für ein Tag in Los Santos.', 'Neuer Look 🔥', 'Wer ist heute Abend dabei?', 'Sonnenuntergang am Pier.', 'Endlich Wochenende.', 'Kaffee und Chaos.'];
    return texts.map((text, i) => {
      const p = typeof text === 'object' ? text : { text };
      return {
        id: uid(), author: p.author || pickP(), text: p.text || '', t: ago(i * 3 + Math.random() * 3),
        photo: cfg.photos === false || (a.engine === 'text' && !p.scene && i % 3) || (a.engine === 'forum' && i % 2) ? null : { seed: Math.floor(Math.random() * 1e9), scene: p.scene || ZX.pick(ZX.SCENES.filter((s) => s !== 'portrait')) },
        likes: PEOPLE.filter(() => Math.random() > .55).map((x) => x.handle), comments: Math.random() > .4 ? [{ id: uid(), author: pickP(), text: ZX.pick(['🔥🔥', 'Stark!', 'Wo ist das?', 'Nice 😍', 'Bin dabei', 'Haha legendär']), t: ago(i) }] : [],
        extra: p.extra || {}, score: Math.floor(Math.random() * 80),
      };
    });
  }
  const posts = (app) => (DB.posts[app] ||= seedPosts(app));

  function seedChannel(app, ch) {
    const a = ZX.appMeta(app) || {};
    const lines = (a.cfg && a.cfg.chat) || ['Moin zusammen!', 'Wer ist online?', 'Treffen um 20 Uhr am Würfelpark?', 'Bin dabei 👍', 'Hat jemand ein Abschleppseil?'];
    return lines.map((text, i) => ({ id: uid(), author: (a.cfg && a.cfg.anon) ? { handle: 'anon-' + Math.floor(Math.random() * 999), name: 'Anonym' } : pickP(), text, t: ago((lines.length - i) * .4) }));
  }

  /* Market simulation (same instruments + rules as server.lua) */
  const M = {};
  function initMarket() {
    for (const s of window.ZX_MARKET || []) {
      let p = s.px; const hist = [];
      for (let i = 0; i < 120; i++) { p *= 1 + (Math.random() - 0.49) * s.vol * 2; hist.push(p); }
      const candles = [];
      for (let i = 0; i < 120; i++) { const o = i ? candles[i - 1].c : p; const c = o * (1 + (Math.random() - 0.495) * s.vol * 4); candles.push({ o, c, h: Math.max(o, c) * (1 + Math.random() * s.vol), l: Math.min(o, c) * (1 - Math.random() * s.vol), n: 5, t: Date.now() - (120 - i) * 1e4 }); }
      M[s.sym] = { ...s, px: candles[119].c, open: candles[60].c, hist: candles.map((c) => c.c), candles };
    }
  }
  function tick() { for (const m of Object.values(M)) { m.px *= 1 + (Math.random() - 0.495) * m.vol; } }

  const handlers = {
    'market.snapshot': () => { if (!Object.keys(M).length) initMarket(); return { ok: true, list: Object.values(M).map((m) => ({ sym: m.sym, name: m.name, kind: m.kind, dp: m.dp, px: m.px, open: m.open, hist: m.hist.slice(), candles: m.candles.map((c) => ({ ...c })) })) }; },
    'market.tick': () => { tick(); return { ok: true, list: Object.values(M).map((m) => ({ sym: m.sym, px: m.px })) }; },

    'sms.send': () => ({ ok: true }),
    'call.start': () => ({ ok: true }), 'call.accept': () => ({ ok: true }), 'call.end': () => ({ ok: true }),
    'bank.transfer': () => ({ ok: true }), 'bank.balance': () => ({ ok: true, balance: ZX.S.bank.balance }),
    'profile.set': () => ({ ok: true }),

    /* Feed-style collections: social posts, reels, chirps, forum threads, listings, dating profiles, news */
    'feed.list': ({ app }) => ({ ok: true, posts: posts(app).slice().sort((a, b) => b.t - a.t), me: me() }),
    'feed.post': ({ app, text, photo, extra }) => {
      if (!text && !photo) return { ok: false, error: 'Leerer Beitrag.' };
      const p = { id: uid(), author: me(), text: String(text || '').slice(0, 1000), photo: photo || null, t: Date.now(), likes: [], comments: [], extra: extra || {}, score: 0 };
      posts(app).unshift(p); persist(); return { ok: true, post: p };
    },
    'feed.like': ({ app, id }) => {
      const p = posts(app).find((x) => x.id === id); if (!p) return { ok: false };
      const h = me().handle; p.likes = p.likes.includes(h) ? p.likes.filter((x) => x !== h) : [...p.likes, h]; persist(); return { ok: true, likes: p.likes };
    },
    'feed.vote': ({ app, id, dir }) => { const p = posts(app).find((x) => x.id === id); if (!p) return { ok: false }; p.votes ||= {}; p.votes[me().handle] = dir; p.score = Object.values(p.votes).reduce((s, v) => s + v, 0) + (p.base || 0); persist(); return { ok: true, score: p.score }; },
    'feed.comment': ({ app, id, text }) => {
      const p = posts(app).find((x) => x.id === id); if (!p || !text) return { ok: false };
      const c = { id: uid(), author: me(), text: String(text).slice(0, 300), t: Date.now() }; p.comments.push(c); persist(); return { ok: true, comment: c };
    },
    'feed.delete': ({ app, id }) => { DB.posts[app] = posts(app).filter((x) => !(x.id === id && x.author.handle === me().handle)); persist(); return { ok: true }; },

    /* Chat channels */
    'chan.list': ({ app, ch }) => { const k = app + ':' + ch; DB.channels[k] ||= seedChannel(app, ch); return { ok: true, msgs: DB.channels[k].slice(-150), me: me() }; },
    'chan.send': ({ app, ch, text, anon }) => {
      if (!text) return { ok: false };
      const k = app + ':' + ch; DB.channels[k] ||= seedChannel(app, ch);
      const m = { id: uid(), author: anon ? { handle: 'anon-' + (Math.abs([...me().number].reduce((h, c) => h * 31 + c.charCodeAt(0), 7)) % 999), name: 'Anonym' } : me(), text: String(text).slice(0, 500), t: Date.now(), mine: true };
      DB.channels[k].push(m); DB.channels[k] = DB.channels[k].slice(-300); persist();
      // Someone answers in the mockup so channels feel alive.
      setTimeout(() => { DB.channels[k].push({ id: uid(), author: anon ? { handle: 'anon-' + Math.floor(Math.random() * 999), name: 'Anonym' } : pickP(), text: ZX.pick(['Haha true', 'Bin dabei', 'Wo?', '👍', 'Später mehr', 'Gute Idee']), t: Date.now() }); persist(); ZX.localPush({ kind: 'chan', app, ch }); }, 2500 + Math.random() * 3000);
      return { ok: true, msg: m };
    },

    /* Mail */
    'mail.list': () => {
      if (!DB.mailSeeded) { DB.mailSeeded = true; DB.mail.push({ id: uid(), from: 'support@zurex.ls', to: me().number, subject: 'Willkommen bei Zmail', body: 'Deine Adresse lautet ' + me().handle + '@zmail.ls. Viel Spaß mit deinem neuen Zurex.', t: ago(30), read: false }, { id: uid(), from: 'bank@zurex.ls', to: me().number, subject: 'Kontoauszug', body: 'Dein monatlicher Kontoauszug ist verfügbar.', t: ago(50), read: true }); }
      return { ok: true, inbox: DB.mail.filter((m) => m.to === me().number || m.to === me().handle + '@zmail.ls'), sent: DB.mail.filter((m) => m.fromNumber === me().number) };
    },
    'mail.send': ({ to, subject, body }) => { if (!to || !subject) return { ok: false, error: 'Empfänger und Betreff fehlen.' }; DB.mail.push({ id: uid(), from: me().handle + '@zmail.ls', fromNumber: me().number, to, subject: subject.slice(0, 80), body: String(body || '').slice(0, 4000), t: Date.now(), read: true }); persist(); return { ok: true }; },
    'mail.read': ({ id }) => { const m = DB.mail.find((x) => x.id === id); if (m) m.read = true; persist(); return { ok: true }; },
    'mail.delete': ({ id }) => { DB.mail = DB.mail.filter((x) => x.id !== id); persist(); return { ok: true }; },

    /* Broker */
    'broker.portfolio': () => ({ ok: true, ...(DB.portfolio.me ||= { holdings: {}, orders: [] }), cash: ZX.S.bank.balance }),
    'broker.trade': ({ sym, qty, side }) => {
      const m = M[sym]; qty = Number(qty);
      if (!m || !(qty > 0)) return { ok: false, error: 'Ungültige Order.' };
      const pf = (DB.portfolio.me ||= { holdings: {}, orders: [] });
      const cost = Math.round(m.px * qty * 100) / 100, fee = 1;
      const h = pf.holdings[sym] || { qty: 0, avg: 0 };
      if (side === 'buy') {
        if (cost + fee > ZX.S.bank.balance) return { ok: false, error: 'Nicht genug Guthaben.' };
        ZX.bankApply(-(cost + fee), 'Tradr', `Kauf ${qty} ${sym}`);
        h.avg = (h.avg * h.qty + cost) / (h.qty + qty); h.qty += qty;
      } else {
        if (h.qty < qty - 1e-9) return { ok: false, error: 'Nicht genug Stück im Depot.' };
        ZX.bankApply(cost - fee, 'Tradr', `Verkauf ${qty} ${sym}`);
        h.qty -= qty; if (h.qty < 1e-9) { h.qty = 0; h.avg = 0; }
      }
      pf.holdings[sym] = h; if (!h.qty) delete pf.holdings[sym];
      pf.orders.unshift({ id: uid(), sym, qty, side, px: m.px, t: Date.now() }); pf.orders = pf.orders.slice(0, 100);
      persist(); return { ok: true, px: m.px, balance: ZX.S.bank.balance };
    },

    /* Ghost snaps */
    'ghost.inbox': () => {
      if (!DB.ghostSeeded) { DB.ghostSeeded = true; DB.ghost.push({ id: uid(), from: PEOPLE[0], to: me().number, photo: { seed: 42, scene: 'sunset' }, caption: 'Pier heute 🌅', t: ago(1) }, { id: uid(), from: PEOPLE[1], to: me().number, photo: { seed: 77, scene: 'car' }, caption: 'Neue Felgen', t: ago(3) }); }
      return { ok: true, snaps: DB.ghost.filter((s) => s.to === me().number), stories: (DB.ghostStories ||= PEOPLE.slice(0, 5).map((p, i) => ({ id: uid(), author: p, photo: { seed: i * 99 + 5, scene: ZX.pick(ZX.SCENES) }, caption: '', t: ago(i + 1) }))) };
    },
    'ghost.send': ({ to, photo, caption, story }) => {
      if (story) { (DB.ghostStories ||= []).unshift({ id: uid(), author: me(), photo, caption, t: Date.now() }); persist(); return { ok: true }; }
      if (!to || !to.length) return { ok: false, error: 'Wähle Empfänger.' };
      persist(); return { ok: true, sent: to.length };
    },
    'ghost.open': ({ id }) => { DB.ghost = DB.ghost.filter((s) => s.id !== id); persist(); return { ok: true }; },

    /* Services / dispatch */
    'dispatch.send': ({ service }) => ({ ok: true, ref: 'Z-' + Math.floor(Math.random() * 9000 + 1000), service, units: 1 + Math.floor(Math.random() * 3) }),
    'dispatch.take': () => ({ ok: true }),

    /* Shops */
    'shop.items': ({ app }) => ({ ok: true, items: (window.ZX_SHOPS || {})[app] || [] }),
    'shop.buy': ({ app, item, qty }) => {
      const it = ((window.ZX_SHOPS || {})[app] || []).find((x) => x.name === item); qty = Math.max(1, Math.min(50, Number(qty) || 1));
      if (!it) return { ok: false, error: 'Artikel nicht gefunden.' };
      const cost = it.price * qty;
      if (cost > ZX.S.bank.balance) return { ok: false, error: 'Nicht genug Guthaben.' };
      ZX.bankApply(-cost, ZX.appMeta(app)?.name || 'Shop', `${qty}× ${it.label}`);
      return { ok: true, balance: ZX.S.bank.balance };
    },

    /* Invoices */
    'invoice.list': () => {
      if (!DB.invSeeded) { DB.invSeeded = true; DB.invoices.push({ id: uid(), from: PEOPLE[3], to: me().number, amount: 450, reason: 'Reparatur Bremsen', t: ago(20), paid: false }); }
      return { ok: true, open: DB.invoices.filter((i) => i.to === me().number && !i.paid), sent: DB.invoices.filter((i) => i.from.number === me().number), paid: DB.invoices.filter((i) => i.to === me().number && i.paid) };
    },
    'invoice.send': ({ to, amount, reason }) => { amount = Number(amount); if (!to || !(amount > 0)) return { ok: false, error: 'Empfänger und Betrag angeben.' }; DB.invoices.push({ id: uid(), from: me(), to, amount, reason: String(reason || '').slice(0, 80), t: Date.now(), paid: false }); persist(); return { ok: true }; },
    'invoice.pay': ({ id }) => {
      const inv = DB.invoices.find((i) => i.id === id); if (!inv || inv.paid) return { ok: false, error: 'Rechnung nicht offen.' };
      if (inv.amount > ZX.S.bank.balance) return { ok: false, error: 'Nicht genug Guthaben.' };
      ZX.bankApply(-inv.amount, inv.from.name, 'Rechnung: ' + inv.reason); inv.paid = true; persist(); return { ok: true };
    },

    /* Telemetry (FiveM answers from the client; here a believable fake) */
    'world.info': () => {
      const h = new Date().getHours();
      return { ok: true, pos: { x: 215 + Math.random() * 40, y: -810 + Math.random() * 40, z: 30 }, heading: (Date.now() / 80) % 360, speed: 0, street: 'Vespucci Blvd', zone: 'Pillbox Hill', weather: ['CLEAR', 'EXTRASUNNY', 'CLOUDS', 'RAIN'][Math.floor(Date.now() / 6e5) % 4], hour: h, minute: new Date().getMinutes(), inVehicle: false };
    },
    'gps.set': () => ({ ok: true }),

    /* Cards + Zurex Pay */
    'card.order': ({ type }) => {
      const t = (window.ZX_CARDS || []).find((c) => c.id === type);
      if (!t) return { ok: false, error: 'Kartentyp unbekannt.' };
      if (t.price > ZX.S.bank.balance) return { ok: false, error: 'Nicht genug Guthaben.' };
      return { ok: true };
    },
    'card.sync': () => ({ ok: true }),
    'pay.confirm': ({ ok, amount, cardType }) => {
      if (!ok) return { ok: true };
      const t = (window.ZX_CARDS || []).find((c) => c.id === cardType) || {};
      if (amount > ZX.S.bank.balance) return { ok: false, error: 'Nicht genug Guthaben.' };
      if (t.limit && amount > t.limit) return { ok: false, error: 'Kartenlimit überschritten.' };
      return { ok: true };
    },

    /* Network: carrier contracts and custom numbers (same rules as server.lua) */
    'carrier.subscribe': ({ carrier }) => {
      const c = (window.ZX_NETWORK.carriers || []).find((x) => x.id === carrier);
      if (!c) return { ok: false, error: 'Anbieter unbekannt.' };
      if (c.price > ZX.S.bank.balance) return { ok: false, error: 'Nicht genug Guthaben für den ersten Monat.' };
      return { ok: true, paidUntil: Date.now() + 30 * 864e5 };
    },
    'number.check': ({ number }) => {
      const n = numberRules(number);
      if (!n.ok) return n;
      const taken = ZX.S.contacts.some((c) => c.number === n.number) || ZX.S.owner.number === n.number || ['555-0100', '555-0911'].includes(n.number);
      return taken ? { ok: false, error: 'Diese Nummer ist bereits vergeben.' } : n;
    },
    'number.buy': ({ number }) => {
      const n = handlers['number.check']({ number });
      if (!n.ok) return n;
      if (n.price > ZX.S.bank.balance) return { ok: false, error: 'Nicht genug Guthaben.' };
      return { ok: true, number: n.number };
    },
  };

  window.LocalServer = { handle(op, args) { const fn = handlers[op]; try { return fn ? fn(args || {}) : { ok: false, error: 'Unbekannt: ' + op }; } catch (e) { console.error(e); return { ok: false, error: e.message }; } } };
})();
