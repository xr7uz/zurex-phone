--[[
  Zurex Phone server: players, RPC router, app handlers, exports.
  Every phone action arrives as zurex-phone:server:rpc(id, op, args) and is answered with a table.
  Other resources can add or override any op: exports['zurex-phone']:RegisterHandler(op, function(src, args) ... end)
]]
local Players = {}      -- src -> { id, number, name }
local BySrcNumber = {}  -- number -> src (online only)
local Handlers = {}
local External = {}     -- op -> fn registered by other resources
local Listeners = {}    -- op -> { fn, ... } called after a successful op
local lastWrite = {}
local callSeq, Calls = 0, {}

local function digits(s) return (tostring(s or ''):gsub('%D', '')) end
local function clampText(s, n) s = tostring(s or ''); return #s > n and s:sub(1, n) or s end
local function push(target, data) TriggerClientEvent('zurex-phone:client:push', target, data) end
local function pushAll(data) TriggerClientEvent('zurex-phone:client:push', -1, data) end

--------------------------------------------------------------------------- identity
local function genNumber()
  local n
  repeat n = Config.NumberFormat:gsub('#', function() return tostring(math.random(0, 9)) end) until not DB.numbers[n]
  return n
end

local function load(src)
  if Players[src] then return Players[src] end
  local id = Bridge.identifier(src)
  local prof = DB.profiles[id]
  if not prof then
    prof = { name = Bridge.name_of(src) }
    DB.profiles[id] = prof
  end
  -- A bought custom number always wins over the framework's number.
  prof.number = prof.customNumber or Bridge.frameworkNumber(src) or prof.number or genNumber()
  prof.name = Bridge.name_of(src)
  prof.handle = prof.handle or (prof.name:lower():gsub('[^a-z0-9]', '.'):gsub('%.+', '.'):sub(1, 18))
  DB.numbers[prof.number] = id
  Store_dirty()
  local p = { id = id, number = prof.number, name = prof.name }
  Players[src] = p
  BySrcNumber[digits(prof.number)] = src
  return p
end
local function author(src)
  local p = load(src); local prof = DB.profiles[p.id]
  return { handle = prof.handle, name = prof.name, number = prof.number, avatar = prof.avatar }
end
local function srcByNumber(num) return BySrcNumber[digits(num)] end

AddEventHandler('playerDropped', function()
  local src = source
  local p = Players[src]
  if p then BySrcNumber[digits(p.number)] = nil end
  Players[src] = nil
  for id, c in pairs(Calls) do
    if c.a == src or c.b == src then push(c.a == src and c.b or c.a, { kind = 'call:ended' }); Calls[id] = nil end
  end
end)

--------------------------------------------------------------------------- router
local function rateLimited(src, op)
  if op:find('%.list') or op:find('snapshot') or op:find('inbox') or op:find('portfolio') or op:find('items') or op:find('balance') then return false end
  local now = GetGameTimer()
  if lastWrite[src] and now - lastWrite[src] < Config.Limits.rateLimitMs then return true end
  lastWrite[src] = now
  return false
end

RegisterNetEvent('zurex-phone:server:rpc', function(reqId, op, args)
  local src = source
  if type(op) ~= 'string' or #op > 64 then return end
  args = type(args) == 'table' and args or {}
  local reply = function(res) TriggerClientEvent('zurex-phone:client:rpc', src, reqId, res or { ok = false }) end
  if rateLimited(src, op) then return reply({ ok = false, error = 'Zu schnell. Bitte kurz warten.' }) end
  load(src)
  local fn = External[op] or Handlers[op]
  if not fn and op:sub(1, 4) == 'ext.' then fn = External[op] end
  if not fn then return reply({ ok = false, error = 'Unbekannte Aktion: ' .. op }) end
  local ok, res = pcall(fn, src, args)
  if not ok then print(('[zurex-phone] %s failed: %s'):format(op, res)); return reply({ ok = false, error = 'Serverfehler.' }) end
  reply(res)
  if res and res.ok ~= false and Listeners[op] then for _, l in ipairs(Listeners[op]) do pcall(l, src, args, res) end end
end)

--------------------------------------------------------------------------- open / config
RegisterNetEvent('zurex-phone:server:requestOpen', function(forcedModel)
  local src = source
  local model = Config.DefaultModel
  if Config.RequireItem and Bridge.name ~= 'standalone' then
    local best, rank = nil, { base = 1, pro = 2, ultra = 3 }
    for item, m in pairs(Config.Items) do if Bridge.hasItem(src, item) and (not best or rank[m] > rank[best]) then best = m end end
    if not best then return Bridge.gameNotify(src, 'Du hast kein Handy dabei.') end
    model = best
  end
  if forcedModel and Config.Items[forcedModel] then model = Config.Items[forcedModel] end
  local p = load(src)
  local prof = DB.profiles[p.id]
  TriggerClientEvent('zurex-phone:client:open', src, {
    owner = { name = prof.name, number = prof.number, handle = prof.handle, avatar = prof.avatar, bio = prof.bio },
    bank = Bridge.getBank(src), model = model, carrier = prof.carrier, paidUntil = prof.paidUntil,
    cards = DB.cards[p.id],
  })
  -- Deliver SMS received while offline.
  local queued = DB.sms[digits(p.number)]
  if queued then for _, m in ipairs(queued) do push(src, m) end DB.sms[digits(p.number)] = nil; Store_dirty() end
end)

