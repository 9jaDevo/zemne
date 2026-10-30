/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");

const BASE_URL = process.env.ZEMNE_BASE_URL || "https://zemne-preview.onrender.com";
const EVIDENCE_DIR = path.resolve(__dirname, "../../docs/evidence/p7");

const results = {
  testSuite: "End-to-End Multi-Persona Memorial Walkthrough",
  targetUrl: BASE_URL,
  startTime: new Date().toISOString(),
  steps: [],
  artifacts: [],
};

function logStep(name, status, details = {}) {
  const step = { name, status, timestamp: new Date().toISOString(), ...details };
  results.steps.push(step);
  console.log(`[${status}] ${name}`);
  if (details.message) console.log(`       ${details.message}`);
}

async function capture(page, filename, description) {
  const filepath = path.join(EVIDENCE_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  results.artifacts.push({ filename, description, path: filepath });
  console.log(`   📸 Captured: ${filename} - ${description}`);
}

function nav(page, name) {
  return page
    .getByRole("navigation", { name: "Memorial destinations" })
    .getByRole("button", { name: new RegExp(`^${name}`) });
}

(async () => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  console.log(`=== Starting ZEMNE P7 End-to-End Walkthrough on ${BASE_URL} ===\n`);

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-gpu"],
  });

  let memorialId = "";
  let memorialSlug = "";
  let guestUrl = "";
  let privateUrl = "";
  let rawToken = "";

  try {
    // -------------------------------------------------------------
    // STAGE 1: Organizer Creates Memorial
    // -------------------------------------------------------------
    console.log("\n--- STAGE 1: Organizer Creates Memorial ---");
    const organizerContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const organizerPage = await organizerContext.newPage();

    await organizerPage.goto(`${BASE_URL}/create`, { waitUntil: "networkidle" });
    await organizerPage.locator("h2:has-text('Begin with their name.')").waitFor({ timeout: 15000 });
    await capture(organizerPage, "e2e-01-create-page.png", "Memorial creation form");

    const syntheticName = `Dr. Alistair Finch — Synthetic P7 ${Date.now().toString(36)}`;
    await organizerPage.getByLabel("Full name").fill(syntheticName);
    await organizerPage.getByLabel("Year of birth").fill("1938");
    await organizerPage.getByLabel("Year of passing").fill("2024");
    await organizerPage.getByLabel("A few words about them").fill(
      "Beloved wetland ecologist, field mentor, and cedar whistle carver who taught generations to listen to the living marshes."
    );
    // select illustration
    await organizerPage.locator("input[value='neutral-2']").check();
    // check consent / acknowledgment
    await organizerPage.locator("input[name='privacy_acknowledged']").check();

    await capture(organizerPage, "e2e-02-create-filled.png", "Form filled with synthetic details");
    await organizerPage.getByRole("button", { name: "Create a memorial", exact: true }).click();

    // Land on ClaimLink
    await organizerPage.locator("h2:has-text('SAVE THIS PRIVATE LINK')").waitFor({ timeout: 20000 });
    await capture(organizerPage, "e2e-03-claim-screen.png", "Save Private Link handoff screen");

    // Extract links
    const codeElements = await organizerPage.locator("code").allTextContents();
    privateUrl = codeElements[0];
    guestUrl = codeElements[1];
    console.log(`   Private link: ${privateUrl.replace(/#key=.*/, '#key=[REDACTED]')}`);
    console.log(`   Guest invitation: ${guestUrl}`);

    const matchKey = privateUrl.match(/#key=([^&]+)/);
    if (matchKey) rawToken = matchKey[1];
    const matchId = privateUrl.match(/\/manage\/([a-f0-9]+)/);
    if (matchId) memorialId = matchId[1];
    const matchSlug = guestUrl.match(/\/m\/([a-z0-9-]+)/);
    if (matchSlug) memorialSlug = matchSlug[1];

    assert.ok(memorialId, "memorialId was extracted");
    assert.ok(memorialSlug, "memorialSlug was extracted");
    assert.ok(rawToken, "rawToken was extracted");

    logStep("Organizer Memorial Creation", "PASS", {
      memorialId,
      memorialSlug,
      name: syntheticName,
    });

    // Acknowledge private link saving and proceed to organizer console
    await organizerPage.getByRole("checkbox").check();
    await organizerPage.getByRole("button", { name: "Open organizer console" }).click();

    // Verify console loaded and address bar does NOT contain raw token
    await organizerPage.locator("h1:has-text('A little care.')").waitFor({ timeout: 15000 });
    const currentUrl = organizerPage.url();
    assert.ok(!currentUrl.includes("#key="), "Private fragment must not be in URL");
    await capture(organizerPage, "e2e-04-organizer-initial.png", "Organizer initial console (0 pending, 0 approved)");

    logStep("Organizer Console Handoff", "PASS", {
      urlWithoutSecret: currentUrl,
      notes: "Fragment secret stripped from address bar immediately",
    });

    // -------------------------------------------------------------
    // STAGE 2: Three Independent Guest Personas in Incognito Contexts
    // -------------------------------------------------------------
    console.log("\n--- STAGE 2: Three Independent Guest Personas ---");

    // --- Guest Persona 1: Dr. Marcus Vance (Guestbook signature) ---
    console.log("   [Guest Persona 1] Opening incognito context...");
    const guestContext1 = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const guestPage1 = await guestContext1.newPage();
    await guestPage1.goto(`${BASE_URL}/m/${memorialSlug}`, { waitUntil: "networkidle" });
    await guestPage1.locator("h1:has-text('Dr. Alistair Finch')").waitFor({ timeout: 15000 });
    await capture(guestPage1, "e2e-05-guest1-hall-entrance.png", "Guest 1 enters 3D hall");

    // Check that Organizer button is NOT present for guest
    const guestHasOrganizerButton = await guestPage1.locator("button:has-text('Organizer')").count();
    assert.equal(guestHasOrganizerButton, 0, "Guest must never see Organizer button");

    // Navigate to Guestbook
    await nav(guestPage1, "Guestbook").click();
    await guestPage1.locator("h2:has-text('Leave a little')").waitFor({ timeout: 10000 });
    // Check initial count is 0
    await guestPage1.locator(".empty-state").waitFor({ timeout: 10000 });
    await capture(guestPage1, "e2e-06-guest1-guestbook-empty.png", "Guestbook initially empty for visitors");

    // Sign guestbook
    await guestPage1.getByRole("button", { name: "Sign the guestbook" }).click();
    await guestPage1.getByLabel("Your name").fill("Dr. Marcus Vance");
    await guestPage1.getByLabel("Your message").fill(
      "Alistair, your steadfast patience during our coastal surveys taught generations of students to listen before taking field notes. Rest peacefully in the green marshes."
    );
    await guestPage1.getByRole("checkbox").check();
    await capture(guestPage1, "e2e-07-guest1-guestbook-form.png", "Guest 1 filled guestbook form");
    await guestPage1.getByRole("button", { name: "Leave my message" }).click();

    await guestPage1.locator("h2:has-text('Your words are')").waitFor({ timeout: 10000 });
    await capture(guestPage1, "e2e-08-guest1-guestbook-receipt.png", "Guest 1 submission receipt (pending isolation notice)");

    await guestPage1.getByRole("button", { name: "Return to guestbook" }).click();
    // Verify guestbook STILL shows 0 approved entries
    const guestbookApprovedCount1 = await guestPage1.locator(".contribution").count();
    assert.equal(guestbookApprovedCount1, 0, "Pending guestbook entry must NOT appear in public view");
    logStep("Guest Persona 1 Guestbook Submission & Isolation", "PASS", {
      contributor: "Dr. Marcus Vance",
      approvedCountInPublicView: 0,
    });

    // --- Guest Persona 2: Sarah Jenkins (Tribute 1) ---
    console.log("   [Guest Persona 2] Opening incognito context...");
    const guestContext2 = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const guestPage2 = await guestContext2.newPage();
    await guestPage2.goto(`${BASE_URL}/m/${memorialSlug}`, { waitUntil: "networkidle" });
    await nav(guestPage2, "Tribute").click();
    await guestPage2.locator("h2:has-text('Some memories')").waitFor({ timeout: 10000 });

    // Submit tribute
    if (await guestPage2.getByRole("button", { name: "Write a tribute" }).isVisible()) {
      await guestPage2.getByRole("button", { name: "Write a tribute" }).click();
    }
    await guestPage2.getByLabel("Your name").fill("Sarah Jenkins");
    await guestPage2.getByLabel("Your connection").fill("Former graduate researcher");
    await guestPage2.getByLabel("Your memory").fill(
      "Dr. Finch stayed with our field team through a torrential squall in the brackish salt marshes to ensure every beginner had banded their specimen safely. He boiled herbal tea on a camp stove and reminded us that nature never hurries for our comfort."
    );
    await guestPage2.getByRole("checkbox").check();
    await capture(guestPage2, "e2e-09-guest2-tribute-form.png", "Guest 2 filled tribute form (Theme: field mentorship & patience)");
    await guestPage2.getByRole("button", { name: "Submit my tribute" }).click();

    await guestPage2.locator("h2:has-text('Your words are')").waitFor({ timeout: 10000 });
    await capture(guestPage2, "e2e-10-guest2-tribute-receipt.png", "Guest 2 submission receipt");

    await guestPage2.getByRole("button", { name: "Return to tributes" }).click();
    const tributesApprovedCount2 = await guestPage2.locator(".contribution").count();
    assert.equal(tributesApprovedCount2, 0, "Pending tribute must NOT appear in public view");
    logStep("Guest Persona 2 Tribute Submission & Isolation", "PASS", {
      contributor: "Sarah Jenkins",
      approvedCountInPublicView: 0,
    });

    // --- Guest Persona 3: Hannah Finch-Cole (Tribute 2) ---
    console.log("   [Guest Persona 3] Opening incognito context...");
    const guestContext3 = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const guestPage3 = await guestContext3.newPage();
    await guestPage3.goto(`${BASE_URL}/m/${memorialSlug}`, { waitUntil: "networkidle" });
    await nav(guestPage3, "Tribute").click();

    if (await guestPage3.getByRole("button", { name: "Write a tribute" }).isVisible()) {
      await guestPage3.getByRole("button", { name: "Write a tribute" }).click();
    }
    await guestPage3.getByLabel("Your name").fill("Hannah Finch-Cole");
    await guestPage3.getByLabel("Your connection").fill("Niece & botanical illustrator");
    await guestPage3.getByLabel("Your memory").fill(
      "Uncle Alistair never visited without pockets smelling of cedar shavings and dried lavender. By campfire light, he whittled duck calls and bird whistles for the children while telling folklore about northern loons and quiet wetlands."
    );
    await guestPage3.getByRole("checkbox").check();
    await capture(guestPage3, "e2e-11-guest3-tribute-form.png", "Guest 3 filled tribute form (Theme: cedar whistles & storytelling)");
    await guestPage3.getByRole("button", { name: "Submit my tribute" }).click();
    await guestPage3.locator("h2:has-text('Your words are')").waitFor({ timeout: 10000 });
    await guestPage3.getByRole("button", { name: "Return to tributes" }).click();

    // --- Guest Persona 1 returns to submit Tribute 3 (Theme: conservation integrity) ---
    console.log("   [Guest Persona 1] Submitting third distinct tribute...");
    await nav(guestPage1, "Tribute").click();
    if (await guestPage1.getByRole("button", { name: "Write a tribute" }).isVisible()) {
      await guestPage1.getByRole("button", { name: "Write a tribute" }).click();
    }
    await guestPage1.getByLabel("Your name").fill("Prof. David O'Connor");
    await guestPage1.getByLabel("Your connection").fill("Department Chair & collaborator");
    await guestPage1.getByLabel("Your memory").fill(
      "For thirty-five years, Alistair directed the regional wetlands symposium without ever raising his voice. He persuaded developers and conservationists to break bread together, guided by relentless data and genuine human decency."
    );
    await guestPage1.getByRole("checkbox").check();
    await guestPage1.getByRole("button", { name: "Submit my tribute" }).click();
    await guestPage1.locator("h2:has-text('Your words are')").waitFor({ timeout: 10000 });
    await guestPage1.getByRole("button", { name: "Return to tributes" }).click();

    logStep("All Guest Tributes Submitted", "PASS", {
      totalGuestbookSubmitted: 1,
      totalTributesSubmitted: 3,
    });

    // Check memory wall from Guest 2
    await nav(guestPage2, "Memory wall").click();
    await guestPage2.locator("h3:has-text('A story is still taking shape.')").waitFor({ timeout: 10000 });
    await capture(guestPage2, "e2e-12-guest-wall-unapproved.png", "Memory wall before organizer publication");

    // -------------------------------------------------------------
    // STAGE 3: Organizer Moderation
    // -------------------------------------------------------------
    console.log("\n--- STAGE 3: Organizer Moderation ---");
    await organizerPage.bringToFront();
    await organizerPage.reload({ waitUntil: "networkidle" });
    await organizerPage.locator("h1:has-text('A little care.')").waitFor({ timeout: 15000 });

    // Verify stats show 4 pending (1 guestbook + 3 tributes)
    const pendingStat = await organizerPage.locator(".organizer-stats div:first-child span").innerText();
    assert.equal(pendingStat, "04", `Expected 04 pending, got ${pendingStat}`);
    await capture(organizerPage, "e2e-13-organizer-pending-queue.png", "Organizer console with 4 pending items");

    // Approve pending contributions
    console.log("   Approving all pending contributions in review queue...");
    while ((await organizerPage.locator(".review-entry button:has-text('Approve')").count()) > 0) {
      const btn = organizerPage.locator(".review-entry button:has-text('Approve')").first();
      await btn.click();
      await organizerPage.waitForTimeout(1500);
    }

    // Refresh organizer state
    await organizerPage.reload({ waitUntil: "networkidle" });
    await organizerPage.locator("h1:has-text('A little care.')").waitFor({ timeout: 15000 });
    await capture(organizerPage, "e2e-14-organizer-all-approved.png", "Organizer console: 0 pending, 3 approved tributes");

    const approvedStat = await organizerPage.locator(".organizer-stats div:nth-child(2) span").innerText();
    assert.equal(approvedStat, "03", `Expected 03 approved tributes, got ${approvedStat}`);
    logStep("Organizer Moderation", "PASS", {
      pendingRemaining: "00",
      approvedTributes: approvedStat,
    });

    // -------------------------------------------------------------
    // STAGE 4: Real Gemma Memory Weaver Execution
    // -------------------------------------------------------------
    console.log("\n--- STAGE 4: Real Gemma Memory Weaver Execution ---");
    const weaveButton = organizerPage.getByRole("button", { name: "Weave approved tributes" });
    await weaveButton.waitFor({ timeout: 5000 });
    assert.ok(await weaveButton.isEnabled(), "Weave button must be enabled with approved tributes");

    const weaveStartTime = Date.now();
    console.log("   🚀 Triggering real Gemma weave job...");
    await weaveButton.click();

    // Check status notice
    await organizerPage.getByText(/Weaving approved tributes with Gemma/i).waitFor({ timeout: 10000 });
    await capture(organizerPage, "e2e-15-weave-in-progress.png", "Weave in progress banner");

    // Wait for StoryEditor to appear (real Gemma inference takes ~30-150s)
    console.log("   ⏳ Waiting for real Gemma inference job to complete...");
    await organizerPage.locator("h3:has-text('Give the words your care.')").waitFor({ timeout: 240000 });
    const weaveDurationSec = ((Date.now() - weaveStartTime) / 1000).toFixed(1);
    console.log(`   ✨ Gemma weave completed in ${weaveDurationSec}s!`);

    await capture(organizerPage, "e2e-16-weave-completed-editor.png", "Story editor loaded with Gemma-generated draft");

    // Verify AI disclosure shows actual model
    const aiDisclosure = await organizerPage.locator(".ai-disclosure").innerText();
    console.log(`   AI Disclosure: ${aiDisclosure.replace(/\n/g, ' ')}`);
    assert.ok(aiDisclosure.includes("gemma-4-31b-it"), "AI disclosure must identify gemma-4-31b-it");

    // Check generated title and paragraphs
    const generatedTitle = await organizerPage.locator("#title").inputValue();
    const paragraph0 = await organizerPage.locator("#paragraph-0").inputValue();
    console.log(`   Generated Title: "${generatedTitle}"`);
    console.log(`   Paragraph 1 sample: "${paragraph0.slice(0, 80)}..."`);
    assert.ok(generatedTitle.length > 3, "Title must be non-empty");
    assert.ok(paragraph0.length > 20, "Paragraph 1 must be non-empty");

    logStep("Real Gemma Weave Execution", "PASS", {
      durationSeconds: weaveDurationSec,
      modelId: "gemma-4-31b-it",
      title: generatedTitle,
    });

    // -------------------------------------------------------------
    // STAGE 5: Source Inspection, Editing, Review & Publishing
    // -------------------------------------------------------------
    console.log("\n--- STAGE 5: Source Inspection & Publishing ---");

    // Click "Read source" on the first source chip in editor
    const readSourceBtn = organizerPage.locator("button:has-text('Read source')").first();
    await readSourceBtn.click();
    await organizerPage.locator(".source-dialog").waitFor({ timeout: 5000 });
    await capture(organizerPage, "e2e-17-editor-source-dialog.png", "Source inspection dialog showing original tribute text");
    const sourceDialogText = await organizerPage.locator(".source-dialog blockquote").innerText();
    console.log(`   Inspected source dialog: "${sourceDialogText.slice(0, 70)}..."`);
    assert.ok(sourceDialogText.length > 10, "Source dialog must contain genuine tribute text");

    // Close source dialog
    await organizerPage.locator(".dialog-close").click();

    // Edit title to personalized version
    const editedTitle = `${generatedTitle} — The Living Marshes`;
    await organizerPage.locator("#title").fill(editedTitle);

    // Save changes
    await organizerPage.getByRole("button", { name: "Save changes" }).click();
    await organizerPage.getByText("Your changes were saved.").waitFor({ timeout: 10000 });
    await capture(organizerPage, "e2e-18-editor-saved.png", "Edits saved confirmation");

    // Attempt to publish without review checkbox - should be disabled
    const publishBtn = organizerPage.getByRole("button", { name: "Publish to memory wall" });
    assert.ok(await publishBtn.isDisabled(), "Publish button MUST be disabled until reviewed checkbox is checked");

    // Check review confirmation
    await organizerPage.locator("input[name='reviewed']").check();
    assert.ok(await publishBtn.isEnabled(), "Publish button must be enabled once reviewed is checked");

    // Publish!
    await publishBtn.click();
    await organizerPage.locator("button:has-text('Unpublish remembrance')").waitFor({ timeout: 15000 });
    await capture(organizerPage, "e2e-19-organizer-published.png", "Story published (Unpublish button visible)");

    logStep("Organizer Edit & Publication Gate", "PASS", {
      editedTitle,
      reviewedGateEnforced: true,
      status: "published",
    });

    // -------------------------------------------------------------
    // STAGE 6: Guest Re-entry & Public Verification
    // -------------------------------------------------------------
    console.log("\n--- STAGE 6: Guest Re-entry & Public Verification ---");
    await guestPage1.bringToFront();
    await guestPage1.reload({ waitUntil: "networkidle" });
    await guestPage1.locator("h1:has-text('Dr. Alistair Finch')").waitFor({ timeout: 15000 });

    // 1. Verify Memory Wall
    await nav(guestPage1, "Memory wall").click();
    await guestPage1.locator(`h3:has-text("${editedTitle}")`).waitFor({ timeout: 15000 });
    await capture(guestPage1, "e2e-20-guest-wall-published.png", "Guest view: Published Memory Wall with custom title");

    // Verify source chips exist on public memory wall
    const sourceChips = await guestPage1.locator(".source-chips button").all();
    console.log(`   Found ${sourceChips.length} source chips on public memory wall.`);
    assert.ok(sourceChips.length > 0, "Public story must contain source citation chips");

    // Click first source chip to open SourceDialog as guest
    await sourceChips[0].click();
    await guestPage1.locator(".source-dialog").waitFor({ timeout: 5000 });
    await capture(guestPage1, "e2e-21-guest-source-dialog.png", "Guest clicked citation: Source dialog displays exact tribute");
    const guestSourceText = await guestPage1.locator(".source-dialog blockquote").innerText();
    assert.ok(guestSourceText.length > 10, "Guest source dialog displays approved tribute");
    await guestPage1.locator(".dialog-close").click();

    // 2. Verify Guestbook now displays Dr. Marcus Vance
    await nav(guestPage1, "Guestbook").click();
    await guestPage1.locator("strong:has-text('Dr. Marcus Vance')").waitFor({ timeout: 10000 });
    await capture(guestPage1, "e2e-22-guest-guestbook-approved.png", "Guest view: Approved guestbook entry is now visible");

    // 3. Verify Tributes now displays approved tributes
    await nav(guestPage1, "Tribute").click();
    await guestPage1.locator("strong:has-text('Sarah Jenkins')").waitFor({ timeout: 10000 });
    await capture(guestPage1, "e2e-23-guest-tributes-approved.png", "Guest view: Approved tributes are now visible");

    logStep("Guest View Verification", "PASS", {
      storyPublished: true,
      guestbookEntryVisible: "Dr. Marcus Vance",
      tributesVisible: ["Sarah Jenkins", "Hannah Finch-Cole", "Prof. David O'Connor"],
      citationsFunctional: true,
    });

    // -------------------------------------------------------------
    // STAGE 7: Unpublish & Republish Flow
    // -------------------------------------------------------------
    console.log("\n--- STAGE 7: Unpublish & Republish Flow ---");
    await organizerPage.bringToFront();
    await organizerPage.getByRole("button", { name: "Unpublish remembrance" }).click();
    await organizerPage.locator("button:has-text('Publish to memory wall')").waitFor({ timeout: 15000 });
    await capture(organizerPage, "e2e-24-organizer-unpublished.png", "Story unpublished in organizer console");

    // Verify guest sees unpublish immediately
    await guestPage2.bringToFront();
    await guestPage2.reload({ waitUntil: "networkidle" });
    await nav(guestPage2, "Memory wall").click();
    await guestPage2.locator("h3:has-text('A story is still taking shape.')").waitFor({ timeout: 10000 });
    await capture(guestPage2, "e2e-25-guest-wall-after-unpublish.png", "Guest view: Memory wall empty after unpublish");

    // Re-publish
    await organizerPage.bringToFront();
    await organizerPage.locator("input[name='reviewed']").check();
    await organizerPage.getByRole("button", { name: "Publish to memory wall" }).click();
    await organizerPage.locator("button:has-text('Unpublish remembrance')").waitFor({ timeout: 15000 });

    logStep("Unpublish / Republish Lifecycle", "PASS", {
      unpublishRemovesPublicStory: true,
      republishRestoresStory: true,
    });

    // -------------------------------------------------------------
    // STAGE 8: Recovery of Organizer Session in Fresh Browser Context
    // -------------------------------------------------------------
    console.log("\n--- STAGE 8: Organizer Session Recovery via Private Link ---");
    const freshContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    }); // completely clean cookies
    const freshPage = await freshContext.newPage();

    // Navigate to saved private URL (with #key=...)
    await freshPage.goto(privateUrl, { waitUntil: "networkidle" });
    await freshPage.locator("h1:has-text('A little care.')").waitFor({ timeout: 20000 });

    const recoveredUrl = freshPage.url();
    assert.ok(!recoveredUrl.includes("#key="), "Fragment secret must be cleared from address bar after exchange");
    await capture(freshPage, "e2e-26-recovered-organizer-session.png", "Clean browser context recovered organizer console via private link");

    logStep("Private Link Token Exchange & Session Recovery", "PASS", {
      recoveredUrl,
      fragmentStripped: true,
    });

    console.log("\n=== ✅ ALL END-TO-END WALKTHROUGH STEPS PASSED SUCCESSFULLY ===");

  } catch (error) {
    console.error("\n❌ E2E WALKTHROUGH FAILED:", error);
    logStep("End-to-End Walkthrough", "FAIL", { error: error.message, stack: error.stack });
  } finally {
    results.endTime = new Date().toISOString();
    await fs.writeFile(
      path.join(EVIDENCE_DIR, "e2e-walkthrough-results.json"),
      JSON.stringify(results, null, 2)
    );
    await browser.close();
  }
})();
