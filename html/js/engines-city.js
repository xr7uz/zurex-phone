/* City engines: world telemetry, GPS places, maps, services/dispatch, shops, invoices, weather. */
(() => {
  'use strict';
  const { $, $$, esc, svg, money, ago, engines, body, RENDER } = ZX;
  const head = (...a) => ZX.head(...a);

  ZX.world = () => ZX.rpc('world.info');
  ZX.position = async () => { const r = await ZX.world(); return r && r.pos ? { x: Math.round(r.pos.x), y: Math.round(r.pos.y) } : { x: 0, y: 0 }; };
  ZX.waypoint = (x, y, label = 'Ziel') => { ZX.rpc('gps.set', { x, y }); ZX.notify('maps', 'Route gesetzt', label); };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const fmtDist = (m) => m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`;

  /* GTA V locations per places-app (x, y). Edit or extend freely. */
  window.ZX_PLACES = {
    tanken: [['Ron · Grove Street', -70.2, -1761.8], ['Globe Oil · Strawberry', 265.6, -1261.3], ['LTD · Mirror Park', 1181.4, -330.8], ['Xero · Little Seoul', -724.6, -935.2], ['Ron · Vespucci', -526, -1211], ['Globe Oil · Morningwood', -1437.6, -276.7], ['Xero · Pacific Bluffs', -2096.2, -320.3], ['Ron · Route 68', 49.4, 2778.8], ['Globe Oil · Sandy Shores', 2005.1, 3773.9], ['Xero · Grapeseed', 1687.2, 4929.4], ['Ron · Paleto Bay', 179.9, 6602.8], ['LTD · Paleto Blvd', -94.5, 6419.6], ['Globe Oil · Senora Fwy', 2581.3, 362], ['Ron · Tataviam', 2539.7, 2594.2]],
    garagen: [['Legion Square Parkplatz', 215, -810], ['Pillbox Parkhaus', 273, -344], ['Alta Street Garage', -279, -899], ['Del Perro Parkhaus', -1184, -1509], ['Mirror Park Garage', 1036, -763], ['Vinewood Garage', 363, 297], ['Sandy Shores Garage', 1737, 3710], ['Paleto Bay Garage', 110, 6610], ['Flughafen Parkdeck', -796, -2023], ['Abschlepphof', 409, -1623]],
    kleidung: [['Binco · Strawberry', 72.3, -1399.1], ['Ponsonbys · Rockford', -703.8, -152.3], ['Ponsonbys · Burton', -167.9, 299], ['Binco · Textile City', 428.7, -800.1], ['Suburban · Vespucci', -829.4, -1073.7], ['Ponsonbys · Morningwood', -1447.8, -242.5], ['Suburban · Hawick', 123.6, -219.4], ['Discount Store · Paleto', 11.6, 6514.2], ['Discount Store · Grapeseed', 1696.3, 4829.3], ['Discount Store · Harmony', 1190.6, 2713.4], ['Suburban · Chumash', -3172.5, 1048.1], ['Suburban · Zancudo', -1108.4, 2708.9]],
    barber: [['Herr Kutz · Davis', 136.8, -1708.4], ['Bob Mulet · Rockford', -814.3, -183.8], ['Beach Combover · Vespucci', -1282.6, -1116.8], ["O'Sheas · Sandy Shores", 1931.5, 3729.7], ['Hair on Hawick', -32.9, -152.3], ['Herr Kutz · Mirror Park', 1212.8, -472.9], ['Herr Kutz · Paleto', -278.1, 6228.5]],
    tattoo: [['Blazing Tattoo · El Burro', 1322.6, -1651.9], ['The Pit · Vespucci', -1153.6, -1425.6], ['Ink Inc · Downtown Vinewood', 322.1, 180.4], ['Ink Inc · Chumash', -3170, 1075], ['Ink Inc · Sandy Shores', 1864.6, 3747.7], ['Ink Inc · Paleto', -293.7, 6200]],
    ammu: [['Ammu-Nation · Little Seoul', -662.1, -935.3], ['Ammu-Nation · Cypress Flats', 810.2, -2157.3], ['Ammu-Nation · Sandy Shores', 1693.4, 3759.5], ['Ammu-Nation · Paleto', -330.2, 6083.8], ['Ammu-Nation · Hawick', 252.3, -50], ['Ammu-Nation · Pillbox', 22, -1107.2], ['Ammu-Nation · Tataviam', 2567.6, 294.3], ['Ammu-Nation · Zancudo', -1117.5, 2698.6], ['Ammu-Nation · La Mesa', 842.4, -1033.4], ['Ammu-Nation · Morningwood', -1306.2, -394], ['Ammu-Nation · Chumash', -3171, 1087]],
    kliniken: [['Pillbox Hill Medical', 298.6, -584.5], ['Central Los Santos Medical', 340, -1396], ['Mount Zonah Medical', -449, -340], ['St. Fiacre Hospital', 1152, -1527], ['Sandy Shores Medical', 1839, 3672], ['Paleto Bay Medical', -247, 6331]],
    polizei: [['Mission Row PD', 441, -982], ['Vespucci PD', -1108, -845], ['Davis Sheriff', 360, -1584], ['Vinewood PD', 638, 1], ['La Mesa PD', 826, -1290], ['Sandy Shores Sheriff', 1853, 3686], ['Paleto Bay Sheriff', -448, 6008]],
    autohaus: [['Premium Deluxe Motorsport', -56.7, -1096.6], ['Luxury Autos · Rockford', -803, -224], ['Sanders Motorräder', 268, -1155], ['Larry\'s RV Sales', 1224, 2728], ['Elitás Travel · Flughafen', -1070, -2870], ['Benny\'s Original Motor Works', -205, -1310]],
    supermarkt: [['24/7 · Strawberry', 25.7, -1347.3], ['24/7 · Vinewood', 373.8, 325.8], ['LTD · Davis', -48.5, -1757.5], ['LTD · Mirror Park', 1163.3, -323.8], ['LTD · Little Seoul', -707.5, -914.2], ['LTD · Richman Glen', -1820.5, 792.5], ["Rob's Liquor · El Burro", 1135.8, -982.2], ["Rob's Liquor · Vespucci", -1222.9, -906.9], ["Rob's Liquor · Morningwood", -1487.5, -379.1], ['24/7 · Chumash', -3038.9, 585.9], ['24/7 · Harmony', 547.4, 2671.7], ['24/7 · Sandy Shores', 1961.4, 3740.6], ['24/7 · Grapeseed', 1697.9, 4924.4], ['24/7 · Paleto', 1728.6, 6414.1]],
    nightlife: [['Vanilla Unicorn', 129.2, -1299.6], ['Bahama Mamas', -1388.4, -586.6], ['Tequi-la-la', -565, 276.6], ['Diamond Casino & Resort', 924.5, 46.6], ['Split Sides Comedy Club', -430, 261], ['Yellow Jack Inn', 1985.6, 3054], ['Hen House', -305.2, 6264.4], ['Bean Machine · Vinewood', -628, 239]],
    hotels: [['Pink Cage Motel', 326.6, -205.9], ['Perrera Beach Motel', -1478, -671], ['Opium Nights Hotel', -1316, -931], ['Von Crastenburg · Richman', -1230, 340], ['Dream View Motel · Paleto', -94, 6316], ['Motor Motel · Sandy Shores', 1142, 2664], ['Bayview Lodge', -695, 5802]],
    fitness: [['Muscle Sands · Vespucci Beach', -1201, -1569], ['Pump & Run Gym · Pillbox', -1255, -355], ['Beach Volleyball · Vespucci', -1290, -1600], ['Tennisplätze · Richman', -1146, -1630], ['Yoga · Mount Gordo', 2829, 5973]],
    banken: [['Fleeca · Legion Square', 149.9, -1040.4], ['Fleeca · Alta', 314.2, -278.8], ['Fleeca · Burton', -350.9, -49.5], ['Fleeca · Rockford Hills', -1213, -330], ['Fleeca · Great Ocean Hwy', -2962.6, 482.6], ['Fleeca · Harmony', 1175, 2706.6], ['Pacific Standard Bank', 247.3, 223], ['Blaine County Savings', -112.2, 6469.3], ['Maze Bank Tower', -75, -818]],
    sights: [['Vinewood Sign', 711, 1198], ['Galileo Observatorium', -438, 1076], ['Del Perro Pier', -1850, -1230], ['Kortz Center', -2243, 270], ['Mount Chiliad Gipfel', 501, 5604], ['Land Act Dam', 1662, -27], ['Leuchtturm · Paleto Cove', 3424, 5174], ['Maze Bank Arena', -324, -1968], ['Los Santos Golf Club', -1375, 56], ['Pier & Riesenrad', -1663, -1126]],
    straende: [['Vespucci Beach', -1350, -1600], ['Del Perro Beach', -1700, -1000], ['Chumash Beach', -3100, 600], ['Paleto Cove', -280, 6600], ['Pacific Bluffs Strand', -2200, -450], ['Alamo Sea Ufer', 1300, 4000]],
    flug: [['Los Santos International Airport', -1037, -2738], ['Sandy Shores Airfield', 1747, 3273], ['McKenzie Field · Grapeseed', 2121, 4796], ['Helipad · Pillbox Medical', 352, -588], ['Helipad · Vespucci', -745, -1468]],
    werkstatt: [['Los Santos Customs · Burton', -337.4, -136.9], ['Los Santos Customs · La Mesa', 731.8, -1088.8], ['Los Santos Customs · Flughafen', -1155, -2007], ['Los Santos Customs · Harmony', 1175, 2640], ["Beeker's Garage · Paleto", 110, 6626], ["Benny's Original Motor Works", -205, -1310]],
    sport: [['Maze Bank Arena', -324, -1968], ['Los Santos Golf Club', -1375, 56], ['Rennstrecke · Redwood Lights', 1012, 2380], ['Schießstand · Pillbox', 22, -1107], ['Skatepark · Vespucci', -1350, -1420], ['Basketball · Vespucci', -1300, -1520]],
  };

  /* ───────── Places list (GPS) ───────── */
  engines.places = async (app, view, arg, isLive) => {
    const places = ((window.ZX_PLACES[app.cfg && app.cfg.set]) || []).map(([n, x, y]) => ({ n, x, y }));
    if (!isLive) head(app.name, 'GPS · ' + places.length + ' Orte');
    const me = await ZX.position();
    if (ZX.current?.id !== app.id) return;
    places.forEach((p) => { p.d = dist(me, p); });
    places.sort((a, b) => a.d - b.d);
    body.innerHTML = `<div class="near-card"><span class="tag">Am nächsten</span><b>${esc(places[0]?.n || '—')}</b><span class="s">${places[0] ? fmtDist(places[0].d) : ''}</span>${places[0] ? `<button class="btn" data-go="0">Route starten</button>` : ''}</div>
      <input class="field search" id="plQ" placeholder="Suchen" autocomplete="off" />
      <ul class="list" id="plList">${places.map((p, i) => `<li><button class="row" data-go="${i}"><span class="ch-ico">${ZX.appSvg(app)}</span><span class="grow"><span class="t">${esc(p.n)}</span><span class="s">${fmtDist(p.d)}</span></span><span class="meta">${svg('pin', 'width="18" height="18" stroke="var(--signal)"')}</span></button></li>`).join('')}</ul>`;
    $('#plQ').oninput = (e) => { const q = e.target.value.toLowerCase(); $$('#plList li').forEach((li) => { li.hidden = !li.textContent.toLowerCase().includes(q); }); };
    body.onclick = (e) => { const b = e.target.closest('[data-go]'); if (b) { const p = places[+b.dataset.go]; ZX.waypoint(p.x, p.y, p.n); } };
  };

  /* ───────── Maps (all places + saved pins + live position) ───────── */
  // World bounds of GTA V for the minimap projection.
  const WB = { x0: -4000, x1: 4500, y0: -4200, y1: 8000 };
  // Stylised San Andreas, built from world coordinates so pins land where they belong.
  const P = ([x, y]) => `${((x - WB.x0) / (WB.x1 - WB.x0) * 100).toFixed(2)},${((WB.y1 - y) / (WB.y1 - WB.y0) * 100).toFixed(2)}`;
  const COAST = [[-1100, 6700], [-300, 6800], [600, 6900], [1500, 6650], [2300, 6550], [3000, 6450], [3550, 5750], [3900, 4700], [3950, 3900], [3650, 3000], [3250, 2250], [3000, 1300], [2850, 500], [2650, -400], [2300, -1200], [1650, -2050], [1250, -2700], [1150, -3300], [450, -3450], [-300, -3400], [-900, -3550], [-1600, -3500], [-2050, -2900], [-2150, -2200], [-2000, -1650], [-2250, -1000], [-2500, -500], [-2950, 150], [-3250, 900], [-3350, 1700], [-3150, 2600], [-2950, 3450], [-2550, 4300], [-2000, 5100], [-1550, 5800]];
  const ROADS = [
    [[-2150, -500], [-2900, 400], [-3100, 1500], [-2950, 2700], [-2550, 3700], [-1900, 4800], [-1000, 5900], [100, 6500], [1100, 6550], [1800, 6400]],
    [[2500, -600], [2650, 600], [2750, 1600], [2650, 2800], [2550, 3900], [2300, 4900], [1800, 6300]],
    [[-2600, 2950], [-1400, 2750], [-300, 2700], [700, 2650], [1500, 2700], [2550, 2850]],
    [[-1650, -620], [-900, -700], [-200, -760], [500, -780], [1100, -900]],
    [[1050, -2600], [900, -1500], [800, -500], [650, 500], [900, 1500], [1400, 2600]],
    [[-400, -2300], [0, -1700], [300, -1300], [800, -1050]],
  ];
  const CITY = [[-1950, -2250], [-1200, -2800], [300, -3000], [1250, -2700], [1400, -900], [1300, 300], [500, 900], [-700, 700], [-1800, 400], [-2100, -600]];
  function mapLayer(w) {
    const poly = (pts) => pts.map(P).join(' ');
    const lbl = (txt, x, y, size = 2.2, op = .55) => { const [px, py] = P([x, y]).split(','); return `<text x="${px}" y="${py}" font-size="${size}" text-anchor="middle" fill="#cfe9e4" opacity="${op}" font-family="Zen Kaku Gothic New" font-weight="700" letter-spacing=".4">${txt}</text>`; };
    const [ax, ay] = P([1350, 4050]).split(',');
    return `<svg class="map-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs><pattern id="mapGrid" width="1.6" height="1.1" patternUnits="userSpaceOnUse"><path d="M1.6 0V1.1M0 1.1H1.6" stroke="#5eead4" stroke-opacity=".22" stroke-width=".12"/></pattern>
        <radialGradient id="mapHill" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#2f4436"/><stop offset="1" stop-color="#1d2a22" stop-opacity="0"/></radialGradient>
        <clipPath id="mapLand"><polygon points="${poly(COAST)}"/></clipPath></defs>
      <polygon points="${poly(COAST)}" fill="#18231d" stroke="#5eead4" stroke-opacity=".35" stroke-width=".3"/>
      <g clip-path="url(#mapLand)">
        ${[[500, 5600, 14], [-1400, 3600, 12], [2600, 4400, 9], [-300, 1700, 10], [1800, 600, 8]].map(([x, y, rr]) => { const [px, py] = P([x, y]).split(','); return `<ellipse cx="${px}" cy="${py}" rx="${rr}" ry="${rr * .7}" fill="url(#mapHill)"/>`; }).join('')}
        <polygon points="${poly(CITY)}" fill="#1f2c2a"/><polygon points="${poly(CITY)}" fill="url(#mapGrid)"/>
        <ellipse cx="${ax}" cy="${ay}" rx="11" ry="4.6" transform="rotate(-12 ${ax} ${ay})" fill="#0b1a20" stroke="#5eead4" stroke-opacity=".35" stroke-width=".25"/>
        ${ROADS.map((r) => `<polyline points="${poly(r)}" fill="none" stroke="#fbbf24" stroke-opacity=".55" stroke-width=".45" stroke-linejoin="round"/>`).join('')}
      </g>
      ${lbl('LOS SANTOS', -400, -1500, 2.6, .7)}${lbl('VINEWOOD', 300, 1050, 1.7)}${lbl('ALAMO SEA', 1350, 4050, 1.6, .6)}${lbl('SANDY SHORES', 1900, 3500, 1.5)}${lbl('MT. CHILIAD', 500, 5500, 1.6)}${lbl('PALETO BAY', -300, 6250, 1.6)}${lbl('GRAPESEED', 2000, 4900, 1.4)}${lbl('CHUMASH', -3000, 1050, 1.4)}${lbl('PACIFIC OCEAN', -3300, -2600, 1.8, .35)}
      ${w && w.zone ? '' : ''}</svg>`;
  }
  RENDER.maps = async (view, arg, isLive) => {
    const st = ZX.data('maps'); st.pins ||= [];
    if (!isLive) head('Karte', 'Los Santos & Blaine County', '<button type="button" id="mpSave">Pin</button>');
    const w = await ZX.world();
    if (ZX.current?.id !== 'maps') return;
    const me = w && w.pos ? w.pos : { x: 0, y: 0 };
    const all = Object.entries(window.ZX_PLACES).flatMap(([set, list]) => list.map(([n, x, y]) => ({ n, x, y, set })));
    const px = (p) => ({ l: (p.x - WB.x0) / (WB.x1 - WB.x0) * 100, t: (WB.y1 - p.y) / (WB.y1 - WB.y0) * 100 });
    const filter = st.filter || 'all';
    const shown = filter === 'pins' ? [] : all.filter((p) => filter === 'all' || p.set === filter);
    const meP = px(me);
    body.innerHTML = `<div class="map" id="map">${mapLayer(w)}${shown.map((p, i) => { const q = px(p); return `<button class="map-dot" data-i="${i}" style="left:${q.l}%;top:${q.t}%" title="${esc(p.n)}"></button>`; }).join('')}
        ${st.pins.map((p, i) => { const q = px(p); return `<button class="map-dot pin" data-pin="${i}" style="left:${q.l}%;top:${q.t}%"></button>`; }).join('')}
        <span class="map-me" style="left:${meP.l}%;top:${meP.t}%;--hd:${-(w?.heading || 0)}deg"></span></div>
      <p class="s map-where">${svg('pin', 'width="14" height="14"')} ${esc(w?.street || '')}${w?.zone ? ', ' + esc(w.zone) : ''}</p>
      <div class="chips" id="mpF">${[['all', 'Alle'], ['pins', 'Meine Pins'], ['tanken', 'Tanken'], ['kliniken', 'Kliniken'], ['polizei', 'Polizei'], ['werkstatt', 'Werkstatt'], ['banken', 'Banken'], ['nightlife', 'Nightlife'], ['sights', 'Sehenswert']].map(([k, n]) => `<button class="chip ${filter === k ? 'on' : ''}" data-f="${k}">${n}</button>`).join('')}</div>
      <div id="mpInfo"></div>
      ${filter === 'pins' ? `<ul class="list">${st.pins.map((p, i) => `<li><div class="row"><span class="grow"><span class="t">${esc(p.n)}</span><span class="s">${fmtDist(dist(me, p))}</span></span><button class="chip on" data-pgo="${i}">Route</button><button class="x" data-pdel="${i}">✕</button></div></li>`).join('') || '<p class="empty">Speichere Orte mit „Pin“.</p>'}</ul>` : ''}`;
    $('#mpSave') && ($('#mpSave').onclick = async () => { const p = await ZX.position(); const name = (w && w.street) || 'Gespeicherter Ort'; st.pins.unshift({ n: name, x: p.x, y: p.y }); ZX.save(); ZX.notify('maps', 'Pin gespeichert', name); ZX.render(true); });
    body.onclick = (e) => {
      const f = e.target.closest('[data-f]'); if (f) { st.filter = f.dataset.f; ZX.save(); return ZX.render(true); }
      const d = e.target.closest('[data-i]'); if (d) { const p = shown[+d.dataset.i]; $('#mpInfo').innerHTML = `<div class="near-card"><b>${esc(p.n)}</b><span class="s">${fmtDist(dist(me, p))}</span><button class="btn" id="mpGo">Route starten</button></div>`; $('#mpGo').onclick = () => ZX.waypoint(p.x, p.y, p.n); return; }
      const pg = e.target.closest('[data-pgo]'); if (pg) { const p = st.pins[+pg.dataset.pgo]; return ZX.waypoint(p.x, p.y, p.n); }
      const pd = e.target.closest('[data-pdel]'); if (pd) { st.pins.splice(+pd.dataset.pdel, 1); ZX.save(); return ZX.render(true); }
      const pin = e.target.closest('[data-pin]'); if (pin) { const p = st.pins[+pin.dataset.pin]; ZX.waypoint(p.x, p.y, p.n); }
    };
    if (!isLive) ZX.live.interval(() => ZX.render(true), 3000);
  };

  /* ───────── Services / dispatch (Notruf, Rettung, Taxi, Mechaniker…) ───────── */
  engines.services = async (app, view, arg) => {
    const cfg = app.cfg || {};
    const st = ZX.data(app.id); st.sent ||= [];
    if (view === 'inbox') {
      head('Einsätze', app.name);
      const inbox = ZX.data('dispatch').inbox || [];
      const mine = inbox.filter((d) => d.service === cfg.service);
      body.innerHTML = mine.length ? mine.map((d, i) => `<div class="dispatch ${d.taken ? 'taken' : ''}"><div class="d-top"><span class="chip on">${esc(d.ref)}</span><span class="s">${ago(d.t)}</span></div><b>${esc(d.reason || 'Einsatz')}</b><p>${esc(d.text || '')}</p><span class="s">${esc(d.name || 'Unbekannt')} · ${esc(d.number || '')}${d.street ? ' · ' + esc(d.street) : ''}</span>
        <div class="quick"><button data-route="${i}">${svg('pin')}Route</button><button data-callb="${i}">${svg('phone')}Rückruf</button><button data-take="${i}">${svg('check')}${d.taken ? 'Übernommen' : 'Übernehmen'}</button></div></div>`).join('') : '<p class="empty">Keine offenen Einsätze.</p>';
      body.onclick = (e) => {
        const r = e.target.closest('[data-route]'); if (r) { const d = mine[+r.dataset.route]; if (d.pos) ZX.waypoint(d.pos.x, d.pos.y, d.ref); return; }
        const c = e.target.closest('[data-callb]'); if (c) { const d = mine[+c.dataset.callb]; return ZX.call(d.name || d.number, d.number); }
        const t = e.target.closest('[data-take]'); if (t) { const d = mine[+t.dataset.take]; d.taken = true; ZX.save(); ZX.rpc('dispatch.take', { ref: d.ref, service: d.service }); ZX.render(); }
      };
      return;
    }
    const inboxCount = (ZX.data('dispatch').inbox || []).filter((d) => d.service === cfg.service && !d.taken).length;
    head(app.name, cfg.tagline || 'Service', `<button type="button" id="svIn">Einsätze${inboxCount ? ' · ' + inboxCount : ''}</button>`);
    $('#svIn').onclick = () => ZX.go('inbox');
    body.innerHTML = `<div class="svc-hero" style="--tint:${app.tint || 'var(--signal)'}">${ZX.appSvg(app)}<div><b>${esc(cfg.title || app.name)}</b><p>${esc(cfg.desc || '')}</p></div></div>
      <form id="svForm"><label class="lbl">Anliegen</label><div class="chips" id="svReasons">${(cfg.reasons || ['Allgemein']).map((r, i) => `<button type="button" class="chip ${i === 0 ? 'on' : ''}" data-r="${esc(r)}">${esc(r)}</button>`).join('')}</div>
      <label class="lbl">Beschreibung</label><textarea class="field" id="svText" rows="3" maxlength="300" placeholder="${esc(cfg.ph || 'Was ist passiert?')}"></textarea>
      <label class="row check"><input type="checkbox" id="svPos" checked /> <span class="grow"><span class="t">Standort mitsenden</span><span class="s">Einsatzkräfte erhalten eine Route zu dir</span></span></label>
      ${cfg.anonOption ? '<label class="row check"><input type="checkbox" id="svAnon" /> <span class="grow"><span class="t">Anonym melden</span></span></label>' : ''}
      <p class="err" id="svErr"></p><button class="btn ${cfg.urgent ? 'urgent' : ''}">${esc(cfg.cta || 'Anfrage senden')}</button></form>
      ${st.sent.length ? `<div class="section-label"><span class="tag">Deine Anfragen</span></div><ul class="list">${st.sent.slice(0, 8).map((s) => `<li class="row"><span class="grow"><span class="t">${esc(s.reason)}</span><span class="s">${esc(s.ref)} · ${ago(s.t)}</span></span><span class="chip">${esc(s.status || 'gesendet')}</span></li>`).join('')}</ul>` : ''}`;
    let reason = (cfg.reasons || ['Allgemein'])[0];
    $('#svReasons').onclick = (e) => { const b = e.target.closest('[data-r]'); if (!b) return; reason = b.dataset.r; $$('#svReasons .chip').forEach((x) => x.classList.toggle('on', x === b)); };
    $('#svForm').onsubmit = async (e) => {
      e.preventDefault();
      const w = $('#svPos').checked ? await ZX.world() : null;
      const r = await ZX.rpc('dispatch.send', { service: cfg.service, reason, text: $('#svText').value.trim(), pos: w ? { x: Math.round(w.pos.x), y: Math.round(w.pos.y) } : null, street: w ? w.street : null, anon: $('#svAnon')?.checked || false });
      if (!r || !r.ok) return void ($('#svErr').textContent = (r && r.error) || 'Senden fehlgeschlagen.');
      st.sent.unshift({ ref: r.ref, reason, t: Date.now(), status: r.units === 0 ? 'niemand im Dienst' : 'gesendet' }); ZX.save();
      ZX.notify(app.id, `${cfg.title || app.name}: ${r.ref}`, r.units === 0 ? 'Gerade ist niemand im Dienst.' : `Anfrage gesendet${r.units ? ` an ${r.units} Einheit${r.units > 1 ? 'en' : ''}` : ''}.`);
      ZX.render();
    };
  };
  // Incoming dispatch for on-duty players (server pushes kind 'dispatch').
  ZX.onPush('dispatch', (d) => {
    const st = ZX.data('dispatch'); st.inbox ||= [];
    st.inbox.unshift({ ...d, t: Date.now() }); st.inbox = st.inbox.slice(0, 50); ZX.save();
    const app = ZX.APPS.find((a) => a.engine === 'services' && a.cfg && a.cfg.service === d.service);
    ZX.notify(app ? app.id : 'bell', `Einsatz ${d.ref}`, `${d.reason || ''}${d.street ? ' · ' + d.street : ''}`, () => { if (app) { ZX.open(app.id); ZX.go('inbox'); } }, app && app.id);
  });
  ZX.onPush('dispatch:status', (d) => {
    for (const a of ZX.APPS.filter((x) => x.engine === 'services')) { const s = ZX.data(a.id).sent || []; const e = s.find((x) => x.ref === d.ref); if (e) { e.status = d.status; ZX.save(); ZX.notify(a.id, `${d.ref}`, d.status); } }
  });

  /* ───────── Shop (Kart, Foodz, Techstore…) ───────── */
  window.ZX_SHOPS = window.ZX_SHOPS || {};
  engines.shop = async (app, view) => {
    const cfg = app.cfg || {};
    const st = ZX.data(app.id); st.cart ||= {};
    const r = await ZX.rpc('shop.items', { app: app.id });
    if (ZX.current?.id !== app.id) return;
    const items = (r && r.items) || [];
    const count = Object.values(st.cart).reduce((s, n) => s + n, 0);
    const total = items.reduce((s, it) => s + (st.cart[it.name] || 0) * it.price, 0);
    if (view === 'cart') {
      head('Warenkorb', app.name);
      const lines = items.filter((it) => st.cart[it.name]);
      body.innerHTML = lines.length ? `<ul class="list">${lines.map((it) => `<li class="row"><span class="grow"><span class="t">${esc(it.label)}</span><span class="s">${money(it.price)}</span></span><div class="stepper"><button data-dec="${esc(it.name)}">−</button><b>${st.cart[it.name]}</b><button data-inc="${esc(it.name)}">+</button></div></li>`).join('')}</ul>
        <div class="stats"><div><span>Summe</span><b>${money(total)}</b></div><div><span>Guthaben</span><b>${money(ZX.S.bank.balance)}</b></div></div>
        <p class="err" id="shErr"></p><button class="btn" id="shBuy">${esc(cfg.cta || 'Jetzt bezahlen')}</button>${cfg.delivery ? `<p class="disclaimer">${esc(cfg.delivery)}</p>` : ''}` : '<p class="empty">Dein Warenkorb ist leer.</p>';
      body.onclick = async (e) => {
        const i = e.target.closest('[data-inc]'), d = e.target.closest('[data-dec]');
        if (i) { st.cart[i.dataset.inc]++; ZX.save(); return ZX.render(true); }
        if (d) { st.cart[d.dataset.dec]--; if (st.cart[d.dataset.dec] <= 0) delete st.cart[d.dataset.dec]; ZX.save(); return ZX.render(true); }
        if (e.target.closest('#shBuy')) {
          for (const it of lines) {
            const res = await ZX.rpc('shop.buy', { app: app.id, item: it.name, qty: st.cart[it.name] });
            if (!res || !res.ok) return void ($('#shErr').textContent = (res && res.error) || 'Kauf fehlgeschlagen.');
            if (ZX.isNui && typeof res.balance === 'number') { ZX.S.bank.balance = res.balance; ZX.S.bank.tx.unshift({ id: ZX.uid(), label: app.name, note: `${st.cart[it.name]}× ${it.label}`, amount: -it.price * st.cart[it.name], t: Date.now() }); }
            delete st.cart[it.name];
          }
          ZX.save(); ZX.notify(app.id, 'Bestellung bestätigt', cfg.done || 'Die Ware liegt in deinem Inventar.'); ZX.back();
        }
      };
      return;
    }
    head(app.name, cfg.tagline || 'Shop', `<button type="button" id="shCart">Korb${count ? ' · ' + count : ''}</button>`);
    $('#shCart').onclick = () => ZX.go('cart');
    const cats = [...new Set(items.map((i) => i.cat || 'Alle'))];
    body.innerHTML = `${cfg.banner ? `<div class="shop-banner" style="--tint:${app.tint || 'var(--signal)'}"><b>${esc(cfg.banner)}</b><span>${esc(cfg.bannerSub || '')}</span></div>` : ''}
      ${cats.map((c) => `<p class="tag set-h">${esc(c)}</p><div class="shop-grid">${items.filter((i) => (i.cat || 'Alle') === c).map((it) => `<div class="shop-item"><div class="si-img">${(it.icon ? svg(it.icon) : ZX.appSvg(app))}</div><b>${esc(it.label)}</b><span class="s">${esc(it.desc || '')}</span><div class="si-foot"><span class="l-price">${money(it.price)}</span><button class="add ${st.cart[it.name] ? 'on' : ''}" data-add="${esc(it.name)}">${st.cart[it.name] ? st.cart[it.name] : '+'}</button></div></div>`).join('')}</div>`).join('') || '<p class="empty">Gerade nichts im Angebot.</p>'}`;
    body.onclick = (e) => { const a = e.target.closest('[data-add]'); if (a) { st.cart[a.dataset.add] = (st.cart[a.dataset.add] || 0) + 1; ZX.save(); a.textContent = st.cart[a.dataset.add]; a.classList.add('on'); $('#shCart').textContent = `Korb · ${Object.values(st.cart).reduce((s, n) => s + n, 0)}`; } };
  };

  /* ───────── Invoices (Rechnungen) ───────── */
  engines.invoices = async (app, view) => {
    if (view === 'new') {
      head('Rechnung stellen', app.name);
      body.innerHTML = `<form id="ivF"><label class="lbl">Empfänger (Nummer)</label><input class="field" id="ivTo" list="ivC" placeholder="555-0123" /><datalist id="ivC">${ZX.S.contacts.map((c) => `<option value="${esc(c.number)}">${esc(c.name)}</option>`).join('')}</datalist>
        <label class="lbl">Betrag (€)</label><input class="field num amount" id="ivAmt" inputmode="decimal" /><label class="lbl">Grund</label><input class="field" id="ivWhy" maxlength="80" />
        <p class="err" id="ivErr"></p><button class="btn">Rechnung senden</button></form>`;
      $('#ivF').onsubmit = async (e) => { e.preventDefault(); const r = await ZX.rpc('invoice.send', { to: $('#ivTo').value.trim(), amount: parseFloat($('#ivAmt').value.replace(',', '.')), reason: $('#ivWhy').value.trim() }); if (!r || !r.ok) return void ($('#ivErr').textContent = (r && r.error) || 'Fehler'); ZX.back(); };
      return;
    }
    head(app.name, 'Offene Posten', '<button type="button" id="ivNew">Neu</button>');
    $('#ivNew').onclick = () => ZX.go('new');
    const r = await ZX.rpc('invoice.list');
    if (ZX.current?.id !== app.id || ZX.current.view) return;
    const row = (i, pay) => `<li class="row"><span class="grow"><span class="t">${esc(pay ? i.from.name : i.to)}</span><span class="s">${esc(i.reason)} · ${ago(i.t)}</span></span><span class="amt">${money(i.amount)}</span>${pay ? `<button class="chip on" data-pay="${i.id}">Zahlen</button>` : ''}</li>`;
    body.innerHTML = `<div class="section-label"><span class="tag">Offen</span></div>${(r.open || []).length ? `<ul class="list">${r.open.map((i) => row(i, true)).join('')}</ul>` : '<p class="empty" style="padding:16px">Keine offenen Rechnungen.</p>'}
      <div class="section-label"><span class="tag">Gestellt</span></div>${(r.sent || []).length ? `<ul class="list">${r.sent.map((i) => `<li class="row"><span class="grow"><span class="t">${esc(i.to)}</span><span class="s">${esc(i.reason)}</span></span><span class="amt">${money(i.amount)}</span><span class="chip ${i.paid ? 'on' : ''}">${i.paid ? 'bezahlt' : 'offen'}</span></li>`).join('')}</ul>` : '<p class="empty" style="padding:16px">Noch keine.</p>'}<p class="err" id="ivErr2"></p>`;
    body.onclick = async (e) => { const p = e.target.closest('[data-pay]'); if (!p) return; const res = await ZX.rpc('invoice.pay', { id: p.dataset.pay }); if (!res || !res.ok) return void ($('#ivErr2').textContent = (res && res.error) || 'Fehler'); if (ZX.isNui && typeof res.balance === 'number') { ZX.S.bank.balance = res.balance; ZX.save(); } ZX.notify(app.id, 'Bezahlt', 'Rechnung beglichen.'); ZX.render(); };
  };
  ZX.onPush('invoice', (d) => ZX.notify('rechnungen', 'Neue Rechnung', `${d.from} · ${money(d.amount)}`, null, 'rechnungen'));

  /* ───────── Weather ───────── */
  const WX = { CLEAR: ['Klar', 'sun'], EXTRASUNNY: ['Sonnig', 'sun'], CLOUDS: ['Bewölkt', 'cloud'], OVERCAST: ['Bedeckt', 'cloud'], RAIN: ['Regen', 'drop'], THUNDER: ['Gewitter', 'bolt'], CLEARING: ['Aufklarend', 'cloud'], SMOG: ['Smog', 'wind'], FOGGY: ['Nebel', 'wind'], XMAS: ['Schnee', 'sparkle'], SNOW: ['Schnee', 'sparkle'], SNOWLIGHT: ['Leichter Schnee', 'sparkle'], BLIZZARD: ['Blizzard', 'wind'], HALLOWEEN: ['Unheimlich', 'moon'], NEUTRAL: ['Neutral', 'cloud'] };
  RENDER.weather = async () => {
    head('Wetter', 'Los Santos');
    const w = await ZX.world();
    if (ZX.current?.id !== 'weather') return;
    const [label, icon] = WX[w?.weather] || ['Klar', 'sun'];
    const base = { sun: 29, cloud: 22, drop: 17, bolt: 18, wind: 20, sparkle: -2, moon: 14 }[icon];
    const h = w?.hour ?? new Date().getHours();
    const r = ZX.rng(Math.floor(Date.now() / 36e5));
    const hours = Array.from({ length: 12 }, (_, i) => ({ h: (h + i) % 24, t: Math.round(base - Math.abs(((h + i) % 24) - 15) * 0.6 + r() * 2) }));
    const days = ['Heute', 'Morgen', ...Array.from({ length: 5 }, (_, i) => new Date(Date.now() + (i + 2) * 864e5).toLocaleDateString('de-DE', { weekday: 'long' }))].map((d, i) => ({ d, hi: Math.round(base + 3 + r() * 4 - i * .3), lo: Math.round(base - 6 + r() * 3), ic: ZX.pick(['sun', 'sun', 'cloud', 'drop']) }));
    body.innerHTML = `<div class="wx-hero">${svg(icon)}<p class="wx-temp">${hours[0].t}°</p><b>${label}</b><span class="s">${esc(w?.zone || 'Los Santos')} · H ${days[0].hi}° T ${days[0].lo}°</span></div>
      <div class="wx-hours">${hours.map((x, i) => `<div><span>${i ? String(x.h).padStart(2, '0') : 'Jetzt'}</span>${svg(x.h > 19 || x.h < 6 ? 'moon' : icon)}<b>${x.t}°</b></div>`).join('')}</div>
      <div class="group">${days.map((x) => `<div class="row"><span class="grow t">${x.d}</span>${svg(x.ic, 'width="20" height="20"')}<span class="meta" style="min-width:90px">${x.lo}° <i class="wx-bar"></i> ${x.hi}°</span></div>`).join('')}</div>
      <div class="stats"><div><span>Wind</span><b>${Math.round(5 + r() * 20)} km/h</b></div><div><span>Feuchte</span><b>${Math.round(30 + r() * 50)} %</b></div><div><span>UV-Index</span><b>${icon === 'sun' ? Math.round(6 + r() * 4) : 2}</b></div><div><span>Ingame-Zeit</span><b>${String(h).padStart(2, '0')}:${String(w?.minute ?? 0).padStart(2, '0')}</b></div></div>`;
  };
})();
