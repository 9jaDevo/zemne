# ZEMNE — MASTER BLUEPRINT
**Version:** 1.0 | **Status:** Frozen Week 4 MVP | **Owner:** Project founder
**Single source of truth:** This file overrides assumptions in prompts, agents' preferences, and implementation shortcuts. Change it only when the owner approves an explicit change.

## 0. Competition constraints
- **Hacktoberfest 2026, Week 4:** Ghost in the Machine.
- **Eligibility window:** October 26, 2026 at 9:00 AM PDT through October 31, 2026 at 11:59 PM PDT (**November 1 at 7:59 AM WAT**).
- Create a **new PUBLIC GitHub repository** and new implementation during this window. No reuse of earlier Week 3 source code disguised as new development; credit any meaningful open-source dependencies/assets.
- Required: open-weight/open-source AI essential to product; functioning demo or walkthrough; repository; English DEV article using contest template/tag. Multiple genuinely qualifying partner categories may be entered, but a submission can only win one prize.
- Do not claim a partner category until verified in the deployed project.
- The UI status of a challenge page can be inconsistent; check that the submission form actually accepts posts.

## 1. Product definition
**Name:** ZEMNE (working trademark; domain/trademark availability not presumed).  
**Tagline:** A place where memories live on.  
**Product:** Mobile-first, immersive virtual memorial hall where one organizer creates a memorial, shares a visitor URL, and friends sign a guestbook and submit written tributes. The organizer approves contributions, invokes **real Gemma** to weave approved tributes into a concise, evidence-linked remembrance, reviews/edits and publishes it to the hall's memory wall.

**Hero value:** The 3D hall is a functional place with **three destinations**—guestbook, tribute lectern, memory wall—not a static rendered illustration. AI transforms real contributions into a source-linked story without fabricating biographical claims.

**Audience:** Families, friends and diaspora attendees unable to participate in person. **Demo:** invented deceased identity and fictional contributions entered by one tester in separate sessions; never portray demo data as real testimonials.

**Never describe MVP as:** live streaming funeral service, multiplayer ceremony, VR headset product, deceased-person AI chat or voice cloning.

## 2. Scope — only six core capabilities
1. **Create a memorial:** name, optional life years, short description, optional portrait; organizer receives a recovery/admin link and a guest invitation link.
2. **3D memorial hall:** single designed scene, three clickable/tappable hotspots, cinematic but responsive camera transitions; a fully functional 2D accessibility/fallback view.
3. **Guestbook:** visitor can sign by providing a display name and short message; no guest registration. Approval is required before public display.
4. **Written tributes:** visitor can submit a personal memory, name and optional relationship; appears in the organizer's pending queue and remains invisible publicly until approved.
5. **AI Memory Weaver:** call a real open-weight Gemma model; take only approved tributes; return short organized paragraphs with valid source tribute IDs; flag uncertain/unsupported facts. No fake AI outputs in production.
6. **Organizer review and publication:** secret management access; approve/reject contributions; preview/edit AI draft; publish/unpublish the remembrance; published memory wall shows source links to approved tributes.

### Explicit non-goals
No end-user accounts, OAuth, email verification, voice recording, real-time multiplayer, avatars, livestreaming, payment/donations, WhatsApp/SMS, funeral bookings, multiple scene templates, AI voice clones, chat with the deceased, PDF generation, generic social feeds, monetization or admin SaaS dashboard.

### Core acceptance demonstration
Using **one laptop**: organizer creates memorial → copies public and private links → guest A in private browser signs/tributes → guest B and guest C submit contributions using separate sessions → organizer approves → Gemma returns source-backed draft → organizer reviews and publishes → guests revisit interactive hall and see approved wall while pending content stays private. Must also work on narrow mobile viewport.

## 3. Agent responsibility and boundaries
### CODEX — creative lead, frontend & integrations (final integrator)
**Sole owner:** new public GitHub repo creation; repo/scaffold and Git hygiene; design system; original ZEMNE identity, logo, wordmark and favicon; original images/textures; frontend UI/UX; real 3D scene/hotspots; API wiring on frontend; Chrome/browser skills if connected; MongoDB Atlas *resource provisioning* and access setup; Render *resource provisioning and deployment*; production environment variable configuration; final frontend assembly and merges.
- Codex may use its existing GitHub, MongoDB Atlas and Render plugins **if the corresponding actions are available and authorized**. Never claim a resource was created without inspecting actual result.
- Codex must not implement/modify Claude-owned APIs or AI business logic without explicit handoff.

