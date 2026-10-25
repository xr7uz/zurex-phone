/* Arcade games (canvas): Flappy Z, Blocks, Breakout, Pong, Space Shooter, Stack Tower, Dodge, Aim Trainer, Reaction, Whack, Clicker. */
(() => {
  'use strict';
  const { $, esc } = ZX;
  const G = window.ZX_GAMES;
  const PINK = '#f472b6', AMBER = '#f0a04b', PAPER = '#f2eef0', INK = '#110e10';
  const bg = (g, W, H) => { g.fillStyle = INK; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(242,238,240,.035)'; for (let x = 0; x < W; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } };
  const glow = (g, c, b = 14) => { g.shadowColor = c; g.shadowBlur = b; };
  const ptr = (cv, e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * cv.clientWidth * (cv._W / cv.clientWidth), y: (e.clientY - r.top) / r.height * cv._H }; };
  const mk = (A, root, W, H) => { const [cv, g] = A.canvas(W, H); cv._W = W; cv._H = H; root.appendChild(cv); return [cv, g]; };

  G.flappy = { how: 'Tippen zum Flattern. Fliege durch die Lücken.', play(root, A) {
    const W = 340, H = 480; const [cv, g] = mk(A, root, W, H);
    let y = H / 2, v = 0, pipes = [], t = 0, score = 0, dead = false, started = false;
    const flap = () => { if (dead) return; started = true; v = -6.4; A.beep(740, .05, 'triangle'); };
    cv.addEventListener('pointerdown', flap); A.keys((k) => (k === 'tap' || k === 'up') && flap());
    A.hud('<span class="chip on">Score 0</span>');
    ZX.live.raf(() => {
      if (started && !dead) { v += .34; y += v; t++; if (t % 90 === 0) pipes.push({ x: W, gap: 120 + Math.random() * 220, passed: false }); }
      pipes.forEach((p) => { if (started && !dead) p.x -= 2.4; if (!p.passed && p.x + 52 < 70) { p.passed = true; score++; A.beep(980, .05); A.hud(`<span class="chip on">Score ${score}</span>`); } });
      pipes = pipes.filter((p) => p.x > -60);
      if (y > H - 14 || y < 0 || pipes.some((p) => 70 + 14 > p.x && 70 - 14 < p.x + 52 && (y - 12 < p.gap - 70 || y + 12 > p.gap + 70))) { if (!dead) { dead = true; A.over(score); } }
      bg(g, W, H);
      pipes.forEach((p) => { const grd = g.createLinearGradient(p.x, 0, p.x + 52, 0); grd.addColorStop(0, '#9d174d'); grd.addColorStop(.5, PINK); grd.addColorStop(1, '#9d174d'); g.fillStyle = grd; g.beginPath(); g.roundRect(p.x, -10, 52, p.gap - 60, 10); g.fill(); g.beginPath(); g.roundRect(p.x, p.gap + 70, 52, H, 10); g.fill(); });
      g.save(); g.translate(70, y); g.rotate(Math.max(-.5, Math.min(1, v / 10))); glow(g, PINK); g.fillStyle = '#ffe3f1'; g.font = '700 30px "Dela Gothic One"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Z', 0, 0); g.restore(); g.shadowBlur = 0;
      if (!started) { g.fillStyle = PAPER; g.font = '600 16px "Zen Kaku Gothic New"'; g.textAlign = 'center'; g.fillText('Tippen zum Starten', W / 2, H / 2 + 60); }
      return !dead || undefined;
    });
  } };

  G.blocks = { how: 'Wischen links/rechts, tippen dreht, nach unten wischen lässt fallen.', play(root, A) {
    const C = 20, COLS = 10, ROWS = 20, W = C * COLS, H = C * ROWS; const [cv, g] = mk(A, root, W, H); cv.style.maxWidth = '260px'; cv.style.margin = '0 auto';
    const SH = [[[1, 1, 1, 1]], [[1, 1], [1, 1]], [[0, 1, 0], [1, 1, 1]], [[1, 0, 0], [1, 1, 1]], [[0, 0, 1], [1, 1, 1]], [[1, 1, 0], [0, 1, 1]], [[0, 1, 1], [1, 1, 0]]];
    const COL = ['#5eead4', '#fbbf24', '#c4b5fd', '#60a5fa', '#f0a04b', '#fb7185', '#86efac'];
    const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    let piece, score = 0, lines = 0, dead = false, t = 0, speed = 48;
    const spawn = () => { const i = Math.floor(Math.random() * 7); piece = { m: SH[i], c: i + 1, x: 3, y: 0 }; if (hit(piece.m, piece.x, piece.y)) { dead = true; A.over(score); } };
    const hit = (m, px, py) => m.some((r, y) => r.some((v, x) => v && (px + x < 0 || px + x >= COLS || py + y >= ROWS || (py + y >= 0 && grid[py + y][px + x]))));
    const rot = (m) => m[0].map((_, i) => m.map((r) => r[i]).reverse());
    const lock = () => { piece.m.forEach((r, y) => r.forEach((v, x) => { if (v && piece.y + y >= 0) grid[piece.y + y][piece.x + x] = piece.c; })); let n = 0; for (let y = ROWS - 1; y >= 0; y--) if (grid[y].every(Boolean)) { grid.splice(y, 1); grid.unshift(Array(COLS).fill(0)); n++; y++; } if (n) { lines += n; score += [0, 100, 300, 500, 800][n]; speed = Math.max(10, 48 - lines * 2); A.beep(900, .12, 'triangle'); } A.hud(`<span class="chip on">Score ${score}</span><span class="chip">Reihen ${lines}</span>`); spawn(); };
    const act = (k) => { if (dead) return; if (k === 'left' && !hit(piece.m, piece.x - 1, piece.y)) piece.x--; if (k === 'right' && !hit(piece.m, piece.x + 1, piece.y)) piece.x++; if (k === 'tap' || k === 'up') { const r = rot(piece.m); if (!hit(r, piece.x, piece.y)) piece.m = r; else if (!hit(r, piece.x - 1, piece.y)) { piece.m = r; piece.x--; } } if (k === 'down') { while (!hit(piece.m, piece.x, piece.y + 1)) piece.y++; lock(); } };
    A.swipe(cv, act); A.keys(act); spawn(); A.hud('<span class="chip on">Score 0</span>');
    const cell = (x, y, c) => { g.fillStyle = COL[c - 1]; glow(g, COL[c - 1], 8); g.beginPath(); g.roundRect(x * C + 1, y * C + 1, C - 2, C - 2, 4); g.fill(); g.shadowBlur = 0; };
    ZX.live.raf(() => {
      if (dead) return false;
      if (++t % speed === 0) { if (!hit(piece.m, piece.x, piece.y + 1)) piece.y++; else lock(); }
      bg(g, W, H); grid.forEach((r, y) => r.forEach((v, x) => v && cell(x, y, v)));
      let gy = piece.y; while (!hit(piece.m, piece.x, gy + 1)) gy++;
      piece.m.forEach((r, y) => r.forEach((v, x) => { if (v) { g.strokeStyle = 'rgba(244,114,182,.35)'; g.strokeRect((piece.x + x) * C + 2, (gy + y) * C + 2, C - 4, C - 4); } }));
      piece.m.forEach((r, y) => r.forEach((v, x) => v && cell(piece.x + x, piece.y + y, piece.c)));
    });
  } };

  G.breakout = { how: 'Ziehe das Paddle. Zerstöre alle Steine.', play(root, A) {
    const W = 340, H = 460; const [cv, g] = mk(A, root, W, H);
    let px = W / 2, ball = { x: W / 2, y: H - 60, vx: 3, vy: -4 }, score = 0, lives = 3, level = 1, bricks;
    const build = () => { bricks = []; for (let r = 0; r < 5 + level; r++) for (let c = 0; c < 8; c++) bricks.push({ x: 8 + c * 41, y: 40 + r * 18, a: true, h: 330 + r * 12 }); };
    build();
    cv.addEventListener('pointermove', (e) => { px = Math.max(36, Math.min(W - 36, ptr(cv, e).x)); });
    A.keys((k) => { if (k === 'left') px = Math.max(36, px - 30); if (k === 'right') px = Math.min(W - 36, px + 30); });
    const hud = () => A.hud(`<span class="chip on">Score ${score}</span><span class="chip">Leben ${'♥'.repeat(lives)}</span><span class="chip">Level ${level}</span>`); hud();
    ZX.live.raf(() => {
      ball.x += ball.vx; ball.y += ball.vy;
      if (ball.x < 6 || ball.x > W - 6) ball.vx *= -1; if (ball.y < 6) ball.vy *= -1;
      if (ball.y > H - 30 && ball.y < H - 18 && Math.abs(ball.x - px) < 40 && ball.vy > 0) { ball.vy *= -1; ball.vx = (ball.x - px) / 7; A.beep(500, .04); }
      if (ball.y > H) { lives--; hud(); if (!lives) { A.over(score); return false; } ball = { x: px, y: H - 60, vx: 3, vy: -4 - level * .3 }; }
      for (const b of bricks) if (b.a && ball.x > b.x && ball.x < b.x + 37 && ball.y > b.y && ball.y < b.y + 14) { b.a = false; ball.vy *= -1; score += 10; A.beep(800 + Math.random() * 200, .04); hud(); break; }
      if (bricks.every((b) => !b.a)) { level++; build(); ball = { x: px, y: H - 60, vx: 3, vy: -4 - level * .3 }; hud(); }
      bg(g, W, H);
      bricks.forEach((b) => { if (!b.a) return; g.fillStyle = `hsl(${b.h} 75% 62%)`; g.beginPath(); g.roundRect(b.x, b.y, 37, 14, 4); g.fill(); });
      glow(g, PINK); g.fillStyle = PINK; g.beginPath(); g.roundRect(px - 36, H - 24, 72, 10, 5); g.fill();
      g.fillStyle = PAPER; g.beginPath(); g.arc(ball.x, ball.y, 6, 0, 7); g.fill(); g.shadowBlur = 0;
    });
  } };

  G.pong = { how: 'Ziehe dein Paddle. Erster mit 7 Punkten gewinnt.', play(root, A) {
    const W = 340, H = 480; const [cv, g] = mk(A, root, W, H);
    let me = W / 2, ai = W / 2, b = { x: W / 2, y: H / 2, vx: 2.5, vy: 4 }, s1 = 0, s2 = 0;
    cv.addEventListener('pointermove', (e) => { me = Math.max(35, Math.min(W - 35, ptr(cv, e).x)); });
    A.keys((k) => { if (k === 'left') me -= 30; if (k === 'right') me += 30; });
    const reset = (dir) => { b = { x: W / 2, y: H / 2, vx: (Math.random() - .5) * 5, vy: 4 * dir }; };
    ZX.live.raf(() => {
      b.x += b.vx; b.y += b.vy; if (b.x < 6 || b.x > W - 6) b.vx *= -1;
      ai += Math.max(-3.4, Math.min(3.4, b.x - ai));
      if (b.y > H - 26 && Math.abs(b.x - me) < 38 && b.vy > 0) { b.vy = -Math.abs(b.vy) * 1.04; b.vx = (b.x - me) / 6; A.beep(520, .04); }
      if (b.y < 26 && Math.abs(b.x - ai) < 38 && b.vy < 0) { b.vy = Math.abs(b.vy) * 1.04; b.vx = (b.x - ai) / 6; A.beep(420, .04); }
      if (b.y > H) { s2++; reset(-1); } if (b.y < 0) { s1++; A.beep(900, .1); reset(1); }
      A.hud(`<span class="chip on">Du ${s1}</span><span class="chip">KI ${s2}</span>`);
      if (s1 >= 7 || s2 >= 7) { A.over(s1, `Punkte · ${s1 >= 7 ? 'Sieg' : 'Niederlage'} ${s1}:${s2}`); return false; }
      bg(g, W, H); g.setLineDash([6, 8]); g.strokeStyle = 'rgba(242,238,240,.15)'; g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke(); g.setLineDash([]);
      glow(g, PINK); g.fillStyle = PINK; g.beginPath(); g.roundRect(me - 34, H - 20, 68, 8, 4); g.fill();
      glow(g, AMBER); g.fillStyle = AMBER; g.beginPath(); g.roundRect(ai - 34, 12, 68, 8, 4); g.fill();
      glow(g, PAPER); g.fillStyle = PAPER; g.beginPath(); g.arc(b.x, b.y, 6, 0, 7); g.fill(); g.shadowBlur = 0;
    });
  } };

  G.space = { how: 'Ziehe dein Schiff, es schießt automatisch.', play(root, A) {
    const W = 340, H = 500; const [cv, g] = mk(A, root, W, H);
    let sx = W / 2, shots = [], foes = [], stars = Array.from({ length: 50 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 2 + .5 })), t = 0, score = 0, hp = 3;
    cv.addEventListener('pointermove', (e) => { sx = Math.max(16, Math.min(W - 16, ptr(cv, e).x)); });
    A.keys((k) => { if (k === 'left') sx -= 24; if (k === 'right') sx += 24; });
    const hud = () => A.hud(`<span class="chip on">Score ${score}</span><span class="chip">Schild ${'■'.repeat(hp)}</span>`); hud();
    ZX.live.raf(() => {
      t++; if (t % 12 === 0) { shots.push({ x: sx, y: H - 50 }); A.beep(1200, .02, 'square', .015); }
      if (t % Math.max(14, 40 - Math.floor(score / 100)) === 0) foes.push({ x: 20 + Math.random() * (W - 40), y: -20, v: 1.5 + Math.random() * 2 + score / 600, hp: 1 + (Math.random() < .2) });
      shots.forEach((s) => { s.y -= 8; }); foes.forEach((f) => { f.y += f.v; });
      for (const f of foes) for (const s of shots) if (!s.dead && Math.abs(s.x - f.x) < 16 && Math.abs(s.y - f.y) < 16) { s.dead = true; if (--f.hp <= 0) { f.dead = true; score += 10; A.beep(300, .06, 'sawtooth'); hud(); } }
      for (const f of foes) if (!f.dead && f.y > H - 60 && Math.abs(f.x - sx) < 22) { f.dead = true; hp--; A.beep(120, .2, 'sawtooth', .08); hud(); }
      foes.forEach((f) => { if (f.y > H + 20) f.dead = true; });
      shots = shots.filter((s) => !s.dead && s.y > -10); foes = foes.filter((f) => !f.dead);
      if (hp <= 0) { A.over(score); return false; }
      g.fillStyle = '#07050a'; g.fillRect(0, 0, W, H); stars.forEach((s) => { s.y = (s.y + s.s) % H; g.fillStyle = `rgba(255,255,255,${s.s / 3})`; g.fillRect(s.x, s.y, s.s, s.s); });
      glow(g, PINK, 10); g.fillStyle = PINK; shots.forEach((s) => g.fillRect(s.x - 1.5, s.y, 3, 10));
      foes.forEach((f) => { glow(g, f.hp > 1 ? AMBER : '#c4b5fd'); g.fillStyle = f.hp > 1 ? AMBER : '#c4b5fd'; g.beginPath(); g.moveTo(f.x, f.y + 12); g.lineTo(f.x - 13, f.y - 8); g.lineTo(f.x, f.y - 2); g.lineTo(f.x + 13, f.y - 8); g.closePath(); g.fill(); });
      glow(g, PAPER); g.fillStyle = PAPER; g.beginPath(); g.moveTo(sx, H - 62); g.lineTo(sx - 15, H - 32); g.lineTo(sx, H - 40); g.lineTo(sx + 15, H - 32); g.closePath(); g.fill(); g.shadowBlur = 0;
      g.fillStyle = 'rgba(240,160,75,.8)'; g.fillRect(sx - 3, H - 36, 6, 6 + Math.random() * 6);
    });
  } };

  G.stack = { how: 'Tippen, um den Block zu setzen. Baue so hoch wie möglich.', play(root, A) {
    const W = 340, H = 500; const [cv, g] = mk(A, root, W, H);
    let tower = [{ x: 70, w: 200 }], cur = { x: 0, w: 200, dir: 1 }, score = 0, dead = false, speed = 2.4, cam = 0;
    const place = () => {
      if (dead) return; const top = tower[tower.length - 1];
      const l = Math.max(top.x, cur.x), r = Math.min(top.x + top.w, cur.x + cur.w);
      if (r - l <= 0) { dead = true; A.over(score); return; }
      const perfect = Math.abs(cur.x - top.x) < 4;
      tower.push(perfect ? { x: top.x, w: top.w } : { x: l, w: r - l }); score++; A.beep(perfect ? 1200 : 400 + score * 20, .08, 'triangle');
      cur = { x: cur.dir > 0 ? -tower[tower.length - 1].w : W, w: tower[tower.length - 1].w, dir: -cur.dir }; speed += .12;
      A.hud(`<span class="chip on">Höhe ${score}</span>${perfect ? '<span class="chip">Perfekt!</span>' : ''}`);
    };
    cv.addEventListener('pointerdown', place); A.keys((k) => k === 'tap' && place());
    A.hud('<span class="chip on">Höhe 0</span>');
    ZX.live.raf(() => {
      if (!dead) { cur.x += speed * cur.dir; if (cur.x > W) cur.dir = -1; if (cur.x + cur.w < 0) cur.dir = 1; }
      cam += ((Math.max(0, tower.length - 10) * 22) - cam) * .1;
      bg(g, W, H);
      tower.forEach((b, i) => { const y = H - 30 - i * 22 + cam; g.fillStyle = `hsl(${330 + i * 6} 75% ${45 + (i % 6) * 4}%)`; g.beginPath(); g.roundRect(b.x, y, b.w, 20, 4); g.fill(); });
      if (!dead) { const y = H - 30 - tower.length * 22 + cam; glow(g, PINK); g.fillStyle = '#ffe3f1'; g.beginPath(); g.roundRect(cur.x, y, cur.w, 20, 4); g.fill(); g.shadowBlur = 0; }
      return !dead || undefined;
    });
  } };

  G.dodge = { how: 'Weiche den fallenden Blöcken aus. Ziehe nach links und rechts.', play(root, A) {
    const W = 340, H = 480; const [cv, g] = mk(A, root, W, H);
    let x = W / 2, rocks = [], t = 0, score = 0, dead = false;
    cv.addEventListener('pointermove', (e) => { x = Math.max(14, Math.min(W - 14, ptr(cv, e).x)); });
    A.keys((k) => { if (k === 'left') x -= 26; if (k === 'right') x += 26; });
    ZX.live.raf(() => {
      if (dead) return false; t++; score = Math.floor(t / 6);
      if (t % Math.max(8, 26 - Math.floor(t / 400)) === 0) rocks.push({ x: Math.random() * W, y: -20, s: 12 + Math.random() * 22, v: 3 + Math.random() * 2 + t / 900 });
      rocks.forEach((r) => { r.y += r.v; }); rocks = rocks.filter((r) => r.y < H + 40);
      if (rocks.some((r) => Math.abs(r.x - x) < r.s / 2 + 10 && Math.abs(r.y - (H - 40)) < r.s / 2 + 10)) { dead = true; A.over(score); return false; }
      A.hud(`<span class="chip on">${score} Punkte</span>`);
      bg(g, W, H); rocks.forEach((r) => { g.fillStyle = AMBER; glow(g, AMBER, 8); g.beginPath(); g.roundRect(r.x - r.s / 2, r.y - r.s / 2, r.s, r.s, 5); g.fill(); });
      glow(g, PINK); g.fillStyle = PINK; g.beginPath(); g.arc(x, H - 40, 12, 0, 7); g.fill(); g.shadowBlur = 0;
    });
  } };

  G.aim = { how: '30 Sekunden: Triff so viele Ziele wie möglich.', play(root, A) {
    const W = 340, H = 460; const [cv, g] = mk(A, root, W, H);
    let tg = null, hits = 0, miss = 0, end = performance.now() + 30000;
    const spawn = () => { tg = { x: 30 + Math.random() * (W - 60), y: 30 + Math.random() * (H - 60), r: 26, born: performance.now() }; };
    spawn();
    cv.addEventListener('pointerdown', (e) => { const p = ptr(cv, e); if (tg && Math.hypot(p.x - tg.x, p.y - tg.y) < tg.r) { hits++; A.beep(1000, .04); spawn(); } else { miss++; A.beep(150, .06); } });
    ZX.live.raf((now) => {
      const left = Math.max(0, (end - now) / 1000);
      A.hud(`<span class="chip on">Treffer ${hits}</span><span class="chip">${left.toFixed(1)} s</span><span class="chip">Quote ${hits + miss ? Math.round(hits / (hits + miss) * 100) : 100}%</span>`);
      if (left <= 0) { A.over(hits, 'Treffer'); return false; }
      bg(g, W, H); const r = tg.r * Math.max(.4, 1 - (now - tg.born) / 2500);
      [r, r * .66, r * .33].forEach((rr, i) => { g.fillStyle = i % 2 ? PAPER : PINK; glow(g, PINK, i ? 0 : 14); g.beginPath(); g.arc(tg.x, tg.y, rr, 0, 7); g.fill(); }); g.shadowBlur = 0;
      if (r <= tg.r * .4) { miss++; spawn(); }
    });
  } };

  G.reaction = { how: 'Warte, bis der Bildschirm pink wird, dann tippe so schnell du kannst.', play(root, A) {
    root.innerHTML = '<button class="react-pad" id="rp"><b>Warte …</b><span>Tippe, wenn es pink wird</span></button>';
    const rp = $('#rp'); let state = 'wait', start = 0, times = [];
    const arm = () => { state = 'wait'; rp.className = 'react-pad'; rp.innerHTML = '<b>Warte …</b><span>Tippe, wenn es pink wird</span>'; ZX.live.timeout(() => { state = 'go'; start = performance.now(); rp.className = 'react-pad go'; rp.innerHTML = '<b>JETZT!</b>'; A.beep(880); }, 1200 + Math.random() * 2800); };
    rp.onclick = () => {
      if (state === 'wait') { state = 'early'; rp.className = 'react-pad early'; rp.innerHTML = '<b>Zu früh!</b><span>Tippe zum Neustart</span>'; ZX.live.add(() => {}); return; }
      if (state === 'early') return arm();
      if (state === 'go') { const ms = Math.round(performance.now() - start); times.push(ms); state = 'done'; rp.className = 'react-pad'; rp.innerHTML = `<b>${ms} ms</b><span>Runde ${times.length}/5 · tippen für weiter</span>`; A.hud(times.map((x) => `<span class="chip">${x}</span>`).join('')); if (times.length === 5) { const avg = Math.round(times.reduce((s, x) => s + x, 0) / 5); A.over(avg, 'ms Ø', true); } return; }
      if (state === 'done' && times.length < 5) arm();
    };
    arm();
  } };

  G.whack = { how: 'Hau die Maulwürfe, bevor sie verschwinden. 30 Sekunden.', play(root, A) {
    root.innerHTML = `<div class="whack">${Array.from({ length: 9 }, (_, i) => `<button data-h="${i}"><svg class="mole" viewBox="0 0 40 40"><ellipse cx="20" cy="26" rx="15" ry="16" fill="#7c4a2d"/><ellipse cx="20" cy="30" rx="9" ry="8" fill="#a8714b"/><circle cx="14" cy="20" r="2.2" fill="#0b080a"/><circle cx="26" cy="20" r="2.2" fill="#0b080a"/><circle cx="14.7" cy="19.3" r=".7" fill="#fff"/><circle cx="26.7" cy="19.3" r=".7" fill="#fff"/><ellipse cx="20" cy="25" rx="3.4" ry="2.4" fill="#f472b6"/><rect x="18" y="28" width="1.8" height="2.6" rx=".4" fill="#fff"/><rect x="20.2" y="28" width="1.8" height="2.6" rx=".4" fill="#fff"/></svg></button>`).join('')}</div>`;
    let score = 0, end = Date.now() + 30000;
    const holes = [...root.querySelectorAll('[data-h]')];
    ZX.live.interval(() => {
      const left = Math.max(0, Math.round((end - Date.now()) / 1000));
      A.hud(`<span class="chip on">Treffer ${score}</span><span class="chip">${left} s</span>`);
      if (left <= 0) { holes.forEach((h) => h.classList.remove('up')); A.over(score, 'Treffer'); return; }
      const h = holes[Math.floor(Math.random() * 9)]; if (h.classList.contains('up')) return;
      h.classList.add('up'); setTimeout(() => h.classList.remove('up'), 700 + Math.random() * 500);
    }, 420);
    root.onclick = (e) => { const h = e.target.closest('[data-h]'); if (h && h.classList.contains('up') && Date.now() < end) { h.classList.remove('up'); h.classList.add('hit'); setTimeout(() => h.classList.remove('hit'), 200); score++; A.beep(700, .05); } };
  } };

  G.clicker = { instant: true, how: 'Tippe für Geld, kaufe Upgrades, werde reich. Läuft auch weiter, wenn du weg bist.', play(root, A) {
    const st = ZX.data('g:clicker'); st.cash ??= 0; st.per ??= 1; st.ps ??= 0; st.last ??= Date.now(); st.up ??= {};
    const offline = Math.min(8 * 3600, (Date.now() - st.last) / 1000); st.cash += offline * st.ps; st.last = Date.now();
    const UPS = [['Tipp-Kraft', 'per', 1, 15], ['Straßenstand', 'ps', 1, 50], ['Food Truck', 'ps', 6, 400], ['Werkstatt', 'ps', 30, 3000], ['Nachtclub', 'ps', 160, 25000], ['Bankfiliale', 'ps', 900, 220000], ['Zurex Tower', 'ps', 6000, 2e6]];
    const cost = (i) => Math.round(UPS[i][3] * Math.pow(1.15, st.up[i] || 0));
    const fmt = (n) => n >= 1e6 ? ZX.num(n / 1e6, 2) + ' Mio.' : Math.floor(n).toLocaleString('de-DE');
    const draw = () => {
      root.innerHTML = `<div class="clicker"><p class="ck-cash">${fmt(st.cash)} €</p><p class="s" style="text-align:center">${fmt(st.ps)} € / Sek · ${fmt(st.per)} € / Tipp</p><button class="ck-btn" id="ck">${ZX.logo()}</button>
        <ul class="list">${UPS.map(([n, k, v], i) => `<li><button class="row" data-u="${i}" ${st.cash < cost(i) ? 'disabled' : ''}><span class="grow"><span class="t">${n} <span class="s">×${st.up[i] || 0}</span></span><span class="s">+${fmt(v)} € ${k === 'per' ? 'pro Tipp' : '/ Sek'}</span></span><span class="chip ${st.cash >= cost(i) ? 'on' : ''}">${fmt(cost(i))} €</span></button></li>`).join('')}</ul></div>`;
    };
    draw();
    root.onclick = (e) => {
      if (e.target.closest('#ck')) { st.cash += st.per; A.beep(600 + Math.random() * 200, .03, 'sine', .03); const b = $('#ck'); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); $('.ck-cash').textContent = fmt(st.cash) + ' €'; ZX.save(); return; }
      const u = e.target.closest('[data-u]'); if (u) { const i = +u.dataset.u; if (st.cash < cost(i)) return; st.cash -= cost(i); st.up[i] = (st.up[i] || 0) + 1; st[UPS[i][1]] += UPS[i][2]; A.beep(1000, .08, 'triangle'); A.submit(Math.floor(st.ps)); ZX.save(); draw(); }
    };
    ZX.live.interval(() => { st.cash += st.ps / 10; st.last = Date.now(); const c = $('.ck-cash'); if (c) c.textContent = fmt(st.cash) + ' €'; $$('[data-u]', root).forEach((b) => { b.disabled = st.cash < cost(+b.dataset.u); }); }, 100);
    ZX.live.interval(() => ZX.save(), 3000);
  } };
  const $$ = ZX.$$;
  void esc;
})();
