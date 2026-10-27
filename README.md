# ZEMNE

A place where memories live on.

P2 frontend preview: original identity, a real React Three Fiber memorial hall,
accessible 2D destinations and mobile-first guest/organizer screens. P1 supplies
typed contracts and fictional fixtures. This is not a deployed memorial product:
no real API handlers, database integration or AI inference exist yet.

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
When backend setup begins, create an ignored `.env.local` with required `NAME=value`
assignments using secure local tooling. Never expose these variables with `NEXT_PUBLIC_`.

## Ownership and next handoff

| Paths | Owner / purpose |
| --- | --- |
| `src/app` excluding `api`, `src/components/ui`, `src/3d`, `public/brand`, `public/assets` | Codex frontend and visuals |
| `src/server`, `src/lib/db`, `src/lib/ai`, `src/app/api`, `tests/backend` | Claude backend, no implementation in P0 |
| `src/shared/api`, `src/shared/fixtures`, `docs/API_CONTRACT.md` | Claude P1 types, runtime validation and synthetic fixtures |
| `tests/scaffold.test.ts`, root configuration, CI | Codex integration tooling |

P1 contract and validation work is integrated. See `docs/API_CONTRACT.md`,
`docs/BRAND_GUIDE.md` and `docs/P2_FRONTEND_HANDOFF.md` for the current interfaces,
asset provenance, local preview, evidence and P6 wiring instructions. P2 screens
consume `ZemneApiClient`; P6 replaces the development wrapper with real routes and
`createHttpClient()` after the backend gates pass. Use PRs and passing CI before
integration. P2 does not provision infrastructure or implement backend/AI logic.

## License and attribution

License selection awaits explicit owner approval. No LICENSE grant is made in P0;
package metadata is `UNLICENSED`. Public source visibility does not grant reuse rights.
Select an appropriate open-source license before claiming the project itself is open source.

Dependencies: Next.js (MIT), React (MIT), Tailwind CSS (MIT), Three.js (MIT),
React Three Fiber (MIT), TypeScript (Apache-2.0), ESLint (MIT) and Vitest (MIT).
Their respective upstream license terms apply. No prior implementation or third-party
visual assets were copied. Fixtures must remain explicitly fictional.
