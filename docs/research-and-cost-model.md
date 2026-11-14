# Musterteil LAB — Recherche, Preisannahmen und Grenzen
Stand der Recherche: 14. November 2026

## Vergleich mit Open-Source-Projekten

- [PrintMetric](https://github.com/theo79/printmetric) — statische Kostenkalkulation, Kosten für Maschine, Strom und Fehldrucke, sowie frei wählbarer Mindestansatz. Ansatz als konzeptionelles Vorbild genutzt; kein Programmcode kopiert.
- [Small Hours Print Cost Calculator](https://github.com/smallhours-tools/print-cost-calculator) — rein clientseitige Analyse aus bereits geslicten G-code-, 3MF- und weiteren Dateien; Printzeit und Grammzahlen aus Metadaten statt ungeprüfter Schätzwerte.
- [Kiri:Moto / GridSpace](https://github.com/GridSpace/grid-apps), [API-Dokumentation](https://docs.grid.space/kiri-moto/apis/) — kostenloses offenes browserbasiertes FDM-Slicing. Die optionale Kiri-Integration ist bereits im Projekt; ihre externe Erreichbarkeit sowie verlässliche Stützmarkierungen bleiben unbestätigt.
- [SLAcer.js](https://github.com/skarab42/SLAcer.js) — browserbasierte STL-Darstellung, Slicing-Interaktionen und Maßangaben; für Resin/SLA, **nicht** als drop-in-Ersatz für unseren FDM-Slicer geeignet.
- [SuperSlice](https://github.com/bintangtimurlangit/superslice) — PrusaSlicer-basierter Server für genauere Toolpath-Kalkulation; wegen Serverbetrieb, Upload und möglicher Kosten **nicht** übernommen.
- [TimBossuyt/GcodeAnalyzer](https://github.com/TimBossuyt/GcodeAnalyzer) — Beispiel für Offline-Slicer und Auswertung von Extrusionsmenge und Zeit; konzeptionell hilfreich.

## Zehn Materialreferenzen

Die Datei `prices.json` enthält einen **datierten, manuell recherchierten** EUR/kg-Wert und einen Produktlink für jede Materialvariante:

| Variante | EUR/kg (Beispielreferenz) | Quelle |
| --- | ---: | --- |
| ABS | 25,99 | Bambu EU Filament-Bundles (Einzelspulen-Listenwert) |
| PLA Basic | 25,99 | Bambu EU Filament-Bundles (Einzelspulen-Listenwert) |
| PETG HF | 25,99 | Bambu EU Filament-Bundles (Einzelspulen-Listenwert) |
| PLA Matte | 25,99 | Bambu EU Filament-Bundles (Einzelspulen-Listenwert) |
| PETG Translucent | 25,99 | Bambu EU Filament-Bundles (Einzelspulen-Listenwert) |
| PLA Silk+ | 25,99 | Bambu EU Filament-Bundles |
| ASA | 24,99 | Bambu EU ASA Produktseite (Aktionspreis möglich) |
| TPU 95A HF | 34,99 | Bambu EU TPU Produktseite (Aktionspreis möglich) |
| PC | 42,99 | Bambu EU PC Produktseite |
| PETG-CF | 35,99 | Bambu EU PETG-CF Produktseite (Aktions-/Variantenpreis möglich) |

Die Quelle für jede Zeile ist über den Preislink der Oberfläche erreichbar. Einzel-/Refill-/Aktionsvarianten und Lagerbestand können die tatsächlichen Preise verändern. Das Datum ist ein **Recherchezeitpunkt**, kein Nachweis eines Live-Shopabrufs beim Endnutzer. Ein vollständig serverloser GitHub-Pages-Client darf wegen CORS/Shop-AGB nicht einfach verlässlich Händlerseiten automatisch abfragen. Statt einer Schein-Liveabfrage gibt es einen externen Originalquellenlink und datierte Werte; keine kostenpflichtigen APIs und keine geplanten GitHub Actions.

## Rechenmodell

Die technische Basiskalkulation:
- Filamentkosten = (Modellmasse + Stützmasse) in g / 1000 × Referenz-EUR/kg
- Stromkosten = geschätzte Stunden × 0,2 kW × 0,35 EUR/kWh

Das **nichtkommerzielle Vergleichsszenario** addiert ausdrücklich als frei gewählte Annahmen:
- Gerätenutzung: 1,10 EUR/h
- Vorbereitung: 2,50 EUR
- mit Stützen: 1,25 EUR weitere Nacharbeit
- Ausgleich auf mindestens 12 EUR, falls die obigen Komponenten darunter liegen.

Das ist **kein Verkaufspreis**, **keine Schätzung der tatsächlich angefallenen Kosten**, **kein marktüblicher Tarif**, und es gibt weder einen Auftrag noch eine Zahlungsfunktion. Der Benutzerwunsch nach einem Wert um mindestens 12 EUR wird deshalb nachvollziehbar als hypothetische Szenariogrenze statt als unerklärlicher Aufschlag umgesetzt.

## Slicing und Stützstrukturen

- STL wird ausschließlich lokal geparst und als echtes Three.js-Mesh angezeigt.
- Geometrie-Fallback: Flächen/Volumen, Materialdichte, Infill und überhangbasierte Stützschätzung. Bei nicht wasserdichten Netzen besteht größere Unsicherheit.
- Optionales Kiri:Moto-Slicing: G-Code-Extrusionsbefehle liefern Materialvolumen/Masse. Stützanteil basiert, soweit vorhanden, auf expliziten Feature-Markierungen, sonst auf Konturen oder Geometrie; die Oberfläche benennt das Verfahren.
- Druckzeit wird selbst mit G-Code nur näherungsweise modelliert (Aufheizen, Beschleunigung, Maschinenprofil).
- Werden externe JavaScript-Module von grid.space geladen, überträgt der Browser die IP-Adresse; die STL-Datei wird nicht als Upload an einen Shop übertragen.

## Video und Gestaltung

Vorhandener lokaler Clip: `assets/video/bg-lab.mp4`, CC0, drei Sekunden, aus Blender gerendert. Zurückhaltende echte lokale Medien statt externer Video-Tracking-Einbindungen. Am 14. November 2026 wurde die Darstellung visuell heller, kontrastreicher und orangefarben gemacht; WebGL-Material und Beleuchtung wurden angepasst. Das ist **noch keine echte Kameraaufnahme**. Passende real gefilmte Clips, nur zur späteren Prüfung und mit Lizenznachweis:
- https://www.pexels.com/video/precision-orange-3d-printer-in-workshop-setting-31076271/
- https://www.pexels.com/video/3d-printer-printing-855255/

Keine dieser externen Filmdateien wurde ungeprüft eingebettet oder als lokale Videodatei ausgegeben. Ein Ersatz muss vorab korrekt lizenziert, heruntergeladen, zugeschnitten und als lokaler MP4 ins Repository übernommen werden.

## Rechtliches

- Keine kommerzielle Bestellung, keine Bezahlung, kein Warenkorb, kein Vertragsabschluss, keine Fertigungszusage.
- Sichtbare Hinweise und Informationsdialoge ersetzen keine rechtliche Prüfung.
- Die Impressum-Platzhalter müssen mit echten Angaben ergänzt werden. Nach den Hinweisen der [Landesanstalt für Medien NRW](https://www.medienanstalt-nrw.de/aufsicht/transparenz-im-internet.html) kann auch ein öffentliches nicht entgeltliches Angebot informationspflichtig sein.
- [Bundesportal](https://verwaltung.bund.de/leistungsverzeichnis/DE/leistung/99000000025492/herausgeber/BY-25492/region/09): Kostenfreier Zugang schließt Informationspflichten nicht automatisch aus.
- Ob eine private Studienwebsite unter aufenthaltsrechtliche Erwerbstätigkeitsvorschriften fällt, lässt sich nicht allein durch Disclaimer zuverlässig entscheiden.
- Keine Rechtsberatung und keine Zusicherung vollständiger Compliance.

## Teststatus

Die direkte Source-Code-Prüfung nach der Änderung umfasst Syntaxprüfung der Scriptstruktur, Konsistenz der zehn Materialschlüssel, vorhandene DOM-Ziele, Trennung von Rohkosten und Mindestvergleichswert sowie rechtsklaren Text. Eine erneute vollständige Browser-/Responsive-/Slicer-Integrationstestserie ist in dieser Änderungssitzung noch nicht durchgeführt worden; daher keine Behauptung, dass alle Viewports und der reale Kiri-Motor auf dem Livesystem bereits verifiziert seien.
