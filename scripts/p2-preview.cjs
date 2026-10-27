/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS runner uses workspace NODE_PATH. */
// Local visual capture. Uses the workspace-provided Playwright package.
const { chromium } = require("playwright");
const fs = require("node:fs/promises");
(async () => {
  await fs.mkdir("docs/evidence/p2", { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:3200", { waitUntil: "networkidle" });
  await page.locator("canvas").waitFor();
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: "docs/evidence/p2/landing-desktop.png",
    fullPage: true,
  });
  await page.goto("http://127.0.0.1:3200/demo", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Elowen Marsh" }).waitFor();
  await page.locator("canvas").waitFor();
  await page.waitForTimeout(1800);
  await page.screenshot({
    path: "docs/evidence/p2/hall-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: "docs/evidence/p2/hall-mobile-390.png",
    fullPage: true,
  });
  await page.goto("http://127.0.0.1:3200/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: "docs/evidence/p2/landing-mobile-390.png",
    fullPage: true,
  });
  console.log(JSON.stringify({ errors }, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
