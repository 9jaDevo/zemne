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
| P1 | Claude | Backend/API contract and fixtures | INTEGRATED — contract 1.2.1; historical phase evidence below |
| P2 | Codex | Original branding and real 3D + screens | INTEGRATED — Garden of Light candidate; device/live QA pending |
| P3 | Codex | Atlas + Render provisioning | COMPLETE — free preview live; Atlas scoped access and Render runtime TLS ping verified |
| P4 | Claude | Real persistence, organizer authorization and moderation APIs | INTEGRATED — real persistence and organizer APIs; live retest pending |
| P5 | Claude | Real Gemma Memory Weaver with evidence validation | INTEGRATED — real Gemma plus P7 reliability mitigation; provider capacity gate open |
| P6 | Codex | Frontend/API integration and production deploy | INTEGRATED — historical live smoke passed; consolidated main not yet deployed |
| P7 | Antigravity + owners | Independent browser E2E, UX, bugs, fixes | RETEST REQUIRED — owner fixes integrated; historical report discrepancies and new design gates open |
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
- [x] Implement `memorials`, `guestbook_entries`, `tributes`, `story_drafts` collections and indexes. (`src/lib/db/schema.ts`: `$jsonSchema` validators, unique slug/token-hash, partial-unique published story, rate-limit TTL)
- [x] Implement memorial creation with unique slug and high-entropy organizer secret; store hash only. (256-bit `zmn_ot_` token, SHA-256 at rest; slug retry on duplicate key)
- [x] Implement organizer secret exchange, secure HttpOnly cookie, scoped authorization, CSRF/origin validation and TTL. (`__Host-zemne_org`, HMAC-signed, 12 h, revoked by token version; Origin + Sec-Fetch-Site + JSON content-type)
- [x] Implement guest read, pending guestbook submission and pending tribute submission with validation/rate limits.
- [x] Implement organizer approve/reject, public-safe serializers, edit/unpublish endpoints. (also rotate-token; transactional auto-unpublish and supersede)
- [x] No pending content or admin secret leaks through guest endpoints. (strict response schemas + integration tests + mutation check)
- [x] Tests: invalid secret, unrelated organizer, rate limits, pending visibility, duplicate slug, XSS payload, storage/restart behavior. (restart = fresh DB connection and fresh server state against the same MongoDB; real Render redeploy persistence is a P6 gate)
**Gate:** isolated backend tests pass; all core operations backed by MongoDB.
**Evidence:** PR https://github.com/9jaDevo/zemne/pull/4 (branch `claude/p4-backend`, commits `a788632`, `e3286f4`) | Tests: 10 files / 163 passed (`npm test`, 2026-10-27, Windows, Node 24.11.1; MongoDB integration via `mongodb-memory-server` single-node replica set); typecheck, lint (0 warnings), `npm run build` passed | Storage smoke: `next start` (NODE_ENV=production) against a local MongoDB replica set ran create → pending tribute (public count 0) → token exchange → approve → public count 1 (XSS text returned verbatim as JSON) → cross-origin 403 → no-cookie 401 → weave 503 → PUT 405; server log contained 0 occurrences of the token. **Not run against Atlas**: its allowlist admits Render CIDRs only.
**Handoff to Codex:** API docs and changed fields, endpoint readiness.

