# Konfiguration

Alle Werte stehen kommentiert in [`config.lua`](../config.lua). Hier der Überblick.

| Bereich | Schlüssel | Wofür |
| --- | --- | --- |
| Kern | `Framework`, `OpenKey`, `Command`, `Animation`, `PhoneProp`, `NumberFormat` | Framework-Erkennung, Taste, Animation, Format generierter Nummern |
| Modelle | `RequireItem`, `DefaultModel`, `Items`, `UsableItems` | Welches Item welches Modell öffnet (Ultra / Pro / XR7) |
| Aussehen | `UI` | Standard-Akzent, Hintergrund, maximale Größe |
| Apps | `Apps.preinstalled`, `Apps.disabled`, `Apps.overrides`, `Apps.allInstalled` | Startapps, Apps entfernen, umbenennen oder umfärben |
| Integrationen | `Integrations.banking|billing|dispatch|inventory|voice|screenshot` | Anbindung an andere Scripts (`auto` erkennt laufende Resources) |
| Kamera | `Camera.uploadUrl`, `uploadField`, `headers`, `selfieCam` | Echte Screenshots hochladen |
| Hooks | `Hooks.*` | Eigene Logik für Überweisung, Dispatch, Kauf, Posten, Banking |
| Dienste | `Services`, `ServiceAce`, `PostJobs` | Welche Jobs Notrufe bekommen, wer in News posten darf |
| Shops | `Shops.<app>` | Artikel, Preise, Kategorien (Item-Namen deines Inventars) |
| Markt | `Market.instruments`, `tick`, `fee`, `maxOrder` | Aktien, Krypto, Devisen, Rohstoffe, ETFs |
| Netz | `Network.carriers`, `wifi`, `numbers`, `requireSignal` | Anbieter, Abdeckung, Preise, Hotspots, Wunschnummern |
| Karten | `Cards`, `Pay` | Kartentypen (Preis, Cashback, Limit), Zahlungs-Timeout |
| Casino | `Casino.startChips`, `dailyChips` | Spielgeld |
| Speicher | `Storage.file`, `saveEvery`, `Limits.*` | JSON-Datei, Speicherintervall, Spam-Schutz |
| Inhalte | `Places`, `Docs`, `ExternalApps` | GPS-Orte, Regeln/Gesetze, eigene Apps |

## Beispiele

```lua
-- Darkchat und Roulette entfernen, Flick umbenennen
Config.Apps.disabled  = { 'darkchat', 'roulette' }
Config.Apps.overrides = { flick = { name = 'Instapic', color = '#ff5c8a' } }

-- Nur Reporter dürfen in Zurex News posten
Config.PostJobs = { zurexnews = { 'reporter' } }

-- Eigener Anbieter
table.insert(Config.Network.carriers, { id = 'cityfon', name = 'Cityfon', short = 'CITY', color = '#22c55e', price = 15, data = 20, city = 0.9, county = 0.2, perks = { 'LTE' } })
```
