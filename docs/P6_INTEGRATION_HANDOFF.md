# P6 integration handoff — October 27, 2026

## Scope and prerequisite gates

P6 only. P4 passed isolated MongoDB/authorization/moderation tests and a production-server local smoke. P5 passed a real locally callable Gemma weave and safe-failure acceptance. Their evidence was inspected before integration. No Claude-owned API, DB model, auth, AI implementation, shared contract or backend test changed. Contract remains 1.2.0.

P6 is on `codex/p6-live-integration`, draft PR https://github.com/9jaDevo/zemne/pull/6, stacked on `claude/p5-gemma-weaver`. P2–P5 stacked PRs remain unmerged; this deployment uses the P6 branch. No owner visual-approval or main-branch merge is implied.

## Live application

- Service: https://zemne-preview.onrender.com
- Synthetic rehearsal: https://zemne-preview.onrender.com/m/mira-vale-synthetic-p6-rehearsal-kkr2i9
- Create: `/create`; public invitations: `/m/[slug]`; organizer: `/manage/[id]`.
- Render service `srv-dbg8g40m7kps73bnh6e0`, FREE Node, Virginia. Manual deploy, auto-deploy off.
- Build `npm ci --include=dev && npm run build`; start `node scripts/infra/render-start.mjs`; health `/api/health`.
- Atlas project `6ae08765a24262dfc8a76737`, FREE `zemne-mvp`, AWS US_EAST_1. Existing scoped user/network preserved.
- MONGODB_URI, SESSION_SECRET and GEMMA_API_KEY are hosting-only. Actual base URL is `https://generativelanguage.googleapis.com/v1beta/openai`; model `gemma-4-31b-it`.
- Unpaid Google AI Studio tier: synthetic content only; visible creation, guest and organizer disclosures. No paid tier or billing action taken.

## Integration behavior

Real typed same-origin HTTP client replaces the production mock wrapper. Create returns one-time private/public paths; acknowledgment is required, then token-bearing response state is discarded. No local/session storage. On initial private-link load, the fragment is cleared before exchange. Hash changes in an existing organizer tab are also consumed/cleared, re-exchanged and the console remounted. Secrets are not serialized into page HTML.

Preserved R3F geometry, camera views, lighting, mobile controls, reduced-motion behavior and WebGL failure handling. All three raycast brass markers were clicked in the hosted hall: guestbook opens the real form/approved entries, tribute opens the real submission form, wall opens genuine published/empty state. Equivalent 2D controls remain functional.

Organizer moderation uses actual pending queues. Weave calls real P5 background jobs; 1–3 minute status, disabled duplicate action and reload resume. Failures show explicit retry with no generated substitute. Editor shows flags and original approved sources, sends current version and requires review acknowledgment before publishing. Citation dialogs resolve from approved public response tributes, never organizer pending data. Public story shows actual model/provider and edit disclosure.

Dynamic create/public/manage shells plus no-store/private response headers, no-referrer and noindex/nofollow. API's original serializers and cookie/auth remain Claude-owned. Static original branding, favicon/ICO/manifest and abstract placeholders served correctly. The old /provisioning checkpoint now links to the real demonstration.

## Observed hosted smoke

1. Created **Mira Vale — synthetic P6 rehearsal**, fictional biography and original neutral artwork, through live UI. One-time private-link screen and acknowledgment worked; no screenshot/raw token retained in Git.
2. Submitted one guestbook entry and three distinct fictional guest tributes through real UI (teaching/patience and shared-garden/belonging themes). All four appeared pending to organizer. Public API had zero entries/tributes and null story before approval.
3. Approved all through organizer UI. Public response then had one guestbook entry and three tributes, null story.
4. Redeployed from `d3ee924` to `fca4032517f838192970c67f0b32814a7288db83`, deployment `dep-dbgd7snf3r2c73cc86bg`. All contributions survived. Health 200, database ok, AI configured. Runtime TLS probe ok, expected_role_only true.
5. Before corrected provider config was active, a genuine weave attempt returned AI_UNAVAILABLE; explicit error and Retry Gemma weave appeared, with no draft. Screenshot `ai-error-retry.png`. Hosting UI's masked field input initially did not retain base/model; corrected with native input events and exact-value boolean checks. No fake values/model output used.
6. Real Gemma job on configured deployment returned two source-linked paragraphs; UI showed progress and resumed after reload (`weave-running-resumed.png`). Draft was not public. Model label `gemma-4-31b-it`.
7. Edited title to **Mira Vale — patience and shared gardens**, saved; publication disabled before review acknowledgment, enabled after. Published edited draft. Every citation ID belongs to the three approved public tributes. Ari's source dialog exactly matches the original submitted text (`published-source-desktop.png`).
8. Unpublish removed public story while retaining all approved contributions. Republished after review. Anonymous organizer API request returned 401 with no-store. Private-link existing-tab edge case found and fixed before final acceptance; final deployment results follow below.