### P4 handoff (Claude → Codex, 2026-10-27)
- **Phase / agent:** P4 / Claude. Branch `claude/p4-backend` is stacked on `codex/p3-infrastructure` (PR #3, itself on P2 PR #2). PR #4 targets `codex/p3-infrastructure`; GitHub retargets it to `main` when #3 merges.
- **Implemented:**
  - All 14 contract routes as Next.js route handlers (`src/app/api/**`), with logic in `src/server/**` and data in `src/lib/db/**`.
  - Weave runs auth, scope, rate-limit and `NO_APPROVED_TRIBUTES` checks, then returns `503 AI_UNAVAILABLE` until P5. Nothing is stored.
- **Contract 1.1.0 (additive):**
  - New error code `FORBIDDEN` (403) when a valid session is used on another memorial's memorial-addressed route. Items of other memorials stay 404.
  - Organizer lists are capped at 500 per kind; counts stay exact.
  - Unsupported methods get Next's empty-body 405.
  - New §3.5 safe-rendering rules and §10 real captured responses.
  - The P1 mock client now returns `FORBIDDEN` for the cross-memorial case too.
- **Real commands/tests executed and results:** `npm test` 163/163, `npm run typecheck`, `npm run lint`, `npm run build`, plus the production-server HTTP smoke described in Evidence.
- **Dependencies:**
  - `mongodb@^7.7.0` (runtime) and `mongodb-memory-server@^11.3.0` (dev). The dev package downloads a MongoDB binary on the first test run, including in CI.
  - The lockfile was regenerated cleanly and keeps the cross-platform `@emnapi` entries from P0's fix.
  - `vitest.config.ts` gained the `@/` alias.
- **Incomplete items/blockers:**
  1. Nothing has run against Atlas yet. Local access needs an owner-approved narrow IP; otherwise the first real run is the Render deploy. On first connection the app creates collections, validators and indexes; `readWrite@zemne` is sufficient.
  2. The client-IP source (`CF-Connecting-IP`, else the right-most `X-Forwarded-For`) must be confirmed on the deployed Render service. Check that two different networks get separate rate-limit buckets.
  3. Weave generation is P5.
- **Files/API contracts changed:**
  - `docs/API_CONTRACT.md` (1.1.0)
  - `src/shared/api/errors.ts` (`FORBIDDEN`)
  - `src/shared/fixtures/mock-client.ts`
  - new `src/app/api/**`, `src/server/**`, `src/lib/db/**`
  - new tests `tests/backend/{server-security,api-integration,route-wiring}.test.ts` and `tests/backend/helpers/`
  - `package.json`/lock, `vitest.config.ts`
- **Recommended next action:**
  - **Codex (P6):** deploy this branch to Render with the existing `MONGODB_URI`/`SESSION_SECRET`. The `.infra-tools` driver install is no longer needed, since `mongodb` is now an app dependency the probe imports first. Point the health check at `/api/health`. Then wire `createHttpClient()` and the `/m/[slug]` and `/manage/[id]` shells, following contract §2.2, §3.5 and §10.
  - **Claude (P5):** Gemma weave.

## P5 — Real Gemma Memory Weaver [CLAUDE]
- [x] Configure and verify real inference endpoint for an open-weight Gemma model; document exact model/version/provider/license. (Google AI Studio OpenAI-compatible endpoint; `gemma-4-31b-it` v001; weights `google/gemma-4-31B-it`, Apache-2.0. Contract §6.2. Configured locally only, via the owner's key in ignored `.env.local`.)
- [x] Build source-only grounded draft generation from approved tributes; JSON-schema parse/validate. (`src/lib/ai/*`; approved tributes only, under aliases; `validateWeaveOutput` + one repair attempt)
- [x] Reject unknown source IDs, malformed payloads and claims without evidence; flag low-confidence or unsupported content for review. (unknown/duplicate citations dropped and flagged; uncited paragraphs removed; invalid JSON → `AI_INVALID_OUTPUT`; grounding flags for numbers/names absent from sources; model flags preserved)
- [x] Ensure AI never auto-publishes; editable organizer draft. (stored as `draft` only; publish stays the P4 organizer PATCH with source checks)
- [x] Tests with 3 synthetic tributes + absent data + prompt injection + wrong source ID + service failure. (unit + integration with a scripted test double; also opt-in live tests against the real model)
- [x] Record actual generated example, latency and evaluation notes without inventing benchmark results. (`docs/evidence/p5/`, contract §6.3; failures recorded as observed)
**Gate:** deployed/locally callable Gemma endpoint returns real source-backed draft and fails safely. **Met locally**: a real end-to-end weave through the HTTP job API produced a source-backed draft (64.7 s); upstream failures ended as retryable job errors with nothing stored. Not yet deployed (P6).
**Evidence:** Model ID `gemma-4-31b-it` (as reported by endpoint responses) | Run traces `docs/evidence/p5/e2e-weave-2026-10-27T16-17-40Z.json`, `gemma-live-eval-gemma-4-31b-it-2026-10-27T16-16-14-224Z.json`, `gemma-live-eval-gemma-4-26b-a4b-it-2026-10-27T16-01-44-661Z.json` | Tests: `npm test` 193 passed, 9 skipped (the opt-in live tests, run separately), plus typecheck, lint and build | Latency: 7 completed weaves at 61.0–152.1 s model time (median 112.0 s); 6 of 13 attempts failed with upstream 500/503 "high demand". PR https://github.com/9jaDevo/zemne/pull/5
**Handoff to Codex:** generator API response schema and loading/error UI behavior.

### P5 handoff (Claude → Codex, 2026-10-27)
- **Phase / agent:** P5 / Claude. Branch `claude/p5-gemma-weaver` is stacked on `claude/p4-backend` (PR #4 → #3 → #2). PR #5 targets `claude/p4-backend`. Merge order: #2, #3, #4, #5.
- **Implemented:**
  - Real Memory Weaver: `src/lib/ai/{gemma-client,prompt,weaver,grounding}.ts`, with the weave job handlers in `src/server/handlers/organizer.ts`.
  - The model is `gemma-4-31b-it` on Google AI Studio's OpenAI-compatible endpoint. Gemma 3 is not served there (404); verified live.
- **Contract 1.2.0 (the one behaviour change):**
  - Weave is a background job. `POST /api/organizer/memorials/:id/weave` → **202** `{job}`; `GET` on the same path → `{job, story}`.
  - `ZemneApiClient.weaveStory()` is unchanged for UI code; the HTTP client polls internally.
  - New `getWeaveStatus(memorialId)` lets the console resume a running weave after reload.
- **Real commands/tests executed and results:**
  - `npm test` 193 passed, 9 skipped (live).
  - Live runs: `node --env-file=.env.local node_modules/vitest/vitest.mjs run tests/backend/gemma-live.test.ts` with `ZEMNE_LIVE_GEMMA=1`.
  - End-to-end: production `next start`, local MongoDB, real Gemma.
  - All results are in contract §6.3 and `docs/evidence/p5/`.
- **Incomplete items/blockers:**
  1. **Provider reliability:** today 6 of 13 real weaves failed with upstream 500/503 "high demand" on the unpaid tier. The failures were safe, but the demo should be rehearsed and timed, and a paid or billing-enabled key considered.
  2. **Privacy:** on the unpaid tier Google may use prompts and outputs to improve its products. Use synthetic data only until the key is on a paid tier. Show the provider disclosure (`story.ai.provider_label`) in the UI.
  3. Evaluation run A's file was overwritten. Its numbers come from that run's console output and are labelled that way in contract §6.3. Evidence files are now timestamped.
- **Files/API contracts changed:**
  - `docs/API_CONTRACT.md` 1.2.0
  - `src/shared/api/{schemas,client}.ts` (`WeaveJob`, `WeaveStartResponse`, `WeaveStatusResponse`, polling `weaveStory`, `getWeaveStatus`)
  - `src/shared/fixtures/mock-client.ts` (`getWeaveStatus`)
  - `src/server/{config,deps}.ts`, `src/lib/db/types.ts` (`weave_job`), and the weave route's new `GET`
  - tests and evidence
- **Recommended next action (Codex, P6):**
  1. In Render, set `GEMMA_API_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai` and `GEMMA_MODEL_ID=gemma-4-31b-it`, and have the owner enter `GEMMA_API_KEY` securely. Keep the Render service a long-lived web service: background jobs need it, and serverless won't work.
  2. Weave UI:
     - show a "Weaving approved tributes with Gemma. This can take 1–3 minutes." state;
     - disable the button while running;
     - on load, call `getWeaveStatus()` to resume;
     - show `AI_*` failures with a retry and no substitute text;
     - show model flags beside paragraphs and validator flags as review prompts;
     - never label AI text as verified.
  3. Show `story.ai.model_id` and `provider_label` with the published story.

## P6 — Integrate and deploy [CODEX, Claude supports backend bugs]
- [x] Replace mocked production adapters with typed real APIs; preserve brand, mobile screens and R3F hall.
- [x] Require organizer session and explicit review acknowledgment before UI publication; pending content remains private until server moderation.
- [x] Citation dialogs open exact approved source tribute text; all published citation IDs validated against public approved response.
- [x] Deploy frontend/backend on Render; verify contributions and published story/title/citations survive redeploy using Atlas.
- [x] Verify original logo, favicon SVG/ICO, manifest/metadata and actual WebGL; functional explicit 2D fallback.
- [x] Use Claude’s real /api/health; production mock demo disabled; real Gemma job generated and published source-linked draft.
- [x] No configured key in compiled client asset scan or committed evidence; private fragment cleared and no token in public rendered text. Separate tool-output key exposure and owner-deferred rotation recorded below.
**Gate:** PASSED live synthetic smoke. Independent P7 acceptance and the explicitly deferred provider-key rotation remain open; no production-readiness claim.
**Evidence:** https://zemne-preview.onrender.com | Synthetic hall https://zemne-preview.onrender.com/m/mira-vale-synthetic-p6-rehearsal-kkr2i9 | Draft PR https://github.com/9jaDevo/zemne/pull/6 | Tested commit `85a4f6af3fc6431b647eb28b4e083ad4def4d107` | Render `dep-dbgdc6gu01pc73fjpspg` succeeded/live in 1m41s | `docs/evidence/p6` screenshots/JSON; no rehearsal video recorded.
**Handoff to Antigravity:** `docs/P6_INTEGRATION_HANDOFF.md`; test final deployment independently in P7. No P7 implementation or submission work performed.

### P6 handoff — Codex, October 27, 2026
- **Prerequisites / scope:** read master/tracker/contract 1.2.0; P4’s MongoDB/security/moderation tests and P5’s real locally callable Gemma/source-backed draft gate passed before integration. Branch `codex/p6-live-integration`, stacked on `claude/p5-gemma-weaver`; PR #6 remains draft. No merge or earlier visual approval implied. Only P6 and summary row changed in this tracker.
- **Implemented:** real HTTP client route shells /create, /m/[slug], /manage/[id]; one-time claim-link acknowledgment and discard; mount and same-tab fragment consumption/clearing before session exchange; approved public reads, pending guest forms, moderation, real background weave with long-running/resumed status and explicit retry, versioned edit, reviewed publish/unpublish, exact approved source dialogs and model/provider disclosure. Actual 3D raycast marker clicks opened each complete destination action. Original room/assets preserved; 2D mobile guestbook works. Dynamic shells and private/no-store, no-referrer/noindex headers; no local/session storage or client secret config.
- **Render / secrets:** actual authorized signed-in Render dashboard used; no Render connector actions available. Existing FREE Virginia service `srv-dbg8g40m7kps73bnh6e0`, P6 branch, auto-deploy off. Build `npm ci --include=dev && npm run build`, startup infrastructure probe wrapper, health /api/health. Existing Atlas project/user/network unchanged. Backend MONGODB_URI/SESSION_SECRET/GEMMA_API_KEY securely configured. Endpoint Google AI Studio OpenAI-compatible URL, actual gemma-4-31b-it. No billing/paid changes. Masked hosting input initially failed to retain base/model; exact nonsecret values were corrected and real health/model call verified.
- **Actual tests:** npm ci passed after stopping an existing project-local Next process that locked Windows SWC; lint zero warnings, typecheck, 12 files / 193 tests passed, 9 opt-in live tests skipped, production build passed. Final Linux CI passed https://github.com/9jaDevo/zemne/actions/runs/40544638130 and https://github.com/9jaDevo/zemne/actions/runs/40544629063. Exact configured key scan across 18 compiled client assets: zero matches. Protected backend/API/AI/shared-contract paths show no changes against P5.
- **Actual hosted lifecycle:** create synthetic Mira Vale; one-time claim screen; submit one guestbook entry + 3 synthetic guest tributes via live UI. Public API returned 0/0/null while all four were pending. Approve through console → public 1/3/null. Genuine AI_UNAVAILABLE displayed explicit retry without draft before configuration was active. Real Gemma job then generated two paragraphs, resumed across reload, remained private as draft. Edit title, read original source, confirm review gate, publish. Public wall shows real model and exact original approved source; every source ID present in approved public tributes. Unpublish removed story; republish restored. Anonymous organizer API returned 401. Same-tab private-link edge case found, fixed, retested fragment clear + recovered console. Data survived two actual redeploys; final story ID/title/paragraphs/citations unchanged.
- **Hosted evidence:** final source `85a4f6af3fc6431b647eb28b4e083ad4def4d107`; deployment `dep-dbgdc6gu01pc73fjpspg`, started 12:49:30 PM EDT, succeeded/live in 1m41s. Runtime MongoDB probe ok/expected role true; health database ok/AI configured. Actual 200 root/create/public/manage/favicon/manifest; private/no-store headers and no-referrer. JSON `hosted-checks.json`, `published-synthetic-lifecycle.json`, `final-deployment.json`; screenshots real error/retry, resumed generation, mobile hall/fallback, exact published source, final mobile wall and Render deployment. 390px no overflow, Canvas present, no mock preview/private token text; keyboard Escape closes source dialog. Temporary viewport reset.
- **Security action / limitations:** hosting form snapshot accidentally exposed provider key in tool output. Owner informed, explicitly deferred rotation and instructed proceeding. Key must be revoked/replaced before sensitive use; no value in Git/client/evidence. Unpaid provider disclosure + synthetic-only notice remain visible. Three guest personas were submitted through real UI, not isolated cookie jars/networks. Physical devices/cross-browser/screen readers, forced WebGL-loss retest, full independent security/abuse/performance, two-network client-IP/rate-limit verification and video remain P7. No real private memorial data used; no readiness claim from builds alone.
- **Files / contracts / next action:** frontend components/routes, Next headers/metadata, Render manifest, README, handoff and sanitized evidence only. Claude-owned models/APIs/auth/AI/shared contract/backend tests unchanged. Review PR #6 and run Antigravity independent P7 on the named live commit; create a fresh synthetic memorial, securely retain its private link, never screenshot secrets. P6 STOP.

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
- [x] Demo captures actual 3D hall, guestbook, 3 tributes, approval, Gemma weave, source inspection and publish in 2–3 minutes.
- [x] Capture real test metrics (3D load time, AI latency, number of successful tests; honest failures and fixes).
- [x] Write README with source-code setup, model identification, env keys (names only), license and demo; note any post-deadline commits.
- [x] Prepare English DEV submission following official Week 4 template/tag and links; explain Ghost in the Machine and open innovation.
- [x] Select categories only with demonstrable use: Gemma, Render, MongoDB Atlas; optional .tech domain, Sentry tracing, Entire etc. only if implemented.
- [x] Verify public repo, Render app, logo assets, video/screenshots and factual claims.
- [x] Publish **before October 31, 11:59 PM PDT (Nov 1, 7:59 AM WAT)**.
**Gate:** actual DEV submission publicly accessible; note URL/receipt.
**Evidence:** DEV https://dev.to/9jadevo/zemne-distance-shouldnt-erase-participation-in-remembrance-5699 | Demo https://zemne-preview.onrender.com | Repo https://github.com/9jaDevo/zemne | Submitted 2026-10-28T07:25:43Z (00:25:43 PDT / 08:25:43 WAT).

### P8 progress — Codex, 2026-10-28 (incomplete)

- MIT license approved by owner and merged with README, exact model/provider, security, benchmark limitations and asset attribution in PR #9. Main commit: `95992fc1cff564bfae041a823a10d2f854520415`; required CI passed. Public repository and MIT metadata verified: https://github.com/9jaDevo/zemne.
- Official published Week 4 rules/template reviewed; evidence and deadline discrepancy documented in `docs/P8_RULES_CHECK.md`. Technical source review and historical test results are in `docs/P8_TECHNICAL_EVIDENCE.md`; these are not fresh production acceptance.
- English DEV draft created, article ID `4932571`, with `devchallenge` and `hf26challenge` tags. It is UNPUBLISHED and not a submitted entry. Local copy: `docs/DEV_SUBMISSION_DRAFT.md`. No submitted time exists.
- Actual public identity/favicon screenshots saved in `docs/evidence/p8/identity-live.png` and `favicon-live-detail.png`; favicon and primary SVG returned HTTP 200. Existing local redesign captures remain explicitly development evidence.
- Deployment blocker: Render still serves the historical P6 deployment (`85a4f6af3fc6431b647eb28b4e083ad4def4d107`); new sanctuary GLB returned HTTP 404. The owner reports the Render plugin connected, but this session exposes no Render actions. Reopened Chrome Person 1 is discoverable; attaching to the ZEMNE settings page still times out before input. No branch save or deployment was performed.
- Required next action: set Render `zemne-preview` branch to `main`, keep existing Free plan/environment values, and deploy latest commit through an accessible authorized integration or owner dashboard. Then verify actual deployed revision, capture the new hall/mobile UI, run the three-contribution real Gemma flow, assemble the truthful 2–3 minute walkthrough and publish/verify the DEV article. All these acceptance gates remain open.

### P8 deployment/evidence follow-up — 2026-10-28

- Browser control recovered. Owner's successful manual deployment was verified as older commit `360a458`; corrected Render source to `main` and manually deployed **95992fc1cff564bfae041a823a10d2f854520415**. Deployment **dep-dbgpp4gn74is73d428b0**, service `srv-dbg8g40m7kps73bnh6e0`, Virginia/Free, live **06:57:54Z**. Plan and existing environment values unchanged; backend startup MongoDB probe `ok`.
- Actual live UI: created fictional Mira Vale, saved one-time private link outside repo, submitted one guestbook message and three separate fictional tributes, verified pending public arrays empty, approved each, ran real Gemma, reviewed all sources, corrected implied direct quotation, saved and published. Gemma job **51.360s**, `gemma-4-31b-it` / Google AI Studio; published version three **07:09:25.273Z**. Public source button opened exact approved Jun contribution. Anonymous organizer 401; cross-memorial organizer 403; own 200. Public response no-store. See `docs/evidence/p8/README.md` and JSON records.
- Live WebGL hall and mobile screenshots captured; 390px hall / 375px manual fallback have no horizontal document overflow. Favicon SVG/ICO, logo and room GLB return 200 with matching SHA-256. Old P6 memorial survives redeployment. Initial ten-script credential-pattern scan found zero matches; bounded scan only. Real metadata references verified.
- Delivered **2:50.24 MP4** of edited actual live UI still captures, local synthetic narration, compressed waiting explicitly disclosed; not continuous screen recording. Narration/source manifest, subtitles, assembler and real screenshots in `docs/evidence/p8/`. FFmpeg full decode passed. No management capability captured.
- Fresh lint and typecheck passed. Main historical suite remains 207 passed / nine opt-in live skipped; current Render build passed. Physical-phone/endurance and independent latest-main QA remain open; timing observation interval and browser interruptions are recorded honestly.
- DEV article still unpublished at this checkpoint; final evidence must be merged and public links verified before publication. No submitted timestamp exists yet.

### P8 published receipt — COMPLETE, 2026-10-28

- Actual published DEV entry: **https://dev.to/9jadevo/zemne-distance-shouldnt-erase-participation-in-remembrance-5699**, article `4932571`. Anonymous HTTP 200 and browser rendering verified; official Week 4 submission banner, `devchallenge` and `hf26challenge` visible. Publication timestamp from public structured data and time element: **2026-10-28T07:25:43Z**, equivalent to **October 28, 00:25:43 PDT / 08:25:43 WAT**, before the official deadline.
- Public repo **https://github.com/9jaDevo/zemne**, PUBLIC/MIT. Production **https://zemne-preview.onrender.com**, tested application **95992fc1cff564bfae041a823a10d2f854520415**, Render deployment **dep-dbgpp4gn74is73d428b0**. Evidence merged on main in **32c254e1f0b14eb7e8f758fbf63bab23518a4ddc** (PR #10). Its Linux CI freshly passed lint, typecheck, **207 tests / nine opt-in live skipped**, and production build.
- Public screenshots/video/evidence URLs verified before publication. DEV imported the screenshots; visible hall/mobile images loaded. Local receipt and public-page capture: `docs/evidence/p8/submission-receipt.json`, `dev-published.png`. The article explicitly discloses the edited still-capture walkthrough, synthetic narration, single tester, historical provider failures and remaining limitations. Requested DEV AI disclosure: `fully_autonomous`.
- Categories: Gemma, Render and MongoDB Atlas only; one-award maximum acknowledged. No new product features or Claude-owned APIs/models/security logic changed. **STOP for independent QA; submission is published, but physical-device/performance and latest-main independent acceptance are not silently marked complete.**

### P8 owner-authorized custom domain — 2026-10-28

- Owner confirms `pdev.tech` was claimed through Hacktoberfest and approves Render's additional **$0.25/month** domain charge (two included workspace slots already used). Added **zemne.pdev.tech** to the same service, verified existing CNAME to `zemne-preview.onrender.com`, and verified Render **Certificate Issued** plus real HTTPS. DNS records, service plan, secrets and backend logic were not changed; original Render URL remains enabled.
- New primary demo: **https://zemne.pdev.tech**. Custom-host health 200 with database `ok`; organizer exchange/read 200, Secure/HttpOnly host cookie; wrong-origin write 403 `ORIGIN_REJECTED`; valid guestbook write 202 `pending` and absent publicly. Published real-Gemma story and approved-source navigation work through the custom hostname. No additional inference was called. See `docs/evidence/p8/domain/`.
- Updated the existing DEV article (same URL/id and original submission time) with branded demo, fallback and **Best Use of a .tech Domain**. Public HTML verified both updates, modified **2026-10-28T18:44:32Z**. The article explicitly says this is a subdomain of Hacktoberfest-claimed `pdev.tech`; rules do not expressly settle subdomain eligibility, so prize acceptance is not guaranteed. Four genuine category claims now supersede the original three-category checkpoint.

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

## Owner-authorized visual redesign — Garden of Light (Codex, 2026-10-27)

**Status: implemented candidate; independent visual/device/live acceptance remains open.** Branch `codex/sanctuary-redesign`, based on `360a458`; tested implementation commit: `f8bcc3239392f471bb11c1819cdf04f6f934c705`. Repo: https://github.com/9jaDevo/zemne. No new Render deployment was performed; earlier P6/P7 acceptance is not acceptance of this candidate.

- Replaced the pergola with original Blender architecture: enclosed stone sanctuary, timber-lined roof/skylight, glazed light court, custom benches, engraved guestbook, sculpted tribute lectern, framed memory wall, neutral relief and flowers. Retained approved ZEMNE mark/favicon; introduced locally hosted Newsreader/DM Sans with OFL notices, forest/ivory/bronze editorial UI and matching Cycles landing stills.
- Shipped actual `sanctuary-mobile.glb`: **876,964 bytes, 22 meshes/primitives, 60,449 triangles, nine embedded maps**. HDR 1,615,248 bytes; combined 2,492,212 bytes. Meshopt/WebP, DPR ≤1.25, demand rendering, one 1024 shadow map, no postprocessing/physics/avatars. Source and checksummed CC0 map provenance are included. Offline Cycles illumination is richer than runtime lighting; no baked GI/AO or cross-device photorealism is claimed.
- All three **physical object clicks** verified in the browser, opening their complete frontend panels. 390px tribute composition/submission produced pending feedback in the explicitly labeled development fixture; approved fixture source modal and Escape, manual 2D destination access, 375/390px landing and 1440px room reviewed. Mobile labeled navigation and return-to-sanctuary scrolling/focus refined; receipt heading receives focus.
- `/experience` consumes the existing synthetic P6 memorial through real APIs, with destination deep links; `/demo` remains development-only. Existing deployed public API freshly returned HTTP 200, three approved tributes and a published story. No production mock replacement or new backend endpoint was introduced.
- Validation: lint and typecheck passed; production build passed. Full command `npm test -- --maxWorkers=1 --testTimeout=60000 --hookTimeout=120000`: **204 passed, nine opt-in live tests skipped**. New frontend regression coverage includes compressed geometry budget, embedded textures, destination extras, child-hit resolution and camera bounds; frontend-only rerun: **11 passed**. Initial concurrent run hit Claude-owned cold import/MongoMemory startup timeouts; no backend/test configuration was changed.
- Evidence: `docs/evidence/redesign/` (historical before captures, actual local after screenshots and `validation.json`). Art direction/assets/limitations: `docs/SANCTUARY_REDESIGN.md`; exact Antigravity steps: `docs/SANCTUARY_RETEST.md`.
- Boundaries: no changes to Claude-owned server/API/DB/security/AI/shared-contract/backend-test files. Existing uncommitted Antigravity report, evidence and tracker edits preserved outside this commit's scope. No credentials, management fragments or real-person data were added.
- Open gates: physical iPhone/mid-range Android GPU/thermal measurements; browser endurance, forced context loss and OS reduced-motion validation; tablet/zoom sweep; live three-contribution creation→claim→approval→Gemma→edit→publish/source/persistence run on a deployed candidate. Local screenshots and tests do not complete those gates. Keep current Render revision until review and authorized deployment.

Standard final npm test result: 203 passed, nine live tests skipped, one Claude-owned health-route import timeout at 5 seconds (BUG-P7-03). The longer-timeout diagnostic run passed 204; the default-command issue remains open.

## Main consolidation — Codex (owner request, 2026-10-27)

- Integrated all authored P1–P7 application branches and the Garden of Light redesign with original commit ancestry. Claude P7 source was merged unchanged in 9bb6aa1. Consolidation details and remaining submission gates: `docs/MAIN_INTEGRATION_HANDOFF.md`.
- Historical Antigravity report and JSON evidence preserved; raw screenshots and local audit tooling are retained privately pending credential review. Its original tracker edits remain in the named local stash, rather than marking unverified current-main gates complete.
- Local consolidated tree `6a516a5`: lint (zero warnings), typecheck, standard npm test (**207 passed, 9 opt-in live tests skipped**) and production build all passed. Required remote verify check must pass before merge. No deployment or submission is implied.
