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
| P0 | Codex | New public repository and tooling | NOT STARTED |
| P1 | Claude | Backend/API contract and fixtures | NOT STARTED |
| P2 | Codex | Original branding and real 3D + screens | NOT STARTED |
| P3 | Codex | Atlas + Render provisioning | NOT STARTED |
| P4 | Claude | Real persistence, organizer authorization and moderation APIs | NOT STARTED |
| P5 | Claude | Real Gemma Memory Weaver with evidence validation | NOT STARTED |
| P6 | Codex | Frontend/API integration and production deploy | NOT STARTED |
| P7 | Antigravity + owners | Independent browser E2E, UX, bugs, fixes | NOT STARTED |
| P8 | Codex + Claude | Judge evidence, DEV article, submit | NOT STARTED |

---

## P0 — Create repository and foundation [CODEX]
- [ ] Verify new project and public GitHub repo `zemne` were created during Week 4 window; record exact date and repo URL.
- [ ] Place all three project documents at repo root (or `docs/` with consistent paths).
- [ ] Scaffold a single React + TypeScript + Next.js web app with React Three Fiber, Tailwind, lint/typecheck/test infrastructure.
- [ ] Configure safe public repo defaults: `.gitignore`, `.env.example`, no secrets, license/readme, access-controlled main branch if available.
- [ ] Create shared folder boundaries and design/backend placeholders, no fake functional claims.
- [ ] Run install/build/lint; initial clean commit.
**Gate:** public repository is accessible; app boots; no secret in tracked files.
**Evidence:** Repo URL ___ | Commit ___ | Tests ___ | Date ___
**Handoff to Claude:** branch/paths, framework version, agreed shared-types directory.

## P1 — Data types and HTTP contracts [CLAUDE]
- [ ] Create `docs/API_CONTRACT.md` with endpoints, error shapes, auth/permission model and JSON fixtures.
- [ ] Define memorial, pending guestbook, pending tribute, approved contributions, story draft types with status enums.
- [ ] Define token exchange + cookie session rules, rate limit and CSRF approach.
- [ ] Define Gemma input/output JSON contract and model-error response.
- [ ] Add contract validation tests and fixture seed for fictitious memorial + three fabricated guests.
- [ ] Ensure no direct UI or cloud changes in this phase.
**Gate:** Codex can implement UI from contract, even if backend is a mock.
**Evidence:** PR ___ | Files ___ | Test results ___
**Handoff to Codex:** API fields/events/states/fixtures and mock adapter expectations.

## P2 — Brand and polished immersive frontend [CODEX]
- [ ] Produce 3 independent custom logo concepts; select/refine one with recognizable icon plus editorial wordmark.
- [ ] Export actual usable SVG primary/light/dark + icon, SVG/favicon.ico/PNG app icon sizes, and brand guide.
- [ ] Test mark at 16, 32, 180 px and on light/dark backgrounds; no generic AI/death imagery.
- [ ] Build actual React Three Fiber virtual hall geometry with architectural materials, portrait area and hotspots: guestbook, tribute, memory wall.
- [ ] Implement mobile tap hotspots, graceful camera transitions, loading, return navigation, responsive framing.
- [ ] Build fully functional 2D fallback UI; reduced-motion behavior; keyboard access and readable contrast.
- [ ] Build create form, management link handoff, guestbook, tribute, memory wall, organizer console UI with typed mock fixtures.
- [ ] Validate mobile 375/390 px and desktop screenshot; no fake backend success in real modes.
**Gate:** real WebGL hall and three working transitions available; all screens navigate; visual brand is approved.
**Evidence:** PR ___ | 16px logo screenshot ___ | Mobile screenshot ___ | 3D demo clip ___
**Handoff to Claude:** exact UI state/error variants requested.

## P3 — GitHub + MongoDB Atlas + Render resources [CODEX]
- [ ] Check installed GitHub/MongoDB Atlas/Render connector/browser capabilities and seek required owner approvals.
- [ ] Create MongoDB Atlas project/cluster and least-privileged app credentials; restrict access consistent with feasible Render connectivity.
- [ ] Provision Render web service (can be initially placeholder) connected to the new public repo.
- [ ] Keep secrets only in ignored local config or Render secure environment; never commit/share raw URI or keys.
- [ ] Set backend environment name contract: `MONGODB_URI`, `SESSION_SECRET`, `GEMMA_API_BASE_URL`, `GEMMA_MODEL_ID`, optional `GEMMA_API_KEY`.
- [ ] Provision persistent image storage only if portrait upload is included; otherwise use built-in placeholder art.
- [ ] Verify network connectivity and least-privilege access using a safe backend-only test.
- [ ] Record service names/regions/URLs without disclosing secret values.
**Gate:** Claude receives non-secret connection instructions; secrets provisioned securely, deployment route works.
**Evidence:** Atlas cluster ID (redacted) ___ | Render URL ___ | Access test ___
**Handoff to Claude:** env variable names, connection capability and failure notes.

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
