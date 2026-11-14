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
async function upload(page) {
  await page
    .locator("#upload")
    .setInputFiles({
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
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
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
        overlap:
          document.querySelector(".technical").getBoundingClientRect().bottom >
          document.querySelector(".settings").getBoundingClientRect().bottom,
      }));
      assert.equal(layout.w, width);
      assert.equal(layout.h, height);
      assert.ok(layout.visible);
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
    const initial = await page.locator("#total").textContent();
    await page.locator("#infill").fill("80");
    await page.locator("#infill").dispatchEvent("input");
    assert.notEqual(await page.locator("#total").textContent(), initial);
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
    assert.notDeepEqual(await page.screenshot({ clip: box }), before);
    await page.mouse.wheel(0, -200);
    await page.waitForTimeout(250);
    await page.locator("#resetView").click();
    // Native drag-and-drop with a real File exercises the second upload path.
    await page.evaluate(
      (data) => {
        const dt = new DataTransfer();
        dt.items.add(
          new File([new Uint8Array(data)], "Abgelegt.stl", {
            type: "application/octet-stream",
          }),
        );
        document
          .querySelector("#drop")
          .dispatchEvent(
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
    await page
      .locator("#upload")
      .setInputFiles({
        name: "Fehler.stl",
        mimeType: "application/octet-stream",
        buffer: Buffer.from("broken"),
      });
    await page.waitForFunction(
      () =>
        document.querySelector("#state").textContent === "Datei nicht lesbar",
    );
    await page
      .locator("#upload")
      .setInputFiles({
        name: "kein-modell.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("x"),
      });
    assert.match(
      await page.locator("#progressText").textContent(),
      /STL-Datei/,
    );
    await page
      .locator("#upload")
      .setInputFiles({
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
    const fallback = await browser.newContext();
    await fallback.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        return /webgl/.test(type) ? null : original.call(this, type, ...args);
      };
    });
    const fp = await fallback.newPage();
    await fp.goto(base);
    await fp.waitForFunction(() =>
      document
        .querySelector("#viewerEmpty")
        .textContent.includes("3D-Ansicht nicht verfügbar"),
    );
    await fp
      .locator("#upload")
      .setInputFiles({
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
