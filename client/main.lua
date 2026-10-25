--[[
  Zurex Phone client: open/close, NUI focus, prop + animation, RPC forwarding,
  local "world" data (position, heading, weather), GPS, camera, flashlight and voice calls.
]]
local isOpen, prop, currentModel = false, nil, nil
local pending, reqSeq = {}, 0
local inCamera, flashlightOn = false, false

--------------------------------------------------------------------------- animation
local function playAnim()
  if not Config.Animation then return end
  local ped = PlayerPedId()
  RequestAnimDict('cellphone@')
  local t = GetGameTimer() + 2000
  while not HasAnimDictLoaded('cellphone@') and GetGameTimer() < t do Wait(10) end
  TaskPlayAnim(ped, 'cellphone@', 'cellphone_text_in', 3.0, -1, -1, 50, 0, false, false, false)
  local model = joaat(Config.PhoneProp)
  RequestModel(model)
  while not HasModelLoaded(model) and GetGameTimer() < t do Wait(10) end
  prop = CreateObject(model, 1.0, 1.0, 1.0, true, true, false)
  AttachEntityToEntity(prop, ped, GetPedBoneIndex(ped, 28422), 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, true, true, false, true, 1, true)
  SetModelAsNoLongerNeeded(model)
end
local function stopAnim()
  if prop and DoesEntityExist(prop) then DeleteEntity(prop) end
  prop = nil
  StopAnimTask(PlayerPedId(), 'cellphone@', 'cellphone_text_in', 2.5)
end

--------------------------------------------------------------------------- open / close
local function close()
  if not isOpen then return end
  isOpen = false
  SetNuiFocus(false, false)
  SendNUIMessage({ action = 'close' })
  stopAnim()
end
local function open(forcedItem)
  if isOpen or IsPauseMenuActive() or IsEntityDead(PlayerPedId()) then return end
  TriggerServerEvent('zurex-phone:server:requestOpen', forcedItem)
end

RegisterNetEvent('zurex-phone:client:open', function(data)
  isOpen = true; currentModel = data.model
  data.action = 'open'
  SendNUIMessage(data)
  SetNuiFocus(true, true)
  SetNuiFocusKeepInput(false)
  playAnim()
end)
RegisterNetEvent('zurex-phone:client:useItem', function(item) if isOpen then close() else open(item) end end)

RegisterCommand(Config.Command, function() if isOpen then close() else open() end end, false)
RegisterKeyMapping(Config.Command, 'Zurex Phone öffnen', 'keyboard', Config.OpenKey)

RegisterNUICallback('close', function(_, cb) close(); cb({ ok = true }) end)
RegisterNUICallback('ready', function(_, cb) TriggerServerEvent('zurex-phone:server:config'); cb({ ok = true }) end)
RegisterNetEvent('zurex-phone:client:config', function(cfg) SendNUIMessage({ action = 'config', config = cfg }) end)
RegisterNetEvent('zurex-phone:client:addApp', function(def) SendNUIMessage({ action = 'addApp', app = def }) end)

--------------------------------------------------------------------------- local RPC ops (answered on the client)
local zones = {}
local function worldInfo()
  local ped = PlayerPedId()
  local c = GetEntityCoords(ped)
  local s1 = GetStreetNameAtCoord(c.x, c.y, c.z)
  local zone = GetNameOfZone(c.x, c.y, c.z)
  zones[zone] = zones[zone] or GetLabelText(zone)
  local veh = GetVehiclePedIsIn(ped, false)
  local weathers = { [`CLEAR`] = 'CLEAR', [`EXTRASUNNY`] = 'EXTRASUNNY', [`CLOUDS`] = 'CLOUDS', [`OVERCAST`] = 'OVERCAST', [`RAIN`] = 'RAIN', [`THUNDER`] = 'THUNDER', [`CLEARING`] = 'CLEARING', [`SMOG`] = 'SMOG', [`FOGGY`] = 'FOGGY', [`XMAS`] = 'XMAS', [`SNOW`] = 'SNOW', [`SNOWLIGHT`] = 'SNOWLIGHT', [`BLIZZARD`] = 'BLIZZARD', [`HALLOWEEN`] = 'HALLOWEEN', [`NEUTRAL`] = 'NEUTRAL' }
  return {
    ok = true, pos = { x = c.x, y = c.y, z = c.z }, heading = GetEntityHeading(ped),
    speed = veh ~= 0 and GetEntitySpeed(veh) or GetEntitySpeed(ped), inVehicle = veh ~= 0,
    street = GetStreetNameFromHashKey(s1), zone = zones[zone],
    weather = weathers[GetPrevWeatherTypeHashName()] or 'CLEAR', hour = GetClockHours(), minute = GetClockMinutes(),
  }
