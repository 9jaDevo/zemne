# ZEMNE — PHASE TRACKER
**Version:** 1.0 | **Period:** October 27–31, 2026 | **Authority:** `01_ZEMNE_MASTER_BLUEPRINT.md`

## Usage rules
- `- [ ]` means NOT VERIFIED. Mark complete only with code/URL/test evidence; an agent saying "done" is not enough.
- Phase gates are sequential; frontend work can proceed with approved mock fixtures after API types are locked.
- Codex merges integration changes; Claude owns API/backend; Antigravity validates integrated/deployed product.
- Agents should append evidence and handoff below each phase, not rewrite prior verified evidence.
- Each phase requires a commit/PR reference, actual tests run, blockers and next agent handoff.

## Current summary
| Phase | Owner | Outcome | State |
|---|---|---|---|
| P0 | Codex | New public repository and tooling | COMPLETE (license selection pending owner approval) |
| P1 | Claude | Backend/API contract and fixtures | COMPLETE — PR #1 awaiting Codex merge |
| P2 | Codex | Original branding and real 3D + screens | IMPLEMENTED — PR #2; owner visual approval pending |
| P3 | Codex | Atlas + Render provisioning | BLOCKED — Atlas organization policy / Render authentication; local preparation validated |
| P4 | Claude | Real persistence, organizer authorization and moderation APIs | NOT STARTED |
| P5 | Claude | Real Gemma Memory Weaver with evidence validation | NOT STARTED |
| P6 | Codex | Frontend/API integration and production deploy | NOT STARTED |
| P7 | Antigravity + owners | Independent browser E2E, UX, bugs, fixes | NOT STARTED |
| P8 | Codex + Claude | Judge evidence, DEV article, submit | NOT STARTED |

---

## P0 — Create repository and foundation [CODEX]
- [x] Verify new project and public GitHub repo `zemne` were created during Week 4 window; record exact date and repo URL.
- [x] Place all three project documents at repo root (or `docs/` with consistent paths).
- [x] Scaffold a single React + TypeScript + Next.js web app with React Three Fiber, Tailwind, lint/typecheck/test infrastructure.
- [x] Configure safe public repo defaults: `.gitignore`, `.env.example`, no secrets, license/readme, access-controlled main branch if available. README documents license decision deferred; package is UNLICENSED pending explicit owner approval.
- [x] Create shared folder boundaries and design/backend placeholders, no fake functional claims.
- [x] Run install/build/lint; initial clean commit.
**Gate:** public repository is accessible; app boots; no secret in tracked files.
**Evidence:** https://github.com/9jaDevo/zemne | Initial commit `4997355fbbe2111564e4fd920b2587eb1ba44cc7` | Cross-platform lockfile fix `63e7a5a5550d91b090ab3bc8b4b119147877f60b` | Date October 27, 2026.

