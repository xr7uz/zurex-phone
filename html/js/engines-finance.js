/* Finance engines: instrument list, broker (Tradr/Coinz/Fondz/Rohstoffe) and the candlestick chart (Chartview/FX Pro). */
(() => {
  'use strict';
  const { $, $$, esc, svg, money, ago, engines, body, Market } = ZX;
  const head = (...a) => ZX.head(...a);

  // Instruments. server.lua carries the same list (Config.Market); prices there are authoritative ingame.
  window.ZX_MARKET = [
    ['ZRX', 'Zurex Technologies', 'stock', 42.10, 2, 0.004], ['MZB', 'Maze Bank', 'stock', 118.40, 2, 0.002], ['FLC', 'Fleeca Group', 'stock', 64.25, 2, 0.0025],
    ['LFI', 'Lifeinvader', 'stock', 211.90, 2, 0.004], ['BGS', 'Burger Shot', 'stock', 23.80, 2, 0.003], ['CLK', "Cluckin' Bell", 'stock', 17.45, 2, 0.003],
    ['PSW', 'Pisswasser Brewing', 'stock', 31.60, 2, 0.002], ['GOP', 'GoPostal Logistics', 'stock', 48.70, 2, 0.002], ['WZL', 'Weazel Media', 'stock', 56.10, 2, 0.003],
    ['AMU', 'Ammu-Nation', 'stock', 88.30, 2, 0.003], ['VNL', 'Vinewood Labs', 'stock', 132.50, 2, 0.005], ['MRS', 'Merryweather Sec.', 'stock', 97.20, 2, 0.0035],
    ['BTC', 'Bitcoin', 'crypto', 67420, 0, 0.003], ['ETH', 'Ethereum', 'crypto', 3480, 1, 0.0035], ['SOL', 'Solana', 'crypto', 168.4, 2, 0.005],
    ['DOGE', 'Dogecoin', 'crypto', 0.162, 4, 0.006], ['ZXC', 'Zurex Coin', 'crypto', 4.21, 3, 0.008], ['XRP', 'XRP', 'crypto', 0.58, 4, 0.005],
    ['EURUSD', 'Euro / US-Dollar', 'fx', 1.0842, 4, 0.0006], ['GBPJPY', 'Pfund / Yen', 'fx', 191.42, 2, 0.0009], ['USDJPY', 'US-Dollar / Yen', 'fx', 151.30, 2, 0.0007], ['EURGBP', 'Euro / Pfund', 'fx', 0.8521, 4, 0.0005],
    ['XAU', 'Gold', 'commodity', 2351.6, 1, 0.0012], ['XAG', 'Silber', 'commodity', 29.84, 2, 0.002], ['OIL', 'Rohöl WTI', 'commodity', 78.35, 2, 0.002], ['GAS', 'Erdgas', 'commodity', 2.41, 3, 0.004],
    ['LS500', 'Los Santos 500', 'etf', 5320.4, 1, 0.0008], ['WORLD', 'MSCI San Andreas World', 'etf', 104.2, 2, 0.0007], ['TECH', 'Vinewood Tech ETF', 'etf', 61.3, 2, 0.0012], ['DIVI', 'Dividenden Aristokraten', 'etf', 38.9, 2, 0.0006],
  ].map(([sym, name, kind, px, dp, vol]) => ({ sym, name, kind, px, dp, vol }));

  /* ───────── Candlestick chart (canvas) ───────── */
  const TF = [['1m', 1], ['5m', 3], ['15m', 6], ['1h', 12]];
  const sma = (a, n) => a.map((_, i) => i < n - 1 ? null : a.slice(i - n + 1, i + 1).reduce((s, v) => s + v, 0) / n);
  const ema = (a, n) => { const k = 2 / (n + 1); let e = a[0]; return a.map((v, i) => (e = i ? v * k + e * (1 - k) : v)); };
  function rsi(a, n = 14) {
    const out = [null]; let g = 0, l = 0;
    for (let i = 1; i < a.length; i++) {
      const d = a[i] - a[i - 1];
      if (i <= n) { g += Math.max(d, 0); l += Math.max(-d, 0); out.push(i === n ? 100 - 100 / (1 + g / (l || 1e-9)) : null); }
      else { g = (g * (n - 1) + Math.max(d, 0)) / n; l = (l * (n - 1) + Math.max(-d, 0)) / n; out.push(100 - 100 / (1 + g / (l || 1e-9))); }
    }
    return out;
  }
  function aggregate(candles, k) {
    if (k === 1) return candles;
    const out = [];
    for (let i = 0; i < candles.length; i += k) { const g = candles.slice(i, i + k); out.push({ o: g[0].o, c: g[g.length - 1].c, h: Math.max(...g.map((c) => c.h)), l: Math.min(...g.map((c) => c.l)), t: g[0].t }); }
    return out;
  }
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  function drawChart(canvas, m, st, cross) {
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth, Hh = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = Hh * dpr;
    const g = canvas.getContext('2d'); g.scale(dpr, dpr);
    const k = (TF.find((t) => t[0] === st.tf) || TF[0])[1];
    let cs = aggregate(m.candles, k);
    const visible = Math.max(20, Math.min(cs.length, st.zoom || 60));
    cs = cs.slice(-visible);
    const closes = cs.map((c) => c.c);
    const showRsi = st.ind.includes('rsi');
    const priceH = showRsi ? Hh * 0.72 : Hh - 18, axisW = 58;
    const hi = Math.max(...cs.map((c) => c.h)), lo = Math.min(...cs.map((c) => c.l));
    const padP = (hi - lo) * 0.08 || hi * 0.01;
    const top = hi + padP, bot = lo - padP;
    const y = (p) => 6 + (top - p) / (top - bot) * (priceH - 12);
    const cw = (W - axisW) / cs.length;
    const x = (i) => i * cw + cw / 2;
    const grid = css('--ink-700') || '#2e272b', txt = css('--paper-3') || '#9c8f96', up = css('--gain') || '#f9a8d4', dn = css('--loss') || '#f0a04b';
    g.fillStyle = css('--ink-900') || '#110e10'; g.fillRect(0, 0, W, Hh);
    g.font = '10px "Zen Kaku Gothic New", sans-serif'; g.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) { const p = bot + (top - bot) * i / 4; const yy = y(p); g.strokeStyle = grid; g.lineWidth = 1; g.setLineDash([2, 4]); g.beginPath(); g.moveTo(0, yy); g.lineTo(W - axisW, yy); g.stroke(); g.setLineDash([]); g.fillStyle = txt; g.fillText(Market.fmt(m, p), W - axisW + 6, yy); }
    // Indicators under candles
    const line = (vals, color, w = 1.4) => { g.strokeStyle = color; g.lineWidth = w; g.beginPath(); let s = false; vals.forEach((v, i) => { if (v == null) return; s ? g.lineTo(x(i), y(v)) : g.moveTo(x(i), y(v)); s = true; }); g.stroke(); };
    if (st.ind.includes('bb')) { const mid = sma(closes, 20); const sd = closes.map((_, i) => i < 19 ? null : Math.sqrt(closes.slice(i - 19, i + 1).reduce((s, v) => s + (v - mid[i]) ** 2, 0) / 20)); g.globalAlpha = .6; line(mid.map((v, i) => v == null ? null : v + 2 * sd[i]), '#8b7cf6', 1); line(mid.map((v, i) => v == null ? null : v - 2 * sd[i]), '#8b7cf6', 1); g.globalAlpha = 1; }
    if (st.ind.includes('sma')) line(sma(closes, 20), '#5eead4');
    if (st.ind.includes('ema')) line(ema(closes, 50 > closes.length ? 9 : 50), '#fbbf24');
    // Candles or line
    if (st.type === 'line') { const grd = g.createLinearGradient(0, 0, 0, priceH); grd.addColorStop(0, 'rgba(244,114,182,.35)'); grd.addColorStop(1, 'rgba(244,114,182,0)'); g.beginPath(); closes.forEach((c, i) => i ? g.lineTo(x(i), y(c)) : g.moveTo(x(i), y(c))); g.lineTo(x(cs.length - 1), priceH); g.lineTo(x(0), priceH); g.fillStyle = grd; g.fill(); line(closes, css('--signal'), 2); }
    else cs.forEach((c, i) => { const col = c.c >= c.o ? up : dn; g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 1; g.beginPath(); g.moveTo(x(i), y(c.h)); g.lineTo(x(i), y(c.l)); g.stroke(); const bw = Math.max(1.5, cw * 0.62); const y1 = y(Math.max(c.o, c.c)), y2 = y(Math.min(c.o, c.c)); g.fillRect(x(i) - bw / 2, y1, bw, Math.max(1, y2 - y1)); });
    // Alerts / levels
    (st.levels || []).forEach((lv) => { if (lv < bot || lv > top) return; g.strokeStyle = css('--signal'); g.setLineDash([6, 4]); g.beginPath(); g.moveTo(0, y(lv)); g.lineTo(W - axisW, y(lv)); g.stroke(); g.setLineDash([]); g.fillStyle = css('--signal'); g.fillRect(W - axisW, y(lv) - 8, axisW, 16); g.fillStyle = '#0b080a'; g.fillText(Market.fmt(m, lv), W - axisW + 4, y(lv)); });
    // Last price tag
    const ly = y(m.px); g.fillStyle = m.px >= cs[cs.length - 1].o ? up : dn; g.fillRect(W - axisW, ly - 8, axisW, 16); g.fillStyle = '#0b080a'; g.fillText(Market.fmt(m), W - axisW + 4, ly);
    g.strokeStyle = g.fillStyle = m.px >= cs[cs.length - 1].o ? up : dn; g.globalAlpha = .5; g.setLineDash([1, 3]); g.beginPath(); g.moveTo(0, ly); g.lineTo(W - axisW, ly); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    // RSI pane
    if (showRsi) {
      const r = rsi(closes), ry0 = priceH + 8, rh = Hh - ry0 - 16, ry = (v) => ry0 + (100 - v) / 100 * rh;
      g.strokeStyle = grid; g.strokeRect(0, ry0, W - axisW, rh);
      [30, 70].forEach((v) => { g.setLineDash([2, 3]); g.beginPath(); g.moveTo(0, ry(v)); g.lineTo(W - axisW, ry(v)); g.stroke(); g.setLineDash([]); g.fillStyle = txt; g.fillText(v, W - axisW + 6, ry(v)); });
      g.strokeStyle = '#c4b5fd'; g.lineWidth = 1.3; g.beginPath(); let s = false; r.forEach((v, i) => { if (v == null) return; s ? g.lineTo(x(i), ry(v)) : g.moveTo(x(i), ry(v)); s = true; }); g.stroke();
      g.fillStyle = txt; g.fillText('RSI 14', 4, ry0 + 8);
    }
    // Crosshair
    if (cross) {
      const i = Math.max(0, Math.min(cs.length - 1, Math.floor(cross.x / cw))); const c = cs[i];
      g.strokeStyle = 'rgba(242,238,240,.35)'; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(x(i), 0); g.lineTo(x(i), Hh); g.moveTo(0, cross.y); g.lineTo(W - axisW, cross.y); g.stroke(); g.setLineDash([]);
      const p = top - (cross.y - 6) / (priceH - 12) * (top - bot);
      if (cross.y < priceH) { g.fillStyle = '#f2eef0'; g.fillRect(W - axisW, cross.y - 8, axisW, 16); g.fillStyle = '#0b080a'; g.fillText(Market.fmt(m, p), W - axisW + 4, cross.y); }
      return { c, p };
    }
    return null;
  }

  // Chart view: used by Chartview, FX Pro and the Pulse/Tradr instrument detail.
  engines.chartView = (app, sym, isLive, opts = {}) => {
    const m = Market.get(sym); if (!m) { body.innerHTML = '<p class="empty">Symbol nicht gefunden.</p>'; return; }
    const st = ZX.data('chart:' + app.id); st.tf ||= '1m'; st.ind ||= ['sma']; st.type ||= 'candle'; st.alerts ||= {}; st.zoom ||= 60;
    st.levels = st.alerts[sym] || [];
    const ch = Market.change(m), upv = ch >= 0;
    if (isLive && $('#chartCanvas')) {
      $('#chPx').textContent = Market.fmt(m); $('#chCh').className = `pill ${upv ? 'gain' : 'loss'}`; $('#chCh').textContent = `${upv ? '+' : ''}${ch.toFixed(2)}%`;
      if (!st.crossOn) drawChart($('#chartCanvas'), m, st);
      return;
    }
    head(m.sym, m.name, opts.action || '');
    body.innerHTML = `<div class="ch-top"><div><p class="ch-px num" id="chPx">${Market.fmt(m)}</p><span id="chCh" class="pill ${upv ? 'gain' : 'loss'}">${upv ? '+' : ''}${ch.toFixed(2)}%</span> <span class="s" id="chOhlc"></span></div></div>
      <div class="ch-tools"><div class="seg mini" id="chTf">${TF.map(([t]) => `<button data-tf="${t}" class="${st.tf === t ? 'on' : ''}">${t}</button>`).join('')}</div><button class="chip ${st.type === 'line' ? 'on' : ''}" id="chType">${st.type === 'line' ? 'Linie' : 'Kerzen'}</button></div>
      <canvas class="chart-canvas ${opts.tall ? 'tall' : ''}" id="chartCanvas"></canvas>
      <div class="chips" id="chInd">${[['sma', 'SMA 20'], ['ema', 'EMA 50'], ['bb', 'Bollinger'], ['rsi', 'RSI']].map(([k, n]) => `<button class="chip ${st.ind.includes(k) ? 'on' : ''}" data-ind="${k}">${n}</button>`).join('')}<button class="chip" id="chZin">＋</button><button class="chip" id="chZout">－</button></div>
      <div class="alert-box"><div class="row"><span class="grow"><span class="t">Preisalarme</span><span class="s">Tippe lange auf den Chart, um eine Linie zu setzen.</span></span></div>
      <div id="chAlerts">${st.levels.map((l, i) => `<span class="chip on">${Market.fmt(m, l)} <button data-rm="${i}">✕</button></span>`).join('') || '<span class="s">Keine Alarme</span>'}</div></div>
      ${opts.below || ''}`;
    const cv = $('#chartCanvas');
    const redraw = () => drawChart(cv, m, st);
    requestAnimationFrame(redraw);
    $('#chTf').onclick = (e) => { const b = e.target.closest('[data-tf]'); if (!b) return; st.tf = b.dataset.tf; ZX.save(); $$('#chTf button').forEach((x) => x.classList.toggle('on', x === b)); redraw(); };
    $('#chType').onclick = (e) => { st.type = st.type === 'line' ? 'candle' : 'line'; e.target.textContent = st.type === 'line' ? 'Linie' : 'Kerzen'; e.target.classList.toggle('on'); ZX.save(); redraw(); };
    $('#chInd').onclick = (e) => {
      if (e.target.id === 'chZin') { st.zoom = Math.max(20, st.zoom - 15); return redraw(); }
      if (e.target.id === 'chZout') { st.zoom = Math.min(240, st.zoom + 15); return redraw(); }
      const b = e.target.closest('[data-ind]'); if (!b) return; const k = b.dataset.ind; st.ind = st.ind.includes(k) ? st.ind.filter((x) => x !== k) : [...st.ind, k]; b.classList.toggle('on'); ZX.save(); redraw();
    };
    $('#chAlerts').onclick = (e) => { const b = e.target.closest('[data-rm]'); if (!b) return; st.levels.splice(+b.dataset.rm, 1); st.alerts[sym] = st.levels; ZX.save(); ZX.render(); };
    let press = null;
    const pt = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * (cv.clientWidth / r.width), y: (e.clientY - r.top) * (cv.clientHeight / r.height) }; };
    cv.onpointerdown = (e) => {
      st.crossOn = true; cv.setPointerCapture(e.pointerId);
      const p0 = pt(e);
      const res = drawChart(cv, m, st, p0); showOhlc(res);
      press = setTimeout(() => { if (!res) return; st.levels.push(res.p); st.alerts[sym] = st.levels; ZX.save(); ZX.chime(); ZX.render(); }, 650);
    };
    cv.onpointermove = (e) => { if (!st.crossOn) return; clearTimeout(press); showOhlc(drawChart(cv, m, st, pt(e))); };
    cv.onpointerup = cv.onpointercancel = () => { clearTimeout(press); st.crossOn = false; $('#chOhlc').textContent = ''; redraw(); };
    function showOhlc(res) { if (res && res.c) $('#chOhlc').textContent = `O ${Market.fmt(m, res.c.o)}  H ${Market.fmt(m, res.c.h)}  L ${Market.fmt(m, res.c.l)}  C ${Market.fmt(m, res.c.c)}`; }
    ZX.live.on(window, 'resize', redraw);
  };
  // Price alerts fire app-wide, even while the chart is closed.
  Market.on(() => {
    for (const key of Object.keys(ZX.S.data || {})) {
      if (!key.startsWith('chart:')) continue;
      const st = ZX.S.data[key]; const appId = key.slice(6);
      for (const [sym, levels] of Object.entries(st.alerts || {})) {
        const m = Market.get(sym); if (!m || !levels.length || m.hist.length < 2) continue;
        const prev = m.hist[m.hist.length - 2];
        levels.forEach((l, i) => { if ((prev < l && m.px >= l) || (prev > l && m.px <= l)) { ZX.notify(appId, `Preisalarm ${sym}`, `${m.name} hat ${Market.fmt(m, l)} gekreuzt`, () => { ZX.open(appId); ZX.go('chart', sym); }, appId); levels.splice(i, 1); ZX.save(); } });
      }
    }
  });

  /* ───────── Chartview / FX Pro ───────── */
  engines.chart = (app, view, arg, isLive) => {
    const cfg = app.cfg || {};
    if (!isLive) { const off = Market.on(() => ZX.render(true)); ZX.live.add(off); }
    if (view === 'chart' || cfg.single) return engines.chartView(app, arg || ZX.data(app.id).last || cfg.default || 'BTC', isLive, { tall: true });
    if (isLive) { $$('#cvList [data-sym]').forEach((b) => { const m = Market.get(b.dataset.sym); const ch = Market.change(m); b.querySelector('.px b').textContent = Market.fmt(m); const p = b.querySelector('.pill'); p.textContent = `${ch >= 0 ? '+' : ''}${ch.toFixed(2)}%`; p.className = `pill ${ch >= 0 ? 'gain' : 'loss'}`; }); return; }
    head(app.name, cfg.tagline || 'Watchlist');
    const kinds = cfg.kinds || ['stock', 'crypto', 'fx', 'commodity', 'etf'];
    const list = Market.list().filter((m) => kinds.includes(m.kind));
    body.innerHTML = `<input class="field search" id="cvQ" placeholder="Symbol suchen" autocomplete="off" /><ul class="list" id="cvList">${list.map(ZX.instRow).join('')}</ul>`;
    $('#cvQ').oninput = (e) => { const q = e.target.value.toLowerCase(); $$('#cvList li').forEach((li) => { li.hidden = !li.textContent.toLowerCase().includes(q); }); };
    body.onclick = (e) => { const b = e.target.closest('[data-sym]'); if (b) { ZX.data(app.id).last = b.dataset.sym; ZX.go('chart', b.dataset.sym); } };
  };

  /* ───────── Broker (Tradr, Coinz, Fondz, Rohstoffe) ───────── */
  engines.broker = async (app, view, arg, isLive) => {
    const cfg = app.cfg || {};
    const kinds = cfg.kinds || ['stock'];
    if (!isLive) { const off = Market.on(() => ZX.render(true)); ZX.live.add(off); }
    if (view === 'inst') {
      const m = Market.get(arg);
      return engines.chartView(app, arg, isLive, { action: '', below: isLive ? '' : `<div class="trade-btns"><button class="btn ghost" id="tSell">Verkaufen</button><button class="btn" id="tBuy">Kaufen</button></div><div id="tPos"></div>` }), !isLive && bindTrade(app, m);
    }
    if (view === 'orders') {
      head('Orderhistorie', app.name);
      const r = await ZX.rpc('broker.portfolio');
      const orders = ((r && r.orders) || []).filter((o) => kinds.includes(Market.get(o.sym)?.kind));
      body.innerHTML = orders.length ? `<ul class="list">${orders.map((o) => `<li class="row"><span class="sym-badge" style="--h:${[...o.sym].reduce((s, c) => s + c.charCodeAt(0), 0) % 360}">${esc(o.sym.slice(0, 3))}</span><span class="grow"><span class="t">${o.side === 'buy' ? 'Kauf' : 'Verkauf'} · ${ZX.num(o.qty, o.qty % 1 ? 4 : 0)} ${esc(o.sym)}</span><span class="s">zu ${Market.fmt(Market.get(o.sym) || { dp: 2 }, o.px)} · ${ago(o.t)}</span></span><span class="amt ${o.side === 'buy' ? 'loss' : 'gain'}">${o.side === 'buy' ? '−' : '+'}${money(o.px * o.qty)}</span></li>`).join('')}</ul>` : '<p class="empty">Noch keine Orders.</p>';
      return;
    }
    const r = await ZX.rpc('broker.portfolio');
    if (ZX.current?.id !== app.id || ZX.current.view) return;
    const holdings = Object.entries((r && r.holdings) || {}).filter(([s]) => kinds.includes(Market.get(s)?.kind));
    const value = holdings.reduce((s, [sym, h]) => s + (Market.get(sym)?.px || 0) * h.qty, 0);
    const cost = holdings.reduce((s, [, h]) => s + h.avg * h.qty, 0);
    const pnl = value - cost, pnlPct = cost ? pnl / cost * 100 : 0;
    if (isLive && $('#bkVal')) {
      $('#bkVal').textContent = money(value); $('#bkPnl').className = pnl >= 0 ? 'gain' : 'loss'; $('#bkPnl').textContent = `${pnl >= 0 ? '+' : '−'}${money(Math.abs(pnl))} (${pnlPct.toFixed(2)}%)`;
      $$('#bkList [data-sym]').forEach((b) => { const m = Market.get(b.dataset.sym); const ch = Market.change(m); b.querySelector('.px b').textContent = Market.fmt(m); const p = b.querySelector('.pill'); p.textContent = `${ch >= 0 ? '+' : ''}${ch.toFixed(2)}%`; p.className = `pill ${ch >= 0 ? 'gain' : 'loss'}`; });
      return;
    }
    head(app.name, cfg.tagline || 'Depot', '<button type="button" id="bkOrders">Orders</button>');
    $('#bkOrders').onclick = () => ZX.go('orders');
    const tab = ZX.data(app.id).tab || 'depot';
    const list = Market.list().filter((m) => kinds.includes(m.kind));
    body.innerHTML = `<div class="pf-hero"><span class="tag">${esc(cfg.valueLabel || 'Depotwert')}</span><p class="pf-val num" id="bkVal">${money(value)}</p><p id="bkPnl" class="${pnl >= 0 ? 'gain' : 'loss'}">${pnl >= 0 ? '+' : '−'}${money(Math.abs(pnl))} (${pnlPct.toFixed(2)}%)</p>
        <div class="pf-cash"><span>Verfügbar</span><b>${money(ZX.S.bank.balance)}</b></div></div>
      <div class="seg" id="bkTab"><button data-t="depot" class="${tab === 'depot' ? 'on' : ''}">Depot</button><button data-t="markt" class="${tab === 'markt' ? 'on' : ''}">${esc(cfg.marketLabel || 'Markt')}</button></div>
      ${tab === 'depot'
        ? (holdings.length ? `<ul class="list" id="bkHold">${holdings.map(([sym, h]) => { const m = Market.get(sym); const v = m.px * h.qty, pl = (m.px - h.avg) / h.avg * 100; return `<li><button class="row" data-sym="${sym}"><span class="sym-badge" style="--h:${[...sym].reduce((s, c) => s + c.charCodeAt(0), 0) % 360}">${esc(sym.slice(0, 3))}</span><span class="grow"><span class="t">${esc(m.name)}</span><span class="s">${ZX.num(h.qty, h.qty % 1 ? 4 : 0)} Stk. · Ø ${Market.fmt(m, h.avg)}</span></span><span class="px"><b>${money(v)}</b><span class="pill ${pl >= 0 ? 'gain' : 'loss'}">${pl >= 0 ? '+' : ''}${pl.toFixed(2)}%</span></span></button></li>`; }).join('')}</ul>` : `<p class="empty">Dein Depot ist leer.<br>Wechsle zu „${esc(cfg.marketLabel || 'Markt')}“ und kaufe deine erste Position.</p>`)
        : `<ul class="list" id="bkList">${list.map(ZX.instRow).join('')}</ul>`}
      <p class="disclaimer">Simulierter Markt für Rollenspiel. Ordergebühr 1 €.</p>`;
    body.onclick = (e) => { const t = e.target.closest('[data-t]'); if (t) { ZX.data(app.id).tab = t.dataset.t; return ZX.render(); } const b = e.target.closest('[data-sym]'); if (b) ZX.go('inst', b.dataset.sym); };
  };
  async function bindTrade(app, m) {
    const r = await ZX.rpc('broker.portfolio');
    const h = (r && r.holdings && r.holdings[m.sym]) || { qty: 0, avg: 0 };
    const pos = $('#tPos');
    if (pos) pos.innerHTML = h.qty ? `<div class="stats"><div><span>Position</span><b>${ZX.num(h.qty, h.qty % 1 ? 4 : 0)} Stk.</b></div><div><span>Wert</span><b>${money(h.qty * m.px)}</b></div><div><span>Einstand</span><b>${Market.fmt(m, h.avg)}</b></div><div><span>G/V</span><b class="${m.px >= h.avg ? 'gain' : 'loss'}">${((m.px - h.avg) / h.avg * 100).toFixed(2)}%</b></div></div>` : '';
    const open = (side) => {
      const sheet = document.createElement('div'); sheet.className = 'sheet';
      const frac = m.kind === 'crypto' || m.kind === 'etf';
      sheet.innerHTML = `<div class="sheet-card"><div class="sheet-head"><b>${side === 'buy' ? 'Kaufen' : 'Verkaufen'} · ${esc(m.sym)}</b><button class="x" data-x>✕</button></div>
        <div class="seg mini" id="tMode"><button data-m="eur" class="on">Betrag in €</button><button data-m="qty">Stückzahl</button></div>
        <input class="field num amount" id="tAmt" inputmode="decimal" placeholder="0" autocomplete="off" />
        <div class="chips">${(side === 'buy' ? [50, 100, 500, 1000] : [25, 50, 100]).map((v) => `<button class="chip" data-q="${v}">${side === 'buy' ? money(v) : v + '%'}</button>`).join('')}</div>
        <div class="stats"><div><span>Kurs</span><b id="tPx">${Market.fmt(m)}</b></div><div><span>Stück</span><b id="tQty">0</b></div><div><span>Gebühr</span><b>1,00 €</b></div><div><span>Gesamt</span><b id="tTot">0,00 €</b></div></div>
        <p class="err" id="tErr"></p><button class="btn ${side === 'sell' ? 'ghost' : ''}" id="tGo">${side === 'buy' ? 'Kauf' : 'Verkauf'} bestätigen</button></div>`;
      $('#screen').appendChild(sheet);
      let mode = 'eur';
      const qty = () => { const v = parseFloat($('#tAmt', sheet).value.replace(',', '.')) || 0; let q = mode === 'eur' ? v / m.px : v; if (!frac) q = Math.floor(q); return Math.floor(q * 1e4) / 1e4; };
      const upd = () => { const q = qty(); $('#tQty', sheet).textContent = ZX.num(q, frac ? 4 : 0); $('#tTot', sheet).textContent = money(q * m.px + (q ? (side === 'buy' ? 1 : -1) : 0)); $('#tPx', sheet).textContent = Market.fmt(m); };
      $('#tAmt', sheet).oninput = upd;
      sheet.onclick = async (e) => {
        if (e.target === sheet || e.target.closest('[data-x]')) return sheet.remove();
        const mb = e.target.closest('[data-m]'); if (mb) { mode = mb.dataset.m; $$('[data-m]', sheet).forEach((x) => x.classList.toggle('on', x === mb)); return upd(); }
        const qb = e.target.closest('[data-q]');
        if (qb) { const v = +qb.dataset.q; if (side === 'buy') { mode = 'eur'; $('#tAmt', sheet).value = v; } else { mode = 'qty'; $('#tAmt', sheet).value = String(Math.floor(h.qty * v / 100 * 1e4) / 1e4); } $$('[data-m]', sheet).forEach((x) => x.classList.toggle('on', x.dataset.m === mode)); return upd(); }
        if (e.target.closest('#tGo')) {
          const q = qty(); if (!(q > 0)) return void ($('#tErr', sheet).textContent = 'Menge eingeben.');
          const res = await ZX.rpc('broker.trade', { sym: m.sym, qty: q, side });
          if (!res || !res.ok) return void ($('#tErr', sheet).textContent = (res && res.error) || 'Order abgelehnt.');
          if (typeof res.balance === 'number' && ZX.isNui) { ZX.S.bank.balance = res.balance; ZX.S.bank.tx.unshift({ id: ZX.uid(), label: app.name, note: `${side === 'buy' ? 'Kauf' : 'Verkauf'} ${q} ${m.sym}`, amount: (side === 'buy' ? -1 : 1) * q * res.px, t: Date.now() }); ZX.save(); }
          sheet.remove(); ZX.notify(app.id, 'Order ausgeführt', `${side === 'buy' ? 'Kauf' : 'Verkauf'} ${ZX.num(q, frac ? 4 : 0)} ${m.sym} zu ${Market.fmt(m, res.px)}`); bindTrade(app, m);
        }
      };
      setTimeout(() => $('#tAmt', sheet).focus(), 50);
    };
    $('#tBuy') && ($('#tBuy').onclick = () => open('buy'));
    $('#tSell') && ($('#tSell').onclick = () => { if (!h.qty) return ZX.notify(app.id, 'Keine Position', `Du hältst kein ${m.sym}.`); open('sell'); });
  }
})();
