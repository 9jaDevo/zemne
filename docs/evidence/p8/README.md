# P8 live evidence — October 28, 2026

**Published submission:** https://dev.to/9jadevo/zemne-distance-shouldnt-erase-participation-in-remembrance-5699.
Verified anonymous HTTP 200, rendered Week 4 submission banner, required tags,
and `datePublished` / `time datetime`: **2026-10-28T07:25:43Z**. Receipt:
`submission-receipt.json`; actual public screenshot: `dev-published.png`.
PR #10 verification reran lint, typecheck, build and **207 tests passed / nine
opt-in live skipped** on Linux, then merged as `32c254e`. Thus the same test count
has fresh remote verification as well as historical consolidation evidence.

Tested application commit: **95992fc1cff564bfae041a823a10d2f854520415**.
Public repository: https://github.com/9jaDevo/zemne (PUBLIC, MIT).
Live service: https://zemne-preview.onrender.com.
Synthetic submission memorial: https://zemne-preview.onrender.com/m/mira-vale-fictional-submission-65cutb.

Render service `srv-dbg8g40m7kps73bnh6e0`, Virginia, Free plan. Browser dashboard
source branch was corrected from `codex/p6-live-integration` to `main`. Manual
deployment **dep-dbgpp4gn74is73d428b0** built main successfully and reported live at
**2026-10-28T06:57:54Z**. The earlier owner-triggered deployment succeeded with
the older `360a458` source; success alone did not establish the correct revision.
No environment value or plan was changed. Startup MongoDB probe reported `ok`.

## Real workflow and checks

- CUA browser UI created Mira Vale using invented details. The one-time management
  capability was saved outside the repository. No claim-screen screenshot or
  capability is included. The organizer session opened successfully.
- One guestbook message and separate Ari, Rowan and Jun tribute submissions returned
  pending receipts. One tester supplied all invented voices. Ari/Jun used the in-app
  browser; Rowan used Chrome Cookies profile. The third Chrome profile stalled before
  submission; the organizer queue confirmed no Jun record before the stable UI retry.
  This is not a claim of three independent people or three isolated guest sessions.
- `public-before-approval.json`: public GET returned zero messages, zero tributes and
  no story while all four contributions were pending. All four were approved
  individually through the organizer UI.
- `weave-job.json`: real `gemma-4-31b-it`, Google AI Studio (Gemini API), three approved
  source inputs, two-paragraph draft. Started **07:05:50.772Z**, finished
  **07:06:42.132Z**, **51.360 seconds**. This one successful run does not replace the
  saved six-scenario historical 4/6 provider evaluation.
- All three originals were inspected through the source dialog. An implied direct
  quotation was changed to attributed prose, and the title made explicitly fictional.
  Saved version two; acknowledged review; published version three at
  **07:09:25.273Z**. `public-published.json` contains real published output, not a fixture.
- Public citation click opened Jun's exact approved original. `live-smoke.json`:
  three approved tributes, one guestbook message, all citations resolve, model label
  present, edited story, `no-store, max-age=0, private` cache policy.
- `permission-check.json`: actual owner 200, cross-memorial organizer 403/FORBIDDEN,
  anonymous organizer 401/UNAUTHENTICATED. A second fictional memorial was created for
  the cross-scope test. An initial manual probe used the wrong session request field
  and returned 400 before being corrected to the documented `memorial_id`/`token`.
- Ten initial page script URLs (758,241 bytes) were checked for complete organizer
  token, Google key and MongoDB URI patterns: zero matches. Lazy chunks and arbitrary
  secret formats were not comprehensively audited.
- `assets-persistence.json`: favicon.svg, favicon.ico, primary logo SVG and the
  876,964-byte sanctuary GLB returned HTTP 200 and SHA-256 matched local files. The
  old P6 synthetic memorial still returned its three approved tributes and published
  story after the main deployment. `browser-metadata.json` records real title,
  description and icon links.
- 390px WebGL and 375px manual fallback screenshots: no horizontal document overflow;
  fallback removes the canvas. A transient unavailable-3D notice appeared during
  source navigation, then the canvas was available again. Endurance/context-loss
  behavior and physical-device performance are not certified by this run.
- `room-load-observation.json`: warm-cache reload was not ready at 742ms and was
  observed ready at 9,151ms. Automation scheduling is included. The prior progress
  locator wait timed out despite no progress matches and is explicitly excluded;
  this observation interval is not a precise load/FPS benchmark.
- Fresh `npm run lint` and `npm run typecheck` passed. The main consolidation's
  standard test result remains 207 passed / nine opt-in live skipped. The Render
  deployment ran a real production build successfully. No new application features
  or Claude-owned backend logic were changed for P8.

## Walkthrough

`zemne-walkthrough.mp4`: **2:50.24**, 1280×720, edited actual browser still captures,
16 scenes, local Windows System.Speech synthetic narration. It is **not continuous
screen recording**. Generation wait/navigation are compressed and disclosed
throughout. `walkthrough-scenes.json` preserves narration and source images;
`walkthrough.srt` is the transcript/subtitle sequence. `assemble_walkthrough.py`
only assembles media and never automates a browser. FFmpeg decoded all 2,551 frames
and the audio successfully. Private management-link reveal is intentionally omitted.

## Reproduce the live acceptance flow

1. Open the public app, create a memorial with invented details, privately save the
   one-time organizer link and open its console. Never record or share that link.
2. Open its invitation in a guest browser. Submit one guestbook message and three
   distinct fictional tributes with consent. Before approval, GET the public
   `/api/memorials/:slug` and verify empty contribution arrays and no story.
3. Refresh organizer, approve each contribution, then weave. Wait for a genuine
   completion or explicit error; on an error use retry. Do not replace output.
4. Read each cited original, edit if needed, save and acknowledge review. Publish.
   Reload the invitation, open memory wall and each source; compare to approved text.
5. Check anonymous organizer 401, another organizer's memorial 403, public no-store,
   mobile widths, fallback, logo/favicon and persistence after a reviewed deploy.

Open gates: independent Antigravity retest of current main, real phone GPU/thermal
and endurance checks, durable external background queue, alternate inference host,
and provider/key-rotation follow-up already identified separately. Do not describe
this synthetic developer demo as privacy/security certified or universally production ready.
