--[[
  ZUREX PHONE · config.lua
  Everything here can be changed without touching code. Restart the resource after edits.
]]
Config = {}

---------------------------------------------------------------------------
-- Core
---------------------------------------------------------------------------
Config.Framework   = 'auto'   -- 'auto' | 'qbx' | 'qb' | 'esx' | 'standalone'
Config.Locale      = 'de'
Config.Debug       = false

Config.OpenKey     = 'F1'     -- players can rebind under Settings > Key Bindings > FiveM
Config.Command     = 'phone'
Config.Animation   = true     -- phone-in-hand animation + prop
Config.PhoneProp   = 'prop_npc_phone_02'

-- Phone numbers: use the framework's number if it has one, otherwise generate one.
Config.NumberFormat = '555-####'   -- # = random digit (only used when the framework has none)

---------------------------------------------------------------------------
-- Models & items: the item a player carries decides the phone model.
---------------------------------------------------------------------------
Config.RequireItem  = false        -- true: a phone item is needed to open the phone (QBCore/ESX/ox)
Config.DefaultModel = 'ultra'      -- used when RequireItem = false or standalone
Config.Items = {                   -- item name -> model ('ultra' | 'pro' | 'base'), highest wins
  phone_ultra = 'ultra',
  phone_pro   = 'pro',
  phone       = 'base',
}
Config.UsableItems = true          -- register the items as usable (opens the phone)

---------------------------------------------------------------------------
-- Look & feel (players can still change their own settings on the phone)
---------------------------------------------------------------------------
Config.UI = {
  carrier          = 'ZRX',
  defaultAccent    = 'pink',       -- 'pink' | 'cyan' | 'violet' | 'amber'
  defaultWallpaper = 'grid',       -- 'grid' | 'glow' | 'aurora' | 'zebra' | 'plain'
  scale            = 0.8,          -- max height share of the screen
}

---------------------------------------------------------------------------
-- Apps
---------------------------------------------------------------------------
Config.Apps = {
  allInstalled = false,            -- true: every app is on the phone from the start
  -- Apps new players have on the home screen (system apps are always installed).
  preinstalled = {
    'flick', 'reelz', 'ghost', 'chirp', 'whisp', 'bazar', 'tradr', 'chartview', 'rechnungen',
    'notruf', 'rettung', 'pannenhilfe', 'ryde', 'p_tanken', 'p_kliniken', 'p_werkstatt',
    'kart', 'foodz', 'wave', 'zurexnews', 'regeln', 'lsquiz', 'taschenlampe', 'kompass',
    'todo', 'sketch', 'snake', 'g2048', 'flappy', 'blocks', 'minesweeper', 'tictactoe', 'slots', 'blackjack',
  },
  -- Remove apps completely (store, home, library), e.g. { 'schwarzmarkt', 'darkchat', 'roulette' }
  disabled = {},
  -- Rename / recolour / reconfigure single apps, e.g.:
  -- flick = { name = 'Instapic', color = '#ff5c8a' }
  overrides = {},
}

---------------------------------------------------------------------------
-- Integrations: connect apps to other scripts. 'auto' detects running resources.
---------------------------------------------------------------------------
Config.Integrations = {
  banking    = 'framework',  -- 'framework' | 'okokBanking' | 'qb-banking' | 'Renewed-Banking' | 'custom'
  billing    = 'internal',   -- 'internal' | 'okokBilling' | 'esx_billing' | 'custom'
  dispatch   = 'internal',   -- 'internal' | 'ps-dispatch' | 'cd_dispatch' | 'custom' (internal always runs too)
  inventory  = 'auto',       -- 'auto' | 'ox_inventory' | 'qb-inventory' | 'qs-inventory' | 'framework'
  voice      = 'auto',       -- 'auto' | 'pma-voice' | 'saltychat' | 'none'
  screenshot = 'auto',       -- 'auto' | 'screenshot-basic' | 'none'
}

-- Photos: real in-game screenshots via screenshot-basic are uploaded here.
-- Without an upload URL the camera uses the built-in generated scenes.
Config.Camera = {
  uploadUrl   = '',          -- e.g. a Discord webhook or https://api.fivemanage.com/api/image
  uploadField = 'files[]',   -- 'files[]' for Discord, 'file' for most image hosts
  headers     = {},          -- e.g. { Authorization = 'YOUR_API_KEY' }
  selfieCam   = true,        -- use the GTA selfie camera in "Selfie" mode
}

