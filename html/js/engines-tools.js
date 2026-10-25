/* Tool engines: tracker lists, form calculators, calculator, clock suite, sensors, creative, music, docs, quiz. */
(() => {
  'use strict';
  const { $, $$, esc, svg, money, ago, engines, body, RENDER, pad, uid } = ZX;
  const head = (...a) => ZX.head(...a);
  const today = () => ZX.ymd(new Date());

  /* ───────── Tracker lists (todo, shopping, habits, water, budget, goals, watchlists…) ───────── */
  engines.tracker = (app) => {
    const cfg = app.cfg || {}; const mode = cfg.mode || 'check';
    const st = ZX.data(app.id); st.items ||= (cfg.seed || []).map((t) => ({ id: uid(), t, done: false, n: 0, log: {} }));
    const day = today();
    if (mode === 'counter') { // water, coffee, pushups…
      st.days ||= {};
      const n = st.days[day] || 0, goal = cfg.goal || 8;
      head(app.name, cfg.tagline || 'Heute');
      const last7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(Date.now() - (6 - i) * 864e5); return { d: d.toLocaleDateString('de-DE', { weekday: 'short' }), v: st.days[ZX.ymd(d)] || 0 }; });
      body.innerHTML = `<div class="ring-wrap"><svg viewBox="0 0 120 120" class="ring"><circle cx="60" cy="60" r="52" class="ring-bg"/><circle cx="60" cy="60" r="52" class="ring-fg" style="stroke-dasharray:${Math.min(1, n / goal) * 326.7} 326.7"/></svg><div class="ring-txt"><b>${n}</b><span>von ${goal} ${esc(cfg.unit || '')}</span></div></div>
        <div class="trade-btns"><button class="btn ghost" id="trMinus">−1</button><button class="btn" id="trPlus">+1 ${esc(cfg.unitOne || '')}</button></div>
        <div class="bars">${last7.map((x) => `<div><i style="height:${Math.min(100, x.v / goal * 100)}%"></i><span>${x.d}</span></div>`).join('')}</div>
        <label class="lbl">Tagesziel</label><input class="range" type="range" min="1" max="${cfg.max || 20}" value="${goal}" id="trGoal" />`;
      $('#trPlus').onclick = () => { st.days[day] = n + 1; ZX.save(); if (n + 1 === goal) ZX.notify(app.id, 'Ziel erreicht! 🎉', `${goal} ${cfg.unit || ''} heute.`); ZX.render(true); };
      $('#trMinus').onclick = () => { st.days[day] = Math.max(0, n - 1); ZX.save(); ZX.render(true); };
      $('#trGoal').onchange = (e) => { cfg.goal = +e.target.value; st.goal = cfg.goal; ZX.save(); ZX.render(true); };
      if (st.goal) cfg.goal = st.goal;
      return;
    }
    if (mode === 'money') { // budget book
      const inc = st.items.filter((i) => i.amount > 0).reduce((s, i) => s + i.amount, 0), exp = st.items.filter((i) => i.amount < 0).reduce((s, i) => s - i.amount, 0);
      head(app.name, 'Haushaltsbuch');
      body.innerHTML = `<div class="pf-hero"><span class="tag">Saldo</span><p class="pf-val num">${money(inc - exp)}</p><div class="stats"><div><span>Einnahmen</span><b class="gain">${money(inc)}</b></div><div><span>Ausgaben</span><b class="loss">${money(exp)}</b></div></div></div>
        <form class="ev-add three" id="trF"><input class="field" id="trT" placeholder="Posten" maxlength="40" required /><input class="field num" id="trA" placeholder="-12,50" inputmode="decimal" required /><button class="send">${svg('plus')}</button></form>
        <ul class="list">${st.items.filter((i) => i.amount !== undefined).map((i) => `<li class="row"><span class="grow"><span class="t">${esc(i.t)}</span><span class="s">${ago(i.at || Date.now())}</span></span><span class="amt ${i.amount >= 0 ? 'gain' : 'loss'}">${money(i.amount)}</span><button class="x" data-del="${i.id}">✕</button></li>`).join('')}</ul>`;
      $('#trF').onsubmit = (e) => { e.preventDefault(); const a = parseFloat($('#trA').value.replace(',', '.')); if (isNaN(a)) return; st.items.unshift({ id: uid(), t: $('#trT').value.trim(), amount: a, at: Date.now() }); ZX.save(); ZX.render(true); };
      body.onclick = (e) => { const d = e.target.closest('[data-del]'); if (d) { st.items = st.items.filter((i) => i.id !== d.dataset.del); ZX.save(); ZX.render(true); } };
      return;
    }
    if (mode === 'goal') { // savings goals
      head(app.name, 'Ziele');
      body.innerHTML = `${st.items.filter((g) => g.target).map((g) => `<div class="goal"><div class="row"><span class="grow"><span class="t">${esc(g.t)}</span><span class="s">${money(g.n)} von ${money(g.target)}</span></span><button class="x" data-del="${g.id}">✕</button></div><div class="bar"><i style="width:${Math.min(100, g.n / g.target * 100)}%"></i></div><div class="chips">${[10, 50, 100, 500].map((v) => `<button class="chip" data-add="${g.id}" data-v="${v}">+${v} €</button>`).join('')}</div></div>`).join('') || '<p class="empty">Lege dein erstes Sparziel an.</p>'}
        <form class="ev-add three" id="trF"><input class="field" id="trT" placeholder="Ziel, z. B. Neues Auto" maxlength="40" required /><input class="field num" id="trA" placeholder="5000" inputmode="decimal" required /><button class="send">${svg('plus')}</button></form>`;
      $('#trF').onsubmit = (e) => { e.preventDefault(); const a = parseFloat($('#trA').value.replace(',', '.')); if (!(a > 0)) return; st.items.push({ id: uid(), t: $('#trT').value.trim(), target: a, n: 0 }); ZX.save(); ZX.render(true); };
      body.onclick = (e) => { const d = e.target.closest('[data-del]'); if (d) { st.items = st.items.filter((i) => i.id !== d.dataset.del); ZX.save(); return ZX.render(true); } const a = e.target.closest('[data-add]'); if (a) { const g = st.items.find((i) => i.id === a.dataset.add); g.n += +a.dataset.v; if (g.n >= g.target) ZX.notify(app.id, 'Sparziel erreicht! 🎯', g.t); ZX.save(); ZX.render(true); } };
      return;
    }
    // check / habit lists
    const habit = mode === 'habit';
    const streak = (it) => { let s = 0; for (let i = 0; ; i++) { const k = ZX.ymd(new Date(Date.now() - i * 864e5)); if (it.log && it.log[k]) s++; else if (i > 0) break; else continue; if (s > 365) break; } return s; };
    const open = st.items.filter((i) => habit || !i.done), done = habit ? [] : st.items.filter((i) => i.done);
    head(app.name, habit ? 'Heute' : `${open.length} offen`, done.length ? '<button type="button" id="trClear">Aufräumen</button>' : '');
    body.innerHTML = `<form class="ev-add two" id="trF"><input class="field" id="trT" placeholder="${esc(cfg.ph || 'Neuer Eintrag')}" maxlength="60" required /><button class="send">${svg('plus')}</button></form>
      <ul class="list tracker">${open.map((i) => `<li class="row"><button class="checkbox ${habit ? (i.log && i.log[day] ? 'on' : '') : ''}" data-tog="${i.id}">${svg('check')}</button><span class="grow"><span class="t">${esc(i.t)}</span>${habit ? `<span class="s">🔥 ${streak(i)} Tage Serie</span>` : ''}</span><button class="x" data-del="${i.id}">✕</button></li>`).join('')}</ul>
      ${done.length ? `<p class="tag set-h">Erledigt</p><ul class="list tracker done">${done.map((i) => `<li class="row"><button class="checkbox on" data-tog="${i.id}">${svg('check')}</button><span class="grow"><span class="t">${esc(i.t)}</span></span><button class="x" data-del="${i.id}">✕</button></li>`).join('')}</ul>` : ''}
      ${!st.items.length ? `<p class="empty">${esc(cfg.empty || 'Noch leer.')}</p>` : ''}`;
    $('#trF').onsubmit = (e) => { e.preventDefault(); const t = $('#trT').value.trim(); if (!t) return; st.items.unshift({ id: uid(), t, done: false, log: {} }); ZX.save(); ZX.render(true); setTimeout(() => $('#trT')?.focus(), 30); };
    $('#trClear') && ($('#trClear').onclick = () => { st.items = st.items.filter((i) => !i.done); ZX.save(); ZX.render(true); });
    body.onclick = (e) => {
      const tg = e.target.closest('[data-tog]'); if (tg) { const it = st.items.find((i) => i.id === tg.dataset.tog); if (habit) { it.log ||= {}; it.log[day] = !it.log[day]; } else it.done = !it.done; ZX.save(); return ZX.render(true); }
      const d = e.target.closest('[data-del]'); if (d) { st.items = st.items.filter((i) => i.id !== d.dataset.del); ZX.save(); ZX.render(true); }
    };
  };

  /* ───────── Form calculators (BMI, Kredit, Trinkgeld, Einheiten…) ───────── */
  engines.calc = (app) => {
    const cfg = app.cfg; const st = ZX.data(app.id);
    head(app.name, cfg.tagline || 'Rechner');
    body.innerHTML = `<form id="clF">${cfg.inputs.map((i) => `<label class="lbl">${esc(i.label)}</label>${i.options ? `<select class="field" data-k="${i.key}">${i.options.map((o) => `<option ${st[i.key] === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>` : `<input class="field num" data-k="${i.key}" inputmode="decimal" value="${esc(st[i.key] ?? i.value ?? '')}" placeholder="${esc(i.ph || '')}" />`}`).join('')}</form>
      <div class="calc-out" id="clOut"></div>`;
    const run = () => {
      if (!$('#clOut')) return;
      const v = {}; $$('[data-k]', body).forEach((el) => { const raw = el.value; v[el.dataset.k] = el.tagName === 'SELECT' ? raw : parseFloat(String(raw).replace(',', '.')); st[el.dataset.k] = raw; });
      ZX.save();
      let out; try { out = cfg.calc(v); } catch { out = null; }
      $('#clOut').innerHTML = out ? out.map(([k, val, big]) => `<div class="${big ? 'big' : ''}"><span>${esc(k)}</span><b>${esc(val)}</b></div>`).join('') : '<p class="s">Werte eingeben …</p>';
    };
    body.oninput = run; body.onchange = run; run();
  };

  /* ───────── Calculator ───────── */
  RENDER.calculator = () => {
    head('Rechner', 'Tools');
    const st = ZX.data('calculator'); st.expr ||= ''; st.hist ||= [];
    const keys = ['C', '(', ')', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '%', '0', ',', '='];
    body.innerHTML = `<div class="calc-hist">${st.hist.slice(-3).map((h) => `<p>${esc(h)}</p>`).join('')}</div><div class="calc-disp" id="cd">${esc(st.expr || '0')}</div><div class="calc-prev" id="cp"></div>
      <div class="calc-keys">${keys.map((k) => `<button class="${'÷×−+='.includes(k) ? 'op' : k === 'C' ? 'fn' : ''}" data-k="${k}">${k}</button>`).join('')}</div>`;
    const evalx = (e) => { const s = e.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/,/g, '.').replace(/(\d+(?:\.\d+)?)%/g, '($1/100)'); if (!/^[\d+\-*/().\s]*$/.test(s)) return null; try { const r = Function(`"use strict";return (${s})`)(); return isFinite(r) ? Math.round(r * 1e10) / 1e10 : null; } catch { return null; } };
    const upd = () => { $('#cd').textContent = st.expr || '0'; const r = evalx(st.expr); $('#cp').textContent = r !== null && st.expr && /[+\-−×÷%]/.test(st.expr) ? '= ' + String(r).replace('.', ',') : ''; ZX.save(); };
    body.onclick = (e) => {
      const k = e.target.closest('[data-k]')?.dataset.k; if (!k) return;
      if (k === 'C') st.expr = st.expr ? st.expr.slice(0, -1) : '';
      else if (k === '=') { const r = evalx(st.expr); if (r !== null) { st.hist.push(`${st.expr} = ${String(r).replace('.', ',')}`); st.expr = String(r).replace('.', ','); } }
      else st.expr += k;
      upd();
    };
    body.querySelector('[data-k="C"]').ondblclick = () => { st.expr = ''; upd(); };
    upd();
  };

  /* ───────── Clock suite (Weltuhr, Stoppuhr, Timer, Wecker, Pomodoro) ───────── */
  const CITIES = [['Los Santos', -7], ['Liberty City', -4], ['London', 0], ['Berlin', 1], ['Dubai', 4], ['Tokio', 9], ['Sydney', 10]];
  const clockState = ZX.clockState = { sw: { run: false, t0: 0, acc: 0, laps: [] }, tm: { end: 0, dur: 300000, run: false, left: 300000 } };
  engines.clock = (app, view, arg, isLive) => {
    const tab = ZX.data('clock').tab || app.cfg?.tab || 'world';
    const fmt = (ms, cs = true) => { const t = Math.max(0, ms); const m = Math.floor(t / 60000), s = Math.floor(t / 1000) % 60, c = Math.floor(t / 10) % 100; return `${pad(m)}:${pad(s)}${cs ? ',' + pad(c) : ''}`; };
    if (!isLive) {
      head(app.name, 'Uhr');
      body.innerHTML = `${app.cfg?.tab ? '' : `<div class="seg" id="clkTab">${[['world', 'Weltuhr'], ['alarm', 'Wecker'], ['sw', 'Stoppuhr'], ['timer', 'Timer']].map(([k, n]) => `<button data-t="${k}" class="${tab === k ? 'on' : ''}">${n}</button>`).join('')}</div>`}<div id="clk"></div>`;
      $('#clkTab') && ($('#clkTab').onclick = (e) => { const b = e.target.closest('[data-t]'); if (b) { ZX.data('clock').tab = b.dataset.t; ZX.save(); ZX.render(); } });
      ZX.live.interval(() => ZX.render(true), tab === 'sw' || tab === 'timer' ? 50 : 1000);
    }
    const el = $('#clk'); if (!el) return;
    const sw = clockState.sw, tm = clockState.tm;
    if (tab === 'world') {
      const now = new Date(); const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      el.innerHTML = `<p class="big-clock chrome">${pad(now.getHours())}:${pad(now.getMinutes())}<small>${pad(now.getSeconds())}</small></p><ul class="list">${CITIES.map(([c, o]) => { const d = new Date(utc + o * 3600000); return `<li class="row"><span class="grow"><span class="t">${c}</span><span class="s">UTC${o >= 0 ? '+' : ''}${o}</span></span><b class="world-t">${pad(d.getHours())}:${pad(d.getMinutes())}</b></li>`; }).join('')}</ul>`;
    } else if (tab === 'sw') {
      const t = sw.acc + (sw.run ? Date.now() - sw.t0 : 0);
      if (isLive && $('#swT')) { $('#swT').textContent = fmt(t); return; }
      el.innerHTML = `<p class="big-clock num" id="swT">${fmt(t)}</p><div class="trade-btns"><button class="btn ghost" id="swL">${sw.run ? 'Runde' : 'Reset'}</button><button class="btn" id="swS">${sw.run ? 'Stopp' : 'Start'}</button></div><ul class="list">${sw.laps.map((l, i) => `<li class="row"><span class="grow t">Runde ${sw.laps.length - i}</span><b class="num">${fmt(l)}</b></li>`).join('')}</ul>`;
      $('#swS').onclick = () => { if (sw.run) { sw.acc += Date.now() - sw.t0; sw.run = false; } else { sw.t0 = Date.now(); sw.run = true; } ZX.render(); };
      $('#swL').onclick = () => { if (sw.run) sw.laps.unshift(sw.acc + Date.now() - sw.t0); else { sw.acc = 0; sw.laps = []; } ZX.render(); };
    } else if (tab === 'timer') {
      const left = tm.run ? tm.end - Date.now() : tm.left;
      if (isLive && $('#tmT')) { $('#tmT').textContent = fmt(left, false); $('#tmRing').style.strokeDasharray = `${Math.max(0, left / tm.dur) * 326.7} 326.7`; return; }
      el.innerHTML = `<div class="ring-wrap"><svg viewBox="0 0 120 120" class="ring"><circle cx="60" cy="60" r="52" class="ring-bg"/><circle id="tmRing" cx="60" cy="60" r="52" class="ring-fg" style="stroke-dasharray:${Math.max(0, left / tm.dur) * 326.7} 326.7"/></svg><div class="ring-txt"><b id="tmT">${fmt(left, false)}</b></div></div>
        <div class="chips">${[1, 3, 5, 10, 15, 25, 30, 60].map((m) => `<button class="chip" data-m="${m}">${m} Min</button>`).join('')}</div>
        <div class="trade-btns"><button class="btn ghost" id="tmR">Reset</button><button class="btn" id="tmS">${tm.run ? 'Pause' : 'Start'}</button></div>`;
      el.querySelector('.chips').onclick = (e) => { const b = e.target.closest('[data-m]'); if (!b) return; tm.dur = tm.left = +b.dataset.m * 60000; tm.run = false; ZX.render(); };
      $('#tmS').onclick = () => { if (tm.run) { tm.left = tm.end - Date.now(); tm.run = false; } else { tm.end = Date.now() + tm.left; tm.run = true; } ZX.render(); };
      $('#tmR').onclick = () => { tm.run = false; tm.left = tm.dur; ZX.render(); };
    } else {
      const al = ZX.data('clock'); al.alarms ||= [{ id: uid(), t: '07:30', on: false, label: 'Aufstehen' }];
      el.innerHTML = `<ul class="list">${al.alarms.map((a) => `<li class="row"><span class="grow"><b class="alarm-t">${a.t}</b><span class="s">${esc(a.label)}</span></span><button class="switch ${a.on ? 'on' : ''}" data-al="${a.id}"></button><button class="x" data-ald="${a.id}">✕</button></li>`).join('')}</ul>
        <form class="ev-add" id="alF"><input class="field num" type="time" id="alT" value="08:00" /><input class="field" id="alL" placeholder="Bezeichnung" maxlength="30" /><button class="send">${svg('plus')}</button></form>`;
      el.onclick = (e) => { const s = e.target.closest('[data-al]'); if (s) { const a = al.alarms.find((x) => x.id === s.dataset.al); a.on = !a.on; ZX.save(); ZX.render(); } const d = e.target.closest('[data-ald]'); if (d) { al.alarms = al.alarms.filter((x) => x.id !== d.dataset.ald); ZX.save(); ZX.render(); } };
      $('#alF').onsubmit = (e) => { e.preventDefault(); al.alarms.push({ id: uid(), t: $('#alT').value, label: $('#alL').value || 'Wecker', on: true }); ZX.save(); ZX.render(); };
    }
  };
  // Timer + alarms keep running in the background.
  setInterval(() => {
    const tm = clockState.tm;
    if (tm.run && Date.now() >= tm.end) { tm.run = false; tm.left = tm.dur; ZX.notify('timer', 'Timer abgelaufen', 'Deine Zeit ist um.', null, 'timer'); }
    const n = new Date(), hm = `${pad(n.getHours())}:${pad(n.getMinutes())}`;
    (ZX.data('clock').alarms || []).forEach((a) => { if (a.on && a.t === hm && a.fired !== ZX.ymd(n)) { a.fired = ZX.ymd(n); ZX.save(); ZX.notify('wecker', 'Wecker ⏰', `${a.t} · ${a.label}`, null, 'wecker'); } });
  }, 1000);

  /* ───────── Sensors: compass, speedometer, steps, level, flashlight ───────── */
  engines.sensor = (app, view, arg, isLive) => {
    const kind = app.cfg.kind;
    if (!isLive) { head(app.name, 'Sensor'); ZX.live.interval(() => ZX.render(true), kind === 'level' ? 100 : 500); body.innerHTML = '<div id="sens"></div>'; }
    const el = $('#sens'); if (!el) return;
    if (kind === 'flash') {
      if (isLive) return;
      const st = ZX.data(app.id);
      el.innerHTML = `<button class="torch ${st.on ? 'on' : ''}" id="torch">${svg('torch')}</button><p class="s" style="text-align:center">${st.on ? 'An' : 'Aus'} · tippen zum Umschalten</p>`;
      $('#torch').onclick = () => { st.on = !st.on; ZX.save(); ZX.post('flashlight', { on: st.on }); $('#screen').classList.toggle('torch-on', st.on); ZX.render(); };
      return;
    }
    ZX.world().then((w) => {
      if (!w || !$('#sens')) return;
      if (kind === 'compass') {
        const hd = ((360 - (w.heading || 0)) % 360 + 360) % 360; const dirs = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];
        el.innerHTML = `<div class="compass"><div class="dial" style="transform:rotate(${-hd}deg)">${['N', 'O', 'S', 'W'].map((d, i) => `<span style="transform:rotate(${i * 90}deg) translateY(-118px) rotate(${-i * 90}deg)">${d}</span>`).join('')}${Array.from({ length: 72 }, (_, i) => `<i style="transform:rotate(${i * 5}deg)" class="${i % 6 ? '' : 'big'}"></i>`).join('')}</div><div class="needle"></div></div><p class="big-clock num">${Math.round(hd)}° ${dirs[Math.round(hd / 45) % 8]}</p><p class="s" style="text-align:center">${esc(w.street || '')}${w.zone ? ', ' + esc(w.zone) : ''}</p>`;
      } else if (kind === 'speed') {
        const kmh = Math.round((w.speed || 0) * 3.6); const st = ZX.data(app.id); st.max = Math.max(st.max || 0, kmh);
        el.innerHTML = `<div class="ring-wrap"><svg viewBox="0 0 120 120" class="ring gauge"><circle cx="60" cy="60" r="52" class="ring-bg" style="stroke-dasharray:245 326.7"/><circle cx="60" cy="60" r="52" class="ring-fg" style="stroke-dasharray:${Math.min(1, kmh / 300) * 245} 326.7"/></svg><div class="ring-txt"><b>${kmh}</b><span>km/h</span></div></div>
          <div class="stats"><div><span>Maximum</span><b>${st.max} km/h</b></div><div><span>Fahrzeug</span><b>${w.inVehicle ? 'Ja' : 'Zu Fuß'}</b></div></div><button class="btn ghost" id="spR">Maximum zurücksetzen</button>`;
        $('#spR').onclick = () => { st.max = 0; ZX.save(); };
      } else if (kind === 'steps') {
        const st = ZX.data(app.id); st.days ||= {}; const d = today();
        if (st.last && !w.inVehicle) { const dd = Math.hypot(w.pos.x - st.last.x, w.pos.y - st.last.y); if (dd < 30) st.days[d] = (st.days[d] || 0) + dd; }
        st.last = { x: w.pos.x, y: w.pos.y }; ZX.save();
        const m = st.days[d] || 0, steps = Math.round(m / 0.75), goal = 10000;
        el.innerHTML = `<div class="ring-wrap"><svg viewBox="0 0 120 120" class="ring"><circle cx="60" cy="60" r="52" class="ring-bg"/><circle cx="60" cy="60" r="52" class="ring-fg" style="stroke-dasharray:${Math.min(1, steps / goal) * 326.7} 326.7"/></svg><div class="ring-txt"><b>${steps.toLocaleString('de-DE')}</b><span>Schritte</span></div></div>
          <div class="stats"><div><span>Distanz</span><b>${(m / 1000).toFixed(2).replace('.', ',')} km</b></div><div><span>Kalorien</span><b>${Math.round(steps * 0.04)} kcal</b></div></div><p class="disclaimer">Zählt deine Wege zu Fuß, solange das Handy offen ist.</p>`;
      } else if (kind === 'level') {
        const t = Date.now() / 1000; const ax = Math.sin(t * .7) * 6, ay = Math.cos(t * .5) * 4;
        el.innerHTML = `<div class="level"><div class="bubble-dot" style="transform:translate(${ax * 8}px,${ay * 8}px)"></div><i></i><i class="v"></i></div><p class="big-clock num">${Math.abs(ax).toFixed(1)}° / ${Math.abs(ay).toFixed(1)}°</p>`;
      }
    });
  };

  /* ───────── Small random tools ───────── */
  engines.random = (app) => {
    const k = app.cfg.kind; const st = ZX.data(app.id);
    head(app.name, 'Zufall');
    if (k === 'dice') {
      st.n ||= 2;
      body.innerHTML = `<div class="dice-row" id="dr">${Array.from({ length: st.n }, () => '<div class="die">?</div>').join('')}</div><p class="big-clock num" id="ds">–</p><div class="chips">${[1, 2, 3, 4, 5, 6].map((n) => `<button class="chip ${st.n === n ? 'on' : ''}" data-n="${n}">${n} ${n > 1 ? 'Würfel' : 'Würfel'}</button>`).join('')}</div><button class="btn" id="dRoll">Würfeln</button>`;
      body.onclick = (e) => { const b = e.target.closest('[data-n]'); if (b) { st.n = +b.dataset.n; ZX.save(); ZX.render(); } };
      $('#dRoll').onclick = () => { const v = Array.from({ length: st.n }, () => 1 + Math.floor(Math.random() * 6)); $$('#dr .die').forEach((d, i) => { d.classList.remove('roll'); void d.offsetWidth; d.classList.add('roll'); d.textContent = '⚀⚁⚂⚃⚄⚅'[v[i] - 1]; }); $('#ds').textContent = `Summe ${v.reduce((s, x) => s + x, 0)}`; };
    } else if (k === 'number') {
      body.innerHTML = `<div class="stats"><div><span>Von</span><input class="field num" id="rnA" value="${st.a ?? 1}" /></div><div><span>Bis</span><input class="field num" id="rnB" value="${st.b ?? 100}" /></div></div><p class="big-clock num" id="rnO">–</p><button class="btn" id="rnGo">Zahl ziehen</button>`;
      $('#rnGo').onclick = () => { const a = parseInt($('#rnA').value, 10), b = parseInt($('#rnB').value, 10); st.a = a; st.b = b; ZX.save(); if (isNaN(a) || isNaN(b) || b < a) return; $('#rnO').textContent = a + Math.floor(Math.random() * (b - a + 1)); };
    } else if (k === 'wheel') {
      st.opts ||= ['Pizza', 'Burger Shot', 'Sushi', "Cluckin' Bell", 'Tacos'];
      const n = st.opts.length;
      body.innerHTML = `<div class="wheel-wrap"><div class="wheel" id="wh" style="background:conic-gradient(${st.opts.map((_, i) => `hsl(${330 + i * (60 / n)},${60 + (i % 2) * 15}%,${40 + (i % 3) * 10}%) ${i / n * 100}% ${(i + 1) / n * 100}%`).join(',')})">${st.opts.map((o, i) => `<span style="transform:rotate(${(i + .5) * 360 / n}deg) translateY(-92px)">${esc(o.slice(0, 12))}</span>`).join('')}</div><i class="wheel-ptr"></i></div><p class="big-clock" id="whO">–</p>
        <button class="btn" id="whGo">Drehen</button><textarea class="field" id="whOpts" rows="4" style="margin-top:12px">${esc(st.opts.join('\n'))}</textarea>`;
      let rot = 0;
      $('#whOpts').onchange = (e) => { st.opts = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 12); if (st.opts.length < 2) st.opts.push('Option'); ZX.save(); ZX.render(); };
      $('#whGo').onclick = () => { const win = Math.floor(Math.random() * n); rot += 1440 + (360 - (win + .5) * 360 / n) - (rot % 360); $('#wh').style.transform = `rotate(${rot}deg)`; setTimeout(() => { $('#whO').textContent = st.opts[win]; ZX.chime(); }, 3200); };
    } else if (k === 'password') {
      st.len ||= 16;
      const gen = () => { const sets = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789' + (st.sym !== false ? '!@#$%&*?-_' : ''); const a = new Uint32Array(st.len); crypto.getRandomValues(a); return [...a].map((x) => sets[x % sets.length]).join(''); };
      body.innerHTML = `<p class="pw" id="pw">${esc(gen())}</p><label class="lbl">Länge: <b id="pwL">${st.len}</b></label><input type="range" class="range" min="8" max="40" value="${st.len}" id="pwR" /><label class="row check"><input type="checkbox" id="pwS" ${st.sym !== false ? 'checked' : ''} /> <span class="grow t">Sonderzeichen</span></label><button class="btn" id="pwG">Neu erzeugen</button>`;
      const g = () => { $('#pw').textContent = gen(); };
      $('#pwR').oninput = (e) => { st.len = +e.target.value; $('#pwL').textContent = st.len; ZX.save(); g(); };
      $('#pwS').onchange = (e) => { st.sym = e.target.checked; ZX.save(); g(); };
      $('#pwG').onclick = g;
    } else if (k === 'coin') {
      body.innerHTML = `<div class="coin" id="coin"><span>Z</span></div><p class="big-clock" id="cO">–</p><button class="btn" id="cGo">Werfen</button>`;
      $('#cGo').onclick = () => { const h = Math.random() < .5; const c = $('#coin'); c.classList.remove('flip-h', 'flip-t'); void c.offsetWidth; c.classList.add(h ? 'flip-h' : 'flip-t'); setTimeout(() => { $('#cO').textContent = h ? 'Kopf' : 'Zahl'; }, 1000); };
    } else if (k === 'counter') {
      st.n ||= 0;
      body.innerHTML = `<button class="tally" id="tl"><b>${st.n}</b><span>Tippen zum Zählen</span></button><div class="trade-btns"><button class="btn ghost" id="tlM">−1</button><button class="btn ghost" id="tlR">Reset</button></div>`;
      $('#tl').onclick = () => { st.n++; ZX.save(); $('#tl b').textContent = st.n; };
      $('#tlM').onclick = () => { st.n = Math.max(0, st.n - 1); ZX.save(); $('#tl b').textContent = st.n; };
      $('#tlR').onclick = () => { st.n = 0; ZX.save(); $('#tl b').textContent = 0; };
    } else if (k === 'morse') {
      const M = { a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....', i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.', q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-', y: '-.--', z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.' };
      body.innerHTML = `<textarea class="field" id="mo" rows="3" placeholder="Text eingeben">${esc(st.txt || 'SOS')}</textarea><p class="pw" id="moO"></p><button class="btn" id="moP">Abspielen</button>`;
      const conv = () => { st.txt = $('#mo').value; ZX.save(); $('#moO').textContent = st.txt.toLowerCase().split('').map((c) => c === ' ' ? '/' : M[c] || '').join(' '); };
      $('#mo').oninput = conv; conv();
      $('#moP').onclick = () => { const ac = ZX.audio(); if (!ac) return; let t = ac.currentTime + .05; for (const ch of $('#moO').textContent) { if (ch === '.' || ch === '-') { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 700; o.connect(g); g.connect(ac.destination); const d = ch === '.' ? .08 : .24; g.gain.setValueAtTime(.08, t); g.gain.setValueAtTime(0, t + d); o.start(t); o.stop(t + d + .02); t += d + .08; } else t += .2; } };
    }
  };

  /* ───────── Breathing / Pomodoro / Meditation ───────── */
  engines.breathe = (app) => {
    head(app.name, 'Achtsamkeit');
    const p = app.cfg.pattern || [4, 4, 4, 4];
    body.innerHTML = `<div class="breathe"><div class="b-circle" id="bc"></div><p class="big-clock" id="bt">Bereit</p></div><button class="btn" id="bGo">Start</button><p class="disclaimer">${esc(app.cfg.hint || 'Box-Atmung: 4 ein, 4 halten, 4 aus, 4 halten.')}</p>`;
    $('#bGo').onclick = () => {
      $('#bGo').hidden = true;
      const phases = [['Einatmen', 1.35, p[0]], ['Halten', 1.35, p[1]], ['Ausatmen', .8, p[2]], ['Halten', .8, p[3]]].filter((x) => x[2] > 0);
      let i = 0;
      const step = () => { const [lbl, sc, sec] = phases[i % phases.length]; $('#bt') && ($('#bt').textContent = lbl); const bc = $('#bc'); if (!bc) return; bc.style.transition = `transform ${sec}s ease-in-out`; bc.style.transform = `scale(${sc})`; i++; ZX.live.timeout(step, sec * 1000); };
      step();
    };
  };

  /* ───────── Sketch (drawing) + Pixel art ───────── */
  engines.sketch = (app) => {
    const pixel = app.cfg && app.cfg.pixel;
    head(app.name, 'Kreativ', '<button type="button" id="skSave">Speichern</button>');
    const colors = ['#f2eef0', '#f472b6', '#f0a04b', '#fbbf24', '#5eead4', '#60a5fa', '#c4b5fd', '#0b080a'];
    const st = ZX.data(app.id); st.color ||= colors[1]; st.size ||= 6;
    body.innerHTML = `<canvas class="sketch ${pixel ? 'pixel' : ''}" id="sk" width="${pixel ? 16 : 600}" height="${pixel ? 16 : 760}"></canvas>
      <div class="sk-tools"><div class="swatches">${colors.map((c) => `<button class="swatch ${st.color === c ? 'on' : ''}" data-c="${c}" style="background:${c}"></button>`).join('')}</div>
      ${pixel ? '' : `<input type="range" class="range" min="2" max="30" value="${st.size}" id="skS" />`}<div class="chips"><button class="chip" id="skU">Rückgängig</button><button class="chip" id="skC">Leeren</button></div></div>`;
    const cv = $('#sk'), g = cv.getContext('2d');
    const bg = () => { g.fillStyle = pixel ? '#1f1a1d' : '#110e10'; g.fillRect(0, 0, cv.width, cv.height); };
    const undo = [];
    if (st.img) { const im = new Image(); im.onload = () => g.drawImage(im, 0, 0); im.src = st.img; } else bg();
    const pt = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * cv.width, y: (e.clientY - r.top) / r.height * cv.height }; };
    let drawing = false, last = null;
    cv.onpointerdown = (e) => { drawing = true; cv.setPointerCapture(e.pointerId); undo.push(cv.toDataURL()); if (undo.length > 20) undo.shift(); last = pt(e); paint(last); };
    cv.onpointermove = (e) => { if (drawing) paint(pt(e)); };
    cv.onpointerup = () => { drawing = false; last = null; st.img = cv.toDataURL(); ZX.save(); };
    function paint(p) {
      if (pixel) { g.fillStyle = st.color; g.fillRect(Math.floor(p.x), Math.floor(p.y), 1, 1); return; }
      g.strokeStyle = st.color; g.lineWidth = st.size; g.lineCap = 'round'; g.beginPath(); g.moveTo(last.x, last.y); g.lineTo(p.x, p.y); g.stroke(); last = p;
    }
    body.onclick = (e) => { const c = e.target.closest('[data-c]'); if (c) { st.color = c.dataset.c; $$('.sk-tools .swatch').forEach((x) => x.classList.toggle('on', x === c)); ZX.save(); } };
    $('#skS') && ($('#skS').oninput = (e) => { st.size = +e.target.value; ZX.save(); });
    $('#skC').onclick = () => { undo.push(cv.toDataURL()); bg(); st.img = null; ZX.save(); };
    $('#skU').onclick = () => { const u = undo.pop(); if (!u) return; const im = new Image(); im.onload = () => { bg(); g.drawImage(im, 0, 0); st.img = cv.toDataURL(); ZX.save(); }; im.src = u; };
    $('#skSave').onclick = () => {
      let url = cv.toDataURL('image/png');
      if (pixel) { const big = document.createElement('canvas'); big.width = big.height = 320; const bg2 = big.getContext('2d'); bg2.imageSmoothingEnabled = false; bg2.drawImage(cv, 0, 0, 320, 320); url = big.toDataURL('image/png'); }
      ZX.S.photos ||= []; ZX.S.photos.unshift({ id: uid(), url, t: Date.now() }); ZX.save(); ZX.notify('gallery', 'In Fotos gespeichert', app.name);
    };
  };

  /* ───────── Music: generative radio, piano, drum pad, metronome, noise ───────── */
  const Player = ZX.Player = (() => {
    let timer = null, station = null, step = 0, master = null, noiseNode = null;
    const NOTES = (root, scale) => scale.map((s) => root * Math.pow(2, s / 12));
    function voice(ac, freq, t, dur, type, vol, dest) { const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter(); o.type = type; o.frequency.value = freq; f.type = 'lowpass'; f.frequency.value = 2400; o.connect(f); f.connect(g); g.connect(dest); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.start(t); o.stop(t + dur + .05); }
    function drum(ac, kind, t, dest, vol = 1) {
      if (kind === 'k') { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + .15); g.gain.setValueAtTime(.5 * vol, t); g.gain.exponentialRampToValueAtTime(.001, t + .3); o.connect(g); g.connect(dest); o.start(t); o.stop(t + .3); return; }
      const len = kind === 'h' ? .05 : .18; const b = ac.createBuffer(1, ac.sampleRate * len, ac.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = b; f.type = kind === 'h' ? 'highpass' : 'bandpass'; f.frequency.value = kind === 'h' ? 7000 : 1800; g.gain.value = (kind === 'h' ? .12 : .3) * vol; s.connect(f); f.connect(g); g.connect(dest); s.start(t);
    }
    function play(st) {
      stop(); const ac = ZX.audio(); if (!ac) return; station = st; step = 0;
      master = ac.createGain(); master.gain.value = (ZX.data('wave').vol ?? 70) / 100; master.connect(ac.destination);
      const r = ZX.rng(st.seed || 1); const scale = NOTES(st.root || 220, st.scale || [0, 3, 5, 7, 10, 12]);
      const mel = Array.from({ length: 16 }, () => (r() > (st.sparse || .45) ? scale[Math.floor(r() * scale.length)] : 0));
      const bass = Array.from({ length: 4 }, () => scale[Math.floor(r() * 3)] / 2);
      const spb = 60 / (st.bpm || 100) / 4;
      let next = ac.currentTime + .05;
      timer = setInterval(() => {
        while (next < ac.currentTime + .2) {
          const s = step % 16, bar = Math.floor(step / 16) % 4;
          if (mel[s]) voice(ac, mel[s] * (bar === 3 && s > 11 ? 1.5 : 1), next, spb * (st.legato || 2), st.wave || 'triangle', .07, master);
          if (s % 4 === 0) voice(ac, bass[bar], next, spb * 3.5, st.bassWave || 'sine', .12, master);
          if (st.drums) { if (st.drums[0][s] === 'x') drum(ac, 'k', next, master); if (st.drums[1][s] === 'x') drum(ac, 's', next, master); if (st.drums[2][s] === 'x') drum(ac, 'h', next, master); }
          if (st.pad && s === 0) scale.slice(0, 3).forEach((f) => voice(ac, f / 2, next, spb * 16, 'sine', .025, master));
          next += spb; step++;
        }
      }, 50);
      ZX.island(`♪ ${st.name}`);
    }
    function noise(color) {
      stop(); const ac = ZX.audio(); if (!ac) return;
      const len = ac.sampleRate * 2, b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0); let last = 0;
      for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; d[i] = color === 'brown' ? (last = (last + .02 * w) / 1.02) * 3.5 : color === 'pink' ? (last = .97 * last + .03 * w) * 4 : w * .5; }
      noiseNode = ac.createBufferSource(); noiseNode.buffer = b; noiseNode.loop = true; master = ac.createGain(); master.gain.value = .25; noiseNode.connect(master); master.connect(ac.destination); noiseNode.start();
      station = { name: 'Rauschen' }; ZX.island('♪ Rauschen');
    }
    function stop() { clearInterval(timer); timer = null; if (noiseNode) { try { noiseNode.stop(); } catch { /* */ } noiseNode = null; } if (master) { try { master.disconnect(); } catch { /* */ } master = null; } if (station) ZX.island(''); station = null; }
    return { play, stop, noise, drum, voice, get station() { return station; }, setVol(v) { if (master) master.gain.value = v / 100; } };
  })();
  ZX.STATIONS = [
    { id: 'lofi', name: 'Lo-Fi Nights', bpm: 78, root: 220, scale: [0, 3, 7, 10, 14], wave: 'triangle', drums: ['x.......x.x.....', '....x.......x...', '..x...x...x...x.'], pad: true, seed: 11, desc: 'Chillige Beats zum Lernen und Cruisen' },
    { id: 'synth', name: 'Vinewood Synthwave', bpm: 104, root: 196, scale: [0, 2, 3, 7, 8, 12], wave: 'sawtooth', bassWave: 'sawtooth', drums: ['x...x...x...x...', '....x.......x...', 'x.x.x.x.x.x.x.x.'], seed: 21, desc: 'Neon, Nachtfahrten, 80er' },
    { id: 'techno', name: 'Techno FM', bpm: 128, root: 110, scale: [0, 3, 5, 7], wave: 'square', sparse: .7, legato: 1, drums: ['x...x...x...x...', '....x.......x...', '..x...x...x...x.'], seed: 31, desc: 'Vier auf den Boden' },
    { id: 'ambient', name: 'Chiliad Ambient', bpm: 60, root: 261.6, scale: [0, 2, 4, 7, 9, 12], wave: 'sine', sparse: .65, legato: 6, pad: true, seed: 41, desc: 'Weite Flächen, Ruhe' },
    { id: 'hiphop', name: 'Grove Street Radio', bpm: 92, root: 146.8, scale: [0, 3, 5, 6, 7, 10], wave: 'square', sparse: .6, drums: ['x.....x...x.....', '....x.......x...', 'x.x.x.x.x.x.x.x.'], seed: 51, desc: 'Boom Bap aus dem Süden' },
    { id: 'house', name: 'Del Perro House', bpm: 122, root: 174.6, scale: [0, 2, 4, 7, 9], wave: 'triangle', drums: ['x...x...x...x...', '....x.......x...', '..x...x...x...x.'], pad: true, seed: 61, desc: 'Strandclub-Vibes' },
    { id: 'jazz', name: 'Smooth Jazz LS', bpm: 88, root: 233, scale: [0, 2, 3, 5, 7, 9, 10, 14], wave: 'sine', legato: 3, drums: ['x.......x.......', '........x.......', 'x..x..x..x..x..x'], seed: 71, desc: 'Bar am Abend' },
    { id: 'chip', name: '8-Bit Arcade', bpm: 140, root: 329.6, scale: [0, 4, 7, 12, 16], wave: 'square', legato: 1, drums: ['x.......x.......', '....x.......x...', 'x.x.x.x.x.x.x.x.'], seed: 81, desc: 'Retro-Gaming-Sound' },
  ];
  engines.radio = (app) => {
    const only = app.cfg && app.cfg.station;
    const list = only ? ZX.STATIONS.filter((s) => s.id === only) : ZX.STATIONS;
    const cur = Player.station;
    head(app.name, only ? 'Live-Radio' : `${list.length} Sender`);
    const vol = ZX.data('wave').vol ?? 70;
    body.innerHTML = `<div class="now-playing ${cur ? 'on' : ''}"><div class="np-art">${ZX.art((cur && cur.seed) || (list[0].seed), 'neon')}<div class="eq"><i></i><i></i><i></i><i></i><i></i></div></div><b>${esc(cur ? cur.name : list[0].name)}</b><span class="s">${cur ? 'Läuft gerade' : 'Bereit'}</span>
      <div class="np-ctrl"><button class="play-btn" id="npPlay">${svg(cur ? 'pause' : 'play')}</button></div><input type="range" class="range" min="0" max="100" value="${vol}" id="npVol" aria-label="Lautstärke" /></div>
      ${only ? `<p class="store-desc">${esc(list[0].desc)}</p>` : `<ul class="list">${list.map((s) => `<li><button class="row ${cur && cur.id === s.id ? 'playing' : ''}" data-st="${s.id}"><span class="np-mini">${ZX.art(s.seed, 'neon')}</span><span class="grow"><span class="t">${esc(s.name)}</span><span class="s">${esc(s.desc)} · ${s.bpm} BPM</span></span>${cur && cur.id === s.id ? '<span class="eq small"><i></i><i></i><i></i></span>' : ''}</button></li>`).join('')}</ul>`}
      <p class="disclaimer">Live generierte Musik, lizenzfrei.</p>`;
    $('#npPlay').onclick = () => { if (Player.station) Player.stop(); else Player.play(list[0]); ZX.render(true); };
    $('#npVol').oninput = (e) => { ZX.data('wave').vol = +e.target.value; ZX.save(); Player.setVol(+e.target.value); };
    body.onclick = (e) => { const b = e.target.closest('[data-st]'); if (b) { Player.play(ZX.STATIONS.find((s) => s.id === b.dataset.st)); ZX.render(true); } };
  };
  engines.noise = (app) => {
    head(app.name, 'Fokus & Schlaf');
    const cur = Player.station && Player.station.name === 'Rauschen';
    body.innerHTML = `<div class="chips big">${[['white', 'Weiß'], ['pink', 'Rosa'], ['brown', 'Braun']].map(([k, n]) => `<button class="chip" data-n="${k}">${n}es Rauschen</button>`).join('')}</div><button class="btn ${cur ? 'ghost' : ''}" id="nzStop">${cur ? 'Stoppen' : 'Wähle eine Farbe'}</button>`;
    body.onclick = (e) => { const b = e.target.closest('[data-n]'); if (b) { Player.noise(b.dataset.n); ZX.render(true); } if (e.target.closest('#nzStop')) { Player.stop(); ZX.render(true); } };
  };
  engines.instrument = (app) => {
    const kind = app.cfg.kind;
    head(app.name, 'Musik');
    const ac = () => ZX.audio();
    if (kind === 'piano') {
      const whites = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16], blacks = { 1: 0, 3: 1, 6: 3, 8: 4, 10: 5, 13: 7, 15: 8 };
      const st = ZX.data(app.id); st.wave ||= 'triangle';
      body.innerHTML = `<div class="chips">${['sine', 'triangle', 'square', 'sawtooth'].map((w) => `<button class="chip ${st.wave === w ? 'on' : ''}" data-w="${w}">${w}</button>`).join('')}</div><div class="piano">${whites.map((n) => `<button class="pk w" data-n="${n}"></button>`).join('')}${Object.entries(blacks).map(([n, i]) => `<button class="pk b" data-n="${n}" style="left:calc(${(i + 1) * 10}% - 3.5%)"></button>`).join('')}</div>`;
      body.onpointerdown = (e) => { const k = e.target.closest('[data-n]'); if (!k) return; const a = ac(); ZX.Player.voice(a, 261.63 * Math.pow(2, +k.dataset.n / 12), a.currentTime, .8, st.wave, .18, a.destination); k.classList.add('down'); setTimeout(() => k.classList.remove('down'), 150); };
      body.onclick = (e) => { const w = e.target.closest('[data-w]'); if (w) { st.wave = w.dataset.w; ZX.save(); ZX.render(true); } };
    } else if (kind === 'drums') {
      const pads = [['k', 'Kick'], ['s', 'Snare'], ['h', 'Hi-Hat'], ['k2', 'Tom'], ['s2', 'Clap'], ['h2', 'Shaker'], ['b', 'Bass'], ['z', 'Zap'], ['c', 'Cowbell']];
      body.innerHTML = `<div class="pads">${pads.map(([k, n], i) => `<button class="pad" data-p="${k}" style="--h:${320 + i * 12}">${n}</button>`).join('')}</div>`;
      body.onpointerdown = (e) => {
        const p = e.target.closest('[data-p]'); if (!p) return; const a = ac(), t = a.currentTime, k = p.dataset.p;
        if (k === 'b') ZX.Player.voice(a, 55, t, .5, 'sine', .4, a.destination); else if (k === 'z') { const o = a.createOscillator(), g = a.createGain(); o.frequency.setValueAtTime(1200, t); o.frequency.exponentialRampToValueAtTime(80, t + .3); g.gain.setValueAtTime(.15, t); g.gain.exponentialRampToValueAtTime(.001, t + .3); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + .3); }
        else if (k === 'c') ZX.Player.voice(a, 800, t, .15, 'square', .1, a.destination); else ZX.Player.drum(a, k[0], t, a.destination, k.length > 1 ? .6 : 1);
        p.classList.add('hit'); setTimeout(() => p.classList.remove('hit'), 120);
      };
    } else if (kind === 'metronome') {
      const st = ZX.data(app.id); st.bpm ||= 100;
      body.innerHTML = `<p class="big-clock num" id="mBpm">${st.bpm}</p><p class="s" style="text-align:center">BPM</p><div class="metro" id="mDot"></div><input type="range" class="range" min="40" max="220" value="${st.bpm}" id="mR" /><button class="btn" id="mGo">Start</button>`;
      let on = false, id = null, beat = 0;
      const tick = () => { const a = ac(); ZX.Player.voice(a, beat % 4 ? 880 : 1320, a.currentTime, .05, 'square', .1, a.destination); $('#mDot')?.classList.toggle('alt'); beat++; };
      const run = () => { clearInterval(id); if (on) id = setInterval(tick, 60000 / st.bpm); };
      ZX.live.add(() => clearInterval(id));
      $('#mR').oninput = (e) => { st.bpm = +e.target.value; $('#mBpm').textContent = st.bpm; ZX.save(); run(); };
      $('#mGo').onclick = (e) => { on = !on; e.target.textContent = on ? 'Stopp' : 'Start'; run(); };
    } else if (kind === 'soundboard') {
      const fx = [['Airhorn', (a, t) => [0, .15, .3].forEach((d) => ZX.Player.voice(a, 440, t + d, .12, 'sawtooth', .15, a.destination))], ['Laser', (a, t) => { const o = a.createOscillator(), g = a.createGain(); o.frequency.setValueAtTime(1800, t); o.frequency.exponentialRampToValueAtTime(100, t + .4); g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(.001, t + .4); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + .4); }], ['Tada', (a, t) => [523, 659, 784, 1046].forEach((f, i) => ZX.Player.voice(a, f, t + i * .08, .5, 'triangle', .12, a.destination))], ['Fail', (a, t) => [392, 370, 349, 330].forEach((f, i) => ZX.Player.voice(a, f, t + i * .3, .35, 'sawtooth', .1, a.destination))], ['Ping', (a, t) => ZX.Player.voice(a, 1568, t, .6, 'sine', .15, a.destination)], ['Bass Drop', (a, t) => { const o = a.createOscillator(), g = a.createGain(); o.frequency.setValueAtTime(200, t); o.frequency.exponentialRampToValueAtTime(30, t + 1.2); g.gain.setValueAtTime(.4, t); g.gain.exponentialRampToValueAtTime(.001, t + 1.3); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 1.3); }], ['Sirene', (a, t) => { const o = a.createOscillator(), g = a.createGain(); for (let i = 0; i < 4; i++) { o.frequency.setValueAtTime(700, t + i * .5); o.frequency.linearRampToValueAtTime(1100, t + i * .5 + .25); o.frequency.linearRampToValueAtTime(700, t + i * .5 + .5); } g.gain.value = .08; o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 2); }], ['Applaus', (a, t) => { for (let i = 0; i < 30; i++) ZX.Player.drum(a, 's', t + Math.random() * 1.5, a.destination, .3); }], ['Drumroll', (a, t) => { for (let i = 0; i < 20; i++) ZX.Player.drum(a, 's', t + i * .05, a.destination, .4 + i / 40); ZX.Player.drum(a, 'k', t + 1.05, a.destination); }]];
      body.innerHTML = `<div class="pads">${fx.map(([n], i) => `<button class="pad" data-fx="${i}" style="--h:${300 + i * 15}">${n}</button>`).join('')}</div>`;
      body.onclick = (e) => { const b = e.target.closest('[data-fx]'); if (!b) return; const a = ac(); fx[+b.dataset.fx][1](a, a.currentTime); b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 150); };
    }
  };

  /* ───────── Docs (Gesetzbuch, Regeln, Wiki, Rezepte, Erste Hilfe…) ───────── */
  engines.docs = (app, view, arg) => {
    const doc = (window.ZX_DOCS || {})[app.cfg.doc] || { sections: [] };
    if (view === 'read') {
      const s = doc.sections[arg]; head(s.title, app.name);
      body.innerHTML = `<article class="doc">${s.body.split('\n\n').map((p) => p.startsWith('- ') ? `<ul>${p.split('\n').map((l) => `<li>${esc(l.replace(/^- /, ''))}</li>`).join('')}</ul>` : p.startsWith('## ') ? `<h3>${esc(p.slice(3))}</h3>` : `<p>${esc(p)}</p>`).join('')}</article>
        <div class="trade-btns">${arg > 0 ? '<button class="btn ghost" id="dPrev">‹ Zurück</button>' : '<span></span>'}${arg < doc.sections.length - 1 ? '<button class="btn" id="dNext">Weiter ›</button>' : ''}</div>`;
      $('#dPrev') && ($('#dPrev').onclick = () => { ZX.current.arg = arg - 1; ZX.render(); });
      $('#dNext') && ($('#dNext').onclick = () => { ZX.current.arg = arg + 1; ZX.render(); });
      return;
    }
    head(app.name, doc.tagline || 'Nachschlagen');
    body.innerHTML = `${doc.intro ? `<p class="info-box">${esc(doc.intro)}</p>` : ''}<input class="field search" id="dQ" placeholder="Durchsuchen" autocomplete="off" />
      <ul class="list" id="dL">${doc.sections.map((s, i) => `<li data-q="${esc((s.title + ' ' + s.body).toLowerCase())}"><button class="row" data-s="${i}"><span class="ch-ico">${esc(s.tag || String(i + 1).padStart(2, '0'))}</span><span class="grow"><span class="t">${esc(s.title)}</span><span class="s">${esc(s.body.replace(/[#\-]/g, '').slice(0, 70))}…</span></span></button></li>`).join('')}</ul>`;
    $('#dQ').oninput = (e) => { const q = e.target.value.toLowerCase(); $$('#dL li').forEach((li) => { li.hidden = !li.dataset.q.includes(q); }); };
    body.onclick = (e) => { const b = e.target.closest('[data-s]'); if (b) ZX.go('read', +b.dataset.s); };
  };
  // Daily generated content: horoscope, joke, quote, fact.
  engines.daily = (app) => {
    const d = window.ZX_DAILY || {};
    const kind = app.cfg.kind;
    const day = Math.floor(Date.now() / 864e5);
    head(app.name, new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }));
    if (kind === 'horoscope') {
      const st = ZX.data(app.id);
      const signs = d.signs || [];
      body.innerHTML = `<div class="sign-grid">${signs.map((s, i) => `<button class="${st.sign === i ? 'on' : ''}" data-s="${i}"><b>${s[1]}</b><span>${s[0]}</span></button>`).join('')}</div><div id="hz"></div>`;
      const show = (i) => { const r = ZX.rng(day * 13 + i); const L = d.horo; $('#hz').innerHTML = `<div class="doc"><h3>${signs[i][1]} ${signs[i][0]}</h3><p>${ZX.pick.call(null, [L.mood[Math.floor(r() * L.mood.length)]])} ${L.love[Math.floor(r() * L.love.length)]} ${L.money[Math.floor(r() * L.money.length)]}</p><div class="stats"><div><span>Liebe</span><b>${'★'.repeat(1 + Math.floor(r() * 5))}</b></div><div><span>Geld</span><b>${'★'.repeat(1 + Math.floor(r() * 5))}</b></div><div><span>Glückszahl</span><b>${1 + Math.floor(r() * 99)}</b></div><div><span>Farbe</span><b>${L.colors[Math.floor(r() * L.colors.length)]}</b></div></div></div>`; };
      body.onclick = (e) => { const b = e.target.closest('[data-s]'); if (b) { st.sign = +b.dataset.s; ZX.save(); $$('.sign-grid button').forEach((x) => x.classList.toggle('on', x === b)); show(st.sign); } };
      if (st.sign !== undefined) show(st.sign);
      return;
    }
    const pool = d[kind] || ['—'];
    let i = day % pool.length;
    const draw = () => { body.innerHTML = `<div class="quote-card"><span class="q-mark">“</span><p>${esc(pool[i])}</p></div><div class="trade-btns"><button class="btn ghost" id="qPrev">‹</button><button class="btn" id="qNext">Nächster</button></div><button class="btn ghost" id="qShare">An Kontakt senden</button>`;
      $('#qNext').onclick = () => { i = (i + 1) % pool.length; draw(); }; $('#qPrev').onclick = () => { i = (i - 1 + pool.length) % pool.length; draw(); };
      $('#qShare').onclick = () => { ZX.data('messages').pendingText = pool[i]; ZX.open('messages'); ZX.go('new'); }; };
    draw();
  };

  /* ───────── Quiz ───────── */
  engines.quiz = (app, view) => {
    const set = ((window.ZX_QUIZ || {})[app.cfg.set] || []).slice();
    const bestKey = 'quiz:' + app.id;
    if (view !== 'play') {
      head(app.name, 'Quiz');
      body.innerHTML = `<div class="game-hero"><span class="gh-icon">${ZX.appSvg(app)}</span><b>${esc(app.name)}</b><p class="s">${set.length} Fragen im Pool · 10 pro Runde · 15 s pro Frage</p><p class="best">Bestwert: <b>${ZX.getBest(bestKey) ?? '–'}</b></p><button class="btn" id="qzGo">Starten</button></div>`;
      $('#qzGo').onclick = () => ZX.go('play');
      return;
    }
    head(app.name, 'Läuft');
    const qs = set.sort(() => Math.random() - .5).slice(0, 10);
    let i = 0, score = 0, timer = null;
    const ask = () => {
      if (i >= qs.length) { const nb = ZX.best(bestKey, score); body.innerHTML = `<div class="game-hero"><b>${score} Punkte</b><p class="s">${nb ? 'Neuer Bestwert! 🎉' : 'Bestwert: ' + ZX.getBest(bestKey)}</p><button class="btn" id="qzR">Nochmal</button></div>`; $('#qzR').onclick = () => ZX.render(); return; }
      const q = qs[i]; let left = 15;
      const answers = q.a.map((a, k) => ({ a, k })).sort(() => Math.random() - .5);
      body.innerHTML = `<div class="qz-top"><span class="tag">Frage ${i + 1} / ${qs.length}</span><span class="tag">${score} Punkte</span></div><div class="bar"><i id="qzT" style="width:100%"></i></div><h3 class="qz-q">${esc(q.q)}</h3><div class="qz-a">${answers.map((x) => `<button data-k="${x.k}">${esc(x.a)}</button>`).join('')}</div>`;
      clearInterval(timer);
      timer = setInterval(() => { left -= .1; const t = $('#qzT'); if (t) t.style.width = (left / 15 * 100) + '%'; if (left <= 0) { clearInterval(timer); reveal(-1); } }, 100);
      ZX.live.add(() => clearInterval(timer));
      const reveal = (k) => { clearInterval(timer); $$('.qz-a button').forEach((b) => { b.disabled = true; if (+b.dataset.k === 0) b.classList.add('right'); else if (+b.dataset.k === k) b.classList.add('wrong'); }); if (k === 0) score += 10 + Math.round(left); i++; setTimeout(ask, 1100); };
      body.onclick = (e) => { const b = e.target.closest('[data-k]'); if (b && !b.disabled) reveal(+b.dataset.k); };
    };
    ask();
  };
})();
