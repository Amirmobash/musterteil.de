# Hintergrundfilm „Musterteil LAB“

`bg-lab.mp4` und `bg-lab.webp` sind eine eigens für dieses Projekt erstellte,
prozedural gerenderte 3D-Animation, keine Kameraaufnahme und kein Stockmaterial.
Gezeigt werden ein vereinfachter FDM-Drucker, bewegte Messingdüse,
ABS-Schichtkonturen, frische Filamentablage und eine langsame Kamerabewegung.
Keine Fremdmodelle, Texturen, Musik, Markenlogos oder kostenpflichtigen Dienste.

Die beiden Medien und der Szenengenerator `tools/render_lab.py` werden unter
**CC0 1.0 Universal** bereitgestellt:
https://creativecommons.org/publicdomain/zero/1.0/

Erstellung mit Blender 4.3.2 / Cycles (CPU, 24 Samples), Kompression mit FFmpeg.
Blender und FFmpeg sind Werkzeuge; ihre Softwarelizenzen werden dadurch nicht
auf das eigenständig gerenderte Bildmaterial übertragen.

Reproduktion vom Repository-Verzeichnis:

```sh
blender -b -t 6 -P tools/render_lab.py
ffmpeg -y -framerate 24 -i /tmp/musterteil-video/frame-%04d.png -frames:v 72 \
  -vf 'hqdn3d=2:1.5:3:2' -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p \
  -movflags +faststart -an assets/video/bg-lab.mp4
ffmpeg -y -i assets/video/bg-lab.mp4 -frames:v 1 -c:v libwebp -quality 82 \
  assets/video/bg-lab.webp
```

72 Frames, 768 × 432 Pixel, 24 fps, 3 Sekunden; ohne Ton. Der Loop ist für einen
stark abgedunkelten Hintergrund optimiert. Bei reduzierter Bewegung pausiert er
standardmäßig; die Standbilddatei bleibt als Fallback verfügbar.