if Config.UsableItems then
  CreateThread(function()
    Wait(1000)
    for item in pairs(Config.Items) do Bridge.registerUsable(item, function(src) TriggerClientEvent('zurex-phone:client:useItem', src, item) end) end
  end)
end

--------------------------------------------------------------------------- handlers
local H = Handlers

H['market.snapshot'] = function() return { ok = true, list = Market.snapshot() } end

H['profile.set'] = function(src, a)
  local p = load(src); local prof = DB.profiles[p.id]
  local h = tostring(a.handle or ''):lower():gsub('[^a-z0-9_.]', ''):sub(1, 20)
  if #h < 3 then return { ok = false, error = 'Benutzername zu kurz.' } end
  for id, other in pairs(DB.profiles) do if id ~= p.id and other.handle == h then return { ok = false, error = 'Benutzername vergeben.' } end end
  prof.handle = h; prof.bio = clampText(a.bio, 140)
  if type(a.avatar) == 'table' then prof.avatar = { seed = tonumber(a.avatar.seed), scene = clampText(a.avatar.scene, 16), url = type(a.avatar.url) == 'string' and a.avatar.url:match('^https?://') and clampText(a.avatar.url, 400) or nil } else prof.avatar = nil end
  Store_dirty(); return { ok = true }
end

-- Photos coming from clients: either a generated scene (seed) or an uploaded https URL.
local function cleanPhoto(ph)
  if type(ph) ~= 'table' then return nil end
  local url = type(ph.url) == 'string' and ph.url:match('^https?://') and clampText(ph.url, 400) or nil
  return { seed = tonumber(ph.seed) or 1, scene = clampText(ph.scene, 16), filter = clampText(ph.filter, 10), url = url }
end

-- SMS / calls ------------------------------------------------------------
H['sms.send'] = function(src, a)
  local me = author(src)
  local msg = { kind = 'sms', from = me.number, name = me.name, text = clampText(a.text, 500), photo = cleanPhoto(a.photo), gps = type(a.gps) == 'table' and { x = tonumber(a.gps.x), y = tonumber(a.gps.y) } or nil }
  local target = srcByNumber(a.to)
  if target then push(target, msg)
  elseif DB.numbers[tostring(a.to)] or DB.numbers[a.to] then local k = digits(a.to); DB.sms[k] = DB.sms[k] or {}; table.insert(DB.sms[k], msg); Store_cap(DB.sms[k], 50); Store_dirty() end
  return { ok = true }
end

H['call.start'] = function(src, a)
  local target = srcByNumber(a.number)
  if not target or target == src then return { ok = false, error = 'Nicht erreichbar' } end
  for _, c in pairs(Calls) do if c.a == target or c.b == target then return { ok = false, error = 'Besetzt' } end end
  callSeq = callSeq + 1
  Calls[callSeq] = { a = src, b = target }
  local me = author(src)
  push(target, { kind = 'call:incoming', id = callSeq, number = me.number, name = me.name })
  TriggerClientEvent('zurex-phone:client:callChannel', src, callSeq)
  return { ok = true, id = callSeq }
end
H['call.accept'] = function(src)
  for id, c in pairs(Calls) do if c.b == src then push(c.a, { kind = 'call:accepted' }); TriggerClientEvent('zurex-phone:client:callChannel', src, id); return { ok = true } end end
  return { ok = false }
end
H['call.end'] = function(src)
  for id, c in pairs(Calls) do
    if c.a == src or c.b == src then
      local other = c.a == src and c.b or c.a
      push(other, { kind = 'call:ended' })
      TriggerClientEvent('zurex-phone:client:callChannel', other, 0); TriggerClientEvent('zurex-phone:client:callChannel', src, 0)
      Calls[id] = nil
    end
  end
  return { ok = true }
end