### P0 execution evidence and handoff — Codex
- GitHub API verified `visibility: public`, owner `9jaDevo`, admin access, and `created_at: 2026-10-27T09:07:38Z` (October 27 at 05:07:38 EDT), inside the blueprint's Week 4 window. No backdating or previous implementation reuse. Initial implementation commit and remote `main` pushed during the window.
- Stack installed: Next.js 16.4.3 App Router, React/React DOM 19.3.1, TypeScript 5.9.3, Tailwind 4.3.3, React Three Fiber 9.8.2, Three.js 0.180.0, Vitest 5.0.5; Node 24.11.1 / npm 11.6.2 locally. Exact dependency graph in `package-lock.json`.
- Commands passed: `npm install`, fresh `npm ci`, `npm run lint` (zero warnings), `npm run typecheck`, `npm test` (1 file, 2 repository guardrail tests), `npm run build`. Install/audit after toolchain updates reported zero vulnerabilities. These tests do not prove product functionality/security.
- Production HTTP smoke: `npm start -- --hostname 127.0.0.1 --port 3100`; GET `/` returned 200 with the explicit under-development notice; GET `/api/health` returned 404, as no API is implemented in P0. Server stopped after check. No browser/device QA or deployment claimed.
- CI: initial Linux run https://github.com/9jaDevo/zemne/actions/runs/40480092738 failed at `npm ci` because the Windows-generated lockfile omitted cross-platform optional entries. Regenerated in an empty temporary directory; fix `63e7a5a` passed all Linux CI steps: https://github.com/9jaDevo/zemne/actions/runs/40480703438.
- Main protection verified through GitHub API: strict required `verify` check; force pushes and branch deletion disabled. Administrator bypass remains enabled for the sole owner; branch restrictions and mandatory human review are not configured. Use feature branches/PRs and passing CI for future integration.
- Safety review: inspected all staged source/configuration and the three planning documents; no actual credentials/user records present. Pattern scan found no credential signatures in implementation; environment/private-key ignores verified. `.env.example` has only the five backend variable names, without values or `=`. Local commit identity uses GitHub noreply email. Blueprint and phase prompts preserved; only P0/its summary row edited in this tracker.
- Files: root tooling/configuration, lockfile, README, `.github/workflows/ci.yml`, `src/app/{layout.tsx,page.tsx,globals.css}`, `tests/scaffold.test.ts`; empty ownership directories tracked with `.gitkeep`. No logo/3D scene, API handler, database/AI logic, synthetic product fixture, cloud provisioning or deployment implemented.
- Limitations: license grant awaits explicit owner approval (no LICENSE file); ESLint 9.39.5 has an upstream support warning. ESLint 10 was evaluated but reverted because bundled Next.js React/import/accessibility plugins declare incompatible peers; compatible ESLint 9 passes lint. No production-readiness claim.
- **Exact Claude P1 handoff:** fetch/pull latest `main` from `https://github.com/9jaDevo/zemne.git`; create a short feature branch, e.g. `claude/p1-contracts`. Re-read master/tracker. Author `docs/API_CONTRACT.md`; own runtime schemas/types in `src/shared`, sanitized fictional memorial/three-persona fixtures in `fixtures`, validation tests in `tests/backend/*.test.ts`. Use imports from `@/shared/...` in app code. Vitest discovers `tests/**/*.test.{ts,tsx}` with Node environment; configure any test import aliases if needed. Choose/install runtime validation in P1; it is deliberately not predefined in P0. Specify all route/error/state, secret-fragment exchange, scoped cookie/expiry, CSRF/origin, moderation, rate-limit and source-linked Gemma JSON contracts required by the P1 prompt. Do not implement full APIs, alter Codex frontend/brand/3D, provision resources or begin P2. Run lint/typecheck/test/build, update only P1, and return commit/PR plus exact type/fixture integration paths.

## P1 — Data types and HTTP contracts [CLAUDE]
- [x] Create `docs/API_CONTRACT.md` with endpoints, error shapes, auth/permission model and JSON fixtures. (18 tagged JSON examples, each validated by `tests/backend/docs-examples.test.ts`)
- [x] Define memorial, pending guestbook, pending tribute, approved contributions, story draft types with status enums. (`src/shared/api/schemas.ts`, `state.ts`)
- [x] Define token exchange + cookie session rules, rate limit and CSRF approach. (contract §2–§3)
- [x] Define Gemma input/output JSON contract and model-error response. (contract §6, `src/shared/api/weave.ts`; AI errors 502/503/504)
- [x] Add contract validation tests and fixture seed for fictitious memorial + three fabricated guests. (`src/shared/fixtures/`, 83 tests)
- [x] Ensure no direct UI or cloud changes in this phase. (diff touches only `docs/API_CONTRACT.md`, `src/shared/**`, `tests/backend/**`, `package.json`/lock for `zod`, and this tracker)
**Gate:** Codex can implement UI from contract, even if backend is a mock.
**Evidence:** PR https://github.com/9jaDevo/zemne/pull/1 (branch `claude/p1-api-contract`, commit `0b022a6`) | Files: `docs/API_CONTRACT.md`, `src/shared/api/*`, `src/shared/fixtures/*`, `tests/backend/*.test.ts` | Test results (2026-10-27, local Windows, Node 24.11.1): `npm test` 7 files / 83 tests passed; `npm run typecheck` clean; `npm run lint` 0 warnings; `npm run build` passed
**Handoff to Codex:** API fields/events/states/fixtures and mock adapter expectations.

