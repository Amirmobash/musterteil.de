# musterteil.de

Professionelle statische Website für **musterteil.de**.

## Status

Diese Website befindet sich aktuell in der Gestaltung. Inhalte, Preise, Rechtsseiten, Firmendaten, Maschinen und Referenzen sind Platzhalter.

## Enthaltene Seiten

- `index.html` – moderne Startseite mit Demo-Kalkulator
- `leistungen.html` – 3D Druck, Laser, Gravur, Kleinserie
- `materialien.html` – Materialübersicht
- `portfolio.html` – Demo-Portfolio mit großen Bild-Assets
- `status.html` – Statusseite: aktuell in Gestaltung
- `kontakt.html` – Demo-Anfrageformular
- `admin.html` – lokaler Admin-Demo-Bereich
- `impressum.html`, `datenschutz.html`, `agb.html` – Platzhalter mit freien Feldern für Name/Adresse

## Admin Demo

Benutzername: `admin`  
Passwort: `musterteil2026`

Der Adminbereich ist eine Frontend-Demo mit `localStorage`. Er ist nicht sicher und darf nicht als echtes Backend verwendet werden.

## Admin-Funktionen

- Dashboard
- Aufträge verwalten
- Kunden verwalten
- Materialien verwalten
- Maschinen verwalten
- Nachrichten und lokale Kontaktanfragen anzeigen
- Einstellungen mit Platzhaltern
- JSON Export
- CSV Export

## Assets

Der Ordner `assets/` enthält große Demo-Bilder und Beispieldateien:

- STL
- STEP
- DXF
- SVG
- JSON Seed Data

## GitHub Pages

1. Alle Dateien in das Repository hochladen
2. GitHub → Settings → Pages
3. Source: `Deploy from a branch`
4. Branch: `main` und `/root`
5. Custom Domain: `musterteil.de`
6. DNS beim Domainanbieter auf GitHub Pages setzen

## Wichtig vor dem Livegang

Diese Version ist für Design, GitHub Upload und Weiterentwicklung gedacht. Für echten Betrieb müssen Backend, Authentifizierung, Datei-Upload, Datenschutz, E-Mail-Versand, Rechnung, Zahlung und Rechtstexte professionell ergänzt werden.
