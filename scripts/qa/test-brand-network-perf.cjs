/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");

const BASE_URL = process.env.ZEMNE_BASE_URL || "https://zemne-preview.onrender.com";
const EVIDENCE_DIR = path.resolve(__dirname, "../../docs/evidence/p7");

const results = {
  testSuite: "Brand Identity, Network Resilience & Performance Profiling",
  targetUrl: BASE_URL,
  startTime: new Date().toISOString(),
  brandAssets: [],
  networkResilience: [],
  performanceMetrics: {},
};

function logCheck(section, name, status, details = {}) {
  const item = { name, status, timestamp: new Date().toISOString(), ...details };
  if (!results[section]) results[section] = [];
  results[section].push(item);
  console.log(`[${status}] ${name}`);
  if (details.message) console.log(`       ${details.message}`);
}

(async () => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  console.log(`=== Starting ZEMNE Brand, Resilience & Performance QA on ${BASE_URL} ===\n`);

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-gpu"],
  });

  try {
    // -------------------------------------------------------------
    // PART 1: Brand Assets & Favicon Integrity Audit
    // -------------------------------------------------------------
    console.log("--- PART 1: Brand Assets & Favicon Integrity Audit ---");
    const assetsToAudit = [
      { path: "/brand/zemne-logo-primary.svg", type: "image/svg+xml", desc: "Primary vector logo" },
      { path: "/brand/zemne-mark.svg", type: "image/svg+xml", desc: "Original icon/monogram mark" },
      { path: "/brand/zemne-logo-light.svg", type: "image/svg+xml", desc: "Light mode logo lockup" },
      { path: "/brand/zemne-logo-dark.svg", type: "image/svg+xml", desc: "Dark mode logo lockup" },
      { path: "/favicon.svg", type: "image/svg+xml", desc: "SVG Favicon" },
      { path: "/favicon.ico", type: "image/x-icon", desc: "ICO Favicon (32x32)" },
      { path: "/brand/icon-180.png", type: "image/png", desc: "Apple touch icon (180x180)" },
      { path: "/brand/icon-192.png", type: "image/png", desc: "PWA icon (192x192)" },
      { path: "/brand/icon-512.png", type: "image/png", desc: "PWA icon (512x512)" },
      { path: "/manifest.webmanifest", type: "application/manifest+json", desc: "Web App Manifest" },
    ];

    for (const asset of assetsToAudit) {
      const res = await fetch(`${BASE_URL}${asset.path}`);
      const bytes = await res.arrayBuffer();
      const contentType = res.headers.get("content-type") || "";
      const isOk = res.ok && bytes.byteLength > 0;

      console.log(`   ${asset.path}: HTTP ${res.status}, ${bytes.byteLength} bytes (${contentType})`);
      assert.ok(isOk, `Asset ${asset.path} must exist and be non-empty`);

      logCheck("brandAssets", `Asset Check: ${asset.path}`, "PASS", {
        path: asset.path,
        description: asset.desc,
        httpStatus: res.status,
        byteLength: bytes.byteLength,
        contentType,
      });
    }

    // -------------------------------------------------------------
    // PART 2: Network Resilience & Offline Error Handling
    // -------------------------------------------------------------
    console.log("\n--- PART 2: Network Resilience & Offline Error Handling ---");
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    // Load page first
    await page.goto(`${BASE_URL}/create`, { waitUntil: "networkidle" });
    await page.locator("h2:has-text('Begin with their name.')").waitFor({ timeout: 15000 });

    // Fill form
    await page.getByLabel("Full name").fill("Network Resilience Test Subject");
    await page.getByLabel("A few words about them").fill("Testing graceful network failure behavior.");
    await page.locator("input[name='privacy_acknowledged']").check();

    // Now simulate offline network condition
    console.log("   Simulating offline condition (context.setOffline(true))...");
    await context.setOffline(true);

    // Submit while offline
    await page.getByRole("button", { name: "Create a memorial", exact: true }).click();

    // Verify application does not crash, but displays user-friendly error banner
    const noticeLocator = page.locator(".notice.error");
    await noticeLocator.waitFor({ timeout: 10000 });
    const errorNoticeText = await noticeLocator.innerText();
    console.log(`   Offline submission error caught: "${errorNoticeText}"`);
    assert.ok(
      errorNoticeText.toLowerCase().includes("connection") ||
      errorNoticeText.toLowerCase().includes("reach") ||
      errorNoticeText.toLowerCase().includes("offline"),
      "Error notice must mention connection or reachability"
    );

    const screenshotPath = path.join(EVIDENCE_DIR, "resilience-offline-error.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });

    logCheck("networkResilience", "Offline Submission Error Resilience", "PASS", {
      errorMessageShown: errorNoticeText,
      screenshot: "resilience-offline-error.png",
      crashPrevented: true,
    });

    // Restore network
    await context.setOffline(false);

    // -------------------------------------------------------------
    // PART 3: Real Performance Profiling & Metrics
    // -------------------------------------------------------------
    console.log("\n--- PART 3: Real Performance Profiling & Metrics ---");
    const perfPage = await context.newPage();

    // Profile landing page
    const navStart = Date.now();
    const response = await perfPage.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    const totalLoadMs = Date.now() - navStart;

    // Performance timing extraction via PerformanceNavigationTiming
    const perfTiming = await perfPage.evaluate(() => {
      const entry = performance.getEntriesByType("navigation")[0];
      const resources = performance.getEntriesByType("resource");
      let totalTransferred = 0;
      let jsBytes = 0;
      let cssBytes = 0;
      let imageBytes = 0;

      for (const r of resources) {
        totalTransferred += r.transferSize || 0;
        if (r.initiatorType === "script") jsBytes += r.transferSize || 0;
        else if (r.initiatorType === "link" || r.initiatorType === "css") cssBytes += r.transferSize || 0;
        else if (r.initiatorType === "img") imageBytes += r.transferSize || 0;
      }

      return {
        ttfbMs: Math.round(entry.responseStart - entry.requestStart),
        domInteractiveMs: Math.round(entry.domInteractive - entry.startTime),
        domContentLoadedMs: Math.round(entry.domContentLoadedEventEnd - entry.startTime),
        loadCompleteMs: Math.round(entry.loadEventEnd - entry.startTime),
        resourceCount: resources.length,
        totalTransferredBytes: totalTransferred,
        jsTransferBytes: jsBytes,
        cssTransferBytes: cssBytes,
        imageTransferBytes: imageBytes,
        domNodeCount: document.getElementsByTagName("*").length,
      };
    });

    console.log(`   Performance Results for Root (/):`);
    console.log(`     HTTP Status: ${response.status()}`);
    console.log(`     TTFB: ${perfTiming.ttfbMs} ms`);
    console.log(`     DOM Content Loaded: ${perfTiming.domContentLoadedMs} ms`);
    console.log(`     Load Event: ${perfTiming.loadCompleteMs} ms (Client total: ${totalLoadMs} ms)`);
    console.log(`     Total Resources: ${perfTiming.resourceCount}`);
    console.log(`     Total Transfer Size: ${(perfTiming.totalTransferredBytes / 1024).toFixed(1)} KB`);
    console.log(`     JS Transfer Size: ${(perfTiming.jsTransferBytes / 1024).toFixed(1)} KB`);
    console.log(`     DOM Nodes: ${perfTiming.domNodeCount}`);

    results.performanceMetrics = {
      route: "/",
      status: response.status(),
      clientTotalLoadMs: totalLoadMs,
      ...perfTiming,
    };

    console.log("\n=== ✅ BRAND, RESILIENCE & PERFORMANCE AUDIT COMPLETE ===");

  } catch (error) {
    console.error("\n❌ AUDIT FAILED:", error);
  } finally {
    results.endTime = new Date().toISOString();
    await fs.writeFile(
      path.join(EVIDENCE_DIR, "brand-resilience-perf-results.json"),
      JSON.stringify(results, null, 2)
    );
    await browser.close();
  }
})();