### P1 handoff (Claude → Codex, 2026-10-27)
- **Phase / agent:** P1 / Claude
- **Commit or PR:** https://github.com/9jaDevo/zemne/pull/1 (`0b022a6` + tracker commit)
- **Implemented:** contract v1.0.0. Covers 14 routes; the fragment token → `__Host-zemne_org` cookie flow (HttpOnly, Secure, SameSite=Strict, 12 h); SHA-256 token hash; CSRF/origin rules; rate limits; moderation and story state machines; public allowlist serialization; the Gemma weave I/O contract and validator; the error model. Also typed Zod schemas, a reference HTTP client, a synthetic fixture and the DEMO mock client.
- **Real commands/tests executed and results:** `npm test` (83/83 pass), `npm run typecheck`, `npm run lint`, `npm run build`: all pass.
- **Evidence links/screenshots:** n/a (no UI in P1).
- **Incomplete items/blockers:**
  - No API routes are implemented; that is P4/P5.
  - P4 must verify Render's `X-Forwarded-For`/`X-Forwarded-Host` behaviour for rate-limit keys and the origin check.
  - Rotate-token is in the contract; P4 implements it.
- **Files/API contracts changed:** new `docs/API_CONTRACT.md`, `src/shared/api/`, `src/shared/fixtures/`, `tests/backend/`; `zod` added as a dependency.
- **Recommended next action (Codex, P2):**
  - Import types and schemas from `@/shared/api` and fixtures and the mock from `@/shared/fixtures`.
  - Code every screen against the `ZemneApiClient` interface using `createMockClient()`, and show a visible DEMO badge while `client.isDemo`.
  - In P6, swap to `createHttpClient()`. No other UI change should be needed.
  - The full integration notes are in the contract §1–§9 and in the final P1 chat handoff.

## P2 — Brand and polished immersive frontend [CODEX]
- [x] Produce 3 independent custom logo concepts; select/refine one with recognizable icon plus editorial wordmark.
- [x] Export actual usable SVG primary/light/dark + icon, SVG/favicon.ico/PNG app icon sizes, and brand guide.
- [x] Test mark at 16, 32, 180 px and on light/dark backgrounds; no generic AI/death imagery.
- [x] Build actual React Three Fiber virtual hall geometry with architectural materials, portrait area and hotspots: guestbook, tribute, memory wall.
- [x] Implement mobile tap hotspots, graceful camera transitions, loading, return navigation, responsive framing.
- [x] Build fully functional 2D fallback UI; reduced-motion behavior; keyboard access and readable contrast.
- [x] Build create form, management link handoff, guestbook, tribute, memory wall, organizer console UI with typed mock fixtures.
- [x] Validate mobile 375/390 px and desktop screenshot; no fake backend success in real modes.
**Gate:** real WebGL hall and three working transitions available; all screens navigate; visual brand is approved.
**Evidence:** https://github.com/9jaDevo/zemne/pull/2 | Implementation `fec09ccf24b7091c2bc64b4a5235eb14111da82c` | Logo proof `docs/evidence/p2/identity-desktop.png` (actual 16/32/180px) | Mobile `docs/evidence/p2/hall-mobile-375.png`, `hall-mobile-390.png` | Recording `docs/evidence/p2/hall-navigation.webm`.
**Handoff to Claude:** `docs/P2_FRONTEND_HANDOFF.md`; contract v1.0.0 unchanged, typed `ZemneApiClient` consumed directly.

