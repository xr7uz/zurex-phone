/*
 * App registry: every app on the Zurex phone. Order = store index.
 * Fields: id, name, cat, icon, engine (or a RENDER[id] implementation), cfg, tint, hero, core, preinstalled, featured, desc, tags.
 */
(() => {
  'use strict';
  const P = '#f472b6', A = '#f0a04b', C = '#5eead4', V = '#c4b5fd', Y = '#fbbf24', B = '#60a5fa', G = '#86efac', R = '#fb7185', W = '#e7e5e4';
  const n2 = (v, d = 2) => Number(v).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
  const eur = (v) => n2(v) + ' €';
  const ok = (v) => typeof v === 'number' && isFinite(v);

  /* Shop catalogues for the browser mockup. Ingame the server uses Config.Shops (same item names). */
  window.ZX_SHOPS = {
    kart: [
      { name: 'phone', label: 'Zurex XR7', price: 899, cat: 'Elektronik', icon: 'phone', desc: 'Das Original' },
      { name: 'radio', label: 'Funkgerät', price: 250, cat: 'Elektronik', icon: 'radio' },
      { name: 'repairkit', label: 'Reparaturkit', price: 350, cat: 'Auto', icon: 'wrench' },
      { name: 'cleaningkit', label: 'Reinigungsset', price: 80, cat: 'Auto', icon: 'drop' },
      { name: 'bandage', label: 'Verband', price: 25, cat: 'Gesundheit', icon: 'cross' },
      { name: 'water_bottle', label: 'Wasser 6er', price: 12, cat: 'Haushalt', icon: 'drop' },
      { name: 'binoculars', label: 'Fernglas', price: 180, cat: 'Freizeit', icon: 'eye' },
      { name: 'parachute', label: 'Fallschirm', price: 1200, cat: 'Freizeit', icon: 'plane' },
    ],
    foodz: [
      { name: 'sandwich', label: 'Club Sandwich', price: 9, cat: 'Burger Shot', icon: 'food', desc: 'Lieferung in 15 Min.' },
      { name: 'tosti', label: 'Toast Hawaii', price: 7, cat: 'Burger Shot', icon: 'food' },
      { name: 'twerks_candy', label: 'Twerks Riegel', price: 3, cat: 'Snacks', icon: 'gift' },
      { name: 'snikkel_candy', label: 'Snikkel', price: 3, cat: 'Snacks', icon: 'gift' },
      { name: 'kurkakola', label: 'eCola', price: 4, cat: 'Getränke', icon: 'glass' },
      { name: 'coffee', label: 'Bean Machine Kaffee', price: 5, cat: 'Getränke', icon: 'coffee' },
      { name: 'water_bottle', label: 'Wasser', price: 2, cat: 'Getränke', icon: 'drop' },
    ],
    techstore: [
      { name: 'phone', label: 'Zurex XR7', price: 899, cat: 'Smartphones', icon: 'phone' },
      { name: 'radio', label: 'Funkgerät Pro', price: 320, cat: 'Funk', icon: 'radio' },
      { name: 'laptop', label: 'Laptop', price: 1400, cat: 'Computer', icon: 'cpu' },
      { name: 'tablet', label: 'Tablet', price: 650, cat: 'Computer', icon: 'cpu' },
      { name: 'electronickit', label: 'Elektronik-Kit', price: 220, cat: 'Bastler', icon: 'bolt' },
    ],
    blumen: [
      { name: 'flowers_rose', label: 'Rote Rosen', price: 39, cat: 'Sträuße', icon: 'leaf' },
      { name: 'flowers_tulip', label: 'Tulpen', price: 24, cat: 'Sträuße', icon: 'leaf' },
      { name: 'flowers_mix', label: 'Sommer-Mix', price: 29, cat: 'Sträuße', icon: 'leaf' },
      { name: 'teddy', label: 'Teddybär', price: 19, cat: 'Geschenke', icon: 'gift' },
    ],
    apotheke: [
      { name: 'bandage', label: 'Verband', price: 25, cat: 'Erste Hilfe', icon: 'cross' },
      { name: 'painkillers', label: 'Schmerztabletten', price: 45, cat: 'Medikamente', icon: 'cross' },
      { name: 'firstaid', label: 'Erste-Hilfe-Kasten', price: 150, cat: 'Erste Hilfe', icon: 'cross' },
      { name: 'ifaks', label: 'IFAK', price: 90, cat: 'Erste Hilfe', icon: 'shield' },
    ],
    baumarkt: [
      { name: 'screwdriverset', label: 'Werkzeugset', price: 120, cat: 'Werkzeug', icon: 'wrench' },
      { name: 'repairkit', label: 'Reparaturkit', price: 350, cat: 'Werkzeug', icon: 'wrench' },
      { name: 'advancedrepairkit', label: 'Profi-Reparaturkit', price: 900, cat: 'Werkzeug', icon: 'hammer' },
      { name: 'weapon_flashlight', label: 'Taschenlampe', price: 60, cat: 'Garten & Licht', icon: 'torch' },
      { name: 'jerry_can', label: 'Benzinkanister', price: 75, cat: 'Auto', icon: 'fuel' },
    ],
    kiosk: [
      { name: 'water_bottle', label: 'Wasser', price: 2, cat: 'Getränke', icon: 'drop' },
      { name: 'kurkakola', label: 'eCola', price: 4, cat: 'Getränke', icon: 'glass' },
      { name: 'beer', label: 'Pisswasser', price: 6, cat: 'Getränke', icon: 'glass' },
      { name: 'sandwich', label: 'Sandwich', price: 8, cat: 'Snacks', icon: 'food' },
      { name: 'lighter', label: 'Feuerzeug', price: 3, cat: 'Sonstiges', icon: 'fire' },
      { name: 'lotteryticket', label: 'Rubbellos', price: 5, cat: 'Sonstiges', icon: 'ticket' },
    ],
    tuning: [
      { name: 'repairkit', label: 'Reparaturkit', price: 350, cat: 'Wartung', icon: 'wrench' },
      { name: 'nitrous', label: 'Nitro-Flasche', price: 2500, cat: 'Leistung', icon: 'bolt' },
      { name: 'harness', label: 'Renngurt', price: 1800, cat: 'Sicherheit', icon: 'shield' },
      { name: 'tunerlaptop', label: 'Tuning-Laptop', price: 4500, cat: 'Elektronik', icon: 'cpu' },
      { name: 'cleaningkit', label: 'Reinigungsset', price: 80, cat: 'Pflege', icon: 'drop' },
    ],
  };

  const cs = (title, flairs) => ({ seed: title, flairs });
  const apps = [
    /* ── System ── */
    { id: 'phone', name: 'Telefon', cat: 'core', icon: 'phone', core: true, tint: G },
    { id: 'messages', name: 'Nachrichten', cat: 'core', icon: 'messages', core: true, hero: true },
    { id: 'contacts', name: 'Kontakte', cat: 'core', icon: 'contacts', core: true },
    { id: 'settings', name: 'Einstellungen', cat: 'core', icon: 'settings', core: true, tint: W },
    { id: 'store', name: 'Zurex Store', short: 'Store', cat: 'core', icon: 'store', core: true, tint: B, desc: 'Über 200 Apps, Games und Tools' },
    { id: 'camera', name: 'Kamera', cat: 'core', icon: 'camera', core: true, tint: W },
    { id: 'gallery', name: 'Fotos', cat: 'core', icon: 'image', core: true, tint: Y },
    { id: 'bank', name: 'Zurex Bank', short: 'Bank', cat: 'core', icon: 'bank', core: true, tint: P },
    { id: 'wallet', name: 'Zurex Pay', short: 'Pay', cat: 'core', icon: 'wallet', core: true, tint: '#e7e5e4', desc: 'Kontaktlos bezahlen, Karten verwalten, Geld senden.' },
    { id: 'maps', name: 'Karte', cat: 'core', icon: 'map', core: true, tint: C },
    { id: 'mail', name: 'Zmail', cat: 'core', icon: 'mail', core: true, engine: 'mail', tint: B },
    { id: 'calendar', name: 'Kalender', cat: 'core', icon: 'calendar', core: true },
    { id: 'notes', name: 'Notizen', cat: 'core', icon: 'notes', core: true, tint: Y },
    { id: 'clock', name: 'Uhr', cat: 'core', icon: 'clock', core: true, engine: 'clock' },
    { id: 'calculator', name: 'Rechner', cat: 'core', icon: 'calc', core: true, tint: A },
    { id: 'weather', name: 'Wetter', cat: 'core', icon: 'sun', core: true, tint: B },
    { id: 'pulse', name: 'Märkte', cat: 'core', icon: 'pulse', core: true, tint: P },

    /* ── Social ── */
    { id: 'flick', name: 'Flick', cat: 'social', icon: 'heart', engine: 'photo', hero: true, preinstalled: true, featured: true, desc: 'Fotos teilen, liken, kommentieren. Das Social Network von Los Santos.', tags: 'instagram insta', cfg: { tagline: 'Feed', seed: [{ text: 'Golden Hour am Del Perro Pier 🌅', scene: 'sunset' }, { text: 'Neue Felgen, wer will eine Runde? #carmeet', scene: 'car' }, { text: 'Vinewood bei Nacht hat was.', scene: 'neon' }, { text: 'Brunch im Bean Machine ☕', scene: 'food' }, { text: 'Gipfel erreicht. Chiliad 💪', scene: 'mountain' }, { text: 'Strandtag 🏖', scene: 'beach' }, { text: 'Downtown Vibes', scene: 'city' }, { text: 'Selfie-Time', scene: 'portrait' }] } },
    { id: 'reelz', name: 'Reelz', cat: 'social', icon: 'play', engine: 'reels', preinstalled: true, featured: true, tint: R, desc: 'Kurzvideos im Vollbild. Wischen, liken, viral gehen.', tags: 'tiktok tik tok shorts', cfg: { seed: [{ text: 'POV: Du parkst vor dem Mission Row PD 😅 #fyp', scene: 'city' }, { text: 'Sunset Drive auf dem Great Ocean Highway #cars', scene: 'sunset' }, { text: 'Rate mein Outfit 1–10 👀', scene: 'portrait' }, { text: 'Bester Burger der Stadt? #foodtok', scene: 'food' }, { text: 'Nachtclub-Eröffnung heute! #nightlife', scene: 'neon' }, { text: 'Wüstenrennen in Sandy Shores 🏜', scene: 'desert' }] } },
    { id: 'ghost', name: 'Ghost', cat: 'social', icon: 'ghost', engine: 'ghost', preinstalled: true, featured: true, tint: Y, desc: 'Snaps, die verschwinden. Stories für 24 Stunden.', tags: 'snapchat snap' },
    { id: 'chirp', name: 'Chirp', cat: 'social', icon: 'feather', engine: 'text', preinstalled: true, tint: B, desc: 'Kurznachrichten an die ganze Stadt.', tags: 'twitter x tweet', cfg: { seed: ['Stau auf dem Del Perro Freeway, nehmt die Route 1 #traffic', 'Wer hat Lust auf Basketball am Vespucci Beach? 🏀', 'Burger Shot hat endlich wieder Pommes. Ein Wunder.', 'Gerade 3 Polizeiautos Richtung Paleto gesehen 👀', 'Neuer Track kommt Freitag 🔥 @vinewood.vibes', 'Gibt es heute ein Carmeet? #ls', 'Kaffee Nummer 4. Montag eben.'], photos: true } },
    { id: 'vidz', name: 'Vidz', cat: 'social', icon: 'video', engine: 'reels', tint: R, desc: 'Videos, Vlogs und Kanäle.', tags: 'youtube', cfg: { landscape: true, tagline: 'Startseite', seed: ['Ich habe 24h in Sandy Shores überlebt', 'Top 10 Autos unter 50.000 €', 'Los Santos Food Tour: 5 Restaurants', 'Vinewood Hills Villa Tour', 'Wie man in LS reich wird (ehrlich)', 'Mount Chiliad Hiking Guide'] } },
    { id: 'livez', name: 'Livez', cat: 'social', icon: 'tv', engine: 'reels', tint: V, desc: 'Livestreams aus der Stadt.', tags: 'twitch stream live', cfg: { landscape: true, live: true, tagline: 'Live jetzt', seed: ['Late Night Talk', 'Rennen am Flughafen LIVE', 'Fischen am Alamo Sea', 'Club Set: House Music', 'Cooking Stream'] } },
    { id: 'clipz', name: 'Clipz', cat: 'social', icon: 'film', engine: 'reels', tint: P, desc: 'Highlights und Gaming-Clips.', cfg: { seed: ['Clutch im letzten Moment 🎮', 'Stunt Jump #42 geschafft', 'Fail Compilation Teil 3', 'Bester Drift des Jahres'] } },
    { id: 'lense', name: 'Lense', cat: 'social', icon: 'camera', engine: 'photo', tint: W, desc: 'Fotografie-Community für Profis und Hobbyfotografen.', cfg: { stories: false, tagline: 'Fotografie', seed: [{ text: 'Langzeitbelichtung, Maze Bank Tower', scene: 'night' }, { text: 'Alamo Sea im Nebel', scene: 'mountain' }, { text: 'Street Photography Strawberry', scene: 'city' }, { text: 'Wüstenlicht', scene: 'desert' }] } },
    { id: 'pinwall', name: 'Pinwall', cat: 'social', icon: 'pin', engine: 'photo', tint: R, desc: 'Ideen sammeln: Outfits, Autos, Wohnungen.', tags: 'pinterest', cfg: { layout: 'masonry', seed: ['Wohnzimmer-Inspo', 'Sommer-Outfit', 'Tuning-Ideen', 'Rezept: Tacos', 'Garten in Vinewood', 'Strandhaus-Traum', 'Neon-Deko', 'Bergtour-Packliste'].map((text, i) => ({ text, scene: ['city', 'portrait', 'car', 'food', 'mountain', 'beach', 'neon', 'mountain'][i] })) } },
    { id: 'foodgram', name: 'Foodgram', cat: 'social', icon: 'food', engine: 'photo', tint: A, desc: 'Essen fotografieren und Restaurants entdecken.', cfg: { seed: [{ text: 'Tacos von Taco Libre 🌮', scene: 'food' }, { text: 'Brunch in Rockford', scene: 'food' }, { text: 'Hausgemacht: Pasta', scene: 'food' }] } },
    { id: 'carspot', name: 'Carspot', cat: 'social', icon: 'car', engine: 'photo', tint: C, desc: 'Autos spotten und zeigen.', cfg: { seed: [{ text: 'Spotted am Pier 🔥', scene: 'car' }, { text: 'Projekt-Auto Fortschritt', scene: 'car' }, { text: 'Carmeet Legion Square', scene: 'car' }] } },
    { id: 'threadz', name: 'Threadz', cat: 'social', icon: 'at', engine: 'text', tint: W, desc: 'Gespräche in Threads.', cfg: { max: 500, tagline: 'Für dich', seed: ['Was ist euer Lieblingsort in LS?', 'Unpopuläre Meinung: Paleto ist schöner als Vinewood.', 'Ich fang heute als Mechaniker an, Tipps?'] } },
    { id: 'linkd', name: 'Linkd', cat: 'social', icon: 'briefcase', engine: 'text', tint: B, desc: 'Karriere-Netzwerk: Jobs, Firmen, Kontakte.', tags: 'linkedin', cfg: { tagline: 'Karriere', ph: 'Teile einen Erfolg oder eine Stelle', seed: ['Wir stellen ein: Mechaniker (m/w/d) bei LS Customs.', 'Stolz auf mein Team im Pillbox Medical 🙌', 'Neue Rolle: Filialleitung 24/7 Davis.'] } },
    { id: 'events', name: 'Events LS', short: 'Events', cat: 'social', icon: 'ticket', engine: 'text', tint: Y, desc: 'Partys, Treffen und Veranstaltungen.', cfg: { tagline: 'Was geht?', ph: 'Beschreibe das Event', fields: [{ key: 'title', label: 'Eventname', required: true }, { key: 'when', label: 'Wann & Wo', required: true, ph: 'Fr 21 Uhr · Bahama Mamas' }], seed: [{ text: 'Carmeet mit DJ und Food Trucks', extra: { title: 'Midnight Meet', when: 'Sa 23 Uhr · Legion Square' } }, { text: 'Eintritt frei, Dresscode schwarz', extra: { title: 'Black Night', when: 'Fr 22 Uhr · Bahama Mamas' } }] } },
    { id: 'bewertungen', name: 'Bewertungen', cat: 'social', icon: 'star', engine: 'text', tint: Y, desc: 'Restaurants, Läden und Werkstätten bewerten.', tags: 'yelp', cfg: { tagline: 'Rezensionen', fields: [{ key: 'place', label: 'Ort', required: true }, { key: 'rating', label: 'Sterne', type: 'select', options: ['5', '4', '3', '2', '1'] }], seed: [{ text: 'Schnell, freundlich, fairer Preis.', extra: { place: 'LS Customs Burton', rating: 5 } }, { text: 'Pommes kalt, aber der Burger war gut.', extra: { place: 'Burger Shot', rating: 3 } }] } },
    { id: 'reddot', name: 'Reddot', cat: 'social', icon: 'vote', engine: 'forum', tint: A, desc: 'Die Startseite von Los Santos. Threads, Votes, Diskussionen.', tags: 'reddit', cfg: { flairs: ['Diskussion', 'Frage', 'Meme', 'News', 'Hilfe'], seed: ['Welcher Job lohnt sich gerade am meisten?', 'Zeigt eure Autos!', 'Tipp: Tankstelle in Grapeseed ist am günstigsten', 'Wer kennt einen guten Anwalt?'].map((text, i) => ({ text: 'Was meint ihr?', extra: { title: text, flair: ['Diskussion', 'Meme', 'News', 'Frage'][i] } })), photos: true } },
    { id: 'nachbarn', name: 'Nachbarn', cat: 'social', icon: 'house', engine: 'forum', tint: G, desc: 'Was in deiner Nachbarschaft passiert.', tags: 'nextdoor', cfg: { flairs: ['Verloren', 'Hinweis', 'Verschenke', 'Frage'], seed: [{ text: 'Grau-weiß, hört auf Mo.', extra: { title: 'Katze in Mirror Park entlaufen', flair: 'Verloren' } }, { text: 'Lautes Auto jede Nacht um 3.', extra: { title: 'Ruhestörung Grove Street', flair: 'Hinweis' } }] } },
    { id: 'beichte', name: 'Beichte', cat: 'social', icon: 'eye', engine: 'forum', tint: V, desc: 'Anonyme Geständnisse.', cfg: { anon: true, photos: false, seed: [{ text: 'Ich habe den letzten Donut in der Wache gegessen.', extra: { title: 'Es war ich' } }, { text: 'Ich tue so, als könnte ich tanzen.', extra: { title: 'Club-Geständnis' } }] } },
    { id: 'gamerhub', name: 'Gamerhub', cat: 'social', icon: 'game', engine: 'forum', tint: V, desc: 'Highscores, Tipps und Clans.', cfg: { flairs: ['Highscore', 'Clan', 'Tipp'], seed: [{ text: '2048: 8.192 erreicht!', extra: { title: 'Neuer Rekord', flair: 'Highscore' } }] } },
    { id: 'spark', name: 'Spark', cat: 'social', icon: 'flame', engine: 'dating', tint: R, desc: 'Swipen, matchen, verabreden.', tags: 'tinder dating', cfg: { photos: true, seed: [{ text: 'Liebe Sunsets und schnelle Autos.', scene: 'portrait', extra: { age: 24, look: 'Date' } }, { text: 'Koche besser als Burger Shot.', scene: 'portrait', extra: { age: 29, look: 'Beziehung' } }, { text: 'Suche Wanderpartner für Chiliad.', scene: 'portrait', extra: { age: 26, look: 'Freundschaft' } }, { text: 'Tattoo-Artist, Katzenmensch.', scene: 'portrait', extra: { age: 31, look: 'Abenteuer' } }] } },

    /* ── Chat ── */
    { id: 'whisp', name: 'Whisp', cat: 'chat', icon: 'messages', engine: 'chat', preinstalled: true, tint: G, desc: 'Gruppenchats für Freunde und Familie.', tags: 'whatsapp', cfg: { channels: ['freunde', 'familie', 'arbeit'], prefix: '', tagline: 'Gruppen' } },
    { id: 'hubb', name: 'Hubb', cat: 'chat', icon: 'hash', engine: 'chat', tint: V, desc: 'Server, Kanäle, Communities.', tags: 'discord', cfg: { channels: ['allgemein', 'autos', 'memes', 'musik', 'hilfe'], tagline: 'Zurex Community' } },
    { id: 'darkchat', name: 'Darkchat', cat: 'chat', icon: 'lock', engine: 'chat', tint: '#a8a29e', desc: 'Anonym, verschlüsselt, ohne Namen.', cfg: { anon: true, channels: ['offen'], private: true, prefix: '#', info: 'Nachrichten sind anonym. Tritt Kanälen per Name bei.', chat: ['Wer hat was?', 'Treffpunkt wie immer.', 'Keine Namen hier.'] } },
    { id: 'crewnet', name: 'Crewnet', cat: 'chat', icon: 'users', engine: 'chat', tint: R, desc: 'Private Kanäle für Crews und Gangs.', cfg: { channels: [], private: true, info: 'Kanalname = Code. Teile ihn nur mit deiner Crew.' } },
    { id: 'stadtfunk', name: 'Stadtfunk', cat: 'chat', icon: 'radio', engine: 'chat', tint: Y, desc: 'Ein Kanal für ganz Los Santos.', cfg: { channels: ['stadt'], tagline: 'Live' } },
    { id: 'jobfunk', name: 'Jobfunk', cat: 'chat', icon: 'briefcase', engine: 'chat', tint: B, desc: 'Text-Funk für Firmen und Fraktionen.', cfg: { channels: ['lspd', 'ems', 'mechaniker', 'taxi'], private: true } },
    { id: 'lobby', name: 'Lobby', cat: 'chat', icon: 'game', engine: 'chat', tint: V, desc: 'Mitspieler für Games finden.', cfg: { channels: ['lfg', 'turniere'] } },

    /* ── Marktplatz ── */
    { id: 'bazar', name: 'Bazar', cat: 'market', icon: 'tag', engine: 'classifieds', preinstalled: true, tint: A, desc: 'Kleinanzeigen: kaufen und verkaufen.', tags: 'ebay kleinanzeigen', cfg: { cats: ['Elektronik', 'Möbel', 'Kleidung', 'Sonstiges'], seed: [{ text: 'Kaum benutzt, mit Ladekabel.', scene: 'city', extra: { title: 'Zurex XR7 Pro', price: '650', cat: 'Elektronik' } }, { text: 'Abholung in Mirror Park.', scene: 'portrait', extra: { title: 'Ledersofa schwarz', price: '300', cat: 'Möbel' } }, { text: 'Größe M, einmal getragen.', scene: 'portrait', extra: { title: 'Designer-Jacke', price: '120', cat: 'Kleidung' } }] } },
    { id: 'autoscout', name: 'Autoscout LS', short: 'Autoscout', cat: 'market', icon: 'car', engine: 'classifieds', tint: C, desc: 'Gebrauchtwagen und Motorräder.', cfg: { cats: ['Sportwagen', 'SUV', 'Motorrad', 'Oldtimer'], seed: [{ text: 'Unfallfrei, frisch gewartet.', scene: 'car', extra: { title: 'Pegassi Zentorno', price: '725000', cat: 'Sportwagen' } }, { text: 'Tieferlegung, neue Reifen.', scene: 'car', extra: { title: 'Karin Sultan RS', price: '89000', cat: 'Sportwagen' } }] } },
    { id: 'immo', name: 'Immo LS', short: 'Immo', cat: 'market', icon: 'house', engine: 'classifieds', tint: G, desc: 'Wohnungen, Häuser, Gewerbe.', cfg: { priceLabel: 'Miete pro Monat (€)', priceSuffix: ' / Monat', cats: ['Wohnung', 'Haus', 'Gewerbe', 'Garage'], seed: [{ text: '3 Zimmer, Blick auf die Stadt.', scene: 'city', extra: { title: 'Penthouse Del Perro', price: '4200', cat: 'Wohnung' } }, { text: 'Pool, Garten, Doppelgarage.', scene: 'mountain', extra: { title: 'Villa Vinewood Hills', price: '9800', cat: 'Haus' } }] } },
    { id: 'jobboerse', name: 'Jobbörse', cat: 'market', icon: 'briefcase', engine: 'classifieds', tint: B, desc: 'Stellenangebote der Stadt.', cfg: { priceLabel: 'Gehalt pro Monat (€)', priceSuffix: ' / Monat', cats: ['Vollzeit', 'Teilzeit', 'Minijob'], postTitle: 'Stelle ausschreiben', seed: [{ text: 'Führerschein Klasse C nötig.', extra: { title: 'LKW-Fahrer (GoPostal)', price: '3200', cat: 'Vollzeit' } }, { text: 'Abends und am Wochenende.', extra: { title: 'Barkeeper Bahama Mamas', price: '1800', cat: 'Teilzeit' } }] } },
    { id: 'schwarzmarkt', name: 'Schwarzmarkt', cat: 'market', icon: 'eye', engine: 'classifieds', tint: '#a8a29e', desc: 'Keine Fragen. Keine Namen.', cfg: { anon: true, cats: ['Ware', 'Dienst', 'Info'], seed: [{ text: 'Treffpunkt nach Absprache.', extra: { title: 'Ersatzteile, günstig', price: '500', cat: 'Ware' } }] } },
    { id: 'tierheim', name: 'Tierheim LS', short: 'Tierheim', cat: 'market', icon: 'paw', engine: 'classifieds', tint: Y, desc: 'Haustiere adoptieren.', cfg: { cats: ['Hund', 'Katze', 'Sonstige'], priceLabel: 'Schutzgebühr (€)', seed: [{ text: 'Verspielt, kinderlieb.', scene: 'portrait', extra: { title: 'Husky „Nova“', price: '150', cat: 'Hund' } }] } },
    { id: 'gelbeseiten', name: 'Gelbe Seiten', cat: 'market', icon: 'book', engine: 'classifieds', tint: Y, desc: 'Firmen und Dienstleister finden.', cfg: { noPrice: true, priceLabel: 'Öffnungszeiten', cats: ['Werkstatt', 'Gastro', 'Handel', 'Dienstleistung'], postTitle: 'Firma eintragen', seed: [{ text: 'Reparatur, Tuning, Abschleppdienst.', extra: { title: 'Jonas Werkstatt', price: 'Mo–Sa 8–20 Uhr', cat: 'Werkstatt' } }] } },
    { id: 'mitfahren', name: 'Mitfahren', cat: 'market', icon: 'car', engine: 'classifieds', tint: G, desc: 'Fahrgemeinschaften.', cfg: { priceLabel: 'Preis pro Person (€)', cats: ['Biete', 'Suche'], seed: [{ text: 'Täglich 7 Uhr, 3 Plätze frei.', extra: { title: 'LS → Sandy Shores', price: '15', cat: 'Biete' } }] } },
    { id: 'tausch', name: 'Tauschbörse', short: 'Tausch', cat: 'market', icon: 'swap', engine: 'classifieds', tint: V, desc: 'Tauschen statt kaufen.', cfg: { noPrice: true, priceLabel: 'Suche dafür', seed: [{ text: 'Guter Zustand.', extra: { title: 'Gitarre', price: 'Suche: Fahrrad' } }] } },
    { id: 'fundbuero', name: 'Fundbüro', cat: 'market', icon: 'search', engine: 'classifieds', tint: W, desc: 'Verloren und gefunden.', cfg: { noPrice: true, priceLabel: 'Fundort', seed: [{ text: 'Braunes Leder, ohne Ausweis.', extra: { title: 'Geldbörse gefunden', price: 'Legion Square' } }] } },

    /* ── Finanzen ── */
    { id: 'tradr', name: 'Tradr', cat: 'finance', icon: 'pulse', engine: 'broker', preinstalled: true, featured: true, hero: false, tint: P, desc: 'Aktien und ETFs ab 1 € Gebühr. Dein Depot in Los Santos.', tags: 'trade republic broker aktien', cfg: { kinds: ['stock', 'etf'], marketLabel: 'Aktien & ETFs' } },
    { id: 'coinz', name: 'Coinz', cat: 'finance', icon: 'coin', engine: 'broker', featured: true, tint: Y, desc: 'Krypto kaufen, halten, verkaufen.', tags: 'crypto bitcoin binance', cfg: { kinds: ['crypto'], valueLabel: 'Wallet', marketLabel: 'Coins', tagline: 'Wallet' } },
    { id: 'fondz', name: 'Fondz', cat: 'finance', icon: 'wallet', engine: 'broker', tint: G, desc: 'ETF-Sparen leicht gemacht.', cfg: { kinds: ['etf'], marketLabel: 'ETFs' } },
    { id: 'rohstoffe', name: 'Rohstoffe', cat: 'finance', icon: 'medal', engine: 'broker', tint: A, desc: 'Gold, Silber, Öl und Gas handeln.', cfg: { kinds: ['commodity'], marketLabel: 'Rohstoffe' } },
    { id: 'chartview', name: 'Chartview', cat: 'finance', icon: 'candle', engine: 'chart', preinstalled: true, featured: true, tint: B, desc: 'Profi-Charts: Kerzen, Indikatoren, Preisalarme.', tags: 'tradingview charts', cfg: { tagline: 'Watchlist' } },
    { id: 'fxpro', name: 'FX Pro', cat: 'finance', icon: 'globe', engine: 'chart', tint: C, desc: 'Devisen-Charts für Forex-Trader.', cfg: { kinds: ['fx', 'commodity'], tagline: 'Forex' } },
    { id: 'rechnungen', name: 'Rechnungen', cat: 'finance', icon: 'receipt', engine: 'invoices', preinstalled: true, tint: W, desc: 'Rechnungen stellen und bezahlen.' },
    { id: 'budget', name: 'Budget', cat: 'finance', icon: 'wallet', engine: 'tracker', tint: G, desc: 'Haushaltsbuch für Einnahmen und Ausgaben.', cfg: { mode: 'money' } },
    { id: 'sparziel', name: 'Sparziele', cat: 'finance', icon: 'target', engine: 'tracker', tint: Y, cfg: { mode: 'goal' } },
    { id: 'kredit', name: 'Kreditrechner', cat: 'finance', icon: 'percent', engine: 'calc', tint: A, cfg: { inputs: [{ key: 'k', label: 'Kreditsumme (€)', value: 25000 }, { key: 'z', label: 'Zins p. a. (%)', value: 6.5 }, { key: 'n', label: 'Laufzeit (Monate)', value: 48 }], calc: ({ k, z, n }) => { if (![k, z, n].every(ok) || n <= 0) return null; const i = z / 1200; const r = i ? k * i / (1 - Math.pow(1 + i, -n)) : k / n; return [['Monatsrate', eur(r), true], ['Gesamt', eur(r * n)], ['Zinsen', eur(r * n - k)]]; } } },
    { id: 'zinseszins', name: 'Zinseszins', cat: 'finance', icon: 'pulse', engine: 'calc', tint: G, cfg: { inputs: [{ key: 's', label: 'Startkapital (€)', value: 1000 }, { key: 'm', label: 'Sparrate pro Monat (€)', value: 100 }, { key: 'z', label: 'Rendite p. a. (%)', value: 7 }, { key: 'j', label: 'Jahre', value: 10 }], calc: ({ s, m, z, j }) => { if (![s, m, z, j].every(ok)) return null; let v = s; const i = z / 1200; for (let k = 0; k < j * 12; k++) v = v * (1 + i) + m; const paid = s + m * j * 12; return [['Endkapital', eur(v), true], ['Eingezahlt', eur(paid)], ['Zinsertrag', eur(v - paid)]]; } } },
    { id: 'waehrung', name: 'Währungen', cat: 'finance', icon: 'swap', engine: 'calc', tint: C, cfg: { inputs: [{ key: 'v', label: 'Betrag', value: 100 }, { key: 'f', label: 'Von', options: ['EUR', 'USD', 'GBP', 'JPY', 'CHF'] }, { key: 't', label: 'Nach', options: ['USD', 'EUR', 'GBP', 'JPY', 'CHF'] }], calc: ({ v, f, t }) => { const r = { EUR: 1, USD: 1.0842, GBP: .8521, JPY: 164.1, CHF: .97 }; if (!ok(v)) return null; const x = v / r[f] * r[t]; return [[`${f} → ${t}`, `${n2(x)} ${t}`, true], ['Kurs', `1 ${f} = ${n2(r[t] / r[f], 4)} ${t}`]]; } } },
    { id: 'mwst', name: 'MwSt-Rechner', cat: 'finance', icon: 'receipt', engine: 'calc', tint: W, cfg: { inputs: [{ key: 'v', label: 'Betrag (€)', value: 100 }, { key: 'm', label: 'Betrag ist', options: ['Netto', 'Brutto'] }, { key: 's', label: 'Steuersatz (%)', value: 19 }], calc: ({ v, m, s }) => { if (![v, s].every(ok)) return null; const net = m === 'Netto' ? v : v / (1 + s / 100); return [['Brutto', eur(net * (1 + s / 100)), true], ['Netto', eur(net)], ['Steuer', eur(net * s / 100)]]; } } },

    /* ── Dienste ── */
    { id: 'notruf', name: 'Notruf 911', short: 'Notruf', cat: 'services', icon: 'shield', engine: 'services', preinstalled: true, tint: B, desc: 'Polizei rufen, mit Standort.', cfg: { service: 'police', title: 'Polizei', desc: 'Dein Notruf geht an alle Beamten im Dienst.', reasons: ['Überfall', 'Einbruch', 'Schüsse', 'Unfall', 'Verdächtige Person', 'Sonstiges'], cta: 'Notruf absetzen', urgent: true, anonOption: true } },
    { id: 'rettung', name: 'Rettungsdienst', short: 'Rettung', cat: 'services', icon: 'cross', engine: 'services', preinstalled: true, tint: R, desc: 'Rettungswagen und Notarzt.', cfg: { service: 'ambulance', title: 'Rettungsdienst', desc: 'Sanitäter im Dienst werden alarmiert.', reasons: ['Bewusstlos', 'Verletzt', 'Unfall', 'Atemnot', 'Sonstiges'], cta: 'Rettung rufen', urgent: true } },
    { id: 'feuerwehr', name: 'Feuerwehr', cat: 'services', icon: 'fire', engine: 'services', tint: A, cfg: { service: 'fire', title: 'Feuerwehr', desc: 'Brand, Rettung, technische Hilfe.', reasons: ['Feuer', 'Person eingeklemmt', 'Gefahrgut', 'Tierrettung'], cta: 'Feuerwehr rufen', urgent: true } },
    { id: 'pannenhilfe', name: 'Pannenhilfe', cat: 'services', icon: 'wrench', engine: 'services', preinstalled: true, tint: Y, desc: 'Mechaniker zu dir rufen.', cfg: { service: 'mechanic', title: 'Mechaniker', desc: 'Ein Mechaniker im Dienst meldet sich.', reasons: ['Panne', 'Reifen', 'Motor', 'Abschleppen', 'Tuning-Termin'] } },
    { id: 'ryde', name: 'Ryde', cat: 'services', icon: 'car', engine: 'services', preinstalled: true, tint: W, desc: 'Taxi und Fahrdienst per Fingertipp.', tags: 'uber taxi', cfg: { service: 'taxi', title: 'Ryde', desc: 'Fahrer in deiner Nähe bekommen deine Anfrage.', reasons: ['Standard', 'XL', 'Premium'], ph: 'Wohin soll es gehen?', cta: 'Fahrt anfragen' } },
    { id: 'abschlepp', name: 'Abschleppdienst', short: 'Abschlepp', cat: 'services', icon: 'hammer', engine: 'services', tint: A, cfg: { service: 'tow', title: 'Abschleppdienst', reasons: ['Falschparker', 'Unfallwagen', 'Panne'] } },
    { id: 'anwalt', name: 'Anwalt finden', short: 'Anwalt', cat: 'services', icon: 'scale', engine: 'services', tint: V, cfg: { service: 'lawyer', title: 'Kanzlei', desc: 'Anwälte im Dienst melden sich bei dir.', reasons: ['Festnahme', 'Vertrag', 'Beratung', 'Klage'] } },
    { id: 'justiz', name: 'Justiz', cat: 'services', icon: 'scale', engine: 'services', tint: W, cfg: { service: 'judge', title: 'Gericht', reasons: ['Termin', 'Genehmigung', 'Beschwerde'] } },
    { id: 'makler', name: 'Makler', cat: 'services', icon: 'key', engine: 'services', tint: G, cfg: { service: 'realestate', title: 'Immobilienmakler', reasons: ['Kaufen', 'Mieten', 'Verkaufen', 'Besichtigung'] } },
    { id: 'reporter', name: 'Weazel Tipps', short: 'News-Tipp', cat: 'services', icon: 'mic', engine: 'services', tint: R, cfg: { service: 'reporter', title: 'Redaktion', desc: 'Schick der Redaktion einen Hinweis.', reasons: ['Story', 'Unfall', 'Promi', 'Skandal'], anonOption: true } },

    /* ── Orte (GPS) ── */
    ...[
      ['tanken', 'Tankstellen', 'fuel', A], ['garagen', 'Garagen', 'key', W], ['kleidung', 'Kleidung', 'shirt', P], ['barber', 'Friseure', 'scissors', V], ['tattoo', 'Tattoo-Studios', 'pen', R],
      ['ammu', 'Ammu-Nation', 'target', '#a8a29e'], ['kliniken', 'Kliniken', 'cross', R], ['polizei', 'Polizei', 'shield', B], ['autohaus', 'Autohäuser', 'car', C], ['supermarkt', 'Supermärkte', 'cart', G],
      ['nightlife', 'Nightlife', 'glass', V], ['hotels', 'Hotels & Motels', 'bed', Y], ['fitness', 'Fitness', 'dumbbell', G], ['banken', 'Banken & ATMs', 'bank', P], ['sights', 'Sehenswürdigkeiten', 'star', Y],
      ['straende', 'Strände', 'sun', Y], ['flug', 'Flughäfen', 'plane', B], ['werkstatt', 'Werkstätten', 'wrench', A], ['sport', 'Sport & Freizeit', 'ball', C],
    ].map(([set, name, icon, tint]) => ({ id: 'p_' + set, name, cat: 'places', icon, engine: 'places', tint, cfg: { set }, preinstalled: ['tanken', 'kliniken', 'werkstatt'].includes(set), desc: `${name} in Los Santos mit GPS-Route.` })),

    /* ── Shopping ── */
    { id: 'kart', name: 'Kart', cat: 'shop', icon: 'cart', engine: 'shop', preinstalled: true, featured: true, tint: A, desc: 'Online bestellen, direkt ins Inventar.', tags: 'amazon', cfg: { banner: 'Prime-Lieferung gratis', bannerSub: 'Heute bestellt, sofort im Inventar', delivery: 'Lieferung direkt in dein Inventar.' } },
    { id: 'foodz', name: 'Foodz', cat: 'shop', icon: 'food', engine: 'shop', preinstalled: true, tint: R, desc: 'Essen bestellen.', tags: 'lieferando ubereats', cfg: { banner: 'Hungrig?', bannerSub: 'Burger Shot, Snacks & Drinks', cta: 'Bestellen', done: 'Dein Essen ist da. Guten Appetit!' } },
    { id: 'techstore', name: 'Digital Den', cat: 'shop', icon: 'cpu', engine: 'shop', tint: B, cfg: { banner: 'Neu: Zurex XR7 Ultra', bannerSub: 'Jetzt im Digital Den' } },
    { id: 'blumen', name: 'Blumen Express', short: 'Blumen', cat: 'shop', icon: 'leaf', engine: 'shop', tint: G, cfg: { banner: 'Für jemand Besonderen', bannerSub: 'Rosen, Tulpen, Teddys' } },
    { id: 'apotheke', name: 'Apotheke', cat: 'shop', icon: 'cross', engine: 'shop', tint: R },
    { id: 'baumarkt', name: 'Baumarkt', cat: 'shop', icon: 'hammer', engine: 'shop', tint: A },
    { id: 'kiosk', name: '24/7 Express', short: '24/7', cat: 'shop', icon: 'store', engine: 'shop', tint: G },
    { id: 'tuning', name: 'Tuning Shop', short: 'Tuning', cat: 'shop', icon: 'bolt', engine: 'shop', tint: C },

    /* ── Musik ── */
    { id: 'wave', name: 'Wave', cat: 'music', icon: 'headphones', engine: 'radio', preinstalled: true, featured: true, tint: P, desc: 'Generative Musik in 8 Sendern, lizenzfrei.', tags: 'spotify musik' },
    ...[['lofi', 'Lo-Fi Radio', V], ['synth', 'Synthwave FM', P], ['techno', 'Techno FM', C], ['ambient', 'Ambient', B], ['hiphop', 'Grove Street Radio', A], ['house', 'Del Perro House', Y], ['jazz', 'Smooth Jazz', W], ['chip', '8-Bit Radio', G]]
      .map(([st, name, tint]) => ({ id: 'radio_' + st, name, short: name.split(' ')[0], cat: 'music', icon: 'radio', engine: 'radio', tint, cfg: { station: st } })),
    { id: 'piano', name: 'Piano', cat: 'music', icon: 'piano', engine: 'instrument', tint: W, cfg: { kind: 'piano' } },
    { id: 'drumpad', name: 'Drumpad', cat: 'music', icon: 'drum', engine: 'instrument', tint: R, cfg: { kind: 'drums' } },
    { id: 'metronom', name: 'Metronom', cat: 'music', icon: 'timer', engine: 'instrument', tint: Y, cfg: { kind: 'metronome' } },
    { id: 'soundboard', name: 'Soundboard', cat: 'music', icon: 'speaker', engine: 'instrument', tint: V, cfg: { kind: 'soundboard' } },
    { id: 'rauschen', name: 'Rauschen', cat: 'music', icon: 'wave', engine: 'noise', tint: B, desc: 'Weißes, rosa und braunes Rauschen.' },

    /* ── Info ── */
    { id: 'zurexnews', name: 'Zurex News', short: 'News', cat: 'info', icon: 'news', engine: 'text', preinstalled: true, tint: R, desc: 'Nachrichten aus Los Santos.', cfg: { max: 1500, tagline: 'Schlagzeilen', fields: [{ key: 'title', label: 'Schlagzeile', required: true, max: 90 }], seed: [{ text: 'Die Stadt investiert in neue Straßenbeleuchtung entlang der Vespucci Blvd.', extra: { title: 'Mehr Licht für Vespucci' } }, { text: 'Am Wochenende werden bis zu 5.000 Besucher erwartet.', extra: { title: 'Carmeet-Rekord am Legion Square' } }, { text: 'Börse: Zurex-Aktie legt nach Quartalszahlen zu.', extra: { title: 'ZRX auf Rekordkurs' } }] } },
    { id: 'gesetzbuch', name: 'Gesetzbuch', cat: 'info', icon: 'scale', engine: 'docs', tint: W, cfg: { doc: 'law' } },
    { id: 'regeln', name: 'Server-Regeln', short: 'Regeln', cat: 'info', icon: 'book', engine: 'docs', preinstalled: true, tint: P, cfg: { doc: 'rules' } },
    { id: 'wiki', name: 'LS Wiki', cat: 'info', icon: 'globe', engine: 'docs', tint: B, cfg: { doc: 'wiki' } },
    { id: 'rezepte', name: 'Rezepte', cat: 'info', icon: 'food', engine: 'docs', tint: A, cfg: { doc: 'recipes' } },
    { id: 'erstehilfe', name: 'Erste Hilfe', cat: 'info', icon: 'cross', engine: 'docs', tint: R, cfg: { doc: 'firstaid' } },
    { id: 'fahrschule', name: 'Fahrschule', cat: 'info', icon: 'car', engine: 'docs', tint: C, cfg: { doc: 'driving' } },
    { id: 'jobsinfo', name: 'Jobs-Guide', short: 'Jobs', cat: 'info', icon: 'briefcase', engine: 'docs', tint: G, cfg: { doc: 'jobs' } },
    { id: 'faq', name: 'Hilfe & FAQ', short: 'Hilfe', cat: 'info', icon: 'comment', engine: 'docs', tint: W, cfg: { doc: 'faq' } },
    { id: 'horoskop', name: 'Horoskop', cat: 'info', icon: 'moon', engine: 'daily', tint: V, cfg: { kind: 'horoscope' } },
    { id: 'witze', name: 'Witze', cat: 'info', icon: 'sparkle', engine: 'daily', tint: Y, cfg: { kind: 'jokes' } },
    { id: 'zitate', name: 'Zitate', cat: 'info', icon: 'feather', engine: 'daily', tint: W, cfg: { kind: 'quotes' } },
    { id: 'fakten', name: 'Fun Facts', short: 'Fakten', cat: 'info', icon: 'brain', engine: 'daily', tint: C, cfg: { kind: 'facts' } },
    { id: 'sprueche', name: 'Anmachsprüche', short: 'Sprüche', cat: 'info', icon: 'heart', engine: 'daily', tint: R, cfg: { kind: 'lines' } },

    /* ── Quiz ── */
    ...[['lsquiz', 'LS-Quiz', 'ls', 'map', P], ['autoquiz', 'Auto-Quiz', 'cars', 'car', C], ['wissen', 'Allgemeinwissen', 'general', 'brain', V], ['geschichte', 'Geschichte', 'history', 'book', A], ['wissenschaft', 'Wissenschaft', 'science', 'sparkle', B], ['filmmusik', 'Film & Musik', 'media', 'film', R], ['geo', 'Geografie', 'geo', 'globe', G], ['mathesprint', 'Mathe-Sprint', 'math', 'calc', Y]]
      .map(([id, name, set, icon, tint]) => ({ id, name, cat: 'quiz', icon, engine: 'quiz', tint, cfg: { set }, preinstalled: id === 'lsquiz' })),

    /* ── Fitness ── */
    { id: 'schritte', name: 'Schritte', cat: 'health', icon: 'steps', engine: 'sensor', tint: G, cfg: { kind: 'steps' } },
    { id: 'wasser', name: 'Wasser', cat: 'health', icon: 'drop', engine: 'tracker', tint: B, cfg: { mode: 'counter', goal: 8, unit: 'Gläser', unitOne: 'Glas' } },
    { id: 'kaffee', name: 'Koffein', cat: 'health', icon: 'coffee', engine: 'tracker', tint: A, cfg: { mode: 'counter', goal: 3, unit: 'Tassen', unitOne: 'Tasse', max: 10 } },
    { id: 'pushups', name: 'Liegestütze', cat: 'health', icon: 'dumbbell', engine: 'tracker', tint: R, cfg: { mode: 'counter', goal: 50, unit: 'Wdh.', unitOne: '', max: 200 } },
    { id: 'atmen', name: 'Atmen', cat: 'health', icon: 'wind', engine: 'breathe', tint: C, cfg: { pattern: [4, 4, 4, 4] } },
    { id: 'meditation', name: 'Meditation', cat: 'health', icon: 'leaf', engine: 'breathe', tint: G, cfg: { pattern: [4, 7, 8, 0], hint: '4-7-8-Atmung: 4 ein, 7 halten, 8 aus.' } },
    { id: 'gewohnheiten', name: 'Gewohnheiten', cat: 'health', icon: 'check', engine: 'tracker', tint: Y, cfg: { mode: 'habit', seed: ['Training', 'Lesen', '8 Std. Schlaf'], ph: 'Neue Gewohnheit' } },
    { id: 'bmi', name: 'BMI', cat: 'health', icon: 'scale', engine: 'calc', tint: G, cfg: { inputs: [{ key: 'g', label: 'Größe (cm)', value: 180 }, { key: 'k', label: 'Gewicht (kg)', value: 78 }], calc: ({ g, k }) => { if (![g, k].every(ok) || g <= 0) return null; const b = k / Math.pow(g / 100, 2); return [['BMI', n2(b, 1), true], ['Einordnung', b < 18.5 ? 'Untergewicht' : b < 25 ? 'Normalgewicht' : b < 30 ? 'Übergewicht' : 'Adipositas']]; } } },
    { id: 'kalorien', name: 'Kalorienbedarf', short: 'Kalorien', cat: 'health', icon: 'fire', engine: 'calc', tint: A, cfg: { inputs: [{ key: 'a', label: 'Alter', value: 28 }, { key: 'g', label: 'Größe (cm)', value: 180 }, { key: 'k', label: 'Gewicht (kg)', value: 78 }, { key: 's', label: 'Geschlecht', options: ['Männlich', 'Weiblich'] }, { key: 'l', label: 'Aktivität', options: ['Wenig', 'Mittel', 'Viel'] }], calc: ({ a, g, k, s, l }) => { if (![a, g, k].every(ok)) return null; const bmr = 10 * k + 6.25 * g - 5 * a + (s === 'Männlich' ? 5 : -161); const f = { Wenig: 1.3, Mittel: 1.55, Viel: 1.8 }[l]; return [['Tagesbedarf', `${Math.round(bmr * f)} kcal`, true], ['Grundumsatz', `${Math.round(bmr)} kcal`], ['Zum Abnehmen', `${Math.round(bmr * f - 500)} kcal`]]; } } },

    /* ── Tools ── */
    { id: 'taschenlampe', name: 'Taschenlampe', short: 'Licht', cat: 'tools', icon: 'torch', engine: 'sensor', preinstalled: true, tint: W, cfg: { kind: 'flash' } },
    { id: 'kompass', name: 'Kompass', cat: 'tools', icon: 'compass', engine: 'sensor', preinstalled: true, tint: R, cfg: { kind: 'compass' } },
    { id: 'tacho', name: 'Tacho', cat: 'tools', icon: 'gauge', engine: 'sensor', tint: C, cfg: { kind: 'speed' } },
    { id: 'wasserwaage', name: 'Wasserwaage', short: 'Waage', cat: 'tools', icon: 'level', engine: 'sensor', tint: G, cfg: { kind: 'level' } },
    { id: 'stoppuhr', name: 'Stoppuhr', cat: 'tools', icon: 'timer', engine: 'clock', tint: A, cfg: { tab: 'sw' } },
    { id: 'timer', name: 'Timer', cat: 'tools', icon: 'timer', engine: 'clock', tint: Y, cfg: { tab: 'timer' } },
    { id: 'wecker', name: 'Wecker', cat: 'tools', icon: 'bell', engine: 'clock', tint: V, cfg: { tab: 'alarm' } },
    { id: 'weltuhr', name: 'Weltuhr', cat: 'tools', icon: 'globe', engine: 'clock', tint: B, cfg: { tab: 'world' } },
    { id: 'todo', name: 'To-do', cat: 'tools', icon: 'check', engine: 'tracker', preinstalled: true, tint: B, cfg: { mode: 'check', seed: ['Auto tanken', 'Miete überweisen'], ph: 'Neue Aufgabe' } },
    { id: 'einkauf', name: 'Einkaufsliste', short: 'Einkauf', cat: 'tools', icon: 'cart', engine: 'tracker', tint: G, cfg: { mode: 'check', seed: ['Wasser', 'Brot', 'Kaffee'], ph: 'Was brauchst du?' } },
    { id: 'packliste', name: 'Packliste', cat: 'tools', icon: 'bag', engine: 'tracker', tint: A, cfg: { mode: 'check', ph: 'Was kommt mit?' } },
    { id: 'wuerfel', name: 'Würfel', cat: 'tools', icon: 'dice', engine: 'random', tint: W, cfg: { kind: 'dice' } },
    { id: 'zufall', name: 'Zufallszahl', short: 'Zufall', cat: 'tools', icon: 'sparkle', engine: 'random', tint: V, cfg: { kind: 'number' } },
    { id: 'gluecksrad', name: 'Glücksrad', cat: 'tools', icon: 'target', engine: 'random', tint: P, cfg: { kind: 'wheel' } },
    { id: 'passwort', name: 'Passwort', cat: 'tools', icon: 'key', engine: 'random', tint: G, cfg: { kind: 'password' } },
    { id: 'muenze', name: 'Münzwurf', short: 'Münze', cat: 'tools', icon: 'coin', engine: 'random', tint: Y, cfg: { kind: 'coin' } },
    { id: 'zaehler', name: 'Zähler', cat: 'tools', icon: 'plus', engine: 'random', tint: C, cfg: { kind: 'counter' } },
    { id: 'morse', name: 'Morse', cat: 'tools', icon: 'wave', engine: 'random', tint: A, cfg: { kind: 'morse' } },
    { id: 'einheiten', name: 'Einheiten', cat: 'tools', icon: 'swap', engine: 'calc', tint: B, cfg: { inputs: [{ key: 'v', label: 'Wert', value: 100 }, { key: 'u', label: 'Umrechnung', options: ['km → mi', 'mi → km', 'kg → lb', 'lb → kg', '°C → °F', '°F → °C', 'l → gal', 'gal → l', 'km/h → mph', 'mph → km/h'] }], calc: ({ v, u }) => { if (!ok(v)) return null; const f = { 'km → mi': (x) => x / 1.609344, 'mi → km': (x) => x * 1.609344, 'kg → lb': (x) => x * 2.20462, 'lb → kg': (x) => x / 2.20462, '°C → °F': (x) => x * 9 / 5 + 32, '°F → °C': (x) => (x - 32) * 5 / 9, 'l → gal': (x) => x / 3.78541, 'gal → l': (x) => x * 3.78541, 'km/h → mph': (x) => x / 1.609344, 'mph → km/h': (x) => x * 1.609344 }[u]; return [[u, n2(f(v), 3), true]]; } } },
    { id: 'trinkgeld', name: 'Trinkgeld', cat: 'tools', icon: 'coin', engine: 'calc', tint: G, cfg: { inputs: [{ key: 'b', label: 'Rechnung (€)', value: 48 }, { key: 'p', label: 'Trinkgeld (%)', value: 10 }, { key: 'n', label: 'Personen', value: 2 }], calc: ({ b, p, n }) => { if (![b, p, n].every(ok) || n < 1) return null; const t = b * p / 100; return [['Pro Person', eur((b + t) / n), true], ['Trinkgeld', eur(t)], ['Gesamt', eur(b + t)]]; } } },
    { id: 'prozent', name: 'Prozent', cat: 'tools', icon: 'percent', engine: 'calc', tint: P, cfg: { inputs: [{ key: 'a', label: 'Grundwert', value: 250 }, { key: 'p', label: 'Prozent (%)', value: 15 }], calc: ({ a, p }) => { if (![a, p].every(ok)) return null; return [['Prozentwert', n2(a * p / 100), true], ['Plus', n2(a * (1 + p / 100))], ['Minus', n2(a * (1 - p / 100))]]; } } },
    { id: 'kraftstoff', name: 'Spritkosten', cat: 'tools', icon: 'fuel', engine: 'calc', tint: A, cfg: { inputs: [{ key: 'd', label: 'Strecke (km)', value: 120 }, { key: 'v', label: 'Verbrauch (l/100 km)', value: 8.5 }, { key: 'p', label: 'Preis pro Liter (€)', value: 1.79 }], calc: ({ d, v, p }) => { if (![d, v, p].every(ok)) return null; const l = d * v / 100; return [['Kosten', eur(l * p), true], ['Liter', n2(l, 1) + ' l']]; } } },
    { id: 'rabatt', name: 'Rabatt', cat: 'tools', icon: 'tag', engine: 'calc', tint: R, cfg: { inputs: [{ key: 'p', label: 'Preis (€)', value: 199 }, { key: 'r', label: 'Rabatt (%)', value: 25 }], calc: ({ p, r }) => { if (![p, r].every(ok)) return null; return [['Neuer Preis', eur(p * (1 - r / 100)), true], ['Ersparnis', eur(p * r / 100)]]; } } },
    { id: 'datumsrechner', name: 'Tage zählen', short: 'Tage', cat: 'tools', icon: 'calendar', engine: 'calc', tint: B, cfg: { inputs: [{ key: 'd', label: 'Tage ab heute', value: 30 }], calc: ({ d }) => { if (!ok(d)) return null; const t = new Date(Date.now() + d * 864e5); return [['Datum', t.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), true], ['Wochen', n2(d / 7, 1)]]; } } },
    { id: 'pomodoro', name: 'Fokus-Timer', short: 'Fokus', cat: 'tools', icon: 'target', engine: 'clock', tint: R, cfg: { tab: 'timer' } },

    /* ── Kreativ ── */
    { id: 'sketch', name: 'Sketch', cat: 'creative', icon: 'pen', engine: 'sketch', preinstalled: true, tint: P, desc: 'Zeichnen und in Fotos speichern.' },
    { id: 'pixel', name: 'Pixel Art', short: 'Pixel', cat: 'creative', icon: 'grid', engine: 'sketch', tint: V, cfg: { pixel: true } },
    { id: 'filmliste', name: 'Watchlist', cat: 'creative', icon: 'film', engine: 'tracker', tint: R, cfg: { mode: 'check', ph: 'Film oder Serie', seed: ['Vinewood Zombies', 'Meltdown'] } },
    { id: 'buchliste', name: 'Leseliste', cat: 'creative', icon: 'book', engine: 'tracker', tint: A, cfg: { mode: 'check', ph: 'Buchtitel' } },
    { id: 'geschenke', name: 'Geschenkideen', short: 'Geschenke', cat: 'creative', icon: 'gift', engine: 'tracker', tint: G, cfg: { mode: 'check', ph: 'Idee für …' } },
  ];

  /* ── Games (js/games.js) ── */
  const games = [
    ['snake', 'Snake', 'snake', G], ['g2048', '2048', 'grid', Y], ['flappy', 'Flappy Z', 'feather', P], ['blocks', 'Blocks', 'grid', C], ['minesweeper', 'Minen', 'bomb', W],
    ['tictactoe', 'Tic Tac Toe', 'grid', V], ['memory', 'Memory', 'cards', R], ['breakout', 'Breakout', 'ball', B], ['simon', 'Simon', 'sparkle', Y], ['reaction', 'Reaktion', 'bolt', A],
    ['whack', 'Hau den Maulwurf', 'hammer', A], ['clicker', 'Cash Clicker', 'coin', Y], ['kniffel', 'Kniffel', 'dice', W], ['galgen', 'Galgenmännchen', 'pen', W], ['wortel', 'Wortel', 'book', G],
    ['sudoku', 'Sudoku', 'grid', B], ['vier', 'Vier gewinnt', 'target', R], ['pong', 'Pong', 'ball', W], ['space', 'Space Shooter', 'rocket', V], ['stack', 'Stack Tower', 'level', P],
    ['ssp', 'Schere Stein Papier', 'scissors', C], ['hilo', 'Höher oder Tiefer', 'arrowUp', Y], ['schiebe', 'Schiebepuzzle', 'puzzle', A], ['lightsout', 'Lights Out', 'sun', Y], ['dodge', 'Dodge', 'bolt', R],
    ['farbflut', 'Farbflut', 'palette', P], ['zahlenjagd', 'Zahlenjagd', 'target', B], ['aim', 'Aim Trainer', 'target', R], ['tipptest', 'Tipp-Test', 'code', C],
  ].map(([g, name, icon, tint], i) => ({ id: g, name, cat: 'games', icon, engine: 'game', tint, cfg: { game: g }, preinstalled: i < 6, featured: g === 'snake' || g === 'g2048' }));
  const casino = [
    ['slots', 'Slots', 'sparkle', Y], ['blackjack', 'Blackjack', 'cards', G], ['roulette', 'Roulette', 'target', R], ['crash', 'Crash', 'rocket', A],
    ['minen', 'Minenfeld', 'bomb', V], ['plinko', 'Plinko', 'ball', P], ['rubbellos', 'Rubbellos', 'ticket', C], ['kopfzahl', 'Kopf oder Zahl', 'coin', Y],
  ].map(([g, name, icon, tint], i) => ({ id: g, name, cat: 'casino', icon, engine: 'game', tint, cfg: { game: g, casino: true }, preinstalled: i < 2, desc: 'Spielgeld-Chips, kein echtes Geld.' }));

  ZX.register([...apps, ...games, ...casino]);
})();
