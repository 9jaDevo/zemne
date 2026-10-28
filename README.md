# ZEMNE

A place where memories live on.

Mobile-first memorial hall with original ZEMNE identity, real React Three Fiber
architecture, equivalent 2D navigation, moderated contributions, MongoDB Atlas
persistence and a real Gemma Memory Weaver.

Hosted synthetic demonstration: https://zemne-preview.onrender.com
Create at `/create`, visit invitations at `/m/<slug>`, and use the private
`/manage/<id>#key=<secret>` link for organizer access. Use invented details only:
the configured Google AI Studio unpaid tier may use prompts/outputs to improve
products. AI drafts require organizer review before publication. Free Render can
sleep between visits. Independent Antigravity acceptance is still pending.

## Authority

Read `01_ZEMNE_MASTER_BLUEPRINT.md`, `02_ZEMNE_PHASE_TRACKER.md`, then
`03_ZEMNE_AGENT_PHASE_PROMPTS.md`. The master blueprint controls scope.

## Local development

Use Node.js 24 LTS and npm 11.

```sh
npm ci
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

Open http://localhost:3000. Visit `/demo` for the explicitly fictional, in-memory
preview and `/identity` for the three original logo directions and icon proofs.
The mock experience is disabled in production builds. It resets on reload and
does not share data across browser sessions. Use fictional content only.
`.env.example` intentionally contains variable names only; it is not a dotenv file.
Create an ignored `.env.local` with required `NAME=value`
assignments using secure local tooling. Never expose these variables with `NEXT_PUBLIC_`.

Backend setup requires a MongoDB database (`zemne` by default) and a privately
generated session secret of at least 32 characters. Atlas connections must use
validated TLS and an approved network allowlist. A local MongoDB used for the
real application needs a replica set because publication/moderation use
transactions. Required server configuration names are listed below; no values
belong in source control. Configure a reachable Gemma chat-completions provider
before expecting generation to succeed. Missing/unavailable AI shows an explicit
error rather than a generated-looking substitute.

## Ownership and next handoff

| Paths | Owner / purpose |
| --- | --- |
| `src/app` excluding `api`, `src/components/ui`, `src/3d`, `public/brand`, `public/assets` | Codex frontend and visuals |
| `src/server`, `src/lib/db`, `src/lib/ai`, `src/app/api`, `tests/backend` | Claude backend, persistence, auth and AI |
| `src/shared/api`, `src/shared/fixtures`, `docs/API_CONTRACT.md` | Claude P1 types, runtime validation and synthetic fixtures |
| `tests/scaffold.test.ts`, root configuration, CI | Codex integration tooling |

The integrated app consumes real `createHttpClient()` APIs against contract 1.2.1. P4 and P5
local gates passed before integration. See `docs/P6_INTEGRATION_HANDOFF.md` for
hosted lifecycle evidence, tested commit, deployment IDs and independent QA gates.
Backend-only environment names: `MONGODB_URI`, `SESSION_SECRET`,
`GEMMA_API_BASE_URL`, `GEMMA_MODEL_ID`, `GEMMA_API_KEY`. The owner supplies secret
values only through ignored local or Render settings. Remote MongoDB requires
validated TLS and an approved narrow network path; the Atlas project currently
allows the hosting region’s outbound ranges only. Never put a URI/key into client
code. The development `/demo` adapter remains disabled in production.

## License and attribution

The owner approved the [MIT license](LICENSE) for ZEMNE's application source.
Third-party dependencies, fonts, textures and model weights retain their own
licenses; this grant does not relicense those assets or override hosted-provider terms.

Dependencies: Next.js (MIT), React (MIT), Tailwind CSS (MIT), Three.js (MIT),
React Three Fiber (MIT), TypeScript (Apache-2.0), ESLint (MIT) and Vitest (MIT).
Their respective upstream license terms apply. No prior implementation or third-party
architectural models were copied. The original Garden of Light model uses CC0
Poly Haven material maps and HDR lighting; Newsreader and DM Sans are bundled
under their included OFL licenses. See `docs/SANCTUARY_REDESIGN.md` and
`public/3d/material-provenance.json`. Fixtures must remain explicitly fictional.

## Main branch and submission preparation

The consolidation includes P2–P6, Codex's UI QA fixes, the Garden of Light redesign,
and Claude's P7 backend fixes. See `docs/MAIN_INTEGRATION_HANDOFF.md` for ancestry,
validation and remaining gates. Historical screenshots and hosted P6 evidence do
not certify the new main revision. Deployment, independent live/device retesting,
license selection and submission are separate steps.

## AI, tests and honest limits

The configured model is **`gemma-4-31b-it`**, served by **Google AI Studio through
the Gemini API OpenAI-compatible interface**. Gemma 4's
[official model card](https://huggingface.co/google/gemma-4-31B-it) identifies the
weights under Apache-2.0. ZEMNE does not self-host or fine-tune the weights. Only
approved tribute text and memorial metadata go to the model, under per-request
source aliases. Structured contributor-name fields are omitted, but personal
details inside prose are not automatically anonymized. Valid source links enable
human review; they do not prove factual accuracy. Nothing is auto-published.

The consolidated standard suite passed **207 tests**, with **nine opt-in live
tests skipped**, plus lint, typecheck and production build. Those results and
green CI certify the tested source, not current hosted inference availability.
The latest saved real-model evaluation succeeded in **4 of 6** synthetic scenarios;
two failed safely after overload retries. Successful end-to-end waiting times
were **37.3–216.9 seconds** (four samples), so a short edited walkthrough must
disclose any omitted waiting time. Free Render can sleep; free AI capacity is
intermittent; background jobs can be interrupted by process restarts.

See [technical evidence and architecture](docs/P8_TECHNICAL_EVIDENCE.md) for exact
budgets, permissions, database choices, benchmark files, failures/fixes and provider
privacy conditions. [P7 backend retest steps](docs/P7_BACKEND_FIXES_HANDOFF.md)
and [sanctuary retest steps](docs/SANCTUARY_RETEST.md) remain separate from
historical report claims. Use only fictional content; this is a developer
demonstration, not a privacy-certified service for real family records.

## Live submission evidence

The reviewed `main` application commit `95992fc` was deployed to Render on October
28, 2026. The [fictional submission memorial](https://zemne-preview.onrender.com/m/mira-vale-fictional-submission-65cutb)
completed a real creation → one guestbook message + three tributes → moderation →
Gemma → source review → edit → publication flow. The successful job took 51.36s;
this single smoke run is not a reliability benchmark.

[Watch the 2:50 edited walkthrough](docs/evidence/p8/zemne-walkthrough.mp4) and
[read the checks and limits](docs/evidence/p8/README.md). The video uses actual
live UI still captures with local synthetic narration; it compresses waiting and
does not expose the one-time organizer capability. Physical-phone testing and
independent acceptance of the latest main remain separate gates.