-- Custom hooks: called by the phone, return a value to override the default behaviour.
-- Every hook is optional. 'src' is the player server id.
Config.Hooks = {
  -- onTransfer = function(src, targetSrc, amount, note) return true end,
  -- onDispatch = function(src, service, data) end,          -- extra dispatch scripts
  -- onPurchase = function(src, app, item, qty, price) return true end,
  -- canPost    = function(src, app, text) return true end,  -- e.g. only journalists may post in Zurex News
}

---------------------------------------------------------------------------
-- Services: which jobs receive calls from the service apps.
---------------------------------------------------------------------------
Config.Services = {
  police     = { jobs = { 'police', 'sheriff', 'lspd', 'bcso' }, onDutyOnly = true },
  ambulance  = { jobs = { 'ambulance', 'ems', 'doctor' },         onDutyOnly = true },
  fire       = { jobs = { 'fire', 'firefighter' },                onDutyOnly = true },
  mechanic   = { jobs = { 'mechanic', 'bennys', 'lscustoms' },    onDutyOnly = true },
  taxi       = { jobs = { 'taxi', 'uber' },                       onDutyOnly = false },
  tow        = { jobs = { 'tow', 'mechanic' },                    onDutyOnly = true },
  lawyer     = { jobs = { 'lawyer' },                             onDutyOnly = false },
  judge      = { jobs = { 'judge' },                              onDutyOnly = false },
  realestate = { jobs = { 'realestate' },                         onDutyOnly = false },
  reporter   = { jobs = { 'reporter', 'weazel' },                 onDutyOnly = false },
}
-- Standalone: players with this ACE receive the service, e.g. add_ace group.police zurex.service.police allow
Config.ServiceAce = 'zurex.service.'

-- Apps that only certain jobs may post in (others can read). Empty = everyone.
Config.PostJobs = {
  zurexnews = { 'reporter', 'weazel' },
}

