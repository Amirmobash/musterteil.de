/* Run against `npm run dev`: npm run test:browser.
   Uses system Chromium when CHROMIUM_PATH is set or /usr/bin/chromium exists.
   No external slicing success is asserted: blocked-network fallback is tested explicitly. */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:8765";
const videoCheck = !process.argv.includes("--without-video");
function cube() {
  const points = [
      [0, 0, 0],
      [20, 0, 0],
      [20, 20, 0],
      [0, 20, 0],
      [0, 0, 20],
      [20, 0, 20],
      [20, 20, 20],
      [0, 20, 20],
    ],
    faces = [
      [0, 2, 1],
      [0, 3, 2],
      [4, 5, 6],
      [4, 6, 7],
      [0, 1, 5],
      [0, 5, 4],
      [1, 2, 6],
      [1, 6, 5],
      [2, 3, 7],
      [2, 7, 6],
      [3, 0, 4],
      [3, 4, 7],
    ];
  const b = Buffer.alloc(84 + faces.length * 50);
  b.writeUInt32LE(faces.length, 80);
  faces.forEach((t, i) =>
    t.forEach((j, k) =>
      points[j].forEach((n, c) =>
        b.writeFloatLE(n, 84 + i * 50 + 12 + k * 12 + c * 4),
      ),
    ),
  );
  return b;
}
function asciiCube() {
  const b = cube();
  const facets = [];
  for (let i = 0; i < 12; i++) {
    const vertices = Array.from(
      { length: 3 },
      (_, vertex) =>
        "vertex " +
        [0, 1, 2]
          .map((axis) =>
            b.readFloatLE(84 + i * 50 + 12 + vertex * 12 + axis * 4),
          )
          .join(" "),
    );
    facets.push(
      [
        "facet normal 0 0 0",
        "outer loop",
        ...vertices,
        "endloop",
        "endfacet",
      ].join("\n"),
    );
  }
  return Buffer.from(["solid cube", ...facets, "endsolid cube"].join("\n"));
}
async function upload(page) {
  await page.locator("#upload").setInputFiles({
    name: "Würfel.stl",
    mimeType: "application/octet-stream",
    buffer: cube(),
  });
  await page.waitForFunction(
    () => document.querySelector("#viewer").dataset.loaded === "true",
  );
  await page.waitForFunction(
    () => document.querySelector("#total").textContent !== "—",
  );
}
(async () => {
  const executablePath =
    process.env.CHROMIUM_PATH ||
    (fs.existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  const errors = [];
  const context = await browser.newContext();
  // Track stage deadlines so a quick network failure cannot leave timers alive.
  await context.addInitScript(() => {
    const originalSet = window.setTimeout.bind(window);
    const originalClear = window.clearTimeout.bind(window);
    const deadlines = new Set();
    window.setTimeout = (callback, delay, ...args) => {
      const id = originalSet(() => {
        deadlines.delete(id);
        callback(...args);
      }, delay);
      if (delay >= 20000 && delay <= 45000) deadlines.add(id);
      return id;
    };
    window.clearTimeout = (id) => {
      deadlines.delete(id);
      originalClear(id);
    };
    window.pendingStageDeadlines = () => deadlines.size;
  });
  context.on("page", (p) => p.on("pageerror", (e) => errors.push(e.message)));
  const page = await context.newPage();
  await context.route("https://grid.space/**", (route) => route.abort());
  fs.mkdirSync("test-results", { recursive: true });
  try {
    for (const [width, height] of [
      [1280, 720],
      [1366, 768],
      [1440, 900],
      [1920, 1080],
    ]) {
      await page.setViewportSize({ width, height });
      await page.goto(base);
      await page.locator("#viewer canvas").waitFor();
      await upload(page);
      assert.equal(await page.locator("#material").inputValue(), "abs");
      const layout = await page.evaluate(() => ({
        w: document.documentElement.scrollWidth,
        h: document.documentElement.scrollHeight,
        visible: [
          ...document.querySelectorAll(
            "select,#support,#recalc,.viewer-tools button,footer button",
          ),
        ].every((e) => {
          const r = e.getBoundingClientRect();
          return (
            r.top >= 0 &&
            r.bottom <= innerHeight &&
            r.left >= 0 &&
            r.right <= innerWidth
          );
        }),
        offscreen: [
          ...document.querySelectorAll(
            "select,#support,#recalc,.viewer-tools button,footer button",
          ),
        ].filter((e) => {
          const r=e.getBoundingClientRect();
          return r.top < 0 || r.bottom > innerHeight || r.left < 0 || r.right > innerWidth;
        }).map(e=>({selector:e.id||e.textContent.trim().slice(0,35),top:Math.round(e.getBoundingClientRect().top),bottom:Math.round(e.getBoundingClientRect().bottom)})),
        overlap:
          document.querySelector(".technical").getBoundingClientRect().bottom >
          document.querySelector(".settings").getBoundingClientRect().bottom,
      }));
      assert.equal(layout.w, width);
      assert.equal(layout.h, height);
      assert.ok(layout.visible, "Offscreen controls: "+JSON.stringify(layout.offscreen));
      assert.equal(layout.overlap, false);
      assert.match(
        await page.locator("#sizeInfo").textContent(),
        /20,0 × 20,0 × 20,0 mm/,
      );
      assert.equal(await page.locator("#viewerEmpty").isVisible(), false);
      await page.screenshot({ path: `test-results/desktop-${width}.png` });
      console.log(
        `PASS ${width}×${height}: uploaded STL, ABS default, controls visible, no scrolling`,
      );
    }
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.locator("#upload").focus();
    await page.waitForFunction(
      () =>
        getComputedStyle(document.querySelector("#drop")).borderTopColor ===
        "rgb(255, 212, 143)",
    );
    assert.equal(
      await page
        .locator("#drop")
        .evaluate((el) => getComputedStyle(el).borderTopColor),
      "rgb(255, 212, 143)",
    );
    const initial = await page.locator("#filamentCost").textContent();
    await page.locator("#infill").fill("80");
    await page.locator("#infill").dispatchEvent("input");
    assert.notEqual(await page.locator("#filamentCost").textContent(), initial, "infill must change real filament costs even when the EUR 12 comparison floor applies");
    await page.locator("#material").selectOption("petg");
    assert.match(await page.locator("#materialNote").textContent(), /PETG/);
    await page.locator("#support").uncheck();
    assert.equal(await page.locator("#supportGrams").textContent(), "0,0 g");
    await page.locator("#wireframe").click();
    assert.equal(
      await page.locator("#wireframe").getAttribute("aria-pressed"),
      "true",
    );
    await page.locator("#wireframe").click();
    const canvas = page.locator("#viewer canvas");
    // Freeze the film: only the actual model/camera may change these images.
    await page.locator("#labVideo").evaluate((video) => video.pause());
    await page.locator("#resetView").click();
    await page.waitForTimeout(500);
    const box = await canvas.boundingBox();
    const before = await page.screenshot({ clip: box });
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      box.x + box.width / 2 + 90,
      box.y + box.height / 2 + 30,
      { steps: 10 },
    );
    await page.mouse.up();
    await page.waitForTimeout(600);
    const rotated = await page.screenshot({ clip: box });
    assert.notDeepEqual(
      rotated,
      before,
      "orbit must change the model view with a stationary film",
    );
    // Reset while damping is still active; the fitted view must not drift.
    await page.locator("#resetView").click();
    await page.waitForTimeout(500);
    assert.deepEqual(
      await page.screenshot({ clip: box }),
      before,
      "reset must restore the fitted view",
    );
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, -200);
    await page.waitForTimeout(600);
    const zoomed = await page.screenshot({ clip: box });
    assert.notDeepEqual(zoomed, before, "zoom must change the model view");
    await page.locator("#resetView").click();
    await page.waitForTimeout(500);
    assert.deepEqual(
      await page.screenshot({ clip: box }),
      before,
      "reset must undo zoom",
    );
    // Native drag-and-drop with a real File exercises the second upload path.
    await page.evaluate(
      (data) => {
        const dt = new DataTransfer();
        dt.items.add(
          new File([new Uint8Array(data)], "Abgelegt.stl", {
            type: "application/octet-stream",
          }),
        );
        document.querySelector("#drop").dispatchEvent(
          new DragEvent("drop", {
            bubbles: true,
            cancelable: true,
            dataTransfer: dt,
          }),
        );
      },
      [...cube()],
    );
    await page.waitForFunction(
      () => document.querySelector("#fileLabel").textContent === "Abgelegt.stl",
    );
    await page.locator("#recalc").click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("#engineInfo")
          .textContent.startsWith("Slicer momentan nicht verfügbar"),
      {},
      { timeout: 30000 },
    );
    assert.equal(
      await page.locator("#state").textContent(),
      "Geometrische Schätzung",
    );
    assert.equal(await page.evaluate(() => window.pendingStageDeadlines()), 0);
    await page.locator("#upload").setInputFiles({
      name: "ASCII-Würfel.stl",
      mimeType: "application/octet-stream",
      buffer: asciiCube(),
    });
    await page.waitForFunction(
      () =>
        document.querySelector("#fileLabel").textContent ===
          "ASCII-Würfel.stl" &&
        document.querySelector("#viewer").getAttribute("aria-busy") === "false",
    );
    assert.match(
      await page.locator("#sizeInfo").textContent(),
      /20,0 × 20,0 × 20,0 mm/,
    );
    assert.equal(await page.locator("#viewerEmpty").isVisible(), false);
    await page.locator("#upload").setInputFiles({
      name: "Fehler.stl",
      mimeType: "application/octet-stream",
      buffer: Buffer.from("broken"),
    });
    await page.waitForFunction(
      () =>
        document.querySelector("#state").textContent === "Datei nicht lesbar",
    );
    await page.locator("#upload").setInputFiles({
      name: "kein-modell.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("x"),
    });
    assert.match(
      await page.locator("#progressText").textContent(),
      /STL-Datei/,
    );
    await page.locator("#upload").setInputFiles({
      name: "zu-gross.stl",
      mimeType: "application/octet-stream",
      buffer: Buffer.alloc(25 * 1024 * 1024 + 1),
    });
    assert.match(
      await page.locator("#progressText").textContent(),
      /maximal 25 MB/,
    );
    for (const id of ["methodDialog", "privacyDialog", "legalDialog"]) {
      await page.locator(`[data-dialog="${id}"]`).click();
      assert.ok(await page.locator(`#${id}`).isVisible());
      await page.keyboard.press("Escape");
      assert.equal(await page.locator(`#${id}`).isVisible(), false);
    }
    console.log(
      "PASS orbit, zoom, reset, wireframe, drag/drop, material/infill/support updates, invalid/large file errors, dialogs, blocked-slicer estimate",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base);
    await page.locator("#viewer canvas").waitFor();
    await upload(page);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth),
      390,
    );
    await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
    console.log("PASS mobile 390×844: no horizontal overflow, STL upload");
    if (videoCheck) {
      await page.waitForFunction(() => {
        const v = document.querySelector("#labVideo");
        return v.readyState >= 2 && !v.paused;
      });
      const time = await page
        .locator("#labVideo")
        .evaluate((v) => v.currentTime);
      await page.waitForTimeout(700);
      assert.notEqual(
        await page.locator("#labVideo").evaluate((v) => v.currentTime),
        time,
      );
      assert.ok(
        await page
          .locator("#labVideo")
          .evaluate((v) => v.videoWidth > 0 && v.videoHeight > 0),
      );
      await page.locator("#motionToggle").click();
      assert.ok(await page.locator("#labVideo").evaluate((v) => v.paused));
      await page.locator("#motionToggle").click();
      await page.waitForFunction(
        () => !document.querySelector("#labVideo").paused,
      );
      const reduced = await browser.newContext({ reducedMotion: "reduce" });
      const rp = await reduced.newPage();
      await rp.goto(base);
      await rp.waitForFunction(
        () =>
          document
            .querySelector("#motionToggle")
            .getAttribute("aria-pressed") === "true",
      );
      assert.ok(await rp.locator("#labVideo").evaluate((v) => v.paused));
      await reduced.close();
      console.log("PASS real MP4 playback, pause/resume, reduced-motion pause");
    } else console.log("SKIPPED video checks (--without-video)");
    const pricePage = await context.newPage();
    let deliverPrices;
    const priceGate = new Promise((resolve) => {
      deliverPrices = resolve;
    });
    const reference = JSON.parse(fs.readFileSync("prices.json", "utf8"));
    await pricePage.route("**/prices.json", async (route) => {
      await priceGate;
      await route.fulfill({
        json: { ...reference, materials: { ...reference.materials, abs: 50, pla: 50, petg: 50 } },
      });
    });
    try {
      await pricePage.goto(base);
      await upload(pricePage);
      const previous = await pricePage.locator("#filamentCost").textContent();
      deliverPrices();
      await pricePage.waitForFunction(
        () => document.querySelector("#kgPrice").textContent === "50,00 € / kg",
      );
      assert.notEqual(
        await pricePage.locator("#filamentCost").textContent(),
        previous,
        "a late price response must refresh material costs even under the EUR 12 scenario floor",
      );
    } finally {
      deliverPrices();
      await pricePage.close();
    }
    const invalidPricePage = await context.newPage();
    await invalidPricePage.route("**/prices.json", (route) =>
      route.fulfill({ json: { materials: reference.materials } }),
    );
    await invalidPricePage.goto(base);
    await upload(invalidPricePage);
    assert.equal(
      await invalidPricePage.locator("#kgPrice").textContent(),
      "25,99 € / kg",
    );
    await invalidPricePage.close();
    console.log(
      "PASS delayed prices refresh costs; incomplete price metadata preserves the dated reference",
    );

    // A repository Pages mount must resolve all relative imports and media.
    const mounted = await context.newPage();
    const mountedURL = base.replace(/\/$/, "") + "/musterteil.de/";
    await mounted.route(mountedURL + "**", async (route) => {
      const response = await route.fetch({
        url: route
          .request()
          .url()
          .replace(mountedURL, base.replace(/\/$/, "") + "/"),
      });
      await route.fulfill({ response });
    });
    await mounted.goto(mountedURL);
    await upload(mounted);
    if (videoCheck)
      await mounted.waitForFunction(
        () => document.querySelector("#labVideo").readyState >= 2,
      );
    assert.equal(await mounted.locator("#viewerEmpty").isVisible(), false);
    await mounted.close();
    console.log(
      "PASS GitHub Pages-style repository subpath: HTML, module imports, STL and local media",
    );

    const missingVideo = await context.newPage();
    await missingVideo.route("**/assets/video/bg-lab.mp4", (route) =>
      route.abort(),
    );
    await missingVideo.goto(base);
    await missingVideo.waitForFunction(
      () => document.querySelector("#motionToggle").disabled,
    );
    assert.equal(
      await missingVideo.locator("#motionToggle").textContent(),
      "Video nicht verfügbar",
    );
    assert.match(
      await missingVideo.locator("#labVideo").getAttribute("poster"),
      /bg-lab\.webp$/,
    );
    await missingVideo.close();
    console.log(
      "PASS missing-video fallback keeps the local poster and reports unavailability",
    );

    const fallback = await browser.newContext();
    await fallback.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        return /webgl/.test(type) ? null : original.call(this, type, ...args);
      };
    });
    const fp = await fallback.newPage();
    fp.on("pageerror", (e) => errors.push(e.message));
    await fp.goto(base);
    await fp.waitForFunction(() =>
      document
        .querySelector("#viewerEmpty")
        .textContent.includes("3D-Ansicht nicht verfügbar"),
    );
    await fp.locator("#upload").setInputFiles({
      name: "Wuerfel.stl",
      mimeType: "application/octet-stream",
      buffer: cube(),
    });
    await fp.waitForFunction(
      () => document.querySelector("#total").textContent !== "—",
    );
    await fallback.close();
    console.log("PASS WebGL-unavailable fallback retains calculator");
    assert.deepEqual(errors, []);
    console.log("PASS no uncaught page errors");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
