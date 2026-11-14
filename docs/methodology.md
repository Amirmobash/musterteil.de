# Berechnung und Slicer-Auswahl

Stand: 14.11.2026. Die Anwendung ist eine statische, nichtkommerzielle Demonstration. Sie ist kein Slicer-Profil für eine Produktionsfreigabe.

## Geometrische Schätzung

STL enthält keine verbindliche Einheit; wir interpretieren Koordinaten als Millimeter. Binär- und ASCII-STL werden lokal gelesen, auf endliche Koordinaten und plausible Abmessungen geprüft. Grenze: 25 MB und 500.000 Dreiecke. Das Volumen kommt aus orientierten Dreiecken; offene oder falsch orientierte Netze können falsche Volumina liefern. Die Plausibilitätsprüfung beweist keine Wasserdichtigkeit. Bei unplausiblem Volumen wird eine grobe Ersatzschätzung ausdrücklich als solche dargestellt.

Wand-, Deckschicht- und Füllvolumen sowie Überhangfläche liefern eine grobe Verbrauchsschätzung. Die Stützgeometrie wird nicht exakt rekonstruiert. Die Zeit verwendet einen angenommenen Materialdurchsatz, eine Pauschale pro Schicht und eine Aufheizzeit. Die Grenzwerte des Beispielprofils sind 350 × 350 × 350 mm und eine 0,4-mm-Düse (Creality K2 Plus).

| Material | Angenommene Dichte | Düse / Bett im Demo-Profil | Angenommener Volumendurchsatz |
| --- | --- | --- | --- |
| ABS | 1,04 g/cm³ | 255 / 100 °C | 4,4 mm³/s |
| PLA Basic | 1,24 g/cm³ | 220 / 60 °C | 5,1 mm³/s |
| PETG HF | 1,27 g/cm³ | 250 / 75 °C | 4,7 mm³/s |

Das sind die übernommenen Modellannahmen des Projekts, keine verifizierten Chargenwerte und keine zugesicherten Bambu-Lab-Druckparameter. Herstellerdaten und Filamentfeuchte können abweichen. Materialbeschreibungen orientieren sich an den üblichen Eigenschaften der Kunststofftypen. ABS neigt zu Verzug und benötigt geeignete Einhausung und Lüftung; PLA ist steif und wenig wärmebeständig; PETG ist zäh und kann Fäden ziehen.

Herstellerquellen zum Abgleich: [Bambu ABS](https://bambulab.com/en/filament/abs), [PLA Basic](https://bambulab.com/en/filament/pla), [PETG HF](https://bambulab.com/en/filament/petg-hf), [Creality K2 Plus](https://www.creality.com/eu/products/k2-series-3d-printer). Für einen echten Druck ist das jeweilige Herstellerprofil maßgeblich.

Die datierte Preisreferenz in `prices.json` wurde unverändert übernommen: 25,99 €/kg, Stand 11.11.2026, reguläre 1-kg-Spule laut dort hinterlegter Bambu-EU-Quelle. Sie wurde bei diesem Umbau nicht neu beim Händler bestätigt. Kein Live-Preis, kein automatischer Preisabruf.

Kosten = Gramm / 1000 × €/kg + Stunden × 0,20 kW × 0,35 €/kWh. Arbeit, Versand, Steuern und Aufschlag sind nicht enthalten. Das Ergebnis ist keine Bestellung und kein Angebot.

## Echtes Slicing

Gewählt: **Kiri:Moto**, MIT-Lizenz. Die offizielle Engine-API unterstützt `parse → slice → prepare → export`, Profile und Fortschrittsmeldungen im Browser. Untersucht wurden die [Engine-Dokumentation](https://github.com/GridSpace/grid-apps/blob/d138275bbe9d4e4030d8cb8b2dcf66607da9295a/docs/kiri-moto/engine-apis.md), der [Quellcode](https://github.com/GridSpace/grid-apps/blob/d138275bbe9d4e4030d8cb8b2dcf66607da9295a/src/kiri/run/engine.js) und die MIT-Lizenz dieses Stands. Die Laufzeit lädt bei ausdrücklichem Klick auf „Mit Slicer berechnen“ die vom Anbieter bereitgestellte Browser-Engine. Deren gehosteter Stand ist nicht auf diesen Commit festgeschrieben und kann sich ändern.

Verglichen: **CuraEngine** ist eine freie C++-Konsolenanwendung zur G-Code-Erzeugung ([offizielle Beschreibung](https://github.com/Ultimaker/CuraEngine)). Sie ist kein direkt einbindbares Browsermodul. Eine eigene WebAssembly-Portierung samt Profilen, Build und Lizenzpflege wäre erforderlich; ein serverseitiger Slicer passt nicht zum rein statischen GitHub-Pages-Ziel. Deshalb wurde kein eigener Cura-Dienst eingeführt.

Bei erfolgreichem Kiri-Slicing wird der exportierte G-Code ausgewertet. Extrusion berücksichtigt absolute/relative E-Koordinaten, G92-Resets sowie Rückzug und Wiederzufuhr. Stützanteile kommen aus Feature-Kommentaren, ersatzweise aus Support-Konturen oder der geometrischen Näherung und sind entsprechend gekennzeichnet. Bewegungszeit und Aufheizen bleiben Schätzungen. Kein kalibriertes Beschleunigungsmodell, keine garantierte Druckzeit.

Die Engine wird nur auf ausdrücklichen Wunsch geladen; dabei entstehen Verbindungen zu grid.space. STL-Daten werden an den lokalen Parser übergeben, nicht absichtlich an einen Upload-Endpunkt gesendet. Der externe Code ist eine Vertrauensgrenze; im Datenschutzdialog wird das Nachladen offengelegt. Keine Tracker, keine Cookies, keine Händlerabfrage im Browser.

Im Entwicklungsnetz antwortete der Proxy für grid.space mit CONNECT 403. Daher sind das Fehlerverhalten und die lokale Schätzung getestet, aber **kein erfolgreicher echter Slicing-Durchlauf**. Das Interface behauptet bei Fehlern niemals einen geslicten Verbrauch.
