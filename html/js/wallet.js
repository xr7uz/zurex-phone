/*
 * Bank cards + Zurex Pay.
 *  - Card types (config.lua: Config.Cards) with their own design, cashback, limit and yearly fee.
 *  - Bank app gets a card carousel and card management (order, freeze, default, details).
 *  - Zurex Pay app: stacked cards, "ready to pay" with Face ID / code, send money to contacts.
 *  - ZX.requestPay(): payment sheet used by server pushes (other scripts call exports.RequestPayment).
 */
(() => {
  'use strict';
  const { $, $$, esc, svg, money, ago, RENDER, body } = ZX;
  const S = () => ZX.S;

  window.ZX_CARDS = window.ZX_CARDS || [
    { id: 'debit', name: 'Zurex Debit', design: 'plum', price: 0, fee: 0, cashback: 0, limit: 5000, desc: 'Deine Standardkarte. Kostenlos.' },
    { id: 'zebra', name: 'Zebra Card', design: 'zebra', price: 250, fee: 0, cashback: .5, limit: 10000, desc: 'Die Signature-Karte mit Zebra-Muster. 0,5 % Cashback.' },
    { id: 'gold', name: 'Zurex Gold', design: 'gold', price: 1500, fee: 120, cashback: 1, limit: 25000, desc: 'Gebürstetes Gold, 1 % Cashback, höheres Limit.' },
    { id: 'frost', name: 'Frost Glass', design: 'frost', price: 900, fee: 60, cashback: .75, limit: 15000, desc: 'Transparentes Milchglas. 0,75 % Cashback.' },
    { id: 'black', name: 'Zurex Black', design: 'black', price: 9500, fee: 900, cashback: 2, limit: 100000, desc: 'Schwarzes Metall. 2 % Cashback, Concierge, kein Limit-Stress.' },
    { id: 'business', name: 'Business', design: 'teal', price: 600, fee: 240, cashback: 1, limit: 50000, desc: 'Für Firmen: Rechnungen und Belege an einem Ort.' },
  ];
  const type = (id) => window.ZX_CARDS.find((c) => c.id === id) || window.ZX_CARDS[0];
  const cards = () => {
    const s = S();
    if (!s.cards || !s.cards.length) s.cards = [{ id: ZX.uid(), type: 'debit', last4: String(1000 + Math.floor(Math.random() * 9000)), exp: expiry(), frozen: false, isDefault: true }];
    return s.cards;
  };
  const expiry = () => { const d = new Date(); d.setFullYear(d.getFullYear() + 4); return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`; };
  const defaultCard = () => cards().find((c) => c.isDefault && !c.frozen) || cards().find((c) => !c.frozen);
  ZX.cards = { list: cards, type, defaultCard };

  /* Card face */
  const chip = '<svg class="zc-chip" viewBox="0 0 40 30"><rect x="1" y="1" width="38" height="28" rx="5" fill="url(#zcChip)"/><path d="M1 10h12M1 20h12M27 10h12M27 20h12M13 1v28M27 1v28M13 15h14" stroke="#7a5a1a" stroke-opacity=".55" stroke-width="1"/><defs><linearGradient id="zcChip" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e3a1"/><stop offset=".5" stop-color="#d4a843"/><stop offset="1" stop-color="#f3d98a"/></linearGradient></defs></svg>';
  const nfc = '<svg class="zc-nfc" viewBox="0 0 24 24"><path d="M8 7a7 7 0 0 1 0 10M12 4a11 11 0 0 1 0 16M16 2a14 14 0 0 1 0 20"/></svg>';
  function cardFace(c, opts = {}) {
    const t = type(c.type);
    return `<div class="zcard d-${t.design} ${c.frozen ? 'frozen' : ''} ${opts.cls || ''}" data-card="${c.id}">
      <div class="zc-top"><span class="zc-brand">${ZX.logo()}<b>Zurex</b></span><span class="zc-type">${esc(t.name)}</span></div>
      <div class="zc-mid">${chip}${nfc}</div>
      <div class="zc-num">•••• •••• •••• ${esc(c.last4)}</div>
      <div class="zc-bot"><span>${esc((S().owner.name || '').toUpperCase())}</span><span>${esc(c.exp)}</span><b class="zc-net">ZRX<i>PAY</i></b></div>
      ${c.frozen ? '<span class="zc-frozen">GESPERRT</span>' : ''}</div>`;
  }
  ZX.cardFace = cardFace;

  /* ───────── Bank app: cards section ───────── */
  const baseBank = RENDER.bank;
  RENDER.bank = (view, arg, isLive) => {
    if (view === 'cards') return cardsView();
    if (view === 'card') return cardView(arg);
    if (view === 'order') return orderView();
    baseBank(view, arg, isLive);
    if (view) return;
    const card = body.querySelector('.card');
    if (!card) return;
    // Replace the static account card with the real card carousel.
    card.outerHTML = `<div class="card-rail" id="cardRail">${cards().map((c) => cardFace(c, { cls: 'rail' })).join('')}<button class="zcard add-card" data-order>${svg('plus')}<span>Karte bestellen</span></button></div>
      <div class="acct-line"><span class="tag">Girokonto · ${esc(S().bank.iban)}</span><b class="num" id="bBal">${money(S().bank.balance)}</b></div>`;
    body.querySelector('#cardRail').onclick = (e) => {
      if (e.target.closest('[data-order]')) return ZX.go('order');
      const c = e.target.closest('[data-card]'); if (c) ZX.go('card', c.dataset.card);
    };
  };

  function cardView(id) {
    const c = cards().find((x) => x.id === id); if (!c) return ZX.back();
    const t = type(c.type);
    ZX.head(t.name, 'Karte');
    const spent = (S().bank.tx || []).filter((x) => x.card === c.id && x.amount < 0 && x.t > Date.now() - 30 * 864e5).reduce((s, x) => s - x.amount, 0);
    body.innerHTML = `<div class="card-hero">${cardFace(c, { cls: 'big' })}</div>
      <div class="quick four"><button data-a="freeze">${svg(c.frozen ? 'check' : 'lock')}${c.frozen ? 'Entsperren' : 'Sperren'}</button><button data-a="default">${svg('star')}${c.isDefault ? 'Standard' : 'Als Standard'}</button><button data-a="details">${svg('eye')}Details</button><button data-a="pay">${svg('wallet')}Zurex Pay</button></div>
      <div class="group" style="margin-top:12px"><div class="row"><span class="grow"><span class="t">Monatslimit</span><span class="s">${money(spent)} von ${money(t.limit)} genutzt</span></span></div><div class="bar" style="margin:0 0 12px"><i style="width:${Math.min(100, spent / t.limit * 100)}%"></i></div>
        <div class="row"><span class="grow t">Cashback</span><span class="meta">${t.cashback ? t.cashback.toLocaleString('de-DE') + ' %' : '—'}</span></div><div class="row"><span class="grow t">Jahresgebühr</span><span class="meta">${t.fee ? money(t.fee) : 'kostenlos'}</span></div></div>
      <div id="cdDetails"></div>
      ${c.type !== 'debit' ? '<button class="btn warn" data-a="cancel">Karte kündigen</button>' : ''}`;
    body.onclick = (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
      if (a === 'freeze') { c.frozen = !c.frozen; if (c.frozen && c.isDefault) { c.isDefault = false; const o = cards().find((x) => !x.frozen); if (o) o.isDefault = true; } sync(); ZX.notify('bank', c.frozen ? 'Karte gesperrt' : 'Karte entsperrt', `${t.name} •••• ${c.last4}`); return ZX.render(true); }
      if (a === 'default' && !c.frozen) { cards().forEach((x) => { x.isDefault = x === c; }); sync(); return ZX.render(true); }
      if (a === 'details') return ZX.pinGate(() => { $('#cdDetails').innerHTML = `<div class="group"><div class="row"><span class="grow t">Kartennummer</span><span class="meta num">4815 ${String(c.last4).padStart(4, '0').slice(0, 2)}${c.id.slice(0, 2).replace(/\D/g, '7')} 2${c.id.length} ${c.last4}</span></div><div class="row"><span class="grow t">Gültig bis</span><span class="meta">${esc(c.exp)}</span></div><div class="row"><span class="grow t">CVC</span><span class="meta">${(parseInt(c.last4, 10) * 7 % 900) + 100}</span></div></div>`; }, { require: true });
      if (a === 'pay') return ZX.open('wallet');
      if (a === 'cancel') { S().cards = cards().filter((x) => x !== c); if (!cards().some((x) => x.isDefault)) cards()[0].isDefault = true; sync(); ZX.back(); }
    };
  }

  function cardsView() { ZX.go('order'); }

  function orderView() {
    ZX.head('Karte bestellen', 'Zurex Bank');
    const owned = new Set(cards().map((c) => c.type));
    body.innerHTML = `${window.ZX_CARDS.map((t) => `<div class="order-card">${cardFace({ id: 'preview-' + t.id, type: t.id, last4: '0000', exp: 'MM/JJ' }, { cls: 'mini' })}
      <div class="oc-info"><b>${esc(t.name)}</b><p>${esc(t.desc)}</p><div class="plan-meta"><span>${t.price ? money(t.price) : 'gratis'}</span><span>${t.cashback ? t.cashback.toLocaleString('de-DE') + ' % Cashback' : 'kein Cashback'}</span><span>Limit ${money(t.limit)}</span></div>
      ${owned.has(t.id) ? '<span class="chip on">Besitzt du</span>' : `<button class="btn ghost" data-buy="${t.id}">${t.price ? `Für ${money(t.price)} bestellen` : 'Kostenlos bestellen'}</button>`}</div></div>`).join('')}<p class="err" id="ocErr"></p>`;
    body.onclick = async (e) => {
      const b = e.target.closest('[data-buy]'); if (!b || !ZX.current || ZX.current.view !== 'order') return;
      const t = type(b.dataset.buy);
      // Paid cards need a second tap to confirm, so a stray tap never spends money.
      if (t.price && !b.dataset.armed) {
        $$('[data-buy]').forEach((x) => { delete x.dataset.armed; x.textContent = x.dataset.label || x.textContent; });
        b.dataset.label = b.textContent; b.dataset.armed = '1'; b.textContent = `Tippen zum Bestätigen · ${money(t.price)}`; b.classList.add('armed');
        setTimeout(() => { if (b.isConnected && b.dataset.armed) { delete b.dataset.armed; b.textContent = b.dataset.label; b.classList.remove('armed'); } }, 3500);
        return;
      }
      const r = await ZX.rpc('card.order', { type: t.id });
      if (!r || !r.ok) return void ($('#ocErr').textContent = (r && r.error) || 'Bestellung fehlgeschlagen.');
      if (!ZX.isNui && t.price) ZX.bankApply(-t.price, 'Zurex Bank', `Karte ${t.name}`);
      if (typeof r.balance === 'number') S().bank.balance = r.balance;
      cards().push(r.card || { id: ZX.uid(), type: t.id, last4: String(1000 + Math.floor(Math.random() * 9000)), exp: expiry(), frozen: false, isDefault: false });
      sync(); ZX.notify('bank', 'Karte ist da', `${t.name} ist in deinem Wallet.`); ZX.back();
    };
  }
  const sync = () => { ZX.save(); ZX.rpc('card.sync', { cards: cards() }); };

  /* ───────── Zurex Pay ───────── */
  let selected = null;
  RENDER.wallet = (view, arg) => {
    if (view === 'send') return sendView(arg);
    ZX.head('Zurex Pay', 'Wallet', '<button type="button" id="wpAdd">+</button>');
    $('#wpAdd').onclick = () => { ZX.open('bank'); ZX.go('order'); };
    const list = cards();
    selected = selected && list.find((c) => c.id === selected) ? selected : (defaultCard() || list[0]).id;
    const sel = list.find((c) => c.id === selected);
    const pays = (S().bank.tx || []).filter((t) => t.card).slice(0, 8);
    body.innerHTML = `<div class="wallet-stack" id="wStack">${list.map((c, i) => cardFace(c, { cls: `stack ${c.id === selected ? 'sel' : ''}` }).replace('class="zcard', `style="--i:${i}" class="zcard`)).join('')}</div>
      <div class="pay-ready" id="payReady"><div class="nfc-ring"><span></span><span></span><span></span>${svg('wallet')}</div><b>${sel.frozen ? 'Karte gesperrt' : 'Bereit zum Bezahlen'}</b><span class="s">${sel.frozen ? 'Entsperre die Karte in der Bank.' : 'Halte dein Zurex an das Terminal'}</span></div>
      <div class="quick"><button id="wpSend">${svg('send')}Senden</button><button id="wpTest">${svg('cart')}${ZX.isNui ? 'Letzte Zahlung' : 'Testzahlung'}</button><button id="wpBank">${svg('bank')}Bank</button></div>
      <div class="section-label"><span class="tag">Zahlungen</span></div>
      ${pays.length ? `<ul class="list">${pays.map((t) => `<li class="row tx"><span class="ico">${svg('wallet')}</span><span class="grow"><span class="t">${esc(t.label)}</span><span class="s">${esc(t.note || '')} · ${ago(t.t)}</span></span><span class="amt ${t.amount >= 0 ? 'gain' : 'loss'}">${t.amount >= 0 ? '+' : '−'}${money(Math.abs(t.amount))}</span></li>`).join('')}</ul>` : '<p class="empty">Noch keine Zahlungen mit Zurex Pay.</p>'}`;
    $('#wStack').onclick = (e) => { const c = e.target.closest('[data-card]'); if (c) { selected = c.dataset.card; ZX.render(true); } };
    $('#wpSend').onclick = () => ZX.go('send');
    $('#wpBank').onclick = () => ZX.open('bank');
    $('#wpTest').onclick = () => { if (!ZX.isNui) ZX.requestPay({ merchant: ZX.pick(['24/7 Supermarkt', 'Bean Machine', 'Burger Shot', 'Ron Tankstelle', 'Ponsonbys']), amount: Math.round(ZX.rand(3, 180) * 100) / 100, ref: 'test-' + ZX.uid() }); };
  };

  function sendView(cid) {
    ZX.head('Geld senden', 'Zurex Pay');
    body.innerHTML = `<div class="send-amount"><span>€</span><input class="num" id="spAmt" inputmode="decimal" placeholder="0" autocomplete="off" /></div>
      <div class="chips" style="justify-content:center">${[5, 10, 20, 50, 100].map((v) => `<button class="chip" data-v="${v}">${v} €</button>`).join('')}</div>
      <p class="tag set-h">An</p><ul class="list">${S().contacts.map((c) => `<li><button class="row ${c.id === cid ? 'playing' : ''}" data-to="${c.id}">${ZX.avatarHTML({ name: c.name, handle: c.number }, 's')}<span class="grow"><span class="t">${esc(c.name)}</span><span class="s">${esc(c.number)}</span></span></button></li>`).join('')}</ul><p class="err" id="spErr"></p>`;
    let to = cid;
    body.onclick = (e) => {
      const v = e.target.closest('[data-v]'); if (v) { $('#spAmt').value = v.dataset.v; return; }
      const t = e.target.closest('[data-to]'); if (!t) return;
      to = t.dataset.to; const c = ZX.contactBy(to);
      const amount = Math.round(parseFloat(($('#spAmt').value || '0').replace(',', '.')) * 100) / 100;
      if (!(amount > 0)) return void ($('#spErr').textContent = 'Betrag eingeben.');
      ZX.pinGate(async () => {
        const r = await ZX.rpc('bank.transfer', { to: c.number, name: c.name, amount, note: 'Zurex Pay' });
        if (!r || !r.ok) return void ($('#spErr').textContent = (r && r.error) || 'Senden fehlgeschlagen.');
        if (typeof r.balance === 'number') { S().bank.balance = r.balance; S().bank.tx.unshift({ id: ZX.uid(), label: c.name, note: 'Zurex Pay', amount: -amount, t: Date.now() }); ZX.save(); } else ZX.bankApply(-amount, c.name, 'Zurex Pay');
        ZX.sendToContact(c.number, { text: `💸 ${money(amount)} über Zurex Pay gesendet` });
        ZX.notify('wallet', 'Gesendet', `${money(amount)} an ${c.name}`); ZX.back();
      }, { require: true });
    };
    setTimeout(() => $('#spAmt')?.focus(), 60);
  }

  /* ───────── Payment sheet (shops / terminals / other scripts) ───────── */
  ZX.requestPay = ({ merchant, amount, ref, desc }) => new Promise((resolve) => {
    if (ZX.layers.boot && !ZX.layers.boot.hidden) return resolve(false);
    $('.pay-sheet')?.remove();
    let card = defaultCard();
    const sheet = document.createElement('div'); sheet.className = 'sheet pay-sheet';
    const draw = () => {
      sheet.innerHTML = `<div class="sheet-card"><div class="ps-merchant"><span class="ps-logo">${esc(merchant.slice(0, 1))}</span><div><b>${esc(merchant)}</b><span class="s">${esc(desc || 'Zahlung anfordern')}</span></div></div>
        <p class="ps-amount num">${money(amount)}</p>
        ${card ? cardFace(card, { cls: 'pay' }) : '<p class="empty">Keine aktive Karte. Entsperre oder bestelle eine Karte.</p>'}
        ${cards().filter((c) => !c.frozen).length > 1 ? `<div class="chips" style="justify-content:center">${cards().filter((c) => !c.frozen).map((c) => `<button class="chip ${card && c.id === card.id ? 'on' : ''}" data-pick="${c.id}">${esc(type(c.type).name)} ••${esc(c.last4)}</button>`).join('')}</div>` : ''}
        <p class="err" id="psErr"></p>
        <div class="trade-btns"><button class="btn ghost" data-x>Abbrechen</button><button class="btn" data-ok ${card ? '' : 'disabled'}>${S().ui && S().ui.faceId ? 'Mit Face ID zahlen' : 'Bezahlen'}</button></div></div>`;
    };
    draw();
    $('#screen').appendChild(sheet);
    if (ZX.isNui && document.body.classList.contains('closed')) ZX.post('focus');
    ZX.playTone('neon', .05);
    const finish = (ok) => { sheet.remove(); resolve(ok); };
    sheet.onclick = async (e) => {
      const p = e.target.closest('[data-pick]'); if (p) { card = cards().find((c) => c.id === p.dataset.pick); return draw(); }
      if (e.target.closest('[data-x]') || e.target === sheet) { ZX.rpc('pay.confirm', { ref, ok: false }); return finish(false); }
      if (!e.target.closest('[data-ok]') || !card) return;
      ZX.pinGate(async () => {
        const t = type(card.type);
        const r = await ZX.rpc('pay.confirm', { ref, ok: true, card: card.id, cardType: card.type, amount, merchant });
        if (!r || !r.ok) return void ($('#psErr').textContent = (r && r.error) || 'Zahlung abgelehnt.');
        const cb = Math.round(amount * (t.cashback || 0)) / 100;
        if (!ZX.isNui) ZX.bankApply(-amount + cb, merchant, cb ? `Zurex Pay · ${money(cb)} Cashback` : 'Zurex Pay');
        else if (typeof r.balance === 'number') { S().bank.balance = r.balance; S().bank.tx.unshift({ id: ZX.uid(), label: merchant, note: 'Zurex Pay', amount: -amount + (r.cashback || 0), t: Date.now() }); }
        S().bank.tx[0].card = card.id; ZX.save();
        sheet.querySelector('.sheet-card').innerHTML = `<div class="pay-done"><div class="pd-check">${svg('check')}</div><b>Bezahlt</b><span class="s">${money(amount)} · ${esc(merchant)}${cb ? ` · ${money(cb)} Cashback` : ''}</span></div>`;
        ZX.playTone('glass', .06);
        setTimeout(() => finish(true), 1300);
      }, { require: true });
    };
  });
  ZX.onPush('pay:request', (d) => ZX.requestPay(d));
})();
