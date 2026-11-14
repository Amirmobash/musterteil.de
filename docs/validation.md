# Validierung — 14.11.2026

Umgebung: Linux, Node 24.22.1, Python 3.12.14, System-Chromium mit Playwright 1.62.1 und Software-WebGL. Statischer Server auf Port 8765. Keine kostenpflichtigen Dienste.

- `npm test`: 10 ausgeführte Tests, 10 bestanden. Binär-/ASCII-STL, Volumen, Fülldichte, Materialdichte, Stützen, G-Code-Resets, Stützmarkierungen, Rückzug/Wiederzufuhr, Kosten und ungültige Koordinaten.
- `npm run test:browser`: vollständiger Lauf bestanden, keine übersprungenen Videoprüfungen und keine unbehandelten Seitenfehler.
- Desktop: **1280×720, 1366×768, 1440×900, 1920×1080**. Tatsächliches STL hochgeladen und dargestellt; ABS vorausgewählt; alle wichtigen Controls sichtbar; Dokumenthöhe entspricht jeweils der Fensterhöhe, keine horizontale oder vertikale Seitenbewegung.
- Mobil: **390×844**. Upload und Darstellung erfolgreich, kein horizontaler Überlauf; vertikales Scrollen erlaubt.
- Bedienung: Binär- und ASCII-STL, Datei-Auswahl, echtes Drag-and-drop, sichtbarer Tastaturfokus, Drahtgitter, Material-/Füll-/Stützänderungen, ungültige Dateitypen, beschädigte STL, 25-MB-Grenze und alle drei Dialoge einschließlich Escape geprüft. Für Orbit und Zoom wird das Hintergrundvideo angehalten, damit nur die Modellansicht die Bildänderung verursachen kann. Der Kamera-Reset stellt nach Drehung und Zoom exakt die ursprüngliche Ansicht wieder her, auch während der Dämpfung.
- WebGL-Fallback: absichtlich verweigerte WebGL-Kontexte; Fehlermeldung sichtbar, Kostenberechnung mit gültiger STL weiterhin erfolgreich.
- Slicer-Fallback: grid.space absichtlich blockiert; keine falsche G-Code-Erfolgsmeldung, geometrische Schätzung bleibt erhalten. Zusätzlich bestätigt der reale Umgebungsproxy CONNECT 403 für grid.space. **Erfolgreiches externes Slicing wurde nicht validiert.**
- Zeitlimits: Nach einem fehlgeschlagenen Slicer-Start bleiben keine Stufen-Zeitlimits aktiv.
- Preisdatei: Eine verspätete lokale Preisantwort aktualisiert Referenz und Gesamtkosten gemeinsam. Fehlen Datum oder Quelle, bleibt die vorhandene datierte Referenz nutzbar. Die abweichenden Preise sind ausschließlich Testdaten; `prices.json` wurde nicht geändert.
- Video: echte lokale MP4 mit fortschreitender Wiedergabezeit und gültigen Videodimensionen, Pause/Fortsetzen und Pause bei `prefers-reduced-motion` geprüft. FFmpeg konnte alle Frames ohne Dekodierfehler lesen. H.264, YUV420p, 768×432, 24 fps, 3 s, 321.401 Bytes; WebP-Poster 31.256 Bytes.
- Video-Fallback: Ein tatsächlich abgebrochener MP4-Abruf aktiviert „Video nicht verfügbar“; das lokale WebP-Poster bleibt hinterlegt.
- GitHub Pages: Genau eine versionierte HTML-Datei, `.nojekyll`, `CNAME=musterteil.de` und sämtliche lokalen Abhängigkeiten vorhanden. Keine Actions-Workflows. Ein zusätzlicher Browserlauf unter simuliertem Repository-Unterpfad `/musterteil.de/` lädt Module, STL-Ansicht und Video erfolgreich. Kompatibel mit **main / (root)** ohne Build.
- JavaScript-Syntaxprüfungen und `git diff --check` erfolgreich.

Screenshots erzeugt der Runner unter `test-results/` (absichtlich nicht versioniert). Die Fehlerpfade ersetzen keine Slicer-Erfolgsmessung. Nicht geprüft: andere Browser, echte Mobilgeräte, kalibriertes Druckverhalten, verbindliche Hersteller-/Preisbestätigung oder rechtliche Vollständigkeit.

Die URLs https://musterteil.de und https://amirmobash.github.io/musterteil.de/ antworteten aus dieser Entwicklungsumgebung mit einem Proxy-CONNECT-403. Daraus folgt weder eine erfolgreiche noch eine fehlgeschlagene GitHub-Pages-Veröffentlichung. Das öffentliche Deployment bleibt unbestätigt. Verantwortliche Person, Anschrift und Kontakt im Impressum fehlen weiterhin.
