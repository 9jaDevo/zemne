# Main consolidation — October 27, 2026

The owner requested that all authored application work be integrated into main
for submission preparation. Consolidation preserves commit ancestry rather than
squashing or copying files between ownership areas.

Included branch heads:

| Work | Source head |
| --- | --- |
| P1 contract | `a0c11e9` |
| P2 brand/UI | `0884b75` |
| P3 infrastructure | `a2f58c8` |
| P4 backend | `44fd57e` |
| P5 Gemma | `1795025` |
| P6 live integration + Codex QA polish | `360a458` |
| Garden of Light redesign | `d9aea99` (implementation `f8bcc32`) |
| Claude P7 backend fixes | `e916a47` |

Claude's P7 branch was merged unchanged with the redesign in `9bb6aa1`.
It fixes cold route import testing, expands bounded overload retries, and aligns
the weave job/client budgets under contract 1.2.1. This integration does not
invent a new backend implementation or claim that free-provider overload is solved.

Antigravity's report and four original JSON logs are retained as historical
evidence. Its original tracker edit and raw screenshots/scripts remain in a local
stash. Screenshot publication is excluded until private management links are
reviewed/redacted. See `docs/evidence/p7/README.md` for evidence limitations.

## Validation

Run standard commands on the consolidated tree: `npm run lint`,
`npm run typecheck`, `npm test`, `npm run build`. CI must pass its required
`verify` check before the PR merges. Exact final command/CI results and merge
reference are recorded in the tracker integration addendum and GitHub PR.

## Submission gates still open

- Deploy the consolidated main commit to Render and record its actual source SHA.
  Consolidating Git branches does not change Render's configured source branch
  or prove a deployment happened.
- Antigravity must execute `docs/SANCTUARY_RETEST.md` and the R2/R3 checks in
  `docs/P7_BACKEND_FIXES_HANDOFF.md`: fresh three-contribution flow, bounded real
  Gemma success/error, public approval isolation, source navigation and persistence.
- Physical iPhone/Android performance and browser/device accessibility checks.
- Owner-approved open-source LICENSE. Current project license is UNLICENSED;
  public visibility alone is not an open-source license grant.
- Owner-deferred Gemma key rotation and provider capacity decision remain as
  previously disclosed. Never put replacements in Git or chat.
- Judge evidence/article and actual submission are not completed by this merge.

No provider environment values, DB migrations, billing changes or deployment
actions are included. The current Render deployment remains the rollback point.
