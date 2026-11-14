# Musterteil LAB

One HTML page. German-language, non-commercial student demonstration for educational printing-cost calculation. No storefront, no payments, no orders, no forms, no analytics or cookies.

## Design and features
- One-page responsive design, no desktop scrolling on standard laptop/desktop viewports (very short viewports and phones may scroll for accessibility).
- Drag-and-drop STL (binary or ASCII, maximum 25 MB); model stays in visitor browser.
- ABS selected by default; PLA Basic and PETG HF selectable; material details appear on selection.
- Layer height, infill, support toggle; nominal example geometry from Creality K2 Plus.
- Local geometry preview of mass and costs, explicitly labeled a rough estimate.
- Attempts genuine browser slicing through free, MIT-licensed Kiri:Moto API from grid.space. When successful, GCode is parsed to derive extruded filament. Support grams are separated by GCode feature labels or estimated from support contours/geometry; time uses GCode motion and a warmup allowance. When engine is unavailable there is no fake 'sliced' result.
- Last validated Bambu EU regular 1 kg with-spool reference prices are stored in prices.json. Automated price checks are disabled to prevent recurring workflow usage. The reference remains dated and is not a live shop price.
- Price is a material-and-electricity *calculation*, not an offer: grams/1000 * EUR/kg + hours * 0.2 kW * 0.35 EUR/kWh. No wages, tax, shipping or markup.
- Informational and legal panels are dialogs on the same HTML page.

## Tests and deployment
Run: node --test tests/core.test.mjs
**Enable GitHub Pages once** in Settings → Pages → Build and deployment:\n1. Source: **Deploy from a branch**.\n2. Branch: **main**.\n3. Folder: **/(root)**.\n4. Click **Save**.\n\nThe site then publishes from the repository root via the standard GitHub Pages branch publishing mechanism. **No custom deployment workflow or paid service is needed.** The `CNAME` file contains `musterteil.de`. Pages must be enabled in the UI by a repository administrator; a commit alone cannot enable a disabled Pages site with the standard `GITHUB_TOKEN`.

## Limitations and legal requirements
NOT a calibrated printer profile, commercial quote, printability approval or promise of safety. A mere student-project notice does not waive legal requirements. COMPLETE responsible person, serviceable postal address and contact in the Impressum dialog before public deployment and check applicable German requirements. Loading remote slicer code from grid.space transmits the visitor IP address to that service, explained in Datenschutz.

Reference sources: grid.space / GridSpace/grid-apps (MIT); Creality K2 Plus official specifications; Bambu Lab EU official filament price page.

## GitHub Pages recovery (2026-11-14)
The repository is public. The earlier GitHub Actions publishing workflow failed because Pages had not been enabled. The failing workflow has been removed to avoid unnecessary Actions runs. Use **Deploy from a branch → main → /(root) → Save**. The intended domain is `musterteil.de` (not `mustertail.de`). If the custom domain is not present in Settings → Pages after enabling Pages, add `musterteil.de` there and follow GitHub's domain/DNS verification guidance. Do not subscribe to GitHub Enterprise or start a paid trial.
