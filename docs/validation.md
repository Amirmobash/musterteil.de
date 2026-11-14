# Validierung — 14.11.2026

Umgebung: Linux, Node 24.22.1, Python 3.12.14, System-Chromium mit Playwright 1.62.1 und Software-WebGL. Statischer Server auf Port 8765. Keine kostenpflichtigen Dienste.

- `npm test`: 10 ausgeführte Tests, 10 bestanden. Binär-/ASCII-STL, Volumen, Fülldichte, Materialdichte, Stützen, G-Code-Resets, Stützmarkierungen, Rückzug/Wiederzufuhr, Kosten und ungültige Koordinaten.
- `npm run test:browser`: vollständiger Lauf bestanden, keine übersprungenen Videoprüfungen und keine unbehandelten Seitenfehler.
- Desktop: **1280×720, 1366×768, 1440×900, 1920×1080**. Tatsächliches STL hochgeladen und dargestellt; ABS vorausgewählt; alle wichtigen Controls sichtbar; Dokumenthöhe entspricht jeweils der Fensterhöhe, keine horizontale oder vertikale Seitenbewegung.
- Mobil: **390×844**. Upload und Darstellung erfolgreich, kein horizontaler Überlauf; vertikales Scrollen erlaubt.
- Bedienung: Datei-Auswahl, echtes Drag-and-drop, Orbit-Drehung (Bildänderung geprüft), Zoom, Kamera-Reset, Drahtgitter, Material-/Füll-/Stützänderungen, ungültige Dateitypen, beschädigte STL, 25-MB-Grenze und alle drei Dialoge einschließlich Escape geprüft.
- WebGL-Fallback: absichtlich verweigerte WebGL-Kontexte; Fehlermeldung sichtbar, Kostenberechnung mit gültiger STL weiterhin erfolgreich.
- Slicer-Fallback: grid.space absichtlich blockiert; keine falsche G-Code-Erfolgsmeldung, geometrische Schätzung bleibt erhalten. Zusätzlich bestätigt der reale Umgebungsproxy CONNECT 403 für grid.space. **Erfolgreiches externes Slicing wurde nicht validiert.**
- Video: echte lokale MP4 mit fortschreitender Wiedergabezeit und gültigen Videodimensionen, Pause/Fortsetzen und Pause bei `prefers-reduced-motion` geprüft. FFmpeg konnte alle Frames ohne Dekodierfehler lesen. H.264, YUV420p, 768×432, 24 fps, 3 s, 321.401 Bytes; WebP-Poster 31.256 Bytes.
- JavaScript-Syntaxprüfungen und `git diff --check` erfolgreich.

Screenshots erzeugt der Runner unter `test-results/` (absichtlich nicht versioniert). Die Fehlerpfade ersetzen keine Slicer-Erfolgsmessung. Nicht geprüft: andere Browser, echte Mobilgeräte, kalibriertes Druckverhalten, verbindliche Hersteller-/Preisbestätigung oder rechtliche Vollständigkeit.

Die URL https://musterteil.de antwortete aus dieser Entwicklungsumgebung mit einem Proxy-CONNECT-403. Daraus folgt weder eine erfolgreiche noch eine fehlgeschlagene GitHub-Pages-Veröffentlichung. Das öffentliche Deployment bleibt unbestätigt. Verantwortliche Person, Anschrift und Kontakt im Impressum fehlen weiterhin.
