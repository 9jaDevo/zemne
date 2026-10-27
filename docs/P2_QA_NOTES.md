# P2 frontend verification — October 27, 2026

This is Codex's implementation verification, not Antigravity's independent P7 audit.

## Results

| Check | Actual result |
| --- | --- |
| `npm run lint` | Pass, zero warnings |
| `npm run typecheck` | Pass |
| `npm test` | Pass, 7 files / 83 existing contract and guardrail tests |
| `npm run build` | Pass; `/`, `/demo`, `/identity` and not-found route prerendered |
| Local production GET `/demo` | 200, truthful unavailable page; no fictional memorial rendered; `Referrer-Policy: no-referrer` |
| `scripts/p2-qa.cjs` | 16 browser checks passed; zero page errors; zero `/api/*` requests |
| Browser | Chromium 151.0.7922.34, headless SwiftShader, real WebGL 2.0 |
| Horizontal overflow | None at 375, 390, 768, 1440 CSS px on the hall |
| `scripts/p2-a11y.cjs` | 16 axe checks: 8 route/states × 390/1440px; zero WCAG 2 A/AA + 2.1 AA violations reported |
| Asset validation | SVGs parse via Sharp; PNG dimensions 16/32/180/192/512 exact; ICO header verified |

The full records are `docs/evidence/p2/qa-results.json` and `a11y-results.json`.
Linux CI also passed at tooling commit `9cac185`: install, lint, typecheck, test and
build, https://github.com/9jaDevo/zemne/actions/runs/40488122360. The same checks run
on Codex preview-branch pushes as well as pull requests; no deployment action exists.
An automated accessibility pass does not certify accessibility or replace manual
assistive-technology testing.

## Browser scenarios actually exercised

1. Raycast click on the actual guestbook marker in the WebGL scene.
2. Raycast click on the actual tribute marker.
3. Raycast click on the actual memory-wall marker.
4. Guestbook submission receives pending receipt; message absent from public list.
5. Tribute submission receives pending receipt; tribute absent from public list.
6. Organizer sees and approves both pending test contributions.
7. Demo weave creates a labeled draft. Unsaved edits block publication; saving
   allows explicit publication with current version/citations.
8. Guest sees published edits. Source chip opens the exact approved source text;
   native source dialog closes with Escape.
9. Unpublish removes the remembrance from the guest memory wall.
10. Queued AI-unavailable error shows a failure; explicit retry succeeds in the mock.
11. Create rejects reversed life years, marks the invalid field, then shows the
    saved-private-link acknowledgment. Clipboard copy was tested on localhost.
12. New memorial's empty guestbook, tribute form and unpublished wall all work in 2D.
13. Hall has no horizontal overflow at the four tested widths.
14. Reduced-motion media preference and keyboard Enter activate the destination.
15. Forced `WEBGL_lose_context` retains usable tribute forms and destination buttons.
16. A browser with WebGL disabled submits a guestbook message through the fallback.

The source-linked story in these tests is a hand-written fixture. No Gemma call,
real organizer authorization, persistent database or cross-session acceptance was
tested or claimed.

## Corrections discovered during verification

- Initial automated error-state checks queued a failure before organizer loading
  finished, and initially matched Next.js's empty route-announcement alert. The
  runner now waits for the loaded action/visible form error. Those were automation
  timing errors, not successful application results.
- Axe found an unsupported `aria-label` on the Canvas wrapper and low-contrast
  supporting copy, pending badges and review flags. Added the appropriate image
  role, darkened text, strengthened input boundaries and retested. Final expanded
  axe results contain no reported violations in those 16 audited states.
- Numbered in-scene markers replaced weak brass rings after the first visual review.
- Fixed the private acknowledgment Boolean typing and stabilized the scene-ready
  callback during compiler/lint review.

## Visual evidence

- `identity-desktop.png`, `identity-mobile-390.png`: three concepts, selected
  lockup on light/dark backgrounds, actual 16/32/180px icons.
- `landing-desktop.png`, `landing-mobile-390.png`: entry composition and 3D preview.
- `hall-desktop.png`, `hall-mobile-375.png`, `hall-mobile-390.png`,
  `hall-tablet-768.png`: responsive hall and destination navigation.
- `guestbook-mobile-390.png`, `tribute-mobile-390.png`, `wall-mobile-390.png`:
  guest interactions; `guestbook-receipt-desktop.png`: pending success receipt.
- `organizer-desktop.png`, `organizer-mobile-390.png`, `ai-error-desktop.png`:
  moderation, editor and explicit error state.
- `create-mobile-390.png`, `claim-desktop.png`: create and fake-link handoff.
- `source-dialog-desktop.png`: exact approved source, shown as escaped text.
- `reduced-motion-mobile.png`, `context-loss-mobile.png`,
  `webgl-disabled-mobile.png`: alternate device/failure states.
- `hall-navigation.webm`: actual browser recording of the four camera destinations.

All screenshots contain invented test content. The claim screenshot contains a
mock-only token with no real credential authority. No real private link was captured.

## Remaining acceptance gates

Owner visual approval is pending. Physical iPhone/Android, Safari/Firefox, screen
reader testing, hosted performance, independent P7 QA and the real P4–P6
organizer/guest/AI/publish lifecycle remain open. No Lighthouse score, FPS,
device benchmark, cloud deployment or production-readiness claim is made.