### CLAUDE — backend engineer, data & AI
**Sole owner:** API/interface contracts; MongoDB collections, indexes and validation; secure organizer access mechanism; create/read and moderation APIs; abuse prevention; authorized Gemma inference and evidence-validation pipeline; backend unit/integration tests; privacy and security checks; developer docs for server interfaces.
- Claude uses infrastructure credentials via secure environment settings provided by Codex; never puts secrets in files, PRs, chat or logs.
- Claude does not modify Codex's brand, visual components, 3D scene or Render service settings.

### ANTIGRAVITY — independent QA & browser UX audit
**Primary responsibility:** Chrome/browser functional end-to-end tests, multi-session guest/organizer validation, iPhone-sized viewport QA, responsive and visual consistency auditing, interaction and performance profiling, accessibility and reduced-motion checks, screenshots/videos of actual application, failure repro and prioritized bug reports.
- Antigravity should operate on the integrated branch or deployed staging site; should not provision infrastructure or independently refactor backend/frontend. Targeted fixes only after assignment.

### Handoffs and concurrency
- **Contract first:** Claude publishes API paths/types/test fixtures before Codex wires UI.
- **One owner per directory or feature.** Codex: `src/app`, `src/components`, `src/3d`, `public/brand`, `public/assets`, deployment manifests. Claude: `src/server`, `src/lib/db`, `src/lib/ai`, `src/app/api`, `tests/backend`, `docs/API_CONTRACT.md` (adjust paths to framework). Shared types owned by Claude; Codex consumes them.
- Use short feature branches and PRs; Codex merges after lint, typecheck and automated tests pass. Avoid simultaneous edits to shared files. Agents MUST re-read the master/tracker each phase.
- Only mark tracker entries completed when code and evidence exist; record commit references and tests.

## 4. Brand and design brief (Codex is accountable)
### Positioning
Contemporary, solemn but hopeful, premium architectural experience; warm human remembrance, not a gaming interface and not a generic cemetery website. Responsive mobile-first design, polished on an iPhone-size viewport and desktop.

### Logo excellence gate
Create **three truly different original identity concepts**, review them, select the strongest and refine it. Deliver:
- `public/brand/zemne-logo-primary.svg` (full vector lockup)
- `public/brand/zemne-mark.svg` (distinct original icon/monogram)
- `public/brand/zemne-logo-light.svg`, `zemne-logo-dark.svg`
- `public/favicon.svg`, `public/favicon.ico` (if generated), PNG 32/180/192/512 icons as appropriate
- `docs/BRAND_GUIDE.md`: typography, spacing, colors, safe area, favicon readibility screenshots, design reasoning and asset provenance
- Use brand mark in header, organizer screens and app metadata. All artwork original or licensed with provenance.

**Art direction:** timeless geometry, strong negative space, subtly evoke presence/continuity/memory; elegant bespoke wordmark. Test at 16px favicon size. No stock AI logo; no robot, brain, neuron, circuit, glowing spark, generic dove, wings, candles, wreath clip-art, or plagiarized existing tech marks. Premium does not mean busy. A distinctive logo should work flat in one color before any texture/glow treatment.

### Colors and UI
Suggested starting direction (refine through design): midnight graphite `#171D2B`, warm ivory `#F3EFE8`, muted antique brass `#CBA568`, soft slate. High contrast, calm type with editorial headings and clean UI labels. Respect reduced motion, keyboard navigation, minimum touch targets ~44×44px and clear focus. Do not assume the mark/domain is legally available.

### 3D visual implementation
- Render **real interactive Three.js/React Three Fiber geometry or an original licensed 3D scene**. A static AI-rendered background with HTML hotspots alone does not satisfy the 3D objective.
- Single room: warm stone/timber/brass details, portrait plinth, guestbook desk, tribute lectern, memory wall. Three clear hotspots correspond to app features.
- Camera views: entrance overview, guestbook, tribute lectern, memory wall. Smooth bounded transitions, no avatars/free-roaming, no physics.
- Proper mobile interaction: tap hotspot or use pinned bottom navigation; discoverable back/home camera button; avoid jitter/scroll hijacking, GPU-heavy effects, unnecessary assets, autoplay audio, distracting particles.
- Must have graceful loading state, WebGL failure/low-power fallback to equivalent fully functional 2D navigation, and supports `prefers-reduced-motion`.
- Uploaded portrait shown with permission, with a tasteful neutral placeholder for demo. No fabricated real-person memorial portraits.

