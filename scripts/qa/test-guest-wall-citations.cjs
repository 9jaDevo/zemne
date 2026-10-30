/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs/promises");

const BASE_URL = process.env.ZEMNE_BASE_URL || "https://zemne-preview.onrender.com";
const TARGET_SLUG = "mira-vale-synthetic-p6-rehearsal-kkr2i9";
const EVIDENCE_DIR = path.resolve(__dirname, "../../docs/evidence/p7");

(async () => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  console.log(`=== Starting ZEMNE Public Guest Experience & Source Citation Audit on ${BASE_URL}/m/${TARGET_SLUG} ===\n`);

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-gpu"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  try {
    // 1. Visit public memorial hall
    console.log("1. Navigating to public memorial hall...");
    await page.goto(`${BASE_URL}/m/${TARGET_SLUG}`, { waitUntil: "networkidle" });
    await page.locator("canvas").waitFor({ timeout: 25000 });
    console.log("   3D canvas loaded successfully!");

    // Verify no organizer controls or management links are exposed to guest
    const manageLinks = await page.locator("a[href*='/manage/']").count();
    console.log(`   Exposed /manage/ links count: ${manageLinks}`);
    assert.equal(manageLinks, 0, "No organizer /manage/ links must ever be exposed to guests");

    const editButtons = await page.locator("button:has-text('Moderate'), button:has-text('Weave')").count();
    console.log(`   Organizer action buttons count: ${editButtons}`);
    assert.equal(editButtons, 0, "No organizer action buttons must be visible to guests");

    // 2. Open Memory Wall destination
    console.log("2. Opening Memory Wall destination...");
    const wallNavBtn = page.getByRole("navigation", { name: "Memorial destinations" }).getByRole("button", { name: "Memory wall" });
    await wallNavBtn.click();
    await page.waitForTimeout(1000);

    // Verify Story / Memory Wall elements
    const wallPanel = page.locator(".destination-panel.memory-wall");
    await wallPanel.waitFor({ timeout: 10000 });

    const wallTitle = await wallPanel.locator("h3").innerText();
    console.log(`   Memory Wall Title: "${wallTitle}"`);

    // Verify AI transparency label
    const aiText = await wallPanel.locator(".ai-disclosure").innerText();
    console.log(`   AI Disclosure text: "${aiText.replace(/\n+/g, ' ')}"`);
    assert.ok(aiText.includes("Gemma") || aiText.includes("Google AI Studio"), "Must disclose AI provider/model");

    // Capture Memory Wall screenshot
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "guest-01-memory-wall-view.png"),
      fullPage: true,
    });
    console.log("   📸 Captured: guest-01-memory-wall-view.png");

    // 3. Inspect Source Citations & Click Source Pill
    console.log("3. Inspecting Source Citations...");
    const sourceButtons = page.locator(".source-chips button");
    const pillCount = await sourceButtons.count();
    console.log(`   Found ${pillCount} citation button(s) in woven paragraphs`);
    assert.ok(pillCount > 0, "Memory wall must feature citation chips referencing contributor tributes");

    const firstPill = sourceButtons.first();
    const pillContributorName = await firstPill.innerText();
    console.log(`   Clicking first citation button: "${pillContributorName}"...`);
    await firstPill.click();

    // Wait for Source Modal / Dialog
    const dialog = page.locator("dialog.source-dialog");
    await dialog.waitFor({ timeout: 10000 });
    console.log("   Source modal/dialog appeared successfully!");

    const dialogHeading = await dialog.locator("#source-title, h3").innerText();
    const dialogContent = await dialog.innerText();
    console.log(`   Source dialog heading: "${dialogHeading}"`);
    console.log(`   Source dialog snippet: ${dialogContent.slice(0, 150)}...`);

    // Screenshot dialog
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "guest-02-source-dialog.png"),
      fullPage: true,
    });
    console.log("   📸 Captured: guest-02-source-dialog.png");

    // Close dialog
    const closeBtn = dialog.locator("button[aria-label='Close source']");
    await closeBtn.click();
    await page.waitForTimeout(500);

    // 4. Open Guestbook Panel
    console.log("4. Opening Guestbook Panel...");
    const guestbookNavBtn = page.getByRole("navigation", { name: "Memorial destinations" }).getByRole("button", { name: "Guestbook" });
    await guestbookNavBtn.click();
    await page.waitForTimeout(1000);

    // Verify Ari North's message is visible
    const ariMsg = page.getByText("Ari North — synthetic guest");
    await ariMsg.waitFor({ timeout: 10000 });
    console.log("   Approved guestbook entry 'Ari North' is visible to guest!");

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "guest-03-guestbook-approved.png"),
      fullPage: true,
    });
    console.log("   📸 Captured: guest-03-guestbook-approved.png");

    // 5. Open Tributes Panel
    console.log("5. Opening Tributes Panel...");
    const tributeNavBtn = page.getByRole("navigation", { name: "Memorial destinations" }).getByRole("button", { name: "Tribute" });
    await tributeNavBtn.click();
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "guest-04-tribute-panel.png"),
      fullPage: true,
    });
    console.log("   📸 Captured: guest-04-tribute-panel.png");

    console.log("\n=== ✅ ALL PUBLIC GUEST & CITATION CHECKS PASSED ===");

  } catch (err) {
    console.error("❌ FAILED:", err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
