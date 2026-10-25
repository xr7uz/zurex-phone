/*
 * Editable content for the info, daily and quiz apps. Server owners: adjust rules and laws here.
 * Format: sections[].body uses blank lines for paragraphs, "- " for lists and "## " for subheadings.
 */
window.ZX_DOCS = {
  rules: { tagline: 'Bitte lesen', intro: 'Diese Regeln gelten auf dem gesamten Server. Passe sie in html/data/docs.js an.', sections: [
    { title: 'Grundregeln', tag: '§1', body: 'Respektvoller Umgang mit allen Spielern ist Pflicht.\n\n- Kein Rassismus, keine Beleidigungen außerhalb des RP\n- Den Anweisungen des Teams ist Folge zu leisten\n- Bugs werden gemeldet, nicht ausgenutzt' },
    { title: 'Roleplay', tag: '§2', body: 'Bleib in deiner Rolle. Dein Charakter handelt realistisch und hat Angst um sein Leben.\n\n- Kein Powergaming und kein Metagaming\n- Fear RP: Bei vorgehaltener Waffe kooperierst du\n- New Life Rule: Nach dem Tod vergisst du die Situation' },
    { title: 'Kampf & Gewalt', tag: '§3', body: '- Kein RDM (Random Deathmatch)\n- Kein VDM (Vehicle Deathmatch)\n- Überfälle brauchen eine RP-Einleitung\n- Mindestens 4 Polizisten im Dienst für große Raubzüge' },
    { title: 'Fahrzeuge', tag: '§4', body: '- Realistisches Fahren in der Stadt\n- Kein Offroad mit Supersportwagen\n- Fahrzeuge nicht als Waffe benutzen' },
    { title: 'Handy & Social Media', tag: '§5', body: 'Das Zurex Phone ist Teil des Roleplays. Posts auf Flick, Chirp und Reelz sind ingame-öffentlich.\n\n- Keine OOC-Inhalte in Social Apps\n- Kein Spam in Stadtfunk und Hubb\n- Darkchat nur für RP-Zwecke' },
    { title: 'Sanktionen', tag: '§6', body: 'Verstöße führen je nach Schwere zu Verwarnung, Kick, temporärem oder permanentem Ausschluss. Entscheidungen des Teams sind bindend; Einspruch über den Support-Kanal.' },
  ] },
  law: { tagline: 'StGB Los Santos', intro: 'Bußgelder und Haftzeiten sind Richtwerte für das Roleplay.', sections: [
    { title: 'Verkehrsdelikte', tag: 'V', body: '- Geschwindigkeitsüberschreitung: 250–1.500 €\n- Rotlichtverstoß: 400 €\n- Fahren ohne Führerschein: 2.500 €\n- Unfallflucht: 5.000 € und 10 Monate\n- Illegales Straßenrennen: 7.500 € und Beschlagnahme' },
    { title: 'Eigentumsdelikte', tag: 'E', body: '- Diebstahl: 1.500 € und 5 Monate\n- Fahrzeugdiebstahl: 4.000 € und 15 Monate\n- Einbruch: 6.000 € und 20 Monate\n- Bankraub: 25.000 € und 60 Monate' },
    { title: 'Gewaltdelikte', tag: 'G', body: '- Körperverletzung: 3.000 € und 10 Monate\n- Bewaffneter Überfall: 10.000 € und 30 Monate\n- Geiselnahme: 20.000 € und 45 Monate\n- Mord: 50.000 € und 120 Monate' },
    { title: 'Waffen & Drogen', tag: 'W', body: '- Illegaler Waffenbesitz: 8.000 € und 20 Monate\n- Besitz geringer Mengen: 1.000 €\n- Handel: 15.000 € und 40 Monate' },
    { title: 'Rechte bei Festnahme', tag: 'R', body: 'Jede festgenommene Person hat das Recht zu schweigen, einen Anwalt zu verlangen und über den Tatvorwurf informiert zu werden. Den Anwalt erreichst du über die App „Anwalt finden“.' },
  ] },
  wiki: { tagline: 'Alles über Los Santos', sections: [
    { title: 'Los Santos', body: 'Die größte Stadt im Bundesstaat San Andreas: Strände, Hollywood-Glamour in Vinewood und das Bankenviertel Downtown.\n\n## Viertel\n- Vinewood: Studios und Villen\n- Vespucci: Strand und Kanäle\n- Davis & Strawberry: der Süden\n- Rockford Hills: Luxus-Shopping' },
    { title: 'Blaine County', body: 'Das ländliche Umland nördlich der Stadt: Sandy Shores am Alamo Sea, Grapeseed mit seinen Farmen und Paleto Bay ganz im Norden.' },
    { title: 'Mount Chiliad', body: 'Der höchste Berg von San Andreas. Seilbahn, Wanderwege und angeblich so manches Geheimnis.' },
    { title: 'Wirtschaft', body: 'Die großen Arbeitgeber: Maze Bank, Fleeca, GoPostal, Weazel News und natürlich Zurex Technologies. Kurse findest du in Märkte, Tradr und Chartview.' },
    { title: 'Verkehr', body: 'Wichtige Routen: Del Perro Freeway, Great Ocean Highway und Senora Freeway. Der LSIA verbindet die Stadt mit der Welt.' },
  ] },
  recipes: { tagline: 'Kochen wie ein Profi', sections: [
    { title: 'Pasta Aglio e Olio', tag: '15′', body: '## Zutaten\n- 200 g Spaghetti\n- 4 Knoblauchzehen\n- 1 Chili\n- Olivenöl, Petersilie\n\n## Zubereitung\nNudeln kochen. Knoblauch und Chili in Öl anschwitzen, Nudeln dazu, mit Petersilie servieren.' },
    { title: 'Burger wie bei Burger Shot', tag: '25′', body: '## Zutaten\n- 150 g Rinderhack\n- Brioche-Bun, Cheddar, Salat, Tomate\n\n## Zubereitung\nPatty formen, scharf anbraten, Käse schmelzen, alles schichten.' },
    { title: 'Tacos al Pastor', tag: '40′', body: 'Schweinefleisch mit Chili und Ananas marinieren, scharf anbraten, in Maistortillas mit Zwiebel und Koriander servieren.' },
    { title: 'Smoothie Bowl', tag: '5′', body: 'Gefrorene Beeren mit Banane und Joghurt mixen, mit Granola und Früchten toppen.' },
  ] },
  firstaid: { tagline: 'Im Notfall: 911', sections: [
    { title: 'Notruf absetzen', tag: '!', body: 'Öffne die App Rettungsdienst, wähle das Anliegen und sende deinen Standort mit.\n\n- Wo ist es passiert?\n- Was ist passiert?\n- Wie viele Verletzte?' },
    { title: 'Stabile Seitenlage', tag: '1', body: 'Bei Bewusstlosigkeit mit Atmung: Person auf die Seite drehen, Kopf überstrecken, Mund leicht geöffnet.' },
    { title: 'Herz-Lungen-Wiederbelebung', tag: '2', body: '30-mal fest in der Brustmitte drücken, 2-mal beatmen. Bis der Rettungsdienst übernimmt.' },
    { title: 'Blutungen stillen', tag: '3', body: 'Druck auf die Wunde, Druckverband anlegen, betroffene Stelle hochlagern.' },
  ] },
  driving: { tagline: 'Theorie-Check', sections: [
    { title: 'Geschwindigkeiten', body: '- Innerorts: 50 km/h\n- Landstraße: 100 km/h\n- Freeway: 130 km/h' },
    { title: 'Vorfahrt', body: 'Rechts vor links, sofern nicht anders geregelt. Einsatzfahrzeuge mit Blaulicht haben immer Vorrang: rechts ranfahren.' },
    { title: 'Führerscheinklassen', body: '- B: Pkw\n- A: Motorrad\n- C: Lkw\n- Pilotenschein: Flugzeuge und Helikopter' },
  ] },
  jobs: { tagline: 'Geld verdienen', sections: [
    { title: 'Mechaniker', body: 'Reparieren, tunen, abschleppen. Aufträge kommen über die App Pannenhilfe.' },
    { title: 'Taxi & Ryde', body: 'Fahrgäste anfragen über Ryde. Gute Bewertungen bringen mehr Trinkgeld.' },
    { title: 'Polizei & Rettungsdienst', body: 'Bewerbung im Hubb-Kanal der Fraktion. Einsätze kommen über Notruf und Rettungsdienst.' },
    { title: 'Selbstständig', body: 'Eigene Firma in den Gelben Seiten eintragen, Rechnungen über die App Rechnungen stellen.' },
  ] },
  faq: { tagline: 'Zurex Phone', sections: [
    { title: 'Wie installiere ich Apps?', body: 'Öffne den Zurex Store, wähle eine App und tippe auf Laden. Sie erscheint auf deinem Homescreen und in der App-Mediathek ganz rechts.' },
    { title: 'Wie wechsle ich die Seiten?', body: 'Wische auf dem Homescreen nach links und rechts. Die letzte Seite ist die App-Mediathek mit Suche.' },
    { title: 'Ist das Casino echtes Geld?', body: 'Nein. Casino-Games nutzen Chips. Jeden Tag gibt es Gratis-Chips.' },
    { title: 'Warum sehe ich meine Aktien nicht in Coinz?', body: 'Tradr zeigt Aktien und ETFs, Coinz zeigt Krypto. Dein Depot ist aber dasselbe Konto.' },
    { title: 'Wie teile ich meinen Standort?', body: 'Kontakte öffnen, Person wählen, „Standort“ tippen. Der Empfänger kann eine Route setzen.' },
  ] },
};