-- Bank ----------------------------------------------------------------------
H['bank.balance'] = function(src) return { ok = true, balance = Bridge.getBank(src) } end
H['bank.transfer'] = function(src, a)
  local amount = math.floor((tonumber(a.amount) or 0) * 100 + 0.5) / 100
  if amount <= 0 or amount > Config.Limits.maxTransfer then return { ok = false, error = 'Ungültiger Betrag.' } end
  if Bridge.name == 'standalone' and not Config.Hooks.onTransfer then return { ok = true } end
  local target = srcByNumber(a.to)
  if not target then return { ok = false, error = 'Empfänger ist nicht erreichbar.' } end
  if target == src then return { ok = false, error = 'Du kannst dir nicht selbst Geld senden.' } end
  if Config.Hooks.onTransfer and Config.Hooks.onTransfer(src, target, amount, a.note) == false then return { ok = false, error = 'Überweisung abgelehnt.' } end
  if (Bridge.getBank(src) or 0) < amount then return { ok = false, error = 'Nicht genug Guthaben.' } end
  if not Bridge.removeBank(src, amount, 'zurex-transfer') then return { ok = false, error = 'Überweisung abgelehnt.' } end
  Bridge.addBank(target, amount, 'zurex-transfer')
  local me = author(src)
  Bridge.logTransaction(src, -amount, 'Überweisung an ' .. (a.name or a.to)); Bridge.logTransaction(target, amount, 'Überweisung von ' .. me.name)
  push(target, { kind = 'bank:in', amount = amount, from = me.name, note = clampText(a.note, 40) })
  TriggerClientEvent('zurex-phone:client:bank', target, Bridge.getBank(target))
  return { ok = true, balance = Bridge.getBank(src) }
end

-- Feeds (photo, reels, text, forum, classifieds, dating, news) ------------
local function feed(app) DB.posts[app] = DB.posts[app] or {}; return DB.posts[app] end
local function findPost(app, id) for _, p in ipairs(feed(app)) do if p.id == id then return p end end end
local function sortedFeed(app)
  local out = {}
  for i, p in ipairs(feed(app)) do out[i] = p end
  table.sort(out, function(x, y) return (x.t or 0) > (y.t or 0) end)
  return out
end
local function mayPost(src, app, text)
  local jobs = Config.PostJobs[app]
  if jobs and #jobs > 0 then local j = Bridge.job(src); local okJob = false; for _, n in ipairs(jobs) do if n == j then okJob = true end end if not okJob then return false end end
  if Config.Hooks.canPost and Config.Hooks.canPost(src, app, text) == false then return false end
  return true
end

