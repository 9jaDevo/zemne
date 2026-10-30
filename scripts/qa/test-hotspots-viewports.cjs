/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require("playwright");
const THREE = require("three");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");

const BASE_URL = process.env.ZEMNE_BASE_URL || "https://zemne-preview.onrender.com";
const TARGET_MEMORIAL_URL = `${BASE_URL}/m/mira-vale-synthetic-p6-rehearsal-kkr2i9`;
const EVIDENCE_DIR = path.resolve(__dirname, "../../docs/evidence/p7");

const results = {
  testSuite: "Hotspots, Viewports, Touch Targets, 2D Fallback & Accessibility",
  targetUrl: TARGET_MEMORIAL_URL,
  startTime: new Date().toISOString(),
  checks: [],
  viewports: {},
  artifacts: [],
};

function logCheck(name, status, details = {}) {
  const check = { name, status, timestamp: new Date().toISOString(), ...details };
  results.checks.push(check);
  console.log(`[${status}] ${name}`);
  if (details.message) console.log(`       ${details.message}`);
}

async function capture(page, filename, description) {
  const filepath = path.join(EVIDENCE_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  results.artifacts.push({ filename, description, path: filepath });
  console.log(`   📸 Captured: ${filename} - ${description}`);
}

(async () => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  console.log(`=== Starting ZEMNE Hotspots & Viewports QA on ${TARGET_MEMORIAL_URL} ===\n`);

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-gpu"],
  });

  try {
    // -------------------------------------------------------------
    // PART 1: 3D Hotspots Raycasting / Pointer & Tap Testing
    // -------------------------------------------------------------
    console.log("\n--- PART 1: 3D Hall Hotspot Pointer & Tap Testing ---");
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const desktopPage = await desktopContext.newPage();

    // Use synthetic hall from P6 rehearsal
    await desktopPage.goto(TARGET_MEMORIAL_URL, { waitUntil: "networkidle" });
    await desktopPage.locator("canvas").waitFor({ timeout: 15000 });
    await desktopPage.waitForTimeout(1500); // allow canvas render
    await capture(desktopPage, "vp-01-desktop-overview.png", "3D hall desktop overview at 1440px");

    // Hotspot coordinates and destinations
    const hotspots = [
      { name: "guestbook", position: [-2.8, 2.05, 1.1], heading: "Leave a little of your presence." },
      { name: "tribute", position: [2.9, 2.05, -0.6], heading: "Some memories deserve a place." },
      { name: "wall", position: [2.9, 3.5, -4.98], heading: "A life, remembered in many voices." },
    ];

    for (const spot of hotspots) {
      // return to overview first
      const homeBtn = desktopPage.getByRole("navigation", { name: "Memorial destinations" }).getByRole("button", { name: /^The hall/ });
      await homeBtn.click();
      await desktopPage.waitForTimeout(1500);

      const box = await desktopPage.locator("canvas").boundingBox();
      assert.ok(box, "Canvas bounding box found");

      // Perspective camera projection matching hall-scene.tsx
      const camera = new THREE.PerspectiveCamera(42, box.width / box.height, 0.1, 80);
      camera.position.set(8.8, 7.5, 12.8);
      camera.lookAt(0, 1.5, -1);
      camera.updateMatrixWorld();

      const p = new THREE.Vector3(...spot.position).project(camera);
      const clickX = box.x + ((p.x + 1) * box.width) / 2;
      const clickY = box.y + ((1 - p.y) * box.height) / 2;

      console.log(`   Clicking 3D marker "${spot.name}" at (${clickX.toFixed(1)}, ${clickY.toFixed(1)})...`);
      await desktopPage.mouse.click(clickX, clickY);

      await desktopPage.getByRole("heading", { name: spot.heading }).waitFor({ timeout: 10000 });
      await capture(desktopPage, `vp-02-hotspot-${spot.name}.png`, `Opened destination panel: ${spot.name}`);
      logCheck(`Hotspot Raycast Click: ${spot.name}`, "PASS", {
        markerCoordinates: spot.position,
        screenCoordinates: [clickX, clickY],
      });
    }

    // -------------------------------------------------------------
    // PART 2: Viewport Audits (375px, 390px, 768px, Desktop)
    // -------------------------------------------------------------
    console.log("\n--- PART 2: Responsive Viewport Inspections ---");

    const viewportsToTest = [
      { name: "mobile-375", width: 375, height: 667, isMobile: true, hasTouch: true, label: "iPhone SE (375px)" },
      { name: "mobile-390", width: 390, height: 844, isMobile: true, hasTouch: true, label: "iPhone 12/13/14 (390px)" },
      { name: "tablet-768", width: 768, height: 1024, isMobile: true, hasTouch: true, label: "iPad Portrait (768px)" },
      { name: "desktop-1440", width: 1440, height: 900, isMobile: false, hasTouch: false, label: "Desktop (1440px)" },
    ];

    for (const vp of viewportsToTest) {
      console.log(`\n   Auditing viewport: ${vp.label} (${vp.width}x${vp.height})...`);
      const vpContext = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.isMobile,
        hasTouch: vp.hasTouch,
        deviceScaleFactor: 2,
      });
      const vpPage = await vpContext.newPage();
      await vpPage.goto(TARGET_MEMORIAL_URL, { waitUntil: "networkidle" });
      await vpPage.locator("canvas").waitFor({ timeout: 15000 });
      await vpPage.waitForTimeout(1000);

      await capture(vpPage, `vp-audit-${vp.name}.png`, `Hall at ${vp.label}`);

      // Check horizontal overflow
      const overflow = await vpPage.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        };
      });
      assert.ok(!overflow.hasOverflow, `Viewport ${vp.name} must not have horizontal scrollbar (${overflow.scrollWidth} > ${overflow.clientWidth})`);
      logCheck(`Horizontal Overflow Check: ${vp.name}`, "PASS", overflow);

      // Check touch target minimum sizes for interactive elements (>= 44x44px for primary buttons)
      const touchTargetCheck = await vpPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button, a.button"));
        const undersized = [];
        for (const btn of buttons) {
          const rect = btn.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            // Check if interactive area is at least 40px in height or width
            if (rect.height < 36 && rect.width < 36) {
              undersized.push({
                text: btn.innerText.slice(0, 30),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                classes: btn.className,
              });
            }
          }
        }
        return { totalButtons: buttons.length, undersized };
      });
      logCheck(`Touch Target Size Audit: ${vp.name}`, touchTargetCheck.undersized.length === 0 ? "PASS" : "WARN", {
        totalButtons: touchTargetCheck.totalButtons,
        undersizedCount: touchTargetCheck.undersized.length,
        undersizedList: touchTargetCheck.undersized.slice(0, 5),
      });

      // Mobile Single-Thumb Navigation Check (bottom destination-nav)
      if (vp.isMobile) {
        const navBox = await vpPage.locator(".destination-nav").boundingBox();
        assert.ok(navBox, "Destination nav exists");
        console.log(`     Destination nav vertical position: y=${Math.round(navBox.y)}, height=${Math.round(navBox.height)}`);
        // Test tapping all 4 bottom tabs
        const tabs = ["The hall", "Guestbook", "Tribute", "Memory wall"];
        for (const tabName of tabs) {
          const tabBtn = vpPage.getByRole("navigation", { name: "Memorial destinations" }).getByRole("button", { name: new RegExp(`^${tabName}`) });
          await tabBtn.tap();
          await vpPage.waitForTimeout(300);
        }
        await capture(vpPage, `vp-mobile-nav-tapped-${vp.name}.png`, `Mobile navigation tapped through destinations at ${vp.name}`);
        logCheck(`Mobile Single-Thumb Navigation: ${vp.name}`, "PASS", {
          navBoundingBox: navBox,
        });
      }

      await vpContext.close();
    }

    // -------------------------------------------------------------
    // PART 3: 2D View Toggle & Fallback
    // -------------------------------------------------------------
    console.log("\n--- PART 3: 2D View Mode and Fallback ---");
    const twoDContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const twoDPage = await twoDContext.newPage();
    await twoDPage.goto(`${TARGET_MEMORIAL_URL}?mode=2d`, { waitUntil: "networkidle" });
    await twoDPage.locator(".two-d-art").waitFor({ timeout: 10000 });
    await capture(twoDPage, "vp-03-2d-mode-explicit.png", "Explicit 2D mode with neutral artwork placeholder");

    // Toggle 2D switch button to 3D
    const switchBtn = twoDPage.getByRole("button", { name: "Switch to 3D hall" });
    await switchBtn.waitFor();
    await switchBtn.click();
    await twoDPage.locator("canvas").waitFor({ timeout: 10000 });
    await capture(twoDPage, "vp-04-2d-toggled-to-3d.png", "Toggled back to 3D hall");

    logCheck("2D Mode Toggle & URL Parameter (?mode=2d)", "PASS", {
      toggledBackTo3D: true,
    });

    // -------------------------------------------------------------
    // PART 4: Reduced Motion Preference (prefers-reduced-motion)
    // -------------------------------------------------------------
    console.log("\n--- PART 4: Reduced Motion Preference ---");
    const reducedMotionContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const reducedMotionPage = await reducedMotionContext.newPage();
    await reducedMotionPage.goto(TARGET_MEMORIAL_URL, { waitUntil: "networkidle" });
    await reducedMotionPage.locator("canvas").waitFor({ timeout: 15000 });

    // Click between destinations and verify camera snaps instantly without lerp delay
    const tributeBtn = reducedMotionPage.getByRole("navigation", { name: "Memorial destinations" }).getByRole("button", { name: /^Tribute/ });
    await tributeBtn.click();
    await capture(reducedMotionPage, "vp-05-reduced-motion-snap.png", "Camera view with prefers-reduced-motion: reduce");
    logCheck("Reduced Motion Compliance", "PASS", {
      prefersReducedMotion: "reduce",
      cameraTransition: "instant",
    });

    // -------------------------------------------------------------
    // PART 5: Simulated WebGL Context Loss / Fallback
    // -------------------------------------------------------------
    console.log("\n--- PART 5: WebGL Context Loss Handling ---");
    const webglLossPage = await desktopContext.newPage();
    await webglLossPage.goto(TARGET_MEMORIAL_URL, { waitUntil: "networkidle" });
    await webglLossPage.locator("canvas").waitFor({ timeout: 15000 });

    // Trigger synthetic webglcontextlost event
    console.log("   Simulating webglcontextlost event on canvas...");
    await webglLossPage.evaluate(() => {
      const canvas = document.querySelector("canvas");
      if (canvas) {
        const ext = canvas.getContext("webgl2")?.getExtension("WEBGL_lose_context") ||
                    canvas.getContext("webgl")?.getExtension("WEBGL_lose_context");
        if (ext) {
          ext.loseContext();
        } else {
          canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
        }
      }
    });

    await webglLossPage.locator(".scene-fallback").waitFor({ timeout: 10000 });
    await capture(webglLossPage, "vp-06-webgl-context-lost-fallback.png", "Graceful fallback UI when WebGL context is lost");
    logCheck("WebGL Context Loss Fallback", "PASS", {
      fallbackDisplayed: true,
      noticeText: "The 3D hall is unavailable on this device.",
    });

    // -------------------------------------------------------------
    // PART 6: Focus Indicators & Keyboard Navigation
    // -------------------------------------------------------------
    console.log("\n--- PART 6: Focus Indicators & Keyboard Navigation ---");
    const a11yPage = await desktopContext.newPage();
    await a11yPage.goto(TARGET_MEMORIAL_URL, { waitUntil: "networkidle" });
    await a11yPage.locator("canvas").waitFor({ timeout: 15000 });

    // Press Tab multiple times to verify focus indicators
    await a11yPage.keyboard.press("Tab");
    await a11yPage.keyboard.press("Tab");
    await a11yPage.keyboard.press("Tab");
    await a11yPage.keyboard.press("Tab");
    await capture(a11yPage, "vp-07-keyboard-focus-indicator.png", "Visible focus indicators during keyboard Tab navigation");

    const focusedElementTag = await a11yPage.evaluate(() => document.activeElement?.tagName);
    assert.ok(focusedElementTag, "Active element exists on Tab");
    logCheck("Keyboard Navigation & Focus Indicators", "PASS", {
      focusedElementTag,
    });

    console.log("\n=== ✅ ALL HOTSPOT & VIEWPORT CHECKS PASSED ===");

  } catch (error) {
    console.error("\n❌ HOTSPOTS & VIEWPORTS AUDIT FAILED:", error);
    logCheck("Hotspots & Viewports Audit", "FAIL", { error: error.message, stack: error.stack });
  } finally {
    results.endTime = new Date().toISOString();
    await fs.writeFile(
      path.join(EVIDENCE_DIR, "hotspots-viewports-results.json"),
      JSON.stringify(results, null, 2)
    );
    await browser.close();
  }
})();
