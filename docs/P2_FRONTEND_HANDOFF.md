# P2 frontend handoff

## Local preview

```sh
npm ci
npm run dev
```

Visit `/` for the entry page, `/demo` for the fictional memorial and `/identity` for
the identity comparison and actual-size icons. `/demo?view=create` opens creation;
`/demo?mode=2d` starts in the low-power view. The default dev server is port 3000;
evidence was captured at port 3200. Browser runners use that explicit local port.

The P2 demo is **disabled when NODE_ENV is production**. `npm run build && npm start`
serves a truthful unavailable page at `/demo`, never mock production memorials. No
API route, database, authorization service or AI provider is implemented by P2.
The homepage's architectural scene is a visual preview and labels its fictional
memorial. P3/P6 must not present this build as the completed product.

## Ownership and component boundaries

| File | Purpose |
| --- | --- |
| `src/components/landing.tsx` | Entry page and real 3D architectural preview |
| `src/3d/hall-scene.tsx` | Demand-rendered R3F hall, four camera destinations, markers, reduced motion and context-loss boundary |
| `src/components/demo/demo-experience.tsx` | Local demo shell, client instance, page/destination navigation |
| `src/components/demo/create-memorial.tsx` | Creation and save-private-link acknowledgment |
| `src/components/demo/guest-panels.tsx` | Submission receipts, approved lists, published wall and source dialog |
| `src/components/demo/organizer.tsx` | Pending/approved/rejected queues, mock weave, draft editing and publication |
| `src/components/demo/use-action.ts` | In-flight lock and typed error presentation |
| `src/components/ui/*` | Icons, labeled fields and reduced-motion preference |

Claude-owned `src/shared`, `src/server`, `src/lib`, `src/app/api`, backend tests and
`docs/API_CONTRACT.md` are consumed without modification. P1 PR #1 was merged after
its CI and all 83 local tests passed, before the P2 feature branch was created.

## Integration contract

Screens receive `ZemneApiClient`; creation, submissions, moderation, weaving and story
updates call that interface directly. `DemoExperience` alone constructs P1's
`createMockClient({latencyMs:240,weaveLatencyMs:1200})`. All data remains in that
instance until reload. It is not shared across tabs, sessions or devices.

In P6, move the screen shell out of the development-only wrapper, inject
`createHttpClient()` and add real `/m/[slug]` / `/manage/[id]` route shells. The UI
panels themselves already accept typed data/client props. The current demo links
are explicitly `/demo?...` links; they must not be reused as production invitations.

For the real management route, consume `parseManageFragment`, immediately clear
the fragment, exchange the token, forget it, then read the organizer session. The
demo initializes the same way for its **fake** link only. No organizer credential
is stored in localStorage/sessionStorage/cookies by this frontend. The create
handoff temporarily holds the response to reveal the private link, then drops it
when the saved-link acknowledgment is accepted. Production secure cookies and
authorization remain Claude's P4 responsibility.

- Forms use P1 field names, caps, positive consent and hidden honeypots. P1's client
  supplies validation errors; fields receive `aria-invalid` and described error text.
- Errors are rendered from `ZemneApiError`, including field details and retry-after
  guidance; failed calls never produce a success receipt. A ref lock prevents a
  double click from issuing concurrent actions.
- Guest panels render only `PublicMemorialResponse`, never an organizer projection.
  Pending success messages explicitly explain moderation.
- Source chips resolve by exact `source_tribute_ids` into the public response's
  approved tribute list. The native dialog traps focus and supports Escape.
- The organizer can inspect and replace a paragraph's approved citations, edit
  text/title and save. Publication is disabled while edits are unsaved. Every PATCH
  includes the current story version. Rejected-source side effects explain automatic
  unpublication. Nothing publishes from a weave action.
- The mock weave is visibly labeled and identified by P1's model/provider labels.
  No claim of real Gemma use is made. The test drawer can queue an API-unavailable
  error for the next call; it never changes backend behavior.
- The mock organizer button deliberately opens a sample organizer preview. It is
  not an authentication mechanism and is never rendered by the production gate.

## 3D and accessibility

The same `Destination` union (`overview | guestbook | tribute | wall`) controls
camera and panels. Object groups and numbered sprites are raycast-clickable; the
four labeled HTML buttons are the equivalent keyboard/touch navigation. The scene
is dynamically imported, DPR capped at 1.5, shadows limited to one 1024px map and
`frameloop="demand"` stops drawing when camera transitions settle. No autoplay
audio, physics, particles or continuous motion. A low-power 2D switch unmounts
the Canvas. WebGL failure/context loss preserves every HTML destination action.

Reduced-motion preference snaps camera changes and disables animated scrolling.
On narrow screens a destination selection focuses the panel and scrolls it into
view. Form typing does not control the camera. System fonts and original SVG
artwork avoid third-party requests on the organizer screen.

## Evidence and limits

See `docs/evidence/p2/qa-results.json`, browser screenshots and the P2 tracker.
`scripts/p2-qa.cjs` exercises the actual UI against the P1 in-memory client. It uses
workspace Playwright via `NODE_PATH`; it is a local preview runner, not the regular
CI test suite. `scripts/p2-preview.cjs` is the smaller screenshot runner.

Physical iOS/Android, independent Antigravity QA, live API/auth, real Gemma, MongoDB
persistence, hosted performance and owner visual approval are later acceptance
gates. A browser mock test is not backend/privacy/security proof. No P3 resources
were provisioned in this phase.