## 5. User roles and access (no login)
### Organizer
- `POST /api/memorials` creates a memorial; returns once a cryptographically random secret recovery token plus public link. Display **SAVE THIS PRIVATE LINK** and user acknowledgment. No general login.
- Preferred approach: owner recovery link stores token in **URL fragment** (e.g., `/manage/<id>#key=<secret>`), client exchanges it via `POST /api/organizer/session` to establish Secure/HttpOnly/SameSite session cookie, then clears fragment from address bar. Never put raw secret in access logs, public pages, analytics, database or repo; only a strong hash is stored.
- Session TTL; rotating/revocation capability when feasible; origin checks/CSRF defenses on writes; per-memorial permission checks on every organizer endpoint. Lost link cannot automatically be recovered in MVP; explain clearly.

### Guest
- A guest invitation URL such as `/m/<slug>` lets visitors view hall and submit guestbook/tribute without logging in.
- Privacy: non-indexed memorial pages, unlisted-by-default and explicit organizer notice that anyone with the public invite link can see approved content.
- `name`, `relationship` optional, `message`, affirmative contributor publication consent. Validation: length caps, profanity/abuse protections where feasible, rate limits, no raw HTML rendering. Pending content visible only to organizer. Show friendly moderation message.

## 6. Data model (MongoDB Atlas)
Collections (minimal):
- `memorials`: `_id`, `slug` unique, `name`, `birth_year?`, `death_year?`, `description`, `portrait_asset_url?`, `owner_token_hash`, `published_story?`, `visibility`, `created_at`, `updated_at`.
- `guestbook_entries`: `_id`, `memorial_id`, `display_name`, `message`, `status` (`pending|approved|rejected`), `consent`, `created_at`.
- `tributes`: `_id`, `memorial_id`, `contributor_name`, `relationship?`, `content`, `status`, `consent`, `created_at`.
- `story_drafts`: `_id`, `memorial_id`, `model_id`, `source_tribute_ids`, `paragraphs` as `{text, source_tribute_ids[]}`, `status` (`draft|published`), `edited_by_organizer`, `created_at`, `published_at?`.
Use MongoDB indexes on `slug`, `memorial_id`, `status`; public serializers must exclude secrets, pending content and sensitive metadata. Store small original portrait files only via persistent media storage, NOT Render's ephemeral filesystem. For a very short MVP, prefer selected predefined placeholder portraits or remote secure asset upload; do not make upload essential if it jeopardizes project completion.

## 7. API contracts — Claude defines full schema before Codex integration
Suggested stable route shape, revise only in `docs/API_CONTRACT.md` after coordinated signoff:
- `POST /api/memorials` → create, receive guest + private links.
- `GET /api/memorials/:slug` → only public-safe data.
- `POST /api/memorials/:slug/guestbook` → create pending guestbook entry.
- `POST /api/memorials/:slug/tributes` → create pending tribute.
- `POST /api/organizer/session` → exchange organizer token for scoped secure cookie.
- `GET /api/organizer/memorials/:id` → owner view and pending queue.
- `PATCH /api/organizer/guestbook/:id` → approve/reject.
- `PATCH /api/organizer/tributes/:id` → approve/reject.
- `POST /api/organizer/memorials/:id/weave` → Gemma generates draft from approved tributes only.
- `PATCH /api/organizer/stories/:id` → edit draft and publish/unpublish.
Every route uses schema validation and returns clear typed errors; all write endpoints use abuse controls and server validation. API data must not trust client-provided status or source IDs.

## 8. Actual open-weight AI implementation
**Required:** Gemma genuinely processes approved source contributions. It cannot be an API that returns a hardcoded paragraph. Record actual model ID, inference endpoint/provider, model license/hosting conditions, latency and evaluation results.

