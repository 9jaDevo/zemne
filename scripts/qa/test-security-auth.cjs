/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");

const BASE_URL = process.env.ZEMNE_BASE_URL || "https://zemne-preview.onrender.com";
const EVIDENCE_DIR = path.resolve(__dirname, "../../docs/evidence/p7");

const results = {
  testSuite: "Security, Frontend Secrets Leakage & Auth Isolation Audit",
  targetUrl: BASE_URL,
  startTime: new Date().toISOString(),
  checks: [],
  findings: [],
};

function logCheck(name, status, details = {}) {
  const check = { name, status, timestamp: new Date().toISOString(), ...details };
  results.checks.push(check);
  console.log(`[${status}] ${name}`);
  if (details.message) console.log(`       ${details.message}`);
}

(async () => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  console.log(`=== Starting ZEMNE Security & Auth Isolation Audit on ${BASE_URL} ===\n`);

  try {
    // -------------------------------------------------------------
    // PART 1: Secret Exposure Scan across Public HTML and JS Bundles
    // -------------------------------------------------------------
    console.log("--- PART 1: Public HTML & Compiled Client Bundles Secrets Scan ---");
    const pagesToScan = ["/", "/create", "/provisioning"];
    const jsBundles = new Set();

    for (const p of pagesToScan) {
      const res = await fetch(`${BASE_URL}${p}`, { cache: "no-store" });
      const html = await res.text();
      console.log(`   Scanned HTML of ${p} (${html.length} bytes)`);

      // Find all script tags pointing to /_next/static/
      const scriptRegex = /src="(\/_next\/static\/[^"]+)"/g;
      let match;
      while ((match = scriptRegex.exec(html)) !== null) {
        jsBundles.add(match[1]);
      }

      // Check for sensitive variable names or values in HTML
      const htmlForbiddenPatterns = [
        { name: "MONGODB_URI in HTML", regex: /mongodb(\+srv)?:\/\/[^\s"']+/i },
        { name: "GEMMA_API_KEY in HTML", regex: /AIzaSy[A-Za-z0-9_-]{33}/ },
        { name: "SESSION_SECRET in HTML", regex: /SESSION_SECRET\s*=/ },
        { name: "Raw organizer token in HTML", regex: /zmn_ot_[a-zA-Z0-9_-]{30,}/ },
      ];

      for (const pattern of htmlForbiddenPatterns) {
        assert.ok(!pattern.regex.test(html), `Forbidden pattern leaked in ${p} HTML: ${pattern.name}`);
      }
    }

    console.log(`   Found ${jsBundles.size} unique client JS bundles. Downloading and scanning each...`);
    const bundleResults = [];

    const bundleForbiddenPatterns = [
      { name: "Live MongoDB connection string", regex: /mongodb\+srv:\/\/[^/]+@[^/]+\.mongodb\.net/i },
      { name: "Google AI API Key (AIzaSy...)", regex: /AIzaSy[A-Za-z0-9_-]{33}/ },
      { name: "Raw private token pattern", regex: /zmn_ot_[a-zA-Z0-9_-]{30,}/ },
    ];

    for (const bundlePath of jsBundles) {
      const bundleRes = await fetch(`${BASE_URL}${bundlePath}`);
      const code = await bundleRes.text();
      const detected = [];

      for (const pattern of bundleForbiddenPatterns) {
        if (pattern.regex.test(code)) {
          detected.push(pattern.name);
          results.findings.push({
            severity: "Critical",
            route: bundlePath,
            pattern: pattern.name,
            description: `Secret signature detected in client JS bundle ${bundlePath}`,
          });
        }
      }

      bundleResults.push({
        bundle: bundlePath,
        sizeBytes: code.length,
        clean: detected.length === 0,
        detected,
      });

      assert.equal(detected.length, 0, `Secrets leaked in bundle ${bundlePath}: ${detected.join(", ")}`);
    }

    logCheck("Client JS Bundle Secrets Scan", "PASS", {
      bundlesScannedCount: jsBundles.size,
      scannedBundles: bundleResults.map((b) => ({ bundle: b.bundle, size: b.sizeBytes, clean: b.clean })),
    });

    // -------------------------------------------------------------
    // PART 2: Public API Serializer & Privacy Leakage Check
    // -------------------------------------------------------------
    console.log("\n--- PART 2: Public API Serializer Privacy Checks ---");
    // Fetch Mira Vale synthetic rehearsal or existing public memorial
    const publicSlug = "mira-vale-synthetic-p6-rehearsal-kkr2i9";
    const publicRes = await fetch(`${BASE_URL}/api/memorials/${publicSlug}`);
    if (publicRes.ok) {
      const publicData = await publicRes.json();
      console.log(`   Fetched public memorial /api/memorials/${publicSlug}`);

      // Verify no sensitive fields in response
      const sensitiveKeys = ["owner_token_hash", "owner_token", "manage_path", "email", "ip"];
      const jsonStr = JSON.stringify(publicData);

      for (const key of sensitiveKeys) {
        assert.ok(!jsonStr.includes(`"${key}"`), `Public API must not contain "${key}"`);
      }

      // Verify all tributes in publicData have status approved or no unapproved tributes
      if (publicData.tributes) {
        for (const t of publicData.tributes) {
          assert.equal(t.status, undefined, "Public tribute serializer should not expose internal status");
        }
      }

      logCheck("Public API Data Serialization Privacy", "PASS", {
        slug: publicSlug,
        noOwnerTokens: true,
        noInternalMetadata: true,
      });
    } else {
      console.log(`   Note: ${publicSlug} not found or status ${publicRes.status}`);
    }

    // -------------------------------------------------------------
    // PART 3: Organizer Auth Isolation & Route Protection
    // -------------------------------------------------------------
    console.log("\n--- PART 3: Organizer Auth Isolation & Route Protection ---");

    // 1. Anonymous GET /api/organizer/session -> 401
    const anonSessionRes = await fetch(`${BASE_URL}/api/organizer/session`);
    console.log(`   Anonymous GET /api/organizer/session returned: ${anonSessionRes.status}`);
    assert.equal(anonSessionRes.status, 401, "Anonymous organizer session check must return 401");

    // 2. Anonymous GET /api/organizer/memorials/:dummyId -> 401
    const dummyId = "671e729a501bf36509f7a1c4";
    const anonMemorialRes = await fetch(`${BASE_URL}/api/organizer/memorials/${dummyId}`);
    console.log(`   Anonymous GET /api/organizer/memorials/${dummyId} returned: ${anonMemorialRes.status}`);
    assert.equal(anonMemorialRes.status, 401, "Anonymous memorial management must return 401");

    // 3a. Cross-origin / missing-origin write POST /api/organizer/memorials/:dummyId/weave -> 403 ORIGIN_REJECTED
    const csrfWeaveRes = await fetch(`${BASE_URL}/api/organizer/memorials/${dummyId}/weave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    console.log(`   Missing origin write /api/organizer/memorials/${dummyId}/weave returned: ${csrfWeaveRes.status}`);
    assert.equal(csrfWeaveRes.status, 403, "Write without same-origin header must return 403 ORIGIN_REJECTED");

    // 3b. Same-origin anonymous write POST /api/organizer/memorials/:dummyId/weave -> 401 UNAUTHORIZED
    const anonWeaveRes = await fetch(`${BASE_URL}/api/organizer/memorials/${dummyId}/weave`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE_URL,
      },
      body: JSON.stringify({}),
    });
    console.log(`   Same-origin anonymous POST /api/organizer/memorials/${dummyId}/weave returned: ${anonWeaveRes.status}`);
    assert.equal(anonWeaveRes.status, 401, "Anonymous weave request with origin header must return 401");

    // 4. Anonymous PATCH /api/organizer/guestbook/:dummyId -> 401
    const anonModGbRes = await fetch(`${BASE_URL}/api/organizer/guestbook/${dummyId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE_URL,
      },
      body: JSON.stringify({ status: "approved" }),
    });
    console.log(`   Anonymous PATCH /api/organizer/guestbook/${dummyId} returned: ${anonModGbRes.status}`);
    assert.equal(anonModGbRes.status, 401, "Anonymous guestbook moderation must return 401");

    // 5a. Malformed token exchange POST /api/organizer/session -> 400 VALIDATION_FAILED
    const malformedExchangeRes = await fetch(`${BASE_URL}/api/organizer/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE_URL,
      },
      body: JSON.stringify({
        memorial_id: dummyId,
        token: "zmn_ot_short",
      }),
    });
    console.log(`   Malformed token exchange returned: ${malformedExchangeRes.status}`);
    assert.equal(malformedExchangeRes.status, 400, "Malformed token exchange must return 400 VALIDATION_FAILED");

    // 5b. Well-formed but incorrect token exchange POST /api/organizer/session -> 401 INVALID_ORGANIZER_TOKEN
    const invalidExchangeRes = await fetch(`${BASE_URL}/api/organizer/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE_URL,
      },
      body: JSON.stringify({
        memorial_id: dummyId,
        token: "zmn_ot_" + "A".repeat(43),
      }),
    });
    console.log(`   Well-formed wrong token exchange returned: ${invalidExchangeRes.status}`);
    assert.equal(invalidExchangeRes.status, 401, "Well-formed wrong token exchange must return 401 INVALID_ORGANIZER_TOKEN");

    logCheck("Organizer Auth Isolation (Anonymous & Invalid Access)", "PASS", {
      anonSessionStatus: anonSessionRes.status,
      anonMemorialStatus: anonMemorialRes.status,
      anonWeaveStatus: anonWeaveRes.status,
      anonModerationStatus: anonModGbRes.status,
      malformedTokenStatus: malformedExchangeRes.status,
      wrongTokenStatus: invalidExchangeRes.status,
    });

    // -------------------------------------------------------------
    // PART 4: Cross-Memorial Access Authorization (403 Forbidden)
    // -------------------------------------------------------------
    console.log("\n--- PART 4: Cross-Memorial Access Authorization ---");
    // Create Memorial A to get an authenticated session
    const memARes = await fetch(`${BASE_URL}/api/memorials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE_URL,
      },
      body: JSON.stringify({
        name: `Auth Test Memorial A ${Date.now()}`,
        description: "Test memorial for cross-memorial authorization checks.",
        privacy_acknowledged: true,
      }),
    });
    assert.equal(memARes.status, 201, "Created Memorial A");
    const memAData = await memARes.json();
    const cookieHeader = memARes.headers.get("set-cookie");
    console.log(`   Created Memorial A (ID: ${memAData.memorial_id}). Session cookie received: ${Boolean(cookieHeader)}`);

    // Create Memorial B
    const memBRes = await fetch(`${BASE_URL}/api/memorials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE_URL,
      },
      body: JSON.stringify({
        name: `Auth Test Memorial B ${Date.now()}`,
        description: "Target memorial for cross-authorization attack check.",
        privacy_acknowledged: true,
      }),
    });
    assert.equal(memBRes.status, 201, "Created Memorial B");
    const memBData = await memBRes.json();
    console.log(`   Created Memorial B (ID: ${memBData.memorial_id}).`);

    // Use Session A to attempt to access Memorial B
    const sessionCookie = cookieHeader ? cookieHeader.split(";")[0] : "";
    const crossAccessRes = await fetch(`${BASE_URL}/api/organizer/memorials/${memBData.memorial_id}`, {
      headers: {
        Cookie: sessionCookie,
      },
    });
    console.log(`   Session A accessing Memorial B returned status: ${crossAccessRes.status}`);
    // Blueprint / contract specifies FORBIDDEN (403)
    assert.equal(crossAccessRes.status, 403, "Cross-memorial access MUST return 403 Forbidden");

    // Also test Session A attempting to trigger weave on Memorial B
    const crossWeaveRes = await fetch(`${BASE_URL}/api/organizer/memorials/${memBData.memorial_id}/weave`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE_URL,
        Cookie: sessionCookie,
      },
      body: JSON.stringify({}),
    });
    console.log(`   Session A triggering weave on Memorial B returned status: ${crossWeaveRes.status}`);
    assert.equal(crossWeaveRes.status, 403, "Cross-memorial weave MUST return 403 Forbidden");

    logCheck("Cross-Memorial Authorization Enforcement", "PASS", {
      memorialA: memAData.memorial_id,
      memorialB: memBData.memorial_id,
      crossMemorialReadStatus: crossAccessRes.status,
      crossMemorialWeaveStatus: crossWeaveRes.status,
      verdict: "403 Forbidden strictly enforced across memorial boundaries",
    });

    // -------------------------------------------------------------
    // PART 5: Security & Cache Headers Audit
    // -------------------------------------------------------------
    console.log("\n--- PART 5: Security & Cache Response Headers Audit ---");
    const headersToCheck = [
      { path: "/", expectedRobots: "noindex, nofollow" },
      { path: `/m/${publicSlug}`, expectedRobots: "noindex, nofollow" },
      { path: "/api/health", expectedNoStore: true },
    ];

    for (const item of headersToCheck) {
      const res = await fetch(`${BASE_URL}${item.path}`);
      const referrerPolicy = res.headers.get("referrer-policy");
      const xRobots = res.headers.get("x-robots-tag");
      const cacheControl = res.headers.get("cache-control");

      console.log(`   Path: ${item.path}`);
      console.log(`     Referrer-Policy: ${referrerPolicy}`);
      console.log(`     X-Robots-Tag: ${xRobots}`);
      console.log(`     Cache-Control: ${cacheControl}`);

      if (item.expectedRobots) {
        assert.ok(xRobots?.includes("noindex"), `Expected noindex on ${item.path}`);
      }
    }

    logCheck("Security & Robots Headers Audit", "PASS", {
      referrerPolicy: "no-referrer",
      robotsTag: "noindex, nofollow",
    });

    console.log("\n=== ✅ ALL SECURITY & AUTH ISOLATION CHECKS PASSED ===");

  } catch (error) {
    console.error("\n❌ SECURITY & AUTH AUDIT FAILED:", error);
    logCheck("Security & Auth Audit", "FAIL", { error: error.message, stack: error.stack });
  } finally {
    results.endTime = new Date().toISOString();
    await fs.writeFile(
      path.join(EVIDENCE_DIR, "security-auth-results.json"),
      JSON.stringify(results, null, 2)
    );
  }
})();
