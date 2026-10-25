# Zurex Phone · API

## Server exports

| Export | Beschreibung |
| --- | --- |
| `RequestPayment(src, amount, merchant, cb, desc?)` | Öffnet das Bezahl-Sheet beim Spieler. `cb(paid)` wird genau einmal aufgerufen: bezahlt, abgelehnt oder abgelaufen (`Config.Pay.timeout`). Gibt die Referenz zurück. |
| `Notify(src, title, text, app?)` | Banner auf dem Handy. `app` ist eine App-ID für Icon und Badge. |
| `Push(src, app, data)` | Beliebige Daten an eine App senden (`data.kind` optional). |
| `SendSMS(fromNumber, toNumber, text, fromName?)` | SMS zustellen, offline wird sie beim nächsten Öffnen nachgeliefert. |
| `SendMail(to, from, subject, body)` | Mail an `handle@zmail.ls` oder eine Nummer. |
| `PostToApp(app, authorName, text, photoUrl?)` | Beitrag in einen Feed posten, z. B. Zurex News von einem Bot. |
| `GetNumber(src)` | Telefonnummer eines Spielers. |
| `GetSourceByNumber(number)` | Server-ID zu einer Nummer (nur online). |
| `AddApp(def)` | App für alle Spieler hinzufügen, siehe unten. |
| `RegisterHandler(op, fn)` | Eine Handy-Aktion übernehmen. `fn(src, args)` gibt eine Tabelle zurück, z. B. `{ ok = true }`. |
| `On(op, fn)` | Nach einer erfolgreichen Aktion benachrichtigt werden: `fn(src, args, result)`. |

### Aktionen (`op`)

`sms.send`, `call.start`, `call.accept`, `call.end`, `bank.balance`, `bank.transfer`, `profile.set`,
`feed.list|post|like|vote|comment|delete`, `chan.list|send`, `mail.list|send|read|delete`,
`broker.portfolio|trade`, `ghost.inbox|send|open`, `dispatch.send|take`, `shop.items|buy`,
`invoice.list|send|pay`, `carrier.subscribe`, `number.check|buy`, `card.list|order|sync`, `pay.confirm`, `market.snapshot`.

Eigene Apps nutzen den Namensraum `ext.<appId>.<op>`.

## Client exports

| Export | Beschreibung |
| --- | --- |
| `Open()` / `Close()` / `IsOpen()` | Handy steuern |
| `Notify(title, text, app?)` | Banner lokal anzeigen |
| `AddApp(def)` | App nur für diesen Spieler |
| `GetModel()` | `ultra`, `pro` oder `base` |

## Server events

| Event | Parameter |
| --- | --- |
| `zurex-phone:dispatch` | `src, service, data` bei jedem Notruf oder Service-Ruf (für eigene Dispatch-Scripts) |

## Eigene Apps

```lua
exports['zurex-phone']:AddApp({
  id = 'garage', name = 'Garage', icon = 'car', color = '#5eead4',
  category = 'tools', url = 'nui://my-garage/html/phone.html', preinstalled = true,
})
```

Die Seite läuft im Handy als iframe und spricht per `postMessage` mit dem Handy:

```js
// beim Laden: { zurex: 'init', app, owner, theme }
window.addEventListener('message', (e) => { if (e.data.zurex === 'init') console.log(e.data.owner) })

parent.postMessage({ zurex: 'notify', title: 'Garage', text: 'Auto ausgeparkt' }, '*')
parent.postMessage({ zurex: 'open', app: 'maps' }, '*')
parent.postMessage({ zurex: 'close' }, '*')
// Server-Aufruf -> exports['zurex-phone']:RegisterHandler('ext.garage.list', fn)
parent.postMessage({ zurex: 'rpc', id: 1, op: 'list', args: {} }, '*')
```

## Hooks in `config.lua`

```lua
Config.Hooks = {
  onTransfer = function(src, target, amount, note) return true end,
  onDispatch = function(src, service, data) end,
  onPurchase = function(src, app, item, qty, price) return true end,
  canPost    = function(src, app, text) return true end,
  getBank    = function(src) end,            -- mit Config.Integrations.banking = 'custom'
  removeBank = function(src, amount, reason) end,
  addBank    = function(src, amount, reason) end,
}
```
