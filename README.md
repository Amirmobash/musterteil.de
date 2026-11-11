# Musterteil LAB

One HTML page. German-language, non-commercial student demonstration for educational printing-cost calculation. No storefront, no payments, no orders, no forms, no analytics or cookies.

## Design and features
- One-page responsive design, no desktop scrolling on standard laptop/desktop viewports (very short viewports and phones may scroll for accessibility).
- Drag-and-drop STL (binary or ASCII, maximum 25 MB); model stays in visitor browser.
- ABS selected by default; PLA Basic and PETG HF selectable; material details appear on selection.
- Layer height, infill, support toggle; nominal example geometry from Creality K2 Plus.
- Local geometry preview of mass and costs, explicitly labeled a rough estimate.
- Attempts genuine browser slicing through free, MIT-licensed Kiri:Moto API from grid.space. When successful, GCode is parsed to derive extruded filament. Support grams are separated by GCode feature labels or estimated from support contours/geometry; time uses GCode motion and a warmup allowance. When engine is unavailable there is no fake 'sliced' result.
- Last validated Bambu EU regular 1 kg with-spool reference prices are in prices.json. Daily scheduled workflow attempts fresh validation against official Bambu EU price table. On failure the last verified dated snapshot stays; no false live-price claim.
- Price is a material-and-electricity *calculation*, not an offer: grams/1000 * EUR/kg + hours * 0.2 kW * 0.35 EUR/kWh. No wages, tax, shipping or markup.
- Informational and legal panels are dialogs on the same HTML page.

## Tests and deployment
Run: node --test tests/core.test.mjs
GitHub Pages settings should use GitHub Actions. workflow pages.yml checks code and tests before deploying.

## Limitations and legal requirements
NOT a calibrated printer profile, commercial quote, printability approval or promise of safety. A mere student-project notice does not waive legal requirements. COMPLETE responsible person, serviceable postal address and contact in the Impressum dialog before public deployment and check applicable German requirements. Loading remote slicer code from grid.space transmits the visitor IP address to that service, explained in Datenschutz.

Reference sources: grid.space / GridSpace/grid-apps (MIT); Creality K2 Plus official specifications; Bambu Lab EU official filament price page.
