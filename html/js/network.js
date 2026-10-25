/*
 * Network: mobile carriers (contracts, coverage, data) and Wi-Fi hotspots.
 * Defaults live here; config.lua (Config.Network) replaces them ingame.
 * ZX.online() tells apps whether calls/SMS can go out (carrier signal or Wi-Fi, not in airplane mode).
 */
(() => {
  'use strict';
  const { $, $$, esc, svg, money, RENDER, body } = ZX;
  const S = () => ZX.S;
  ZX.I.wifi = '<path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1.2" fill="currentColor"/>';
  ZX.I.antenna = '<path d="M12 10v11M8 21h8M5 5a10 10 0 0 0 0 10M19 5a10 10 0 0 1 0 10M8 8a5 5 0 0 0 0 4M16 8a5 5 0 0 1 0 4"/><circle cx="12" cy="10" r="1.5"/>';

  // Coverage: 0..1 strength in the city (y < 1000) and in Blaine County (y >= 1000).
  window.ZX_NETWORK = {
    defaultCarrier: 'zurex',
    numbers: { example: '555-7777', hint: 'Format 555-XXXX. Schnapszahlen und Folgen gelten als VIP.' },
    carriers: [
      { id: 'magentel', name: 'Magentel', short: 'MGTL', color: '#e2007a', price: 49, data: 40, city: 1, county: .8, perks: ['5G+', 'WLAN-Call', 'EU-Roaming'] },
      { id: 'redfone', name: 'Redfone', short: 'RDFN', color: '#ef4444', price: 39, data: 25, city: .95, county: .55, perks: ['5G', 'GigaKombi'] },
      { id: 'bluecell', name: 'Bluecell', short: 'BLUE', color: '#3b82f6', price: 19, data: 10, city: .8, county: .35, perks: ['LTE', 'Prepaid'] },
      { id: 'zurex', name: 'Zurex Mobile', short: 'ZRX', color: '#f472b6', price: 29, data: 60, city: .95, county: .7, perks: ['5G', 'WLAN-Call', 'Unlimited Social'] },
      { id: 'lifeinvader', name: 'Lifeinvader Mobile', short: 'LIFE', color: '#38bdf8', price: 9, data: 5, city: .7, county: .25, perks: ['Werbefinanziert'] },
    ],
    wifi: [
      { ssid: 'BeanMachine_Free', x: -628, y: 239, r: 60 },
      { ssid: 'Bahama-Mamas-VIP', x: -1388, y: -586, r: 70, password: 'mamas2026' },
      { ssid: 'LSIA_Free_WiFi', x: -1037, y: -2738, r: 260 },
      { ssid: 'Pillbox-Guest', x: 298, y: -584, r: 90 },
      { ssid: 'MissionRow-PD', x: 441, y: -982, r: 80, password: 'lspd-intern' },
      { ssid: 'Diamond-Casino', x: 924, y: 46, r: 120 },
      { ssid: 'PinkCage_Motel', x: 326, y: -205, r: 50, password: 'zimmer7' },
      { ssid: 'Legion-Square-Public', x: 195, y: -934, r: 120 },
      { ssid: 'DelPerro-Pier-Free', x: -1850, y: -1230, r: 120 },
      { ssid: 'Sandy-Shores-Airfield', x: 1747, y: 3273, r: 150 },
      { ssid: 'Paleto-Bay-Library', x: -250, y: 6200, r: 80 },
      { ssid: 'Maze-Bank-Tower', x: -75, y: -818, r: 90, password: 'mazebank' },
    ],
  };

  const net = () => window.ZX_NETWORK;
  const st = () => (S().net ||= { carrier: net().defaultCarrier, wifiOn: true, wifi: null, known: {}, usedMB: 0, paidUntil: 0 });
  const carrier = () => net().carriers.find((c) => c.id === st().carrier) || net().carriers[0];
  let pos = { x: 200, y: -800 };
  let signal = 4, wifiLive = null;

  /* Status bar: carrier short name, signal bars, Wi-Fi fan */
  const bar = $('#statusbar .sb-right');
  bar.insertAdjacentHTML('afterbegin', `<svg class="sb-wifi" id="sbWifi" viewBox="0 0 24 24" hidden>${ZX.I.wifi}</svg>`);
  function paintStatus() {
    const c = carrier(), s = st();
    $('#sbCarrier').textContent = S().airplane ? '' : signal > 0 ? c.short : 'Kein Netz';
    $$('#statusbar .sb-signal rect').forEach((r, i) => { r.style.opacity = i < signal ? 1 : .25; });
    const w = $('#sbWifi'); w.hidden = !(s.wifiOn && wifiLive) || S().airplane;
    $('#statusbar .sb-signal').style.display = (s.wifiOn && wifiLive) ? 'none' : '';
  }

  /* Live signal from the player's position (ingame) or a gentle simulation (browser). */
  async function tick() {
    const w = await ZX.world();
    if (w && w.pos) pos = w.pos;
    const c = carrier(), county = pos.y >= 1000;
    const cover = county ? c.county : c.city;
    // Inside buildings / tunnels is not known; vary a little so the bars feel alive.
    const jitter = ((Math.sin(Date.now() / 9000 + pos.x / 300) + 1) / 2) * .25;
    const unpaid = ZX.isNui && st().paidUntil && st().paidUntil < Date.now();
    signal = S().airplane || unpaid ? 0 : Math.max(0, Math.min(4, Math.round((cover - jitter + .15) * 4)));
    const s = st();
    if (s.wifiOn && s.wifi) { const h = net().wifi.find((x) => x.ssid === s.wifi); wifiLive = h && Math.hypot(h.x - pos.x, h.y - pos.y) <= h.r ? h : null; if (!wifiLive) s.wifi = autoJoin(); } else wifiLive = null;
    if (s.wifiOn && !s.wifi) { const j = autoJoin(); if (j) { s.wifi = j; wifiLive = net().wifi.find((x) => x.ssid === j); ZX.notify('settings', 'WLAN verbunden', j); } }
    if (!wifiLive && signal > 0 && document.visibilityState === 'visible') s.usedMB += .4; // background data use
    ZX.save(); paintStatus();
  }
  // Rejoin known networks in range automatically.
  function autoJoin() { const s = st(); const h = nearby().find((n) => n.inRange && (!n.password || s.known[n.ssid])); return h ? h.ssid : null; }
  function nearby() { return net().wifi.map((h) => ({ ...h, d: Math.hypot(h.x - pos.x, h.y - pos.y) })).map((h) => ({ ...h, inRange: h.d <= h.r, bars: Math.max(1, Math.min(3, Math.round(3 - h.d / h.r * 2))) })).sort((a, b) => a.d - b.d); }
  setInterval(tick, 5000); setTimeout(tick, 800);

  ZX.online = () => !S().airplane && (signal > 0 || (st().wifiOn && !!wifiLive));
  ZX.onWifi = () => !!(st().wifiOn && wifiLive);
  ZX.network = { carrier, paintStatus, tick };

  /* Settings pages: WLAN + Mobilfunk (hooked into the settings app) */
  const baseSettings = RENDER.settings;
  RENDER.settings = (view, arg, isLive) => {
    if (view === 'wifi') return wifiView(isLive);
    if (view === 'mobile') return mobileView();
    baseSettings(view, arg, isLive);
    if (!view) {
      // Add the two network rows at the top of the main list.
      const grp = body.querySelector('.group');
      grp && grp.insertAdjacentHTML('afterend', `<div class="group" style="margin-top:12px"><button class="row set-row" data-go="wifi"><span class="set-row-ico" style="--c:#3b82f6">${svg('wifi')}</span><span class="grow t">WLAN</span><span class="set-val">${esc(st().wifiOn ? (wifiLive ? wifiLive.ssid : 'Nicht verbunden') : 'Aus')}</span><span class="meta">›</span></button>
        <button class="row set-row" data-go="mobile"><span class="set-row-ico" style="--c:${carrier().color}">${svg('antenna')}</span><span class="grow t">Mobilfunk</span><span class="set-val">${esc(carrier().name)}</span><span class="meta">›</span></button></div>`);
    }
  };

  function wifiView(isLive) {
    const s = st();
    ZX.head('WLAN', 'Einstellungen');
    const list = nearby();
    body.innerHTML = `<div class="group"><div class="row"><span class="grow t">WLAN</span><button class="switch ${s.wifiOn ? 'on' : ''}" id="wfToggle" role="switch" aria-checked="${s.wifiOn}"></button></div>
        ${s.wifiOn && wifiLive ? `<div class="row"><span class="set-row-ico" style="--c:#3b82f6">${svg('wifi')}</span><span class="grow"><span class="t">${esc(wifiLive.ssid)}</span><span class="s">Verbunden${wifiLive.password ? ' · gesichert' : ''}</span></span><button class="chip" id="wfForget">Trennen</button></div>` : ''}</div>
      ${s.wifiOn ? `<p class="tag set-h">Netzwerke in der Nähe</p><div class="group">${list.filter((n) => n.inRange).map((n) => `<button class="row set-row" data-ssid="${esc(n.ssid)}"><span class="wifi-bars b${n.bars}">${svg('wifi')}</span><span class="grow"><span class="t">${esc(n.ssid)}</span><span class="s">${n.password ? '🔒 Passwort' : 'Offen'}${s.known[n.ssid] ? ' · bekannt' : ''}</span></span>${wifiLive && wifiLive.ssid === n.ssid ? '<span class="chip on">verbunden</span>' : ''}</button>`).join('') || '<p class="empty" style="padding:16px">Keine Netzwerke in Reichweite.</p>'}</div>
        <p class="tag set-h">Weiter entfernt</p><div class="group">${list.filter((n) => !n.inRange).slice(0, 5).map((n) => `<div class="row"><span class="wifi-bars b0">${svg('wifi')}</span><span class="grow"><span class="t">${esc(n.ssid)}</span><span class="s">${Math.round(n.d)} m entfernt</span></span><button class="chip" data-route="${n.x},${n.y},${esc(n.ssid)}">Route</button></div>`).join('')}</div>` : ''}
      <form id="wfPw" hidden><label class="lbl" id="wfLbl"></label><input class="field" id="wfPass" type="password" autocomplete="off" /><p class="err" id="wfErr"></p><button class="btn">Verbinden</button></form>`;
    $('#wfToggle').onclick = () => { s.wifiOn = !s.wifiOn; if (!s.wifiOn) s.wifi = null; ZX.save(); tick().then(() => ZX.render(true)); };
    $('#wfForget') && ($('#wfForget').onclick = () => { s.wifi = null; wifiLive = null; delete s.known[(wifiLive || {}).ssid]; ZX.save(); paintStatus(); ZX.render(true); });
    let pick = null;
    body.onclick = (e) => {
      const r = e.target.closest('[data-route]'); if (r) { const [x, y, n] = r.dataset.route.split(','); return ZX.waypoint(+x, +y, n); }
      const b = e.target.closest('[data-ssid]'); if (!b) return;
      pick = net().wifi.find((h) => h.ssid === b.dataset.ssid);
      if (!pick.password || s.known[pick.ssid]) return connect(pick);
      $('#wfPw').hidden = false; $('#wfLbl').textContent = `Passwort für „${pick.ssid}“`; $('#wfPass').focus();
    };
    $('#wfPw').onsubmit = (e) => { e.preventDefault(); if ($('#wfPass').value !== pick.password) return void ($('#wfErr').textContent = 'Falsches Passwort.'); s.known[pick.ssid] = true; connect(pick); };
    function connect(h) { s.wifi = h.ssid; wifiLive = h; ZX.save(); paintStatus(); ZX.notify('settings', 'WLAN verbunden', h.ssid); ZX.render(true); }
    void isLive;
  }

  function mobileView() {
    const s = st(), c = carrier();
    ZX.head('Mobilfunk', 'Einstellungen');
    const gb = (s.usedMB / 1024);
    const paid = s.paidUntil > Date.now();
    body.innerHTML = `<div class="carrier-card" style="--c:${c.color}"><span class="tag">Dein Anbieter</span><b>${esc(c.name)}</b><div class="carrier-sig">${[1, 2, 3, 4].map((i) => `<i class="${i <= signal ? 'on' : ''}"></i>`).join('')}<span>${signal ? (signal >= 3 ? '5G' : 'LTE') : 'Kein Netz'}</span></div>
        <div class="bar"><i style="width:${Math.min(100, gb / c.data * 100)}%"></i></div><p class="s">${gb.toFixed(2).replace('.', ',')} GB von ${c.data} GB genutzt</p>
        <p class="s">${ZX.isNui ? (paid ? 'Bezahlt bis ' + new Date(s.paidUntil).toLocaleDateString('de-DE') : 'Vertrag nicht bezahlt') : money(c.price) + ' / Monat'}</p></div>
      <div class="group">${'' /* toggles */}<div class="row"><span class="grow"><span class="t">Mobile Daten</span><span class="s">Für Social Apps ohne WLAN</span></span><button class="switch ${s.dataOff ? '' : 'on'}" id="mdToggle"></button></div><div class="row"><span class="grow"><span class="t">WLAN-Anrufe</span><span class="s">${c.perks.includes('WLAN-Call') ? 'Im Tarif enthalten' : 'Nicht im Tarif'}</span></span></div></div>
      <p class="tag set-h">Wunschnummer</p><div class="group number-box"><div class="row"><span class="grow"><span class="t">Deine Nummer</span><span class="s">${esc(S().owner.number)}</span></span></div>
        <form class="ev-add two" id="numF" style="margin:8px 0 4px"><input class="field num" id="numIn" placeholder="${esc((net().numbers || {}).example || '555-7777')}" maxlength="16" autocomplete="off" /><button class="send" aria-label="Prüfen">${svg('search')}</button></form>
        <p class="s num-hint" id="numHint">${esc((net().numbers || {}).hint || 'Format 555-XXXX. Schnapszahlen gelten als VIP.')}</p><div id="numRes"></div></div>
      <p class="tag set-h">Tarife</p>${net().carriers.map((x) => `<div class="plan ${x.id === c.id ? 'on' : ''}" style="--c:${x.color}"><div class="plan-top"><b>${esc(x.name)}</b><span class="plan-price">${money(x.price)}<small>/Monat</small></span></div>
        <div class="plan-meta"><span>${x.data} GB</span><span>Stadt ${Math.round(x.city * 100)} %</span><span>Land ${Math.round(x.county * 100)} %</span></div><div class="chips">${x.perks.map((p) => `<span class="chip">${esc(p)}</span>`).join('')}</div>
        ${x.id === c.id ? '<span class="chip on">Aktueller Tarif</span>' : `<button class="btn ghost" data-switch="${x.id}">Wechseln</button>`}</div>`).join('')}<p class="err" id="mbErr"></p>`;
    $('#mdToggle').onclick = (e) => { s.dataOff = !s.dataOff; e.currentTarget.classList.toggle('on', !s.dataOff); ZX.save(); };
    $('#numF').onsubmit = async (e) => {
      e.preventDefault();
      const want = $('#numIn').value.trim();
      const r = await ZX.rpc('number.check', { number: want });
      if (!r || !r.ok) { $('#numRes').innerHTML = `<p class="err">${esc((r && r.error) || 'Nicht verfügbar.')}</p>`; return; }
      $('#numRes').innerHTML = `<div class="num-offer ${r.vip ? 'vip' : ''}"><div><b>${esc(r.number)}</b><span class="s">${r.vip ? '★ VIP-Nummer' : 'Verfügbar'}</span></div><button class="btn" id="numBuy">${money(r.price)} · Kaufen</button></div>`;
      $('#numBuy').onclick = async () => {
        const b = await ZX.rpc('number.buy', { number: r.number });
        if (!b || !b.ok) { $('#numRes').insertAdjacentHTML('beforeend', `<p class="err">${esc((b && b.error) || 'Kauf fehlgeschlagen.')}</p>`); return; }
        if (!ZX.isNui) ZX.bankApply(-r.price, 'Zurex Nummernservice', 'Wunschnummer ' + r.number);
        else if (typeof b.balance === 'number') ZX.S.bank.balance = b.balance;
        S().owner.number = r.number; ZX.save();
        ZX.notify('settings', 'Neue Nummer aktiv', r.number); ZX.render(true);
      };
    };
    body.onclick = async (e) => {
      const b = e.target.closest('[data-switch]'); if (!b) return;
      const r = await ZX.rpc('carrier.subscribe', { carrier: b.dataset.switch });
      if (!r || !r.ok) return void ($('#mbErr').textContent = (r && r.error) || 'Wechsel fehlgeschlagen.');
      s.carrier = b.dataset.switch; s.usedMB = 0; s.paidUntil = r.paidUntil || Date.now() + 30 * 864e5;
      if (!ZX.isNui) ZX.bankApply(-carrier().price, carrier().name, 'Mobilfunkvertrag');
      ZX.save(); await tick(); ZX.notify('settings', 'Tarif gewechselt', `Willkommen bei ${carrier().name}!`); ZX.render(true);
    };
  }
  paintStatus();
})();