window.ZX_DAILY = {
  signs: [['Widder', '♈'], ['Stier', '♉'], ['Zwillinge', '♊'], ['Krebs', '♋'], ['Löwe', '♌'], ['Jungfrau', '♍'], ['Waage', '♎'], ['Skorpion', '♏'], ['Schütze', '♐'], ['Steinbock', '♑'], ['Wassermann', '♒'], ['Fische', '♓']],
  horo: {
    mood: ['Heute bist du voller Energie.', 'Ein ruhiger Tag tut dir gut.', 'Jemand denkt gerade an dich.', 'Vertrau deinem Bauchgefühl.', 'Eine Begegnung überrascht dich.', 'Geduld zahlt sich heute aus.'],
    love: ['In der Liebe lohnt sich ein offenes Wort.', 'Ein Date am Pier könnte Funken schlagen.', 'Single? Schau mal auf Spark.', 'Zeig Zuneigung mit einer kleinen Geste.', 'Lass Vergangenes los.'],
    money: ['Finanziell: Finger weg von riskanten Coins.', 'Eine Investition in dich selbst lohnt sich.', 'Ein unerwarteter Bonus ist drin.', 'Spar heute lieber.', 'Gute Zeit für Tradr, aber mit Plan.'],
    colors: ['Pink', 'Türkis', 'Gold', 'Schwarz', 'Violett', 'Weiß'],
  },
  jokes: ['Warum können Geister so schlecht lügen? Weil man durch sie hindurchsieht.', 'Treffen sich zwei Magneten. Sagt der eine: „Was soll ich heute bloß anziehen?“', 'Was macht ein Pirat am Computer? Er drückt die Enter-Taste.', 'Wie nennt man einen Bumerang, der nicht zurückkommt? Stock.', 'Warum ging der Pilz auf jede Party? Weil er ein Champignon war.', 'Was sagt ein Gen, wenn es ein anderes trifft? Halli-Gen!', 'Warum stehen Mechaniker so früh auf? Damit sie früher an den Wagen können.', 'Was ist rot und schlecht für die Zähne? Ein Ziegelstein.'],
  quotes: ['Wer nie anfängt, kommt nie an.', 'Kleine Schritte sind auch Schritte.', 'Mut ist, Angst zu haben und es trotzdem zu tun.', 'Heute ist ein guter Tag, um etwas zu wagen.', 'Ruhe ist auch eine Antwort.', 'Erfolg ist die Summe kleiner Gewohnheiten.', 'Der beste Zeitpunkt war gestern. Der zweitbeste ist jetzt.', 'Sei die Person, die du gebraucht hättest.'],
  facts: ['Honig verdirbt praktisch nie.', 'Oktopusse haben drei Herzen.', 'Ein Tag auf der Venus ist länger als ein Jahr auf der Venus.', 'Bananen sind botanisch Beeren, Erdbeeren nicht.', 'Der Eiffelturm ist im Sommer bis zu 15 cm höher.', 'Kühe haben beste Freunde.', 'Haie gab es schon vor den Bäumen.', 'Ein Blitz ist fünfmal heißer als die Sonnenoberfläche.'],
  lines: ['Bist du ein Parkverbot? Ich bekomm dich nicht aus dem Kopf.', 'Hast du ein Pflaster? Ich hab mir gerade das Knie aufgeschlagen, als ich für dich gefallen bin.', 'Bist du WLAN? Ich spüre eine Verbindung.', 'Wenn du ein Auto wärst, wärst du ein Zentorno: selten und atemberaubend.', 'Ist hier warm oder liegt das an dir?'],
};

