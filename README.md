# Musterteil LAB

Eine einzelne statische HTML-Seite für eine nichtkommerzielle, studentische Druckkostenschätzung. Lokale STL-Analyse, interaktive Three.js-Ansicht und transparente Material-/Stromkosten. Keine Bestellungen, Konten, Zahlungen, Tracker oder Cookies.

## Lokal entwickeln

Voraussetzungen: Node.js ab 22 und Python 3. Kein Build erforderlich; die Website benötigt zur Laufzeit keine npm-Installation. Three.js 0.180.0 samt STLLoader und OrbitControls liegt lokal unter `assets/vendor/three` (MIT).

```sh
npm ci                         # nur für die Browser-Testwerkzeuge
npm run dev                    # statischer Server, Port 8765
npm test                       # 10 Tests für STL, Verbrauch und G-Code
npm run test:browser            # bei laufendem Server
```

Die Browser-Prüfung verwendet `/usr/bin/chromium`, alternativ `CHROMIUM_PATH` oder den von Playwright installierten Chromium. Falls keiner vorhanden ist: `npx playwright install chromium`. `TEST_BASE_URL` kann den Standard-Testserver überschreiben. Sie prüft die Desktop-Ansicht bei 1280×720, 1366×768, 1440×900 und 1920×1080 sowie 390×844 auf dem Smartphone; außerdem Binär-/ASCII-Upload, Drag-and-drop, echte Geometrie, Orbit/Zoom/Reset bei angehaltenem Hintergrundvideo, Drahtgitter, Kostenänderungen, verspätete Preisantworten, Dialoge, Fehlerfälle, Video und WebGL-Fallback. Ein zusätzlicher Lauf prüft relative Modul- und Medienpfade unter einem GitHub-Pages-Unterpfad. Screenshots landen im ignorierten Ordner `test-results/`.

## Bedienung und Grenzen

- Binäre oder ASCII-STL bis 25 MB / 500.000 Dreiecke auswählen oder ablegen. Die Datei bleibt im Browser; Koordinaten werden als Millimeter interpretiert.
- ABS ist vorausgewählt; PLA Basic und PETG HF stehen ebenfalls zur Verfügung. Schichthöhe, Fülldichte und Stützen ändern die geometrische Schätzung sofort.
- Der Viewer stellt ausschließlich tatsächlich eingelesene Geometrie dar. Maus/Touch drehen und zoomen, Pfeiltasten schwenken bei fokussierter Modellansicht. Ansicht zurücksetzen und Drahtgitter sind separat bedienbar.
- „Mit Slicer berechnen“ lädt optional Kiri:Moto von grid.space. Nur ein erfolgreich exportierter, auswertbarer G-Code wird als „G-Code analysiert“ bezeichnet. Bei Fehlern bleibt „Geometrische Schätzung“ sichtbar. Netzwerkausfall ist getestet, echtes Slicing ist im eingeschränkten Entwicklungsnetz nicht erfolgreich validiert.
- G-Code-Verbrauch berücksichtigt Rückzug und Wiederzufuhr. Stützanteile und Zeit können auch bei erfolgreichem Slicing Schätzungen bleiben. Kein kalibriertes Druckerprofil.
- Referenzpreise in `prices.json`: Stand 11.11.2026, unverändert übernommen, keine neue Preisbestätigung. Keine Live-Abfrage. Keine wiederkehrenden GitHub-Actions-Aufgaben.
- Kosten: Gramm / 1000 × €/kg + Stunden × 0,20 kW × 0,35 €/kWh. Kein Arbeitslohn, Versand oder Aufschlag.
- Hintergrundvideo: eigene prozedurale Blender-Animation, lokal als H.264-MP4 plus WebP-Standbild. Kein Stockmaterial, keine externen Assets oder kostenpflichtigen Dienste. CC0, siehe [Medienherkunft und Reproduktion](assets/video/LICENSE.md).
- Video pausiert bei reduzierter Bewegung und verborgenem Tab. Die 3D-Ansicht rendert bei Änderungen und gibt Geometrien, Controls und WebGL-Ressourcen beim Verlassen frei. Bei fehlendem WebGL bleibt die Kostenschätzung nutzbar.

[Modellannahmen, Quellen und Slicer-Auswahl](docs/methodology.md).

## Veröffentlichung auf GitHub Pages

Repository-Einstellungen → Pages → **Deploy from a branch** → **main** → **/(root)** → Save. Keine eigene Build-/Deployment-Action, kein kostenpflichtiges Hosting. `CNAME` enthält `musterteil.de`; DNS und Domainverifikation müssen dazu passen. Der Push eines Commits allein bestätigt keine aktive Pages-Veröffentlichung.

**Vor öffentlicher Veröffentlichung fehlen weiterhin Name, ladungsfähige Anschrift und Kontakt der verantwortlichen Person im Impressum.** Diese Daten werden nicht erfunden. Die Bezeichnung „Studienprojekt“ hebt Informationspflichten nicht auf. Die rechtlichen Angaben und Datenschutzhinweise müssen vor dem öffentlichen Betrieb geprüft und vervollständigt werden.

Die gehostete externe Kiri-Engine kann sich ändern und erhält beim Laden technisch notwendige Verbindungsdaten. Three.js, Video, CSS, Preise und Anwendungslogik werden dagegen vom eigenen statischen Ursprung geladen.

## 14 November 2026 design and research update
The visual design was revised to favour warm industrial amber lighting, brighter readable interface panels, and a more polished Three.js model material. The existing locally hosted **3-second CC0 Blender-generated video remains the background asset**; it is a *procedural render, not genuine camera footage*. CSS has been improved substantially but this does **not** substitute for user-requested photoreal camera footage. Replacing that binary MP4 requires obtaining an appropriately licensed clip and committing an optimized local copy.

The design borrows **general approaches, not code**, from open-source references documented in [research-and-cost-model.md](docs/research-and-cost-model.md). For the cost scenario, source disclosure is essential: EUR 12 is a human-configured comparison floor and must never be represented as real measured manufacturing expenses or a quote.

**Legal reminder:** The project notice alone does not establish compliance with German law or immigration/residence-work restrictions. Real Impressum details remain placeholders; an authorised responsible person must provide the missing information and review applicable obligations before public distribution. Do not use the site to take or solicit orders without appropriate permission.