---------------------------------------------------------------------------
-- Shops (item names must exist in your inventory)
---------------------------------------------------------------------------
Config.Shops = {
  kart = {
    { name = 'phone', label = 'Zurex XR7', price = 899, cat = 'Elektronik', icon = 'phone' },
    { name = 'phone_pro', label = 'Zurex XR7 Pro', price = 1399, cat = 'Elektronik', icon = 'phone' },
    { name = 'phone_ultra', label = 'Zurex XR7 Ultra', price = 1899, cat = 'Elektronik', icon = 'phone' },
    { name = 'radio', label = 'Funkgerät', price = 250, cat = 'Elektronik', icon = 'radio' },
    { name = 'repairkit', label = 'Reparaturkit', price = 350, cat = 'Auto', icon = 'wrench' },
    { name = 'cleaningkit', label = 'Reinigungsset', price = 80, cat = 'Auto', icon = 'drop' },
    { name = 'bandage', label = 'Verband', price = 25, cat = 'Gesundheit', icon = 'cross' },
    { name = 'water_bottle', label = 'Wasser', price = 3, cat = 'Haushalt', icon = 'drop' },
  },
  foodz = {
    { name = 'sandwich', label = 'Club Sandwich', price = 9, cat = 'Burger Shot', icon = 'food' },
    { name = 'tosti', label = 'Toast Hawaii', price = 7, cat = 'Burger Shot', icon = 'food' },
    { name = 'twerks_candy', label = 'Twerks Riegel', price = 3, cat = 'Snacks', icon = 'gift' },
    { name = 'kurkakola', label = 'eCola', price = 4, cat = 'Getränke', icon = 'glass' },
    { name = 'coffee', label = 'Bean Machine Kaffee', price = 5, cat = 'Getränke', icon = 'coffee' },
    { name = 'water_bottle', label = 'Wasser', price = 2, cat = 'Getränke', icon = 'drop' },
  },
  techstore = {
    { name = 'phone', label = 'Zurex XR7', price = 899, cat = 'Smartphones', icon = 'phone' },
    { name = 'radio', label = 'Funkgerät Pro', price = 320, cat = 'Funk', icon = 'radio' },
    { name = 'laptop', label = 'Laptop', price = 1400, cat = 'Computer', icon = 'cpu' },
    { name = 'electronickit', label = 'Elektronik-Kit', price = 220, cat = 'Bastler', icon = 'bolt' },
  },
  blumen    = { { name = 'flowers_rose', label = 'Rote Rosen', price = 39, cat = 'Sträuße', icon = 'leaf' }, { name = 'teddy', label = 'Teddybär', price = 19, cat = 'Geschenke', icon = 'gift' } },
  apotheke  = { { name = 'bandage', label = 'Verband', price = 25, cat = 'Erste Hilfe', icon = 'cross' }, { name = 'painkillers', label = 'Schmerztabletten', price = 45, cat = 'Medikamente', icon = 'cross' }, { name = 'firstaid', label = 'Erste-Hilfe-Kasten', price = 150, cat = 'Erste Hilfe', icon = 'cross' } },
  baumarkt  = { { name = 'screwdriverset', label = 'Werkzeugset', price = 120, cat = 'Werkzeug', icon = 'wrench' }, { name = 'repairkit', label = 'Reparaturkit', price = 350, cat = 'Werkzeug', icon = 'wrench' }, { name = 'jerry_can', label = 'Benzinkanister', price = 75, cat = 'Auto', icon = 'fuel' } },
  kiosk     = { { name = 'water_bottle', label = 'Wasser', price = 2, cat = 'Getränke', icon = 'drop' }, { name = 'beer', label = 'Pisswasser', price = 6, cat = 'Getränke', icon = 'glass' }, { name = 'sandwich', label = 'Sandwich', price = 8, cat = 'Snacks', icon = 'food' }, { name = 'lighter', label = 'Feuerzeug', price = 3, cat = 'Sonstiges', icon = 'fire' } },
  tuning    = { { name = 'repairkit', label = 'Reparaturkit', price = 350, cat = 'Wartung', icon = 'wrench' }, { name = 'nitrous', label = 'Nitro-Flasche', price = 2500, cat = 'Leistung', icon = 'bolt' }, { name = 'harness', label = 'Renngurt', price = 1800, cat = 'Sicherheit', icon = 'shield' } },
}

---------------------------------------------------------------------------
-- Market (Tradr, Coinz, Fondz, Rohstoffe, Chartview, Märkte). Prices are simulated server-side.
---------------------------------------------------------------------------
Config.Market = {
  enabled  = true,
  tick     = 3000,   -- ms between price updates
  fee      = 1.0,    -- order fee in $
  maxOrder = 1000000,
  instruments = {
    -- sym, name, kind ('stock'|'crypto'|'fx'|'commodity'|'etf'), start price, decimals, volatility per tick
    { 'ZRX', 'Zurex Technologies', 'stock', 42.10, 2, 0.004 }, { 'MZB', 'Maze Bank', 'stock', 118.40, 2, 0.002 },
    { 'FLC', 'Fleeca Group', 'stock', 64.25, 2, 0.0025 }, { 'LFI', 'Lifeinvader', 'stock', 211.90, 2, 0.004 },
    { 'BGS', 'Burger Shot', 'stock', 23.80, 2, 0.003 }, { 'CLK', "Cluckin' Bell", 'stock', 17.45, 2, 0.003 },
    { 'PSW', 'Pisswasser Brewing', 'stock', 31.60, 2, 0.002 }, { 'GOP', 'GoPostal Logistics', 'stock', 48.70, 2, 0.002 },
    { 'WZL', 'Weazel Media', 'stock', 56.10, 2, 0.003 }, { 'AMU', 'Ammu-Nation', 'stock', 88.30, 2, 0.003 },
    { 'VNL', 'Vinewood Labs', 'stock', 132.50, 2, 0.005 }, { 'MRS', 'Merryweather Sec.', 'stock', 97.20, 2, 0.0035 },
    { 'BTC', 'Bitcoin', 'crypto', 67420, 0, 0.003 }, { 'ETH', 'Ethereum', 'crypto', 3480, 1, 0.0035 },
    { 'SOL', 'Solana', 'crypto', 168.4, 2, 0.005 }, { 'DOGE', 'Dogecoin', 'crypto', 0.162, 4, 0.006 },
    { 'ZXC', 'Zurex Coin', 'crypto', 4.21, 3, 0.008 }, { 'XRP', 'XRP', 'crypto', 0.58, 4, 0.005 },
    { 'EURUSD', 'Euro / US-Dollar', 'fx', 1.0842, 4, 0.0006 }, { 'GBPJPY', 'Pfund / Yen', 'fx', 191.42, 2, 0.0009 },
    { 'USDJPY', 'US-Dollar / Yen', 'fx', 151.30, 2, 0.0007 }, { 'EURGBP', 'Euro / Pfund', 'fx', 0.8521, 4, 0.0005 },
    { 'XAU', 'Gold', 'commodity', 2351.6, 1, 0.0012 }, { 'XAG', 'Silber', 'commodity', 29.84, 2, 0.002 },
    { 'OIL', 'Rohöl WTI', 'commodity', 78.35, 2, 0.002 }, { 'GAS', 'Erdgas', 'commodity', 2.41, 3, 0.004 },
    { 'LS500', 'Los Santos 500', 'etf', 5320.4, 1, 0.0008 }, { 'WORLD', 'MSCI San Andreas World', 'etf', 104.2, 2, 0.0007 },
    { 'TECH', 'Vinewood Tech ETF', 'etf', 61.3, 2, 0.0012 }, { 'DIVI', 'Dividenden Aristokraten', 'etf', 38.9, 2, 0.0006 },
  },
}

