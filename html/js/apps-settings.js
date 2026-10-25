/* Settings (profile + avatar, lock/PIN, display, home, sounds, privacy, device) and the pro camera. */
(() => {
  'use strict';
  const { $, $$, esc, svg, initials, RENDER, body } = ZX;
  const S = () => ZX.S;
  const head = (...a) => ZX.head(...a);
  const ui = () => (S().ui ||= {});

  /* ───────── Apply UI preferences to the document ───────── */
  const DS = { icons: 'icons', labels: 'labels', dense: 'dense', ticker: 'ticker', widgets: 'widgets', privacy: 'privacy', clock: 'clock', nightshift: 'nightshift', text: 'text', bold: 'bold' };
  ZX.applyUi = () => {
    const r = document.documentElement, u = ui();
    for (const [k, attr] of Object.entries(DS)) { const v = u[k]; if (v === undefined || v === null || v === '') delete r.dataset[attr]; else r.dataset[attr] = typeof v === 'boolean' ? (v ? '1' : '0') : v; }
    const wall = $('#screen .wall');
    if (S().wall === 'photo' && u.wallPhoto) { wall.style.background = 'none'; wall.innerHTML = `<div class="wall-photo">${ZX.photoHTML(u.wallPhoto)}</div><div class="wall-shade"></div>`; }
    else if (!wall.querySelector('.wall-floor')) { wall.removeAttribute('style'); wall.innerHTML = '<div class="wall-floor"></div>'; }
  };
  const baseApply = ZX.applySettings;
  ZX.applySettings = () => { baseApply(); ZX.applyUi(); };
  ZX.applyUi();

  /* ───────── Avatar helper used by every app ───────── */
  ZX.avatarHTML = (a, cls = '') => {
    const h = [...String((a && a.handle) || '')].reduce((x, c) => (x * 31 + c.charCodeAt(0)) % 360, 7);
    return `<span class="avatar ${cls}" style="--h:${h}">${a && a.avatar ? ZX.photoHTML(a.avatar) : esc(initials((a && a.name) || '?'))}</span>`;
  };

  /* ───────── Ringtones (synth) ───────── */
  const TONES = {
    zurex: [[880, 0], [1318, .09]], glass: [[1568, 0], [2093, .12]], pulse: [[660, 0], [660, .15], [990, .3]],
    retro: [[523, 0], [659, .08], [784, .16], [1046, .24]], soft: [[440, 0], [554, .2]], neon: [[1200, 0], [900, .08], [1500, .16]],
  };
  ZX.playTone = (name, vol = .07) => { const ac = ZX.audio(); if (!ac) return; const t = ac.currentTime; (TONES[name] || TONES.zurex).forEach(([f, d]) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = name === 'retro' ? 'square' : 'sine'; o.frequency.value = f; o.connect(g); g.connect(ac.destination); g.gain.setValueAtTime(0, t + d); g.gain.linearRampToValueAtTime(vol, t + d + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d + .35); o.start(t + d); o.stop(t + d + .4); }); };
  ZX.chime = () => { if (!S().sound || S().dnd) return; ZX.playTone(ui().notifTone || 'zurex'); };

  /* ───────── PIN lock ───────── */
  // Wraps unlock: with a PIN set, swiping up shows the keypad first.
  // Face ID first (if enabled), the 4-digit code as fallback.
  const faceGate = (done, fallback) => {
    const ov = document.createElement('div'); ov.className = 'face-id';
    ov.innerHTML = `<div class="fid-frame"><svg viewBox="0 0 100 100" class="fid-face"><path d="M18 30V20a6 6 0 0 1 6-6h10M66 14h10a6 6 0 0 1 6 6v10M82 70v10a6 6 0 0 1-6 6H66M34 86H24a6 6 0 0 1-6-6V70"/><g class="fid-feat"><path d="M38 38v6M62 38v6M50 40v14l-4 2M40 66c6 5 14 5 20 0"/></g></svg><span class="fid-scan"></span></div><b class="fid-label">Zurex Face ID</b><button class="pin-cancel" data-code>Code verwenden</button>`;
    $('#screen').appendChild(ov);
    let cancelled = false;
    ov.querySelector('[data-code]').onclick = () => { cancelled = true; ov.remove(); fallback(); };
    ZX.playTone('soft', .03);
    setTimeout(() => { if (cancelled) return; ov.classList.add('ok'); ov.querySelector('.fid-label').textContent = 'Erkannt'; ZX.playTone('glass', .05); setTimeout(() => { ov.remove(); done(); }, 420); }, 1100);
  };
  // Used for unlock and for confirming payments.
  const pinGate = (done, opts = {}) => {
    if (ui().faceId && ui().pin) return faceGate(done, () => codeGate(done));
    if (opts.require && !ui().pin) return done();
    return codeGate(done);
  };
  const codeGate = (done) => {
    if (!ui().pin) return done();
    const pad = document.createElement('div'); pad.className = 'pin-pad';
    let entry = '';
    const draw = (err) => { pad.innerHTML = `${ZX.avatarHTML({ name: S().owner.name, handle: S().owner.handle, avatar: S().owner.avatar }, 'xl')}<b class="pin-title">Code eingeben</b><div class="pin-dots ${err ? 'err' : ''}">${[0, 1, 2, 3].map((i) => `<i class="${i < entry.length ? 'on' : ''}"></i>`).join('')}</div>
      <div class="pin-keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((k) => `<button data-k="${k}" class="${k === '⌫' ? 'txt' : ''}">${k}</button>`).join('')}</div><button class="pin-cancel" data-x>Abbrechen</button>`; };
    draw();
    $('#screen').appendChild(pad);
    pad.onclick = (e) => {
      if (e.target.closest('[data-x]')) return pad.remove();
      const k = e.target.closest('[data-k]')?.dataset.k; if (k === undefined || k === '') return;
      if (k === '⌫') entry = entry.slice(0, -1); else if (entry.length < 4) entry += k;
      draw();
      if (entry.length === 4) { if (entry === ui().pin) { pad.remove(); done(); } else { entry = ''; draw(true); ZX.playTone('soft', .05); } }
    };
  };
  ZX.pinGate = pinGate;

  /* ───────── Settings ───────── */
  const ACCENTS = [['pink', '#f472b6', 'Signal Pink'], ['cyan', '#5eead4', 'Türkis'], ['violet', '#c4b5fd', 'Violett'], ['amber', '#fbbf24', 'Amber']];
  const WALLS = [['grid', 'Grid'], ['glow', 'Glow'], ['aurora', 'Aurora'], ['zebra', 'Zebra'], ['plain', 'Schwarz'], ['photo', 'Eigenes Foto']];
  const row = (ico, color, title, val, go) => `<button class="row set-row" data-go="${go}"><span class="set-row-ico" style="--c:${color}">${svg(ico)}</span><span class="grow t">${title}</span><span class="set-val">${esc(val || '')}</span><span class="meta">›</span></button>`;
  const sw = (key, title, sub, store = 'ui') => { const v = store === 'ui' ? ui()[key] : S()[key]; return `<div class="row"><span class="grow"><span class="t">${title}</span>${sub ? `<span class="s">${sub}</span>` : ''}</span><button class="switch ${v ? 'on' : ''}" data-sw="${key}" data-store="${store}" role="switch" aria-checked="${!!v}" aria-label="${title}"></button></div>`; };
  const opts = (key, list, cur) => `<div class="opt-row">${list.map(([v, n]) => `<button class="${cur === v ? 'on' : ''}" data-opt="${key}" data-v="${v}">${n}</button>`).join('')}</div>`;

  RENDER.settings = (view) => {
    const M = ZX.MODELS, u = ui();
    if (view === 'profile') {
      head('Profil', 'Einstellungen', '<button type="button" id="pfSave">Sichern</button>');
      body.innerHTML = `<div class="profile">${ZX.avatarHTML({ name: S().owner.name, handle: S().owner.handle, avatar: S().owner.avatar }, 'xl')}<div class="chips" style="justify-content:center"><button class="chip on" id="pfPic">Foto wählen</button>${S().owner.avatar ? '<button class="chip" id="pfDel">Entfernen</button>' : ''}</div></div>
        <label class="lbl">Anzeigename</label><input class="field" id="pfName" maxlength="32" value="${esc(S().owner.name)}" />
        <label class="lbl">Benutzername (Social Apps)</label><input class="field" id="pfHandle" maxlength="20" value="${esc(S().owner.handle || '')}" />
        <label class="lbl">Bio</label><textarea class="field" id="pfBio" rows="3" maxlength="140">${esc(S().owner.bio || '')}</textarea>
        <p class="s" style="margin:10px 4px;color:var(--paper-3)">Nummer: ${esc(S().owner.number)}</p><p class="err" id="pfErr"></p>`;
      $('#pfPic').onclick = async () => { const p = await ZX.pickPhoto(); if (p) { S().owner.avatar = p; ZX.save(); ZX.render(); } };
      $('#pfDel') && ($('#pfDel').onclick = () => { delete S().owner.avatar; ZX.save(); ZX.render(); });
      $('#pfSave').onclick = () => {
        const h = $('#pfHandle').value.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
        if (h.length < 3) return void ($('#pfErr').textContent = 'Benutzername: mindestens 3 Zeichen (a–z, 0–9, _ und .)');
        Object.assign(S().owner, { name: $('#pfName').value.trim() || S().owner.name, handle: h, bio: $('#pfBio').value.trim() }); ZX.save();
        ZX.rpc('profile.set', { handle: h, name: S().owner.name, avatar: S().owner.avatar || null, bio: S().owner.bio });
        ZX.notify('settings', 'Profil gespeichert', '@' + h); ZX.back();
      };
      return;
    }
    if (view === 'display') {
      head('Anzeige', 'Einstellungen');
      body.innerHTML = `<p class="tag set-h">Akzentfarbe</p><div class="group"><div class="row"><div class="swatches">${ACCENTS.map(([k, c, n]) => `<button class="swatch ${S().accent === k ? 'on' : ''}" data-acc="${k}" style="background:${c}" aria-label="${n}"></button>`).join('')}</div></div></div>
        <p class="tag set-h">Hintergrund</p><div class="group"><div class="walls">${WALLS.map(([k, n]) => `<button data-wall="${k}" class="${S().wall === k ? 'on' : ''} w-${k}">${k === 'photo' && u.wallPhoto ? ZX.photoHTML(u.wallPhoto) : ''}<span>${n}</span></button>`).join('')}</div></div>
        <p class="tag set-h">Sperrbildschirm-Uhr</p><div class="group"><div class="row">${opts('clock', [['', 'Chrom'], ['signal', 'Neon'], ['outline', 'Kontur'], ['thin', 'Dünn']], u.clock || '')}</div></div>
        <p class="tag set-h">Text</p><div class="group"><div class="row">${opts('text', [['', 'Standard'], ['large', 'Groß']], u.text || '')}</div>${sw('bold', 'Fetter Text')}</div>
        <p class="tag set-h">Komfort</p><div class="group"><div class="row"><span class="grow"><span class="t">Helligkeit</span><input class="range" id="bright" type="range" min="20" max="100" value="${S().brightness}" /></span></div>${sw('nightshift', 'Night Shift', 'Wärmere Farben am Abend')}</div>`;
      $('#bright').oninput = (e) => { S().brightness = +e.target.value; ZX.applySettings(); ZX.save(); };
      return;
    }
    if (view === 'home') {
      head('Home & Icons', 'Einstellungen');
      body.innerHTML = `<p class="tag set-h">Icon-Stil</p><div class="group"><div class="row">${opts('icons', [['', 'Juwel'], ['color', 'Farbig'], ['tinted', 'Getönt'], ['mono', 'Mono'], ['glass', 'Glas']], u.icons || '')}</div></div>
        <div class="group" style="margin-top:12px">${sw('labelsOff', 'App-Namen ausblenden')}${sw('dense', 'Kompaktes Raster', '5 Apps pro Reihe')}${sw('widgetsOff', 'Widgets ausblenden')}${sw('tickerOff', 'Börsenticker ausblenden')}</div>
        <p class="tag set-h">Dock</p><div class="group">${[0, 1, 2, 3].map((i) => `<div class="row"><span class="grow t">Platz ${i + 1}</span><select class="field dock-sel" data-dock="${i}" style="width:170px;height:38px">${ZX.installed().map((a) => `<option value="${a.id}" ${(u.dock || ZX.DOCK)[i] === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></div>`).join('')}</div>`;
      $$('.dock-sel').forEach((s) => { s.onchange = () => { u.dock = $$('.dock-sel').map((x) => x.value); ZX.save(); }; });
      return;
    }
    if (view === 'sounds') {
      head('Töne', 'Einstellungen');
      const tones = Object.keys(TONES).map((k) => [k, k[0].toUpperCase() + k.slice(1)]);
      body.innerHTML = `<div class="group">${sw('sound', 'Töne an', '', 'root')}${sw('dnd', 'Nicht stören', 'Banner und Töne stumm', 'root')}</div>
        <p class="tag set-h">Benachrichtigung</p><div class="group"><div class="row">${opts('notifTone', tones, u.notifTone || 'zurex')}</div></div>
        <p class="tag set-h">Klingelton</p><div class="group"><div class="row">${opts('ringTone', tones, u.ringTone || 'pulse')}</div></div>`;
      return;
    }
    if (view === 'lock') {
      head('Sperre & Code', 'Einstellungen');
      body.innerHTML = `<div class="group"><div class="row"><span class="grow"><span class="t">Code-Sperre</span><span class="s">${u.pin ? 'Aktiv · 4-stelliger Code' : 'Aus'}</span></span><button class="chip ${u.pin ? '' : 'on'}" id="pinSet">${u.pin ? 'Ändern' : 'Code festlegen'}</button></div>${u.pin ? '<div class="row"><span class="grow t">Code entfernen</span><button class="chip" id="pinOff">Aus</button></div>' : ''}</div>
        ${u.pin ? `<div class="group" style="margin-top:12px">${sw('faceId', 'Face ID', 'Entsperren und Bezahlen per Gesichtsscan, Code als Rückfall')}</div>` : '<p class="s" style="margin:10px 6px;color:var(--paper-3);font-size:12px">Lege zuerst einen Code fest, um Face ID zu nutzen.</p>'}
        <div class="group" style="margin-top:12px">${sw('privacy', 'Privatsphäre-Modus', 'Kontostand und Depotwert verschwommen')}${sw('lockNotes', 'Nachrichteninhalt im Sperrbildschirm verbergen')}</div>
        <form id="pinForm" hidden><label class="lbl">Neuer 4-stelliger Code</label><input class="field num" id="pinNew" inputmode="numeric" maxlength="4" autocomplete="off" /><p class="err" id="pinErr"></p><button class="btn">Speichern</button></form>`;
      $('#pinSet').onclick = () => { $('#pinForm').hidden = false; $('#pinNew').focus(); };
      $('#pinOff') && ($('#pinOff').onclick = () => { delete u.pin; ZX.save(); ZX.render(); });
      $('#pinForm').onsubmit = (e) => { e.preventDefault(); const v = $('#pinNew').value; if (!/^\d{4}$/.test(v)) return void ($('#pinErr').textContent = 'Genau 4 Ziffern.'); u.pin = v; ZX.save(); ZX.notify('settings', 'Code aktiv', 'Dein Zurex ist jetzt geschützt.'); ZX.render(); };
      return;
    }
    if (view === 'device') {
      head('Gerät', 'Einstellungen');
      body.innerHTML = `<div class="group"><div class="model-cards">${Object.entries(M).map(([k, m]) => `<button data-model-set="${k}" class="${S().model === k ? 'on' : ''}"><span class="mc-shape ${k}"></span><b>${m.short}</b><small>${m.inch}</small></button>`).join('')}</div>
        <div class="row"><span class="grow"><span class="t">Farbe</span><span class="s">${M[S().model].finishes[S().finish][0]}</span></span><div class="swatches">${Object.entries(M[S().model].finishes).map(([k, [n, c]]) => `<button class="swatch ${S().finish === k ? 'on' : ''}" data-finish-set="${k}" style="background:${c}" aria-label="${n}"></button>`).join('')}</div></div>
        ${ZX.isNui ? '<p class="s" style="padding:0 0 12px;color:var(--paper-3);font-size:12px">Ingame bestimmt dein Handy-Item das Modell.</p>' : ''}</div>
        <div class="group" style="margin-top:12px">${sw('airplane', 'Flugmodus', 'Kein Netz, keine Anrufe', 'root')}</div>
        <p class="tag set-h">Info</p><div class="group"><div class="row"><span class="grow t">Modell</span><span class="meta">${M[S().model].name}</span></div><div class="row"><span class="grow t">Software</span><span class="meta">ZurexOS ${ZX.VERSION}</span></div><div class="row"><span class="grow t">Apps</span><span class="meta">${ZX.installed().length} / ${ZX.APPS.length}</span></div><div class="row"><span class="grow t">Fotos</span><span class="meta">${(S().photos || []).length}</span></div><div class="row"><span class="grow t">Speicher</span><span class="meta">${(JSON.stringify(S()).length / 1024).toFixed(0)} KB</span></div></div>
        <button class="btn warn" id="reset" type="button">Auf Werkszustand zurücksetzen</button>`;
      return;
    }
    head('Einstellungen');
    body.innerHTML = `<button class="panel me-card" data-go="profile">${ZX.avatarHTML({ name: S().owner.name, handle: S().owner.handle, avatar: S().owner.avatar }, '')}<span class="grow"><span class="t">${esc(S().owner.name)}</span><br><span class="s">@${esc(S().owner.handle || '')} · ${esc(S().owner.number)}</span></span><span class="meta">›</span></button>
      <div class="group">${sw('airplane', 'Flugmodus', '', 'root')}${sw('dnd', 'Nicht stören', '', 'root')}</div>
      <div class="group" style="margin-top:12px">${row('sun', '#f472b6', 'Anzeige', ACCENTS.find((a) => a[0] === S().accent)[2], 'display')}${row('grid', '#60a5fa', 'Home & Icons', ({ '': 'Juwel', color: 'Farbig', tinted: 'Getönt', mono: 'Mono', glass: 'Glas' })[u.icons || ''], 'home')}${row('speaker', '#fb7185', 'Töne', u.notifTone || 'zurex', 'sounds')}${row('lock', '#86efac', 'Sperre & Code', u.pin ? (u.faceId ? 'Face ID' : 'Code') : 'Aus', 'lock')}${row('phone', '#a8a29e', 'Gerät', M[S().model].short, 'device')}</div>
      <div class="group" style="margin-top:12px">${row('store', '#c4b5fd', 'Zurex Store', ZX.APPS.length + ' Apps', 'store')}${row('book', '#fbbf24', 'Hilfe & FAQ', '', 'faq')}</div>
      <div class="about">${ZX.logo()}<p>Zurex · Track / Talk / Trade / Play</p></div>`;
  };
  // One delegated handler for every settings view.
  body.addEventListener('click', (e) => {
    if (!ZX.current || ZX.current.id !== 'settings') return;
    const u = ui();
    const go = e.target.closest('[data-go]'); if (go) { const v = go.dataset.go; if (v === 'store' || v === 'faq') return ZX.open(v); return ZX.go(v); }
    const s = e.target.closest('[data-sw]');
    if (s) {
      const k = s.dataset.sw, root = s.dataset.store === 'root';
      const obj = root ? S() : u; obj[k] = !obj[k];
      // "...Off" switches map onto the dataset flags the CSS reads.
      if (k === 'labelsOff') u.labels = u.labelsOff ? '0' : null;
      if (k === 'widgetsOff') u.widgets = u.widgetsOff ? '0' : null;
      if (k === 'tickerOff') u.ticker = u.tickerOff ? '0' : null;
      if (k === 'dense') u.dense = u.dense ? '1' : null;
      s.classList.toggle('on', !!obj[k]); s.setAttribute('aria-checked', !!obj[k]);
    }
    const o = e.target.closest('[data-opt]');
    if (o) { u[o.dataset.opt] = o.dataset.v || null; $$(`[data-opt="${o.dataset.opt}"]`).forEach((x) => x.classList.toggle('on', x === o)); if (o.dataset.opt === 'notifTone' || o.dataset.opt === 'ringTone') ZX.playTone(o.dataset.v); }
    const a = e.target.closest('[data-acc]'); if (a) { S().accent = a.dataset.acc; S().accentSet = true; $$('[data-acc]').forEach((x) => x.classList.toggle('on', x === a)); }
    const w = e.target.closest('[data-wall]');
    if (w) {
      if (w.dataset.wall === 'photo') { ZX.pickPhoto().then((p) => { if (!p) return; u.wallPhoto = p; S().wall = 'photo'; S().wallSet = true; ZX.save(); ZX.applySettings(); ZX.render(true); }); return; }
      S().wall = w.dataset.wall; S().wallSet = true; $$('[data-wall]').forEach((x) => x.classList.toggle('on', x === w));
    }
    const m = e.target.closest('[data-model-set]'); if (m) { S().model = m.dataset.modelSet; S().finish = null; }
    const f = e.target.closest('[data-finish-set]'); if (f) S().finish = f.dataset.finishSet;
    if (e.target.closest('#reset')) {
      const btn = e.target.closest('#reset');
      if (btn.dataset.armed) { const owner = S().owner, model = S().model; ZX.S = ZX.fresh(); ZX.S.owner = owner; ZX.S.model = model; ZX.S.installed = null; ZX.installed(); ZX.save(); ZX.applySettings(); ZX.home(); ZX.notify('settings', 'Zurückgesetzt', 'Alle Daten wurden auf den Auslieferungszustand gesetzt.'); return; }
      btn.dataset.armed = '1'; btn.textContent = 'Nochmal tippen zum Bestätigen';
      setTimeout(() => { if (btn.isConnected) { delete btn.dataset.armed; btn.textContent = 'Auf Werkszustand zurücksetzen'; } }, 3000);
    }
    if (s || o || a || w || m || f) { ZX.save(); ZX.applySettings(); if (m || f || (w && w.dataset.wall !== 'photo')) ZX.render(true); }
  });

  /* ───────── Pro camera ───────── */
  const FILTERS = [['', 'Original'], ['vivid', 'Lebendig'], ['warm', 'Warm'], ['cool', 'Kühl'], ['pink', 'Zurex'], ['mono', 'Mono'], ['fade', 'Fade']];
  const MODES = [['photo', 'Foto'], ['portrait', 'Porträt'], ['night', 'Nacht'], ['selfie', 'Selfie'], ['square', 'Quadrat'], ['pano', 'Pano']];
  RENDER.camera = () => {
    const st = ZX.data('camera'); st.filter ??= ''; st.scene ??= 'city'; st.mode ??= 'photo'; st.zoom ??= 1; st.flash ??= 'auto'; st.timer ??= 0; st.grid ??= false; st.exp ??= 0;
    head('Kamera', ZX.isNui ? 'Live' : MODES.find((m) => m[0] === st.mode)[1]);
    body.classList.add('flex');
    let seed = Math.floor(Math.random() * 1e9), busy = false;
    const scene = () => st.mode === 'portrait' || st.mode === 'selfie' ? 'portrait' : st.mode === 'night' ? 'night' : st.scene;
    const zooms = st.mode === 'selfie' ? [1] : [.5, 1, 2, 5];
    body.innerHTML = `<div class="cam"><div class="viewfinder vf-${st.mode} ${st.mode === 'square' ? 'r11' : st.mode === 'pano' ? 'r169' : ''}" id="vf" style="--zoom:${st.zoom}; filter:brightness(${1 + st.exp / 10})">${ZX.art(seed, scene(), st.filter)}
        ${st.grid ? '<div class="vf-grid"></div>' : ''}<span class="vf-badge">${ZX.isNui ? 'LIVE' : st.mode === 'night' ? '🌙 3 s' : scene().toUpperCase()}</span>
        <div class="vf-top"><button id="cFlash" class="${st.flash === 'on' ? 'on' : ''}" title="Blitz">${svg('bolt')}</button><button id="cTimer" class="${st.timer ? 'on' : ''}">${st.timer ? st.timer + 's' : svg('timer')}</button><button id="cGrid" class="${st.grid ? 'on' : ''}">${svg('grid')}</button></div>
        <div class="zoom-row">${zooms.map((z) => `<button data-z="${z}" class="${st.zoom === z ? 'on' : ''}">${z < 1 ? '.5' : z}${st.zoom === z ? '×' : ''}</button>`).join('')}</div></div>
      <div class="cam-controls"><div class="cam-adjust"><span>☀</span><input type="range" class="range" min="-5" max="5" value="${st.exp}" id="cExp" /><span>${st.exp > 0 ? '+' : ''}${st.exp}</span></div>
        ${ZX.isNui ? '' : `<div class="chips" id="camScenes">${ZX.SCENES.filter((s) => s !== 'portrait').map((s) => `<button class="chip ${s === st.scene ? 'on' : ''}" data-scene="${s}">${s}</button>`).join('')}</div>`}
        <div class="chips" id="camFilters">${FILTERS.map(([k, n]) => `<button class="chip ${k === st.filter ? 'on' : ''}" data-filter="${k}">${n}</button>`).join('')}</div>
        <div class="cam-modes" id="camModes">${MODES.map(([k, n]) => `<button data-mode="${k}" class="${st.mode === k ? 'on' : ''}">${n}</button>`).join('')}</div>
        <div class="cam-bar"><button class="cam-last" id="camLast">${S().photos?.[0] ? ZX.photoHTML(S().photos[0]) : ''}</button><button class="shutter" id="shutter" aria-label="Foto aufnehmen"></button><button class="cam-flip" id="camFlip" aria-label="Kamera wechseln">${svg('swap')}</button></div></div></div>`;
    if (ZX.isNui) ZX.post('cameraMode', { selfie: st.mode === 'selfie' });
    const vf = $('#vf');
    const redraw = () => { vf.querySelector('.art, img').outerHTML = ZX.art(seed, scene(), st.filter); };
    const set = (k, v, rerender = true) => { st[k] = v; ZX.save(); if (rerender) ZX.render(true); };
    vf.onclick = (e) => { if (e.target.closest('button')) return; const r = vf.getBoundingClientRect(); const f = document.createElement('span'); f.className = 'vf-focus'; f.style.left = (e.clientX - r.left) / r.width * 100 + '%'; f.style.top = (e.clientY - r.top) / r.height * 100 + '%'; vf.appendChild(f); setTimeout(() => f.remove(), 700); };
    $('#cFlash').onclick = () => set('flash', st.flash === 'on' ? 'off' : 'on');
    $('#cTimer').onclick = () => set('timer', st.timer === 0 ? 3 : st.timer === 3 ? 10 : 0);
    $('#cGrid').onclick = () => set('grid', !st.grid);
    $('#cExp').oninput = (e) => { st.exp = +e.target.value; vf.style.filter = `brightness(${1 + st.exp / 10})`; e.target.nextElementSibling.textContent = (st.exp > 0 ? '+' : '') + st.exp; ZX.save(); };
    body.querySelector('.zoom-row').onclick = (e) => { const b = e.target.closest('[data-z]'); if (b) { st.zoom = +b.dataset.z; ZX.save(); vf.style.setProperty('--zoom', st.zoom); $$('.zoom-row button').forEach((x) => { x.classList.toggle('on', x === b); x.textContent = (+x.dataset.z < 1 ? '.5' : x.dataset.z) + (x === b ? '×' : ''); }); ZX.post('cameraZoom', { zoom: st.zoom }); } };
    $('#camScenes') && ($('#camScenes').onclick = (e) => { const b = e.target.closest('[data-scene]'); if (b) set('scene', b.dataset.scene); });
    $('#camFilters').onclick = (e) => { const b = e.target.closest('[data-filter]'); if (!b) return; st.filter = b.dataset.filter; ZX.save(); $$('#camFilters .chip').forEach((x) => x.classList.toggle('on', x === b)); redraw(); };
    $('#camModes').onclick = (e) => { const b = e.target.closest('[data-mode]'); if (b) { st.zoom = 1; set('mode', b.dataset.mode); } };
    $('#camFlip').onclick = () => { if (st.mode === 'selfie') set('mode', 'photo'); else set('mode', 'selfie'); };
    $('#camLast').onclick = () => ZX.open('gallery');
    $('#shutter').onclick = async () => {
      if (busy) return; busy = true;
      for (let t = st.timer; t > 0; t--) { const c = document.createElement('div'); c.className = 'vf-count'; c.textContent = t; vf.appendChild(c); ZX.playTone('soft', .04); await new Promise((r) => setTimeout(r, 1000)); c.remove(); if (!vf.isConnected) return; }
      if (st.flash === 'on') { vf.classList.add('flash'); setTimeout(() => vf.classList.remove('flash'), 250); }
      ZX.playTone('glass', .04);
      let p = { id: ZX.uid(), seed, scene: scene(), filter: st.filter, mode: st.mode, t: Date.now() };
      if (ZX.isNui) { const r = await ZX.post('takePhoto', { selfie: st.mode === 'selfie' }); if (r && r.url) p.url = r.url; }
      S().photos ||= []; S().photos.unshift(p); S().photos = S().photos.slice(0, 300); ZX.save();
      $('#camLast').innerHTML = ZX.photoHTML(p); seed = Math.floor(Math.random() * 1e9); redraw(); busy = false;
    };
  };
})();
