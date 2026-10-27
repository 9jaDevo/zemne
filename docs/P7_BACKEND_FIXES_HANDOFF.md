# P7 backend fixes — Claude → Antigravity / Codex

**Date:** 2026-10-27
**Branch:** `claude/p7-backend-fixes`, based on deployed `codex/p6-live-integration@7462a23`
**Commits:**
- `6d98a56`: BUG-P7-03
- `87b0423`: weave overload resilience
- `126b333`: live validation evidence

**Scope:** Claude-owned files only. No UI, 3D, brand, deployment or QA files were touched.

## 1. Triage of `docs/QA_REPORT.md` in Claude's domain

The report lists no P0/P1/P2 issues. Its raw evidence (`docs/evidence/p7/*.json`) disagrees with the report in two places, and one of them is high-risk for the core journey:

| # | Report says | Raw evidence says | Severity (Claude's assessment) | Owner |
|---|---|---|---|---|
| A | Step 9 "Real Gemma Memory Weave": **PASS** | `e2e-walkthrough-results.json`: final step **FAIL**, `locator.waitFor: Timeout 240000ms exceeded`. QA's own memorial got no draft within 240 s (`scripts/qa/e2e-walkthrough.cjs:309`). The PASS in the report relies on Codex's earlier P6 rehearsal memorial | **P1**: the core acceptance journey failed intermittently on production | Claude (weave), with root cause upstream |
| B | Cross-memorial access → **403 FORBIDDEN PASS**; create rate limit → **429 PASS** | `security-auth-results.json`: check "Security & Auth Audit" **FAIL**, `Created Memorial A: 429 !== 201`. The create rate limit (5 per hour per IP) stopped the test before the cross-memorial request was sent | Coverage gap: **cross-memorial isolation is unverified on production**. It is covered by backend integration tests | Antigravity retest |
| C | Error codes `AUTHENTICATION_REQUIRED` and `TOO_MANY_REQUESTS`; cookie `zemne_organizer_session`; Next.js 15.1.7; Render Oregon | These strings appear in no code, script or evidence file. The API returns `UNAUTHENTICATED` and `RATE_LIMITED`; the cookie is `__Host-zemne_org`; the repo is on Next 16.4.3; the service is in Virginia | Report accuracy | Antigravity |
| D | BUG-P7-03, a route-wiring cold-import timeout (Low) | Reproduced: the first import took 9.9 s against the 5 s default | Low | Claude |

## 2. Patch summary

### BUG-P7-03: `tests/backend/route-wiring.test.ts` (commit `6d98a56`)
Every route module is now preloaded once in `beforeAll`, with a 60 s allowance. Each test then only inspects loaded modules. `vitest.config.ts` is unchanged.

**Validated:** 3 cold-cache runs of the file passed 22/22 each, and a cold full `npm test` passed 196 with 9 live tests skipped.
**Status: fixed.**

### Item A: weave resilience under upstream overload (commit `87b0423`)
**Root cause:** most likely Google AI Studio free-tier overload. This is consistent with P5's measurements (6 of 13 real weaves failed with 500/503) and with the old single retry inside a 170 s budget. I couldn't read Render logs, since that console is Codex's.

**Changes:**
- `src/lib/ai/weaver.ts`:
  - 429/500/502/503 is retried up to **3×** with 3 s / 8 s / 15 s backoff, but only while at least 60 s of budget would remain.
  - Overload retries don't consume the repair attempt.
  - The budget is now **220 s**, and the job deadline 230 s.
- `src/server/handlers/organizer.ts`: the `weave_ok` log now includes `overload_retries`, and `weave_failed` includes the retry count in its detail.
- `src/shared/api/client.ts`: `weaveStory()` waits up to **300 s**, above the job deadline. The UI needs no code change.
- `docs/API_CONTRACT.md` 1.2.1: numbers and measurements only; the API shape is unchanged.

**Validated:**
- New unit regression tests cover repeated overload then success, the retry limit, the minimum-budget guard and the defaults.
- Real `gemma-4-31b-it` on synthetic data (`docs/evidence/p5/gemma-live-eval-gemma-4-31b-it-2026-10-27T19-31-53-929Z.json`): **4 of 6 succeeded**, versus 2 of 6 on the previous code. Two of the successes took 173.6 s and 216.9 s end to end, past the old 170 s budget. Two still failed with upstream 500 after 3 retries and failed safely, with nothing stored.

**Status: mitigated, not fixed.** Free-tier capacity remains the limiting factor. Reliable demos need a paid or billing-enabled key, an owner decision.

## 3. Exact retest steps for Antigravity

Prerequisite: Codex merges `claude/p7-backend-fixes` into `codex/p6-live-integration` and redeploys. Record the deployed commit (it must contain `87b0423`).

**R1. BUG-P7-03 (local, Windows)**
1. Check out the merged commit and run `npm ci`.
2. Delete `node_modules/.vite` and `node_modules/.vitest` if they exist.
3. Run `npx vitest run tests/backend/route-wiring.test.ts`. **Expect** 22 passed and no "timed out".
4. Run `npm test`. **Expect** all passed except 9 skipped live tests, with no timeouts.

**R2. Production weave (item A)**
1. Use a fresh synthetic memorial with 3 approved synthetic tributes.
2. Click "Weave approved tributes" and wait up to **300 s**. Do not use 240 s.
3. Record the outcome:
   - **Success:** the draft editor appears. Record the elapsed seconds.
   - **Failure:** the UI shows an AI error with retry. While still signed in as the organizer, open `GET /api/organizer/memorials/<id>/weave` in the same browser and record `job.error.code` and the elapsed time.
4. Repeat 3 times, or up to the weave rate limit of 6 per hour per memorial.
5. **Pass criteria:** every run ends as either a draft or a retryable `AI_*` error. None hangs past 300 s, none produces a draft citing unapproved tributes, and nothing appears on the public wall before Publish. Report the success rate as measured; a failure caused by upstream `AI_UNAVAILABLE` is a provider-capacity result, not a pass.
6. Ask Codex for the Render log lines `weave_ok` and `weave_failed` (they contain no tribute text) for those runs.

**R3. Cross-memorial isolation on production (item B)**
The create rate limit is 5 per hour per IP. Create exactly **two** memorials in this run, or wait an hour since your last creates.
1. Create memorial A and keep A's organizer cookie. Create memorial B from a second browser context.
2. With A's cookie, send:
   - `GET /api/organizer/memorials/<B id>` → **expect 403 `FORBIDDEN`**
   - `GET /api/organizer/memorials/<B id>/weave` → **expect 403 `FORBIDDEN`**
3. With A's cookie and a same-origin `Origin` header, send `PATCH /api/organizer/tributes/<a tribute id of B>` with `{"status":"approved"}` → **expect 404 `NOT_FOUND`**, and confirm B's tribute is still pending.
4. Record the actual response bodies (`error.code`) in the evidence JSON.

**R4. Report accuracy (item C)**
Correct the error codes and cookie name in `docs/QA_REPORT.md` §6.3 to the observed values, and record the framework and region from the deployment. Mark §3 step 9 and §6.3 row 6 per R2 and R3 results.
