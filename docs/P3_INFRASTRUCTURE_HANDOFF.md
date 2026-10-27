# P3 infrastructure handoff — October 27, 2026

**Status: BLOCKED by Atlas organization policy and missing Render authentication.**
Preparation exists; cloud provisioning, deployment and database reachability have
not succeeded. Do not interpret local tests, the Blueprint file or the placeholder
page as proof that a cloud resource exists.

## Verified access and blockers

| Provider | Actual evidence | Result |
| --- | --- | --- |
| GitHub | CLI repository lookup: `https://github.com/9jaDevo/zemne`, PUBLIC, default branch `main` | Available; P2 remains draft PR #2 awaiting visual review |
| Atlas | Connected MongoDB Atlas tools expose organization/project/cluster/user/network actions | Two read-only discovery calls failed with the organization-policy error below |
| Render plugin | Directory lookup returned Render with `installed: false`; no Render action tools present | Not installed/connected in this session |
| Render browser | `https://dashboard.render.com` redirected to `/login`, with empty sign-in fields | No authenticated workspace/service accessible |
| Local secrets | Presence-only check: all five backend variables absent; `.env`, `.env.local`, `.env.production` absent | No credentials available for a database probe |

Atlas error, quoted without modification except omission of the unusable URL placeholder:

> MCP access is disabled for every MongoDB Atlas organization this user belongs to (1 total), so no Atlas data is reachable over MCP. Retrying or re-authenticating will not change this.

The connector also says an Organization Owner must enable AI client access. No
retry, reauthentication workaround, direct API bypass or alternate Atlas browser
action was attempted after this explicit governance blocker.