---------------------------------------------------------------------------
-- Network: mobile carriers, Wi-Fi hotspots and custom phone numbers
---------------------------------------------------------------------------
Config.Network = {
  defaultCarrier = 'zurex',
  requireSignal  = true,      -- no signal and no Wi-Fi = no calls / SMS
  -- Coverage 0..1 in the city (y < 1000) and Blaine County (y >= 1000). price = per 30 days, charged from the bank.
  carriers = {
    { id = 'magentel',    name = 'Magentel',           short = 'MGTL', color = '#e2007a', price = 49, data = 40, city = 1.0,  county = 0.8,  perks = { '5G+', 'WLAN-Call', 'EU-Roaming' } },
    { id = 'redfone',     name = 'Redfone',            short = 'RDFN', color = '#ef4444', price = 39, data = 25, city = 0.95, county = 0.55, perks = { '5G', 'GigaKombi' } },
    { id = 'bluecell',    name = 'Bluecell',           short = 'BLUE', color = '#3b82f6', price = 19, data = 10, city = 0.8,  county = 0.35, perks = { 'LTE', 'Prepaid' } },
    { id = 'zurex',       name = 'Zurex Mobile',       short = 'ZRX',  color = '#f472b6', price = 29, data = 60, city = 0.95, county = 0.7,  perks = { '5G', 'WLAN-Call', 'Unlimited Social' } },
    { id = 'lifeinvader', name = 'Lifeinvader Mobile', short = 'LIFE', color = '#38bdf8', price = 9,  data = 5,  city = 0.7,  county = 0.25, perks = { 'Werbefinanziert' } },
  },
  -- Hotspots: ssid, x, y, radius in metres, optional password.
  wifi = {
    { ssid = 'BeanMachine_Free', x = -628, y = 239, r = 60 },
    { ssid = 'Bahama-Mamas-VIP', x = -1388, y = -586, r = 70, password = 'mamas2026' },
    { ssid = 'LSIA_Free_WiFi', x = -1037, y = -2738, r = 260 },
    { ssid = 'Pillbox-Guest', x = 298, y = -584, r = 90 },
    { ssid = 'MissionRow-PD', x = 441, y = -982, r = 80, password = 'lspd-intern' },
    { ssid = 'Diamond-Casino', x = 924, y = 46, r = 120 },
    { ssid = 'PinkCage_Motel', x = 326, y = -205, r = 50, password = 'zimmer7' },
    { ssid = 'Legion-Square-Public', x = 195, y = -934, r = 120 },
    { ssid = 'DelPerro-Pier-Free', x = -1850, y = -1230, r = 120 },
    { ssid = 'Sandy-Shores-Airfield', x = 1747, y = 3273, r = 150 },
    { ssid = 'Paleto-Bay-Library', x = -250, y = 6200, r = 80 },
    { ssid = 'Maze-Bank-Tower', x = -75, y = -818, r = 90, password = 'mazebank' },
  },
  -- Custom numbers ("Wunschnummer") bought in Settings > Mobilfunk.
  numbers = {
    enabled  = true,
    prefix   = '555',         -- numbers look like 555-XXXX
    price    = 2500,
    vipPrice = 25000,         -- 7777, 1234, 1212, 1122 …
    reserved = { '555-0100', '555-0911', '555-0112' },
    example  = '555-7777',
    hint     = 'Format 555-XXXX. Schnapszahlen und Folgen gelten als VIP.',
  },
}