### P2 handoff — Codex, October 27, 2026
- **Phase / branch / PR:** P2 only; `codex/p2-brand-hall`; draft PR #2 for owner visual review. P1 PR #1 merged after its CI and all 83 local contract tests passed; no P1 files were modified by P2. Only this P2 section and its summary row were updated in the tracker.
- **Brand:** three original vector directions (Held Space, Folded Continuum, Resonance); selected/refined Held Space with custom outlined lettering. Full primary/light/dark lockups, separate symbol/wordmark, SVG/ICO favicons, 16/32/180/192/512 PNGs, contact-sheet SVG/PNG, manifest/metadata and three original neutral landscape illustrations. `docs/BRAND_GUIDE.md` records evaluation, spacing, color, typography and provenance. Browser `/identity` proves light/dark and actual icon sizes. No stock logo/model/texture or real portrait used.
- **3D / UI:** procedural stone/timber/brass hall with portrait recess, guestbook desk, tribute lectern and wall plaque; three numbered raycast-clickable markers and four bounded camera views. Demand rendering, DPR cap, one shadow map, loading/error boundaries, reduced-motion snaps, entrance control, mobile/keyboard buttons, explicit 2D mode and working WebGL/context-loss fallback. All requested screens use P1's typed in-memory adapter: create, fake private-link acknowledgment, guestbook/tribute receipts, approved wall with exact-source dialogs, organizer moderation, simulated weave, editing/citation selection, publish/unpublish.
- **Real validation:** `npm run lint` (0 warnings), `npm run typecheck`, `npm test` (7 files / 83 tests), `npm run build` all passed. `scripts/p2-qa.cjs`: 16 browser checks passed, including physical WebGL marker clicks, pending isolation, moderation, edit/publish/source/unpublish, explicit AI error/retry, year validation/private-link acknowledgment, empty/2D states, reduced-motion keyboard activation, forced context loss and WebGL-disabled submission. No horizontal overflow at 375/390/768/1440px; no page errors and no API network requests. Asset parser/dimension/ICO checks passed.
- **Remote CI:** preview-branch CI trigger added in `9cac185` (`.github/workflows/ci.yml`, same read-only permissions/checks). Linux `npm ci`, lint, typecheck, 83 tests and build passed: https://github.com/9jaDevo/zemne/actions/runs/40488122360 and https://github.com/9jaDevo/zemne/actions/runs/40488117767. The draft PR remains open for visual review, not merged or deployed.
- **Accessibility evidence:** final `scripts/p2-a11y.cjs` pass reports zero violations across eight routes/states at 390 and 1440px (16 audits; axe WCAG 2 A/AA and 2.1 AA tags). Initial contrast/Canvas-label issues were corrected and retested. These are automated spot-checks, not accessibility certification or independent QA.
- **Additional mobile interaction evidence:** Chromium `isMobile`/`hasTouch` emulation at 390 × 844 tapped all three actual WebGL markers and opened their matching destinations (`docs/evidence/p2/touch-results.json`). This is touch emulation, not a physical phone test.
- **Production boundary:** `/demo` is development-only; a local production `npm start` probe returned the truthful unavailable page, no fictional memorial content and `Referrer-Policy: no-referrer`. No mock endpoint or real AI/persistence claim. The in-memory demo resets on reload and cannot satisfy real multi-session acceptance. All visual evidence uses invented P1 data; claim screenshot contains a powerless mock token only.
- **Files / evidence:** `src/3d`, `src/components`, frontend `src/app` files, `public/brand`, `public/assets`, icons/manifest, frontend configuration, README, `scripts` and the three P2 documents. Screenshots and JSON results under `docs/evidence/p2`; actual navigation `.webm` included. Detailed verification is `docs/P2_QA_NOTES.md`. Blueprint, agent prompts, shared API/fixtures, backend/API directories and backend tests unchanged.
- **Incomplete gates / risks:** owner visual approval is still pending, so the visual approval portion of the gate is not marked satisfied. Physical iOS/Android, Safari/Firefox, screen readers, independent Antigravity QA, live API/auth, real Gemma, MongoDB persistence, hosted performance and the real cross-session lifecycle remain later gates. Project license approval remains pending from P0. No production-readiness, Lighthouse/FPS or deployment claim.
- **Exact next handoff:** review `/identity`, `/demo` and the captured mobile/desktop evidence on PR #2 before merging. Do not reinterpret mock organizer access as security. P3 remains unstarted. Claude's later P4/P5 work must honor existing pending/public serialization, errors (`fields`, retry-after, 401, version/source conflicts), current-version story PATCH and rejected-source unpublish side effects. In P6, inject `createHttpClient()`, add real `/m/[slug]` and `/manage/[id]` route shells, and consume/clear fragment secrets before exchange; the development-only `/demo?...` links are not production invitation links. No contract revisions are requested by P2. STOP; no P3 or later work executed.

