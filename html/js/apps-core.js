/* System apps: messages, phone (+ call overlay), contacts, bank, markets, notes, calendar, settings, store, camera, gallery. */
(() => {
  'use strict';
  const { $, $$, esc, uid, pad, svg, money, hm, ago, initials, ymd, RENDER, body } = ZX;
  const S = () => ZX.S;
  const head = (...a) => ZX.head(...a);
  const D = 864e5;

  /* ───────── Generative art (photos, post images, covers) ───────── */
  function rng(seed) { let a = typeof seed === 'number' ? seed : [...String(seed)].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 2654435761) >>> 0, 1779033703); return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const SCENES = ['city', 'sunset', 'beach', 'night', 'desert', 'neon', 'mountain', 'portrait', 'food', 'car'];

  /*
   * Photo renderer: layered "shot" with atmospheric depth, light sources with halos, reflections,
   * film grain and vignette, so generated pictures read as photos rather than clip-art.
   * Deterministic: same seed + scene = same picture on every client.
   */
  const f1 = (n) => Math.round(n * 10) / 10;
  function art(seed, scene, filter = '') {
    const r = rng(seed);
    scene ||= SCENES[Math.floor(r() * SCENES.length)];
    const k = `a${seed}${scene}`.replace(/\W/g, '');
    const R = (a, b) => a + r() * (b - a);
    const defs = [];
    const lin = (id, stops, x2 = 0, y2 = 1) => { defs.push(`<linearGradient id="${k}${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`); return `url(#${k}${id})`; };
    const rad = (id, stops, cx = .5, cy = .5, rr = .5) => { defs.push(`<radialGradient id="${k}${id}" cx="${cx}" cy="${cy}" r="${rr}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</radialGradient>`); return `url(#${k}${id})`; };
    let g = '';
    // Building helpers
    const skyline = (base, hMin, hMax, wMin, wMax, fill, lights, lit = .5, gap = 0) => {
      let s = '';
      for (let x = -4; x < 104; x += R(wMin, wMax) + gap) {
        const w = R(wMin, wMax), h = R(hMin, hMax), y = base - h;
        s += `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h + 2)}" fill="${fill}"/>`;
        if (r() > .7) s += `<rect x="${f1(x + w * .4)}" y="${f1(y - R(2, 6))}" width=".5" height="${f1(R(2, 6))}" fill="${fill}"/>`; // antenna
        if (r() > .8) s += `<rect x="${f1(x + w * .15)}" y="${f1(y - 1.6)}" width="${f1(w * .3)}" height="1.6" fill="${fill}"/>`; // roof box
        if (lights) for (let wy = y + 2; wy < base - 1; wy += 2.4) for (let wx = x + 1; wx < x + w - .8; wx += 1.8) if (r() < lit) s += `<rect x="${f1(wx)}" y="${f1(wy)}" width=".9" height="1.1" fill="${lights}" opacity="${f1(R(.35, 1))}"/>`;
      }
      return s;
    };
    const glowDisc = (id, cx, cy, rr, core, halo) => `<circle cx="${cx}" cy="${cy}" r="${rr * 4}" fill="${rad(id, [[0, halo, .55], [.35, halo, .18], [1, halo, 0]])}"/><circle cx="${cx}" cy="${cy}" r="${rr}" fill="${core}"/>`;
    const hue = Math.floor(r() * 360);

    if (scene === 'portrait') {
      // Back-lit portrait: bokeh city lights, silhouette with rim light.
      const tone = [[`hsl(${hue},55%,22%)`, `hsl(${hue + 40},60%,48%)`], ['#1b1027', '#e8547d'], ['#0f1d2b', '#5eead4']][Math.floor(r() * 3)];
      g += `<rect width="100" height="100" fill="${lin('bg', [[0, tone[0]], [1, '#0b080a']])}"/>`;
      for (let i = 0; i < 18; i++) { const cx = R(0, 100), cy = R(0, 70), rr = R(2, 9); g += `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(rr)}" fill="${rad('b' + i, [[0, i % 3 ? tone[1] : '#ffe3b0', .55], [.7, i % 3 ? tone[1] : '#ffe3b0', .25], [1, tone[1], 0]])}"/>`; }
      const hx = R(42, 58), hair = r() > .5;
      const body = `M${hx - 34} 100 C${hx - 32} 82 ${hx - 20} 74 ${hx - 9} 72 L${hx - 6} 62 C${hx - 13} 58 ${hx - 15} 48 ${hx - 14} 40 C${hx - 13} ${hair ? 22 : 27} ${hx + 13} ${hair ? 22 : 27} ${hx + 14} 40 C${hx + 15} 48 ${hx + 13} 58 ${hx + 6} 62 L${hx + 9} 72 C${hx + 20} 74 ${hx + 32} 82 ${hx + 34} 100 Z`;
      g += `<path d="${body}" fill="#07050a"/><path d="${body}" fill="none" stroke="${lin('rim', [[0, tone[1], 0], [.5, tone[1], .9], [1, '#fff', .6]], 1, 0)}" stroke-width="1.1"/>`;
      if (hair) g += `<path d="M${hx - 15} 42 C${hx - 18} 24 ${hx + 18} 20 ${hx + 15} 44 C${hx + 20} 56 ${hx + 18} 66 ${hx + 12} 70 L${hx + 13} 52 C${hx + 8} 34 ${hx - 9} 34 ${hx - 13} 52 L${hx - 12} 70 C${hx - 18} 66 ${hx - 20} 56 ${hx - 15} 42Z" fill="#07050a"/>`;
    } else if (scene === 'food') {
      // Top-down table shot: wood, plate shadow, pizza or bowl with herbs.
      g += `<rect width="100" height="100" fill="${lin('wood', [[0, '#3b2416'], [.5, '#4a2e1c'], [1, '#2a1a10']], 1, .2)}"/>`;
      for (let y = 0; y < 100; y += R(3, 6)) g += `<path d="M0 ${f1(y)} Q50 ${f1(y + R(-2, 2))} 100 ${f1(y + R(-1, 1))}" stroke="#1c110a" stroke-opacity=".35" stroke-width=".4" fill="none"/>`;
      g += `<ellipse cx="53" cy="56" rx="40" ry="38" fill="#000" opacity=".35"/><circle cx="50" cy="52" r="39" fill="${rad('pl', [[0, '#fff'], [.85, '#ece6e2'], [1, '#c9c1bc']])}"/>`;
      if (r() > .5) {
        g += `<circle cx="50" cy="52" r="31" fill="#d9a15b"/><circle cx="50" cy="52" r="27" fill="#b8321f"/>`;
        for (let i = 0; i < 26; i++) g += `<circle cx="${f1(50 + R(-22, 22))}" cy="${f1(52 + R(-22, 22))}" r="${f1(R(2, 5))}" fill="#f6d27a" opacity=".9"/>`;
        for (let i = 0; i < 9; i++) { const a = R(0, 6.28), d = R(4, 20); g += `<circle cx="${f1(50 + Math.cos(a) * d)}" cy="${f1(52 + Math.sin(a) * d)}" r="3.3" fill="${rad('pp' + i, [[0, '#d6453a'], [1, '#7e1d16']], .4, .35, .6)}"/>`; }
        for (let i = 0; i < 6; i++) g += `<path d="M50 52 L${f1(50 + Math.cos(i * 1.047) * 31)} ${f1(52 + Math.sin(i * 1.047) * 31)}" stroke="#a0582a" stroke-width=".35" opacity=".6"/>`;
      } else {
        g += `<circle cx="50" cy="52" r="29" fill="#f1e7d6"/>`;
        [['#e8a33d', -9, -6, 11], ['#7cb342', 10, -8, 9], ['#d6453a', 2, 10, 10], ['#5a2e1c', -12, 10, 8], ['#f9a8d4', 12, 9, 6]].forEach(([c, dx, dy, rr]) => { g += `<circle cx="${50 + dx}" cy="${52 + dy}" r="${rr}" fill="${c}" opacity=".95"/>`; });
        for (let i = 0; i < 14; i++) g += `<ellipse cx="${f1(50 + R(-20, 20))}" cy="${f1(52 + R(-20, 20))}" rx="1.6" ry=".7" transform="rotate(${f1(R(0, 180))} ${f1(50)} ${f1(52)})" fill="#2e7d32"/>`;
      }
      g += `<path d="M86 20 l10 74" stroke="#cfcfd4" stroke-width="2.4" stroke-linecap="round"/><path d="M90 16 l3 18" stroke="#cfcfd4" stroke-width="3.4" stroke-linecap="round"/>`;
    } else if (scene === 'car') {
      // Side shot at dusk with city bokeh, glossy body, reflections and motion streaks.
      const paint = [`hsl(${hue},75%,48%)`, '#f472b6', '#111215', '#e7e5e4', '#f0a04b'][Math.floor(r() * 5)];
      g += `<rect width="100" height="100" fill="${lin('sky', [[0, '#1b1530'], [.6, '#5b2a4a'], [1, '#e8547d']])}"/>`;
      for (let i = 0; i < 14; i++) g += `<circle cx="${f1(R(0, 100))}" cy="${f1(R(30, 62))}" r="${f1(R(1.5, 5))}" fill="${rad('cb' + i, [[0, i % 2 ? '#ffd9a8' : '#f9a8d4', .7], [1, '#fff', 0]])}"/>`;
      g += skyline(62, 6, 20, 5, 10, '#160f1c', null) + `<rect y="62" width="100" height="38" fill="${lin('road', [[0, '#1c1820'], [1, '#09070a']])}"/>`;
      for (let i = 0; i < 6; i++) g += `<rect x="${f1(R(-20, 90))}" y="${f1(R(64, 70))}" width="${f1(R(15, 40))}" height=".4" fill="#fff" opacity="${f1(R(.08, .25))}"/>`;
      const car = 'M8 76 C9 70 16 68 26 67 L38 60 C44 57 60 57 68 60 L78 66 C86 67 92 69 93 74 L93 79 L8 79 Z';
      g += `<ellipse cx="51" cy="82" rx="46" ry="3.4" fill="#000" opacity=".6"/><path d="${car}" fill="${paint}"/><path d="${car}" fill="${lin('gloss', [[0, '#fff', .45], [.35, '#fff', .05], [.6, '#000', 0], [1, '#000', .35]])}"/>`;
      g += `<path d="M30 66 L39 61 C45 59 58 59 65 61 L73 66 Z" fill="${lin('glass', [[0, '#9ec5e8', .9], [1, '#1b2b3a', .95]], 1, 1)}"/><path d="M51 59.5 V66" stroke="${paint}" stroke-width="1.2"/>`;
      [26, 76].forEach((x, i) => { g += `<circle cx="${x}" cy="78" r="7.2" fill="#0a0a0c"/><circle cx="${x}" cy="78" r="4.6" fill="${rad('rim' + i, [[0, '#e5e7eb'], [.7, '#6b7280'], [1, '#1f2937']])}"/><circle cx="${x}" cy="78" r="1.3" fill="#111"/>`; });
      g += `<path d="M90 70 h3" stroke="#ff4d4d" stroke-width="1.6" stroke-linecap="round"/><path d="M8.5 72 h3" stroke="#fff6d6" stroke-width="1.4" stroke-linecap="round"/><path d="${car}" transform="translate(0 162) scale(1 -1)" fill="${paint}" opacity=".18"/>`;
    } else {
      const P = {
        city: { sky: [[0, `hsl(${hue},55%,72%)`], [.55, `hsl(${hue + 25},50%,58%)`], [1, `hsl(${hue + 40},45%,40%)`]], far: `hsl(${hue + 30},25%,52%)`, mid: `hsl(${hue + 30},25%,32%)`, near: '#17111a', lights: '#ffe9a8', lit: .25, sun: [`hsl(${hue + 40},90%,92%)`, `hsl(${hue + 20},90%,80%)`, R(15, 85), R(18, 34)] },
        sunset: { sky: [[0, '#2a1a4a'], [.4, '#b13d6e'], [.72, '#ff8a5c'], [1, '#ffd29a']], far: '#7a3460', mid: '#3d1838', near: '#1a0b17', lights: '#ffd59a', lit: .35, sun: ['#fff4d6', '#ffb36b', R(25, 75), 64], water: true },
        night: { sky: [[0, '#04050f'], [.6, '#141634'], [1, '#2a1748']], far: '#1d1b3a', mid: '#120f24', near: '#07060d', lights: '#ffe3a1', lit: .55, moon: true, trails: true },
        neon: { sky: [[0, '#0a0412'], [.6, '#2a0d3a'], [1, '#5b1048']], far: '#2a1036', mid: '#170a20', near: '#0a050d', lights: '#f9a8d4', lit: .6, signs: true, wet: true },
      }[scene];
      if (P) {
        g += `<rect width="100" height="100" fill="${lin('sky', P.sky)}"/>`;
        if (P.moon || P.signs) for (let i = 0; i < 40; i++) g += `<circle cx="${f1(R(0, 100))}" cy="${f1(R(0, 45))}" r="${f1(R(.12, .45))}" fill="#fff" opacity="${f1(R(.2, .9))}"/>`;
        if (P.sun) g += glowDisc('sun', f1(P.sun[2]), f1(P.sun[3]), 7, P.sun[0], P.sun[1]);
        if (P.moon) g += glowDisc('moon', f1(R(60, 88)), f1(R(12, 22)), 4.5, '#f2eef0', '#c4b5fd');
        const base = P.water ? 70 : 82;
        g += skyline(base, 14, 34, 4, 9, P.far, null) + `<rect y="${base - 30}" width="100" height="30" fill="${lin('haze1', [[0, P.sky[P.sky.length - 1][1], 0], [1, P.sky[P.sky.length - 1][1], .45]])}"/>`;
        g += skyline(base, 10, 26, 5, 11, P.mid, P.lights, P.lit * .5) + `<rect y="${base - 18}" width="100" height="18" fill="${lin('haze2', [[0, P.sky[P.sky.length - 1][1], 0], [1, P.sky[P.sky.length - 1][1], .25]])}"/>`;
        g += skyline(base + 2, 8, 22, 7, 14, P.near, P.lights, P.lit);
        if (P.signs) for (let i = 0; i < 5; i++) { const x = R(5, 85), y = R(52, 72), c = ['#f472b6', '#5eead4', '#c4b5fd', '#fbbf24'][i % 4]; g += `<rect x="${f1(x - 2)}" y="${f1(y - 2)}" width="12" height="6" rx="1" fill="${c}" opacity=".18"/><rect x="${f1(x)}" y="${f1(y)}" width="8" height="2" rx="1" fill="${c}"/>`; }
        if (P.water) {
          g += `<rect y="${base}" width="100" height="${100 - base}" fill="${lin('wat', [[0, '#5b2244'], [1, '#12081a']])}"/>`;
          for (let y = base + 1; y < 100; y += R(1, 2.5)) g += `<rect x="${f1(P.sun[2] - R(3, 14))}" y="${f1(y)}" width="${f1(R(6, 28))}" height=".5" fill="#ffd29a" opacity="${f1(R(.2, .7) * (1 - (y - base) / 40))}"/>`;
          for (let y = base + 2; y < 100; y += 3) g += `<rect x="0" y="${y}" width="100" height=".25" fill="#fff" opacity=".05"/>`;
        } else {
          g += `<rect y="${base + 1}" width="100" height="${99 - base}" fill="${P.near}"/>`;
          if (P.trails) for (let i = 0; i < 7; i++) { const y = R(88, 97); g += `<path d="M-5 ${f1(y)} Q50 ${f1(y - R(2, 5))} 105 ${f1(y + R(-1, 2))}" stroke="${i % 2 ? '#ff4d4d' : '#fff3d6'}" stroke-width="${f1(R(.3, .8))}" opacity="${f1(R(.5, .95))}" fill="none"/>`; }
          if (P.wet) for (let i = 0; i < 12; i++) g += `<rect x="${f1(R(0, 100))}" y="${f1(R(85, 99))}" width=".7" height="${f1(R(3, 10))}" fill="${['#f472b6', '#5eead4', '#c4b5fd'][i % 3]}" opacity=".35"/>`;
        }
      } else if (scene === 'beach') {
        // Vespucci: sky, sun halo, sea with glints, the Del Perro pier wheel, foam line, palms.
        g += `<rect width="100" height="100" fill="${lin('sky', [[0, '#5fb0e8'], [.55, '#b8e1f5'], [1, '#fde6c4']])}"/>` + glowDisc('sun', f1(R(20, 80)), 18, 5, '#fffaf0', '#fff1c1');
        g += `<rect y="56" width="100" height="20" fill="${lin('sea', [[0, '#2b7bb8'], [1, '#56b4d9']])}"/>`;
        for (let i = 0; i < 30; i++) g += `<rect x="${f1(R(0, 100))}" y="${f1(R(57, 75))}" width="${f1(R(1, 4))}" height=".35" fill="#fff" opacity="${f1(R(.3, .8))}"/>`;
        const px = R(8, 30); g += `<g stroke="#2a2730" stroke-width=".5" fill="none"><circle cx="${f1(px + 10)}" cy="44" r="9"/>${Array.from({ length: 8 }, (_, i) => `<path d="M${f1(px + 10)} 44 l${f1(Math.cos(i * .785) * 9)} ${f1(Math.sin(i * .785) * 9)}"/>`).join('')}</g><rect x="${f1(px - 4)}" y="54" width="40" height="1.2" fill="#2a2730"/>${Array.from({ length: 8 }, (_, i) => `<rect x="${f1(px - 3 + i * 5)}" y="54" width=".6" height="4" fill="#2a2730"/>`).join('')}`;
        g += `<rect y="74" width="100" height="26" fill="${lin('sand', [[0, '#d9b98a'], [1, '#f2dcb4']])}"/><path d="M0 75 C15 73 25 77 40 75 S70 73 100 76 L100 78 C75 76 60 79 40 77 S15 76 0 78Z" fill="#fff" opacity=".75"/>`;
        [[R(70, 90), 1], [R(55, 70), .8]].forEach(([x, s], i) => { const top = 92 - 50 * s; g += `<path d="M${f1(x)} 98 Q${f1(x - 3)} ${f1(top + 20)} ${f1(x + 4)} ${f1(top)}" stroke="#3a2a1e" stroke-width="${f1(1.6 * s)}" fill="none"/>`; for (let j = 0; j < 7; j++) { const a = j * .9 - 2.6; g += `<path d="M${f1(x + 4)} ${f1(top)} q${f1(Math.cos(a) * 7 * s)} ${f1(Math.sin(a) * 4 * s - 2)} ${f1(Math.cos(a) * 14 * s)} ${f1(Math.sin(a) * 8 * s + 3)}" stroke="#1f3b24" stroke-width="${f1(1.4 * s)}" fill="none" stroke-linecap="round"/>`; } void i; });
      } else {
        // mountain / desert: layered ridges with atmospheric perspective.
        const D = scene === 'desert';
        const sky = D ? [[0, '#ffb878'], [.6, '#ffd9a8'], [1, '#fff0d6']] : [[0, '#7fb2e5'], [.6, '#c9def0'], [1, '#eef4f8']];
        const ridges = D ? ['#d9905a', '#b86a3e', '#8a4728', '#5a2c18'] : ['#9fb8d6', '#7290b4', '#4b6688', '#26364d'];
        g += `<rect width="100" height="100" fill="${lin('sky', sky)}"/>` + glowDisc('sun', f1(R(15, 85)), f1(D ? 40 : 22), D ? 9 : 5, '#fffaf0', D ? '#ffcf8f' : '#ffffff');
        ridges.forEach((c, i) => { let p = `M0 100 L0 ${f1(48 + i * 9)}`; let y = 48 + i * 9; for (let x = 0; x <= 100; x += 8) { y = Math.max(30 + i * 9, Math.min(80 + i * 4, y + R(-7, 7))); p += ` Q${f1(x - 4)} ${f1(y - R(2, 6))} ${x} ${f1(y)}`; } g += `<path d="${p} L100 100Z" fill="${c}"/>`; if (!D && i === 0) g += `<path d="${p} L100 100Z" fill="#fff" opacity=".12"/>`; });
        if (D) { const x = R(60, 88); g += `<path d="M${f1(x)} 98 V78 M${f1(x)} 86 q-5 0 -5 -6 M${f1(x)} 83 q5 0 5 -6" stroke="#2b1a10" stroke-width="2.2" fill="none" stroke-linecap="round"/>`; }
        else g += `<path d="M30 100 C40 90 55 88 62 80 S70 72 76 70" stroke="#1d2a3a" stroke-width="1.6" fill="none"/><path d="M30 100 C40 90 55 88 62 80 S70 72 76 70" stroke="#fbbf24" stroke-width=".3" stroke-dasharray="1.5 1.5" fill="none"/>`;
      }
    }
    // Film finish: grain + vignette + soft light leak.
    defs.push(`<filter id="${k}gr" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.8" numOctaves="2" seed="${seed % 97}"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 .5 0"/></filter>`);
    g += `<rect width="100" height="100" filter="url(#${k}gr)" opacity=".16" style="mix-blend-mode:overlay"/>`;
    g += `<rect width="100" height="100" fill="${rad('vig', [[.55, '#000', 0], [1, '#000', .55]], .5, .5, .75)}"/>`;
    if (r() > .55) g += `<rect width="100" height="100" fill="${rad('leak', [[0, ['#ff7a59', '#f472b6', '#fbbf24'][Math.floor(r() * 3)], .35], [1, '#000', 0]], r() > .5 ? 0 : 1, R(0, 1), .6)}" style="mix-blend-mode:screen"/>`;
    const filters = { mono: 'grayscale(1) contrast(1.15)', warm: 'sepia(.3) saturate(1.25)', cool: 'hue-rotate(-18deg) saturate(1.15)', pink: 'hue-rotate(300deg) saturate(1.35)', fade: 'contrast(.86) brightness(1.08) saturate(.8)', vivid: 'saturate(1.55) contrast(1.08)' };
    return `<svg class="art" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style="filter:${filters[filter] || 'none'}"><defs>${defs.join('')}</defs>${g}</svg>`;
  }
  // Photo object → markup. Real screenshots (FiveM screenshot-basic) carry a url; generated ones a seed.
  const photoHTML = (p) => p && p.url ? `<img class="art" src="${esc(p.url)}" alt="" loading="lazy" style="filter:${{ mono: 'grayscale(1)', warm: 'sepia(.35)', cool: 'hue-rotate(-20deg)', pink: 'hue-rotate(300deg)', fade: 'contrast(.85)', vivid: 'saturate(1.7)' }[p.filter] || 'none'}" />` : art(p ? p.seed : 1, p && p.scene, p && p.filter);
  Object.assign(ZX, { art, photoHTML, rng, SCENES });

  /* Photo picker shared by every app that posts images. Resolves to a photo object or null. */
  ZX.pickPhoto = () => new Promise((resolve) => {
    const photos = S().photos || [];
    const sheet = document.createElement('div');
    sheet.className = 'sheet';
    sheet.innerHTML = `<div class="sheet-card"><div class="sheet-head"><b>Foto wählen</b><button class="x" data-x>✕</button></div>
      <div class="pick-grid"><button class="pick-new" data-new>${svg('camera')}<span>Neues Foto</span></button>${photos.slice(0, 30).map((p, i) => `<button data-i="${i}">${photoHTML(p)}</button>`).join('')}</div></div>`;
    $('#screen').appendChild(sheet);
    const done = (v) => { sheet.remove(); resolve(v); };
    sheet.addEventListener('click', async (e) => {
      if (e.target === sheet || e.target.closest('[data-x]')) return done(null);
      if (e.target.closest('[data-new]')) { const p = await capture(); return done(p); }
      const b = e.target.closest('[data-i]'); if (b) done(photos[+b.dataset.i]);
    });
  });
  async function capture(scene, filter) {
    let photo = { id: uid(), seed: Math.floor(Math.random() * 1e9), scene: scene || ZX.pick(ZX.SCENES), filter: filter || '', t: Date.now() };
    if (ZX.isNui) { const r = await ZX.post('takePhoto'); if (r && r.url) photo = { ...photo, url: r.url }; }
    S().photos ||= []; S().photos.unshift(photo); S().photos = S().photos.slice(0, 200); ZX.save();
    return photo;
  }
  ZX.capture = capture;

  /* ───────── Messages ───────── */
  const REPLIES = ['Alles klar 👍', 'Bin gleich da.', 'Haha, sicher?', 'Lass später telefonieren.', 'Geht klar, bis dann!', 'Hast du Leon schon gefragt?', 'Okay, ich meld mich.', 'Wo genau?', 'Sounds good.'];
  RENDER.messages = (view, cid) => {
    if (view === 'thread') return renderThread(cid);
    if (view === 'new') {
      head('Neue Nachricht');
      body.innerHTML = `<input class="field search" id="mSearch" placeholder="Kontakt suchen" autocomplete="off" />
        <ul class="list" id="mPick">${S().contacts.map((c) => `<li><button class="row" data-cid="${c.id}"><span class="avatar s">${initials(c.name)}</span><span class="grow"><span class="t">${esc(c.name)}</span><span class="s">${esc(c.number)}</span></span></button></li>`).join('')}</ul>`;
      $('#mSearch').addEventListener('input', (e) => { const q = e.target.value.toLowerCase(); $$('#mPick li').forEach((li) => { li.hidden = !li.textContent.toLowerCase().includes(q); }); });
      $('#mPick').addEventListener('click', (e) => { const b = e.target.closest('[data-cid]'); if (b) ZX.go('thread', b.dataset.cid); });
      return;
    }
    head('Nachrichten', '', '<button type="button" id="mNew">Neu</button>');
    $('#mNew').onclick = () => ZX.go('new');
    const threads = Object.entries(S().threads).filter(([, m]) => m.length).map(([cid, m]) => ({ cid, last: m[m.length - 1] })).sort((a, b) => b.last.t - a.last.t);
    body.innerHTML = threads.length ? `<ul class="list">${threads.map(({ cid, last }) => {
      const c = ZX.contactBy(cid) || { name: 'Unbekannt' }; const u = S().unread[cid];
      return `<li><button class="row" data-cid="${cid}"><span class="avatar">${initials(c.name)}</span><span class="grow"><span class="t">${esc(c.name)}</span><span class="s">${last.me ? 'Du: ' : ''}${esc(last.text)}</span></span><span class="meta">${ago(last.t)}<br>${u ? '<span class="dot"></span>' : ''}</span></button></li>`;
    }).join('')}</ul>` : '<p class="empty">Noch keine Unterhaltungen.</p>';
    body.querySelector('.list')?.addEventListener('click', (e) => { const b = e.target.closest('[data-cid]'); if (b) ZX.go('thread', b.dataset.cid); });
  };
  function renderThread(cid) {
    const c = ZX.contactBy(cid);
    if (!c) return ZX.back();
    S().unread[cid] = 0; ZX.save();
    head(c.name, c.number, '<button type="button" id="tCall">Anrufen</button>');
    $('#tCall').onclick = () => Call.start(c.name, c.number);
    body.classList.add('flex');
    body.innerHTML = `<div class="thread" id="thread"></div>
      <form class="composer" id="composer"><button class="send ghost" type="button" id="mPhoto" aria-label="Foto">${svg('image')}</button><input class="field" id="mInput" placeholder="Nachricht" autocomplete="off" maxlength="500" /><button class="send" type="submit" aria-label="Senden">${svg('send')}</button></form>`;
    const th = $('#thread');
    const draw = () => {
      th.innerHTML = (S().threads[cid] || []).map((m) => `<div class="bubble ${m.me ? 'out' : 'in'} ${m.photo ? 'photo' : ''}">${m.photo ? `<div class="bubble-img">${ZX.photoHTML(m.photo)}</div>` : ''}${m.text ? esc(m.text) : ''}${m.gps ? `<button class="gps-chip" data-gps="${m.gps.x},${m.gps.y}">${svg('pin')} Standort öffnen</button>` : ''}<time>${hm(m.t)}</time></div>`).join('');
      th.scrollTop = th.scrollHeight;
    };
    draw();
    th.addEventListener('click', (e) => { const g = e.target.closest('[data-gps]'); if (g) { const [x, y] = g.dataset.gps.split(',').map(Number); ZX.waypoint(x, y, 'Geteilter Standort'); } });
    const sendMsg = (msg) => {
      if (ZX.online && !ZX.online()) return ZX.notify('settings', 'Nicht gesendet', 'Kein Netz. Versuche es mit WLAN oder an einem anderen Ort.');
      (S().threads[cid] ||= []).push({ me: true, t: Date.now(), ...msg }); ZX.save(); draw();
      ZX.rpc('sms.send', { to: c.number, text: msg.text || '', photo: msg.photo || null, gps: msg.gps || null });
      if (S().airplane || ZX.isNui) return; // simulated replies are mockup-only
      ZX.live.timeout(() => { th.insertAdjacentHTML('beforeend', '<div class="typing"><i></i><i></i><i></i></div>'); th.scrollTop = th.scrollHeight; }, 600);
      setTimeout(() => receive(cid, ZX.pick(REPLIES)), 1900 + Math.random() * 1200);
    };
    $('#composer').addEventListener('submit', (e) => { e.preventDefault(); const inp = $('#mInput'); const text = inp.value.trim(); if (!text) return; inp.value = ''; sendMsg({ text }); });
    $('#mPhoto').onclick = async () => { const p = await ZX.pickPhoto(); if (p) sendMsg({ text: '', photo: p }); };
    const md = ZX.data('messages');
    if (md.pending) { const p = md.pending; md.pending = null; sendMsg({ text: '', photo: p }); }
    setTimeout(() => $('#mInput')?.focus(), 50);
  }
  function receive(cid, text, extra = {}) {
    const c = ZX.contactBy(cid); if (!c) return;
    (S().threads[cid] ||= []).push({ me: false, text, t: Date.now(), ...extra });
    const cur = ZX.current;
    const viewing = cur && cur.id === 'messages' && cur.view === 'thread' && cur.arg === cid;
    if (!viewing) S().unread[cid] = (S().unread[cid] || 0) + 1;
    ZX.save();
    if (viewing) renderThread(cid);
    else ZX.notify('messages', c.name, text || (extra.photo ? '📷 Foto' : '📍 Standort'), () => { ZX.open('messages'); ZX.go('thread', cid); });
  }
  ZX.onPush('sms', (d) => {
    let c = ZX.contactByNumber(d.from);
    if (!c) { c = { id: uid(), name: d.name || d.from, number: d.from, fav: false }; S().contacts.push(c); }
    receive(c.id, d.text || '', { photo: d.photo || undefined, gps: d.gps || undefined });
  });
  ZX.sendToContact = (number, msg) => {
    let c = ZX.contactByNumber(number);
    if (!c) { c = { id: uid(), name: number, number, fav: false }; S().contacts.push(c); }
    (S().threads[c.id] ||= []).push({ me: true, t: Date.now(), ...msg }); ZX.save();
    ZX.rpc('sms.send', { to: number, ...msg });
  };
  // Mockup only: occasional incoming messages so the demo feels alive.
  if (!ZX.isNui) setInterval(() => {
    if (S().airplane || document.hidden || ZX.layers.boot && !ZX.layers.boot.hidden) return;
    const pool = S().contacts.filter((c) => S().threads[c.id]);
    if (!pool.length || Math.random() > 0.4) return;
    receive(ZX.pick(pool).id, ZX.pick(['Hey, alles gut bei dir?', 'Hast du kurz Zeit?', 'Schau mal auf Flick 👀', 'Treffen wir uns später?']));
  }, 60000);

  /* ───────── Phone + call overlay ───────── */
  let dialTab = 'keypad', dialed = '';
  RENDER.phone = () => {
    head('Telefon');
    S().recents.forEach((r) => { r.seen = true; }); ZX.save();
    const tabs = `<div class="seg" id="pSeg"><button data-t="keypad" class="${dialTab === 'keypad' ? 'on' : ''}">Tastatur</button><button data-t="recents" class="${dialTab === 'recents' ? 'on' : ''}">Verlauf</button><button data-t="favs" class="${dialTab === 'favs' ? 'on' : ''}">Favoriten</button></div>`;
    if (dialTab === 'keypad') {
      const keys = [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'], ['*', ''], ['0', '+'], ['#', '']];
      body.innerHTML = `${tabs}<div class="dial-out" id="dialOut"></div><p class="dial-name" id="dialName"></p>
        <div class="keypad">${keys.map(([k, s]) => `<button class="key" data-k="${k}"><b>${k}</b><small>${s || '&nbsp;'}</small></button>`).join('')}</div>
        <div class="dial-actions"><span></span><button class="call-btn" id="dialCall" aria-label="Anrufen">${svg('phone')}</button><button class="del" id="dialDel">Löschen</button></div>`;
      const upd = () => { $('#dialOut').textContent = dialed || ' '; const c = ZX.contactByNumber(dialed); $('#dialName').textContent = c ? c.name : ''; };
      upd();
      body.querySelector('.keypad').addEventListener('click', (e) => { const k = e.target.closest('[data-k]'); if (k && dialed.length < 14) { dialed += k.dataset.k; upd(); } });
      $('#dialDel').onclick = () => { dialed = dialed.slice(0, -1); upd(); };
      $('#dialCall').onclick = () => { if (!dialed) { const last = S().recents[0]; if (last) { dialed = last.number; upd(); } return; } const c = ZX.contactByNumber(dialed); Call.start(c ? c.name : dialed, dialed); dialed = ''; };
    } else if (dialTab === 'recents') {
      body.innerHTML = `${tabs}${S().recents.length ? `<ul class="list">${S().recents.map((r, i) => `<li><button class="row" data-r="${i}"><span class="avatar s ${r.dir === 'missed' ? 'loss' : ''}">${svg(r.dir, 'width="16" height="16" stroke="currentColor"')}</span><span class="grow"><span class="t ${r.dir === 'missed' ? 'loss' : ''}">${esc(r.name)}</span><span class="s">${r.dir === 'missed' ? 'Verpasst' : r.dir === 'in' ? 'Eingehend' : 'Ausgehend'}${r.dur ? ` · ${Math.floor(r.dur / 60)}:${pad(r.dur % 60)}` : ''}</span></span><span class="meta">${ago(r.t)}</span></button></li>`).join('')}</ul>` : '<p class="empty">Kein Anrufverlauf.</p>'}`;
      body.querySelector('.list')?.addEventListener('click', (e) => { const b = e.target.closest('[data-r]'); if (b) { const r = S().recents[b.dataset.r]; Call.start(r.name, r.number); } });
    } else {
      const favs = S().contacts.filter((c) => c.fav);
      body.innerHTML = `${tabs}${favs.length ? `<ul class="list">${favs.map((c) => `<li><button class="row" data-cid="${c.id}"><span class="avatar">${initials(c.name)}</span><span class="grow"><span class="t">${esc(c.name)}</span><span class="s">${esc(c.number)}</span></span><span class="meta">${svg('phone', 'width="18" height="18" stroke="var(--signal)"')}</span></button></li>`).join('')}</ul>` : '<p class="empty">Markiere Kontakte als Favorit, um sie hier zu sehen.</p>'}`;
      body.querySelector('.list')?.addEventListener('click', (e) => { const b = e.target.closest('[data-cid]'); if (b) { const c = ZX.contactBy(b.dataset.cid); Call.start(c.name, c.number); } });
    }
    $('#pSeg').addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (b) { dialTab = b.dataset.t; ZX.render(); } });
  };

  const Call = (() => {
    const call = ZX.layers.call;
    let timer = null, start = 0, info = null, ringtone = null;
    const state = (t) => { $('#callState').textContent = t; };
    function ring(on) {
      if (ringtone) { clearInterval(ringtone); ringtone = null; }
      if (!on || !S().sound || S().dnd) return;
      const beep = () => { const ac = ZX.audio(); if (!ac) return; const t = ac.currentTime; [0, .25].forEach((d) => { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 660; o.connect(g); g.connect(ac.destination); g.gain.setValueAtTime(.05, t + d); g.gain.exponentialRampToValueAtTime(.0001, t + d + .2); o.start(t + d); o.stop(t + d + .22); }); };
      beep(); ringtone = setInterval(beep, 1600);
    }
    function showOverlay(name) {
      $('#callAvatar').textContent = initials(name);
      $('#callName').textContent = name;
      $$('.cbtn', call).forEach((b) => b.classList.remove('on'));
      call.classList.add('ringing'); call.classList.remove('held');
      call.hidden = false; call.classList.remove('enter'); void call.offsetWidth; call.classList.add('enter');
      ZX.island(`Anruf · ${name}`);
    }
    function connected() {
      ring(false);
      call.classList.remove('ringing'); $('#callAnswer').hidden = true; $('#endCall').hidden = false;
      start = Date.now(); clearInterval(timer);
      timer = setInterval(() => { const s = Math.floor((Date.now() - start) / 1000); state(`${pad(Math.floor(s / 60))}:${pad(s % 60)}`); }, 250);
    }
    function startCall(name, number) {
      if (S().airplane) return ZX.notify('settings', 'Flugmodus aktiv', 'Anrufe sind deaktiviert.');
      if (ZX.online && !ZX.online()) return ZX.notify('settings', 'Kein Netz', 'Kein Mobilfunk und kein WLAN in Reichweite.');
      info = { name, number, dir: 'out' };
      showOverlay(name); state('Wählt …');
      $('#callAnswer').hidden = true; $('#endCall').hidden = false;
      ZX.rpc('call.start', { number }).then((r) => {
        if (!info) return;
        if (ZX.isNui && r && r.ok === false) { state(r.error || 'Nicht erreichbar'); setTimeout(() => end(true), 1800); }
      });
      if (!ZX.isNui) setTimeout(() => { if (info && call.classList.contains('ringing')) connected(); }, ZX.reduced ? 200 : 2200);
    }
    function incoming(name, number) {
      info = { name, number, dir: 'in' };
      showOverlay(name); state('Eingehender Anruf');
      $('#callAnswer').hidden = false; $('#endCall').hidden = true;
      ring(true);
    }
    function end(remote = false) {
      ring(false);
      clearInterval(timer);
      const dur = start ? Math.floor((Date.now() - start) / 1000) : 0;
      if (info) {
        const missed = info.dir === 'in' && !start;
        S().recents.unshift({ ...info, dir: missed ? 'missed' : info.dir, t: Date.now(), dur, seen: !missed });
        S().recents = S().recents.slice(0, 50); ZX.save();
      }
      start = 0; info = null;
      call.hidden = true; ZX.island('');
      if (!remote) ZX.rpc('call.end');
      if (ZX.current) ZX.render(true);
    }
    $('#endCall').addEventListener('click', () => end());
    $('#declineCall').addEventListener('click', () => end());
    $('#acceptCall').addEventListener('click', () => { ZX.rpc('call.accept'); connected(); });
    call.addEventListener('click', (e) => {
      const b = e.target.closest('[data-toggle]'); if (!b) return;
      b.classList.toggle('on');
      if (b.dataset.toggle === 'hold') call.classList.toggle('held', b.classList.contains('on'));
      if (b.dataset.toggle === 'mute') ZX.post('callMute', { muted: b.classList.contains('on') });
    });
    ZX.onPush('call:incoming', (d) => incoming(d.name || d.number, d.number));
    ZX.onPush('call:accepted', () => { if (info) connected(); });
    ZX.onPush('call:ended', () => { if (info) end(true); });
    return { start: startCall, end, incoming, hangupIfActive: () => { if (info) end(); } };
  })();
  window.ZX_Call = Call;
  ZX.call = Call.start;

  /* ───────── Contacts ───────── */
  RENDER.contacts = (view, cid) => {
    if (view === 'edit' || view === 'add') {
      const c = view === 'edit' ? ZX.contactBy(cid) : { name: '', number: '', fav: false };
      head(view === 'add' ? 'Neuer Kontakt' : 'Bearbeiten');
      body.innerHTML = `<form id="cForm"><label class="lbl" for="cName">Name</label><input class="field" id="cName" maxlength="40" value="${esc(c.name)}" required />
        <label class="lbl" for="cNum">Nummer</label><input class="field num" id="cNum" maxlength="14" inputmode="tel" value="${esc(c.number)}" placeholder="555-0000" required />
        <p class="err" id="cErr"></p><button class="btn" type="submit">Speichern</button>${view === 'edit' ? '<button class="btn warn" type="button" id="cDel">Kontakt löschen</button>' : ''}</form>`;
      $('#cForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = $('#cName').value.trim(), number = $('#cNum').value.trim();
        if (!name || !/^[\d\-+ ]{3,14}$/.test(number)) { $('#cErr').textContent = 'Bitte Name und gültige Nummer angeben.'; return; }
        if (view === 'add') { const id = uid(); S().contacts.push({ id, name, number, fav: false }); ZX.save(); ZX.back(); ZX.go('detail', id); return; }
        Object.assign(c, { name, number }); ZX.save(); ZX.back();
      });
      $('#cDel')?.addEventListener('click', () => { S().contacts = S().contacts.filter((x) => x.id !== cid); delete S().threads[cid]; delete S().unread[cid]; ZX.save(); ZX.current.view = null; ZX.current.parent = null; ZX.render(); });
      return;
    }
    if (view === 'detail') {
      const c = ZX.contactBy(cid); if (!c) return ZX.back();
      head(c.name, 'Kontakt', '<button type="button" id="cEdit">Bearbeiten</button>');
      $('#cEdit').onclick = () => ZX.go('edit', cid);
      body.innerHTML = `<div class="about"><div class="call-avatar" style="margin:0 auto">${initials(c.name)}</div><p class="num" style="font-size:16px;color:var(--paper);letter-spacing:.08em;margin-top:14px">${esc(c.number)}</p></div>
        <div class="quick four"><button id="qCall">${svg('phone')}Anrufen</button><button id="qMsg">${svg('messages')}Nachricht</button><button id="qPay">${svg('bank')}Senden</button><button id="qGps">${svg('pin')}Standort</button></div>
        <div class="group" style="margin-top:14px"><div class="row"><span class="grow"><span class="t">Favorit</span><span class="s">Erscheint im Telefon unter Favoriten</span></span><button class="switch ${c.fav ? 'on' : ''}" id="cFav" role="switch" aria-checked="${c.fav}" aria-label="Favorit"></button></div></div>`;
      $('#qCall').onclick = () => Call.start(c.name, c.number);
      $('#qMsg').onclick = () => { ZX.open('messages'); ZX.go('thread', c.id); };
      $('#qPay').onclick = () => { ZX.open('bank'); ZX.go('transfer', c.id); };
      $('#qGps').onclick = async () => { const pos = await ZX.position(); ZX.sendToContact(c.number, { text: '', gps: pos }); ZX.notify('maps', 'Standort geteilt', `an ${c.name}`); };
      $('#cFav').onclick = (e) => { c.fav = !c.fav; ZX.save(); e.currentTarget.classList.toggle('on', c.fav); e.currentTarget.setAttribute('aria-checked', c.fav); };
      return;
    }
    head('Kontakte', `${S().contacts.length} Einträge`, '<button type="button" id="cAdd">Neu</button>');
    $('#cAdd').onclick = () => ZX.go('add');
    const sorted = [...S().contacts].sort((a, b) => a.name.localeCompare(b.name, 'de'));
    let letter = '';
    body.innerHTML = `<input class="field search" id="cSearch" placeholder="Suchen" autocomplete="off" /><div class="panel me-card"><span class="avatar">${initials(S().owner.name)}</span><span class="grow"><span class="t">Meine Nummer</span><br><span class="num" style="color:var(--signal)">${esc(S().owner.number)}</span></span></div>
      <ul class="list" id="cList">${sorted.map((c) => { const l = c.name[0].toUpperCase(); const h = l !== letter ? `<li class="section-label tag">${(letter = l)}</li>` : ''; return `${h}<li data-name="${esc(c.name.toLowerCase())}"><button class="row" data-cid="${c.id}"><span class="avatar s">${initials(c.name)}</span><span class="grow"><span class="t">${esc(c.name)}</span></span>${c.fav ? '<span class="dot"></span>' : ''}</button></li>`; }).join('')}</ul>`;
    $('#cSearch').addEventListener('input', (e) => { const q = e.target.value.toLowerCase(); $$('#cList li[data-name]').forEach((li) => { li.hidden = !li.dataset.name.includes(q); }); $$('#cList .section-label').forEach((h) => { h.hidden = !!q; }); });
    $('#cList').addEventListener('click', (e) => { const b = e.target.closest('[data-cid]'); if (b) ZX.go('detail', b.dataset.cid); });
  };

  /* ───────── Bank ───────── */
  function countUp(el, to, from = 0) {
    if (ZX.reduced || !el) { if (el) el.textContent = money(to); return; }
    const t0 = performance.now(), dur = 900;
    (function f(t) { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4); el.textContent = money(from + (to - from) * e); if (p < 1) requestAnimationFrame(f); })(t0);
  }
  ZX.countUp = countUp;
  RENDER.bank = (view, cid) => {
    if (view === 'transfer') {
      head('Überweisen', 'Zurex Bank');
      body.innerHTML = `<form id="bForm">
        <label class="lbl" for="bTo">Empfänger</label><select class="field" id="bTo"><option value="">Nummer eingeben …</option>${S().contacts.map((c) => `<option value="${c.id}" ${c.id === cid ? 'selected' : ''}>${esc(c.name)} · ${esc(c.number)}</option>`).join('')}</select>
        <input class="field num" id="bNum" placeholder="Nummer, z. B. 555-0123" style="margin-top:8px" ${cid ? 'hidden' : ''} />
        <label class="lbl" for="bAmt">Betrag (€)</label><input class="field num amount" id="bAmt" inputmode="decimal" placeholder="0,00" autocomplete="off" />
        <label class="lbl" for="bNote">Verwendungszweck</label><input class="field" id="bNote" maxlength="40" placeholder="Optional" />
        <p class="err" id="bErr"></p>
        <button class="btn" type="submit">Jetzt senden</button>
        <p class="disclaimer">Verfügbar: ${money(S().bank.balance)}</p></form>`;
      $('#bTo').onchange = () => { $('#bNum').hidden = !!$('#bTo').value; };
      $('#bForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = Math.round(parseFloat($('#bAmt').value.replace(/\./g, '').replace(',', '.')) * 100) / 100;
        const c = ZX.contactBy($('#bTo').value);
        const number = c ? c.number : $('#bNum').value.trim();
        const name = c ? c.name : number;
        if (!number) return void ($('#bErr').textContent = 'Bitte Empfänger wählen.');
        if (!(amount > 0)) return void ($('#bErr').textContent = 'Bitte einen gültigen Betrag eingeben.');
        if (amount > S().bank.balance) return void ($('#bErr').textContent = 'Nicht genug Guthaben.');
        const res = await ZX.rpc('bank.transfer', { to: number, name, amount, note: $('#bNote').value.trim() });
        if (!res || res.ok === false) return void ($('#bErr').textContent = (res && res.error) || 'Überweisung abgelehnt.');
        const before = S().bank.balance;
        if (typeof res.balance === 'number') { S().bank.balance = res.balance; S().bank.tx.unshift({ id: uid(), label: name, note: $('#bNote').value.trim() || 'Überweisung', amount: -amount, t: Date.now() }); ZX.save(); }
        else ZX.bankApply(-amount, name, $('#bNote').value.trim() || 'Überweisung');
        ZX.back();
        countUp($('#bBal'), S().bank.balance, before);
        ZX.notify('bank', 'Überweisung gesendet', `${money(amount)} an ${name}`);
      });
      setTimeout(() => $('#bAmt')?.focus(), 50);
      return;
    }
    head('Zurex Bank', 'Konto', '<button type="button" id="bSend">Senden</button>');
    $('#bSend').onclick = () => ZX.go('transfer');
    if (ZX.isNui) ZX.rpc('bank.balance').then((r) => { if (r && typeof r.balance === 'number' && r.balance !== S().bank.balance) { const b = S().bank.balance; S().bank.balance = r.balance; ZX.save(); countUp($('#bBal'), r.balance, b); } });
    const t30 = Date.now() - 30 * D;
    const income = S().bank.tx.filter((t) => t.amount > 0 && t.t > t30).reduce((s, t) => s + t.amount, 0);
    const spend = S().bank.tx.filter((t) => t.amount < 0 && t.t > t30).reduce((s, t) => s - t.amount, 0);
    body.innerHTML = `<div class="card"><div style="display:flex;justify-content:space-between"><span class="tag">Girokonto</span><span class="chip on">${esc(ZX.MODELS[S().model].short)} Black</span></div>
        <p class="bal" id="bBal">${money(S().bank.balance)}</p><p class="iban">${esc(S().bank.iban)}</p></div>
      <div class="stats" style="margin-top:12px"><div><span>Eingang 30 T</span><b class="gain">+${money(income)}</b></div><div><span>Ausgang 30 T</span><b class="loss">−${money(spend)}</b></div></div>
      <div class="section-label"><span class="tag">Umsätze</span><span class="tag">${S().bank.tx.length}</span></div>
      ${S().bank.tx.length ? `<ul class="list">${S().bank.tx.slice(0, 40).map((t) => `<li class="row tx"><span class="ico">${svg(t.amount >= 0 ? 'arrowDown' : 'arrowUp')}</span><span class="grow"><span class="t">${esc(t.label)}</span><span class="s">${esc(t.note || '')} · ${ago(t.t)}</span></span><span class="amt ${t.amount >= 0 ? 'gain' : 'loss'}">${t.amount >= 0 ? '+' : '−'}${money(Math.abs(t.amount))}</span></li>`).join('')}</ul>` : '<p class="empty">Noch keine Umsätze.</p>'}`;
  };

  /* ───────── Markets overview (Pulse) ───────── */
  RENDER.pulse = (view, sym, isLive) => {
    if (!isLive) { const off = ZX.Market.on(() => ZX.render(true)); ZX.live.add(off); }
    if (view === 'detail') { ZX.engines.chartView(ZX.appMeta('pulse'), sym, isLive); return; }
    if (!isLive) head('Märkte', 'Live');
    const groups = { stock: 'Aktien', crypto: 'Krypto', fx: 'Devisen', commodity: 'Rohstoffe', etf: 'ETFs' };
    const scroll = body.scrollTop;
    body.innerHTML = Object.entries(groups).map(([k, label]) => {
      const list = ZX.Market.list(k); if (!list.length) return '';
      return `<div class="section-label"><span class="tag">${label}</span><span class="tag">${list.length}</span></div><ul class="list">${list.map(instRow).join('')}</ul>`;
    }).join('') + '<p class="disclaimer">Simulierte Kurse für Rollenspiel, keine echten Marktdaten.</p>';
    body.scrollTop = scroll;
    body.onclick = (e) => { const b = e.target.closest('[data-sym]'); if (b) ZX.go('detail', b.dataset.sym); };
  };
  function instRow(m) {
    const ch = ZX.Market.change(m), up = ch >= 0;
    return `<li><button class="row inst" data-sym="${m.sym}"><span class="sym-badge" style="--h:${[...m.sym].reduce((s, c) => s + c.charCodeAt(0), 0) % 360}">${esc(m.sym.slice(0, 3))}</span><span class="grow"><span class="t">${esc(m.name)}</span><span class="s">${esc(m.sym)}</span></span><svg class="spark" viewBox="0 0 70 30" preserveAspectRatio="none"><path d="${ZX.sparkPath(m.hist.slice(-40), 70, 30, 3)}" stroke="${up ? 'var(--gain)' : 'var(--loss)'}" stroke-width="1.6"/></svg><span class="px"><b>${ZX.Market.fmt(m)}</b><span class="pill ${up ? 'gain' : 'loss'}">${up ? '+' : ''}${ch.toFixed(2)}%</span></span></button></li>`;
  }
  ZX.instRow = instRow;

  /* ───────── Notes ───────── */
  RENDER.notes = (view, nid) => {
    if (view === 'edit') {
      const n = S().notes.find((x) => x.id === nid); if (!n) return ZX.back();
      head('Notiz', ago(n.t), '<button type="button" id="nDel">Löschen</button>');
      $('#nDel').onclick = () => { S().notes = S().notes.filter((x) => x.id !== nid); ZX.save(); ZX.back(); };
      body.classList.add('flex');
      body.innerHTML = `<input class="note-title" id="nTitle" maxlength="60" placeholder="Titel" value="${esc(n.title)}" /><textarea class="note-edit" id="nBody" placeholder="Schreib los …">${esc(n.body)}</textarea>`;
      const sync = () => { n.title = $('#nTitle').value; n.body = $('#nBody').value; n.t = Date.now(); ZX.save(); };
      $('#nTitle').addEventListener('input', sync); $('#nBody').addEventListener('input', sync);
      if (!n.body) setTimeout(() => $('#nBody').focus(), 50);
      return;
    }
    head('Notizen', `${S().notes.length} Notizen`, '<button type="button" id="nNew">Neu</button>');
    $('#nNew').onclick = () => { const n = { id: uid(), title: '', body: '', t: Date.now() }; S().notes.unshift(n); ZX.save(); ZX.go('edit', n.id); };
    const list = [...S().notes].sort((a, b) => b.t - a.t);
    body.innerHTML = list.length ? `<ul class="list" id="nList">${list.map((n) => `<li><button class="row note-row" data-nid="${n.id}"><span class="grow"><span class="t">${esc(n.title || 'Ohne Titel')}</span><span class="s">${esc(n.body.split('\n')[0] || 'Leer')}</span></span><span class="meta">${ago(n.t)}</span></button></li>`).join('')}</ul>` : '<p class="empty">Noch keine Notizen.</p>';
    $('#nList')?.addEventListener('click', (e) => { const b = e.target.closest('[data-nid]'); if (b) ZX.go('edit', b.dataset.nid); });
  };

  /* ───────── Calendar ───────── */
  const today = new Date();
  let calMonth = new Date(today.getFullYear(), today.getMonth(), 1), calSel = ymd(today);
  RENDER.calendar = () => {
    head('Kalender', calMonth.toLocaleDateString('de-DE', { year: 'numeric' }));
    const y = calMonth.getFullYear(), mo = calMonth.getMonth();
    const first = (new Date(y, mo, 1).getDay() + 6) % 7, days = new Date(y, mo + 1, 0).getDate();
    let cells = '';
    for (let i = 0; i < first; i++) cells += '<button class="muted" tabindex="-1"></button>';
    for (let d = 1; d <= days; d++) {
      const k = `${y}-${pad(mo + 1)}-${pad(d)}`;
      cells += `<button data-d="${k}" class="${k === ymd(new Date()) ? 'today' : ''} ${k === calSel ? 'sel' : ''} ${S().events[k]?.length ? 'has' : ''}">${d}</button>`;
    }
    const evs = (S().events[calSel] || []).slice().sort((a, b) => a.time.localeCompare(b.time));
    const selDate = new Date(calSel + 'T12:00:00');
    body.innerHTML = `<div class="cal-head"><b>${calMonth.toLocaleDateString('de-DE', { month: 'long' })}</b><div class="cal-nav"><button id="calPrev" aria-label="Vorheriger Monat">‹</button><button id="calNext" aria-label="Nächster Monat">›</button></div></div>
      <div class="cal">${['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'].map((w) => `<span class="wd">${w}</span>`).join('')}${cells}</div>
      <div class="section-label"><span class="tag">${selDate.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</span><span class="tag">${evs.length} Termine</span></div>
      <div id="evList">${evs.length ? evs.map((ev) => `<div class="ev"><div><b>${esc(ev.title)}</b><small>${esc(ev.time)} Uhr</small></div><button class="x" data-ev="${ev.id}" aria-label="Termin löschen">✕</button></div>`).join('') : '<p class="empty" style="padding:18px">Keine Termine.</p>'}</div>
      <form class="ev-add" id="evForm"><input class="field num" id="evTime" type="time" value="12:00" required /><input class="field" id="evTitle" placeholder="Neuer Termin" maxlength="50" required /><button class="send" type="submit" aria-label="Hinzufügen">${svg('plus')}</button></form>`;
    $('#calPrev').onclick = () => { calMonth = new Date(y, mo - 1, 1); ZX.render(); };
    $('#calNext').onclick = () => { calMonth = new Date(y, mo + 1, 1); ZX.render(); };
    body.querySelector('.cal').addEventListener('click', (e) => { const b = e.target.closest('[data-d]'); if (b) { calSel = b.dataset.d; ZX.render(true); } });
    $('#evList').addEventListener('click', (e) => { const b = e.target.closest('[data-ev]'); if (b) { S().events[calSel] = S().events[calSel].filter((x) => x.id !== b.dataset.ev); ZX.save(); ZX.render(true); } });
    $('#evForm').addEventListener('submit', (e) => { e.preventDefault(); const title = $('#evTitle').value.trim(); if (!title) return; (S().events[calSel] ||= []).push({ id: uid(), time: $('#evTime').value, title }); ZX.save(); ZX.render(true); });
  };
  // Event reminders: one notification when an event starts.
  setInterval(() => {
    const n = new Date(), k = ymd(n), t = `${pad(n.getHours())}:${pad(n.getMinutes())}`;
    (S().events[k] || []).forEach((ev) => { if (ev.time === t && !ev.fired) { ev.fired = true; ZX.save(); ZX.notify('calendar', 'Termin', `${ev.time} · ${ev.title}`, null, 'calendar'); } });
  }, 20000);

  /* ───────── Zurex Store ───────── */
  let storeCat = 'all';
  RENDER.store = (view, appId) => {
    const isInst = (id) => ZX.installed().some((a) => a.id === id);
    if (view === 'detail') {
      const a = ZX.appMeta(appId); if (!a) return ZX.back();
      head(a.name, ZX.CATS[a.cat]);
      body.innerHTML = `<div class="store-hero"><div class="store-icon">${ZX.iconHTML(a, false)}</div><div><b>${esc(a.name)}</b><p>${esc(a.dev || 'Zurex Labs')}</p><p class="s">${ZX.CATS[a.cat]} · #${a.idx}</p></div></div>
        <div class="store-cta">${a.core ? '<button class="btn ghost" disabled>Systemapp</button>' : isInst(a.id) ? '<button class="btn" id="stOpen">Öffnen</button><button class="btn warn" id="stDel">Entfernen</button>' : '<button class="btn" id="stGet">Laden</button>'}</div>
        <div class="stats"><div><span>Bewertung</span><b>${(4 + (parseInt(a.idx, 10) * 7 % 10) / 10).toFixed(1)} ★</b></div><div><span>Größe</span><b>${(8 + parseInt(a.idx, 10) * 13 % 140)} MB</b></div></div>
        <p class="store-desc">${esc(a.desc || `${a.name} für dein Zurex.`)}</p>`;
      $('#stGet')?.addEventListener('click', () => { ZX.S.installed.push(a.id); ZX.save(); ZX.notify('store', 'Installiert', a.name, () => ZX.open(a.id)); ZX.render(); });
      $('#stOpen')?.addEventListener('click', () => ZX.open(a.id));
      $('#stDel')?.addEventListener('click', () => { ZX.S.installed = ZX.S.installed.filter((x) => x !== a.id); ZX.save(); ZX.render(); });
      return;
    }
    head('Zurex Store', `${ZX.APPS.length} Apps`);
    const cats = ['all', ...Object.keys(ZX.CATS).filter((c) => ZX.APPS.some((a) => a.cat === c && !a.core))];
    const list = ZX.APPS.filter((a) => !a.core && (storeCat === 'all' || a.cat === storeCat));
    const featured = ZX.APPS.filter((a) => a.featured);
    body.innerHTML = `<input class="field search" id="stSearch" placeholder="Apps, Games, Tools suchen" autocomplete="off" />
      ${storeCat === 'all' ? `<div class="feat-row">${featured.map((a) => `<button class="feat" data-detail="${a.id}" style="--tint:${a.tint || 'var(--signal)'}"><span class="tag">${ZX.CATS[a.cat]}</span><b>${esc(a.name)}</b><span class="s feat-desc">${esc(a.desc || '')}</span>${ZX.iconHTML(a, false)}</button>`).join('')}</div>` : ''}
      <div class="chips" id="stCats">${cats.map((c) => `<button data-cat="${c}" class="chip ${c === storeCat ? 'on' : ''}">${c === 'all' ? 'Alle' : ZX.CATS[c]}</button>`).join('')}</div>
      <ul class="list" id="stList">${list.map((a) => `<li data-name="${esc((a.name + ' ' + (a.tags || '') + ' ' + ZX.CATS[a.cat]).toLowerCase())}"><div class="row store-row"><span class="mini-icon" data-detail="${a.id}">${ZX.iconHTML(a, false)}</span><span class="grow" data-detail="${a.id}"><span class="t">${esc(a.name)}</span><span class="s">${esc(a.desc || ZX.CATS[a.cat])}</span></span><button class="get ${isInst(a.id) ? 'on' : ''}" data-get="${a.id}">${isInst(a.id) ? 'Öffnen' : 'Laden'}</button></div></li>`).join('')}</ul>`;
    $('#stSearch').addEventListener('input', (e) => { const q = e.target.value.toLowerCase(); $$('#stList li').forEach((li) => { li.hidden = !li.dataset.name.includes(q); }); });
    body.onclick = (e) => {
      if (e.target.closest('[data-open]')) { e.stopPropagation(); }
      const c = e.target.closest('[data-cat]'); if (c) { storeCat = c.dataset.cat; ZX.render(); return; }
      const g = e.target.closest('[data-get]');
      if (g) { const id = g.dataset.get; if (isInst(id)) ZX.open(id); else { ZX.S.installed.push(id); ZX.save(); g.textContent = 'Öffnen'; g.classList.add('on'); ZX.chime(); } return; }
      const d = e.target.closest('[data-detail]'); if (d) ZX.go('detail', d.dataset.detail);
    };
  };
  // Store tiles reuse iconHTML (which carries data-open); inside the store a tap shows details instead.
  document.addEventListener('click', (e) => {
    if (!ZX.current || ZX.current.id !== 'store') return;
    const o = e.target.closest('#appBody [data-open]');
    if (o) { e.stopImmediatePropagation(); e.preventDefault(); ZX.go('detail', o.dataset.open); }
  }, true);

  /* ───────── Gallery ───────── */
  RENDER.gallery = (view, pid) => {
    const photos = S().photos || [];
    if (view === 'photo') {
      const p = photos.find((x) => x.id === pid); if (!p) return ZX.back();
      head('Foto', new Date(p.t).toLocaleString('de-DE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }), '<button type="button" id="gDel">Löschen</button>');
      body.innerHTML = `<div class="photo-full">${photoHTML(p)}</div><div class="quick"><button id="gFlick">${svg('heart')}Auf Flick</button><button id="gSend">${svg('send')}Senden</button><button id="gGhost">${svg('ghost')}Ghost</button></div>`;
      $('#gDel').onclick = () => { S().photos = photos.filter((x) => x.id !== pid); ZX.save(); ZX.back(); };
      $('#gFlick').onclick = () => { ZX.open('flick'); ZX.go('compose', { photo: p }); };
      $('#gGhost').onclick = () => { ZX.open('ghost'); ZX.go('send', { photo: p }); };
      $('#gSend').onclick = () => { ZX.open('messages'); ZX.go('new'); ZX.data('messages').pending = p; };
      return;
    }
    head('Fotos', `${photos.length} Objekte`, '<button type="button" id="gCam">Kamera</button>');
    $('#gCam').onclick = () => ZX.open('camera');
    body.innerHTML = photos.length ? `<div class="photo-grid">${photos.map((p) => `<button data-pid="${p.id}">${photoHTML(p)}</button>`).join('')}</div>` : '<p class="empty">Noch keine Fotos. Öffne die Kamera.</p>';
    body.onclick = (e) => { const b = e.target.closest('[data-pid]'); if (b) ZX.go('photo', b.dataset.pid); };
  };
})();
