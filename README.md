# ZEMNE

A place where memories live on.

P0 foundation only. This is not a functioning memorial product or deployed demo.
No API handlers, database integration, AI inference, brand assets or 3D scene exist yet.

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

Open http://localhost:3000. No credentials are required for the foundation page.
`.env.example` intentionally contains variable names only; it is not a dotenv file.
When backend setup begins, create an ignored `.env.local` with required `NAME=value`
assignments using secure local tooling. Never expose these variables with `NEXT_PUBLIC_`.

## Ownership and next handoff

| Paths | Owner / purpose |
| --- | --- |
| `src/app` excluding `api`, `src/components/ui`, `src/3d`, `public/brand`, `public/assets` | Codex frontend and visuals |
| `src/server`, `src/lib/db`, `src/lib/ai`, `src/app/api`, `tests/backend` | Claude backend, no implementation in P0 |
| `src/shared`, `fixtures`, `docs/API_CONTRACT.md` | Claude P1 types, runtime validation and synthetic fixtures |
| `tests/scaffold.test.ts`, root configuration, CI | Codex integration tooling |

Claude P1: create a short feature branch from `main`; define API contracts, runtime
schemas and shared types in `src/shared`, fictional fixtures in `fixtures`, and
contract tests in `tests/backend`. Vitest discovers `tests/**/*.test.ts` and `.tsx`.
Do not implement the full backend, change frontend/brand files or provision services.
Do not begin P2 before the P1 gate passes. Use PRs and passing CI before integration.

## License and attribution

License selection awaits explicit owner approval. No LICENSE grant is made in P0;
package metadata is `UNLICENSED`. Public source visibility does not grant reuse rights.
Select an appropriate open-source license before claiming the project itself is open source.

Dependencies: Next.js (MIT), React (MIT), Tailwind CSS (MIT), Three.js (MIT),
React Three Fiber (MIT), TypeScript (Apache-2.0), ESLint (MIT) and Vitest (MIT).
Their respective upstream license terms apply. No prior implementation or third-party
visual assets were copied. Fixtures must remain explicitly fictional.