end
local Local = {
  ['world.info'] = worldInfo,
  ['gps.set'] = function(a) if a.x and a.y then SetNewWaypoint(a.x + 0.0, a.y + 0.0) end return { ok = true } end,
}

RegisterNUICallback('rpc', function(data, cb)
  local op = data and data.op
  if type(op) ~= 'string' then return cb({ ok = false }) end
  if Local[op] then return cb(Local[op](data.args or {})) end
  reqSeq = reqSeq + 1
  local id = reqSeq
  pending[id] = cb
  TriggerServerEvent('zurex-phone:server:rpc', id, op, data.args or {})
  SetTimeout(8000, function() if pending[id] then pending[id]({ ok = false, error = 'Keine Verbindung.' }); pending[id] = nil end end)
end)
RegisterNetEvent('zurex-phone:client:rpc', function(id, res)
  local cb = pending[id]
  if cb then pending[id] = nil; cb(res) end
end)

--------------------------------------------------------------------------- server pushes
RegisterNetEvent('zurex-phone:client:push', function(data)
  data.action = 'push'
  SendNUIMessage(data)
  -- While the phone is closed, show a short game notification for important events.
  if not isOpen and (data.kind == 'sms' or data.kind == 'call:incoming' or data.kind == 'dispatch' or data.kind == 'mail' or data.kind == 'notify') then
    local txt = data.kind == 'sms' and ('SMS von %s'):format(data.name or data.from)
      or data.kind == 'call:incoming' and ('Anruf von %s'):format(data.name or data.number)
      or data.kind == 'dispatch' and ('Einsatz %s · %s'):format(data.ref or '', data.reason or '')
      or data.kind == 'mail' and ('Mail: %s'):format(data.subject or '')
      or (data.title or 'Zurex')
    BeginTextCommandThefeedPost('STRING'); AddTextComponentSubstringPlayerName('~p~Zurex~s~ ' .. txt); EndTextCommandThefeedPostTicker(false, true)
    if data.kind == 'call:incoming' then PlaySoundFrontend(-1, 'Phone_Generic_Key_03', 'HUD_MINIGAME_SOUNDSET', true) end
  end
end)
RegisterNetEvent('zurex-phone:client:market', function(list) SendNUIMessage({ action = 'market', list = list }) end)
RegisterNetEvent('zurex-phone:client:bank', function(balance) SendNUIMessage({ action = 'bank', balance = balance }) end)
RegisterNetEvent('zurex-phone:client:gameNotify', function(text)
  BeginTextCommandThefeedPost('STRING'); AddTextComponentSubstringPlayerName(text); EndTextCommandThefeedPostTicker(false, true)
end)
RegisterNUICallback('peek', function(_, cb) cb({ ok = true }) end)

--------------------------------------------------------------------------- Zurex Pay: bring the phone up for a payment request
RegisterNetEvent('zurex-phone:client:payOpen', function() if not isOpen then open() end end)
RegisterNUICallback('focus', function(_, cb) if not isOpen then open() end cb({ ok = true }) end)

