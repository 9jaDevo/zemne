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
| P3 | Codex | Atlas + Render provisioning | COMPLETE — free preview live; Atlas scoped access and Render runtime TLS ping verified |
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
- [x] Inspect actually connected GitHub/Atlas/Render tools and browser sessions; owner resolved Atlas AI-client policy and Render sign-in.
- [x] Create dedicated Atlas project and FREE cluster; verify least-privilege application user and active Render network ranges.
- [x] Provision FREE Render service connected to public repository; build and HTTPS placeholder verified.
- [x] Keep secrets in secure local/hosting configuration; no values committed or exposed.
- [x] Declare all five backend names on Render; session secret and database URI securely configured; Gemma values deferred to P5.
- [x] Retain original neutral placeholder assets; no persistent upload/storage resource required or provisioned.
- [x] Verify authenticated MongoDB reachability from Render runtime after owner saves URI.
- [x] Record actual resource IDs, regions, service URL and deployment evidence.
**Status / gate:** COMPLETE for P3. Infrastructure preview is live; authenticated TLS ping and least-privilege access verified from Render runtime. No final-demo or application persistence-readiness claim.
**Evidence:** Draft https://github.com/9jaDevo/zemne/pull/3 | Source startup commit `be463f93200d9ffb16afef0e45b01ddc15a87a8d` | HTTPS https://zemne-preview.onrender.com/provisioning | `docs/evidence/p3/render-placeholder-live.png`, `atlas-render-network.png`, `atlas-scoped-user.png`.
**Handoff to Claude:** `docs/P3_INFRASTRUCTURE_HANDOFF.md`; backend variables must remain server-only. No P4/P5/P6 implementation performed.

### P3 resumed execution — Codex, October 27, 2026
- **Scope / GitHub:** branch `codex/p3-infrastructure`, stacked draft PR #3 on unmerged P2; P2 visual approval still pending. Public `https://github.com/9jaDevo/zemne` verified, created `2026-10-27T09:07:38Z`. No merge/release implied. Only this P3 section and summary row changed.
- **Resolved initial blockers:** owner enabled Atlas organization AI-client access and signed into Render. Initial sign-in screenshot remains historical. Render plugin remains unavailable; actual signed-in browser provisioning used. Atlas reads/project/cluster creation succeeded, but user/access-list connector writes repeatedly refused execution because tool confirmation was not received despite explicit owner approval. No rejected write was claimed successful.
- **Atlas actual resources:** organization `689b3913190aeb046ace2bf1`; dedicated project ZEMNE `6ae08765a24262dfc8a76737`; FREE cluster `zemne-mvp`, ID `6ae087883c6794a404b3da66`, AWS US_EAST_1, MongoDB 8.0.34, active. Chrome prepared `zemne_app`; owner generated credential and submitted Add User. Read-only connector verifies exactly `readWrite` on `zemne`, scope `{type: CLUSTER, name: zemne-mvp}`. No models/indexes/data written.
- **Atlas network:** owner explicitly requested Chrome completion. Both actual Render Virginia outbound ranges `74.220.49.0/24` and `74.220.57.0/24` saved and verified ACTIVE. No unrestricted or developer IP entry added. TLS/certificate/hostname validation enforced by probe; cluster minimum TLS version has not independently been inspected. Network CIDRs are shared regional infrastructure; credentials remain essential.
- **Render actual resources:** workspace `tea-d5e1hp1r0fns73au271g`; Node FREE service `zemne-preview`, `srv-dbg8g40m7kps73bnh6e0`, Virginia US East; source public repo, P3 branch, root directory. Auto-deploy OFF, Node 24.11.1, NODE_ENV production, health path `/provisioning`. URL https://zemne-preview.onrender.com. No paid instance/disk/storage and unrelated services untouched.
- **Build / deploy evidence:** initial `dep-dbg8g48m7kps73bnh73g` failed because production npm ci omitted Tailwind build dependency. Commit `a0aa9c56a8c33033747ac1ed2bce2ea0409eb681` fixed include-dev install; deploy `dep-dbg8k2d9fdbs73d3mc9g` succeeded in 1m14s. Startup commit `be463f93200d9ffb16afef0e45b01ddc15a87a8d` deployed as `dep-dbgb00sipgvc73f1ubkg`, succeeded/live in 1m19s. Actual commands match render.yaml: `npm ci --include=dev && npm install --prefix .infra-tools --no-save --no-package-lock mongodb@7.7.0 && npm run build`; `node scripts/infra/render-start.mjs`. This manually provisioned service is not Blueprint-managed; do not apply duplicate service.
- **Secret presence only:** SESSION_SECRET cryptographically generated locally, protected outside repo with restricted user ACL, securely saved to Render. MONGODB_URI name exists but latest hosting probe reports `not_configured`; owner secure entry pending. GEMMA_API_BASE_URL, GEMMA_MODEL_ID and GEMMA_API_KEY names exist but blank; actual provider/model selection belongs to P5. No URI/password/key printed, committed or screenshotted. Browser policy required owner to complete credential entry/submission; prepared form and Render page retained for that handoff.
- **Probe:** standalone TLS authenticated ping + effective-role check, no writes or HTTP route. Startup wrapper forwards only allowlisted status/role boolean, suppresses stderr and starts truthful placeholder even on DB failure. Actual Render runtime output: `status: not_configured`, `expected_role_only: false`. This proves the hosting probe executed, NOT authenticated reachability. Re-run via secure env/redeploy once owner saves TLS URI targeting `/zemne`.
- **Real validation:** lint (zero warnings), typecheck and 7 files / 83 tests passed; node syntax and git diff whitespace checks passed. Earlier local build passed; actual current Render production build passed. Actual public HTTPS `/provisioning` returned 200 and visibly says final demo is not live yet, without DB/AI connectivity claim. `/api/health` remains 404 and Claude-owned routes untouched. Free service can sleep and has no shell/one-off jobs.
- **Files / contracts:** render.yaml, standalone scripts/infra probe/start wrapper, static provisioning page, ignored infrastructure tooling directory, handoff and sanitized evidence. Application dependencies/lockfile, blueprint/prompts, P1 API contract/shared schemas, Claude API/models/AI and backend tests unchanged. Neutral original art remains media strategy.
- **Remaining gate / exact next action:** owner saves existing user's TLS URI with `/zemne` directly in Render MONGODB_URI, no value in chat. Restart/redeploy and verify sanitized `status: ok`, `expected_role_only: true` from Render runtime, then record deployment ID. Claude may consume SESSION_SECRET now; database acceptance must wait for probe. P5 Gemma settings remain pending. No later phase started.

