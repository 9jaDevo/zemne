# P3 infrastructure handoff — October 27, 2026

**Status: PARTIAL — free Render preview live; Atlas provisioned; authenticated hosting-network probe still pending.** P3 only. No Claude-owned API, model, schema, auth or AI logic changed. P2 remains unmerged draft PR #2; P3 is stacked draft [PR #3](https://github.com/9jaDevo/zemne/pull/3).

## Actual resources

| Resource | Verified identity | Region / status |
| --- | --- | --- |
| Public GitHub | https://github.com/9jaDevo/zemne; created 2026-10-27T09:07:38Z | PUBLIC, main default |
| Atlas organization | `689b3913190aeb046ace2bf1` | AI-client access enabled by owner |
| Atlas project | `ZEMNE`, `6ae08765a24262dfc8a76737` | Dedicated project created |
| Atlas cluster | `zemne-mvp`, `6ae087883c6794a404b3da66` | FREE, AWS US_EAST_1, MongoDB 8.0.34, active |
| DB user | `zemne_app` | Owner submitted prepared Chrome form; connector verifies ONLY `readWrite` on `zemne`, scope CLUSTER `zemne-mvp` |
| Atlas IP access | `74.220.49.0/24`, `74.220.57.0/24` | Both ACTIVE in Chrome; actual Render Virginia outbound ranges |
| Render workspace | `tea-d5e1hp1r0fns73au271g` | Signed-in owner workspace |
| Render service | `zemne-preview`, `srv-dbg8g40m7kps73bnh6e0` | Node FREE, Virginia (US East) |
| HTTPS preview | https://zemne-preview.onrender.com/provisioning | Actual HTTP 200; explicitly says final demo is not live yet |

No `0.0.0.0/0`, developer IP, paid service, disk or persistent upload storage added. Render regional CIDRs are shared infrastructure; cluster-scoped credentials remain essential. Original neutral portrait assets retained.

## Actual deployment settings

Source: `9jaDevo/zemne`, branch `codex/p3-infrastructure`, repository root. Auto-deploy OFF, manual deployments only. Node `24.11.1`, `NODE_ENV=production`, `NEXT_TELEMETRY_DISABLED=1`.

Build command:

```sh
npm ci --include=dev && npm install --prefix .infra-tools --no-save --no-package-lock mongodb@7.7.0 && npm run build
```

Start command:

```sh
node scripts/infra/render-start.mjs
```

The driver is isolated infrastructure tooling; application dependencies and lockfile remain unchanged. Health path `/provisioning` checks page serving only. `/api/health` remains 404 until Claude implements it. The placeholder starts even if the DB probe fails, so Render green status is not database readiness.

`render.yaml` records the manually provisioned service; it is not an applied Blueprint. Do not apply it as a second service. Its session-secret generation declaration describes clean provisioning; this service already has a locally generated secret securely configured.

First deploy `dep-dbg8g48m7kps73bnh73g` failed because production npm installation omitted the Tailwind build dependency. Fixed with `npm ci --include=dev`, commit `a0aa9c56a8c33033747ac1ed2bce2ea0409eb681`. Actual successful deploy `dep-dbg8k2d9fdbs73d3mc9g` took 1m14s. Startup-probe update: `be463f93200d9ffb16afef0e45b01ddc15a87a8d`; its deployment result will be recorded below.

## Secure variable handoff

| Name | Confirmed state | Next owner |
| --- | --- | --- |
| `MONGODB_URI` | Name exists on Render; Owner saved value; format invalid, correction/probe pending | P3 verifies access after entry |
| `SESSION_SECRET` | Nonempty cryptographically random value securely saved on Render | Claude consumes backend-only |
| `GEMMA_API_BASE_URL` | Name exists, blank | Claude P5 selects actual provider |
| `GEMMA_MODEL_ID` | Name exists, blank | Claude P5 selects actual Gemma model |
| `GEMMA_API_KEY` | Name exists, blank | Claude P5 if actual provider requires it |

