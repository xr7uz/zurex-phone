--[[ Market: authoritative price simulation shared by every player (Tradr, Coinz, Chartview, Märkte). ]]
Market = { list = {}, bySym = {} }

local function rnd() return math.random() end

CreateThread(function()
  if not Config.Market.enabled then return end
  for _, d in ipairs(Config.Market.instruments) do
    local sym, name, kind, px, dp, vol = table.unpack(d)
    local candles, p = {}, px
    -- Warm-up history: 120 candles so charts have something to show right away.
    for i = 1, 120 do
      local o = p
      local c = o * (1 + (rnd() - 0.495) * vol * 4)
      candles[i] = { o = o, c = c, h = math.max(o, c) * (1 + rnd() * vol), l = math.min(o, c) * (1 - rnd() * vol), n = 5, t = (os.time() - (120 - i) * 10) * 1000 }
      p = c
    end
    local m = { sym = sym, name = name, kind = kind, dp = dp, vol = vol, px = p, open = candles[60].c, candles = candles }
    Market.list[#Market.list + 1] = m
    Market.bySym[sym] = m
  end
  while true do
    Wait(Config.Market.tick)
    local out = {}
    for i, m in ipairs(Market.list) do
      m.px = math.max(m.px * (1 + (rnd() - 0.495) * m.vol), 10 ^ -m.dp)
      local c = m.candles[#m.candles]
      if c.n >= 5 then
        m.candles[#m.candles + 1] = { o = c.c, h = m.px, l = m.px, c = m.px, n = 1, t = os.time() * 1000 }
        if #m.candles > 240 then table.remove(m.candles, 1) end
      else
        c.h = math.max(c.h, m.px); c.l = math.min(c.l, m.px); c.c = m.px; c.n = c.n + 1
      end
      out[i] = { sym = m.sym, px = m.px }
    end
    TriggerClientEvent('zurex-phone:client:market', -1, out)
  end
end)

function Market.snapshot()
  local out = {}
  for i, m in ipairs(Market.list) do
    local hist = {}
    for k, c in ipairs(m.candles) do hist[k] = c.c end
    out[i] = { sym = m.sym, name = m.name, kind = m.kind, dp = m.dp, px = m.px, open = m.open, hist = hist, candles = m.candles }
  end
  return out
end
