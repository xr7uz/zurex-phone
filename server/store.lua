--[[
  Store: the phone's server data in one JSON file (no database required).
  DB layout:
    profiles[identifier] = { handle, name, number, avatar, bio }
    numbers[number]      = identifier
    posts[app]           = { post, ... }           (feeds, reels, forum, listings, dating, news)
    channels[app:ch]     = { msg, ... }
    mail                 = { mail, ... }
    sms[number]          = { pending sms for offline players }
    ghost                = { snap, ... }, stories = { ... }
    portfolio[identifier]= { holdings = { SYM = { qty, avg } }, orders = { ... } }
    invoices             = { invoice, ... }
]]
DB = { profiles = {}, numbers = {}, posts = {}, channels = {}, mail = {}, sms = {}, ghost = {}, stories = {}, portfolio = {}, invoices = {}, cards = {} }
local dirty = false
local resource = GetCurrentResourceName()

local function load()
  local raw = LoadResourceFile(resource, Config.Storage.file)
  if raw and #raw > 0 then
    local ok, data = pcall(json.decode, raw)
    if ok and type(data) == 'table' then for k, v in pairs(data) do DB[k] = v end end
  end
  print(('[zurex-phone] storage loaded (%s)'):format(Config.Storage.file))
end

function Store_save(force)
  if not dirty and not force then return end
  SaveResourceFile(resource, Config.Storage.file, json.encode(DB), -1)
  dirty = false
end
function Store_dirty() dirty = true end

load()
CreateThread(function() while true do Wait(Config.Storage.saveEvery * 1000) Store_save() end end)
AddEventHandler('onResourceStop', function(r) if r == resource then Store_save(true) end end)
AddEventHandler('txAdmin:events:serverShuttingDown', function() Store_save(true) end)

-- Helpers
function Store_uid() return ('%x%x'):format(os.time(), math.random(0, 0xFFFFFF)) end
function Store_now() return os.time() * 1000 end
function Store_cap(list, n) while #list > n do table.remove(list, 1) end end
