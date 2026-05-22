# Upload zu GitHub

Repository: https://github.com/Amirmobash/musterteil.de

## Variante 1: GitHub Web Upload

1. ZIP entpacken
2. GitHub Repository öffnen
3. Add file → Upload files
4. Alle Dateien und Ordner hochladen
5. Commit message: `Upload musterteil.de website`
6. Commit changes klicken

## Variante 2: Git Terminal

```bash
git clone https://github.com/Amirmobash/musterteil.de.git
cd musterteil.de
# Dateien aus diesem ZIP hier hineinkopieren
git add .
git commit -m "Upload musterteil.de professional website"
git push origin main
```

## GitHub Pages

Settings → Pages → Deploy from branch → main / root.

Die Datei `CNAME` ist bereits mit `musterteil.de` vorbereitet.
