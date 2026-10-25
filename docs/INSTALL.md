# Installation

## Voraussetzungen

- FiveM-Server Build 7290 oder neuer, OneSync
- Optional: `qb-core`, `qbx_core` oder `es_extended` (sonst läuft der Standalone-Modus)
- Optional: `pma-voice` oder `saltychat` für Anrufe, `screenshot-basic` für echte Fotos, `ox_inventory` / `qs-inventory`

## Schritte

1. Ordner nach `resources/[phone]/zurex-phone` kopieren.
2. `ensure zurex-phone` in die `server.cfg` (nach Framework, Inventar und Voice).
3. Der Ordner `data/` muss für den Server beschreibbar sein (`data/db.json` wird automatisch angelegt).

## Items

Nur nötig mit `Config.RequireItem = true` oder `Config.UsableItems = true`.

**QBCore** (`qb-core/shared/items.lua`):

```lua
phone       = { name = 'phone',       label = 'Zurex XR7',       weight = 190, type = 'item', image = 'phone.png', unique = true, useable = true, shouldClose = true, description = 'Zurex XR7' },
phone_pro   = { name = 'phone_pro',   label = 'Zurex XR7 Pro',   weight = 200, type = 'item', image = 'phone.png', unique = true, useable = true, shouldClose = true, description = 'Zurex XR7 Pro' },
phone_ultra = { name = 'phone_ultra', label = 'Zurex XR7 Ultra', weight = 220, type = 'item', image = 'phone.png', unique = true, useable = true, shouldClose = true, description = 'Zurex XR7 Ultra' },
```

**ox_inventory** (`ox_inventory/data/items.lua`):

```lua
['phone']       = { label = 'Zurex XR7',       weight = 190, stack = false, client = { export = 'zurex-phone.Open' } },
['phone_pro']   = { label = 'Zurex XR7 Pro',   weight = 200, stack = false, client = { export = 'zurex-phone.Open' } },
['phone_ultra'] = { label = 'Zurex XR7 Ultra', weight = 220, stack = false, client = { export = 'zurex-phone.Open' } },
```

**ESX**: Items in der Tabelle `items` anlegen (`phone`, `phone_pro`, `phone_ultra`).

## Standalone-Dienste

Ohne Framework bekommen Spieler Notrufe über ACE-Rechte:

```cfg
add_ace group.police zurex.service.police allow
add_ace group.ems    zurex.service.ambulance allow
```

## Echte Fotos

```lua
Config.Camera.uploadUrl   = 'https://discord.com/api/webhooks/…'  -- oder ein Image-Host
Config.Camera.uploadField = 'files[]'
```

Ohne `uploadUrl` erzeugt die Kamera stilisierte Szenen.