**Memory Weaver contract:**
- Input: memorial display metadata and list of organizer-approved tributes `{id, text}` only.
- Output structured JSON `{title, paragraphs:[{text,source_tribute_ids:[...] }], flags:[...]}`.
- Group by recurring themes and synthesize gently without invented names, dates, occupations, relationships or quotes. User contributions are untrusted content, not instructions.
- Validate JSON fields and source IDs; reject or label paragraphs referencing unknown IDs; do not call unsupported claims verified just because source IDs exist.
- Human organizer can view source tributes, edit, approve and publish. No automatic publication.
- If AI unavailable: show explicit error/retry, do not substitute fake output. Development mock data must be labeled DEMO and disabled for hackathon production.
- Acceptance: at least three synthetic tributes with at least two distinct themes generate a traceable draft, and tests cover malformed model output, hallucinated source ID, no approved tributes and prompt-injection text in a tribute.

## 9. Integration/hosting ownership
**Codex resource actions, Claude app logic:**
- GitHub: new public `zemne` repo, remote verified, initial commit time documented. No secrets or real private grief records.
- MongoDB Atlas: provision project/cluster, least-privileged app DB user, network access suitable for Render, connection string stored **only** in secure Render environment settings/local ignored `.env`. Use `MONGODB_URI` as contract. Avoid open access where a narrower approved path is possible; choose minimally exposed configuration and TLS.
- Render: deploy web service from repo, correct build/start commands, necessary env vars in dashboard, `/api/health` shows safe health only. `GEMMA_API_BASE_URL`, `GEMMA_MODEL_ID`, `GEMMA_API_KEY` (if needed), and `SESSION_SECRET` are backend-only. Production serving must not rely on local mutable filesystem.
- Asset uploads (if implemented) use persistent media storage; otherwise use demo assets with no upload dependency.
- Optional: Sentry **only** when doing real tracing and no sensitive content exposure; .tech domain only if actually provisioned. Partner categories are opt-in based on demonstrated meaningful use.
- Integrations may require the owner's interactive authorization. Agents must stop at any payment, billing, access grant or irreversible setting requiring explicit approval.

## 10. Privacy and responsible behavior
- Treat memorials as sensitive human content. No simulation of deceased voices, no false biographical assertions, no scraped obituaries, no hidden training on user tribute data.
- No publicly visible unmoderated contribution; user must approve before publication; removal and unpublish controls available.
- Avoid sending private tributes to unnecessary third parties; display disclosure for the actual AI processing provider. Synthetic demo data only.
- Public repo includes sanitized fixture text and a sample `.env.example`, never actual tokens, raw docs, personal tribute content, session cookies, database URI or private management URLs.

## 11. Required product screens
1. Start/create memorial (single compact form).
2. Organizer secret-link handoff (save link, public invitation, privacy notice).
3. Virtual hall (real 3D; loading; mobile controls; 2D fallback).
4. Guestbook interaction (submit & clear success receipt).
5. Tribute interaction (submit & moderation status).
6. Memory wall (approved story paragraphs + clickable contributing source excerpts).
7. Organizer console (pending moderation, generate, edit, publish/unpublish, copy public invite).
All UI must have sensible empty/error/loading/success states.

## 12. Acceptance / release gates
- [ ] Public repo created Oct 26–31; all builds and code dated correctly.
- [ ] Codex logo variants and favicon created as original vector assets; selected design readable at 16px.
- [ ] Functional 3D hall with three visible/tappable hotspots plus functional 2D fallback.
- [ ] No-login guest and secure organizer secret access; pending tributes never public.
- [ ] At least three guest personas simulated via separate browser contexts; one person end-to-end.
- [ ] Gemma actually used; citations to approved sources validated and displayed.
- [ ] Publish/unpublish controls work and edit is reflected in guest hall.
- [ ] MongoDB persistence works across server restart/redeploy.
- [ ] Render production URL functions on phone-sized and desktop screens.
- [ ] Automated tests, Chrome QA, accessibility spot-check, mobile performance notes and actual evidence captured.
- [ ] README with setup steps, public demo URL and screenshots; DEV entry complete before deadline.

## 13. Quality evidence for judges
Build with the demo story in mind: record starting create time, three guest submissions, approval, time to AI draft, invalid source prevention, publish, reload and mobile smoke tests. If errors occur, document real fixes and measurements, not invented success metrics. Recommend aiming for Render + Gemma + MongoDB Atlas categories; enter optional extras only after functioning integration proof.

## 14. Change control
Any agent proposing more features must write a short change request showing urgency, affected phases and scope impact; default to **NO** until the MVP is complete. The project should be judged on a real, finished memorial experience—not a feature wishlist.