## P3 — GitHub + MongoDB Atlas + Render resources [CODEX]
- [x] Check installed GitHub/MongoDB Atlas/Render connector/browser capabilities and seek required owner approvals.
- [ ] Create MongoDB Atlas project/cluster and least-privileged app credentials; restrict access consistent with feasible Render connectivity.
- [ ] Provision Render web service (can be initially placeholder) connected to the new public repo.
- [ ] Keep secrets only in ignored local config or Render secure environment; never commit/share raw URI or keys.
- [x] Set backend environment name contract: `MONGODB_URI`, `SESSION_SECRET`, `GEMMA_API_BASE_URL`, `GEMMA_MODEL_ID`, optional `GEMMA_API_KEY`. Declared in the unapplied deployment candidate; no values configured on Render.
- [x] Provision persistent image storage only if portrait upload is included; otherwise use built-in placeholder art. Neutral original placeholders retained; no upload/storage resource approved or provisioned.
- [ ] Verify network connectivity and least-privilege access using a safe backend-only test.
- [ ] Record service names/regions/URLs without disclosing secret values.
**Gate:** Claude receives non-secret connection instructions; secrets provisioned securely, deployment route works.
**Evidence:** Preparation commit `18d2cb2dbc1f3a85f23d7a8ed828ba82a5360987` | Atlas project/cluster ID: unavailable (policy denies discovery) | Render service ID/region/URL: unverified (sign-in required; no resource created) | DB access: NOT VERIFIED, probe `not_configured`.
**Handoff to Claude:** `docs/P3_INFRASTRUCTURE_HANDOFF.md`; all five variable names declared, all values absent locally and not set on Render by this run. Do not begin DB-dependent acceptance on the basis of this preparation.

### P3 execution and blocked handoff — Codex, October 27, 2026
- **Branch / scope:** `codex/p3-infrastructure`, stacked on unmerged P2 branch `codex/p2-brand-hall`; P2 PR #2 remains draft. No P2 approval, merge or production release implied. Only P3 and its summary row changed in this tracker.
- **GitHub:** actual CLI lookup confirms `https://github.com/9jaDevo/zemne`, PUBLIC, default branch `main`; authorized GitHub access available.
- **Atlas actual blocker:** organization and project discovery both returned: “MCP access is disabled for every MongoDB Atlas organization this user belongs to (1 total), so no Atlas data is reachable over MCP. Retrying or re-authenticating will not change this.” Connector requires an Organization Owner to enable AI-client access. No further Atlas action or bypass attempted. Org/project/cluster IDs, regions, DB users, network/TLS settings and database reachability cannot currently be inspected. Nothing provisioned or changed.
- **Atlas owner action:** review Organization Settings → App Connections and the desired AI-client access mode. This is an organization-wide setting for AI clients as a group, not just this chat. User confirmation/access enablement requested; still pending. Official instructions are linked in the handoff.
- **Render actual blocker:** plugin discovery returns Render `installed: false`; no Render action tools available. Browser opening `https://dashboard.render.com` reaches `/login`, showing empty sign-in fields. The integration option was surfaced and sign-in/workspace/free-only selection requested. Browser sign-in page is retained for handoff; screenshot `docs/evidence/p3/render-signin-required.png`. No service/workspace selected, no billing or permission grant accepted, no deployment or secret-setting action performed.
- **Prepared, not applied:** `render.yaml` proposes a free Node web service `zemne-preview`, Virginia region, current P3 branch, manual deployment, `npm ci && npm run build`, `npm run start -- --hostname 0.0.0.0`, Node 24.11.1 and temporary `/provisioning` page-serving check. Proposed Atlas pairing is AWS US_EAST_1. Neither region nor name is an actual provisioned resource. All five backend names declared; `SESSION_SECRET` would be Render-generated and other values use secure dashboard input. Gemma settings remain unselected; do not invent values to satisfy Blueprint prompts. No paid instance, persistent disk or image-storage resource added.
- **Local configuration:** presence-only checks show all five backend variables absent and no `.env`, `.env.local` or `.env.production`. No URI/password/key/session secret generated, printed or committed. Optional probe dependencies isolated under ignored `.infra-tools`; no application dependencies changed or driver installed.
- **Standalone probe:** `scripts/infra/probe-mongodb.mjs` performs a TLS-enforced authenticated ping plus effective-role check for `readWrite` on `zemne`; no models, collections, writes or HTTP routes. Raw errors and URIs are suppressed. It has not connected to MongoDB. Actual missing-config run returned sanitized `not_configured`, exit 2; a test URI with TLS disabled was rejected before connection as `invalid_or_unsafe_configuration`, exit 2. These are failure-path checks, not DB reachability evidence.
- **Actual validation:** `node --check` passes; deployment YAML parsed and checked for free plan, automatic deployment off and required variable names. `npm run lint` (zero warnings), `npm run typecheck`, `npm test` (7 files / 83 tests) and `npm run build` passed. Local production `GET /provisioning` returned 200 with “final demo is not live yet” and explicit no-DB/AI-health claim. `GET /api/health` remains 404; Claude's API was not implemented or modified. No remote Render build/deploy or database test succeeded or is claimed.
- **Files / contracts:** deployment candidate, placeholder page, standalone infrastructure probe, ignored tooling path, non-secret handoff and sign-in evidence. Blueprint, agent prompts, P1 API contract, shared schemas/fixtures, models/API/AI-owned files and backend tests unchanged. `docs/P3_INFRASTRUCTURE_HANDOFF.md` records actual/unverified resource inventory, secure setup, least-privilege policy, Render outbound CIDR procedure, TLS, probe instructions, placeholder boundary and rollback notes.
- **Resume gate:** owner enables Atlas AI-client access; Render installed/connected or browser signed in; workspace/free-only choice confirmed. Then inspect before creating: dedicated ZEMNE project/eligible free cluster; cluster-scoped app user with only `readWrite` on `zemne`; actual Render outbound CIDRs allowlisted (no `0.0.0.0/0`); secure environment settings; sanitized hosting-network probe; real Render build/HTTPS placeholder verification. Record actual IDs/regions/URLs before completing P3. No P4/P5/P6 work started. STOP while external authorization remains pending.

