/* eslint-disable @typescript-eslint/no-require-imports -- Standalone local browser QA uses workspace NODE_PATH. */
const { chromium } = require("playwright");
const THREE = require("three");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const output = "docs/evidence/p2";
const base = "http://127.0.0.1:3200";
const checks = [];
const errors = [];
async function check(name, task) {
  await task();
  checks.push({ name, result: "PASS" });
  console.log(`PASS ${name}`);
}
async function capture(page, name) {
  await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
}
function nav(page, name) {
  return page
    .getByRole("navigation", { name: "Memorial destinations" })
    .getByRole("button", { name: new RegExp(`^${name}`) });
}
async function hall(page) {
  await page.getByRole("heading", { name: "Elowen Marsh" }).waitFor();
  await page.locator("canvas").waitFor();
}
(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1050 },
    deviceScaleFactor: 1,
  });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: base,
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  const apiRequests = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/"))
      apiRequests.push(request.url());
  });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.locator("canvas").waitFor();
  await page.waitForTimeout(1000);
  await capture(page, "landing-desktop");
  await page.goto(`${base}/identity`, { waitUntil: "networkidle" });
  await capture(page, "identity-desktop");
  await page.goto(`${base}/demo`, { waitUntil: "networkidle" });
  await hall(page);
  const webgl = await page.locator("canvas").evaluate((canvas) => {
    const gl = canvas.getContext("webgl2");
    return {
      version: gl.getParameter(gl.VERSION),
      width: gl.drawingBufferWidth,
      height: gl.drawingBufferHeight,
    };
  });
  await page.waitForTimeout(1200);
  await capture(page, "hall-desktop");
  for (const [name, position, heading] of [
    ["guestbook", [-2.8, 2.05, 1.1], "Leave a little of your presence."],
    ["tribute", [2.9, 2.05, -0.6], "Some memories deserve a place."],
    ["wall", [2.9, 3.5, -4.98], "A life, remembered in many voices."],
  ]) {
    await check(`real 3D ${name} marker opens its destination`, async () => {
      await nav(page, "The hall").click();
      await page.waitForTimeout(2100);
      const box = await page.locator("canvas").boundingBox();
      const camera = new THREE.PerspectiveCamera(
        42,
        box.width / box.height,
        0.1,
        80,
      );
      camera.position.set(8.8, 7.5, 12.8);
      camera.lookAt(0, 1.5, -1);
      camera.updateMatrixWorld();
      const p = new THREE.Vector3(...position).project(camera);
      await page.mouse.click(
        box.x + ((p.x + 1) * box.width) / 2,
        box.y + ((1 - p.y) * box.height) / 2,
      );
      await page.getByRole("heading", { name: heading }).waitFor();
    });
  }
  await check(
    "guestbook submits pending and stays out of public list",
    async () => {
      await nav(page, "Guestbook").click();
      await page.getByRole("button", { name: "Sign the guestbook" }).click();
      await page.getByLabel("Your name").fill("Avery Demo");
      await page
        .getByLabel("Your message")
        .fill("A fictional guestbook message awaiting family approval.");
      await page.getByRole("checkbox").check();
      await page.getByRole("button", { name: "Leave my message" }).click();
      await page
        .getByRole("heading", { name: "Your words are in good hands." })
        .waitFor();
      await capture(page, "guestbook-receipt-desktop");
      await page.getByRole("button", { name: "Return to guestbook" }).click();
      assert.equal(
        await page
          .getByText(
            "A fictional guestbook message awaiting family approval.",
            { exact: true },
          )
          .count(),
        0,
      );
    },
  );
  await check(
    "tribute submits pending without leaking to visitors",
    async () => {
      await nav(page, "Tribute").click();
      await page.getByLabel("Your name").fill("Morgan Demo");
      await page.getByLabel("Your connection").fill("Fictional friend");
      await page
        .getByLabel("Your memory")
        .fill("An invented memory of quiet walks beneath the orchard trees.");
      await page.getByRole("checkbox").check();
      await page.getByRole("button", { name: "Submit my tribute" }).click();
      await page
        .getByRole("heading", { name: "Your words are in good hands." })
        .waitFor();
      await page.getByRole("button", { name: "Return to tributes" }).click();
      assert.equal(
        await page
          .getByText(
            "An invented memory of quiet walks beneath the orchard trees.",
            { exact: true },
          )
          .count(),
        0,
      );
    },
  );
  await page.getByRole("button", { name: "Organizer", exact: true }).click();
  await page
    .getByRole("heading", { name: "A little care. A lasting remembrance." })
    .waitFor();
  await check(
    "organizer sees and approves pending guestbook and tribute",
    async () => {
      for (const name of ["Avery Demo", "Morgan Demo"]) {
        const entry = page.locator(".review-entry").filter({ hasText: name });
        await entry
          .getByRole("button", { name: "Approve", exact: true })
          .click();
        await entry.waitFor({ state: "detached" });
      }
    },
  );
  await check(
    "demo weave creates a labeled draft; edits gate publication",
    async () => {
      await page.getByRole("button", { name: "Preview a demo weave" }).click();
      await page
        .locator(".editor-card .badge")
        .filter({ hasText: "draft" })
        .waitFor();
      await page
        .getByLabel("Remembrance title")
        .fill("[DEMO] A remembrance, held together");
      await page
        .getByLabel("Paragraph 1", { exact: true })
        .fill("A fictional remembrance of kindness and patient teaching.");
      assert.equal(
        await page
          .getByRole("button", { name: "Publish to memory wall" })
          .isDisabled(),
        true,
      );
      await page.getByRole("button", { name: "Save changes" }).click();
      await page
        .getByRole("button", { name: "Publish to memory wall" })
        .waitFor();
      await page.waitForFunction(
        () =>
          ![...document.querySelectorAll("button")].find((b) =>
            b.textContent.includes("Publish to memory wall"),
          )?.disabled,
      );
      await page
        .getByRole("button", { name: "Publish to memory wall" })
        .click();
      await page
        .getByRole("button", { name: "Unpublish remembrance" })
        .waitFor();
      await capture(page, "organizer-desktop");
    },
  );
  await check(
    "published edits appear to guests and source opens approved text",
    async () => {
      await page.getByRole("button", { name: "Visit the hall" }).click();
      await nav(page, "Memory wall").click();
      await page
        .getByText(
          "A fictional remembrance of kindness and patient teaching.",
          { exact: true },
        )
        .waitFor();
      await page.locator(".source-chips button").first().click();
      await page.getByRole("dialog").waitFor();
      assert.match(
        await page.locator("dialog blockquote").innerText(),
        /Mrs Marsh stayed after class/,
      );
      await capture(page, "source-dialog-desktop");
      await page.keyboard.press("Escape");
      assert.equal(await page.getByRole("dialog").count(), 0);
    },
  );
  await check(
    "unpublish removes the remembrance from the guest wall",
    async () => {
      await page
        .getByRole("button", { name: "Organizer", exact: true })
        .click();
      await page.getByRole("button", { name: "Unpublish remembrance" }).click();
      await page
        .getByRole("button", { name: "Publish to memory wall" })
        .waitFor();
      await page.getByRole("button", { name: "Visit the hall" }).click();
      await nav(page, "Memory wall").click();
      await page
        .getByRole("heading", { name: "A story is still taking shape." })
        .waitFor();
    },
  );
  await check(
    "AI-unavailable state reports failure and supports explicit retry",
    async () => {
      await page
        .getByRole("button", { name: "Organizer", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Preview a demo weave" })
        .waitFor();
      await page
        .getByText("About this preview & test states", { exact: true })
        .click();
      await page
        .getByRole("button", {
          name: "Queue AI-unavailable error for the next action",
        })
        .click();
      await page.getByRole("button", { name: "Preview a demo weave" }).click();
      await page
        .getByRole("alert")
        .filter({ hasText: "The AI service is unavailable" })
        .waitFor();
      await capture(page, "ai-error-desktop");
      await page.getByRole("button", { name: "Preview a demo weave" }).click();
      await page
        .locator(".editor-card .badge")
        .filter({ hasText: "draft" })
        .waitFor();
    },
  );
  await check(
    "create validates year order and shows recoverability handoff",
    async () => {
      await page.getByRole("button", { name: /^Create a demo/ }).click();
      await page.getByLabel("Full name").fill("Rowan Vale (demo)");
      await page.getByLabel("Year of birth").fill("2000");
      await page.getByLabel("Year of passing").fill("1990");
      await page
        .getByLabel("A few words about them")
        .fill("An invented memorial used only for frontend testing.");
      await page.getByRole("checkbox").check();
      await page
        .locator("form")
        .getByRole("button", { name: "Create a demo memorial" })
        .click();
      await page.locator(".notice.error").waitFor();
      assert.equal(
        await page.getByLabel("Year of passing").getAttribute("aria-invalid"),
        "true",
      );
      await page.getByLabel("Year of passing").fill("2025");
      await page
        .locator("form")
        .getByRole("button", { name: "Create a demo memorial" })
        .click();
      await page
        .getByRole("heading", { name: "SAVE THIS PRIVATE LINK", exact: true })
        .waitFor();
      assert.equal(
        await page
          .getByRole("button", { name: "Open organizer preview" })
          .isDisabled(),
        true,
      );
      await page
        .getByRole("button", { name: "Copy private demo link" })
        .click();
      await page
        .getByText("Private demo link copied.", { exact: true })
        .waitFor();
      await capture(page, "claim-desktop");
      await page.getByRole("checkbox").check();
      await page
        .getByRole("button", { name: "Open organizer preview" })
        .click();
      await page.getByRole("heading", { name: "A quiet moment." }).waitFor();
      assert.equal(
        await page
          .getByRole("button", { name: "Preview a demo weave" })
          .isDisabled(),
        true,
      );
    },
  );
  await page.getByRole("button", { name: "Visit the hall" }).click();
  await check(
    "new memorial has working empty states and equivalent 2D destinations",
    async () => {
      await page.getByRole("button", { name: "Use the 2D view" }).click();
      assert.equal(await page.locator("canvas").count(), 0);
      await nav(page, "Guestbook").click();
      await page
        .getByText(/The guestbook is waiting for its first words/)
        .waitFor();
      await nav(page, "Tribute").click();
      await page.getByLabel("Your memory").waitFor();
      await nav(page, "Memory wall").click();
      await page
        .getByRole("heading", { name: "A story is still taking shape." })
        .waitFor();
    },
  );
  await page.goto(`${base}/demo`, { waitUntil: "networkidle" });
  await hall(page);
  const overflow = [];
  for (const width of [375, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1050 });
    await page.waitForTimeout(400);
    const measure = await page.evaluate(() => ({
      viewport: innerWidth,
      document: document.documentElement.scrollWidth,
    }));
    overflow.push(measure);
    assert.ok(measure.document <= measure.viewport, `overflow at ${width}`);
    if (width === 390) await capture(page, "hall-mobile-390");
    if (width === 375) await capture(page, "hall-mobile-375");
    if (width === 768) await capture(page, "hall-tablet-768");
  }
  checks.push({
    name: "no horizontal overflow at 375/390/768/1440",
    result: "PASS",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await nav(page, "Guestbook").click();
  await page.getByRole("button", { name: "Sign the guestbook" }).click();
  await capture(page, "guestbook-mobile-390");
  await nav(page, "Tribute").click();
  await capture(page, "tribute-mobile-390");
  await nav(page, "Memory wall").click();
  await capture(page, "wall-mobile-390");
  await page.getByRole("button", { name: "Organizer", exact: true }).click();
  await page
    .getByRole("heading", { name: "A little care. A lasting remembrance." })
    .waitFor();
  await capture(page, "organizer-mobile-390");
  await page.getByRole("button", { name: /^Create a demo/ }).click();
  await capture(page, "create-mobile-390");
  await page.goto(base, { waitUntil: "networkidle" });
  await page.locator("canvas").waitFor();
  await page.waitForTimeout(700);
  await capture(page, "landing-mobile-390");
  await page.goto(`${base}/identity`, { waitUntil: "networkidle" });
  await capture(page, "identity-mobile-390");
  const a11y = [];
  for (const route of [
    "/",
    "/demo?mode=2d",
    "/demo?view=create",
    "/identity",
  ]) {
    await page.goto(base + route, { waitUntil: "networkidle" });
    if (route.includes("demo"))
      await page
        .getByRole("heading", {
          name: route.includes("create")
            ? "Begin with their name."
            : "Elowen Marsh",
        })
        .waitFor();
    await page.addScriptTag({ path: require.resolve("axe-core") });
    const result = await page.evaluate(async () => {
      const result = await window.axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
      });
      return result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      }));
    });
    a11y.push({ route, violations: result });
  }
  const reduced = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  await reduced.goto(`${base}/demo`, { waitUntil: "networkidle" });
  await hall(reduced);
  await check(
    "reduced motion and keyboard destination activation",
    async () => {
      assert.equal(
        await reduced.evaluate(
          () => matchMedia("(prefers-reduced-motion: reduce)").matches,
        ),
        true,
      );
      await nav(reduced, "Guestbook").focus();
      await reduced.keyboard.press("Enter");
      await reduced
        .getByRole("heading", { name: "Leave a little of your presence." })
        .waitFor();
      assert.equal(
        await nav(reduced, "Guestbook").getAttribute("aria-pressed"),
        "true",
      );
      await capture(reduced, "reduced-motion-mobile");
    },
  );
  await check("WebGL context loss preserves destination forms", async () => {
    await reduced
      .locator("canvas")
      .evaluate((canvas) =>
        canvas
          .getContext("webgl2")
          .getExtension("WEBGL_lose_context")
          .loseContext(),
      );
    await reduced
      .getByText("The 3D hall is unavailable on this device.")
      .waitFor();
    await nav(reduced, "Tribute").click();
    await reduced.getByLabel("Your memory").waitFor();
    await capture(reduced, "context-loss-mobile");
  });
  const noGL = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await noGL.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      if (String(kind).includes("webgl")) return null;
      return original.call(this, kind, ...args);
    };
  });
  await check("WebGL-disabled browser retains full 2D actions", async () => {
    await noGL.goto(`${base}/demo`, { waitUntil: "networkidle" });
    await noGL
      .getByText("The 3D hall is unavailable on this device.")
      .waitFor();
    await nav(noGL, "Guestbook").click();
    await noGL.getByRole("button", { name: "Sign the guestbook" }).click();
    await noGL.getByLabel("Your name").fill("No GPU Demo");
    await noGL
      .getByLabel("Your message")
      .fill("A fictional message submitted without WebGL.");
    await noGL.getByRole("checkbox").check();
    await noGL.getByRole("button", { name: "Leave my message" }).click();
    await noGL
      .getByRole("heading", { name: "Your words are in good hands." })
      .waitFor();
    await capture(noGL, "webgl-disabled-mobile");
  });
  assert.equal(apiRequests.length, 0);
  assert.equal(errors.length, 0);
  const report = {
    at: new Date().toISOString(),
    browser: await browser.version(),
    renderer: "Chromium headless / SwiftShader software WebGL",
    webgl,
    checks,
    overflow,
    a11y,
    pageErrors: errors,
    apiRequests,
    limitations: [
      "Single-tab in-memory P1 mock, not backend or security acceptance",
      "Software GPU; no physical iOS/Android or live hosting test",
      "No real Gemma inference or persistent data",
    ],
  };
  await fs.writeFile(
    `${output}/qa-results.json`,
    JSON.stringify(report, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        passed: checks.length,
        a11y: a11y.map((x) => ({ route: x.route, count: x.violations.length })),
        errors,
      },
      null,
      2,
    ),
  );
  await browser.close();
})().catch(async (error) => {
  console.error(error);
  await fs.mkdir(output, { recursive: true });
  await fs.writeFile(`${output}/qa-failure.txt`, String(error.stack));
  process.exit(1);
});