These are three guest personas submitted through the actual UI, not three isolated cookie jars/networks. Independent multi-session/multi-device QA belongs to P7. No raw database edits, manual story inserts, fake production endpoints or fixture-driven live responses.

## Validation and evidence

- `npm ci`: passed, 450 packages, audit reported zero vulnerabilities. First attempt hit an existing ZEMNE Next process locking the Windows SWC binary; that project server was stopped and installation rerun successfully.
- Lint zero warnings; typecheck; 12 test files / 193 passed, 9 opt-in live tests skipped; production build passed. Real hosted Gemma above is separate from scripted unit tests.
- Linux CI for `fca4032`: https://github.com/9jaDevo/zemne/actions/runs/40542718586 and https://github.com/9jaDevo/zemne/actions/runs/40542712372.
- Exact configured local key-value scan across 18 compiled client assets: zero matches. No NEXT_PUBLIC secret configuration. No Claude-owned files changed. No provider value or management token in committed evidence.
- `hosted-checks.json`: actual HTTPS 200 on root/create/public/manage shell/favicon SVG/ICO/manifest/health; private/no-store, no-referrer and robots headers; metadata links; DB/AI presence only.
- `published-synthetic-lifecycle.json`: public-safe synthetic response, model/edit flag, 3 approved tributes, all citation IDs valid, anonymous owner 401.
- At 390×844: no horizontal overflow, actual Canvas present, no in-memory preview label; explicit 2D guestbook displayed the approved real entry (`hall-mobile-390.png`, `fallback-guestbook-mobile.png`). Desktop raycast clicks verified all three markers.
- Independent P7 screen-reader, physical phone, cross-browser, two-network rate-limit bucket/IP-header verification, full abuse/security and performance audit remain pending. No FPS/Lighthouse or accessibility certification claim. No rehearsal video recorded; screenshots and actual API evidence provided.

## Security action and rollback

During hosting configuration a tool-output snapshot accidentally exposed the provider key. Owner was informed and explicitly chose to proceed and rotate later. **Rotate/revoke that key and update Render before sensitive use.** No key value is in this document, Git or compiled client evidence. Do not use real memorial information with the current unpaid provider. This open action is not waived by build or smoke success.

Rollback using the last known verified service deployment/source; retain original secure environment settings and Atlas data. Prior P3 placeholder deploy `dep-dbgb6iifngtc7397jki0` lacks real backend app routes, so reverting to it suspends application functionality. No destructive DB rollback. Free service can cold-start slowly; an in-flight weave interrupted by restart must fail honestly and be retried.

## Antigravity handoff

Test the final deployed commit identified below. Create a fresh synthetic memorial and save its private link outside evidence; never screenshot it. Use three isolated guest/organizer sessions and verify pending isolation, source exactness, publish/edit/unpublish, invalid/expired/other-owner access, AI failure/retry, reduced motion, keyboard/2D/WebGL failure and 375/390/768/desktop. Check same-tab private fragment recovery, no-cache/no-key behavior, and data after redeploy. Record any defects in P7; no independent QA is claimed here. STOP after P6.

## Final deployed acceptance

**P6 live smoke gate passed.** Final tested/deployed source `85a4f6af3fc6431b647eb28b4e083ad4def4d107`; Render `dep-dbgdc6gu01pc73fjpspg`, October 27, 2026 12:49:30 PM EDT, succeeded/live in 1m41s. Runtime validated-TLS ping and expected role passed. Signed-in Render dashboard browser was used because no Render connector actions are installed in this session; no deployment API connection was invented.

On this final deployment the same-tab private recovery fragment was cleared and authenticated console recovered. After a further redeploy the real published story ID, edited title, paragraphs and citation IDs were unchanged, with one approved guestbook entry and three approved tributes. Public health returned database ok and AI configured; public story still identifies real gemma-4-31b-it. Final API/browser facts: `docs/evidence/p6/final-deployment.json`; provider proof: `render-final-deploy.png`; published phone view: `published-wall-mobile-390.png`. Source dialog Escape closed normally; no horizontal overflow or private token text at 390px. Temporary viewport override reset.

Final source CI installation/lint/typecheck/tests/build passed: https://github.com/9jaDevo/zemne/actions/runs/40544638130 and https://github.com/9jaDevo/zemne/actions/runs/40544629063. Docs/evidence-only follow-up commits do not change this deployed source. Key rotation remains explicitly deferred by owner, and independent P7 QA is not performed. P6 stops here.