## P4 — Core backend and moderation [CLAUDE]
- [ ] Implement `memorials`, `guestbook_entries`, `tributes`, `story_drafts` collections and indexes.
- [ ] Implement memorial creation with unique slug and high-entropy organizer secret; store hash only.
- [ ] Implement organizer secret exchange, secure HttpOnly cookie, scoped authorization, CSRF/origin validation and TTL.
- [ ] Implement guest read, pending guestbook submission and pending tribute submission with validation/rate limits.
- [ ] Implement organizer approve/reject, public-safe serializers, edit/unpublish endpoints.
- [ ] No pending content or admin secret leaks through guest endpoints.
- [ ] Tests: invalid secret, unrelated organizer, rate limits, pending visibility, duplicate slug, XSS payload, storage/restart behavior.
**Gate:** isolated backend tests pass; all core operations backed by MongoDB.
**Evidence:** PR ___ | Tests count/results ___ | Storage smoke ___
**Handoff to Codex:** API docs and changed fields, endpoint readiness.

## P5 — Real Gemma Memory Weaver [CLAUDE]
- [ ] Configure and verify real inference endpoint for an open-weight Gemma model; document exact model/version/provider/license.
- [ ] Build source-only grounded draft generation from approved tributes; JSON-schema parse/validate.
- [ ] Reject unknown source IDs, malformed payloads and claims without evidence; flag low-confidence or unsupported content for review.
- [ ] Ensure AI never auto-publishes; editable organizer draft.
- [ ] Tests with 3 synthetic tributes + absent data + prompt injection + wrong source ID + service failure.
- [ ] Record actual generated example, latency and evaluation notes without inventing benchmark results.
**Gate:** deployed/locally callable Gemma endpoint returns real source-backed draft and fails safely.
**Evidence:** Model ID ___ | Actual run trace ___ | Tests ___ | Latency ___
**Handoff to Codex:** generator API response schema and loading/error UI behavior.