- **URI follow-up:** owner confirmed saving MONGODB_URI. Actual deploy `dep-dbgb2kqfngtc7397a6u0`, source `23e9cf4f53b6282045561ffebe22f427451c4258`, succeeded/live; runtime probe returned `invalid_or_unsafe_configuration`. Secure browser checks returned booleans only: value present, MongoDB scheme present, URI not parseable. Value was not displayed, copied or changed. Owner asked to replace it from Atlas Drivers with URL-encoded password and database `/zemne`; authenticated access remains blocked on configuration correction. Earlier `not_configured` result is historical. No additional permissions or network access requested.
- **Final verification — P3 COMPLETE:** owner corrected URI securely. Direct Chrome Render logs verify deploy `dep-dbgb6iifngtc7397jki0`, source `44a20f2d442d15fad3030547cb5c3362e4680420`, started October 27 at 10:20:58 AM EDT, succeeded/live in 1m27s. Runtime at 10:22:11 AM EDT emitted `status: ok`, `expected_role_only: true`, scope Render runtime network. Probe enforces TLS/certificate/hostname validation and database zemne; ping and expected effective role passed with no writes. Screenshot `docs/evidence/p3/render-database-probe-ok.png`. This supersedes historical missing/invalid URI gates above.
- **Exact final handoff to Claude:** MONGODB_URI and SESSION_SECRET securely available on Render; Gemma base URL/model/key names present but blank for P5. Use injected environment with `node scripts/infra/probe-mongodb.mjs`; local secrets and any additional narrow developer IP access require secure owner setup. Current app user only readWrite@zemne, scoped to zemne-mvp; current network allows actual Render outbound CIDRs only. No raw secrets recorded or final URI retrieved. No API/models/auth/AI implementation changed. P3 complete; stop before P4/P5/P6. Final demo, real lifecycle/persistence and AI acceptance remain later gates.
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
