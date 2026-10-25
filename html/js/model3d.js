/*
 * 3D back view of the Zurex XR7 (mockup stage only, three.js r128 from cdnjs).
 * Procedural model: titanium band, frosted glass back, full-width camera plateau,
 * lens island (3 lenses Pro/Ultra, 2 on XR7), flash, LiDAR, side buttons and the Z-ebra emblem.
 * Drag to rotate; it idles with a slow sway. Finish and model follow the Settings / stage switcher.
 */
(() => {
  'use strict';
  if (ZX.isNui) return;
  const host = document.getElementById('deviceBack');
  if (!host || !window.THREE) return;
  const T = window.THREE;

  const DIMS = { // width, height, depth, corner radius (mm)
    ultra: { w: 78, h: 163, d: 8.8, r: 13 },
    pro: { w: 71.5, h: 150, d: 8.6, r: 12 },
    base: { w: 71.5, h: 147.6, d: 7.9, r: 11 },
  };

  host.classList.add('is3d');
  host.innerHTML = '<canvas id="phone3d"></canvas><span class="d3-hint">Ziehen zum Drehen</span>';
  const canvas = host.querySelector('canvas');
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.physicallyCorrectLights = true;

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(30, 1, 1, 2000);
  camera.position.set(0, 0, 400);

  /* Environment: a soft studio cube with pink and white light boxes, so metal and glass have something to reflect. */
  function envFace(kind) {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 0, 256); grd.addColorStop(0, '#1a1418'); grd.addColorStop(1, '#070506'); g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
    const box = (x, y, w, h, col, blur) => { g.filter = `blur(${blur}px)`; g.fillStyle = col; g.fillRect(x, y, w, h); g.filter = 'none'; };
    if (kind === 'px') { box(40, 30, 60, 190, '#ffffff', 10); box(150, 60, 50, 140, '#f472b6', 14); }
    if (kind === 'nx') { box(70, 40, 110, 170, '#fbd2e6', 18); }
    if (kind === 'py') { box(30, 30, 196, 196, '#ffffff', 30); }
    if (kind === 'pz') { box(20, 90, 216, 40, '#f9a8d4', 16); }
    if (kind === 'nz') { box(90, 20, 80, 216, '#ffffff', 12); box(10, 120, 50, 60, '#ec4899', 12); }
    return c;
  }
  // Studio built from emissive panels and baked into a PMREM environment (same idea as RoomEnvironment).
  const studio = new T.Scene();
  studio.add(new T.Mesh(new T.BoxGeometry(600, 600, 600), new T.MeshBasicMaterial({ color: 0x120c10, side: T.BackSide })));
  const panel = (w, h, x, y, z, color, ry = 0, rx = 0) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color, side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); studio.add(m); };
  panel(160, 400, -260, 40, 120, 0xffffff, Math.PI / 2);
  panel(120, 300, 270, 0, -80, 0xf472b6, -Math.PI / 2);
  panel(500, 500, 0, 290, 0, 0xffffff, 0, Math.PI / 2);
  panel(300, 80, 0, -40, 290, 0xf9a8d4, Math.PI);
  panel(120, 420, 120, 0, -290, 0xffffff);
  try { scene.environment = new T.PMREMGenerator(renderer).fromScene(studio, 0.02).texture; } catch (e) { console.warn('[zurex 3d] env', e.stack); }
  void envFace;

  scene.add(new T.HemisphereLight(0xffe6f2, 0x140a10, 0.6));
  const key = new T.DirectionalLight(0xffffff, 2.4); key.position.set(-150, 220, 300); scene.add(key);
  const rim = new T.DirectionalLight(0xf472b6, 1.6); rim.position.set(260, -60, -220); scene.add(rim);
  const fill = new T.DirectionalLight(0xffd6ea, 0.8); fill.position.set(200, 100, 200); scene.add(fill);

  const group = new T.Group(); scene.add(group);

  function rounded(w, h, r) {
    const s = new T.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  // Logo texture rendered from the SVG mark.
  function logoTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const tex = new T.CanvasTexture(c); tex.encoding = T.sRGBEncoding; tex.anisotropy = 8;
    const img = new Image();
    const svgStr = ZX.logo().replace('var(--signal)', '#f472b6').replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" ');
    img.onload = () => { const g = c.getContext('2d'); g.clearRect(0, 0, 512, 512); g.drawImage(img, 0, 0, 512, 512); tex.needsUpdate = true; };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
    return tex;
  }
  function textTexture(text, size = 48, color = 'rgba(0,0,0,.45)') {
    const c = document.createElement('canvas'); c.width = 512; c.height = 96; const g = c.getContext('2d');
    g.fillStyle = color; g.font = `700 ${size}px "Zen Kaku Gothic New", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.letterSpacing = '12px'; g.fillText(text, 256, 48);
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
  }
  function screenTexture() {
    const c = document.createElement('canvas'); c.width = 420; c.height = 900; const g = c.getContext('2d');
    const grd = g.createRadialGradient(210, 520, 20, 210, 520, 520); grd.addColorStop(0, '#4a1530'); grd.addColorStop(1, '#0b080a'); g.fillStyle = grd; g.fillRect(0, 0, 420, 900);
    g.strokeStyle = 'rgba(244,114,182,.25)'; for (let i = 0; i < 14; i++) { g.beginPath(); g.moveTo(210, 560); g.lineTo(-400 + i * 90, 900); g.stroke(); }
    for (let y = 600; y < 900; y += (y - 560) * .18 + 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(420, y); g.stroke(); }
    g.fillStyle = '#f2eef0'; g.font = '700 120px "Dela Gothic One", sans-serif'; g.textAlign = 'center'; g.fillText('21:47', 210, 260);
    g.font = '500 26px "Zen Kaku Gothic New", sans-serif'; g.fillStyle = '#d6cdd2'; g.fillText('Zurex XR7', 210, 130);
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
  }
  const logoTex = logoTexture();

  let mats = null;
  function build(model, finishHex) {
    while (group.children.length) { const o = group.children.pop(); o.traverse?.((m) => { if (m.geometry) m.geometry.dispose(); }); }
    const D = DIMS[model] || DIMS.ultra;
    const col = new T.Color(finishHex);
    const titanium = model !== 'base';
    mats = {
      frame: new T.MeshPhysicalMaterial({ color: col, metalness: titanium ? 0.95 : 0.85, roughness: titanium ? 0.32 : 0.22, clearcoat: titanium ? 0.2 : 0.6, clearcoatRoughness: 0.3, envMapIntensity: 1.2 }),
      back: new T.MeshPhysicalMaterial({ color: col.clone().multiplyScalar(titanium ? 0.92 : 1), metalness: 0.15, roughness: 0.62, clearcoat: 0.9, clearcoatRoughness: 0.55, envMapIntensity: 0.9 }),
      plateau: new T.MeshPhysicalMaterial({ color: col.clone().multiplyScalar(0.98), metalness: titanium ? 0.9 : 0.3, roughness: titanium ? 0.28 : 0.4, clearcoat: 0.8, envMapIntensity: 1.3 }),
      ring: new T.MeshPhysicalMaterial({ color: titanium ? 0x2a2729 : col.clone().multiplyScalar(0.8), metalness: 1, roughness: 0.25 }),
      lens: new T.MeshPhysicalMaterial({ color: 0x05060a, metalness: 0.2, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02, reflectivity: 1, envMapIntensity: 2 }),
      lensInner: new T.MeshPhysicalMaterial({ color: 0x0d1830, metalness: 0.6, roughness: 0.1, emissive: 0x1a0a20, emissiveIntensity: 0.6, clearcoat: 1 }),
      dark: new T.MeshStandardMaterial({ color: 0x0b0b0d, roughness: 0.6, metalness: 0.2 }),
      screen: new T.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.08, metalness: 0, clearcoat: 1, emissive: 0xffffff, emissiveMap: screenTexture(), emissiveIntensity: 0.9 }),
      bezel: new T.MeshStandardMaterial({ color: 0x050304, roughness: 0.3 }),
      flash: new T.MeshPhysicalMaterial({ color: 0xfff3d6, roughness: 0.3, emissive: 0x332a18, transmission: 0.2 }),
      logo: new T.MeshBasicMaterial({ map: logoTex, transparent: true }),
      text: new T.MeshBasicMaterial({ map: textTexture('ZUREX', 44, titanium ? 'rgba(0,0,0,.42)' : 'rgba(0,0,0,.38)'), transparent: true }),
    };
    const { w, h, d, r } = D;
    // Band (frame)
    const bandGeo = new T.ExtrudeGeometry(rounded(w, h, r), { depth: d - 1.6, bevelEnabled: true, bevelThickness: 0.8, bevelSize: 0.8, bevelSegments: 6, curveSegments: 32 });
    bandGeo.translate(0, 0, -(d - 1.6) / 2);
    group.add(new T.Mesh(bandGeo, mats.frame));
    // Back glass (inset, slightly proud of the band)
    const backGeo = new T.ShapeGeometry(rounded(w - 2.4, h - 2.4, r - 1.2), 32);
    const back = new T.Mesh(backGeo, mats.back); back.rotation.y = Math.PI; back.position.z = -d / 2 - 0.82; group.add(back);
    // Front: bezel + screen
    const bez = new T.Mesh(new T.ShapeGeometry(rounded(w - 1.6, h - 1.6, r - .8), 32), mats.bezel); bez.position.z = d / 2 + 0.81; group.add(bez);
    const scr = new T.Mesh(new T.ShapeGeometry(rounded(w - 5, h - 5, r - 2.5), 32), mats.screen); scr.position.z = d / 2 + 0.83;
    // UVs of ShapeGeometry are in shape units; normalise them so the texture fills the screen.
    const uv = scr.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + (w - 5) / 2) / (w - 5), (uv.getY(i) + (h - 5) / 2) / (h - 5));
    group.add(scr);
    const island = new T.Mesh(new T.ShapeGeometry(rounded(20, 6, 3), 16), mats.bezel); island.position.set(0, h / 2 - 9, d / 2 + 0.85); group.add(island);
    // Camera plateau: full-width bar across the top of the back
    const plH = model === 'base' ? 30 : 36;
    const plGeo = new T.ExtrudeGeometry(rounded(w - 7, plH, 9), { depth: 1.6, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 0.6, bevelSegments: 5, curveSegments: 24 });
    const plateau = new T.Mesh(plGeo, mats.plateau); plateau.rotation.y = Math.PI; plateau.position.set(0, h / 2 - plH / 2 - 4, -d / 2 - 0.8); group.add(plateau);
    const pz = -d / 2 - 0.8 - 2.2; // plateau surface
    // Lens island (left side of the plateau, seen from the back)
    const lensAt = (x, y, rr) => {
      const ring = new T.Mesh(new T.CylinderGeometry(rr + 1.3, rr + 1.6, 2.6, 48), mats.ring); ring.rotation.x = Math.PI / 2; ring.position.set(x, y, pz - 1.3); group.add(ring);
      const glass = new T.Mesh(new T.CylinderGeometry(rr, rr, 2.8, 48), mats.lens); glass.rotation.x = Math.PI / 2; glass.position.set(x, y, pz - 1.4); group.add(glass);
      const inner = new T.Mesh(new T.CircleGeometry(rr * 0.45, 32), mats.lensInner); inner.rotation.y = Math.PI; inner.position.set(x, y, pz - 2.85); group.add(inner);
      const hl = new T.Mesh(new T.CircleGeometry(rr * 0.12, 16), new T.MeshBasicMaterial({ color: 0x9fb4ff, transparent: true, opacity: .6 })); hl.rotation.y = Math.PI; hl.position.set(x - rr * .35, y + rr * .35, pz - 2.86); group.add(hl);
    };
    const cy = h / 2 - plH / 2 - 4; // plateau centre y
    const sideX = w / 2 - 17; // seen from the back, the island sits on the left → positive x in model space
    if (model === 'base') { lensAt(sideX, cy + 6.5, 5.6); lensAt(sideX, cy - 6.5, 5.6); }
    else { const rr = model === 'ultra' ? 7 : 6.4; lensAt(sideX + 2, cy + 8.5, rr); lensAt(sideX + 2, cy - 8.5, rr); lensAt(sideX - 14, cy, rr); }
    // Flash + LiDAR on the other end of the plateau
    const fl = new T.Mesh(new T.CylinderGeometry(2.6, 2.6, 0.6, 32), mats.flash); fl.rotation.x = Math.PI / 2; fl.position.set(-w / 2 + 14, cy + 6, pz - .3); group.add(fl);
    if (model !== 'base') { const li = new T.Mesh(new T.CylinderGeometry(2.4, 2.4, 0.6, 32), mats.dark); li.rotation.x = Math.PI / 2; li.position.set(-w / 2 + 14, cy - 6, pz - .3); group.add(li); }
    const mic = new T.Mesh(new T.CircleGeometry(.7, 12), mats.dark); mic.rotation.y = Math.PI; mic.position.set(-w / 2 + 22, cy, pz - .05); group.add(mic);
    // Emblem + wordmark
    const lg = new T.Mesh(new T.PlaneGeometry(26, 26), mats.logo); lg.rotation.y = Math.PI; lg.position.set(0, -6, -d / 2 - 0.85); group.add(lg);
    const tx = new T.Mesh(new T.PlaneGeometry(30, 5.6), mats.text); tx.rotation.y = Math.PI; tx.position.set(0, -h / 2 + 18, -d / 2 - 0.85); group.add(tx);
    // Side buttons
    const btn = (x, y, len, depth = 1.2) => { const g = new T.BoxGeometry(depth, len, 3.2); const m = new T.Mesh(g, mats.frame); m.position.set(x, y, 0); group.add(m); };
    btn(w / 2 + 0.7, h / 2 - 48, 16); // power (right, front view)
    btn(-w / 2 - 0.7, h / 2 - 40, 12); btn(-w / 2 - 0.7, h / 2 - 56, 12); // volume
    if (model !== 'base') btn(-w / 2 - 0.7, h / 2 - 26, 6); // action button
    const camCtrl = new T.Mesh(new T.BoxGeometry(1, 11, 3), new T.MeshPhysicalMaterial({ color: 0x1a1a1c, metalness: .3, roughness: .1, clearcoat: 1 })); camCtrl.position.set(w / 2 + 0.6, -h / 2 + 52, 0); group.add(camCtrl);
    // Lightning/USB-C + speaker holes
    const port = new T.Mesh(new T.BoxGeometry(9, 1, 2.6), mats.dark); port.position.set(0, -h / 2 - 0.4, 0); group.add(port);
    for (let i = 0; i < 6; i++) { const hole = new T.Mesh(new T.CylinderGeometry(.6, .6, 1, 10), mats.dark); hole.position.set(12 + i * 2.4, -h / 2 - .4, 0); group.add(hole); const h2 = hole.clone(); h2.position.x = -12 - i * 2.4; group.add(h2); }
    group.scale.setScalar(1);
  }

  /* Interaction: drag to rotate, idle sway */
  let rotY = Math.PI + 0.5, rotX = -0.12, velY = 0, dragging = false, lastX = 0, lastY = 0, idleT = 0;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); host.classList.add('grab'); });
  canvas.addEventListener('pointermove', (e) => { if (!dragging) return; const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY; velY = dx * 0.01; rotY += velY; rotX = Math.max(-0.7, Math.min(0.7, rotX + dy * 0.006)); idleT = 0; });
  const up = () => { dragging = false; host.classList.remove('grab'); };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);

  function resize() {
    const r = host.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);

  let t0 = performance.now();
  (function loop(t) {
    const dt = Math.min(0.05, (t - t0) / 1000); t0 = t;
    if (!dragging) { idleT += dt; velY *= 0.94; rotY += velY; if (idleT > 1.5) { rotY += (Math.PI + 0.5 + Math.sin(t / 2600) * 0.55 - rotY) * 0.02; rotX += (-0.12 + Math.sin(t / 3400) * 0.08 - rotX) * 0.03; } }
    group.rotation.set(rotX, rotY, Math.sin(t / 4000) * 0.04);
    group.position.y = Math.sin(t / 1800) * 3;
    try { renderer.render(scene, camera); } catch (e) { if (!loop.failed) { loop.failed = true; console.error('[zurex 3d]', e.stack); } }
    requestAnimationFrame(loop);
  })(t0);

  const current = { model: null, finish: null };
  window.ZX3D = {
    update(model, finishHex) { if (current.model === model && current.finish === finishHex) return; current.model = model; current.finish = finishHex; build(model, finishHex); resize(); },
  };
  window.addEventListener('error', (e) => { if (String(e.message).includes('uniform')) console.warn('[zurex 3d] stack', e.error && e.error.stack); });
  const S = ZX.S; window.ZX3D.update(S.model || 'ultra', getComputedStyle(document.documentElement).getPropertyValue('--frame').trim() || '#bfb6ad');
})();
