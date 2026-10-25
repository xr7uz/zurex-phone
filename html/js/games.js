/* Games + casino. engines.game dispatches to window.ZX_GAMES[cfg.game]; each game gets (root, api). */
(() => {
  'use strict';
  const { $, $$, esc, svg, engines, body } = ZX;
  const G = window.ZX_GAMES = {};

  /* Shared API: canvas helper, score/best, game-over overlay, casino chips, sounds. */
  function api(app) {
    const id = app.cfg.game;
    const a = {
      best: () => ZX.getBest('g:' + id),
      submit: (score, lower) => ZX.best('g:' + id, score, lower),
      canvas(w, h) { const c = document.createElement('canvas'); const dpr = window.devicePixelRatio || 1; c.width = w * dpr; c.height = h * dpr; c.className = 'game-canvas'; c.style.aspectRatio = `${w}/${h}`; const g = c.getContext('2d'); g.scale(dpr, dpr); return [c, g]; },
      beep(f = 660, d = .08, type = 'square', v = .05) { if (!ZX.S.sound) return; const ac = ZX.audio(); if (!ac) return; const o = ac.createOscillator(), gn = ac.createGain(); o.type = type; o.frequency.value = f; o.connect(gn); gn.connect(ac.destination); gn.gain.setValueAtTime(v, ac.currentTime); gn.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + d); o.start(); o.stop(ac.currentTime + d + .02); },
      over(score, label = 'Punkte', lower = false) {
        const nb = a.submit(score, lower);
        const ov = document.createElement('div'); ov.className = 'game-over';
        ov.innerHTML = `<b>${esc(String(score))}</b><span>${esc(label)}</span><p>${nb ? 'Neuer Rekord! 🎉' : 'Rekord: ' + esc(String(a.best() ?? '–'))}</p><button class="btn" data-again>Nochmal</button>`;
        $('#gameRoot').appendChild(ov);
        ov.querySelector('[data-again]').onclick = () => ZX.render();
        a.beep(nb ? 880 : 220, .3, 'triangle', .08);
      },
      hud(html) { const h = $('#gameHud'); if (h) h.innerHTML = html; },
      chips: { get: () => casino().chips, add(n) { const c = casino(); c.chips = Math.max(0, Math.round(c.chips + n)); ZX.save(); a.hud(chipsHud()); return c.chips; } },
      swipe(el, fn) { let x0, y0; el.addEventListener('pointerdown', (e) => { x0 = e.clientX; y0 = e.clientY; }); el.addEventListener('pointerup', (e) => { if (x0 == null) return; const dx = e.clientX - x0, dy = e.clientY - y0; x0 = null; if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return fn('tap'); fn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); }); },
      keys(fn) { ZX.live.on(document, 'keydown', (e) => { const k = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', ' ': 'tap' }[e.key]; if (k) { e.preventDefault(); fn(k); } }); },
    };
    return a;
  }
  // Casino chips: play money only. 1.000 free chips per day.
  function casino() {
    const cfg = ZX.casinoCfg || {}, daily = cfg.dailyChips || 1000;
    const c = ZX.data('casino'); if (c.chips === undefined) c.chips = cfg.startChips || daily;
    const d = ZX.ymd(new Date()); if (c.daily !== d && c.chips < daily) { c.daily = d; c.chips += daily; ZX.save(); }
    return c;
  }
  const chipsHud = () => `<span class="chip on">🪙 ${casino().chips.toLocaleString('de-DE')} Chips</span>`;

  engines.game = (app, view) => {
    const g = G[app.cfg.game];
    const A = api(app);
    if (!g) { ZX.head(app.name, 'Games'); body.innerHTML = '<p class="empty">Dieses Spiel wird gerade installiert …</p>'; return; }
    if (view !== 'play' && !g.instant) {
      ZX.head(app.name, app.cfg.casino ? 'Casino' : 'Games');
      body.innerHTML = `<div class="game-hero"><span class="gh-icon">${ZX.appSvg(app)}</span><b>${esc(app.name)}</b><p class="s">${esc(g.how || '')}</p>
        ${app.cfg.casino ? chipsHud() : `<p class="best">Rekord: <b>${esc(String(A.best() ?? '–'))}</b></p>`}<button class="btn" id="gPlay">Spielen</button>
        ${app.cfg.casino ? '<p class="disclaimer">Nur Spielgeld. Täglich 1.000 Gratis-Chips.</p>' : ''}</div>`;
      $('#gPlay').onclick = () => ZX.go('play');
      return;
    }
    ZX.head(app.name, app.cfg.casino ? 'Casino' : 'Läuft');
    body.innerHTML = `<div class="game-hud" id="gameHud">${app.cfg.casino ? chipsHud() : ''}</div><div class="game-root" id="gameRoot"></div>`;
    g.play($('#gameRoot'), A, app);
  };

  /* ───────── Snake ───────── */
  G.snake = { how: 'Wischen oder Pfeiltasten. Friss die Punkte, beiß dich nicht.', play(root, A) {
    const N = 18, W = 340, C = W / N; const [cv, g] = A.canvas(W, W); root.appendChild(cv);
    let snake = [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }], dir = { x: 1, y: 0 }, next = dir, food = place(), score = 0, dead = false, t = 0, speed = 130;
    function place() { let p; do { p = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) }; } while (snake && snake.some((s) => s.x === p.x && s.y === p.y)); return p; }
    const turn = (d) => { const m = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[d]; if (m && (m[0] !== -dir.x || m[1] !== -dir.y)) next = { x: m[0], y: m[1] }; };
    A.swipe(cv, turn); A.keys(turn);
    A.hud(`<span class="chip on">Score 0</span>`);
    ZX.live.raf((now) => {
      if (dead) return false;
      if (now - t > speed) {
        t = now; dir = next;
        const h = { x: (snake[0].x + dir.x + N) % N, y: (snake[0].y + dir.y + N) % N };
        if (snake.some((s) => s.x === h.x && s.y === h.y)) { dead = true; A.over(score); return false; }
        snake.unshift(h);
        if (h.x === food.x && h.y === food.y) { score++; food = place(); speed = Math.max(60, speed - 3); A.beep(880); A.hud(`<span class="chip on">Score ${score}</span>`); } else snake.pop();
      }
      g.fillStyle = '#110e10'; g.fillRect(0, 0, W, W);
      g.strokeStyle = 'rgba(242,238,240,.04)'; for (let i = 0; i <= N; i++) { g.beginPath(); g.moveTo(i * C, 0); g.lineTo(i * C, W); g.moveTo(0, i * C); g.lineTo(W, i * C); g.stroke(); }
      g.fillStyle = '#f0a04b'; g.shadowColor = '#f0a04b'; g.shadowBlur = 12; g.beginPath(); g.arc(food.x * C + C / 2, food.y * C + C / 2, C / 2.6, 0, 7); g.fill(); g.shadowBlur = 0;
      snake.forEach((s, i) => { g.fillStyle = i ? `hsl(330 ${80 - i}% ${70 - i * .6}%)` : '#ffe3f1'; g.beginPath(); g.roundRect(s.x * C + 1.5, s.y * C + 1.5, C - 3, C - 3, 5); g.fill(); });
    });
  } };

  /* ───────── 2048 ───────── */
  G.g2048 = { how: 'Wische, um Kacheln zu verschieben. Gleiche Zahlen verschmelzen.', play(root, A) {
    let b = Array(16).fill(0), score = 0;
    const add = () => { const e = b.map((v, i) => v ? -1 : i).filter((i) => i >= 0); if (e.length) b[e[Math.floor(Math.random() * e.length)]] = Math.random() < .9 ? 2 : 4; };
    add(); add();
    root.innerHTML = '<div class="g2048" id="gb"></div>';
    const draw = () => { $('#gb').innerHTML = b.map((v) => `<div class="t2 v${Math.min(v, 4096)}">${v || ''}</div>`).join(''); A.hud(`<span class="chip on">Score ${score}</span><span class="chip">Rekord ${A.best() ?? 0}</span>`); };
    const move = (d) => {
      let moved = false;
      for (let i = 0; i < 4; i++) {
        const idx = [0, 1, 2, 3].map((j) => d === 'left' ? i * 4 + j : d === 'right' ? i * 4 + 3 - j : d === 'up' ? j * 4 + i : (3 - j) * 4 + i);
        let line = idx.map((k) => b[k]).filter(Boolean);
        for (let j = 0; j < line.length - 1; j++) if (line[j] === line[j + 1]) { line[j] *= 2; score += line[j]; line.splice(j + 1, 1); }
        while (line.length < 4) line.push(0);
        idx.forEach((k, j) => { if (b[k] !== line[j]) moved = true; b[k] = line[j]; });
      }
      if (moved) { add(); A.beep(520, .05); draw(); }
      const stuck = !b.includes(0) && b.every((v, k) => (k % 4 === 3 || v !== b[k + 1]) && (k > 11 || v !== b[k + 4]));
      if (stuck) A.over(score);
    };
    A.swipe(root, (d) => d !== 'tap' && move(d)); A.keys((d) => d !== 'tap' && move(d)); draw();
  } };

  /* ───────── Tic Tac Toe (vs. CPU) ───────── */
  G.tictactoe = { how: 'Drei in einer Reihe gegen die Zurex-KI.', play(root, A) {
    let b = Array(9).fill(''), over = false;
    const st = ZX.data('g:ttt'); st.w ||= 0; st.l ||= 0; st.d ||= 0;
    const L = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    const win = (p) => L.find((l) => l.every((i) => p[i] && p[i] === p[l[0]]));
    function best(p, me) { const w = win(p); if (w) return { s: p[w[0]] === 'O' ? 10 : -10 }; if (!p.includes('')) return { s: 0 }; let bestM = { s: me === 'O' ? -99 : 99 }; p.forEach((v, i) => { if (v) return; p[i] = me; const r = best(p, me === 'O' ? 'X' : 'O'); p[i] = ''; if (me === 'O' ? r.s > bestM.s : r.s < bestM.s) bestM = { s: r.s, i }; }); return bestM; }
    const draw = (msg = 'Du bist X') => { root.innerHTML = `<p class="g-msg">${msg}</p><div class="ttt">${b.map((v, i) => `<button data-i="${i}" class="${v}">${v}</button>`).join('')}</div><div class="stats"><div><span>Siege</span><b>${st.w}</b></div><div><span>Niederlagen</span><b>${st.l}</b></div></div>${over ? '<button class="btn" id="tttR">Neue Runde</button>' : ''}`; $('#tttR') && ($('#tttR').onclick = () => { b = Array(9).fill(''); over = false; draw(); }); };
    const end = () => { const w = win(b); if (w) { over = true; if (b[w[0]] === 'X') { st.w++; A.submit(st.w); draw('Gewonnen! 🎉'); } else { st.l++; draw('Die KI gewinnt.'); } ZX.save(); return true; } if (!b.includes('')) { over = true; st.d++; ZX.save(); draw('Unentschieden.'); return true; } return false; };
    root.onclick = (e) => { const c = e.target.closest('[data-i]'); if (!c || over || b[c.dataset.i]) return; b[c.dataset.i] = 'X'; A.beep(660); if (end()) return; const m = Math.random() < .15 ? { i: b.map((v, i) => v ? -1 : i).filter((i) => i >= 0)[0] } : best(b, 'O'); b[m.i] = 'O'; setTimeout(() => { A.beep(440); if (!end()) draw(); }, 250); draw('KI denkt …'); };
    draw();
  } };
})();
