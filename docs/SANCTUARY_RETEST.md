# Antigravity — sanctuary redesign retest

Candidate branch: `codex/sanctuary-redesign`. This is a new visual candidate after the prior P7 audit. Prior P7 acceptance of `85a4f6a` does not accept this revision. The initial redesign commit is identified in Git history and tracker.

## Commands

```powershell
npm ci
npm run lint
npm run typecheck
npm test -- --maxWorkers=1 --testTimeout=60000 --hookTimeout=120000
npm run build
npm run dev -- --hostname 127.0.0.1 --port 3200
```

The longer timeouts are command-level diagnostics for the documented Claude-owned cold import/startup issue; no backend tests or config were changed. Recheck the ordinary `npm test` command on an idle machine/CI separately. Nine live-provider tests require explicit opt-in; skipped live tests are not acceptance evidence.

## Visual and interaction checks

1. Open `/` at 375×812, 390×844, tablet and desktop. Check full page, no horizontal scroll at 200% zoom, headline wrapping, header and both hero actions. Compare historical before images with actual after captures in `docs/evidence/redesign/`.
2. Open `/demo` **in development only**. This route clearly labels fixture content and never calls real AI. Verify the enclosed roof, glazing, stone/wood maps, framed relief, seating and flowers. Network must load `sanctuary-mobile.glb` and local HDR, without external textures or loader errors.
3. On desktop click the physical open guestbook, tribute lectern and framed memory wall. Each must move the camera and open its complete panel. The labeled navigation must do the same using keyboard and touch.
4. At 390px select Tribute → Write a tribute. Submit invented details with consent. Expect pending receipt, focused heading and no new public tribute. Return to tributes and verify it remains absent. Repeat guestbook. Return to sanctuary must restore the room position rather than leaving the visitor at the bottom of the page.
5. Open Memory wall → a source name. Verify approved source text and name, modal focus, Escape and close action. Fixture story/source labeling must remain explicit.
6. Toggle 2D and repeat guestbook, tribute and source actions. Test missing-model load and forced WebGL context loss separately; DOM actions must remain available. Enable OS reduced motion and verify camera snaps and no hover animation.
7. Open `/create`; review field/error/consent states and one-time claim reveal using invented details on a configured backend. Do not capture the private management fragment. Recheck moderation, weave progress/error retry, editing, publication and persistence with three guest tributes on the **deployed candidate**, using existing P6 acceptance steps. Pending/rejected content must remain invisible publicly.
8. On the deployed candidate, `/experience?destination=wall` must use the real API and genuine published P6 showcase; check all three destination links from landing. A failed API must show an error rather than fixture replacement. `/demo` remains disabled in production.
9. Verify favicon, metadata, no credentials in bundle/network, and no caching of private organizer responses. On a real iPhone and a mid-range Android measure cold load, camera smoothness, memory/context stability, touch hit targets and GPU frame time. Desktop viewport screenshots alone do not pass this gate.

## Rollback and boundaries

No deployment, provider configuration or database migration is part of this patch. Keep the current Render revision until the candidate is reviewed and deployment is authorized. Rollback is the previously selected Render deployment/source branch; no DB rollback is needed. Claude-owned server, API, DB, security and AI files are unchanged. Preserve Antigravity's uncommitted report/evidence separately.

Standard final npm test result: 203 passed, nine live tests skipped, one Claude-owned health-route import timeout at 5 seconds (BUG-P7-03). The longer-timeout diagnostic run passed 204; the default-command issue remains open.
