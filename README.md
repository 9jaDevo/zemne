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

License selection awaits explicit owner approval. No LICENSE grant is made in P0;
package metadata is `UNLICENSED`. Public source visibility does not grant reuse rights.
Select an appropriate open-source license before claiming the project itself is open source.

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
