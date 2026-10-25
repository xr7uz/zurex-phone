/* Social engines: photo feed, reels, ghost snaps, text feed, forum, dating, chat channels, classifieds, mail. */
(() => {
  'use strict';
  const { $, $$, esc, svg, ago, initials, money, engines, body } = ZX;
  const head = (...a) => ZX.head(...a);
  const hue = (s) => [...String(s || '')].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  const av = (a, cls = '') => ZX.avatarHTML(a, cls);
  const meHandle = () => ZX.S.owner.handle;
  const cache = {}; // app → last list, so live pushes re-render without flicker
  async function load(app) { const r = await ZX.rpc('feed.list', { app: app.id }); if (r && r.ok) cache[app.id] = r.posts; return cache[app.id] || []; }
  const findPost = (app, id) => (cache[app.id] || []).find((p) => p.id === id);
  const likeHTML = (p) => `<button class="act ${p.likes.includes(meHandle()) ? 'liked' : ''}" data-like="${p.id}">${svg('heart')}<span>${p.likes.length}</span></button>`;
  async function like(app, id, btn) {
    const r = await ZX.rpc('feed.like', { app: app.id, id });
    if (!r || !r.ok) return;
    const p = findPost(app, id); if (p) p.likes = r.likes;
    if (btn) { btn.classList.toggle('liked', r.likes.includes(meHandle())); btn.querySelector('span').textContent = r.likes.length; btn.classList.add('pop'); setTimeout(() => btn.classList.remove('pop'), 300); }
  }
  // Shared comments view (photo, text, reels, forum, classifieds use it).
  function comments(app, id, title = 'Kommentare') {
    const p = findPost(app, id); if (!p) return ZX.back();
    head(title, app.name);
    body.classList.add('flex');
    body.innerHTML = `<div class="c-orig">${av(p.author, 's')}<div><b>@${esc(p.author.handle)}</b><p>${esc(p.extra?.title ? p.extra.title + ' — ' : '')}${esc(p.text)}</p></div></div>
      <div class="thread" id="cList">${p.comments.map((c) => `<div class="c-row">${av(c.author, 's')}<div><b>@${esc(c.author.handle)}</b> <small>${ago(c.t)}</small><p>${esc(c.text)}</p></div></div>`).join('') || '<p class="empty">Noch keine Kommentare.</p>'}</div>
      <form class="composer" id="cForm"><input class="field" id="cInp" placeholder="Kommentieren …" maxlength="300" autocomplete="off" /><button class="send">${svg('send')}</button></form>`;
    $('#cForm').onsubmit = async (e) => { e.preventDefault(); const text = $('#cInp').value.trim(); if (!text) return; const r = await ZX.rpc('feed.comment', { app: app.id, id, text }); if (r && r.ok) { p.comments.push(r.comment); comments(app, id, title); } };
    const l = $('#cList'); l.scrollTop = l.scrollHeight;
  }
  // Shared composer: caption + optional photo (+ extra fields from cfg).
  function compose(app, arg, opts = {}) {
    head(opts.title || 'Neuer Beitrag', app.name, '<button type="button" id="pubBtn">Posten</button>');
    let photo = (arg && arg.photo) || null;
    const fields = opts.fields || [];
    body.innerHTML = `${opts.photo !== false ? `<button class="compose-photo ${photo ? 'has' : ''}" id="cpPhoto">${photo ? ZX.photoHTML(photo) : `${svg('image')}<span>Foto hinzufügen</span>`}</button>` : ''}
      ${fields.map((f) => `<label class="lbl">${esc(f.label)}</label>${f.type === 'select' ? `<select class="field" data-f="${f.key}">${f.options.map((o) => `<option>${esc(o)}</option>`).join('')}</select>` : `<input class="field" data-f="${f.key}" ${f.type === 'number' ? 'inputmode="decimal"' : ''} maxlength="${f.max || 60}" placeholder="${esc(f.ph || '')}" />`}`).join('')}
      <label class="lbl">${esc(opts.textLabel || 'Text')}</label><textarea class="field" id="cpText" rows="${opts.rows || 4}" maxlength="${opts.max || 500}" placeholder="${esc(opts.ph || 'Was gibt\'s Neues?')}"></textarea>
      <p class="counter" id="cpCount">0 / ${opts.max || 500}</p><p class="err" id="cpErr"></p>`;
    $('#cpText').oninput = (e) => { $('#cpCount').textContent = `${e.target.value.length} / ${opts.max || 500}`; };
    $('#cpPhoto') && ($('#cpPhoto').onclick = async () => { const p = await ZX.pickPhoto(); if (p) { photo = p; $('#cpPhoto').classList.add('has'); $('#cpPhoto').innerHTML = ZX.photoHTML(p); } });
    $('#pubBtn').onclick = async () => {
      const text = $('#cpText').value.trim();
      const extra = {}; for (const f of fields) { extra[f.key] = $(`[data-f="${f.key}"]`).value.trim(); if (f.required && !extra[f.key]) return void ($('#cpErr').textContent = `${f.label} fehlt.`); }
      if (opts.needPhoto && !photo) return void ($('#cpErr').textContent = 'Bitte ein Foto wählen.');
      if (!text && !photo && !extra.title) return void ($('#cpErr').textContent = 'Schreib etwas oder wähle ein Foto.');
      const r = await ZX.rpc('feed.post', { app: app.id, text, photo, extra });
      if (!r || !r.ok) return void ($('#cpErr').textContent = (r && r.error) || 'Fehler beim Posten.');
      ZX.back();
    };
  }

  /* ───────── Photo feed (Flick, Lense, Pinwall…) ───────── */
  engines.photo = async (app, view, arg, isLive) => {
    const cfg = app.cfg || {};
    if (view === 'compose') return compose(app, arg, { needPhoto: true, max: 400, ph: 'Bildunterschrift …' });
    if (view === 'comments') return comments(app, arg);
    if (view === 'profile') {
      const handle = arg || meHandle();
      const list = (cache[app.id] || await load(app)).filter((p) => p.author.handle === handle);
      const a = list[0]?.author || { handle, name: handle === meHandle() ? ZX.S.owner.name : handle };
      head('@' + handle, app.name);
      const likes = list.reduce((s, p) => s + p.likes.length, 0);
      body.innerHTML = `<div class="profile">${av(a, 'xl')}<b>${esc(a.name)}</b><span class="s">@${esc(handle)}</span>
        <div class="pf-stats"><div><b>${list.length}</b><span>Beiträge</span></div><div><b>${likes}</b><span>Likes</span></div><div><b>${(hue(handle) * 7) % 900 + 12}</b><span>Follower</span></div></div></div>
        <div class="photo-grid">${list.map((p) => `<button data-post="${p.id}">${ZX.photoHTML(p.photo)}</button>`).join('') || '<p class="empty">Noch keine Beiträge.</p>'}</div>`;
      body.onclick = (e) => { const b = e.target.closest('[data-post]'); if (b) ZX.go('post', b.dataset.post); };
      return;
    }
    if (view === 'post') { const p = findPost(app, arg); if (!p) return ZX.back(); head(app.name, '@' + p.author.handle); body.innerHTML = postCard(p); bindFeed(app); return; }
    if (!isLive) head(app.name, cfg.tagline || 'Feed', `<button type="button" id="phNew" aria-label="Neuer Beitrag">+</button>`);
    $('#phNew') && ($('#phNew').onclick = () => ZX.go('compose'));
    if (!cache[app.id]) body.innerHTML = '<p class="empty">Lädt …</p>';
    const list = await load(app);
    if (ZX.current?.id !== app.id || ZX.current.view) return;
    const people = [...new Map(list.map((p) => [p.author.handle, p.author])).values()].slice(0, 12);
    const scroll = body.scrollTop;
    if (cfg.layout === 'masonry') {
      body.innerHTML = `<div class="masonry">${list.map((p) => `<button class="m-item" data-post="${p.id}">${ZX.photoHTML(p.photo)}<span>${esc(p.text.slice(0, 40))}</span></button>`).join('')}</div>`;
    } else {
      body.innerHTML = `${cfg.stories !== false ? `<div class="stories"><button class="story me" id="myProfile">${av({ handle: meHandle(), name: ZX.S.owner.name })}<span>Du</span></button>${people.map((a) => `<button class="story" data-profile="${esc(a.handle)}">${av(a)}<span>${esc(a.handle.slice(0, 10))}</span></button>`).join('')}</div>` : ''}
        ${list.map(postCard).join('') || '<p class="empty">Noch keine Beiträge.</p>'}`;
    }
    body.scrollTop = scroll;
    bindFeed(app);
  };
  function postCard(p) {
    return `<article class="post" data-id="${p.id}">
      <header>${av(p.author, 's')}<button class="grow" data-profile="${esc(p.author.handle)}"><b>${esc(p.author.handle)}</b><small>${ago(p.t)}</small></button>${p.author.handle === meHandle() ? `<button class="x" data-del="${p.id}" aria-label="Löschen">✕</button>` : ''}</header>
      ${p.photo ? `<div class="post-img" data-dbl="${p.id}">${ZX.photoHTML(p.photo)}<span class="burst">${svg('heart')}</span></div>` : ''}
      <div class="post-acts">${likeHTML(p)}<button class="act" data-com="${p.id}">${svg('comment')}<span>${p.comments.length}</span></button><button class="act" data-share="${p.id}">${svg('send')}</button></div>
      ${p.text ? `<p class="post-text"><b>${esc(p.author.handle)}</b> ${esc(p.text)}</p>` : ''}
      ${p.comments.length ? `<button class="post-more" data-com="${p.id}">Alle ${p.comments.length} Kommentare ansehen</button>` : ''}
    </article>`;
  }
  function bindFeed(app) {
    let lastTap = 0;
    body.onclick = async (e) => {
      const t = e.target;
      const l = t.closest('[data-like]'); if (l) return like(app, l.dataset.like, l);
      const c = t.closest('[data-com]'); if (c) return ZX.go('comments', c.dataset.com);
      const pr = t.closest('[data-profile]'); if (pr) return ZX.go('profile', pr.dataset.profile);
      if (t.closest('#myProfile')) return ZX.go('profile', meHandle());
      const po = t.closest('[data-post]'); if (po) return ZX.go('post', po.dataset.post);
      const d = t.closest('[data-del]'); if (d) { await ZX.rpc('feed.delete', { app: app.id, id: d.dataset.del }); cache[app.id] = (cache[app.id] || []).filter((x) => x.id !== d.dataset.del); d.closest('.post').remove(); return; }
      const s = t.closest('[data-share]'); if (s) { const p = findPost(app, s.dataset.share); if (p?.photo) { ZX.data('messages').pending = p.photo; ZX.open('messages'); ZX.go('new'); } return; }
      const dbl = t.closest('[data-dbl]');
      if (dbl) { const now = Date.now(); if (now - lastTap < 320) { const p = findPost(app, dbl.dataset.dbl); dbl.classList.add('burst-on'); setTimeout(() => dbl.classList.remove('burst-on'), 700); if (p && !p.likes.includes(meHandle())) like(app, p.id, dbl.closest('.post').querySelector('[data-like]')); } lastTap = now; }
    };
  }

  /* ───────── Reels (Reelz, Clipz, Vidz, Livez) ───────── */
  engines.reels = async (app, view, arg, isLive) => {
    const cfg = app.cfg || {};
    if (view === 'compose') return compose(app, arg, { needPhoto: true, max: 150, ph: 'Beschreibung und #hashtags', fields: [{ key: 'sound', label: 'Sound', type: 'select', options: ['Original-Sound', 'Zurex Beat', 'Lo-Fi Nights', 'Bass Drop', 'Vinewood Anthem'] }] });
    if (view === 'comments') return comments(app, arg);
    if (cfg.landscape && view !== 'watch') {
      if (!isLive) head(app.name, cfg.tagline || 'Videos', '<button type="button" id="rvNew">+</button>');
      $('#rvNew') && ($('#rvNew').onclick = () => ZX.go('compose'));
      const list = await load(app);
      if (ZX.current?.id !== app.id || ZX.current.view) return;
      body.innerHTML = list.map((p, i) => `<button class="vid-card" data-watch="${p.id}"><div class="vid-thumb">${ZX.photoHTML(p.photo)}<span class="vid-dur">${1 + (i * 7) % 14}:${String((i * 23) % 60).padStart(2, '0')}</span>${cfg.live ? '<span class="live-dot">LIVE</span>' : ''}</div><div class="vid-meta">${av(p.author, 's')}<div><b>${esc(p.text.slice(0, 60) || 'Video')}</b><small>@${esc(p.author.handle)} · ${p.likes.length * 137 + 40} Aufrufe · ${ago(p.t)}</small></div></div></button>`).join('');
      body.onclick = (e) => { const w = e.target.closest('[data-watch]'); if (w) ZX.go('watch', w.dataset.watch); };
      return;
    }
    const list = cache[app.id] || await load(app);
    const startId = view === 'watch' ? arg : null;
    head(app.name, cfg.tagline || 'Für dich', '<button type="button" id="rNew">+</button>');
    $('#rNew').onclick = () => ZX.go('compose');
    body.classList.add('flush');
    const start = Math.max(0, list.findIndex((p) => p.id === startId));
    body.innerHTML = `<div class="reels" id="reels">${list.map((p, i) => `<section class="reel" data-id="${p.id}" style="--d:${8 + (i % 5)}s">
      <div class="reel-bg">${ZX.photoHTML(p.photo)}</div><div class="reel-shade"></div>
      ${cfg.live ? '<span class="live-dot big">LIVE · ' + (p.likes.length * 13 + 21) + '</span>' : ''}
      <div class="reel-side"><button class="ravatar" data-profile="${esc(p.author.handle)}">${av(p.author)}</button>${likeHTML(p)}<button class="act" data-com="${p.id}">${svg('comment')}<span>${p.comments.length}</span></button><button class="act" data-share="${p.id}">${svg('share')}<span>Teilen</span></button></div>
      <div class="reel-info"><b>@${esc(p.author.handle)}</b><p>${esc(p.text)}</p><span class="reel-sound">${svg('music')} ${esc(p.extra?.sound || 'Original-Sound')} · ${esc(p.author.name)}</span></div>
      <div class="reel-progress"><i></i></div></section>`).join('') || '<p class="empty">Noch keine Clips.</p>'}</div>`;
    const reels = $('#reels');
    if (start) reels.scrollTop = start * reels.clientHeight;
    let lastTap = 0;
    reels.onclick = (e) => {
      const l = e.target.closest('[data-like]'); if (l) return like(app, l.dataset.like, l);
      const c = e.target.closest('[data-com]'); if (c) return ZX.go('comments', c.dataset.com);
      const s = e.target.closest('[data-share]'); if (s) { const p = findPost(app, s.dataset.share); if (p) { ZX.data('messages').pending = p.photo; ZX.open('messages'); ZX.go('new'); } return; }
      const r = e.target.closest('.reel');
      if (r) { const now = Date.now(); if (now - lastTap < 320) { const btn = r.querySelector('[data-like]'); if (!btn.classList.contains('liked')) like(app, r.dataset.id, btn); r.classList.add('burst-on'); setTimeout(() => r.classList.remove('burst-on'), 700); } else r.classList.toggle('paused'); lastTap = now; }
    };
  };

  /* ───────── Ghost (disappearing snaps) ───────── */
  engines.ghost = async (app, view, arg) => {
    if (view === 'open') {
      head('Snap', '@' + arg.from.handle);
      body.classList.add('flush');
      body.innerHTML = `<div class="snap-view">${ZX.photoHTML(arg.photo)}${arg.caption ? `<p class="snap-cap">${esc(arg.caption)}</p>` : ''}<div class="snap-timer"><i></i></div></div>`;
      ZX.live.timeout(() => ZX.back(), 8000);
      body.onclick = () => ZX.back();
      return;
    }
    if (view === 'send') {
      head('Senden an', app.name, '<button type="button" id="gsGo">Senden</button>');
      let photo = arg && arg.photo;
      body.innerHTML = `<button class="compose-photo ${photo ? 'has' : ''}" id="gsPhoto">${photo ? ZX.photoHTML(photo) : svg('camera') + '<span>Snap aufnehmen</span>'}</button>
        <input class="field" id="gsCap" placeholder="Text auf dem Snap" maxlength="80" style="margin-top:10px" />
        <label class="row check"><input type="checkbox" id="gsStory" /> <span class="grow"><span class="t">Meine Story</span><span class="s">24 Stunden für alle sichtbar</span></span></label>
        <ul class="list">${ZX.S.contacts.map((c) => `<li><label class="row check"><input type="checkbox" value="${esc(c.number)}" /> ${av({ handle: c.number, name: c.name }, 's')}<span class="grow"><span class="t">${esc(c.name)}</span></span></label></li>`).join('')}</ul><p class="err" id="gsErr"></p>`;
      $('#gsPhoto').onclick = async () => { const p = await ZX.capture(); photo = p; $('#gsPhoto').classList.add('has'); $('#gsPhoto').innerHTML = ZX.photoHTML(p); };
      $('#gsGo').onclick = async () => {
        if (!photo) return void ($('#gsErr').textContent = 'Erst einen Snap aufnehmen.');
        const to = $$('.list input:checked', body).map((i) => i.value);
        const story = $('#gsStory').checked;
        if (!to.length && !story) return void ($('#gsErr').textContent = 'Wähle Empfänger oder deine Story.');
        const caption = $('#gsCap').value.trim();
        if (story) await ZX.rpc('ghost.send', { story: true, photo, caption });
        if (to.length) { const r = await ZX.rpc('ghost.send', { to, photo, caption }); if (!r || !r.ok) return void ($('#gsErr').textContent = (r && r.error) || 'Fehler'); }
        ZX.notify('ghost', 'Snap gesendet', story && !to.length ? 'Zur Story hinzugefügt' : `an ${to.length} Freund${to.length > 1 ? 'e' : ''}`);
        ZX.back();
      };
      return;
    }
    head('Ghost', 'Snaps', '<button type="button" id="gNew">Snap</button>');
    $('#gNew').onclick = () => ZX.go('send');
    const r = await ZX.rpc('ghost.inbox');
    if (ZX.current?.id !== app.id || ZX.current.view) return;
    const snaps = (r && r.snaps) || [], stories = (r && r.stories) || [];
    body.innerHTML = `<p class="tag set-h">Stories</p><div class="stories">${stories.map((s, i) => `<button class="story ring" data-story="${i}">${av(s.author)}<span>${esc(s.author.handle.slice(0, 10))}</span></button>`).join('')}</div>
      <p class="tag set-h">Chats</p>${snaps.length ? `<ul class="list">${snaps.map((s, i) => `<li><button class="row" data-snap="${i}">${av(s.from)}<span class="grow"><span class="t">${esc(s.from.name)}</span><span class="s ghost-new">■ Neuer Snap · ${ago(s.t)}</span></span></button></li>`).join('')}</ul>` : '<p class="empty">Keine neuen Snaps. Sende deinen ersten!</p>'}
      <button class="shutter big" id="gShoot" aria-label="Snap aufnehmen"></button>`;
    body.onclick = async (e) => {
      const s = e.target.closest('[data-snap]');
      if (s) { const snap = snaps[+s.dataset.snap]; await ZX.rpc('ghost.open', { id: snap.id }); ZX.go('open', snap); return; }
      const st = e.target.closest('[data-story]'); if (st) { const x = stories[+st.dataset.story]; ZX.go('open', { from: x.author, photo: x.photo, caption: x.caption }); return; }
      if (e.target.closest('#gShoot')) { const p = await ZX.capture(); ZX.go('send', { photo: p }); }
    };
  };
  ZX.onPush('ghost', (d) => ZX.notify('ghost', d.name || 'Ghost', 'hat dir einen Snap geschickt', null, 'ghost'));

  /* ───────── Text feed (Chirp, Threadz, Linkd, Zurex News, Events, Bewertungen) ───────── */
  engines.text = async (app, view, arg, isLive) => {
    const cfg = app.cfg || {};
    if (view === 'compose') return compose(app, arg, { max: cfg.max || 280, photo: cfg.photos !== false, rows: 5, ph: cfg.ph || 'Was passiert gerade?', fields: cfg.fields || [] });
    if (view === 'comments') return comments(app, arg, 'Antworten');
    if (!isLive) head(app.name, cfg.tagline || 'Timeline', cfg.readonly && !ZX.S.owner.canPost ? '' : '<button type="button" id="txNew">+</button>');
    $('#txNew') && ($('#txNew').onclick = () => ZX.go('compose'));
    const list = await load(app);
    if (ZX.current?.id !== app.id || ZX.current.view) return;
    const scroll = body.scrollTop;
    body.innerHTML = list.map((p) => `<article class="chirp">${av(p.author, 's')}<div class="grow">
      <header><b>${esc(p.author.name)}</b> <span class="s">@${esc(p.author.handle)} · ${ago(p.t)}</span>${p.author.handle === meHandle() ? `<button class="x" data-del="${p.id}">✕</button>` : ''}</header>
      ${p.extra?.title ? `<h3 class="chirp-title">${esc(p.extra.title)}</h3>` : ''}
      ${p.extra?.rating ? `<p class="stars">${'★'.repeat(+p.extra.rating)}${'☆'.repeat(5 - +p.extra.rating)} <span class="s">${esc(p.extra.place || '')}</span></p>` : ''}
      ${p.extra?.when ? `<p class="chip on" style="display:inline-block;margin:4px 0">${esc(p.extra.when)}</p>` : ''}
      <p class="chirp-text">${esc(p.text).replace(/#(\w+)/g, '<span class="hash">#$1</span>').replace(/@(\w[\w.]*)/g, '<span class="hash">@$1</span>')}</p>
      ${p.photo ? `<div class="chirp-img">${ZX.photoHTML(p.photo)}</div>` : ''}
      <div class="post-acts small"><button class="act" data-com="${p.id}">${svg('comment')}<span>${p.comments.length}</span></button>${likeHTML(p)}<button class="act" data-share="${p.id}">${svg('share')}</button></div></div></article>`).join('') || '<p class="empty">Noch nichts los hier.</p>';
    body.scrollTop = scroll;
    body.onclick = async (e) => {
      const l = e.target.closest('[data-like]'); if (l) return like(app, l.dataset.like, l);
      const c = e.target.closest('[data-com]'); if (c) return ZX.go('comments', c.dataset.com);
      const d = e.target.closest('[data-del]'); if (d) { await ZX.rpc('feed.delete', { app: app.id, id: d.dataset.del }); d.closest('.chirp').remove(); return; }
      const s = e.target.closest('[data-share]'); if (s) { const p = findPost(app, s.dataset.share); if (p) { ZX.rpc('feed.post', { app: app.id, text: `RT @${p.author.handle}: ${p.text}`.slice(0, cfg.max || 280), photo: p.photo }); ZX.render(true); } }
    };
  };

  /* ───────── Forum (Reddot, Nachbarn, Beichte) ───────── */
  engines.forum = async (app, view, arg, isLive) => {
    const cfg = app.cfg || {};
    if (view === 'compose') return compose(app, arg, { title: 'Neuer Thread', max: 2000, rows: 6, photo: cfg.photos !== false, fields: [{ key: 'title', label: 'Titel', required: true, max: 100 }, ...(cfg.flairs ? [{ key: 'flair', label: 'Kategorie', type: 'select', options: cfg.flairs }] : [])] });
    if (view === 'comments') return comments(app, arg);
    if (!isLive) head(app.name, cfg.tagline || 'Threads', '<button type="button" id="fNew">+</button>');
    $('#fNew') && ($('#fNew').onclick = () => ZX.go('compose'));
    const list = await load(app);
    if (ZX.current?.id !== app.id || ZX.current.view) return;
    const sort = ZX.data(app.id).sort || 'hot';
    const sorted = list.slice().sort((a, b) => sort === 'new' ? b.t - a.t : (b.score + b.comments.length * 2) - (a.score + a.comments.length * 2));
    body.innerHTML = `<div class="seg" id="fSort"><button data-s="hot" class="${sort === 'hot' ? 'on' : ''}">Beliebt</button><button data-s="new" class="${sort === 'new' ? 'on' : ''}">Neu</button></div>
      ${sorted.map((p) => { const my = (p.votes || {})[meHandle()] || 0; return `<article class="thread-card"><div class="votes"><button data-vote="${p.id}" data-dir="1" class="${my > 0 ? 'on' : ''}">${svg('vote')}</button><b>${p.score || 0}</b><button data-vote="${p.id}" data-dir="-1" class="down ${my < 0 ? 'on' : ''}">${svg('vote')}</button></div>
        <button class="grow" data-com="${p.id}"><span class="s">${cfg.anon ? 'Anonym' : 'u/' + esc(p.author.handle)} · ${ago(p.t)}${p.extra?.flair ? ` · <span class="chip">${esc(p.extra.flair)}</span>` : ''}</span><h3>${esc(p.extra?.title || p.text.slice(0, 60))}</h3>${p.extra?.title ? `<p>${esc(p.text.slice(0, 160))}</p>` : ''}${p.photo ? `<div class="thread-img">${ZX.photoHTML(p.photo)}</div>` : ''}<span class="s">${svg('comment', 'width="14" height="14"')} ${p.comments.length} Kommentare</span></button></article>`; }).join('')}`;
    body.onclick = async (e) => {
      const so = e.target.closest('[data-s]'); if (so) { ZX.data(app.id).sort = so.dataset.s; ZX.save(); return ZX.render(true); }
      const v = e.target.closest('[data-vote]');
      if (v) { const p = findPost(app, v.dataset.vote); const my = (p.votes || {})[meHandle()] || 0; const dir = my === +v.dataset.dir ? 0 : +v.dataset.dir; const r = await ZX.rpc('feed.vote', { app: app.id, id: p.id, dir }); if (r && r.ok) { p.votes = { ...(p.votes || {}), [meHandle()]: dir }; p.score = r.score; ZX.render(true); } return; }
      const c = e.target.closest('[data-com]'); if (c) ZX.go('comments', c.dataset.com);
    };
  };

  /* ───────── Dating (Spark) ───────── */
  engines.dating = async (app, view) => {
    const st = ZX.data(app.id); st.seen ||= []; st.liked ||= [];
    const list = await load(app);
    if (ZX.current?.id !== app.id) return;
    const mine = list.find((p) => p.author.handle === meHandle());
    if (view === 'me' || (!mine && view !== 'matches')) {
      head('Dein Profil', app.name, '<button type="button" id="dSave">Speichern</button>');
      let photo = mine?.photo || null;
      body.innerHTML = `<button class="compose-photo ${photo ? 'has' : ''}" id="dPhoto">${photo ? ZX.photoHTML(photo) : svg('camera') + '<span>Profilfoto</span>'}</button>
        <label class="lbl">Alter</label><input class="field" id="dAge" inputmode="numeric" maxlength="2" value="${esc(mine?.extra?.age || '')}" />
        <label class="lbl">Über mich</label><textarea class="field" id="dBio" rows="4" maxlength="200">${esc(mine?.text || '')}</textarea>
        <label class="lbl">Ich suche</label><select class="field" id="dLook">${['Freundschaft', 'Date', 'Beziehung', 'Abenteuer'].map((o) => `<option ${mine?.extra?.look === o ? 'selected' : ''}>${o}</option>`).join('')}</select><p class="err" id="dErr"></p>`;
      $('#dPhoto').onclick = async () => { const p = await ZX.pickPhoto(); if (p) { photo = p; $('#dPhoto').classList.add('has'); $('#dPhoto').innerHTML = ZX.photoHTML(p); } };
      $('#dSave').onclick = async () => {
        const age = parseInt($('#dAge').value, 10);
        if (!photo || !(age >= 18 && age <= 99)) return void ($('#dErr').textContent = 'Foto und Alter (18+) angeben.');
        if (mine) await ZX.rpc('feed.delete', { app: app.id, id: mine.id });
        await ZX.rpc('feed.post', { app: app.id, text: $('#dBio').value.trim() || 'Hi!', photo, extra: { age, look: $('#dLook').value } });
        cache[app.id] = null; ZX.current.view = null; ZX.render();
      };
      return;
    }
    if (view === 'matches') {
      head('Matches', app.name);
      const matches = list.filter((p) => st.liked.includes(p.id) && p.likes.includes(meHandle()) === false && (hue(p.author.handle) % 3 !== 0 || p.likes.includes(meHandle())));
      body.innerHTML = matches.length ? `<ul class="list">${matches.map((p) => `<li><button class="row" data-msg="${esc(p.author.number || '')}" data-name="${esc(p.author.name)}"><span class="avatar-img">${ZX.photoHTML(p.photo)}</span><span class="grow"><span class="t">${esc(p.author.name)}, ${esc(p.extra?.age || '')}</span><span class="s">Schreib als Erstes!</span></span></button></li>`).join('')}</ul>` : '<p class="empty">Noch keine Matches. Weiter swipen!</p>';
      body.onclick = (e) => { const b = e.target.closest('[data-msg]'); if (b && b.dataset.msg) { let c = ZX.contactByNumber(b.dataset.msg); if (!c) { c = { id: ZX.uid(), name: b.dataset.name, number: b.dataset.msg, fav: false }; ZX.S.contacts.push(c); ZX.save(); } ZX.open('messages'); ZX.go('thread', c.id); } };
      return;
    }
    head(app.name, 'Entdecken', '<button type="button" id="dMatches">Matches</button>');
    $('#dMatches').onclick = () => ZX.go('matches');
    const deck = list.filter((p) => p.author.handle !== meHandle() && !st.seen.includes(p.id));
    const p = deck[0];
    body.innerHTML = p ? `<div class="swipe-card" id="card"><div class="sc-img">${ZX.photoHTML(p.photo)}</div><div class="sc-info"><b>${esc(p.author.name)}, ${esc(p.extra?.age || '?')}</b><span class="chip on">${esc(p.extra?.look || 'Date')}</span><p>${esc(p.text)}</p></div><span class="stamp yes">LIKE</span><span class="stamp no">NOPE</span></div>
      <div class="swipe-btns"><button class="sb no" id="dNo">✕</button><button class="sb me" id="dMe">${svg('user')}</button><button class="sb yes" id="dYes">${svg('heart')}</button></div>`
      : `<p class="empty">Keine weiteren Profile in deiner Nähe.</p><button class="btn ghost" id="dReset">Von vorn beginnen</button><button class="btn ghost" id="dMe2">Mein Profil</button>`;
    $('#dReset') && ($('#dReset').onclick = () => { st.seen = []; ZX.save(); ZX.render(); });
    $('#dMe2') && ($('#dMe2').onclick = () => ZX.go('me'));
    if (!p) return;
    const decide = (yes) => {
      const card = $('#card'); card.classList.add(yes ? 'out-right' : 'out-left');
      st.seen.push(p.id); if (yes) { st.liked.push(p.id); ZX.rpc('feed.like', { app: app.id, id: p.id }); if (hue(p.author.handle) % 3 !== 0) setTimeout(() => ZX.notify(app.id, "It's a Match! 💘", `Du und ${p.author.name} mögt euch.`, () => { ZX.open(app.id); ZX.go('matches'); }), 400); }
      ZX.save(); setTimeout(() => ZX.render(true), 280);
    };
    $('#dNo').onclick = () => decide(false); $('#dYes').onclick = () => decide(true); $('#dMe').onclick = () => ZX.go('me');
    // Drag to swipe
    const card = $('#card'); let x0 = null;
    card.onpointerdown = (e) => { x0 = e.clientX; card.setPointerCapture(e.pointerId); card.style.transition = 'none'; };
    card.onpointermove = (e) => { if (x0 === null) return; const dx = e.clientX - x0; card.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`; card.classList.toggle('lean-yes', dx > 40); card.classList.toggle('lean-no', dx < -40); };
    card.onpointerup = (e) => { if (x0 === null) return; const dx = e.clientX - x0; x0 = null; card.style.transition = ''; if (Math.abs(dx) > 90) decide(dx > 0); else { card.style.transform = ''; card.classList.remove('lean-yes', 'lean-no'); } };
  };

  /* ───────── Chat channels (Whisp, Hubb, Darkchat, Crewnet, Stadtfunk…) ───────── */
  engines.chat = async (app, view, arg, isLive) => {
    const cfg = app.cfg || {};
    const st = ZX.data(app.id); st.joined ||= cfg.channels ? cfg.channels.slice() : ['allgemein'];
    if (view === 'room') {
      if (!isLive) {
        head((cfg.prefix ?? '#') + arg, app.name);
        body.classList.add('flex');
        body.innerHTML = `<div class="thread chat-room" id="room"></div><form class="composer" id="roomForm"><input class="field" id="roomInp" placeholder="${cfg.anon ? 'Anonym schreiben …' : 'Nachricht an ' + esc((cfg.prefix ?? '#') + arg)}" maxlength="500" autocomplete="off" /><button class="send">${svg('send')}</button></form>`;
        $('#roomForm').onsubmit = async (e) => { e.preventDefault(); const text = $('#roomInp').value.trim(); if (!text) return; $('#roomInp').value = ''; await ZX.rpc('chan.send', { app: app.id, ch: arg, text, anon: !!cfg.anon }); ZX.render(true); };
        setTimeout(() => $('#roomInp')?.focus(), 50);
        if (!ZX.isNui) ZX.live.interval(() => ZX.render(true), 4000);
      }
      const r = await ZX.rpc('chan.list', { app: app.id, ch: arg });
      const room = $('#room'); if (!room) return;
      const atBottom = room.scrollHeight - room.scrollTop - room.clientHeight < 40;
      let lastDay = '';
      room.innerHTML = ((r && r.msgs) || []).map((m) => {
        const mine = m.mine || (m.author.number && m.author.number === ZX.S.owner.number);
        const day = new Date(m.t).toDateString(); const sep = day !== lastDay ? `<p class="day-sep">${new Date(m.t).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}</p>` : ''; lastDay = day;
        return `${sep}<div class="cmsg ${mine ? 'mine' : ''}">${mine ? '' : av(m.author, 's')}<div class="cbody">${mine ? '' : `<b style="color:hsl(${hue(m.author.handle)},70%,75%)">${esc(cfg.anon ? m.author.handle : m.author.name)}</b>`}<p>${esc(m.text)}</p><time>${ZX.hm(m.t)}</time></div></div>`;
      }).join('');
      if (atBottom || !isLive) room.scrollTop = room.scrollHeight;
      return;
    }
    head(app.name, cfg.tagline || 'Kanäle', '<button type="button" id="chJoin">+</button>');
    body.innerHTML = `${cfg.info ? `<p class="info-box">${esc(cfg.info)}</p>` : ''}<ul class="list">${st.joined.map((c) => `<li><button class="row" data-room="${esc(c)}"><span class="ch-ico">${esc(cfg.prefix ?? '#')}</span><span class="grow"><span class="t">${esc(c)}</span><span class="s">${cfg.private ? 'Privat · Code geschützt' : 'Öffentlich'}</span></span>${(cfg.channels || []).includes(c) ? '' : `<span class="x" data-leave="${esc(c)}">✕</span>`}</button></li>`).join('')}</ul>
      <form class="join" id="joinForm" hidden><input class="field" id="joinName" placeholder="${cfg.private ? 'Kanalname + Code, z. B. crew-ballas-4471' : 'Kanalname'}" maxlength="32" /><button class="btn">Beitreten</button></form>`;
    $('#chJoin').onclick = () => { $('#joinForm').hidden = false; $('#joinName').focus(); };
    $('#joinForm').onsubmit = (e) => { e.preventDefault(); const n = $('#joinName').value.trim().toLowerCase().replace(/[^a-z0-9\-_]/g, ''); if (n.length < 2) return; if (!st.joined.includes(n)) st.joined.push(n); ZX.save(); ZX.go('room', n); };
    body.onclick = (e) => { const lv = e.target.closest('[data-leave]'); if (lv) { e.stopPropagation(); st.joined = st.joined.filter((x) => x !== lv.dataset.leave); ZX.save(); return ZX.render(); } const r = e.target.closest('[data-room]'); if (r) ZX.go('room', r.dataset.room); };
  };
  ZX.onPush('chan', (d) => {
    const cur = ZX.current;
    if (cur && cur.id === d.app && cur.view === 'room' && cur.arg === d.ch) return ZX.render(true);
    const st = ZX.data(d.app); if (d.notify && st.joined && st.joined.includes(d.ch)) ZX.notify(d.app, `${ZX.appMeta(d.app)?.name} · #${d.ch}`, d.text || 'Neue Nachricht', () => { ZX.open(d.app); ZX.go('room', d.ch); }, d.app);
  });

  /* ───────── Classifieds (Bazar, Autoscout, Immo, Jobs…) ───────── */
  engines.classifieds = async (app, view, arg, isLive) => {
    const cfg = app.cfg || {};
    if (view === 'compose') return compose(app, arg, { title: cfg.postTitle || 'Inserat aufgeben', max: 600, rows: 4, textLabel: 'Beschreibung', ph: 'Zustand, Details, Treffpunkt …', fields: [{ key: 'title', label: 'Titel', required: true, max: 60 }, { key: 'price', label: cfg.priceLabel || 'Preis (€)', type: 'number', required: !cfg.noPrice, max: 12 }, ...(cfg.cats ? [{ key: 'cat', label: 'Kategorie', type: 'select', options: cfg.cats }] : [])] });
    if (view === 'item') {
      const p = findPost(app, arg); if (!p) return ZX.back();
      head(p.extra.title, app.name);
      body.innerHTML = `${p.photo ? `<div class="photo-full">${ZX.photoHTML(p.photo)}</div>` : ''}<p class="item-price">${cfg.noPrice ? esc(p.extra.price || '') : money(+String(p.extra.price).replace(',', '.') || 0)}${cfg.priceSuffix || ''}</p>
        ${p.extra.cat ? `<span class="chip">${esc(p.extra.cat)}</span>` : ''}<p class="store-desc">${esc(p.text)}</p>
        <div class="seller">${cfg.anon ? '<span class="avatar">?</span>' : av(p.author)}<div class="grow"><b>${cfg.anon ? 'Anonymer Verkäufer' : esc(p.author.name)}</b><span class="s">${ago(p.t)}</span></div></div>
        ${p.author.handle === meHandle() ? '<button class="btn warn" id="iDel">Inserat löschen</button>' : `<div class="quick"><button id="iCall">${svg('phone')}Anrufen</button><button id="iMsg">${svg('messages')}Nachricht</button><button id="iCom">${svg('comment')}Fragen</button></div>`}`;
      $('#iDel') && ($('#iDel').onclick = async () => { await ZX.rpc('feed.delete', { app: app.id, id: p.id }); ZX.back(); });
      $('#iCall') && ($('#iCall').onclick = () => ZX.call(cfg.anon ? 'Anonym' : p.author.name, p.author.number));
      $('#iMsg') && ($('#iMsg').onclick = () => { ZX.sendToContact(p.author.number, { text: `Hi, ist "${p.extra.title}" noch zu haben?` }); ZX.open('messages'); });
      $('#iCom') && ($('#iCom').onclick = () => ZX.go('comments', p.id));
      return;
    }
    if (view === 'comments') return comments(app, arg, 'Fragen');
    if (!isLive) head(app.name, cfg.tagline || 'Anzeigen', '<button type="button" id="clNew">+</button>');
    $('#clNew') && ($('#clNew').onclick = () => ZX.go('compose'));
    const list = await load(app);
    if (ZX.current?.id !== app.id || ZX.current.view) return;
    const q = ZX.data(app.id).q || '';
    body.innerHTML = `<input class="field search" id="clQ" placeholder="Suchen in ${esc(app.name)}" value="${esc(q)}" autocomplete="off" />
      <div class="listing-grid" id="clGrid">${list.map((p) => `<button class="listing" data-item="${p.id}" data-q="${esc(((p.extra.title || '') + ' ' + p.text + ' ' + (p.extra.cat || '')).toLowerCase())}"><div class="l-img">${p.photo ? ZX.photoHTML(p.photo) : ZX.appSvg(app)}</div><b>${esc(p.extra.title || p.text.slice(0, 30))}</b><span class="l-price">${cfg.noPrice ? esc(p.extra.price || '') : money(+String(p.extra.price || 0).replace(',', '.') || 0)}${cfg.priceSuffix || ''}</span><small>${ago(p.t)}</small></button>`).join('') || '<p class="empty">Noch keine Inserate.</p>'}</div>`;
    const filter = (v) => { $$('#clGrid [data-q]').forEach((el) => { el.hidden = !!v && !el.dataset.q.includes(v.toLowerCase()); }); };
    filter(q);
    $('#clQ').oninput = (e) => { ZX.data(app.id).q = e.target.value; filter(e.target.value); };
    body.onclick = (e) => { const b = e.target.closest('[data-item]'); if (b) ZX.go('item', b.dataset.item); };
  };

  /* ───────── Mail (Zmail) ───────── */
  engines.mail = async (app, view, arg) => {
    if (view === 'compose') {
      head('Neue Mail', app.name, '<button type="button" id="mlSend">Senden</button>');
      body.innerHTML = `<label class="lbl">An</label><input class="field" id="mlTo" placeholder="name@zmail.ls oder 555-0123" value="${esc(arg?.to || '')}" />
        <label class="lbl">Betreff</label><input class="field" id="mlSub" maxlength="80" value="${esc(arg?.subject || '')}" />
        <label class="lbl">Nachricht</label><textarea class="field" id="mlBody" rows="10" maxlength="4000"></textarea><p class="err" id="mlErr"></p>`;
      $('#mlSend').onclick = async () => { const r = await ZX.rpc('mail.send', { to: $('#mlTo').value.trim(), subject: $('#mlSub').value.trim(), body: $('#mlBody').value }); if (!r || !r.ok) return void ($('#mlErr').textContent = (r && r.error) || 'Fehler'); ZX.notify('mail', 'Mail gesendet', $('#mlSub').value); ZX.back(); };
      return;
    }
    if (view === 'read') {
      head(arg.subject, app.name, '<button type="button" id="mlRe">Antworten</button>');
      ZX.rpc('mail.read', { id: arg.id });
      body.innerHTML = `<div class="mail-head">${av({ handle: arg.from, name: arg.from }, '')}<div><b>${esc(arg.from)}</b><span class="s">an ${esc(arg.to)} · ${new Date(arg.t).toLocaleString('de-DE')}</span></div></div><div class="mail-body">${esc(arg.body).replace(/\n/g, '<br>')}</div><button class="btn warn" id="mlDel">Löschen</button>`;
      $('#mlRe').onclick = () => ZX.go('compose', { to: arg.from, subject: 'Re: ' + arg.subject });
      $('#mlDel').onclick = async () => { await ZX.rpc('mail.delete', { id: arg.id }); ZX.back(); };
      return;
    }
    head(app.name, `${ZX.S.owner.handle}@zmail.ls`, '<button type="button" id="mlNew">Neu</button>');
    $('#mlNew').onclick = () => ZX.go('compose');
    const tab = ZX.data(app.id).tab || 'inbox';
    const r = await ZX.rpc('mail.list');
    if (ZX.current?.id !== app.id || ZX.current.view) return;
    const list = ((r && r[tab]) || []).slice().sort((a, b) => b.t - a.t);
    body.innerHTML = `<div class="seg" id="mlTabs"><button data-t="inbox" class="${tab === 'inbox' ? 'on' : ''}">Posteingang</button><button data-t="sent" class="${tab === 'sent' ? 'on' : ''}">Gesendet</button></div>
      ${list.length ? `<ul class="list">${list.map((m, i) => `<li><button class="row mail-row ${m.read ? '' : 'unread'}" data-m="${i}">${av({ handle: m.from, name: tab === 'sent' ? m.to : m.from }, 's')}<span class="grow"><span class="t">${esc(tab === 'sent' ? m.to : m.from)}</span><span class="s"><b>${esc(m.subject)}</b> — ${esc(m.body.slice(0, 50))}</span></span><span class="meta">${ago(m.t)}</span></button></li>`).join('')}</ul>` : '<p class="empty">Keine Mails.</p>'}`;
    body.onclick = (e) => { const t = e.target.closest('[data-t]'); if (t) { ZX.data(app.id).tab = t.dataset.t; return ZX.render(); } const m = e.target.closest('[data-m]'); if (m) ZX.go('read', list[+m.dataset.m]); };
  };
  ZX.onPush('mail', (d) => ZX.notify('mail', d.from || 'Zmail', d.subject || 'Neue Mail', null, 'mail'));
})();