Owner action: in Atlas **Organization Settings → App Connections**, review and
enable the AI-client access mode appropriate for provisioning. This setting is
organization-wide and applies to supported AI clients as a group; it is not a
grant limited to this chat. Have the Organization Owner review that scope first.
See [MongoDB's official access instructions](https://www.mongodb.com/docs/mcp-server/remote-mcp/manage-ai-client-access/).

For Render, install/connect the available Render integration, or sign in to the
open dashboard. Confirm the workspace and free-only plan before creation. No
password, API key, database URI or session secret should be sent in chat.

## Resource inventory — actual values only

| Resource | ID/name | Region | URL/status |
| --- | --- | --- | --- |
| GitHub repo | `9jaDevo/zemne` | n/a | Public URL verified above |
| Atlas organization | ID/name unavailable; connector reports one organization | Unverified | Organization policy denies discovery |
| Atlas project | Unverified; not created by this run | Unverified | No project ID available |
| Atlas cluster | Unverified; not created by this run | Unverified | No cluster ID or hostname available |
| Atlas application DB user | Unverified; not created by this run | n/a | No credential generated |
| Atlas IP allowlist / minimum TLS | Not inspected or changed | n/a | No exposure or TLS setting changed |
| Render workspace | Not selected/authenticated | Unverified | Sign-in required |
| Render web service | Not created/verified by this run | Unverified | No service ID, deployment ID or public service URL |
| MongoDB reachability | No authenticated attempt possible | n/a | Probe reports `not_configured`; no successful ping |

## Prepared deployment candidate

`render.yaml` is **unapplied**, reviewed against Render's current documentation:

- Node web service, proposed name `zemne-preview`, explicit **free** plan.
- Proposed Render region `virginia`; pairing candidate Atlas AWS `US_EAST_1`.
  These are proposals, not actual resource locations. Confirm before creation.
- Source repository `https://github.com/9jaDevo/zemne`, branch
  `codex/p3-infrastructure`. This is a stacked branch based on the unmerged P2
  preview; do not merge P2 or deploy a different branch without recording it.
- Build: `npm ci && npm run build`.
- Start: `npm run start -- --hostname 0.0.0.0`; Next.js consumes Render's `PORT`.
- Node pinned to `24.11.1`; `NODE_ENV=production`; telemetry disabled.
- Auto-deploy is off. No paid instances, disk, custom domain or media service.
- Temporary health check `/provisioning` proves page-serving only. It is visibly
  labeled as an infrastructure preview, not the final demo. It does not claim DB
  or AI health. Claude's `/api/health` is not implemented or overwritten by P3.
- All five required backend variable names are declared. Render generates
  `SESSION_SECRET` server-side; the remaining values use `sync: false`.

Render prompts for `sync: false` values during initial Blueprint creation. The
Gemma endpoint/model/key have not been selected in P3. Do not enter made-up values
to satisfy the form. For an initial placeholder service, omit unavailable Gemma
entries from the actual service setup, record their names as pending, and add real
provider settings securely in P5. If Atlas is still blocked, a placeholder can
build without `MONGODB_URI`; it must not be described as database-ready. The
candidate Blueprint is not currently ready for an unattended apply.

References: [Next.js on Render](https://render.com/docs/deploy-nextjs-app),
[Blueprint variables and generated values](https://render.com/docs/blueprint-spec).

## Resume sequence after access is confirmed

1. Re-discover Atlas organizations/projects and Render workspaces; reuse a verified
   ZEMNE resource if one already exists. Do not assume names imply ownership.
2. Confirm the owner/workspace and regions. Create a dedicated ZEMNE Atlas project
   and free cluster if eligible. Stop for billing, unavailable free capacity or
   an additional permission grant; never silently upgrade to paid infrastructure.
3. Create an application user scoped to that cluster with **`readWrite` on database
   `zemne` only**. No `atlasAdmin`, `dbAdminAnyDatabase` or all-database role.
   Store its generated password only in secure local/Render settings, never in
   tool output, screenshots, Git or this document. Leave models/indexes to Claude.
4. Create the free Render service with the reviewed source/build/start/placeholder
   settings. Record the actual workspace/service/deploy IDs, region and URL.
5. In that service's **Connect → Outbound** view, obtain its actual outbound CIDRs.
   Allowlist those ranges in Atlas. Never guess ranges or add `0.0.0.0/0` to get a
   green test. Any temporary developer `/32` needs explicit approval and cleanup.
   Region ranges are shared by Render services; DB authentication and cluster
   scope remain essential. See [Render outbound IP documentation](https://render.com/docs/outbound-ip-addresses).
6. Require TLS with certificate validation. Inspect the cluster's TLS settings
   when access permits. Save a `mongodb+srv` URI targeting `/zemne` in Render's
   secure `MONGODB_URI` setting and an ignored local environment only if needed.
7. Run the standalone probe from the hosting network, record only its sanitized
   result and confirm the app user's roles/scopes through Atlas. A local pass
   proves local reachability only; it does not prove Render-to-Atlas access.
8. Inspect actual Render build/deploy logs without copying secret values, then
   fetch the real `/provisioning` URL over HTTPS. Mark success only from these
   actual provider and network results. Keep all P4/P5 business routes untouched.

## Backend-only probe and Claude handoff

`scripts/infra/probe-mongodb.mjs` performs an authenticated ping and reads the
connection's effective roles. It writes no data and serves no HTTP endpoint.
It rejects a database other than `zemne` and unsafe TLS settings, forces certificate
validation, times out, and never prints raw driver errors or URI values.

Once Claude installs the application's MongoDB driver in P4, it can be run with:

```sh
node --env-file=.env.local scripts/infra/probe-mongodb.mjs
```

On a host with secure injected variables, omit `--env-file`. If the app driver is
not installed yet, it may instead be installed in the ignored tooling directory:

```sh
npm install --prefix .infra-tools --no-save --no-package-lock mongodb
node --env-file=.env.local scripts/infra/probe-mongodb.mjs
```

No driver was installed by P3 while access was blocked. Do not change application
dependency choices solely for this probe. Exit statuses: 0 ping + expected role;
1 authentication/connect failure; 2 missing/invalid config or driver; 3 role review
required. An unknown/custom role requires human/Atlas inspection, not automatic
permission broadening.

| Backend variable | Confirmed local | Confirmed Render | Handoff |
| --- | --- | --- | --- |
| `MONGODB_URI` | Absent | Not set by this run | Blocked until cluster/user/network setup |
| `SESSION_SECRET` | Absent | Not set by this run | Render-generated candidate; never put value in Git |
| `GEMMA_API_BASE_URL` | Absent | Not set by this run | Actual P5 inference provider required |
| `GEMMA_MODEL_ID` | Absent | Not set by this run | Actual P5 model required |
| `GEMMA_API_KEY` | Absent | Not set by this run | Optional, only if the actual provider requires it |

Claude must not interpret declared names as configured values. DB/network tests
and the P3 gate remain blocked. No provider/model choice, collection, index,
session implementation or API/AI business logic was added. Neutral original
portrait placeholders remain the media strategy; persistent uploads are not
approved or provisioned.

## Evidence and rollback

`docs/evidence/p3/render-signin-required.png` records the blank Render sign-in page.
Local build/test results and safe probe failures are recorded under P3 in the
tracker. Local validation is not Render build/deploy evidence.

The branch adds only the deployment candidate, placeholder, standalone probe,
ignored tooling path and handoff/evidence. No cloud mutation occurred, so there is
no cloud rollback to execute. Future deployments should retain the previous
Render deploy ID for rollback. Do not delete an Atlas project/cluster/user as a
rollback shortcut without checking ownership and obtaining deletion approval.