## P6 — Integrate and deploy [CODEX, Claude supports backend bugs]
- [ ] Replace mocked UI adapters with real typed APIs, preserving all branded UI states.
- [ ] Confirm user cannot skip organizer review to publish.
- [ ] Ensure sources open the exact approved tribute content; source IDs stay stable across edits/publish.
- [ ] Build and deploy frontend/backend to Render; verify database persistence after redeploy.
- [ ] Serve original logo, favicons, app metadata and 3D assets correctly under production URLs.
- [ ] Add safe `/api/health` result; confirm Gemini-like mocks are disabled and actual Gemma runs.
- [ ] Verify no API keys/recovery tokens exposed in client bundle or public GitHub.
**Gate:** one complete live deployed journey works end-to-end, no manual DB hacks.
**Evidence:** Live URL ___ | Build logs pass ___ | E2E rehearsal video ___

## P7 — Independent browser QA + fixes [ANTIGRAVITY QA; CODEX/CLAUDE FIX]
- [ ] Antigravity tests first-time organizer setup and private link recovery on fresh browser session.
- [ ] Antigravity simulates 3 independent guest personas in separate browser contexts; approve/reject behavior.
- [ ] Inspect tablet/phone sizes ~375, 390, 768 px and desktop; capture actual screenshots.
- [ ] Verify all 3 WebGL hotspots with mouse, touch simulation and keyboard/fallback controls.
- [ ] Test reduced motion, WebGL-disabled fallback, missing image, slow network, offline error, validation errors.
- [ ] Test pending tribute isolation, no guest access to organizer links, source citations in published story.
- [ ] Test AI provider error shows safe retry; no hardcoded generation in production.
- [ ] Audit no leaked credentials; Lighthouse or equivalent performance/accessibility checks if available.
- [ ] Publish `docs/QA_REPORT.md` with severity, reproducible steps, screenshots, actual pass/fail and owner assignment.
- [ ] Codex fixes UI/3D/accessibility; Claude fixes backend/AI/auth; Antigravity retests failures.
**Gate:** zero unresolved critical/high issues in the complete guest/organizer path.
**Evidence:** QA report ___ | Video/screenshots ___ | Tested commit ___

## P8 — Submission and evidence [CODEX + CLAUDE]
- [ ] Demo captures actual 3D hall, guestbook, 3 tributes, approval, Gemma weave, source inspection and publish in 2–3 minutes.
- [ ] Capture real test metrics (3D load time, AI latency, number of successful tests; honest failures and fixes).
- [ ] Write README with source-code setup, model identification, env keys (names only), license and demo; note any post-deadline commits.
- [ ] Prepare English DEV submission following official Week 4 template/tag and links; explain Ghost in the Machine and open innovation.
- [ ] Select categories only with demonstrable use: Gemma, Render, MongoDB Atlas; optional .tech domain, Sentry tracing, Entire etc. only if implemented.
- [ ] Verify public repo, Render app, logo assets, video/screenshots and factual claims.
- [ ] Publish **before October 31, 11:59 PM PDT (Nov 1, 7:59 AM WAT)**.
**Gate:** actual DEV submission publicly accessible; note URL/receipt.
**Evidence:** DEV URL ___ | Demo URL ___ | Repo URL ___ | Submitted time ___

---

## Risk register
| Risk | Owner | Mitigation |
|---|---|---|
| 3D performance on mobile | Codex | One room, simple geometry/materials, lazy load, 2D fallback |
| Fake/generic logo | Codex | Three original vector concepts, 16px test, branded app-icon preview |
| Secret organizer link leaked | Claude + Codex | Fragment token, hashed secret, secure cookie exchange, no logs; QA |
| Data lost on Render redeploy | Codex | MongoDB and persistent asset storage; redeploy test |
| AI invents biography/source IDs | Claude | Approved inputs only, structured schema, validation, human approval |
| Agents overwrite each other | All | Clear file ownership and PR review; Codex integrator |
| Missing integrations/credits | Codex | Verify tool action/access; record blockers, do not pretend success |
| Time pressure | All | Cut extras, never cut 3D, guest submissions, source-backed Gemma or publish flow |

## End-of-phase handoff template (copy under each phase)
- Phase / agent:
- Commit or PR:
- Implemented:
- Real commands/tests executed and results:
- Evidence links/screenshots:
- Incomplete items/blockers:
- Files/API contracts changed:
- Recommended next action:
