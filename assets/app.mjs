import {
  materials,
  geometrySTL,
  estimate,
  gcodeStats,
  sliceSupportApprox,
  costs,
  comparisonCosts,
} from "./core.mjs";
const q = (id) => document.getElementById(id);
let mesh = null,
  bytes = null,
  task = 0,
  fileTask = 0,
  engineLoad = null,
  prices = {
    abs:25.99,pla:25.99,petg:25.99,pla_matte:25.99,petg_translucent:25.99,
    pla_silk:25.99,asa:24.99,tpu:34.99,pc:42.99,petg_cf:35.99
  },
  verified = "2026-11-14",
  source = "https://bambulab-eu.myshopify.com/de/pages/bambu-filament",
  priceSources = {};
let viewer = null,
  slicingBusy = false,
  lastResult = null;
const viewerReady = import("./viewer.mjs")
  .then(({ createViewer }) => {
    viewer = createViewer(q("viewer"));
    return viewer;
  })
  .catch((error) => {
    q("viewerEmpty").innerHTML =
      "<h2>3D-Ansicht nicht verfügbar.</h2><p>Dein Browser unterstützt WebGL hier nicht.<br>Die Kostenschätzung funktioniert weiterhin.</p>";
    console.warn("3D-Ansicht:", error);
    return null;
  });
const fmt = (n, d = 2) =>
    Number(n).toLocaleString("de-DE", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    }),
  eu = (n) => fmt(n) + " €",
  g = (n) => fmt(n, 1) + " g";
const hours = (h) => {
  let min = Math.max(1, Math.round(h * 60));
  return min >= 60
    ? Math.floor(min / 60) +
        " Std. " +
        String(min % 60).padStart(2, "0") +
        " Min."
    : min + " Min.";
};
const settings = () => ({
  material: q("material").value,
  layer: Number(q("layer").value),
  infill: Number(q("infill").value),
  support: q("support").checked,
});
const badge = (t, cls = "") => {
  q("state").textContent = t;
  q("state").className = "badge " + cls;
};
const progress = (msg, n = 0) => {
  q("progressText").textContent = msg;
  q("bar").style.width = n + "%";
};
function materialUI() {
  const s = settings();
  q("materialNote").textContent = materials[s.material].details;
  q("infillText").textContent = s.infill + " %";
  q("kgPrice").textContent = eu(prices[s.material]) + " / kg";
  q("priceDate").textContent =
    "STAND " + verified.split("-").reverse().join(".");
  q("priceLink").href = priceSources[s.material] || source;
}
async function loadPrices() {
  try {
    const res = await fetch("./prices.json", { cache: "no-store" }),
      x = await res.json();
    if (
      res.ok &&
      typeof x.verified === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(x.verified) &&
      typeof x.source === "string" &&
      new URL(x.source).protocol === "https:" &&
      Object.keys(materials).every(
        (k) =>
          Number.isFinite(x.materials?.[k]) &&
          x.materials[k] >= 10 &&
          x.materials[k] < 200 &&
          (!x.sources?.[k] || /^https:\/\//.test(x.sources[k])),
      )
    ) {
      prices = x.materials;
      verified = x.verified;
      source = x.source;
      priceSources = x.sources || {};
    }
  } catch {}
  materialUI();
  if (lastResult) render(lastResult.data, lastResult.real);
}
function render(d, real = false) {
  lastResult = { data: d, real };
  const c = comparisonCosts(d.total, d.hours, prices[settings().material], d.support);
  q("total").textContent = fmt(c.total);
  q("time").textContent = hours(d.hours);
  q("part").textContent = g(d.part);
  q("supportGrams").textContent = g(d.support);
  q("weight").textContent = g(d.total);
  q("supportNote").textContent = d.supportKind;
  q("filamentCost").textContent = eu(c.filament);
  q("powerCost").textContent = eu(c.power);
  q("machineCost").textContent = eu(c.machine);
  q("handlingCost").textContent = eu(c.preparation+c.supportHandling);
  q("floorCost").textContent = eu(c.comparisonAllowance);
  q("resultInfo").textContent = real
    ? "Rechenmodell · Extrusion aus G-Code, Zeit und Aufwand teils geschätzt."
    : "Rechenmodell · Material und Zeit geometrisch geschätzt.";
  badge(
    real ? "G-Code analysiert" : "Geometrische Schätzung",
    real ? "ok" : "warn",
  );
}
function rough() {
  if (mesh) render(estimate(mesh, settings()), false);
}
async function getEngine() {
  if (!engineLoad)
    engineLoad = (async () => {
      try {
        const x = await import("https://grid.space/lib/kiri/run/engine.js");
        if (typeof x.Engine === "function") return x.Engine;
      } catch (e) {
        console.info("Kiri module:", e?.message);
      }
      if (!globalThis.kiri?.newEngine)
        await new Promise((resolve, reject) => {
          const el = document.createElement("script");
          el.src = "https://grid.space/code/engine.js";
          el.onload = resolve;
          el.onerror = () => reject(Error("Kiri:Moto ist nicht erreichbar."));
          document.head.appendChild(el);
        });
      if (globalThis.kiri?.newEngine)
        return class {
          constructor(options) {
            return globalThis.kiri.newEngine(options);
          }
        };
      if (globalThis.Engine) return globalThis.Engine;
      throw Error("Browser-Slicer konnte nicht geladen werden.");
    })();
  try {
    return await engineLoad;
  } catch (e) {
    engineLoad = null;
    throw e;
  }
}
async function limit(promise, ms = 35000) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(Error("Slicer-Zeitlimit überschritten")),
          ms,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
async function calculate() {
  if (!mesh || !bytes || slicingBusy) return;
  slicingBusy = true;
  const current = ++task,
    s = settings();
  if (mesh.size.some((v) => v > 350)) {
    progress("Modell überschreitet 350 × 350 × 350 mm. Ausrichtung prüfen.", 0);
    badge("Bauraum zu klein", "warn");
    slicingBusy = false;
    return;
  }
  q("recalc").disabled = true;
  badge("Slicer lädt");
  progress("Kiri:Moto wird im Browser geladen …", 12);
  let workerURL;
  try {
    const Engine = await limit(getEngine(), 20000);
    if (current !== task) return;
    // A same-origin blob entry can import the remote module worker via CORS.
    // A raw cross-origin Worker URL would be rejected on GitHub Pages.
    workerURL = URL.createObjectURL(
      new Blob(['import "https://grid.space/lib/kiri/run/worker.js";'], {
        type: "text/javascript",
      }),
    );
    const engine = new Engine({ workURL: workerURL });
    engine
      .setMode("FDM")
      .setRender(false)
      .setController({ threaded: false })
      .setDevice({
        deviceName: "K2 Plus – vereinfachtes Demo-Profil",
        bedWidth: 350,
        bedDepth: 350,
        maxHeight: 350,
        originCenter: false,
        extrudeAbs: true,
        extruders: [
          {
            extFilament: 1.75,
            extNozzle: 0.4,
            extSelect: ["T0"],
            extDeselect: [],
            extOffsetX: 0,
            extOffsetY: 0,
          },
        ],
      })
      .setProcess({
        sliceHeight: s.layer,
        firstSliceHeight: s.layer,
        sliceShells: 3,
        sliceTopLayers: 4,
        sliceBottomLayers: 4,
        sliceFillSparse: s.infill / 100,
        sliceSupportEnable: s.support,
        sliceSupportDensity: 0.25,
        sliceSupportAngle: 50,
        sliceSupportOffset: 0.4,
        sliceSupportGap: 1,
        outputTemp: materials[s.material].temp,
        outputBedTemp: materials[s.material].bed,
        outputFeedrate: s.material === "abs" ? 55 : 65,
        outputFinishrate: 40,
        outputSeekrate: 125,
      })
      .setListener((msg) => {
        if (current !== task) return;
        if (msg.slice)
          progress("Schichten und Überhänge werden berechnet …", 43);
        else if (msg.prepare) progress("Bereite G-Code und Stützen vor …", 69);
        else if (msg.export) progress("Lese Extrusionsdaten …", 86);
      });
    await limit(engine.parse(bytes.slice(0)), 20000);
    if (current !== task) return;
    await limit(engine.slice(), 45000);
    if (current !== task) return;
    const sliceSupport = s.support
      ? sliceSupportApprox(engine, materials[s.material].density)
      : 0;
    await limit(engine.prepare(), 45000);
    const code = await limit(engine.export(), 45000);
    if (current !== task) return;
    const stat = gcodeStats(code, materials[s.material].density);
    const approx = estimate(mesh, s);
    const support = s.support
      ? Math.min(
          stat.total,
          Math.max(0, stat.markedSupport ?? sliceSupport ?? approx.support),
        )
      : 0;
    render(
      {
        total: stat.total,
        part: Math.max(0, stat.total - support),
        support,
        hours: stat.hours,
        supportKind: !s.support
          ? "Deaktiviert"
          : stat.markedSupport !== null
            ? "Im G-Code markiert"
            : sliceSupport !== null
              ? "Aus Stützkonturen geschätzt"
              : "Aus Überhängen geschätzt",
      },
      true,
    );
    q("engineInfo").textContent =
      "Slicing abgeschlossen. Druckzeit und Stützanteil bleiben Schätzungen.";
    progress("Analyse abgeschlossen. Datei nicht hochgeladen.", 100);
  } catch (error) {
    if (current !== task) return;
    rough();
    progress(
      "Slicer nicht verfügbar. Die angezeigten Zahlen sind geometrische Schätzungen.",
      100,
    );
    q("engineInfo").textContent =
      "Slicer momentan nicht verfügbar. Die geometrische Schätzung bleibt erhalten.";
    console.warn("Kiri slicing failed:", error);
  } finally {
    if (workerURL) URL.revokeObjectURL(workerURL);
    slicingBusy = false;
    q("recalc").disabled = false;
  }
}
function updateEstimate() {
  if (!mesh) return;
  task++;
  rough();
  q("recalc").disabled = slicingBusy;
  progress(
    "Geometrische Schätzung aktualisiert. Slicing bei Bedarf starten.",
    100,
  );
}
async function fileChosen(file) {
  if (!file) return;
  const my = ++fileTask;
  task++;
  q("viewer").setAttribute("aria-busy", "false");
  if (!/\.stl$/i.test(file.name)) {
    progress("Bitte nur eine STL-Datei wählen.", 0);
    return;
  }
  if (file.size > 25 * 1024 * 1024) {
    progress("Datei zu groß: maximal 25 MB.", 0);
    return;
  }
  badge("Modell wird gelesen");
  progress("Modell wird analysiert …", 0);
  q("viewer").setAttribute("aria-busy", "true");
  try {
    const data = await file.arrayBuffer();
    if (my !== fileTask) return;
    const parsed = geometrySTL(data);
    bytes = data;
    mesh = parsed;
    q("fileLabel").textContent = file.name;
    q("fileHint").textContent = fmt(file.size / 1024, 0) + " KB · lokale Datei";
    q("sizeInfo").textContent =
      parsed.size.map((x) => fmt(x, 1)).join(" × ") +
      " mm · " +
      parsed.faces.toLocaleString("de-DE") +
      " Dreiecke";
    q("recalc").disabled = slicingBusy;
    rough();
    const display = await viewerReady;
    if (my !== fileTask) return;
    try {
      display?.load(data);
    } catch (error) {
      q("viewerEmpty").hidden = false;
      q("viewerEmpty").textContent =
        "Das Modell ließ sich nicht darstellen. Die Kostenschätzung bleibt verfügbar.";
      console.warn(error);
    }
    progress(
      parsed.reliable
        ? "STL eingelesen. Geometrische Schätzung bereit."
        : "Geometrie möglicherweise nicht wasserdicht. Werte unsicher.",
      5,
    );
    // Local estimation is immediate; external slicing requires an explicit click.
    q("engineInfo").textContent =
      "Geometrische Schätzung bereit. Der optionale Slicer lädt Software von grid.space.";
  } catch (e) {
    if (my !== fileTask) return;
    progress(e.message || "STL konnte nicht gelesen werden.", 0);
    badge("Datei nicht lesbar", "warn");
  } finally {
    if (my === fileTask) q("viewer").setAttribute("aria-busy", "false");
  }
}
q("upload").addEventListener("change", (e) => fileChosen(e.target.files?.[0]));
q("drop").addEventListener("dragover", (e) => {
  e.preventDefault();
  q("drop").classList.add("dragging");
});
q("drop").addEventListener("dragleave", () =>
  q("drop").classList.remove("dragging"),
);
q("drop").addEventListener("drop", (e) => {
  e.preventDefault();
  q("drop").classList.remove("dragging");
  fileChosen(e.dataTransfer?.files?.[0]);
});
q("drop").addEventListener("keydown", (e) => {
  if (e.target === q("drop") && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    q("upload").click();
  }
});
for (const id of ["material", "layer", "infill", "support"])
  q(id).addEventListener("input", () => {
    materialUI();
    updateEstimate();
  });
q("recalc").addEventListener("click", calculate);
document
  .querySelectorAll("[data-dialog]")
  .forEach((btn) =>
    btn.addEventListener("click", () => q(btn.dataset.dialog).showModal()),
  );
document.querySelectorAll("dialog").forEach((d) =>
  d.addEventListener("click", (e) => {
    if (e.target === d) d.close();
  }),
);
materialUI();
loadPrices();

q("resetView").addEventListener("click", () => viewer?.fit());
q("wireframe").addEventListener("click", () => {
  if (viewer)
    q("wireframe").setAttribute("aria-pressed", String(viewer.toggleWire()));
});
const video = q("labVideo"),
  motion = matchMedia("(prefers-reduced-motion: reduce)");
let pausedByUser = motion.matches;
function videoState() {
  if (
    video.error ||
    video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE
  ) {
    videoUnavailable();
    return;
  }
  const pause = pausedByUser || document.hidden;
  q("motionToggle").textContent = pause ? "Video abspielen" : "Video pausieren";
  q("motionToggle").setAttribute("aria-pressed", String(pause));
  if (pause) video.pause();
  else
    video.play().catch(() => {
      if (
        video.error ||
        video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE
      ) {
        videoUnavailable();
        return;
      }
      pausedByUser = true;
      q("motionToggle").textContent = "Video abspielen";
      q("motionToggle").setAttribute("aria-pressed", "true");
    });
}
q("motionToggle").addEventListener("click", () => {
  pausedByUser = !pausedByUser;
  videoState();
});
motion.addEventListener("change", () => {
  pausedByUser = motion.matches;
  videoState();
});
document.addEventListener("visibilitychange", videoState);
function videoUnavailable() {
  pausedByUser = true;
  video.pause();
  q("motionToggle").textContent = "Video nicht verfügbar";
  q("motionToggle").setAttribute("aria-pressed", "true");
  q("motionToggle").disabled = true;
}
video.addEventListener("error", videoUnavailable);
video.querySelector("source").addEventListener("error", videoUnavailable);
window.addEventListener("pagehide", (event) => {
  if (!event.persisted) viewer?.dispose();
});
videoState();
