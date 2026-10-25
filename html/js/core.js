/*
 * Zurex Phone OS core: state, boot/lock/home, app router, store, notifications, market feed and the RPC bridge.
 * Engines (js/engines/*.js) register renderers on ZX.engines; js/registry.js lists every app.
 * Runs standalone in a browser (mockup stage, LocalServer answers RPCs) and as FiveM NUI (the Lua server answers).
 */
(() => {
  'use strict';

  const STORE_KEY = 'zurex:v2';
  const VERSION = '2.0.0';
  const isNui = typeof window.GetParentResourceName === 'function';
  const resource = isNui ? window.GetParentResourceName() : 'zurex-phone';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 10);
  const pad = (n) => String(n).padStart(2, '0');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function post(name, data = {}) {
    if (!isNui) return Promise.resolve(null);
    return fetch(`https://${resource}/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=UTF-8' }, body: JSON.stringify(data) })
      .then((r) => r.json()).catch(() => null);
  }
  // Server RPC: FiveM goes NUI → client → server; the browser mockup answers from LocalServer (js/localserver.js).
  function rpc(op, args = {}) {
    if (isNui) return post('rpc', { op, args }).then((r) => r || { ok: false, error: 'Keine Verbindung.' });
    return Promise.resolve(window.LocalServer ? window.LocalServer.handle(op, args) : { ok: false, error: 'Offline' });
  }

  /* ───────── Icons (24px line set) ───────── */
  const I = {
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    messages: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>',
    contacts: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    bank: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M7 15h3"/>',
    pulse: '<path d="M3 17l5-6 4 4 8-9"/><path d="M15 6h5v5"/>',
    notes: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    arrowUp: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    arrowDown: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    speaker: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    play: '<path d="M7 4v16l13-8z"/>',
    hangup: '<path d="M3 15c5-5 13-5 18 0l-2.5 2.5-3.5-1.5v-3a10 10 0 0 0-6 0v3l-3.5 1.5z"/>',
    out: '<path d="M7 17 17 7M8 7h9v9"/>',
    in: '<path d="M17 7 7 17M16 17H7V8"/>',
    missed: '<path d="M3 7l6 6 4-4 8 8"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="3"/><path d="m16 10 5-3v10l-5-3"/>',
    heart: '<path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    hash: '<path d="M5 9h14M5 15h14M10 3 8 21M16 3l-2 18"/>',
    ghost: '<path d="M5 21V10a7 7 0 0 1 14 0v11l-2.5-2-2.3 2-2.2-2-2.2 2-2.3-2z"/><path d="M9.5 10h.01M14.5 10h.01"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    candle: '<path d="M6 3v4M6 15v6M18 5v3M18 17v4M12 2v5M12 13v8"/><rect x="4" y="7" width="4" height="8" rx="1"/><rect x="10" y="7" width="4" height="6" rx="1"/><rect x="16" y="8" width="4" height="9" rx="1"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9a2.5 2.5 0 0 0-2.5-1.5c-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2A2.5 2.5 0 0 1 9.5 15M12 6v1.5M12 16.5V18"/>',
    wallet: '<path d="M4 7h15a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12v3"/><path d="M16 13.5h.01"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8a2 2 0 0 0 2-1.6L21 7H6"/>',
    bag: '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="8" cy="8" r="1.5"/>',
    car: '<path d="M5 17H3v-5l2-5h14l2 5v5h-2"/><path d="M3 12h18"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/>',
    house: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10M10 20v-6h4v6"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
    pin: '<path d="M12 21s-7-6.3-7-12a7 7 0 0 1 14 0c0 5.7-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    map: '<path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    news: '<path d="M4 5h13v14a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2z"/><path d="M17 9h3v10a2 2 0 0 1-2 2M8 9h5M8 13h5M8 17h3"/>',
    cloud: '<path d="M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19.5 10 4 4 0 0 1 18 18z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    game: '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 11v3M5.5 12.5h3M15 11.5h.01M18 13.5h.01"/>',
    dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 8.5h.01M15.5 15.5h.01M12 12h.01M15.5 8.5h.01M8.5 15.5h.01"/>',
    cards: '<rect x="3" y="6" width="12" height="15" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v13"/><path d="m9 11 1.5 2L9 15l-1.5-2z"/>',
    grid: '<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>',
    puzzle: '<path d="M4 8h4a2 2 0 1 1 4 0h4v4a2 2 0 1 1 0 4v4H4z"/>',
    brain: '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a2 2 0 0 0-3-1zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1"/>',
    book: '<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>',
    scale: '<path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
    cross: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-3-3 6.3-6.3a4 4 0 0 1-5-5L13 5z"/><path d="m3 21 6-6"/>',
    fire: '<path d="M12 22a7 7 0 0 0 7-7c0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-3 3-5 5-5 8a7 7 0 0 0 7 7z"/>',
    fuel: '<path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M3 21h13M4 10h11M15 8l3 2v7a1.5 1.5 0 0 0 3 0V9l-3-3"/>',
    scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.1 8.1 20 20M8.1 15.9 20 4"/>',
    shirt: '<path d="m8 3-5 3 2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0z"/>',
    dumbbell: '<path d="M6 7v10M18 7v10M3 9v6M21 9v6M6 12h12"/>',
    food: '<path d="M7 3v8a2 2 0 0 0 4 0V3M9 11v10M17 3c-2 0-3 3-3 6s1 4 3 4v8"/>',
    coffee: '<path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 10h1a3 3 0 0 1 0 6h-1M8 2v3M12 2v3"/>',
    glass: '<path d="M6 3h12l-1 8a5 5 0 0 1-10 0zM12 16v5M8 21h8"/>',
    bed: '<path d="M3 20V6M3 16h18v4M21 16v-4a3 3 0 0 0-3-3h-8v7"/><circle cx="7" cy="12" r="2"/>',
    plane: '<path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/>',
    key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3M17 6l3 3M14 9l2 2"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    flame: '<path d="M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-5 5-5 8-1-1-2-2-2-3-2 2-2 5-2 7 0 4 3 7 7 7z"/><path d="M12 22a3 3 0 0 1-3-3c0-2 3-4 3-6 0 2 3 4 3 6a3 3 0 0 1-3 3z"/>',
    headphones: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><rect x="2" y="14" width="5" height="7" rx="2"/><rect x="17" y="14" width="5" height="7" rx="2"/>',
    radio: '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="m7 8 10-5"/><circle cx="15" cy="14.5" r="3"/><path d="M6 13h3M6 16h3"/>',
    tv: '<rect x="2" y="6" width="20" height="13" rx="2"/><path d="m8 2 4 4 4-4M8 22h8"/>',
    pen: '<path d="M16 3 21 8 8 21H3v-5z"/><path d="m13 6 5 5"/>',
    palette: '<path d="M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5S14 15 15 15h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><path d="M7.5 11h.01M10 7h.01M15 7.5h.01"/>',
    torch: '<path d="M8 2h8v5l-2 4v11h-4V11L8 7z"/><path d="M12 14v2"/>',
    level: '<rect x="2" y="8" width="20" height="8" rx="3"/><circle cx="12" cy="12" r="2"/><path d="M8 8v8M16 8v8"/>',
    steps: '<path d="M8 3c2 0 3 2 3 5s-1 5-3 5-3-1-3-4 1-6 3-6zM16 9c2 0 3 2 3 5s-1 5-3 5-3-1-3-4 1-6 3-6zM5 16h6v2a3 3 0 0 1-6 0zM13 20h6"/>',
    leaf: '<path d="M5 19c0-9 6-15 15-15 0 9-6 15-15 15z"/><path d="M5 19 13 11"/>',
    paw: '<circle cx="5" cy="11" r="2"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="6" r="2"/><circle cx="19" cy="11" r="2"/><path d="M12 12c-3 0-6 4-6 6.5S8 21 12 20s6 1 6-1.5-3-6.5-6-6.5z"/>',
    gift: '<rect x="3" y="8" width="18" height="5" rx="1"/><path d="M5 13v8h14v-8M12 8v13M12 8S10 3 7.5 4.5 9 8 12 8zM12 8s2-5 4.5-3.5S15 8 12 8z"/>',
    ticket: '<path d="M3 8a2 2 0 0 0 0 4v0a2 2 0 0 0 0 4v2h18v-2a2 2 0 0 1 0-4 2 2 0 0 1 0-4V6H3z"/><path d="M14 6v12" stroke-dasharray="2 2"/>',
    film: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18M17 3v18M3 8h4M3 16h4M17 8h4M17 16h4M3 12h18"/>',
    code: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
    thermo: '<path d="M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0z"/>',
    drop: '<path d="M12 3s7 7.5 7 12a7 7 0 0 1-14 0c0-4.5 7-12 7-12z"/>',
    wind: '<path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h7"/>',
    rocket: '<path d="M5 15c-2 1-2 4-2 6 2 0 5 0 6-2M9 15l-2-2c1-4 4-9 12-10-1 8-6 11-10 12z"/><circle cx="15" cy="9" r="1.5"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    bomb: '<circle cx="11" cy="14" r="7"/><path d="m16 9 2-2M18 4l1 1M20 6l1-1"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    piano: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4v10M12 4v16M16 4v10M8 14v6M16 14v6"/>',
    drum: '<ellipse cx="12" cy="8" rx="8" ry="3"/><path d="M4 8v8c0 1.7 3.6 3 8 3s8-1.3 8-3V8M18 2l-4 6M6 2l4 6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0M16 4a3.5 3.5 0 0 1 0 7M18 13.5a7 7 0 0 1 4 6.5"/>',
    store: '<path d="M4 9h16l-1-5H5zM4 9v11h16V9M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M10 20v-5h4v5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    comment: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    gauge: '<path d="M12 14l4-4M3.3 17A10 10 0 1 1 20.7 17"/>',
    snake: '<path d="M4 18h10a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h9"/><circle cx="18" cy="6" r="1"/>',
    ball: '<circle cx="12" cy="12" r="9"/><path d="M12 3a15 15 0 0 0 0 18M3.5 9h17M3.5 15h17"/>',
    feather: '<path d="M20 4c-8 0-14 6-14 14v2h2c8 0 12-8 12-16z"/><path d="M4 20 14 10M9 15h6"/>',
    vote: '<path d="m12 4 7 8h-4v8H9v-8H5z"/>',
    hammer: '<path d="m14 6 4 4-10 10-4-4zM12 4l3-2 7 7-2 3"/>',
    medal: '<circle cx="12" cy="15" r="6"/><path d="M8.5 10 6 2h4l2 5 2-5h4l-2.5 8"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    anchor: '<circle cx="12" cy="5" r="2"/><path d="M12 7v14M5 13a7 7 0 0 0 14 0M8 11h8"/>',
    cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M10 10h4v4h-4zM9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
    receipt: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    swap: '<path d="M7 7h13l-4-4M17 17H4l4 4"/>',
    wave: '<path d="M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/>',
  };
  const svg = (name, extra = '') => `<svg viewBox="0 0 24 24" ${extra}>${I[name] || I.sparkle}</svg>`;

  /* The Zurex mark: a "Z-ebra". The top bar of the Z is the zebra's head (mane, ears, eye, nostril),
   * the letter is filled with chrome-pink and cut by zebra stripes. */
  let logoN = 0;
  function logo(cls = '') {
    const k = 'zl' + (logoN++);
    const Z = 'M20 30 H96 Q102 30 102 36 V44 L52 84 H98 Q102 84 102 88 V96 Q102 100 98 100 H24 Q18 100 18 94 V86 L68 46 H20 Q16 46 16 42 V34 Q16 30 20 30 Z';
    return `<svg class="zlogo ${cls}" viewBox="0 0 120 120" aria-label="Zurex">
      <defs>
        <linearGradient id="${k}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe3f1"/><stop offset=".35" stop-color="#f9a8d4"/><stop offset=".7" stop-color="var(--signal)"/><stop offset="1" stop-color="#9d174d"/></linearGradient>
        <linearGradient id="${k}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <clipPath id="${k}c"><path d="${Z}"/></clipPath>
      </defs>
      <!-- mane -->
      <g fill="#0b080a" stroke="url(#${k}g)" stroke-width="2.2" stroke-linejoin="round">${[0, 1, 2, 3, 4].map((i) => `<path d="M${30 + i * 11} 31 L${33 + i * 11} ${17 - (i % 2) * 4} L${39 + i * 11} 31 Z"/>`).join('')}</g>
      <!-- ears -->
      <path d="M22 32 C16 18 20 8 28 6 C32 14 32 24 30 31 Z" fill="url(#${k}g)"/><path d="M24 29 C21 20 23 13 27 11 C29 17 29 23 28 29 Z" fill="#0b080a" opacity=".55"/>
      <!-- body of the Z with zebra stripes -->
      <path d="${Z}" fill="url(#${k}g)"/>
      <g clip-path="url(#${k}c)" fill="#0b080a">
        ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path d="M${-6 + i * 17} 120 C${4 + i * 17} 96 ${-2 + i * 17} 70 ${14 + i * 17} 50 C${22 + i * 17} 40 ${26 + i * 17} 34 ${30 + i * 17} 22 L${36 + i * 17} 22 C${33 + i * 17} 36 ${28 + i * 17} 44 ${21 + i * 17} 54 C${7 + i * 17} 74 ${12 + i * 17} 98 ${3 + i * 17} 120 Z" opacity="${i % 2 ? .9 : .78}"/>`).join('')}
        <rect x="0" y="0" width="120" height="60" fill="url(#${k}s)" opacity=".5"/>
      </g>
      <path d="${Z}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.2"/>
      <!-- face on the top bar: eye + nostril -->
      <circle cx="80" cy="38" r="5.4" fill="#fff"/><circle cx="81.6" cy="38.6" r="2.8" fill="#0b080a"/><circle cx="82.6" cy="37.4" r="1" fill="#fff"/>
      <ellipse cx="96.5" cy="40" rx="1.6" ry="2.2" fill="#0b080a"/>
    </svg>`;
  }

  /* ───────── State ───────── */
  const now = Date.now();
  const H = 3600e3, D = 24 * H;
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const dayOffset = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };

  const seed = () => ({
    model: 'ultra', finish: 'natur', accent: 'pink', wall: 'grid', airplane: false, dnd: false, sound: true, brightness: 100,
    owner: { name: 'Du', number: '555-0142', handle: 'zurex_user' },
    installed: null, // filled from registry defaults on first start
    contacts: [
      { id: 'c1', name: 'Mia Kraus', number: '555-0117', fav: true },
      { id: 'c2', name: 'Leon Becker', number: '555-0193', fav: true },
      { id: 'c3', name: 'Zurex Support', number: '555-0100', fav: false },
      { id: 'c4', name: 'Jonas Werkstatt', number: '555-0164', fav: false },
      { id: 'c5', name: 'Lena Vogel', number: '555-0128', fav: false },
      { id: 'c6', name: 'Taxi Zentrale', number: '555-0177', fav: false },
    ],
    threads: {
      c1: [{ me: false, text: 'Bist du heute Abend am Pier?', t: now - 3 * H }, { me: true, text: 'Klar, so gegen 21 Uhr.', t: now - 2.9 * H }, { me: false, text: 'Perfekt. Bring Leon mit 🌙', t: now - 0.4 * H }],
      c2: [{ me: false, text: 'Hab die Kohle überwiesen, check mal.', t: now - 26 * H }],
      c3: [{ me: false, text: 'Willkommen bei Zurex. Dein XR7 ist eingerichtet.', t: now - 3 * D }],
      c4: [{ me: true, text: 'Ist der Wagen fertig?', t: now - 5 * H }, { me: false, text: 'Morgen ab 10. Bremsen sind neu.', t: now - 4.5 * H }],
    },
    unread: { c1: 1, c2: 1 },
    recents: [
      { name: 'Mia Kraus', number: '555-0117', t: now - 1.5 * H, dir: 'in', dur: 184 },
      { name: 'Taxi Zentrale', number: '555-0177', t: now - 20 * H, dir: 'out', dur: 42 },
      { name: '555-0199', number: '555-0199', t: now - 30 * H, dir: 'missed', dur: 0 },
    ],
    bank: {
      balance: 48250.75, iban: 'ZRX 0042 7781 0142',
      tx: [
        { id: uid(), label: 'Leon Becker', note: 'Miete', amount: 1200, t: now - 26 * H },
        { id: uid(), label: 'Los Santos Customs', note: 'Bremsen', amount: -2850, t: now - 2 * D },
        { id: uid(), label: 'Gehalt', note: 'Zurex Logistics', amount: 6400, t: now - 4 * D },
        { id: uid(), label: '24/7 Supermarkt', note: 'Einkauf', amount: -86.4, t: now - 5 * D },
        { id: uid(), label: 'Tankstelle Ron', note: 'Tanken', amount: -112.9, t: now - 6 * D },
      ],
    },
    notes: [
      { id: 'n1', title: 'Pläne für die Woche', body: 'Werkstatt Dienstag 10 Uhr\nMia am Pier, Freitag\nMiete an Leon zurück', t: now - 6 * H },
      { id: 'n2', title: 'Codes', body: 'Garage Tor: frag Jonas\nLagerhalle 7, hinterer Eingang', t: now - 3 * D },
    ],
    events: {
      [dayOffset(0)]: [{ id: uid(), time: '21:00', title: 'Pier mit Mia & Leon' }],
      [dayOffset(1)]: [{ id: uid(), time: '10:00', title: 'Wagen abholen, Werkstatt' }],
      [dayOffset(4)]: [{ id: uid(), time: '18:30', title: 'Zurex Meetup' }],
    },
    photos: [],
    data: {}, // per-app local storage: ZX.data(appId)
    best: {}, // game highscores
  });
  // Ingame the phone starts empty: demo people and chats only exist in the mockup.
  const fresh = () => {
    const s = seed();
    if (isNui) Object.assign(s, { contacts: [], threads: {}, unread: {}, recents: [], notes: [], events: {}, bank: { balance: 0, iban: 'ZRX 0000 0000 0000', tx: [] } });
    return s;
  };
  let S;
  try { S = JSON.parse(localStorage.getItem(STORE_KEY)) || fresh(); } catch { S = fresh(); }
  let saveTimer = null;
  const save = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch { /* storage blocked: session-only */ } }, 120); };

  /* ───────── Formatting ───────── */
  const eur = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  const money = (n) => eur.format(n);
  const num = (n, dp = 2) => Number(n).toLocaleString('de-DE', { minimumFractionDigits: dp, maximumFractionDigits: dp });
  const hm = (t) => { const d = new Date(t); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  function ago(t) {
    const d = new Date(t), n = new Date(), s = (n - d) / 1000;
    if (s < 60) return 'jetzt';
    if (s < 3600) return `${Math.floor(s / 60)} Min.`;
    if (d.toDateString() === n.toDateString()) return hm(t);
    const y = new Date(); y.setDate(n.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return 'Gestern';
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
  }
  const initials = (name) => String(name).replace(/[^\p{L}\p{N} ]/gu, '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '#';
  const contactBy = (id) => S.contacts.find((c) => c.id === id);
  const contactByNumber = (n) => S.contacts.find((c) => c.number.replace(/\D/g, '') === String(n).replace(/\D/g, ''));

  /* ───────── Elements ───────── */
  const screen = $('#screen');
  const layers = { boot: $('#boot'), lock: $('#lock'), home: $('#home'), app: $('#app'), call: $('#call') };
  const appBody = $('#appBody');
  let current = null; // { id, view, arg }
  let booted = false;

  function show(name) {
    for (const [k, el] of Object.entries(layers)) { if (k !== 'call') el.hidden = k !== name; }
    const el = layers[name];
    el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter');
  }
  /* Three hardware models, front proportions after a current 6.9" / 6.3" / 6.1" flagship. */
  const MODELS = {
    ultra: { name: 'Zurex XR7 Ultra', short: 'XR7 Ultra', w: 462, h: 978, inch: '6,9″', lenses: 3, finishes: { natur: ['Titan Natur', '#bfb6ad'], schwarz: ['Titan Schwarz', '#3a3438'], rose: ['Titan Rosé', '#d9a1b8'], wueste: ['Wüstentitan', '#c7a585'] } },
    pro: { name: 'Zurex XR7 Pro', short: 'XR7 Pro', w: 424, h: 896, inch: '6,3″', lenses: 3, finishes: { schwarz: ['Titan Schwarz', '#3a3438'], natur: ['Titan Natur', '#bfb6ad'], rose: ['Titan Rosé', '#d9a1b8'], blau: ['Titan Nachtblau', '#4a5568'] } },
    base: { name: 'Zurex XR7', short: 'XR7', w: 414, h: 874, inch: '6,1″', lenses: 2, finishes: { pink: ['Signal Pink', '#f2a7c8'], schwarz: ['Schwarz', '#2b2629'], weiss: ['Weiß', '#e8e3e6'], tuerkis: ['Türkis', '#8fd6cf'] } },
  };
  function applyModel() {
    if (!MODELS[S.model]) S.model = 'ultra';
    const M = MODELS[S.model];
    if (!M.finishes[S.finish]) S.finish = Object.keys(M.finishes)[0];
    const root = document.documentElement;
    root.dataset.model = S.model;
    root.style.setProperty('--dev-w', M.w + 'px');
    root.style.setProperty('--dev-h', M.h + 'px');
    root.style.setProperty('--frame', M.finishes[S.finish][1]);
    const back = $('#deviceBack');
    if (back) back.dataset.lenses = M.lenses;
    if (window.ZX3D) window.ZX3D.update(S.model, M.finishes[S.finish][1]);
    const lbl = $('#stageModel'); if (lbl) lbl.textContent = `${M.name} · ${M.inch} · ${M.finishes[S.finish][0]}`;
    const sw = $('#stageSwitch');
    if (sw) sw.innerHTML = `<div class="ms-models">${Object.entries(MODELS).map(([k, m]) => `<button type="button" data-model="${k}" class="${k === S.model ? 'on' : ''}">${m.short}<small>${m.inch}</small></button>`).join('')}</div>
      <div class="ms-finishes">${Object.entries(M.finishes).map(([k, [n, c]]) => `<button type="button" data-finish="${k}" class="${k === S.finish ? 'on' : ''}" style="--c:${c}" aria-label="${n}" title="${n}"></button>`).join('')}</div>`;
    fit();
  }
  function applySettings() {
    applyModel();
    if (S.accent === 'pink') delete document.documentElement.dataset.accent; else document.documentElement.dataset.accent = S.accent;
    screen.dataset.wall = S.wall;
    document.body.classList.toggle('airplane', S.airplane);
    screen.style.filter = S.brightness < 100 ? `brightness(${0.4 + S.brightness / 100 * 0.6})` : '';
  }
  $$('[data-i]').forEach((s) => { s.innerHTML = svg(s.dataset.i); });
  $$('.boot-logo .glass-z').forEach((el) => { el.outerHTML = logo(); });
  $$('.mark').forEach((el) => { el.classList.add('zl'); el.innerHTML = logo(); });

  /* ───────── App registry ───────── */
  const APPS = [];
  const byId = new Map();
  const CATS = {
    core: 'System', social: 'Social', chat: 'Chat', finance: 'Finanzen', market: 'Marktplatz', games: 'Games', casino: 'Casino',
    tools: 'Tools', services: 'Dienste', places: 'Orte', shop: 'Shopping', music: 'Musik', info: 'Info', health: 'Fitness', quiz: 'Quiz', creative: 'Kreativ',
  };
  function register(list) {
    for (const a of list) {
      if (byId.has(a.id)) { console.warn('[zurex] duplicate app', a.id); continue; }
      a.idx = String(APPS.length + 1).padStart(3, '0');
      APPS.push(a); byId.set(a.id, a);
    }
    // Guard: no two apps may share a glyph.
    const seen = new Map();
    for (const a of APPS) { const k = (window.ZX_APP_ICONS || {})[a.id] ? 'own:' + a.id : a.icon; if (seen.has(k)) console.warn('[zurex] icon shared by', seen.get(k), 'and', a.id); else seen.set(k, a.id); }
  }
  const appMeta = (id) => byId.get(id);

  /* ───────── Clock ───────── */
  function tick() {
    const d = new Date();
    const t = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    $('#sbTime').textContent = t;
    $('#lockTime').textContent = t;
    $('#lockDate').textContent = d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
    $('#stageClock').textContent = `UTC ${d.toISOString().slice(11, 19)}`;
    const h = d.getHours();
    $('#homeGreeting').textContent = h < 5 ? 'GUTE NACHT' : h < 11 ? 'GUTEN MORGEN' : h < 18 ? 'GUTEN TAG' : 'GUTEN ABEND';
    $('#sbBattFill').style.width = `${Math.max(18, 100 - (d.getMinutes() % 60))}%`;
  }
  tick(); setInterval(tick, 1000);
  $('#stageBuild').textContent = VERSION;

  /* ───────── Boot ───────── */
  function boot() {
    show('boot');
    const steps = ['Kernel wird geladen', 'Netz wird gesucht', `${APPS.length} Apps werden geladen`, 'Bereit'];
    const total = reduced ? 300 : 2200;
    const t0 = performance.now();
    return new Promise((resolve) => {
      (function frame(t) {
        const p = Math.min(1, (t - t0) / total);
        const e = 1 - Math.pow(1 - p, 3);
        const step = Math.min(3, Math.floor(p * 4));
        $('#bootBar').style.width = `${e * 100}%`;
        $('#bootPct').textContent = `${Math.round(e * 100)}%`;
        $('#bootStep').textContent = `STEP ${step + 1} / 4`;
        $('#bootMsg').textContent = steps[step];
        $('#bootTime').textContent = `${((t - t0) / 1000).toFixed(1)} s`;
        if (p < 1) requestAnimationFrame(frame); else setTimeout(resolve, 260);
      })(t0);
    }).then(() => { booted = true; showLock(); });
  }

  /* ───────── Lock ───────── */
  const lockFeed = []; // recent notifications for the lock screen
  function showLock() {
    show('lock');
    const items = [...lockFeed];
    for (const [cid, n] of Object.entries(S.unread)) {
      if (!n) continue;
      const c = contactBy(cid), last = (S.threads[cid] || []).slice(-1)[0];
      if (c && last) items.push({ icon: 'messages', title: c.name, text: last.text, t: last.t });
    }
    S.recents.filter((r) => r.dir === 'missed' && !r.seen).slice(0, 1).forEach((r) => items.push({ icon: 'phone', title: 'Verpasster Anruf', text: r.name, t: r.t }));
    items.sort((a, b) => b.t - a.t);
    $('#lockNotes').innerHTML = items.slice(0, 3).map((n, i) => `
      <li style="animation-delay:${i * 70}ms"><span class="ni">${svg(n.icon)}</span><b>${esc(n.title)}</b><small>${ago(n.t)}</small><p>${S.ui && S.ui.lockNotes ? 'Neue Mitteilung' : esc(n.text)}</p></li>`).join('');
  }
  function unlock() {
    const go = () => { lockFeed.length = 0; renderHome(); show('home'); };
    if (window.ZX && ZX.pinGate) ZX.pinGate(go); else go();
  }
  (function lockGesture() {
    const lock = layers.lock;
    let y0 = null;
    lock.addEventListener('pointerdown', (e) => { y0 = e.clientY; lock.classList.add('dragging'); lock.setPointerCapture(e.pointerId); });
    lock.addEventListener('pointermove', (e) => {
      if (y0 === null) return;
      const dy = Math.min(0, e.clientY - y0);
      lock.style.transform = `translateY(${dy * 0.6}px)`; lock.style.opacity = String(1 + dy / 500);
    });
    const end = (e) => {
      if (y0 === null) return;
      const dy = e.clientY - y0; y0 = null;
      lock.classList.remove('dragging'); lock.style.transform = ''; lock.style.opacity = '';
      if (dy < -90 || (Math.abs(dy) < 6 && e.target.closest('#lockHandle'))) unlock();
    };
    lock.addEventListener('pointerup', end); lock.addEventListener('pointercancel', end);
    $('#lockHandle').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); unlock(); } });
  })();

  /* ───────── Home: pages + library ───────── */
  const installed = () => {
    if (!S.installed) S.installed = APPS.filter((a) => a.core || a.preinstalled).map((a) => a.id);
    return S.installed.map(appMeta).filter(Boolean);
  };
  const badgeFor = (id) => id === 'messages' ? Object.values(S.unread).reduce((s, n) => s + n, 0)
    : id === 'phone' ? S.recents.filter((r) => r.dir === 'missed' && !r.seen).length
    : (S.badges && S.badges[id]) || 0;
  function tileStyle(a) {
    if (a.hero) return '';
    return a.tint ? `style="--tint:${a.tint}"` : '';
  }
  // Each app owns a unique glyph (js/icons.js); app.icon is the fallback from the shared set.
  const appSvg = (a, extra = '') => {
    const own = (window.ZX_APP_ICONS || {})[a.id];
    return own ? `<svg viewBox="0 0 24 24" ${extra}>${own}</svg>` : svg(a.icon, extra);
  };
  function iconHTML(a, withLabel = true) {
    const badge = badgeFor(a.id);
    // Tile: tinted glass gradient, glossy rim, glow, and a faint oversized echo of the glyph behind it.
    return `<button class="icon" type="button" data-open="${a.id}" aria-label="${esc(a.name)}">
      <span class="tile ${a.hero ? 'hero' : ''} tinted" style="--tint:${a.tint || 'var(--signal)'}"><span class="tile-clip"><span class="tile-echo">${appSvg(a)}</span></span>${appSvg(a, 'class="tile-glyph"')}${badge ? `<span class="badge">${badge > 99 ? '99+' : badge}</span>` : ''}</span>
      ${withLabel ? `<span class="lbl">${esc(a.short || a.name)}</span>` : '<span class="lbl"></span>'}</button>`;
  }
  function sparkPath(vals, w, h, padY = 4) {
    const min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1;
    return vals.map((v, i) => `${i ? 'L' : 'M'}${(i / (vals.length - 1) * w).toFixed(1)},${(padY + (1 - (v - min) / span) * (h - padY * 2)).toFixed(1)}`).join(' ');
  }
  function balanceHistory() {
    const pts = []; let b = S.bank.balance;
    for (let d = 0; d <= 7; d++) {
      pts.unshift(b);
      const from = Date.now() - (d + 1) * D, to = Date.now() - d * D;
      S.bank.tx.filter((t) => t.t > from && t.t <= to).forEach((t) => { b -= t.amount; });
    }
    return pts;
  }
  const DOCK = ['phone', 'messages', 'flick', 'settings'];
  let homePage = 0;
  function renderHome() {
    const apps = installed();
    const dockIds = ((S.ui && S.ui.dock) || DOCK).filter((id, i, arr) => arr.indexOf(id) === i && apps.some((a) => a.id === id));
    const rest = apps.filter((a) => !dockIds.includes(a.id));
    const first = rest.slice(0, 8), more = rest.slice(8);
    const pages = [];
    for (let i = 0; i < more.length; i += 24) pages.push(more.slice(i, i + 24));
    $('#appGrid').innerHTML = first.map((a) => iconHTML(a)).join('');
    $('#homePages').innerHTML = pages.map((p, i) => `<div class="hpage" data-page="${i + 1}"><div class="home-head"><span class="tag">ZUREX // SEITE ${pad(i + 2)}</span><span class="tag">${p.length} APPS</span></div><div class="grid">${p.map((a) => iconHTML(a)).join('')}</div></div>`).join('')
      + `<div class="hpage lib" data-page="${pages.length + 1}">${libraryHTML()}</div>`;
    $('#dock').innerHTML = dockIds.map((id) => iconHTML(appMeta(id), false)).join('');
    const total = pages.length + 2;
    homePage = Math.min(homePage, total - 1);
    $('#pageDots').innerHTML = Array.from({ length: total }, (_, i) => `<i class="${i === homePage ? 'on' : ''} ${i === total - 1 ? 'lib' : ''}"></i>`).join('');
    setPage(homePage, false);
    const hist = balanceHistory();
    const d = hist[hist.length - 1] - hist[0];
    $('#wBalance').textContent = money(S.bank.balance);
    $('#wDelta').innerHTML = `<span class="${d >= 0 ? 'gain' : 'loss'}">${d >= 0 ? '▲' : '▼'} ${money(Math.abs(d))}</span>`;
    const p = sparkPath(hist, 300, 54);
    $('#wSpark').innerHTML = `<defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--signal)" stop-opacity=".35"/><stop offset="1" stop-color="var(--signal)" stop-opacity="0"/></linearGradient></defs>
      <path d="${p} L300,54 L0,54Z" fill="url(#wg)" stroke="none"/><path d="${p}" stroke="var(--signal)" stroke-width="2"/>`;
    renderTicker();
    renderMiniWidgets();
    const lib = $('#libSearch');
    lib?.addEventListener('input', () => filterLibrary(lib.value));
  }
  function libraryHTML() {
    const apps = installed();
    const cats = {};
    apps.forEach((a) => { (cats[a.cat] ||= []).push(a); });
    return `<div class="home-head"><span class="tag">APP-MEDIATHEK</span><span class="tag">${apps.length} / ${APPS.length}</span></div>
      <input class="field lib-search" id="libSearch" placeholder="In ${apps.length} Apps suchen" autocomplete="off" />
      <div class="lib-scroll" id="libScroll">${Object.entries(cats).map(([c, list]) => `<section class="lib-cat" data-cat="${c}"><p class="tag">${CATS[c] || c} · ${list.length}</p><div class="lib-grid">${list.map((a) => `<span data-name="${esc((a.name + ' ' + (a.tags || '')).toLowerCase())}">${iconHTML(a)}</span>`).join('')}</div></section>`).join('')}
      <button class="btn ghost" type="button" data-open="store">Mehr Apps im Zurex Store</button></div>`;
  }
  function filterLibrary(q) {
    q = q.trim().toLowerCase();
    $$('#libScroll [data-name]').forEach((el) => { el.hidden = !!q && !el.dataset.name.includes(q); });
    $$('#libScroll .lib-cat').forEach((s) => { s.hidden = !$$('[data-name]', s).some((x) => !x.hidden); });
  }
  function setPage(i, animate = true) {
    const track = $('#homeTrack');
    const total = $$('#pageDots i').length;
    homePage = clamp(i, 0, total - 1);
    track.style.transition = animate ? 'transform var(--d-ui) var(--ease-out)' : 'none';
    track.style.transform = `translateX(${-homePage * 100}%)`;
    $$('#pageDots i').forEach((d, k) => d.classList.toggle('on', k === homePage));
  }
  (function pageSwipe() {
    const vp = $('#homeViewport');
    let x0 = null, y0 = 0, dx = 0, locked = null;
    vp.addEventListener('pointerdown', (e) => { if (e.target.closest('input')) return; x0 = e.clientX; y0 = e.clientY; dx = 0; locked = null; });
    vp.addEventListener('pointermove', (e) => {
      if (x0 === null) return;
      dx = e.clientX - x0; const dy = e.clientY - y0;
      if (locked === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (locked !== 'x') return;
      const track = $('#homeTrack');
      track.style.transition = 'none';
      track.style.transform = `translateX(calc(${-homePage * 100}% + ${dx}px))`;
    });
    const end = () => {
      if (x0 === null) return;
      x0 = null;
      if (locked === 'x') {
        swallowClick = Math.abs(dx) > 8;
        setPage(homePage + (dx < -50 ? 1 : dx > 50 ? -1 : 0));
      }
    };
    vp.addEventListener('pointerup', end); vp.addEventListener('pointercancel', end); vp.addEventListener('pointerleave', end);
    vp.addEventListener('wheel', (e) => { if (Math.abs(e.deltaX) > 30 && Math.abs(e.deltaX) > Math.abs(e.deltaY)) setPage(homePage + Math.sign(e.deltaX)); }, { passive: true });
    $('#pageDots').addEventListener('click', (e) => { const i = $$('#pageDots i').indexOf(e.target); if (i >= 0) setPage(i); });
  })();
  let swallowClick = false;

  function nextEvent() {
    const n = new Date(), todayKey = ymd(n), nowHm = `${pad(n.getHours())}:${pad(n.getMinutes())}`;
    return Object.keys(S.events).filter((k) => k >= todayKey).sort().flatMap((k) =>
      S.events[k].filter((e) => k > todayKey || e.time >= nowHm).sort((a, b) => a.time.localeCompare(b.time)).map((e) => ({ ...e, day: k })))[0];
  }
  function renderMiniWidgets() {
    const ev = nextEvent();
    const dayLabel = (k) => { const d = new Date(k + 'T12:00:00'), t = new Date(); const diff = Math.round((d - new Date(t.getFullYear(), t.getMonth(), t.getDate(), 12)) / D); return diff === 0 ? 'Heute' : diff === 1 ? 'Morgen' : d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' }); };
    $('#wAgenda').innerHTML = ev
      ? `<span class="tag">Nächster Termin</span><p class="big">${esc(ev.time)}</p><p class="ttl">${esc(ev.title)}</p><p class="sub">${dayLabel(ev.day)}</p>`
      : `<span class="tag">Kalender</span><p class="big">${new Date().getDate()}</p><p class="ttl">Keine Termine</p><p class="sub">Tippen zum Planen</p>`;
    const m = Market.get('ZRX');
    if (!m) return;
    const ch = Market.change(m), up = ch >= 0;
    $('#wPulse').innerHTML = `<span class="tag">Tradr · ${m.sym}</span><p class="big">${Market.fmt(m)}</p><span class="pill ${up ? 'gain' : 'loss'}" style="align-self:flex-start;margin-top:6px">${up ? '+' : ''}${ch.toFixed(2)}%</span>
      <svg viewBox="0 0 120 30" preserveAspectRatio="none"><path d="${sparkPath(m.hist.slice(-40), 120, 30, 3)}" stroke="${up ? 'var(--gain)' : 'var(--loss)'}" stroke-width="1.6"/></svg>`;
  }
  function renderTicker() {
    const items = Market.list().slice(0, 10).map((m) => { const ch = Market.change(m); return `<span><b>${m.sym}</b> ${Market.fmt(m)} <span class="${ch >= 0 ? 'up' : 'dn'}">${ch >= 0 ? '+' : ''}${ch.toFixed(2)}%</span></span>`; }).join('');
    $('#ticker').innerHTML = items + items;
  }

  /* ───────── Market feed (shared by Pulse, Tradr, Coinz, Chartview…) ───────── */
  const Market = (() => {
    const map = new Map();
    const listeners = new Set();
    const CANDLE_TICKS = 5;
    function ingest(list) { // [{sym,name,kind,px,dp,open,hist?,candles?}]
      for (const s of list) {
        let m = map.get(s.sym);
        if (!m) { m = { ...s, hist: s.hist || [s.px], candles: s.candles || [] }; map.set(s.sym, m); continue; }
        m.px = s.px; if (s.open) m.open = s.open;
        m.hist.push(s.px); if (m.hist.length > 120) m.hist.shift();
        const c = m.candles[m.candles.length - 1];
        if (!c || c.n >= CANDLE_TICKS) { m.candles.push({ o: c ? c.c : s.px, h: s.px, l: s.px, c: s.px, n: 1, t: Date.now() }); if (m.candles.length > 240) m.candles.shift(); }
        else { c.h = Math.max(c.h, s.px); c.l = Math.min(c.l, s.px); c.c = s.px; c.n++; }
      }
      listeners.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
    }
    return {
      ingest, get: (sym) => map.get(sym), list: (kind) => [...map.values()].filter((m) => !kind || m.kind === kind),
      change: (m) => (m.px / m.open - 1) * 100,
      fmt: (m, px = m.px) => Number(px).toLocaleString('de-DE', { minimumFractionDigits: m.dp, maximumFractionDigits: m.dp }),
      on: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    };
  })();

  /* ───────── App router ───────── */
  // Cleanup scope: engines register intervals/RAFs/listeners that must stop when the app closes.
  let scope = [];
  const cleanup = () => { scope.forEach((fn) => { try { fn(); } catch { /* ignore */ } }); scope = []; };
  const live = {
    interval(fn, ms) { const id = setInterval(fn, ms); scope.push(() => clearInterval(id)); return id; },
    timeout(fn, ms) { const id = setTimeout(fn, ms); scope.push(() => clearTimeout(id)); return id; },
    raf(fn) { let id, alive = true; const loop = (t) => { if (!alive) return; if (fn(t) !== false) id = requestAnimationFrame(loop); }; id = requestAnimationFrame(loop); scope.push(() => { alive = false; cancelAnimationFrame(id); }); },
    on(target, type, fn, opts) { target.addEventListener(type, fn, opts); scope.push(() => target.removeEventListener(type, fn, opts)); },
    add(fn) { scope.push(fn); },
  };

  function openApp(id, view = null, arg = null) {
    const a = appMeta(id);
    if (!a) return;
    if (!installed().some((x) => x.id === id) && id !== 'store') { openApp('store', 'detail', id); return; }
    const freshOpen = !current || current.id !== id;
    cleanup();
    current = { id, view, arg };
    if (S.badges && S.badges[id]) { S.badges[id] = 0; save(); }
    if (layers.app.hidden || freshOpen) show('app');
    $('#app').dataset.app = id;
    $('#app').style.setProperty('--app-tint', a.tint || 'var(--signal)');
    $('#appMark').innerHTML = appSvg(a);
    renderApp();
  }
  function goHome() {
    cleanup();
    current = null;
    if (!layers.call.hidden) return;
    if (!booted || !layers.lock.hidden || !layers.boot.hidden) return;
    renderHome(); show('home');
  }
  function back() {
    if (current && current.view) {
      const parent = current.parent;
      cleanup();
      if (parent) { current.view = parent.view; current.arg = parent.arg; current.parent = parent.parent; } else { current.view = null; current.arg = null; }
      renderApp();
    } else goHome();
  }
  // Navigate to a sub view and remember where we came from (so Back walks up properly).
  function go(view, arg = null) {
    cleanup();
    current.parent = current.view ? { view: current.view, arg: current.arg, parent: current.parent } : null;
    current.view = view; current.arg = arg;
    renderApp();
  }
  $('#appBack').addEventListener('click', back);
  $('#homeBar').addEventListener('click', () => { if (!layers.lock.hidden) return unlock(); goHome(); });
  document.addEventListener('click', (e) => {
    const o = e.target.closest('[data-open]');
    if (!o) return;
    if (swallowClick) { swallowClick = false; return; }
    openApp(o.dataset.open);
  }, true);

  function setHead(title, eyebrowExtra = '', action = '') {
    const a = appMeta(current.id);
    $('#appEyebrow').textContent = `${a.idx} — ${eyebrowExtra || CATS[a.cat] || a.name}`;
    $('#appTitle').textContent = title;
    $('#appAction').innerHTML = action;
    $('#app').classList.toggle('immersive', false);
  }

  const RENDER = {};
  const engines = {};
  function renderApp(isLive = false) {
    if (!current) return;
    appBody.classList.remove('flex', 'flush');
    appBody.removeAttribute('style');
    if (!isLive) { appBody.onclick = null; appBody.oninput = null; appBody.onchange = null; appBody.onsubmit = null; appBody.onpointerdown = null; appBody.onpointerup = null; }
    if (!isLive) appBody.scrollTop = 0;
    const a = appMeta(current.id);
    const fn = RENDER[a.id] || (a.engine && engines[a.engine] && ((v, arg, l) => engines[a.engine](a, v, arg, l)));
    if (!fn) { setHead(a.name); appBody.innerHTML = '<p class="empty">Diese App ist nicht verfügbar.</p>'; return; }
    const fail = (err) => { console.error(err); appBody.innerHTML = `<p class="empty">Fehler in ${esc(a.name)}: ${esc(err.message)}</p>`; };
    try { const r = fn(current.view, current.arg, isLive); if (r && typeof r.catch === 'function') r.catch(fail); } catch (err) { fail(err); }
  }

  /* ───────── Notifications ───────── */
  let toastTimer = null;
  let audioCtx = null;
  function audio() { try { audioCtx ||= new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); return audioCtx; } catch { return null; } }
  function chime() {
    if (!S.sound || S.dnd) return;
    const ac = audio(); if (!ac) return;
    const t = ac.currentTime;
    [880, 1318].forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.value = f; o.connect(g); g.connect(ac.destination);
      g.gain.setValueAtTime(0, t + i * .09); g.gain.linearRampToValueAtTime(.07, t + i * .09 + .01); g.gain.exponentialRampToValueAtTime(.0001, t + i * .09 + .35);
      o.start(t + i * .09); o.stop(t + i * .09 + .4);
    });
  }
  function notify(icon, title, text, onOpen, appId) {
    if (S.dnd && icon !== 'settings') return;
    if (appId && (!current || current.id !== appId)) { S.badges ||= {}; S.badges[appId] = (S.badges[appId] || 0) + 1; save(); }
    const t = $('#toast');
    const a = appMeta(icon);
    const ic = a ? a.icon : icon;
    t.innerHTML = `<span class="ni" style="--tint:${(a && a.tint) || 'var(--signal)'}">${a ? appSvg(a) : svg(ic)}</span><b>${esc(title)}</b><p>${esc(text)}</p>`;
    t.onclick = () => { t.classList.remove('show'); if (!layers.lock.hidden || !layers.boot.hidden) return; (onOpen || (() => appMeta(appId || icon) && openApp(appId || icon)))(); };
    t.classList.add('show'); ZX.chime();
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3800);
    lockFeed.unshift({ icon: ic, title, text, t: Date.now() }); lockFeed.length = Math.min(lockFeed.length, 5);
    if (!layers.lock.hidden) showLock();
    if (!layers.home.hidden) renderHome();
    if (isNui && document.body.classList.contains('closed')) post('peek', { title, text });
  }
  function island(text) {
    $('#islandText').textContent = text;
    $('#island').classList.toggle('active', !!text);
  }

  /* ───────── Scaling ───────── */
  function fit() {
    const M = MODELS[S.model] || MODELS.ultra;
    const s = Math.min(1, (innerHeight - 48) / M.h, (innerWidth - 32) / M.w);
    document.documentElement.style.setProperty('--scale', String(isNui ? Math.min(s, (innerHeight * 0.8) / M.h) : s));
  }
  addEventListener('resize', fit);
  document.addEventListener('click', (e) => {
    const m = e.target.closest('[data-model]'), f = e.target.closest('[data-finish]');
    if (m && m.closest('#stageSwitch')) { S.model = m.dataset.model; S.finish = null; save(); applyModel(); }
    if (f && f.closest('#stageSwitch')) { S.finish = f.dataset.finish; save(); applyModel(); }
  });

  /* ───────── Server push ───────── */
  const pushHandlers = {};
  function onPush(kind, fn) { (pushHandlers[kind] ||= []).push(fn); }
  function dispatchPush(d) {
    (pushHandlers[d.kind] || []).forEach((fn) => { try { fn(d); } catch (e) { console.error(e); } });
    // A generic refresh for whatever app is on screen when its data changed.
    // Only list views refresh live; a compose/detail view keeps what the player is typing.
    if (current && d.app && d.app === current.id && !current.view && !d.silent) renderApp(true);
  }

  /* ───────── Public API for engines ───────── */
  window.ZX = {
    VERSION, isNui, $, $$, esc, uid, pad, rand, pick, clamp, svg, appSvg, I, logo, money, num, hm, ago, initials, ymd,
    get S() { return S; }, set S(v) { S = v; }, save, seed, fresh, post, rpc, notify, island, audio, chime, reduced,
    register, APPS, CATS, appMeta, installed, iconHTML, sparkPath, Market,
    open: openApp, go, back, home: goHome, head: setHead, render: renderApp, live, onPush, localPush: (d) => dispatchPush(d),
    get current() { return current; }, body: appBody, RENDER, engines, layers, contactBy, contactByNumber,
    data(appId) { S.data ||= {}; return (S.data[appId] ||= {}); },
    best(id, score, lower = false) { S.best ||= {}; const b = S.best[id]; if (score !== undefined && (b === undefined || (lower ? score < b : score > b))) { S.best[id] = score; save(); return true; } return false; },
    getBest(id) { return (S.best || {})[id]; },
    applySettings, applyModel, MODELS, DOCK, renderHome, showLock, setPage, chime,
    // Bank helper used by engines that move money (casino, shops, broker in browser mode).
    bankApply(amount, label, note) {
      S.bank.balance = Math.round((S.bank.balance + amount) * 100) / 100;
      S.bank.tx.unshift({ id: uid(), label, note, amount, t: Date.now() }); S.bank.tx = S.bank.tx.slice(0, 200); save();
    },
    toastOnly(title, text) { notify('bell', title, text); },
  };

  /* ───────── FiveM bridge ───────── */
  function openPhone(data = {}) {
    if (data.owner) S.owner = { ...S.owner, ...data.owner };
    // The item used ingame decides the model (phone_ultra / phone_pro / phone); finish stays the player's choice.
    if (data.model && MODELS[data.model] && data.model !== S.model) { S.model = data.model; S.finish = null; applyModel(); }
    if (typeof data.bank === 'number') S.bank.balance = data.bank;
    if (Array.isArray(data.cards) && data.cards.length) S.cards = data.cards;
    if (data.carrier) { S.net ||= {}; S.net.carrier = data.carrier; S.net.paidUntil = data.paidUntil || 0; }
    save();
    document.body.classList.remove('closed');
    if (!booted) boot(); else if (!layers.home.hidden) renderHome();
  }
  function closePhone() {
    document.body.classList.add('closed');
    window.ZX_Call && window.ZX_Call.hangupIfActive();
    post('close');
  }
  window.addEventListener('message', (e) => {
    const d = e.data || {};
    switch (d.action) {
      case 'open': openPhone(d); break;
      case 'close': document.body.classList.add('closed'); break;
      case 'notify': notify(d.app || 'messages', d.title || 'Zurex', d.text || '', null, d.app); break;
      case 'market': Market.ingest(d.list || []); break;
      case 'push': dispatchPush(d); break;
      case 'bank': if (typeof d.balance === 'number') { S.bank.balance = d.balance; save(); if (current?.id === 'bank') renderApp(true); } break;
      default: (pushHandlers['nui:' + d.action] || []).forEach((fn) => fn(d));
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (isNui) closePhone(); else back();
  });

  /* ───────── Start (called by js/main.js once engines + registry are loaded) ───────── */
  ZX.start = async () => {
    applySettings();
    // Prices: FiveM pushes them; the browser seeds them from LocalServer.
    const snap = await rpc('market.snapshot');
    if (snap && snap.list) Market.ingest(snap.list);
    if (!isNui) setInterval(async () => { const r = await rpc('market.tick'); if (r && r.list) Market.ingest(r.list); }, 2000);
    Market.on(() => { if (!layers.home.hidden) { renderMiniWidgets(); } });
    setInterval(() => { if (!layers.home.hidden) renderTicker(); }, 10000);
    if (S.installed) { // apps added in an update appear automatically if they are core
      APPS.filter((a) => a.core && !S.installed.includes(a.id)).forEach((a) => S.installed.push(a.id));
      S.installed = S.installed.filter((id) => byId.has(id));
    }
    installed(); save();
    if (isNui) { document.body.classList.add('nui', 'closed'); post('ready'); }
    else {
      document.body.classList.add('has-stage'); $('#stageApps').textContent = APPS.length; boot();
      // The 3D back view needs three.js; only the browser stage loads it.
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      s.onload = () => { const m = document.createElement('script'); m.src = 'js/model3d.js?v=' + VERSION + '.' + Date.now(); document.body.appendChild(m); };
      document.body.appendChild(s);
    }
  };
})();