--------------------------------------------------------------------------- voice calls
local function voice() local v = Config.Integrations.voice; if v ~= 'auto' then return v end if GetResourceState('pma-voice') == 'started' then return 'pma-voice' end if GetResourceState('saltychat') == 'started' then return 'saltychat' end return 'none' end
RegisterNetEvent('zurex-phone:client:callChannel', function(channel)
  local v = voice()
  if v == 'pma-voice' then exports['pma-voice']:setCallChannel(channel or 0)
  elseif v == 'saltychat' then
    if channel and channel > 0 then exports.saltychat:EstablishCall('zurex_' .. channel) else exports.saltychat:EndCall('zurex') end
  end
end)
RegisterNUICallback('callMute', function(d, cb) if voice() == 'pma-voice' then exports['pma-voice']:toggleMutePlayer(PlayerId()) end cb({ ok = true }) end)

--------------------------------------------------------------------------- camera
local function screenshotAvailable()
  local s = Config.Integrations.screenshot
  if s == 'none' or Config.Camera.uploadUrl == '' then return false end
  return GetResourceState('screenshot-basic') == 'started'
end
RegisterNUICallback('cameraMode', function(d, cb)
  if Config.Camera.selfieCam and d and d.selfie ~= nil then
    if d.selfie and not inCamera then CreateMobilePhone(0); CellCamActivate(true, true); Citizen.InvokeNative(0x2491A93618B7D838, true); inCamera = true
    elseif not d.selfie and inCamera then DestroyMobilePhone(); CellCamActivate(false, false); inCamera = false end
  end
  cb({ ok = true })
end)
RegisterNUICallback('cameraZoom', function(_, cb) cb({ ok = true }) end)
RegisterNUICallback('takePhoto', function(_, cb)
  if not screenshotAvailable() then return cb({ ok = true }) end
  -- Hide the phone for one frame so the screenshot shows the game, then upload.
  SendNUIMessage({ action = 'close' }); SetNuiFocus(false, false); Wait(150)
  exports['screenshot-basic']:requestScreenshotUpload(Config.Camera.uploadUrl, Config.Camera.uploadField, { headers = Config.Camera.headers, encoding = 'jpg' }, function(data)
    local ok, res = pcall(json.decode, data)
    local url = ok and res and (res.url or (res.attachments and res.attachments[1] and res.attachments[1].proxy_url) or (res.data and res.data.url)) or nil
    if isOpen then SendNUIMessage({ action = 'open' }); SetNuiFocus(true, true) end
    cb({ ok = url ~= nil, url = url })
  end)
end)

--------------------------------------------------------------------------- flashlight (a light cone in front of the player)
RegisterNUICallback('flashlight', function(d, cb)
  flashlightOn = d and d.on or false
  if flashlightOn then
    CreateThread(function()
      while flashlightOn do
        local ped = PlayerPedId(); local c = GetEntityCoords(ped); local f = GetEntityForwardVector(ped)
        DrawSpotLight(c.x, c.y, c.z + 0.4, f.x, f.y, -0.15, 255, 250, 235, 25.0, 6.0, 3.0, 22.0, 30.0)
        Wait(0)
      end
    end)
  end
  cb({ ok = true })
end)

--------------------------------------------------------------------------- exports + cleanup
exports('Open', open)
exports('Close', close)
exports('IsOpen', function() return isOpen end)
exports('Notify', function(title, text, app) SendNUIMessage({ action = 'push', kind = 'notify', app = app or 'messages', title = title, text = text }) end)
exports('AddApp', function(def) SendNUIMessage({ action = 'addApp', app = def }) end)
exports('GetModel', function() return currentModel end)

AddEventHandler('onResourceStop', function(res)
  if res ~= GetCurrentResourceName() then return end
  if isOpen then SetNuiFocus(false, false); stopAnim() end
  if inCamera then DestroyMobilePhone(); CellCamActivate(false, false) end
end)