Private local session-secret file is outside the repository at `C:\Users\hp\.codex\secrets\zemne\p3.env`, with restricted user ACL. No database password/URI was generated or retained locally by Codex. Never copy values into Git, logs, screenshots, chat or NEXT_PUBLIC variables. Credential entry/submission was handed to the owner under browser-use policy. No fake Gemma configuration was entered.

The previous Atlas organization-policy and Render sign-in blockers were resolved by the owner. Connector database-user and access-list writes still returned missing-tool-confirmation errors even after explicit approval. At the owner's request, Chrome was used: network entries saved and verified ACTIVE; exact database user form prepared and owner clicked Add User. Read-only connector verification confirms the final least-privilege role and cluster scope.

## Backend-only access test

`scripts/infra/probe-mongodb.mjs` reads only injected `MONGODB_URI`, requires database `/zemne`, enforces TLS with certificate/hostname validation, performs ping and connectionStatus, and checks the only effective role is `readWrite` on `zemne`. It writes no data, exposes no HTTP endpoint, and suppresses raw driver errors and credentials.

`scripts/infra/render-start.mjs` runs that probe on the actual Render runtime network before starting Next. Logs contain only an allowlisted status and role-check boolean. Timeout/failure never prints child stderr. Read the deployment logs for sanitized `probe: mongodb`, `status: ok`, `expected_role_only: true`. A missing-config result is not a connectivity pass. Cluster minimum TLS version has not independently been inspected; the client probe enforces validated TLS.

With a securely injected environment, Claude can run:

```sh
node scripts/infra/probe-mongodb.mjs
```

For an ignored local env file, use `node --env-file=.env.local scripts/infra/probe-mongodb.mjs`; local access requires its own explicitly approved narrow network path. Do not open network access just to make a local check pass. Exit 0: authenticated ping and expected role; 1: auth/connect failed; 2: config/driver missing or unsafe; 3: role review required. Never broaden permissions automatically.

## Validation, limitations and rollback

Lint (zero warnings), typecheck, 7 test files / 83 tests passed for startup commit. Script syntax and Git whitespace checks passed. Earlier P3 local build and actual Render production build passed. Public placeholder browser screenshot is `docs/evidence/p3/render-placeholder-live.png`; active network table is `docs/evidence/p3/atlas-render-network.png`. Initial sign-in screenshot is historical only.

No real DB-backed lifecycle, persistence across redeploy, Gemma generation or final demo acceptance is claimed. Those require later Claude/backend and integration phases. The free Render service sleeps with inactivity and lacks shell/one-off jobs; startup probe supplies hosting-network evidence without paid upgrades.

Rollback: retain known successful Render deploy `dep-dbg8k2d9fdbs73d3mc9g`; restore its earlier start command `npm run start -- --hostname 0.0.0.0` and build `npm ci --include=dev && npm run build` if needed. Do not delete Atlas resources as a rollback shortcut. No unrelated services were modified.

Latest startup deployment: dep-dbgb00sipgvc73f1ubkg, source be463f9, succeeded/live in 1m19s. Actual Render runtime probe: not_configured, expected_role_only false. Database access is still unverified pending secure URI entry.
Remote Linux CI for be463f9 passed installation, lint, typecheck, 83 tests and build: https://github.com/9jaDevo/zemne/actions/runs/40517904603 and https://github.com/9jaDevo/zemne/actions/runs/40517895110.

## URI follow-up — current gate

Owner confirmed saving MONGODB_URI. Deployment `dep-dbgb2kqfngtc7397a6u0` from `23e9cf4f53b6282045561ffebe22f427451c4258` succeeded/live, but its actual Render runtime probe returned `invalid_or_unsafe_configuration`. This supersedes the historical missing-config result. Secure UI checks reported only booleans: a value exists and begins with the MongoDB scheme, but URL parsing fails. No value, raw exception, hostname or password was printed/copied/changed. Owner correction requested: use Atlas Connect → Drivers template, URL-encode password special characters, target `/zemne`, save in Render. P3 remains PARTIAL until authenticated hosting-network ping passes. This is a configuration gate, not evidence of an Atlas connectivity failure.