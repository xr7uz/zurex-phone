/* Puzzle + board games and the casino (play-money chips). */
(() => {
  'use strict';
  const { $, $$, esc } = ZX;
  const G = window.ZX_GAMES;
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const timer = (A, label = 's') => { const t0 = Date.now(); ZX.live.interval(() => { const h = $('#tmr'); if (h) h.textContent = Math.floor((Date.now() - t0) / 1000) + ' ' + label; }, 250); return () => Math.round((Date.now() - t0) / 1000); };

  G.minesweeper = { how: 'Tippen deckt auf, langes Drücken setzt eine Flagge.', play(root, A) {
    const N = 9, M = 10; let cells, opened = 0, over = false, first = true;
    const elapsed = timer(A); A.hud(`<span class="chip on">💣 ${M}</span><span class="chip" id="tmr">0 s</span>`);
    cells = Array.from({ length: N * N }, (_, i) => ({ i, mine: false, n: 0, open: false, flag: false }));
    const nb = (i) => { const x = i % N, y = Math.floor(i / N), r = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < N && Y < N) r.push(Y * N + X); } return r; };
    const lay = (safe) => { const pool = shuffle(cells.filter((c) => c.i !== safe && !nb(safe).includes(c.i))); pool.slice(0, M).forEach((c) => { c.mine = true; }); cells.forEach((c) => { c.n = nb(c.i).filter((j) => cells[j].mine).length; }); };
    root.innerHTML = `<div class="mines" style="--n:${N}">${cells.map((c) => `<button data-i="${c.i}"></button>`).join('')}</div>`;
    const btn = (i) => root.querySelector(`[data-i="${i}"]`);
    const open = (i) => { const c = cells[i]; if (c.open || c.flag) return; c.open = true; opened++; const b = btn(i); b.classList.add('open'); if (c.mine) { b.textContent = '💥'; return lose(); } if (c.n) { b.textContent = c.n; b.dataset.n = c.n; } else nb(i).forEach(open); };
    const lose = () => { over = true; cells.forEach((c) => { if (c.mine) btn(c.i).textContent = '💣'; }); A.beep(120, .4, 'sawtooth', .08); setTimeout(() => A.over(opened, 'Felder'), 600); };
    let press = null, longed = false;
    root.onpointerdown = (e) => { const b = e.target.closest('[data-i]'); if (!b || over) return; longed = false; press = setTimeout(() => { longed = true; const c = cells[b.dataset.i]; if (c.open) return; c.flag = !c.flag; b.textContent = c.flag ? '🚩' : ''; A.beep(500, .04); }, 380); };
    root.onpointerup = (e) => { clearTimeout(press); const b = e.target.closest('[data-i]'); if (!b || over || longed) return; const i = +b.dataset.i; if (first) { lay(i); first = false; } open(i); A.beep(700, .02); if (!over && opened === N * N - M) { over = true; A.over(elapsed(), 'Sekunden', true); } };
  } };

  G.memory = { how: 'Finde alle Paare mit möglichst wenigen Zügen.', play(root, A) {
    const icons = ['heart', 'car', 'bolt', 'headphones', 'sun', 'fire', 'ghost', 'coin'];
    const deck = shuffle([...icons, ...icons]); let open = [], found = 0, moves = 0, lock = false;
    root.innerHTML = `<div class="memory">${deck.map((e, i) => `<button data-i="${i}"><span class="mf">${ZX.logo()}</span><span class="mb">${ZX.svg(e)}</span></button>`).join('')}</div>`;
    root.onclick = (ev) => {
      const b = ev.target.closest('[data-i]'); if (!b || lock || b.classList.contains('flip')) return;
      b.classList.add('flip'); open.push(b); A.beep(600, .03);
      if (open.length === 2) { moves++; A.hud(`<span class="chip on">Züge ${moves}</span><span class="chip">Paare ${found}/8</span>`); const [x, y] = open; if (deck[x.dataset.i] === deck[y.dataset.i]) { found++; open = []; x.classList.add('done'); y.classList.add('done'); A.beep(990, .1, 'triangle'); if (found === 8) setTimeout(() => A.over(moves, 'Züge', true), 400); } else { lock = true; setTimeout(() => { x.classList.remove('flip'); y.classList.remove('flip'); open = []; lock = false; }, 750); } }
    };
    A.hud('<span class="chip on">Züge 0</span>');
  } };

  G.simon = { how: 'Merke dir die Farbfolge und spiele sie nach.', play(root, A) {
    const F = [523, 659, 784, 1047]; let seq = [], idx = 0, input = false;
    root.innerHTML = `<div class="simon">${[0, 1, 2, 3].map((i) => `<button data-s="${i}"></button>`).join('')}<span class="simon-c" id="sc">0</span></div>`;
    const pads = $$('[data-s]', root);
    const flash = (i) => { pads[i].classList.add('lit'); A.beep(F[i], .3, 'triangle', .08); setTimeout(() => pads[i].classList.remove('lit'), 300); };
    const next = () => { input = false; seq.push(Math.floor(Math.random() * 4)); $('#sc').textContent = seq.length - 1; seq.forEach((s, k) => ZX.live.timeout(() => flash(s), 600 + k * 520)); ZX.live.timeout(() => { input = true; idx = 0; }, 600 + seq.length * 520); };
    root.onclick = (e) => { const p = e.target.closest('[data-s]'); if (!p || !input) return; const i = +p.dataset.s; flash(i); if (i !== seq[idx]) { input = false; A.over(seq.length - 1, 'Runden'); return; } if (++idx === seq.length) { input = false; ZX.live.timeout(next, 700); } };
    next();
  } };

  G.kniffel = { how: 'Bis zu 3 Würfe, Würfel antippen zum Halten, dann Kategorie wählen.', play(root, A) {
    const CAT = [['Einser', (d) => sum(d, 1)], ['Zweier', (d) => sum(d, 2)], ['Dreier', (d) => sum(d, 3)], ['Vierer', (d) => sum(d, 4)], ['Fünfer', (d) => sum(d, 5)], ['Sechser', (d) => sum(d, 6)], ['Dreierpasch', (d) => kind(d, 3) ? tot(d) : 0], ['Viererpasch', (d) => kind(d, 4) ? tot(d) : 0], ['Full House', (d) => { const c = cnt(d); return c.includes(3) && c.includes(2) ? 25 : 0; }], ['Kl. Straße', (d) => str(d, 4) ? 30 : 0], ['Gr. Straße', (d) => str(d, 5) ? 40 : 0], ['Kniffel', (d) => kind(d, 5) ? 50 : 0], ['Chance', tot]];
    function sum(d, n) { return d.filter((x) => x === n).length * n; } function tot(d) { return d.reduce((s, x) => s + x, 0); } function cnt(d) { return [1, 2, 3, 4, 5, 6].map((n) => d.filter((x) => x === n).length); } function kind(d, n) { return cnt(d).some((c) => c >= n); } function str(d, n) { const u = [...new Set(d)].sort().join(''); return n === 4 ? /1234|2345|3456/.test(u) : /12345|23456/.test(u); }
    let dice = [1, 1, 1, 1, 1], hold = [0, 0, 0, 0, 0], rolls = 0, score = {};
    const draw = () => {
      const total = Object.values(score).reduce((s, v) => s + v, 0) + (CAT.slice(0, 6).reduce((s, [n]) => s + (score[n] || 0), 0) >= 63 ? 35 : 0);
      root.innerHTML = `<div class="dice-row">${dice.map((d, i) => `<button class="die ${hold[i] ? 'held' : ''}" data-d="${i}">${rolls ? '⚀⚁⚂⚃⚄⚅'[d - 1] : '?'}</button>`).join('')}</div>
        <button class="btn" id="kRoll" ${rolls >= 3 ? 'disabled' : ''}>Würfeln (${3 - rolls})</button>
        <ul class="list kn">${CAT.map(([n, f]) => `<li><button class="row" data-c="${n}" ${score[n] !== undefined || !rolls ? 'disabled' : ''}><span class="grow t">${n}</span><b class="${score[n] !== undefined ? '' : 'hint'}">${score[n] !== undefined ? score[n] : rolls ? f(dice) : ''}</b></button></li>`).join('')}</ul>`;
      A.hud(`<span class="chip on">Gesamt ${total}</span>`);
      if (Object.keys(score).length === CAT.length) A.over(total);
    };
    root.onclick = (e) => {
      if (e.target.closest('#kRoll')) { dice = dice.map((d, i) => hold[i] ? d : 1 + Math.floor(Math.random() * 6)); rolls++; A.beep(400, .05); return draw(); }
      const d = e.target.closest('[data-d]'); if (d && rolls && rolls < 3) { hold[+d.dataset.d] ^= 1; return draw(); }
      const c = e.target.closest('[data-c]'); if (c && !c.disabled) { const f = CAT.find((x) => x[0] === c.dataset.c)[1]; score[c.dataset.c] = f(dice); rolls = 0; hold = [0, 0, 0, 0, 0]; A.beep(800, .08, 'triangle'); draw(); }
    };
    draw();
  } };

  const WORDS5 = ['AUTOS', 'BLAUE', 'DACHS', 'FAHRT', 'GELDE', 'HAFEN', 'INSEL', 'JACKE', 'KARTE', 'LAMPE', 'MAUER', 'NACHT', 'OSTEN', 'PALME', 'QUARK', 'RADIO', 'SONNE', 'TAXIS', 'UFERN', 'VOGEL', 'WAGEN', 'ZEBRA', 'BRÜCK', 'STADT', 'STERN', 'TRAUM', 'BLITZ', 'DRIFT', 'MOTOR', 'PIZZA', 'GOLDE', 'STRAND', 'WOLKE', 'KREUZ', 'FUCHS', 'TIGER', 'HONIG', 'BIRNE', 'APFEL', 'MANGO', 'LIMIT', 'NEBEL', 'REGEN', 'BERGE', 'FLUSS', 'WELLE', 'BOOTE', 'PIRAT', 'KLANG', 'BÜHNE'].filter((w) => w.length === 5);
  G.wortel = { how: 'Errate das 5-Buchstaben-Wort in 6 Versuchen.', play(root, A) {
    const word = WORDS5[Math.floor(Math.random() * WORDS5.length)]; const rows = []; let cur = '';
    const KB = ['QWERTZUIOPÜ', 'ASDFGHJKLÖÄ', '↵YXCVBNM⌫'];
    const state = {};
    const draw = () => {
      root.innerHTML = `<div class="wordle">${Array.from({ length: 6 }, (_, r) => { const g = rows[r] || (r === rows.length ? cur.padEnd(5) : '     '); return `<div class="wr">${[...g.word || g].map((ch, i) => `<span class="${rows[r] ? rows[r].res[i] : ''}">${ch.trim()}</span>`).join('')}</div>`; }).join('')}</div>
        <div class="kb">${KB.map((row) => `<div>${[...row].map((k) => `<button data-k="${k}" class="${state[k] || ''} ${k === '↵' || k === '⌫' ? 'wide' : ''}">${k}</button>`).join('')}</div>`).join('')}</div>`;
    };
    const submit = () => {
      if (cur.length < 5) return;
      const res = Array(5).fill('miss'), w = [...word];
      [...cur].forEach((c, i) => { if (c === w[i]) { res[i] = 'hit'; w[i] = null; } });
      [...cur].forEach((c, i) => { if (res[i] !== 'hit') { const j = w.indexOf(c); if (j >= 0) { res[i] = 'near'; w[j] = null; } } });
      [...cur].forEach((c, i) => { const rank = { hit: 3, near: 2, miss: 1 }; if (!state[c] || rank[res[i]] > rank[state[c]]) state[c] = res[i]; });
      rows.push({ word: cur, res }); cur = ''; A.beep(res.every((x) => x === 'hit') ? 990 : 500, .08);
      draw();
      if (res.every((x) => x === 'hit')) A.over(7 - rows.length, 'Punkte');
      else if (rows.length === 6) { A.over(0, `Das Wort war ${word}`); }
    };
    root.onclick = (e) => { const k = e.target.closest('[data-k]')?.dataset.k; if (!k) return; if (k === '↵') return submit(); if (k === '⌫') cur = cur.slice(0, -1); else if (cur.length < 5) cur += k; draw(); };
    ZX.live.on(document, 'keydown', (e) => { if (e.key === 'Enter') submit(); else if (e.key === 'Backspace') { cur = cur.slice(0, -1); draw(); } else if (/^[a-zäöü]$/i.test(e.key) && cur.length < 5) { cur += e.key.toUpperCase(); draw(); } });
    draw();
  } };

  const GALGEN = ['VINEWOOD', 'MOTORRAD', 'BANKRAUB', 'POLIZEI', 'SONNENBRILLE', 'KRANKENHAUS', 'FLUGHAFEN', 'TANKSTELLE', 'NACHTCLUB', 'ZURICH', 'ZEBRASTREIFEN', 'WERKSTATT', 'SMARTPHONE', 'HUBSCHRAUBER', 'STRANDPROMENADE', 'KASINO', 'AKTIENKURS', 'BITCOIN'];
  G.galgen = { how: 'Errate das Wort Buchstabe für Buchstabe. 7 Fehler erlaubt.', play(root, A) {
    const word = GALGEN[Math.floor(Math.random() * GALGEN.length)]; const guessed = new Set(); let wrong = 0;
    const draw = () => {
      const show = [...word].map((c) => guessed.has(c) ? c : '_').join(' ');
      root.innerHTML = `<svg class="gallows" viewBox="0 0 120 120"><g stroke="var(--paper-3)" stroke-width="3" fill="none" stroke-linecap="round"><path d="M10 112 H70 M30 112 V10 H80 V22"/>${['<circle cx="80" cy="32" r="10"/>', '<path d="M80 42 V72"/>', '<path d="M80 50 L66 62"/>', '<path d="M80 50 L94 62"/>', '<path d="M80 72 L68 92"/>', '<path d="M80 72 L92 92"/>', '<path d="M75 30 l3 3 m0 -3 l-3 3 M83 30 l3 3 m0 -3 l-3 3" stroke="var(--loss)"/>'].slice(0, wrong).map((p) => p.replace('stroke="var(--paper-3)"', '')).join('')}</g></svg>
        <p class="hang-word">${show}</p><div class="kb">${['ABCDEFGHI', 'JKLMNOPQR', 'STUVWXYZÄ'].map((r) => `<div>${[...r].map((k) => `<button data-k="${k}" class="${guessed.has(k) ? (word.includes(k) ? 'hit' : 'miss') : ''}" ${guessed.has(k) ? 'disabled' : ''}>${k}</button>`).join('')}</div>`).join('')}</div>`;
      A.hud(`<span class="chip on">Fehler ${wrong}/7</span>`);
    };
    root.onclick = (e) => { const k = e.target.closest('[data-k]')?.dataset.k; if (!k || guessed.has(k)) return; guessed.add(k); if (!word.includes(k)) { wrong++; A.beep(200, .1); } else A.beep(800, .05); draw(); if ([...word].every((c) => guessed.has(c))) A.over(7 - wrong, 'Punkte'); else if (wrong >= 7) A.over(0, `Lösung: ${word}`); };
    draw();
  } };

  G.sudoku = { how: 'Fülle jede Zeile, Spalte und jedes 3×3-Feld mit 1 bis 9.', play(root, A) {
    // Build a solved grid by pattern + shuffles, then remove cells.
    const base = (r, c) => (3 * (r % 3) + Math.floor(r / 3) + c) % 9;
    const rows = [0, 1, 2].flatMap((g) => shuffle([0, 1, 2]).map((r) => g * 3 + r)), cols = [0, 1, 2].flatMap((g) => shuffle([0, 1, 2]).map((c) => g * 3 + c)), nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const sol = rows.map((r) => cols.map((c) => nums[base(r, c)]));
    const grid = sol.map((r) => r.slice()); shuffle([...Array(81).keys()]).slice(0, 46).forEach((i) => { grid[Math.floor(i / 9)][i % 9] = 0; });
    const fixed = grid.map((r) => r.map(Boolean)); let sel = null, errors = 0; const elapsed = timer(A);
    const draw = () => {
      root.innerHTML = `<div class="sudoku">${grid.flat().map((v, i) => { const r = Math.floor(i / 9), c = i % 9; const bad = v && v !== sol[r][c]; return `<button data-i="${i}" class="${fixed[r][c] ? 'fix' : ''} ${sel === i ? 'sel' : ''} ${bad ? 'bad' : ''} ${sel !== null && (Math.floor(sel / 9) === r || sel % 9 === c) ? 'line' : ''} ${(c % 3 === 2 && c < 8) ? 'br' : ''} ${(r % 3 === 2 && r < 8) ? 'bb' : ''}">${v || ''}</button>`; }).join('')}</div>
        <div class="numpad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫'].map((n) => `<button data-n="${n}">${n}</button>`).join('')}</div>`;
      A.hud(`<span class="chip on">Fehler ${errors}</span><span class="chip" id="tmr">0 s</span>`);
    };
    root.onclick = (e) => {
      const c = e.target.closest('[data-i]'); if (c) { sel = +c.dataset.i; return draw(); }
      const n = e.target.closest('[data-n]'); if (!n || sel === null) return; const r = Math.floor(sel / 9), cc = sel % 9; if (fixed[r][cc]) return;
      grid[r][cc] = n.dataset.n === '⌫' ? 0 : +n.dataset.n; if (grid[r][cc] && grid[r][cc] !== sol[r][cc]) { errors++; A.beep(180, .1); } else A.beep(700, .03);
      draw(); if (grid.every((row, y) => row.every((v, x) => v === sol[y][x]))) A.over(elapsed(), 'Sekunden', true);
    };
    draw();
  } };

  G.vier = { how: 'Vier in einer Reihe gegen die KI. Tippe auf eine Spalte.', play(root, A) {
    const R = 6, C = 7; const b = Array.from({ length: R }, () => Array(C).fill(0)); let over = false;
    const drop = (c, p) => { for (let r = R - 1; r >= 0; r--) if (!b[r][c]) { b[r][c] = p; return r; } return -1; };
    const win = (p) => { for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) { let k = 0; while (k < 4 && b[r + dr * k]?.[c + dc * k] === p) k++; if (k === 4) return true; } return false; };
    const ai = () => { // win > block > centre-ish random
      const valid = [...Array(C).keys()].filter((c) => !b[0][c]);
      for (const p of [2, 1]) for (const c of valid) { const r = drop(c, p); const w = win(p); b[r][c] = 0; if (w) return c; }
      return valid.sort((x, y) => Math.abs(3 - x) - Math.abs(3 - y) + (Math.random() - .5) * 3)[0];
    };
    const draw = (msg = 'Du bist Pink') => { root.innerHTML = `<p class="g-msg">${msg}</p><div class="c4">${b.flat().map((v, i) => `<button data-c="${i % C}" class="p${v}"></button>`).join('')}</div>`; };
    root.onclick = (e) => {
      const cl = e.target.closest('[data-c]'); if (!cl || over) return; const c = +cl.dataset.c; if (drop(c, 1) < 0) return; A.beep(500, .05);
      if (win(1)) { over = true; draw('Gewonnen! 🎉'); return A.over((ZX.getBest('g:vier') || 0) + 1, 'Siege'); }
      const m = ai(); if (m === undefined) { over = true; return draw('Unentschieden'); } drop(m, 2);
      if (win(2)) { over = true; draw('Die KI gewinnt.'); return; } draw();
    };
    draw();
  } };

  G.ssp = { how: 'Schere, Stein, Papier gegen die KI. Best of 5.', play(root, A) {
    const O = [['<svg viewBox="0 0 24 24"><path d="M6 10l4-5 6 1 3 5-2 7-7 2-5-4z"/></svg>', 'Stein'], ['<svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h6M9 16h6"/></svg>', 'Papier'], [ZX.svg('scissors'), 'Schere']]; let me = 0, cpu = 0;
    const draw = (res = '') => { root.innerHTML = `<p class="g-msg">${res || 'Wähle!'}</p><div class="ssp">${O.map(([e, n], i) => `<button data-o="${i}"><span>${e}</span>${n}</button>`).join('')}</div>`; A.hud(`<span class="chip on">Du ${me}</span><span class="chip">KI ${cpu}</span>`); };
    root.onclick = (e) => { const b = e.target.closest('[data-o]'); if (!b) return; const p = +b.dataset.o, c = Math.floor(Math.random() * 3); const r = (p - c + 3) % 3; if (r === 1) me++; else if (r === 2) cpu++; A.beep(r === 1 ? 900 : r === 2 ? 220 : 500, .08); draw(`${O[p][0]} vs ${O[c][0]} · ${r === 1 ? 'Punkt für dich' : r === 2 ? 'Punkt für die KI' : 'Unentschieden'}`); if (me === 3 || cpu === 3) A.over(me, me === 3 ? 'Sieg' : 'Niederlage'); };
    draw();
  } };

  G.hilo = { how: 'Ist die nächste Karte höher oder tiefer? Serie so lang wie möglich.', play(root, A) {
    const V = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'B', 'D', 'K', 'A'], S = ['♠', '♥', '♦', '♣'];
    const draw1 = () => ({ v: Math.floor(Math.random() * 13), s: S[Math.floor(Math.random() * 4)] });
    let cur = draw1(), streak = 0;
    const card = (c) => `<div class="pcard ${'♥♦'.includes(c.s) ? 'red' : ''}"><b>${V[c.v]}</b><span>${c.s}</span></div>`;
    const draw = (msg = '') => { root.innerHTML = `<div class="hilo">${card(cur)}</div><p class="g-msg">${msg}</p><div class="trade-btns"><button class="btn ghost" data-g="lo">Tiefer ▼</button><button class="btn" data-g="hi">Höher ▲</button></div>`; A.hud(`<span class="chip on">Serie ${streak}</span>`); };
    root.onclick = (e) => { const b = e.target.closest('[data-g]'); if (!b) return; const n = draw1(); const ok = b.dataset.g === 'hi' ? n.v >= cur.v : n.v <= cur.v; cur = n; if (ok) { streak++; A.beep(800, .05); draw('Richtig!'); } else { draw('Daneben.'); A.over(streak, 'Serie'); } };
    draw();
  } };

  G.schiebe = { how: 'Schiebe die Zahlen in die richtige Reihenfolge.', play(root, A) {
    let t = [...Array(15).keys()].map((i) => i + 1).concat(0), moves = 0;
    for (let k = 0; k < 300; k++) { const z = t.indexOf(0), opts = [z - 1, z + 1, z - 4, z + 4].filter((j) => j >= 0 && j < 16 && (Math.abs((j % 4) - (z % 4)) + Math.abs(Math.floor(j / 4) - Math.floor(z / 4)) === 1)); const j = opts[Math.floor(Math.random() * opts.length)]; [t[z], t[j]] = [t[j], t[z]]; }
    const draw = () => { root.innerHTML = `<div class="fifteen">${t.map((v, i) => `<button data-i="${i}" class="${v ? '' : 'empty'} ${v === i + 1 ? 'ok' : ''}">${v || ''}</button>`).join('')}</div>`; A.hud(`<span class="chip on">Züge ${moves}</span>`); };
    root.onclick = (e) => { const b = e.target.closest('[data-i]'); if (!b) return; const i = +b.dataset.i, z = t.indexOf(0); if (Math.abs((i % 4) - (z % 4)) + Math.abs(Math.floor(i / 4) - Math.floor(z / 4)) !== 1) return; [t[i], t[z]] = [t[z], t[i]]; moves++; A.beep(600, .03); draw(); if (t.slice(0, 15).every((v, k) => v === k + 1)) A.over(moves, 'Züge', true); };
    draw();
  } };

  G.lightsout = { how: 'Schalte alle Lichter aus. Ein Tipp schaltet das Feld und seine Nachbarn um.', play(root, A) {
    const N = 5; const b = Array(N * N).fill(false); let moves = 0;
    const tog = (i) => { const x = i % N, y = Math.floor(i / N); [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < N && Y < N) b[Y * N + X] = !b[Y * N + X]; }); };
    for (let k = 0; k < 12; k++) tog(Math.floor(Math.random() * N * N));
    const draw = () => { root.innerHTML = `<div class="lights">${b.map((v, i) => `<button data-i="${i}" class="${v ? 'on' : ''}"></button>`).join('')}</div>`; A.hud(`<span class="chip on">Züge ${moves}</span><span class="chip">An: ${b.filter(Boolean).length}</span>`); };
    root.onclick = (e) => { const c = e.target.closest('[data-i]'); if (!c) return; tog(+c.dataset.i); moves++; A.beep(700, .03); draw(); if (b.every((v) => !v)) A.over(moves, 'Züge', true); };
    draw();
  } };

  G.farbflut = { how: 'Flute das Feld von oben links mit einer Farbe. 25 Züge.', play(root, A) {
    const N = 12, COLS = ['#f472b6', '#f0a04b', '#5eead4', '#c4b5fd', '#fbbf24', '#60a5fa']; let b = Array.from({ length: N * N }, () => Math.floor(Math.random() * 6)), moves = 0;
    const fill = (c) => { const old = b[0]; if (old === c) return; const st = [0], seen = new Set([0]); while (st.length) { const i = st.pop(); b[i] = c; const x = i % N, y = Math.floor(i / N); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const X = x + dx, Y = y + dy, j = Y * N + X; if (X >= 0 && Y >= 0 && X < N && Y < N && !seen.has(j) && b[j] === old) { seen.add(j); st.push(j); } }); } moves++; };
    const draw = () => { root.innerHTML = `<div class="flood" style="--n:${N}">${b.map((v) => `<i style="background:${COLS[v]}"></i>`).join('')}</div><div class="flood-btns">${COLS.map((c, i) => `<button data-c="${i}" style="background:${c}"></button>`).join('')}</div>`; A.hud(`<span class="chip on">Züge ${moves}/25</span>`); };
    root.onclick = (e) => { const c = e.target.closest('[data-c]'); if (!c) return; fill(+c.dataset.c); A.beep(500 + +c.dataset.c * 80, .04); draw(); if (b.every((v) => v === b[0])) A.over(moves, 'Züge', true); else if (moves >= 25) A.over(0, 'Keine Züge mehr'); };
    draw();
  } };

  G.zahlenjagd = { how: 'Tippe die Zahlen von 1 bis 25 so schnell wie möglich der Reihe nach.', play(root, A) {
    const nums = shuffle([...Array(25).keys()].map((i) => i + 1)); let next = 1; const t0 = performance.now();
    root.innerHTML = `<div class="schulte">${nums.map((n) => `<button data-n="${n}">${n}</button>`).join('')}</div>`;
    A.hud('<span class="chip on">Nächste: 1</span>');
    root.onclick = (e) => { const b = e.target.closest('[data-n]'); if (!b) return; if (+b.dataset.n === next) { b.classList.add('done'); A.beep(500 + next * 20, .03); next++; A.hud(`<span class="chip on">Nächste: ${next}</span>`); if (next > 25) A.over(((performance.now() - t0) / 1000).toFixed(1) * 1, 'Sekunden', true); } else { b.classList.add('err'); setTimeout(() => b.classList.remove('err'), 200); } };
  } };

  const TEXTS = ['Los Santos schläft nie, und dein Handy auch nicht.', 'Wer schnell tippt, verdient mehr Respekt im Stadtfunk.', 'Ein Zebra mit Sonnenbrille fährt über den Vinewood Boulevard.', 'Der Sonnenuntergang am Del Perro Pier ist unbezahlbar.', 'Tanken, parken, posten und dann ab ins Bahama Mamas.'];
  G.tipptest = { how: 'Tippe den Satz so schnell und fehlerfrei wie möglich.', play(root, A) {
    const text = TEXTS[Math.floor(Math.random() * TEXTS.length)]; let t0 = 0;
    root.innerHTML = `<p class="type-src" id="ts">${[...text].map((c) => `<span>${esc(c)}</span>`).join('')}</p><textarea class="field" id="ti" rows="3" placeholder="Hier tippen …" autocomplete="off" spellcheck="false"></textarea>`;
    const spans = $$('#ts span'); const ti = $('#ti'); setTimeout(() => ti.focus(), 60);
    ti.oninput = () => {
      if (!t0) t0 = performance.now(); const v = ti.value; let errs = 0;
      spans.forEach((s, i) => { s.className = i < v.length ? (v[i] === text[i] ? 'ok' : (errs++, 'bad')) : i === v.length ? 'cur' : ''; });
      const min = (performance.now() - t0) / 60000, wpm = Math.round((v.length / 5) / Math.max(min, 1 / 60));
      A.hud(`<span class="chip on">${wpm} WPM</span><span class="chip">Fehler ${errs}</span>`);
      if (v.length >= text.length) { ti.disabled = true; const acc = Math.round((1 - errs / text.length) * 100); A.over(Math.round(wpm * acc / 100), `WPM · ${acc}% genau`); }
    };
  } };

  /* ───────── Casino (play-money chips) ───────── */
  const bet = (A, min = 10) => `<div class="bet"><span class="tag">Einsatz</span><div class="chips">${[10, 50, 100, 250, 500, 1000].map((v) => `<button class="chip ${v === (ZX.data('casino').bet || 50) ? 'on' : ''}" data-bet="${v}">${v}</button>`).join('')}</div></div>`;
  const getBet = () => ZX.data('casino').bet || 50;
  const bindBet = (root) => root.addEventListener('click', (e) => { const b = e.target.closest('[data-bet]'); if (b) { ZX.data('casino').bet = +b.dataset.bet; ZX.save(); $$('[data-bet]', root).forEach((x) => x.classList.toggle('on', x === b)); } });
  const pay = (A, stake) => { if (A.chips.get() < stake) { ZX.notify('bell', 'Zu wenig Chips', 'Morgen gibt es neue Gratis-Chips.'); return false; } A.chips.add(-stake); return true; };

  G.slots = { how: 'Drei gleiche Symbole gewinnen. 🦓🦓🦓 zahlt 50×.', play(root, A) {
    const SYM = ['🍒', '🍋', '🔔', '💎', '7️⃣', '🦓'], PAY = { '🍒': 3, '🍋': 5, '🔔': 8, '💎': 15, '7️⃣': 25, '🦓': 50 };
    root.innerHTML = `<div class="slots"><div class="reel-s" id="r0">🦓</div><div class="reel-s" id="r1">🦓</div><div class="reel-s" id="r2">🦓</div></div><p class="g-msg" id="sm"></p>${bet()}<button class="btn" id="spin">Drehen</button>`;
    bindBet(root); let busy = false;
    $('#spin').onclick = () => {
      if (busy) return; const st = getBet(); if (!pay(A, st)) return; busy = true; $('#sm').textContent = '';
      const res = [0, 1, 2].map(() => Math.random() < .12 ? '🦓' : SYM[Math.floor(Math.random() * SYM.length)]);
      [0, 1, 2].forEach((i) => { const el = $('#r' + i); el.classList.add('spinning'); const iv = setInterval(() => { el.textContent = SYM[Math.floor(Math.random() * SYM.length)]; }, 70); ZX.live.timeout(() => { clearInterval(iv); el.textContent = res[i]; el.classList.remove('spinning'); A.beep(400 + i * 150, .06); if (i === 2) done(); }, 700 + i * 450); ZX.live.add(() => clearInterval(iv)); });
      const done = () => { busy = false; let win = 0; if (res[0] === res[1] && res[1] === res[2]) win = st * PAY[res[0]]; else if (res[0] === res[1] || res[1] === res[2] || res[0] === res[2]) win = Math.round(st * 1.5); if (win) { A.chips.add(win); A.beep(1200, .3, 'triangle', .08); A.submit(win); } $('#sm').textContent = win ? `+${win} Chips!` : 'Kein Gewinn'; };
    };
  } };

  G.blackjack = { how: 'Komm näher an 21 als der Dealer. Blackjack zahlt 2,5×.', play(root, A) {
    let deck, me, dealer, stake = 0, phase = 'bet';
    const newDeck = () => shuffle([...Array(52).keys()].map((i) => ({ v: i % 13, s: '♠♥♦♣'[Math.floor(i / 13)] })));
    const val = (h) => { let t = 0, a = 0; h.forEach((c) => { const v = c.v === 0 ? 11 : Math.min(10, c.v + 1); if (c.v === 0) a++; t += v; }); while (t > 21 && a--) t -= 10; return t; };
    const name = (c) => ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'B', 'D', 'K'][c.v];
    const card = (c, hide) => hide ? '<div class="pcard back">Z</div>' : `<div class="pcard ${'♥♦'.includes(c.s) ? 'red' : ''}"><b>${name(c)}</b><span>${c.s}</span></div>`;
    const draw = (msg = '') => {
      root.innerHTML = phase === 'bet' ? `<p class="g-msg">${msg || 'Platziere deinen Einsatz'}</p>${bet()}<button class="btn" id="deal">Austeilen</button>`
        : `<p class="tag">Dealer ${phase === 'end' ? val(dealer) : ''}</p><div class="hand">${dealer.map((c, i) => card(c, i === 1 && phase !== 'end')).join('')}</div>
          <p class="tag">Du ${val(me)}</p><div class="hand">${me.map((c) => card(c)).join('')}</div><p class="g-msg">${msg}</p>
          ${phase === 'play' ? '<div class="trade-btns"><button class="btn ghost" id="stand">Halten</button><button class="btn" id="hit">Karte</button></div>' : '<button class="btn" id="again">Neue Runde</button>'}`;
      bindBet(root);
    };
    const finish = () => {
      phase = 'end'; while (val(dealer) < 17) dealer.push(deck.pop());
      const m = val(me), d = val(dealer); let win = 0, msg;
      if (m > 21) msg = 'Überkauft.'; else if (me.length === 2 && m === 21) { win = Math.round(stake * 2.5); msg = 'Blackjack! 🎉'; } else if (d > 21 || m > d) { win = stake * 2; msg = 'Gewonnen!'; } else if (m === d) { win = stake; msg = 'Unentschieden.'; } else msg = 'Dealer gewinnt.';
      if (win) { A.chips.add(win); if (win > stake) A.beep(1100, .25, 'triangle', .08); A.submit(win - stake); } else A.beep(200, .2);
      draw(msg + (win > stake ? ` +${win - stake}` : ''));
    };
    root.onclick = (e) => {
      if (e.target.closest('#deal')) { stake = getBet(); if (!pay(A, stake)) return; deck = newDeck(); me = [deck.pop(), deck.pop()]; dealer = [deck.pop(), deck.pop()]; phase = 'play'; A.beep(500, .05); if (val(me) === 21) return finish(); return draw(); }
      if (e.target.closest('#hit')) { me.push(deck.pop()); A.beep(600, .04); if (val(me) >= 21) return finish(); return draw(); }
      if (e.target.closest('#stand')) return finish();
      if (e.target.closest('#again')) { phase = 'bet'; draw(); }
    };
    draw();
  } };

  G.roulette = { how: 'Setze auf Farbe, Gerade/Ungerade oder eine Zahl. Zahl zahlt 36×.', play(root, A) {
    const RED = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]; let choice = 'red', rot = 0;
    const ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
    root.innerHTML = `<div class="rou-wrap"><div class="rou" id="rw" style="background:conic-gradient(${ORDER.map((n, i) => `${n === 0 ? '#16a34a' : RED.includes(n) ? '#be123c' : '#1c1917'} ${i / 37 * 100}% ${(i + 1) / 37 * 100}%`).join(',')})">${ORDER.map((n, i) => `<span style="transform:rotate(${(i + .5) * 360 / 37}deg) translateY(-112px)">${n}</span>`).join('')}</div><i class="wheel-ptr"></i></div>
      <p class="g-msg" id="rm"></p><div class="chips">${[['red', 'Rot ×2'], ['black', 'Schwarz ×2'], ['even', 'Gerade ×2'], ['odd', 'Ungerade ×2'], ['low', '1–18 ×2'], ['high', '19–36 ×2']].map(([k, n]) => `<button class="chip ${k === choice ? 'on' : ''}" data-ch="${k}">${n}</button>`).join('')}</div>
      <div class="row" style="border:0"><span class="grow t">Oder Zahl (×36)</span><input class="field num" id="rnum" placeholder="0–36" style="width:90px" inputmode="numeric" /></div>${bet()}<button class="btn" id="rspin">Drehen</button>`;
    bindBet(root); let busy = false;
    root.addEventListener('click', (e) => { const c = e.target.closest('[data-ch]'); if (c) { choice = c.dataset.ch; $('#rnum').value = ''; $$('[data-ch]', root).forEach((x) => x.classList.toggle('on', x === c)); } });
    $('#rspin').onclick = () => {
      if (busy) return; const st = getBet(); const num = $('#rnum').value === '' ? null : Math.max(0, Math.min(36, parseInt($('#rnum').value, 10))); if (!pay(A, st)) return; busy = true;
      const res = ORDER[Math.floor(Math.random() * 37)], idx = ORDER.indexOf(res);
      rot += 1800 + (360 - (idx + .5) * 360 / 37) - (rot % 360); $('#rw').style.transform = `rotate(${rot}deg)`;
      ZX.live.timeout(() => {
        busy = false; let win = 0;
        if (num !== null) { if (res === num) win = st * 36; }
        else if (res !== 0 && ((choice === 'red' && RED.includes(res)) || (choice === 'black' && !RED.includes(res)) || (choice === 'even' && res % 2 === 0) || (choice === 'odd' && res % 2 === 1) || (choice === 'low' && res <= 18) || (choice === 'high' && res >= 19))) win = st * 2;
        if (win) { A.chips.add(win); A.beep(1100, .3, 'triangle', .08); A.submit(win - st); } else A.beep(200, .2);
        $('#rm').textContent = `${res} ${res === 0 ? 'Grün' : RED.includes(res) ? 'Rot' : 'Schwarz'} · ${win ? '+' + (win - st) + ' Chips' : 'verloren'}`;
      }, 3300);
    };
  } };

  G.crash = { how: 'Der Multiplikator steigt, bis er crasht. Steig rechtzeitig aus!', play(root, A) {
    root.innerHTML = `<div class="crash"><canvas id="crc"></canvas><b id="crm">1.00×</b></div>${bet()}<button class="btn" id="crGo">Einsteigen</button>`;
    bindBet(root); let state = 'idle', mult = 1, crashAt = 1, stake = 0, t0 = 0, pts = [];
    const cv = $('#crc'); const g = cv.getContext('2d'); cv.width = 680; cv.height = 360;
    const btn = $('#crGo');
    const drawC = () => { g.clearRect(0, 0, 680, 360); g.strokeStyle = state === 'crashed' ? '#f0a04b' : '#f472b6'; g.lineWidth = 4; g.shadowColor = g.strokeStyle; g.shadowBlur = 16; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.shadowBlur = 0; };
    btn.onclick = () => {
      if (state === 'running') { state = 'cashed'; const win = Math.floor(stake * mult); A.chips.add(win); A.submit(win - stake); A.beep(1200, .25, 'triangle', .08); $('#crm').textContent = `+${win - stake}`; btn.textContent = 'Einsteigen'; return; }
      stake = getBet(); if (!pay(A, stake)) return;
      crashAt = Math.max(1, Math.floor(100 * 0.97 / (1 - Math.random())) / 100); mult = 1; pts = []; t0 = performance.now(); state = 'running'; btn.textContent = 'Auszahlen';
      ZX.live.raf((now) => {
        if (state !== 'running' && state !== 'cashed') return false;
        const t = (now - t0) / 1000; mult = Math.pow(Math.E, 0.12 * t * 1.6);
        pts.push([Math.min(660, 20 + t * 60), 340 - Math.min(320, (mult - 1) * 60)]);
        if (mult >= crashAt) { mult = crashAt; const was = state; state = 'crashed'; $('#crm').textContent = `💥 ${crashAt.toFixed(2)}×`; $('#crm').classList.add('crashed'); drawC(); btn.textContent = 'Einsteigen'; if (was === 'running') A.beep(120, .4, 'sawtooth', .08); setTimeout(() => $('#crm')?.classList.remove('crashed'), 1500); return false; }
        if (state === 'running') $('#crm').textContent = mult.toFixed(2) + '×';
        drawC();
      });
    };
  } };

  G.minen = { how: 'Decke Diamanten auf, meide die Minen. Jeder Fund erhöht den Multiplikator.', play(root, A) {
    const N = 25; let mines, open, stake = 0, active = false, mineCount = 3;
    const mult = () => { let m = 1; for (let i = 0; i < open; i++) m *= (N - i) / (N - mineCount - i); return Math.floor(m * 0.97 * 100) / 100; };
    const draw = (msg = '') => { root.innerHTML = `<div class="minen">${Array.from({ length: N }, (_, i) => `<button data-i="${i}"></button>`).join('')}</div><p class="g-msg">${msg || (active ? `${mult().toFixed(2)}× · Auszahlung ${Math.floor(stake * mult())}` : 'Setze und starte')}</p>
      ${active ? '<button class="btn" id="mCash">Auszahlen</button>' : `<div class="chips">${[1, 3, 5, 10].map((m) => `<button class="chip ${m === mineCount ? 'on' : ''}" data-m="${m}">${m} Minen</button>`).join('')}</div>${bet()}<button class="btn" id="mGo">Start</button>`}`; bindBet(root); };
    root.onclick = (e) => {
      const m = e.target.closest('[data-m]'); if (m) { mineCount = +m.dataset.m; return draw(); }
      if (e.target.closest('#mGo')) { stake = getBet(); if (!pay(A, stake)) return; mines = new Set(shuffle([...Array(N).keys()]).slice(0, mineCount)); open = 0; active = true; return draw(); }
      if (e.target.closest('#mCash') && active) { active = false; const win = Math.floor(stake * mult()); A.chips.add(win); A.submit(win - stake); A.beep(1200, .25, 'triangle', .08); return draw(`+${win - stake} Chips`); }
      const c = e.target.closest('[data-i]'); if (!c || !active || c.classList.contains('gem')) return;
      if (mines.has(+c.dataset.i)) { active = false; $$('[data-i]', root).forEach((b) => { if (mines.has(+b.dataset.i)) b.classList.add('boom'); }); c.textContent = '💥'; A.beep(120, .4, 'sawtooth', .08); $('.g-msg').textContent = 'Mine! Einsatz verloren.'; setTimeout(() => draw('Mine! Einsatz verloren.'), 1200); return; }
      open++; c.classList.add('gem'); c.textContent = '💎'; A.beep(700 + open * 40, .06); $('.g-msg').textContent = `${mult().toFixed(2)}× · Auszahlung ${Math.floor(stake * mult())}`;
      if (open === N - mineCount) { active = false; const win = Math.floor(stake * mult()); A.chips.add(win); A.submit(win - stake); draw(`Alles gefunden! +${win - stake}`); }
    };
    draw();
  } };

  G.plinko = { how: 'Lass die Kugel fallen. Ränder zahlen am meisten.', play(root, A) {
    const W = 340, H = 420, ROWS = 10, M = [9, 4, 2, 1.2, .5, .3, .5, 1.2, 2, 4, 9];
    const [cv, g] = A.canvas(W, H); root.appendChild(cv); root.insertAdjacentHTML('beforeend', `${bet()}<button class="btn" id="pDrop">Kugel fallen lassen</button>`); bindBet(root);
    const pegs = []; for (let r = 0; r < ROWS; r++) for (let c = 0; c <= r + 1; c++) pegs.push({ x: W / 2 + (c - (r + 1) / 2) * 28, y: 40 + r * 32 });
    let balls = [];
    $('#pDrop').onclick = () => { const st = getBet(); if (!pay(A, st)) return; balls.push({ x: W / 2 + (Math.random() - .5) * 4, y: 10, vx: 0, vy: 0, st }); };
    ZX.live.raf(() => {
      balls.forEach((b) => { b.vy += .25; b.x += b.vx; b.y += b.vy; b.vx *= .99; pegs.forEach((p) => { const dx = b.x - p.x, dy = b.y - p.y, d = Math.hypot(dx, dy); if (d < 9) { b.x = p.x + dx / d * 9; b.y = p.y + dy / d * 9; b.vy *= -.4; b.vx += (dx / d) * 1.2 + (Math.random() - .5) * .6; A.beep(1400, .01, 'sine', .01); } }); if (b.x < 6 || b.x > W - 6) b.vx *= -1;
        if (b.y > H - 30 && !b.done) { b.done = true; const slot = Math.max(0, Math.min(M.length - 1, Math.floor((b.x - (W / 2 - M.length * 15)) / 30))); const win = Math.round(b.st * M[slot]); A.chips.add(win); if (win > b.st) { A.beep(1100, .2, 'triangle', .06); A.submit(win - b.st); } } });
      balls = balls.filter((b) => b.y < H + 20);
      g.fillStyle = '#110e10'; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(242,238,240,.6)'; pegs.forEach((p) => { g.beginPath(); g.arc(p.x, p.y, 3, 0, 7); g.fill(); });
      M.forEach((m, i) => { const x = W / 2 - M.length * 15 + i * 30; g.fillStyle = m >= 4 ? '#f472b6' : m >= 1.2 ? '#c4b5fd' : '#423a3f'; g.beginPath(); g.roundRect(x + 2, H - 26, 26, 22, 5); g.fill(); g.fillStyle = m >= 1.2 ? '#0b080a' : '#f2eef0'; g.font = '700 9px "Zen Kaku Gothic New"'; g.textAlign = 'center'; g.fillText(m + '×', x + 15, H - 12); });
      g.fillStyle = '#ffe3f1'; g.shadowColor = '#f472b6'; g.shadowBlur = 12; balls.forEach((b) => { g.beginPath(); g.arc(b.x, b.y, 6, 0, 7); g.fill(); }); g.shadowBlur = 0;
    });
  } };

  G.rubbellos = { how: 'Rubbel drei gleiche Beträge frei und gewinne sie. Ein Los kostet 50 Chips.', play(root, A) {
    const newTicket = () => {
      if (!pay(A, 50)) return;
      const prizes = [10, 20, 50, 100, 250, 1000]; const win = Math.random() < .35 ? prizes[Math.floor(Math.pow(Math.random(), 2.2) * prizes.length)] : 0;
      let cells = Array.from({ length: 9 }, () => prizes[Math.floor(Math.random() * prizes.length)]);
      // Make the grid consistent: exactly one triple for a win, none for a loss.
      const fix = () => { const c = {}; cells.forEach((v) => { c[v] = (c[v] || 0) + 1; }); return Object.entries(c).filter(([, n]) => n >= 3).map(([v]) => +v); };
      let guard = 0; while (guard++ < 200) { cells = Array.from({ length: 9 }, () => prizes[Math.floor(Math.random() * prizes.length)]); if (win) { const idx = shuffle([...Array(9).keys()]).slice(0, 3); idx.forEach((i) => { cells[i] = win; }); } const t = fix(); if (win ? t.length === 1 && t[0] === win : t.length === 0) break; }
      root.innerHTML = `<div class="scratch"><div class="sc-grid">${cells.map((v) => `<div>${v}</div>`).join('')}</div><canvas id="scc" width="600" height="600"></canvas></div><p class="g-msg" id="scm">Rubbel frei!</p><button class="btn ghost" id="scNew">Neues Los (50)</button>`;
      const cv = $('#scc'), g = cv.getContext('2d');
      const grd = g.createLinearGradient(0, 0, 600, 600); grd.addColorStop(0, '#c9c3c7'); grd.addColorStop(.5, '#f2eef0'); grd.addColorStop(1, '#a8a1a5'); g.fillStyle = grd; g.fillRect(0, 0, 600, 600);
      g.fillStyle = 'rgba(11,8,10,.25)'; g.font = '700 54px "Dela Gothic One"'; g.textAlign = 'center'; g.fillText('RUBBEL', 300, 280); g.fillText('MICH', 300, 350);
      g.globalCompositeOperation = 'destination-out'; let down = false, paid = false;
      const rub = (e) => { const r = cv.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width * 600, y = (e.clientY - r.top) / r.height * 600; g.beginPath(); g.arc(x, y, 34, 0, 7); g.fill(); };
      cv.onpointerdown = (e) => { down = true; cv.setPointerCapture(e.pointerId); rub(e); }; cv.onpointermove = (e) => { if (down) rub(e); };
      cv.onpointerup = () => { down = false; const d = g.getImageData(0, 0, 600, 600).data; let clear = 0; for (let i = 3; i < d.length; i += 400) if (!d[i]) clear++; if (!paid && clear / (d.length / 400) > .55) { paid = true; cv.style.opacity = 0; if (win) { A.chips.add(win); A.submit(win); A.beep(1200, .3, 'triangle', .08); } $('#scm').textContent = win ? `Gewinn: ${win} Chips! 🎉` : 'Leider kein Gewinn.'; } };
      $('#scNew').onclick = newTicket;
    };
    root.innerHTML = '<button class="btn" id="scNew">Los kaufen (50 Chips)</button>'; $('#scNew').onclick = newTicket;
  } };

  G.kopfzahl = { how: 'Kopf oder Zahl. Richtig getippt verdoppelt den Einsatz.', play(root, A) {
    root.innerHTML = `<div class="coin" id="kzc"><span>Z</span></div><p class="g-msg" id="kzm"></p>${bet()}<div class="trade-btns"><button class="btn ghost" data-kz="k">Kopf</button><button class="btn" data-kz="z">Zahl</button></div>`;
    bindBet(root); let busy = false;
    root.addEventListener('click', (e) => { const b = e.target.closest('[data-kz]'); if (!b || busy) return; const st = getBet(); if (!pay(A, st)) return; busy = true; const res = Math.random() < .5 ? 'k' : 'z'; const c = $('#kzc'); c.classList.remove('flip-h', 'flip-t'); void c.offsetWidth; c.classList.add(res === 'k' ? 'flip-h' : 'flip-t'); ZX.live.timeout(() => { busy = false; const win = res === b.dataset.kz; if (win) { A.chips.add(st * 2); A.submit(st); A.beep(1100, .2, 'triangle', .08); } else A.beep(200, .2); $('#kzm').textContent = `${res === 'k' ? 'Kopf' : 'Zahl'} · ${win ? '+' + st : '−' + st}`; }, 1000); });
  } };
})();