window.ZX_QUIZ = {
  ls: [
    { q: 'Wie heißt der höchste Berg in San Andreas?', a: ['Mount Chiliad', 'Mount Gordo', 'Mount Josiah', 'Vinewood Hills'] },
    { q: 'In welchem Viertel liegt der Pier mit Riesenrad?', a: ['Del Perro', 'Vespucci', 'Paleto Bay', 'Sandy Shores'] },
    { q: 'Wie heißt der Flughafen von Los Santos?', a: ['LSIA', 'LAX', 'SAIA', 'Sandy Airfield'] },
    { q: 'Welcher See liegt bei Sandy Shores?', a: ['Alamo Sea', 'Lago Zancudo', 'Land Act Reservoir', 'Cassidy Lake'] },
    { q: 'Wie heißt die Burgerkette in Los Santos?', a: ['Burger Shot', 'Burger King', 'Cluckin Burger', 'Bean Burger'] },
    { q: 'Welche Bank hat den Tower in Downtown?', a: ['Maze Bank', 'Fleeca', 'Pacific Standard', 'Blaine County'] },
    { q: 'Wo liegt das Pillbox Medical Center?', a: ['Pillbox Hill', 'Paleto Bay', 'Davis', 'Rockford Hills'] },
    { q: 'Was steht in großen Buchstaben über der Stadt?', a: ['VINEWOOD', 'LOS SANTOS', 'HOLLYWOOD', 'SAN ANDREAS'] },
    { q: 'Wie heißt das Observatorium?', a: ['Galileo', 'Griffith', 'Kepler', 'Newton'] },
    { q: 'Welche Straße führt am Strand entlang?', a: ['Great Ocean Highway', 'Senora Freeway', 'Route 68', 'Joshua Road'] },
    { q: 'Wie heißt das Waffengeschäft?', a: ['Ammu-Nation', 'Gun Club', 'Arms Depot', 'Bullet Shop'] },
    { q: 'Wie heißt der Kaffeeladen?', a: ['Bean Machine', 'Coffee Shot', 'Starbeans', 'Java Joe'] },
  ],
  cars: [
    { q: 'Wie viele Räder hat ein Motorrad?', a: ['2', '3', '4', '1'] },
    { q: 'Wofür steht PS?', a: ['Pferdestärke', 'Power Speed', 'Prozent Schub', 'Pro Sekunde'] },
    { q: 'Was macht ein Turbolader?', a: ['Mehr Luft in den Motor drücken', 'Bremsen kühlen', 'Reifen aufpumpen', 'Abgase filtern'] },
    { q: 'Welcher Kraftstoff hat die höhere Klopffestigkeit?', a: ['Super Plus', 'Super E10', 'Diesel', 'Normal'] },
    { q: 'Was bedeutet ABS?', a: ['Antiblockiersystem', 'Auto-Brems-Service', 'Abstandsbremssystem', 'Anti-Bump-System'] },
    { q: 'Wie viele Zylinder hat ein V8?', a: ['8', '6', '10', '4'] },
    { q: 'Wo sitzt beim Mittelmotor der Motor?', a: ['Vor der Hinterachse', 'Vorne', 'Im Kofferraum', 'Unter dem Fahrer'] },
    { q: 'Welches Pedal ist ganz links bei Schaltwagen?', a: ['Kupplung', 'Bremse', 'Gas', 'Handbremse'] },
    { q: 'Was misst ein Drehzahlmesser?', a: ['Motorumdrehungen', 'Geschwindigkeit', 'Öldruck', 'Tankinhalt'] },
    { q: 'Was ist Drift?', a: ['Kontrolliertes Übersteuern', 'Untersteuern', 'Vollbremsung', 'Aquaplaning'] },
  ],
  general: [
    { q: 'Wie viele Kontinente gibt es?', a: ['7', '5', '6', '8'] },
    { q: 'Was ist die Hauptstadt von Australien?', a: ['Canberra', 'Sydney', 'Melbourne', 'Perth'] },
    { q: 'Wie viele Minuten hat ein Tag?', a: ['1440', '1200', '1600', '960'] },
    { q: 'Welches Tier ist das größte der Welt?', a: ['Blauwal', 'Elefant', 'Giraffe', 'Weißer Hai'] },
    { q: 'Wie viele Saiten hat eine Gitarre normalerweise?', a: ['6', '4', '5', '8'] },
    { q: 'Was ist H2O?', a: ['Wasser', 'Wasserstoff', 'Salz', 'Sauerstoff'] },
    { q: 'Wie viele Spieler hat ein Fußballteam auf dem Feld?', a: ['11', '10', '9', '12'] },
    { q: 'Welche Farbe entsteht aus Blau und Gelb?', a: ['Grün', 'Lila', 'Orange', 'Braun'] },
    { q: 'Wie viele Tage hat ein Schaltjahr?', a: ['366', '365', '364', '367'] },
    { q: 'Welches Organ pumpt Blut?', a: ['Herz', 'Lunge', 'Leber', 'Niere'] },
  ],
  history: [
    { q: 'In welchem Jahr fiel die Berliner Mauer?', a: ['1989', '1991', '1985', '1961'] },
    { q: 'Wer war der erste Mensch auf dem Mond?', a: ['Neil Armstrong', 'Buzz Aldrin', 'Juri Gagarin', 'John Glenn'] },
    { q: 'Welches Reich bauten die Pyramiden von Gizeh?', a: ['Ägypten', 'Rom', 'Persien', 'Griechenland'] },
    { q: 'Wann begann der Erste Weltkrieg?', a: ['1914', '1918', '1939', '1905'] },
    { q: 'Wer erfand den Buchdruck mit beweglichen Lettern in Europa?', a: ['Gutenberg', 'Luther', 'Da Vinci', 'Newton'] },
    { q: 'In welcher Stadt stand das Kolosseum?', a: ['Rom', 'Athen', 'Paris', 'Kairo'] },
    { q: 'Wann wurde die Bundesrepublik Deutschland gegründet?', a: ['1949', '1945', '1990', '1955'] },
    { q: 'Wer entdeckte 1492 Amerika (aus europäischer Sicht)?', a: ['Kolumbus', 'Magellan', 'Vespucci', 'Cook'] },
  ],
  science: [
    { q: 'Was ist das chemische Symbol für Gold?', a: ['Au', 'Ag', 'Go', 'Gd'] },
    { q: 'Wie schnell ist Licht ungefähr?', a: ['300.000 km/s', '30.000 km/s', '3.000 km/s', '1.000.000 km/s'] },
    { q: 'Welcher Planet ist der Sonne am nächsten?', a: ['Merkur', 'Venus', 'Mars', 'Erde'] },
    { q: 'Wie viele Knochen hat ein Erwachsener etwa?', a: ['206', '180', '250', '300'] },
    { q: 'Was misst man in Hertz?', a: ['Frequenz', 'Kraft', 'Spannung', 'Masse'] },
    { q: 'Welches Gas atmen Pflanzen ein?', a: ['CO₂', 'O₂', 'N₂', 'H₂'] },
    { q: 'Bei wie viel Grad siedet Wasser auf Meereshöhe?', a: ['100 °C', '90 °C', '120 °C', '80 °C'] },
    { q: 'Was ist die kleinste Einheit des Lebens?', a: ['Zelle', 'Atom', 'Molekül', 'Organ'] },
  ],
  media: [
    { q: 'Wie viele Noten hat eine Oktave?', a: ['8', '7', '12', '10'] },
    { q: 'Welches Instrument hat 88 Tasten?', a: ['Klavier', 'Orgel', 'Akkordeon', 'Cembalo'] },
    { q: 'Was bedeutet BPM?', a: ['Beats pro Minute', 'Bass pro Mix', 'Band Play Mode', 'Beat Pitch Meter'] },
    { q: 'Wie heißt das Filmviertel in Los Santos?', a: ['Vinewood', 'Hollywood', 'Bollywood', 'Studio City'] },
    { q: 'Welches Genre hat typischerweise 120–130 BPM?', a: ['House', 'Hip-Hop', 'Ambient', 'Ballade'] },
    { q: 'Was ist ein Soundtrack?', a: ['Filmmusik', 'Ein Lautsprecher', 'Eine Gesangstechnik', 'Ein Mikrofon'] },
  ],
  geo: [
    { q: 'Welcher ist der längste Fluss Europas?', a: ['Wolga', 'Donau', 'Rhein', 'Elbe'] },
    { q: 'Welches Land hat die meisten Einwohner?', a: ['Indien', 'China', 'USA', 'Indonesien'] },
    { q: 'Wo liegt der Mount Everest?', a: ['Himalaya', 'Alpen', 'Anden', 'Rocky Mountains'] },
    { q: 'Was ist die Hauptstadt von Kanada?', a: ['Ottawa', 'Toronto', 'Vancouver', 'Montreal'] },
    { q: 'Welcher Ozean ist der größte?', a: ['Pazifik', 'Atlantik', 'Indischer Ozean', 'Arktischer Ozean'] },
    { q: 'In welchem Land liegt Machu Picchu?', a: ['Peru', 'Mexiko', 'Chile', 'Bolivien'] },
    { q: 'Welche Wüste ist die größte heiße Wüste?', a: ['Sahara', 'Gobi', 'Atacama', 'Kalahari'] },
    { q: 'Welches Land hat die Form eines Stiefels?', a: ['Italien', 'Spanien', 'Griechenland', 'Portugal'] },
  ],
  math: Array.from({ length: 60 }, () => {
    const op = ['+', '−', '×'][Math.floor(Math.random() * 3)];
    const a = 2 + Math.floor(Math.random() * (op === '×' ? 12 : 90)), b = 2 + Math.floor(Math.random() * (op === '×' ? 12 : 90));
    const r = op === '+' ? a + b : op === '−' ? a - b : a * b;
    const wrong = new Set(); while (wrong.size < 3) { const w = r + (Math.floor(Math.random() * 11) - 5) * (op === '×' ? 2 : 1); if (w !== r) wrong.add(w); }
    return { q: `${a} ${op} ${b} = ?`, a: [String(r), ...[...wrong].map(String)] };
  }),
};
