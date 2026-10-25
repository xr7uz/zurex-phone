--[[
  Bridge: one API over QBCore / Qbox / ESX / standalone, plus banking & inventory adapters.
  Every other server file talks to Bridge only, so new frameworks or scripts are added here.
]]
Bridge = { name = 'standalone' }
local QB, ESX

local function started(res) return GetResourceState(res) == 'started' end

CreateThread(function()
  local want = Config.Framework
  if (want == 'auto' or want == 'qbx') and started('qbx_core') then Bridge.name = 'qbx'
  elseif (want == 'auto' or want == 'qb') and started('qb-core') then QB = exports['qb-core']:GetCoreObject(); Bridge.name = 'qb'
  elseif (want == 'auto' or want == 'esx') and started('es_extended') then ESX = exports['es_extended']:getSharedObject(); Bridge.name = 'esx' end
  print(('[zurex-phone] framework: %s'):format(Bridge.name))
end)

local function qbPlayer(src)
  if Bridge.name == 'qbx' then return exports.qbx_core:GetPlayer(src) end
  if Bridge.name == 'qb' then return QB.Functions.GetPlayer(src) end
end
local function esxPlayer(src) return ESX and ESX.GetPlayerFromId(src) end

--- Stable identity used as the key for everything the phone stores.
function Bridge.identifier(src)
  local p = qbPlayer(src); if p then return p.PlayerData.citizenid end
  local x = esxPlayer(src); if x then return x.identifier end
  return GetPlayerIdentifierByType(src, 'license') or ('src:' .. src)
end

function Bridge.name_of(src)
  local p = qbPlayer(src); if p then return ('%s %s'):format(p.PlayerData.charinfo.firstname, p.PlayerData.charinfo.lastname) end
  local x = esxPlayer(src); if x then return x.getName() end
  return GetPlayerName(src) or ('Spieler ' .. src)
end

function Bridge.frameworkNumber(src)
  local p = qbPlayer(src); if p and p.PlayerData.charinfo and p.PlayerData.charinfo.phone then return tostring(p.PlayerData.charinfo.phone) end
  local x = esxPlayer(src); if x and x.get then local n = x.get('phoneNumber') or x.get('phone_number'); if n then return tostring(n) end end
end

-- Write a bought custom number back into the framework so other scripts see it too.
function Bridge.setNumber(src, number)
  local p = qbPlayer(src)
  if p then local ci = p.PlayerData.charinfo; ci.phone = number; p.Functions.SetPlayerData('charinfo', ci); return end
  local x = esxPlayer(src)
  if x and MySQL then pcall(function() MySQL.update('UPDATE users SET phone_number = ? WHERE identifier = ?', { number, x.identifier }) end) end
end

function Bridge.job(src)
  local p = qbPlayer(src); if p then local j = p.PlayerData.job; return j.name, j.onduty ~= false end
  local x = esxPlayer(src); if x then return x.getJob().name, true end
  return nil, true
end

--------------------------------------------------------------------------- banking
function Bridge.getBank(src)
  local mode = Config.Integrations.banking
  if mode == 'custom' and Config.Hooks.getBank then return Config.Hooks.getBank(src) end
  local p = qbPlayer(src); if p then return p.PlayerData.money.bank end
  local x = esxPlayer(src); if x then return x.getAccount('bank').money end
  return nil -- standalone: the phone keeps a local balance
end
function Bridge.removeBank(src, amount, reason)
  if Config.Integrations.banking == 'custom' and Config.Hooks.removeBank then return Config.Hooks.removeBank(src, amount, reason) end
  local p = qbPlayer(src); if p then return p.Functions.RemoveMoney('bank', amount, reason) end
  local x = esxPlayer(src)
  if x then if x.getAccount('bank').money < amount then return false end x.removeAccountMoney('bank', amount, reason) return true end
  return Bridge.name == 'standalone'
end
function Bridge.addBank(src, amount, reason)
  if Config.Integrations.banking == 'custom' and Config.Hooks.addBank then return Config.Hooks.addBank(src, amount, reason) end
  local p = qbPlayer(src); if p then return p.Functions.AddMoney('bank', amount, reason) end
  local x = esxPlayer(src); if x then x.addAccountMoney('bank', amount, reason) return true end
  return Bridge.name == 'standalone'
end
-- Banking scripts with their own statements get a transaction entry.
function Bridge.logTransaction(src, amount, label)
  if Config.Integrations.banking == 'qb-banking' and started('qb-banking') then
    pcall(function() exports['qb-banking']:CreateBankStatement(src, 'checking', math.abs(amount), label, amount < 0 and 'withdraw' or 'deposit', 'player') end)
  elseif Config.Integrations.banking == 'Renewed-Banking' and started('Renewed-Banking') then
    pcall(function() exports['Renewed-Banking']:handleTransaction(Bridge.identifier(src), 'Zurex Phone', math.abs(amount), label, 'Zurex', Bridge.name_of(src), amount < 0 and 'withdraw' or 'deposit') end)
  elseif Config.Integrations.banking == 'okokBanking' and started('okokBanking') then
    pcall(function() exports.okokBanking:AddTransaction(Bridge.identifier(src), amount < 0 and 'withdraw' or 'deposit', math.abs(amount), label) end)
  end
end

--------------------------------------------------------------------------- inventory
local function inventory()
  local m = Config.Integrations.inventory
  if m ~= 'auto' then return m end
  if started('ox_inventory') then return 'ox_inventory' end
  if started('qs-inventory') then return 'qs-inventory' end
  return 'framework'
end
function Bridge.addItem(src, item, count)
  local inv = inventory()
  if inv == 'ox_inventory' then return exports.ox_inventory:AddItem(src, item, count) end
  if inv == 'qs-inventory' then return exports['qs-inventory']:AddItem(src, item, count) end
  local p = qbPlayer(src)
  if p then local ok = p.Functions.AddItem(item, count); if ok and QB then TriggerClientEvent('inventory:client:ItemBox', src, QB.Shared.Items[item], 'add', count) end return ok end
  local x = esxPlayer(src); if x then if x.canCarryItem and not x.canCarryItem(item, count) then return false end x.addInventoryItem(item, count) return true end
  return true
end
function Bridge.hasItem(src, item)
  local inv = inventory()
  if inv == 'ox_inventory' then return (exports.ox_inventory:Search(src, 'count', item) or 0) > 0 end
  if inv == 'qs-inventory' then return (exports['qs-inventory']:GetItemTotalAmount(src, item) or 0) > 0 end
  local p = qbPlayer(src); if p then return p.Functions.GetItemByName(item) ~= nil end
  local x = esxPlayer(src); if x then local it = x.getInventoryItem(item); return it and it.count > 0 end
  return true
end
function Bridge.registerUsable(item, cb)
  if Bridge.name == 'qb' then QB.Functions.CreateUseableItem(item, function(src) cb(src) end)
  elseif Bridge.name == 'qbx' then exports.qbx_core:CreateUseableItem(item, function(src) cb(src) end)
  elseif Bridge.name == 'esx' then ESX.RegisterUsableItem(item, function(src) cb(src) end) end
end

--------------------------------------------------------------------------- notifications to the game HUD (outside the phone)
function Bridge.gameNotify(src, text)
  TriggerClientEvent('zurex-phone:client:gameNotify', src, text)
end
