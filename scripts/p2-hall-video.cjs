/* eslint-disable @typescript-eslint/no-require-imports -- Standalone local Playwright capture uses workspace NODE_PATH. */
const { chromium } = require("playwright");
const fs = require("node:fs/promises");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1000 },
    recordVideo: {
      dir: "docs/evidence/p2/video",
      size: { width: 1280, height: 1000 },
    },
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3200/demo", { waitUntil: "networkidle" });
  await page.locator("canvas").waitFor();
  await page.waitForTimeout(1300);
  for (const destination of [
    "Guestbook",
    "Tribute",
    "Memory wall",
    "The hall",
  ]) {
    await page
      .getByRole("navigation", { name: "Memorial destinations" })
      .getByRole("button", { name: new RegExp(`^${destination}`) })
      .click();
    await page.waitForTimeout(2000);
  }
  const video = page.video();
  await context.close();
  await fs.rename(await video.path(), "docs/evidence/p2/hall-navigation.webm");
  await browser.close();
  console.log(
    "Recorded actual 3D camera navigation: docs/evidence/p2/hall-navigation.webm",
  );
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