H['feed.list'] = function(src, a) return { ok = true, posts = sortedFeed(tostring(a.app)), me = author(src) } end
H['feed.post'] = function(src, a)
  local app = tostring(a.app)
  local text = clampText(a.text, Config.Limits.textLength)
  local photo = cleanPhoto(a.photo)
  if text == '' and not photo and not (type(a.extra) == 'table' and a.extra.title) then return { ok = false, error = 'Leerer Beitrag.' } end
  if not mayPost(src, app, text) then return { ok = false, error = 'Nur bestimmte Berufe dürfen hier posten.' } end
  local extra = {}
  if type(a.extra) == 'table' then for k, v in pairs(a.extra) do if type(k) == 'string' and #k < 20 then extra[k] = type(v) == 'number' and v or clampText(v, 120) end end end
  local p = { id = Store_uid(), author = author(src), text = text, photo = photo, t = Store_now(), likes = {}, comments = {}, extra = extra, score = 0 }
  local list = feed(app); list[#list + 1] = p; Store_cap(list, Config.Limits.postsPerApp); Store_dirty()
  pushAll({ kind = 'feed', app = app })
  return { ok = true, post = p }
end
H['feed.like'] = function(src, a)
  local p = findPost(tostring(a.app), a.id); if not p then return { ok = false } end
  local h = author(src).handle; local idx
  for i, v in ipairs(p.likes) do if v == h then idx = i end end
  if idx then table.remove(p.likes, idx) else p.likes[#p.likes + 1] = h
    local owner = srcByNumber(p.author.number); if owner and owner ~= src then push(owner, { kind = 'like', app = a.app, name = author(src).name }) end end
  Store_dirty(); return { ok = true, likes = p.likes }
end
H['feed.vote'] = function(src, a)
  local p = findPost(tostring(a.app), a.id); if not p then return { ok = false } end
  p.votes = p.votes or {}; p.votes[author(src).handle] = math.max(-1, math.min(1, tonumber(a.dir) or 0))
  local s = 0; for _, v in pairs(p.votes) do s = s + v end; p.score = s
  Store_dirty(); return { ok = true, score = s }
end
H['feed.comment'] = function(src, a)
  local p = findPost(tostring(a.app), a.id); if not p then return { ok = false } end
  local text = clampText(a.text, 300); if text == '' then return { ok = false } end
  local c = { id = Store_uid(), author = author(src), text = text, t = Store_now() }
  p.comments[#p.comments + 1] = c; Store_cap(p.comments, 100); Store_dirty()
  local owner = srcByNumber(p.author.number); if owner and owner ~= src then push(owner, { kind = 'comment', app = a.app, name = c.author.name, text = text }) end
  return { ok = true, comment = c }
end
H['feed.delete'] = function(src, a)
  local list, h = feed(tostring(a.app)), author(src).handle
  for i, p in ipairs(list) do if p.id == a.id and p.author.handle == h then table.remove(list, i); Store_dirty(); break end end
  return { ok = true }
end

-- Chat channels -------------------------------------------------------------
H['chan.list'] = function(src, a) local k = tostring(a.app) .. ':' .. tostring(a.ch); return { ok = true, msgs = DB.channels[k] or {}, me = author(src) } end
H['chan.send'] = function(src, a)
  local k = tostring(a.app) .. ':' .. clampText(a.ch, 32)
  local text = clampText(a.text, 500); if text == '' then return { ok = false } end
  local au = author(src)
  if a.anon then au = { handle = 'anon-' .. (tonumber(digits(au.number)) or 0) % 997, name = 'Anonym' } end
  local m = { id = Store_uid(), author = au, text = text, t = Store_now() }
  DB.channels[k] = DB.channels[k] or {}; table.insert(DB.channels[k], m); Store_cap(DB.channels[k], Config.Limits.messagesPerChan); Store_dirty()
  pushAll({ kind = 'chan', app = a.app, ch = a.ch, text = text, notify = true, silent = true })
  m.mine = true
  return { ok = true, msg = m }
end

-- Mail ------------------------------------------------------------------------
local function mailAddress(src) return author(src).handle .. '@zmail.ls' end
H['mail.list'] = function(src)
  local me, addr = author(src), mailAddress(src)
  local inbox, sent = {}, {}
  for _, m in ipairs(DB.mail) do
    if m.to == addr or digits(m.to) == digits(me.number) and #digits(m.to) > 0 then inbox[#inbox + 1] = m end
    if m.fromNumber == me.number then sent[#sent + 1] = m end
  end
  return { ok = true, inbox = inbox, sent = sent }
end
H['mail.send'] = function(src, a)
  if not a.to or not a.subject or a.subject == '' then return { ok = false, error = 'Empfänger und Betreff fehlen.' } end
  local me = author(src)
  local m = { id = Store_uid(), from = mailAddress(src), fromNumber = me.number, to = clampText(a.to, 60), subject = clampText(a.subject, 80), body = clampText(a.body, 4000), t = Store_now(), read = false }
  table.insert(DB.mail, m); Store_cap(DB.mail, 5000); Store_dirty()
  -- Notify an online recipient (by handle@zmail.ls or number).
  local handle = tostring(a.to):match('^([%w_.]+)@')
  for s, p in pairs(Players) do local prof = DB.profiles[p.id]; if (handle and prof.handle == handle) or digits(p.number) == digits(a.to) then push(s, { kind = 'mail', from = m.from, subject = m.subject }) end end
  return { ok = true }
end
H['mail.read'] = function(_, a) for _, m in ipairs(DB.mail) do if m.id == a.id then m.read = true end end Store_dirty(); return { ok = true } end
H['mail.delete'] = function(src, a) local addr = mailAddress(src); for i, m in ipairs(DB.mail) do if m.id == a.id and (m.to == addr or m.fromNumber == author(src).number) then table.remove(DB.mail, i); break end end Store_dirty(); return { ok = true } end

-- Broker ------------------------------------------------------------------------
local function portfolio(src) local id = load(src).id; DB.portfolio[id] = DB.portfolio[id] or { holdings = {}, orders = {} }; return DB.portfolio[id] end
H['broker.portfolio'] = function(src) local pf = portfolio(src); return { ok = true, holdings = pf.holdings, orders = pf.orders, cash = Bridge.getBank(src) } end
H['broker.trade'] = function(src, a)
  local m = Market.bySym[tostring(a.sym)]; local qty = tonumber(a.qty)
  if not m or not qty or qty <= 0 or qty ~= qty then return { ok = false, error = 'Ungültige Order.' } end
  qty = math.floor(qty * 10000) / 10000
  local cost = math.floor(m.px * qty * 100 + 0.5) / 100
  if cost > Config.Market.maxOrder then return { ok = false, error = 'Order zu groß.' } end
  local pf = portfolio(src); local h = pf.holdings[m.sym] or { qty = 0, avg = 0 }
  if a.side == 'buy' then
    if Bridge.name ~= 'standalone' then
      if (Bridge.getBank(src) or 0) < cost + Config.Market.fee then return { ok = false, error = 'Nicht genug Guthaben.' } end
      if not Bridge.removeBank(src, cost + Config.Market.fee, 'zurex-trade') then return { ok = false, error = 'Abbuchung fehlgeschlagen.' } end
      Bridge.logTransaction(src, -(cost + Config.Market.fee), ('Kauf %s %s'):format(qty, m.sym))
    end
    h.avg = (h.avg * h.qty + cost) / (h.qty + qty); h.qty = h.qty + qty
  else
    if h.qty < qty - 1e-9 then return { ok = false, error = 'Nicht genug Stück im Depot.' } end
    if Bridge.name ~= 'standalone' then Bridge.addBank(src, math.max(0, cost - Config.Market.fee), 'zurex-trade'); Bridge.logTransaction(src, cost - Config.Market.fee, ('Verkauf %s %s'):format(qty, m.sym)) end
    h.qty = h.qty - qty; if h.qty < 1e-9 then h.qty, h.avg = 0, 0 end
  end
  pf.holdings[m.sym] = h.qty > 0 and h or nil
  table.insert(pf.orders, 1, { id = Store_uid(), sym = m.sym, qty = qty, side = a.side, px = m.px, t = Store_now() })
  while #pf.orders > 100 do table.remove(pf.orders) end
  Store_dirty()
  return { ok = true, px = m.px, balance = Bridge.getBank(src) }
end

-- Ghost -------------------------------------------------------------------------
H['ghost.inbox'] = function(src)
  local me = author(src); local snaps = {}
  for _, s in ipairs(DB.ghost) do if digits(s.to) == digits(me.number) then snaps[#snaps + 1] = s end end
  local stories, cutoff = {}, Store_now() - 24 * 3600 * 1000
  for i = #DB.stories, 1, -1 do local s = DB.stories[i]; if s.t > cutoff then stories[#stories + 1] = s else table.remove(DB.stories, i) end end
  return { ok = true, snaps = snaps, stories = stories }
end
H['ghost.send'] = function(src, a)
  local me, photo = author(src), cleanPhoto(a.photo)
  if not photo then return { ok = false, error = 'Kein Snap.' } end
  if a.story then table.insert(DB.stories, { id = Store_uid(), author = me, photo = photo, caption = clampText(a.caption, 80), t = Store_now() }); Store_dirty(); return { ok = true } end
  if type(a.to) ~= 'table' or #a.to == 0 then return { ok = false, error = 'Wähle Empfänger.' } end
  for i = 1, math.min(#a.to, 30) do
    local to = tostring(a.to[i])
    table.insert(DB.ghost, { id = Store_uid(), from = me, to = to, photo = photo, caption = clampText(a.caption, 80), t = Store_now() })
    local t = srcByNumber(to); if t then push(t, { kind = 'ghost', name = me.name }) end
  end
  Store_cap(DB.ghost, 3000); Store_dirty()
  return { ok = true, sent = #a.to }
end
H['ghost.open'] = function(src, a)
  local me = author(src)
  for i, s in ipairs(DB.ghost) do if s.id == a.id and digits(s.to) == digits(me.number) then table.remove(DB.ghost, i); break end end
  Store_dirty(); return { ok = true }
end

-- Services / dispatch -------------------------------------------------------------
local dispatchSeq = 1000
H['dispatch.send'] = function(src, a)
  local svc = Config.Services[a.service]; if not svc then return { ok = false, error = 'Dienst unbekannt.' } end
  dispatchSeq = dispatchSeq + 1
  local me = author(src)
  local data = { kind = 'dispatch', service = a.service, ref = ('Z-%d'):format(dispatchSeq), reason = clampText(a.reason, 40), text = clampText(a.text, 300),
    pos = type(a.pos) == 'table' and { x = tonumber(a.pos.x), y = tonumber(a.pos.y) } or nil, street = clampText(a.street, 60),
    name = a.anon and 'Anonym' or me.name, number = a.anon and '' or me.number, from = src }
  local units = 0
  for s in pairs(Players) do
    local job, duty = Bridge.job(s)
    local match = false
    for _, j in ipairs(svc.jobs) do if j == job then match = true end end
    if Bridge.name == 'standalone' then match = IsPlayerAceAllowed(s, Config.ServiceAce .. a.service) end
    if match and (duty or not svc.onDutyOnly) then units = units + 1; push(s, data) end
  end
  if Config.Hooks.onDispatch then pcall(Config.Hooks.onDispatch, src, a.service, data) end
  TriggerEvent('zurex-phone:dispatch', src, a.service, data) -- for dispatch scripts listening server-side
  TriggerClientEvent('zurex-phone:client:dispatchSent', src, a.service, data)
  return { ok = true, ref = data.ref, units = units }
end
H['dispatch.take'] = function(src, a)
  local me = author(src)
  for s in pairs(Players) do if s ~= src then push(s, { kind = 'dispatch:status', ref = a.ref, status = ('Übernommen von %s'):format(me.name), silent = true }) end end
  return { ok = true }
end

-- Shops -----------------------------------------------------------------------------
H['shop.items'] = function(_, a) return { ok = true, items = Config.Shops[tostring(a.app)] or {} } end
H['shop.buy'] = function(src, a)
  local item; for _, it in ipairs(Config.Shops[tostring(a.app)] or {}) do if it.name == a.item then item = it end end
  if not item then return { ok = false, error = 'Artikel nicht gefunden.' } end
  local qty = math.max(1, math.min(50, math.floor(tonumber(a.qty) or 1)))
  local price = item.price * qty
  if Config.Hooks.onPurchase and Config.Hooks.onPurchase(src, a.app, item.name, qty, price) == false then return { ok = false, error = 'Kauf abgelehnt.' } end
  if Bridge.name ~= 'standalone' then
    if (Bridge.getBank(src) or 0) < price then return { ok = false, error = 'Nicht genug Guthaben.' } end
    if not Bridge.removeBank(src, price, 'zurex-shop') then return { ok = false, error = 'Zahlung fehlgeschlagen.' } end
    if not Bridge.addItem(src, item.name, qty) then Bridge.addBank(src, price, 'zurex-refund'); return { ok = false, error = 'Kein Platz im Inventar.' } end
    Bridge.logTransaction(src, -price, ('%dx %s'):format(qty, item.label))
  end
  return { ok = true, balance = Bridge.getBank(src) }
end

-- Invoices --------------------------------------------------------------------------
H['invoice.list'] = function(src)
  local me = author(src); local open, sent, paid = {}, {}, {}
  for _, i in ipairs(DB.invoices) do
    if digits(i.to) == digits(me.number) then if i.paid then paid[#paid + 1] = i else open[#open + 1] = i end end
    if i.from.number == me.number then sent[#sent + 1] = i end
  end
  return { ok = true, open = open, sent = sent, paid = paid }
end
H['invoice.send'] = function(src, a)
  local amount = tonumber(a.amount)
  if not a.to or not amount or amount <= 0 or amount > Config.Limits.maxTransfer then return { ok = false, error = 'Empfänger und Betrag angeben.' } end
  local me = author(src)
  local inv = { id = Store_uid(), from = me, to = tostring(a.to), amount = math.floor(amount * 100) / 100, reason = clampText(a.reason, 80), t = Store_now(), paid = false }
  if Config.Integrations.billing == 'okokBilling' and GetResourceState('okokBilling') == 'started' then
    local t = srcByNumber(a.to); if t then TriggerEvent('okokBilling:CreateCustomInvoice', t, inv.amount, inv.reason, 'Zurex', me.name, 'zurex'); return { ok = true } end
  elseif Config.Integrations.billing == 'esx_billing' then
    local t = srcByNumber(a.to); if t then TriggerEvent('esx_billing:sendBill', t, 'society_zurex', inv.reason, inv.amount); return { ok = true } end
  end
  table.insert(DB.invoices, inv); Store_cap(DB.invoices, 5000); Store_dirty()
  local t = srcByNumber(a.to); if t then push(t, { kind = 'invoice', from = me.name, amount = inv.amount }) end
  return { ok = true }
end
H['invoice.pay'] = function(src, a)
  local me = author(src)
  for _, inv in ipairs(DB.invoices) do
    if inv.id == a.id and not inv.paid and digits(inv.to) == digits(me.number) then
      if Bridge.name ~= 'standalone' then
        if (Bridge.getBank(src) or 0) < inv.amount then return { ok = false, error = 'Nicht genug Guthaben.' } end
        if not Bridge.removeBank(src, inv.amount, 'zurex-invoice') then return { ok = false, error = 'Zahlung fehlgeschlagen.' } end
        local payee = srcByNumber(inv.from.number); if payee then Bridge.addBank(payee, inv.amount, 'zurex-invoice'); push(payee, { kind = 'bank:in', amount = inv.amount, from = me.name, note = inv.reason }) end
      end
      inv.paid = true; Store_dirty()
      return { ok = true, balance = Bridge.getBank(src) }
    end
  end
  return { ok = false, error = 'Rechnung nicht offen.' }
end

-- Network: carrier contracts + custom numbers ---------------------------------------
H['carrier.subscribe'] = function(src, a)
  local c; for _, x in ipairs(Config.Network.carriers) do if x.id == a.carrier then c = x end end
  if not c then return { ok = false, error = 'Anbieter unbekannt.' } end
  if Bridge.name ~= 'standalone' then
    if (Bridge.getBank(src) or 0) < c.price then return { ok = false, error = 'Nicht genug Guthaben für den ersten Monat.' } end
    if not Bridge.removeBank(src, c.price, 'zurex-carrier') then return { ok = false, error = 'Abbuchung fehlgeschlagen.' } end
    Bridge.logTransaction(src, -c.price, c.name .. ' Mobilfunk')
  end
  local prof = DB.profiles[load(src).id]
  prof.carrier = c.id; prof.paidUntil = Store_now() + 30 * 24 * 3600 * 1000; Store_dirty()
  return { ok = true, paidUntil = prof.paidUntil }
end

local function numberRules(raw)
  local N = Config.Network.numbers
  if not N.enabled then return { ok = false, error = 'Wunschnummern sind deaktiviert.' } end
  local d = digits(raw)
  if #d ~= #N.prefix + 4 or d:sub(1, #N.prefix) ~= N.prefix then return { ok = false, error = ('Format: %s-XXXX'):format(N.prefix) } end
  local tail = d:sub(#N.prefix + 1)
  local number = N.prefix .. '-' .. tail
  for _, r in ipairs(N.reserved or {}) do if r == number then return { ok = false, error = 'Diese Nummer ist reserviert.' } end end
  if DB.numbers[number] then return { ok = false, error = 'Diese Nummer ist bereits vergeben.' } end
  local a, b, c, e = tail:sub(1, 1), tail:sub(2, 2), tail:sub(3, 3), tail:sub(4, 4)
  local vip = (a == b and b == c and c == e) or ('0123456789'):find(tail, 1, true) ~= nil or ('9876543210'):find(tail, 1, true) ~= nil or (a == c and b == e) or (a == b and c == e)
  return { ok = true, number = number, vip = vip, price = vip and N.vipPrice or N.price }
end
H['number.check'] = function(_, a) return numberRules(a.number) end
H['number.buy'] = function(src, a)
  local n = numberRules(a.number); if not n.ok then return n end
  if Bridge.name ~= 'standalone' then
    if (Bridge.getBank(src) or 0) < n.price then return { ok = false, error = 'Nicht genug Guthaben.' } end
    if not Bridge.removeBank(src, n.price, 'zurex-number') then return { ok = false, error = 'Abbuchung fehlgeschlagen.' } end
    Bridge.logTransaction(src, -n.price, 'Wunschnummer ' .. n.number)
  end
  local p = load(src); local prof = DB.profiles[p.id]
  DB.numbers[prof.number] = nil; BySrcNumber[digits(prof.number)] = nil
  prof.customNumber, prof.number, p.number = n.number, n.number, n.number
  DB.numbers[n.number] = p.id; BySrcNumber[digits(n.number)] = src
  Bridge.setNumber(src, n.number)
  Store_dirty()
  return { ok = true, number = n.number, balance = Bridge.getBank(src) }
end

-- Cards + Zurex Pay ----------------------------------------------------------------
local function cardType(id) for _, c in ipairs(Config.Cards) do if c.id == id then return c end end end
local function playerCards(src) local id = load(src).id; DB.cards[id] = DB.cards[id] or {}; return DB.cards[id] end
H['card.list'] = function(src) return { ok = true, cards = playerCards(src) } end
H['card.order'] = function(src, a)
  local t = cardType(a.type); if not t then return { ok = false, error = 'Kartentyp unbekannt.' } end
  for _, c in ipairs(playerCards(src)) do if c.type == t.id then return { ok = false, error = 'Diese Karte hast du schon.' } end end
  if Bridge.name ~= 'standalone' and t.price > 0 then
    if (Bridge.getBank(src) or 0) < t.price then return { ok = false, error = 'Nicht genug Guthaben.' } end
    if not Bridge.removeBank(src, t.price, 'zurex-card') then return { ok = false, error = 'Abbuchung fehlgeschlagen.' } end
    Bridge.logTransaction(src, -t.price, 'Karte ' .. t.name)
  end
  local card = { id = Store_uid(), type = t.id, last4 = tostring(math.random(1000, 9999)), exp = os.date('%m/') .. tostring((tonumber(os.date('%y')) or 26) + 4), frozen = false, isDefault = false }
  table.insert(playerCards(src), card); Store_dirty()
  return { ok = true, card = card, balance = Bridge.getBank(src) }
end
-- The phone owns card state (freeze/default); the server keeps a copy so it survives reinstalls.
H['card.sync'] = function(src, a)
  if type(a.cards) ~= 'table' then return { ok = false } end
  local id, clean = load(src).id, {}
  for i = 1, math.min(#a.cards, 12) do
    local c = a.cards[i]
    if type(c) == 'table' and cardType(c.type) then clean[#clean + 1] = { id = tostring(c.id), type = c.type, last4 = tostring(c.last4):sub(1, 4), exp = tostring(c.exp):sub(1, 5), frozen = c.frozen == true, isDefault = c.isDefault == true } end
  end
  DB.cards[id] = clean; Store_dirty(); return { ok = true }
end

local PayRequests, paySeq = {}, 0
H['pay.confirm'] = function(src, a)
  local req = PayRequests[a.ref]
  if not req or req.src ~= src then return { ok = false, error = 'Zahlung abgelaufen.' } end
  PayRequests[a.ref] = nil
  if not a.ok then pcall(req.cb, false); return { ok = true } end
  local card
  for _, c in ipairs(playerCards(src)) do if c.id == a.card then card = c end end
  local t = cardType(card and card.type or a.cardType or 'debit') or Config.Cards[1]
  if card and card.frozen then pcall(req.cb, false); return { ok = false, error = 'Karte gesperrt.' } end
  if req.amount > t.limit then pcall(req.cb, false); return { ok = false, error = 'Kartenlimit überschritten.' } end
  local cashback = math.floor(req.amount * (t.cashback or 0)) / 100
  if Bridge.name ~= 'standalone' then
    if (Bridge.getBank(src) or 0) < req.amount then pcall(req.cb, false); return { ok = false, error = 'Nicht genug Guthaben.' } end
    if not Bridge.removeBank(src, req.amount, 'zurex-pay') then pcall(req.cb, false); return { ok = false, error = 'Zahlung abgelehnt.' } end
    Bridge.logTransaction(src, -req.amount, 'Zurex Pay · ' .. req.merchant)
    if cashback > 0 then Bridge.addBank(src, cashback, 'zurex-cashback') end
  end
  pcall(req.cb, true)
  return { ok = true, balance = Bridge.getBank(src), cashback = cashback }
end

--- Ask a player to pay. cb(paid) is called exactly once: confirmed, declined or timed out.
local function requestPayment(src, amount, merchant, cb, desc)
  amount = math.floor((tonumber(amount) or 0) * 100 + 0.5) / 100
  cb = cb or function() end
  if amount <= 0 or not GetPlayerName(src) then return cb(false) end
  paySeq = paySeq + 1
  local ref = ('pay-%d-%d'):format(src, paySeq)
  PayRequests[ref] = { src = src, amount = amount, merchant = tostring(merchant or 'Zahlung'), cb = cb }
  if Config.Pay.openPhone then TriggerClientEvent('zurex-phone:client:payOpen', src) end
  push(src, { kind = 'pay:request', ref = ref, amount = amount, merchant = tostring(merchant or 'Zahlung'), desc = desc })
  SetTimeout(Config.Pay.timeout * 1000, function() local r = PayRequests[ref]; if r then PayRequests[ref] = nil; pcall(r.cb, false) end end)
  return ref
end
exports('RequestPayment', requestPayment)

--------------------------------------------------------------------------- exports
exports('RegisterHandler', function(op, fn) External[op] = fn end)
exports('On', function(op, fn) Listeners[op] = Listeners[op] or {}; table.insert(Listeners[op], fn) end)
exports('Notify', function(src, title, text, app) push(src, { kind = 'notify', app = app or 'messages', title = title, text = text }) end)
exports('Push', function(src, app, data) data = data or {}; data.kind = data.kind or 'app'; data.app = app; push(src, data) end)
exports('SendSMS', function(fromNumber, toNumber, text, fromName)
  local t = srcByNumber(toNumber); local msg = { kind = 'sms', from = tostring(fromNumber), name = fromName or tostring(fromNumber), text = clampText(text, 500) }
  if t then push(t, msg) else local k = digits(toNumber); DB.sms[k] = DB.sms[k] or {}; table.insert(DB.sms[k], msg); Store_dirty() end
end)
exports('GetNumber', function(src) return load(src).number end)
exports('GetSourceByNumber', srcByNumber)
exports('SendMail', function(to, from, subject, body)
  table.insert(DB.mail, { id = Store_uid(), from = from, to = to, subject = subject, body = body, t = Store_now(), read = false }); Store_dirty()
  for s, p in pairs(Players) do local prof = DB.profiles[p.id]; if to == prof.handle .. '@zmail.ls' or digits(to) == digits(p.number) then push(s, { kind = 'mail', from = from, subject = subject }) end end
end)
exports('AddApp', function(def) Config.ExternalApps[#Config.ExternalApps + 1] = def; TriggerClientEvent('zurex-phone:client:addApp', -1, def) end)
exports('PostToApp', function(app, authorName, text, photoUrl)
  local list = feed(app); list[#list + 1] = { id = Store_uid(), author = { handle = authorName:lower():gsub('%s', '.'), name = authorName }, text = clampText(text, Config.Limits.textLength), photo = photoUrl and { url = photoUrl } or nil, t = Store_now(), likes = {}, comments = {}, extra = {}, score = 0 }
  Store_dirty(); pushAll({ kind = 'feed', app = app })
end)

-- Client asks for the config payload once the NUI is ready.
RegisterNetEvent('zurex-phone:server:config', function()
  TriggerClientEvent('zurex-phone:client:config', source, {
    ui = Config.UI, apps = Config.Apps, casino = Config.Casino, places = Config.Places, docs = Config.Docs, externalApps = Config.ExternalApps,
    cards = Config.Cards,
    network = { carriers = Config.Network.carriers, wifi = Config.Network.wifi, numbers = Config.Network.numbers, defaultCarrier = Config.Network.defaultCarrier },
  })
end)
