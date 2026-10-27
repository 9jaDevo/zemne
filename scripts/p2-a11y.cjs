/* eslint-disable @typescript-eslint/no-require-imports -- Local browser audit uses workspace NODE_PATH. */
const { chromium } = require("playwright");
const fs = require("node:fs/promises");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  const page = await browser.newPage();
  const audits = [];
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      "/",
      "/identity",
      "/demo?mode=2d",
      "/demo?destination=guestbook",
      "/demo?destination=tribute",
      "/demo?destination=wall",
      "/demo?view=create",
      "/demo?organizer-audit=1",
    ]) {
      await page.goto("http://127.0.0.1:3200" + route, {
        waitUntil: "networkidle",
      });
      if (route.includes("demo"))
        await page
          .getByRole("heading", {
            name: route.includes("create")
              ? "Begin with their name."
              : "Elowen Marsh",
          })
          .waitFor();
      if (route.includes("organizer-audit")) {
        await page
          .getByRole("button", { name: "Organizer", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Preview a demo weave" })
          .waitFor();
      }
      await page.addScriptTag({ path: require.resolve("axe-core") });
      const violations = await page.evaluate(async () => {
        const r = await window.axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
        });
        return r.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        }));
      });
      audits.push({ width, route, violations });
      console.log(width, route, violations.length);
    }
  }
  await fs.writeFile(
    "docs/evidence/p2/a11y-results.json",
    JSON.stringify(
      { at: new Date().toISOString(), engine: "axe-core", audits },
      null,
      2,
    ),
  );
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
