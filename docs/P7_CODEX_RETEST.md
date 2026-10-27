# Codex P7 UI patch and Antigravity retest handoff

Date: October 27, 2026. Patch: `37ff9aa1d1414150b9556e3fb4fe8921dbe80569`, pushed to `codex/p6-live-integration` (existing PR #6).

## Findings and ownership

Read QA_REPORT, MASTER BLUEPRINT and PHASE_TRACKER. Report lists no P0/P1 or medium defects. This patch addresses only the two assigned Codex frontend findings:

- **BUG-P7-01:** elapsed seconds while weaving, calculated from the P5 job's `started_at` when resuming. After 45 seconds, an honest reassurance message replaces the initial wait text. No invented stages, percentages or completion estimate. Timer is `aria-live=off`, so screen readers do not announce every tick. Interval is cleared when progress unmounts. Existing disabled-button, failure/retry and publication behavior retained.
- **BUG-P7-02:** tribute destination initially lists approved tributes when available, with a Write a tribute action. Empty memorials retain direct compose. Guestbook stays list-first.
- **BUG-P7-03:** Claude-owned cold Windows dynamic import timeout; not changed. The full suite passed this run, which does not establish that the reported cold-start timeout was fixed.

Changed application files: `src/components/demo/organizer.tsx`, `src/components/demo/guest-panels.tsx`, new `src/components/ui/weave-progress.tsx`. New regression suite: `tests/frontend/qa-polish.test.ts`. No backend/DB/auth/token security/AI/API/shared contract/backend tests or Vitest configuration changed. Token/secret handling is untouched.

Antigravity's existing uncommitted QA_REPORT, P7 evidence, scripts/qa and tracker changes were not edited or included in this commit. Do not publish credential-bearing claim screenshots without the auditor first checking/redacting them.

## Actual validation

- New frontend regression suite: **6/6 passed**, actual React server rendering against typed fixture adapter. Covers approved-list initial markup, empty compose, unchanged guestbook behavior, resumed 90-second progress, 44/45-second reassurance boundary, quiet timer accessibility and invalid/future timestamp clamping.
- `npm run lint`: passed, zero warnings.
- `npm run typecheck`: passed.
- `npm test`: **13 files, 199 passed, 9 skipped** (opt-in live model tests).
- `npm run build`: passed (Next.js 16.4.3 production compilation).
- Linux CI: https://github.com/9jaDevo/zemne/actions/runs/40566840338 and https://github.com/9jaDevo/zemne/actions/runs/40566834403 both passed for 37ff9aa.
- Scoped commit/push verified. Existing Antigravity work remains uncommitted, intentionally preserved.

**Limits:** regression tests verify initial rendered states and elapsed-time calculations; they are not a browser interaction or live timer-interval test. Browser validation was attempted: new dashboard tabs could not attach, existing Render input/CDP commands timed out, and the local preview browser did not navigate successfully. No deployment action completed. Last verified live source remains `85a4f6af3fc6431b647eb28b4e083ad4def4d107`, not this patch. Do not mark the live bugs independently retested or the new UI deployed on the basis of this patch.

## Exact Antigravity retest steps

1. Deploy commit **37ff9aa** from the existing `codex/p6-live-integration` branch to Render service `zemne-preview` (`srv-dbg8g40m7kps73bnh6e0`), using Manual Deploy after authorized dashboard/browser access works. Verify successful source commit and `/api/health`; keep secure environment values unchanged. No paid upgrade or new resource is needed.
2. Open the synthetic public memorial `https://zemne-preview.onrender.com/m/mira-vale-synthetic-p6-rehearsal-kkr2i9`. Select the Tribute destination using the marker or navigation. Expect approved tribute cards and **Write a tribute** immediately, with no composition fields. Click Write a tribute, verify form/consent, then Back to shared memories to return to the list. Repeat at 375/390px and desktop with keyboard focus.
3. Create a fresh synthetic memorial and securely save its private link outside evidence. Before any approved tribute exists, open Tribute and expect the direct compose form. Keep the guestbook's existing list-first behavior unchanged. Never screenshot management tokens.
4. In an authorized organizer session with approved synthetic tributes, start a real weave. Expect elapsed seconds to increment approximately once per second and duplicate generation to remain disabled. Before 45 seconds, see the 1–3 minute draft message; at 45 seconds, see **Still waiting for Gemma** with no fake percentage or stage. If the provider completes/fails sooner, rerun this threshold check using a test-controlled slow adapter in a development/test environment, never a fake production API.
5. Reload while a job is actually running. Expect elapsed time based on its original `started_at`, not reset to zero. Confirm progress stops/disappears after success or failure, errors retain explicit retry, and no auto-publication occurs. Trigger another weave only within the documented provider and rate limits. Verify screen readers do not announce each timer tick and the reassurance text changes once.
6. Independently run `npx vitest run tests/frontend/qa-polish.test.ts`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Recheck the Claude timeout separately on a cold Windows run without broadening this patch into backend changes.
7. Record actual browser screenshots, source commit, deployment ID, timer/reload observations and verdict in the auditor-owned QA report. Reconcile environment metadata there: the current build reports Next.js 16.4.3 and the deployment manifest specifies Virginia; the report currently names different versions/region. This handoff does not rewrite auditor evidence or certify its broader claims.

Provider-key rotation remains the previously disclosed owner-deferred action; this UI patch neither rotates nor exposes credentials. No P8/submission work performed.