---------------------------------------------------------------------------
-- Bank cards + Zurex Pay. price = one-off, fee = per year (info only), cashback in %, limit per 30 days.
---------------------------------------------------------------------------
Config.Cards = {
  { id = 'debit',    name = 'Zurex Debit', design = 'plum',  price = 0,    fee = 0,   cashback = 0,    limit = 5000,   desc = 'Deine Standardkarte. Kostenlos.' },
  { id = 'zebra',    name = 'Zebra Card',  design = 'zebra', price = 250,  fee = 0,   cashback = 0.5,  limit = 10000,  desc = 'Die Signature-Karte mit Zebra-Muster. 0,5 % Cashback.' },
  { id = 'gold',     name = 'Zurex Gold',  design = 'gold',  price = 1500, fee = 120, cashback = 1,    limit = 25000,  desc = 'Gebürstetes Gold, 1 % Cashback, höheres Limit.' },
  { id = 'frost',    name = 'Frost Glass', design = 'frost', price = 900,  fee = 60,  cashback = 0.75, limit = 15000,  desc = 'Transparentes Milchglas. 0,75 % Cashback.' },
  { id = 'black',    name = 'Zurex Black', design = 'black', price = 9500, fee = 900, cashback = 2,    limit = 100000, desc = 'Schwarzes Metall. 2 % Cashback, Concierge.' },
  { id = 'business', name = 'Business',    design = 'teal',  price = 600,  fee = 240, cashback = 1,    limit = 50000,  desc = 'Für Firmen: Rechnungen und Belege an einem Ort.' },
}
-- Other scripts can ask a player to pay with Zurex Pay:
--   exports['zurex-phone']:RequestPayment(src, 24.99, '24/7 Supermarkt', function(paid) ... end, 'Einkauf')
Config.Pay = {
  timeout   = 60,    -- seconds the player has to confirm
  openPhone = true,  -- open the phone automatically when a payment request arrives
}

---------------------------------------------------------------------------
-- Casino (play money only, never touches the bank)
---------------------------------------------------------------------------
Config.Casino = { startChips = 1000, dailyChips = 1000 }

---------------------------------------------------------------------------
-- Limits & storage
---------------------------------------------------------------------------
Config.Storage = {
  file      = 'data/db.json',  -- relative to the resource folder
  saveEvery = 60,              -- seconds; also saved on resource stop
}
Config.Limits = {
  postsPerApp     = 250,
  messagesPerChan = 300,
  mailPerPlayer   = 200,
  textLength      = 1000,
  maxTransfer     = 1000000,
  rateLimitMs     = 400,       -- min time between write actions per player
}

---------------------------------------------------------------------------
-- Optional: override GPS places, docs (rules/laws) and quiz content from here.
-- Leave nil to use the defaults in html/data/docs.js and html/js/engines-city.js.
---------------------------------------------------------------------------
Config.Places = nil   -- e.g. { tanken = { { 'Meine Tanke', 100.0, -200.0 } } }
Config.Docs   = nil   -- e.g. { rules = { tagline = 'Regeln', sections = { { title = '§1', body = '...' } } } }

---------------------------------------------------------------------------
-- Apps from other resources can also be added at runtime: exports['zurex-phone']:AddApp({...})
-- or statically here:
---------------------------------------------------------------------------
Config.ExternalApps = {
  -- { id = 'mygarage', name = 'Garage', icon = 'car', color = '#5eead4', category = 'tools', url = 'nui://my-garage/html/phone.html' },
}
