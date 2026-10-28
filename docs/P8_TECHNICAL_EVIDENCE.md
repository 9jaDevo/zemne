# ZEMNE — P8 technical evidence and limits

Reviewed October 27–28, 2026 against the consolidated `main` source (`fc7c6b5`),
contract **1.2.1**, stored evaluations and the phase handoffs. This is a source
and evidence review, not a fresh production test or independent security audit.
New P8 deployment/walkthrough outcomes must be recorded separately by the integrator.

## Exact AI implementation

| Item | Implemented / observed |
| --- | --- |
| Model configured and reported in saved successful responses | `gemma-4-31b-it` |
| Provider | Google AI Studio through the Gemini API OpenAI-compatible interface |
| Nonsecret base URL | `https://generativelanguage.googleapis.com/v1beta/openai` |
| Actual client path | `POST /chat/completions` appended to that base |
| Request | One user message; temperature 0.3; up to 6,144 output tokens |
| Application code | `src/lib/ai/{gemma-client,prompt,weaver,grounding}.ts` |
| Output contract | `src/shared/api/weave.ts` |

Google's [official model card](https://huggingface.co/google/gemma-4-31B-it)
identifies Gemma 4 31B instruction-tuned weights under Apache-2.0. Google's
[release explanation](https://opensource.googleblog.com/2026/03/gemma-4-expanding-the-gemmaverse-with-apache-20.html)
also confirms Gemma 4's Apache-2.0 release. These sources were checked during P8.
The provider serves the model; ZEMNE does **not** self-host or fine-tune weights,
and does not call a GPT model through OpenAI merely because the interface is compatible.
The earlier evaluated `gemma-4-26b-a4b-it` is not the selected runtime model.

## From human tribute to traceable draft

1. The organizer starts `POST /api/organizer/memorials/:id/weave` using a scoped
   session. The handler queries only that memorial's **approved** tributes,
   limited to 40 tributes / 40,000 characters. No approved input returns
   `NO_APPROVED_TRIBUTES`; no configured provider returns `AI_UNAVAILABLE`.
2. Database IDs become per-request aliases `T1…Tn`. Structured contributor names
   and relationships are omitted. Memorial display metadata and tribute prose
   are still sent; this is not automatic anonymization of names inside prose.
3. Instructions surround JSON-escaped tribute data within a random request
   boundary. The prompt explicitly treats user text as untrusted data, requests
   1–5 paragraphs, and requires source aliases for every paragraph.
4. The client strips closed inline reasoning blocks and parses the answer as
   JSON. A schema validates shape and lengths. Unknown source IDs are removed
   and flagged; duplicates are deduplicated; uncited paragraphs are removed.
   Nothing usable left returns `AI_INVALID_OUTPUT`. One repair attempt is allowed.
5. Deterministic checks flag absent numbers, suspicious proper names and very low
   lexical overlap with cited sources. Model and validator flags remain visible
   to the organizer. These are heuristics, **not factual verification** or a
   guarantee against prompt injection or hallucination.
6. A validated result is stored as **draft**, never automatically published.
   The organizer reads sources, edits, acknowledges review and publishes.
   Publication/editing validates that citations still reference approved tributes
   belonging to the memorial. Public serialization exposes only published,
   still-cited paragraphs and approved source tributes. Rejecting a cited tribute
   unpublishes the affected remembrance.

The interface's source buttons open the actual approved tribute text. A valid
source ID establishes traceability; it does not establish the truth of the
underlying contribution or every generated sentence. Human editorial care remains essential.

## Background generation and safe failure

The request returns **202** with a job immediately. The client polls the same
weave path using GET; generation is not held inside one long HTTP response.
An atomic per-memorial job lock prevents duplicate live jobs. The current model
budget is 220 seconds; the job deadline is 230 seconds and the client wait cap
is 300 seconds. Upstream 429/500/502/503 may be retried up to three times with
3/8/15-second backoffs, only if at least 60 seconds of call budget would remain.

Failures surface explicit `AI_UNAVAILABLE`, `AI_TIMEOUT` or `AI_INVALID_OUTPUT`
with retry behavior. Production never substitutes fixture prose or fake success.
The worker runs in the application process, not a separate durable queue:
a restart can interrupt generation, and a stale running job is treated as timed
out after its deadline. Finished MongoDB records persist independently of Render's filesystem.

## Permission and privacy architecture

- No guest registration or social login. Guests use an unlisted, non-indexed
  invitation URL; anyone who possesses it can see approved public content.
  Unlisted is not equivalent to authenticated private access.
- Creation generates 32 cryptographically random bytes (256 bits) for organizer
  capability access. Only its SHA-256 hash is stored. The secret management link
  is revealed once, uses a URL fragment and is cleared by the frontend before
  exchange. Losing it has no automatic recovery flow in this MVP.
- Exchange establishes a 12-hour, HMAC-SHA256-authenticated cookie scoped to a
  memorial and token version. Production cookie: `__Host-zemne_org`, Secure,
  HttpOnly, SameSite=Strict, Path=/. Rotation increments the token version,
  invalidating prior links/sessions. Signing is integrity protection, not encryption.
- Server checks ownership on every organizer route. Anonymous requests return
  `UNAUTHENTICATED` (401). Memorial-addressed cross-scope access returns
  `FORBIDDEN` (403); another memorial's contribution item is hidden as
  `NOT_FOUND` (404).
- Writes require matching Origin and acceptable Sec-Fetch-Site; JSON bodies
  have a 16 KiB cap and runtime schemas. Fixed-window MongoDB rate limits,
  honeypots, duplicate checks and moderation hints reduce abuse. Raw IPs are
  replaced by keyed hashes. This is not comprehensive automated content moderation.
- Responses are built through allowlist serializers, never raw DB spreads.
  Pending/rejected content and token/hash/internal moderation metadata stay out
  of public responses. React renders contribution text as text, not raw HTML.
- API responses default to `no-store`; public reads use private revalidation
  behavior, and Next page headers specify private/no-store, no-referrer and
  noindex/nofollow. Secrets are backend-only and never `NEXT_PUBLIC_*` variables.

All submission identities, memories and portraits must be fictional. Google's
[unpaid-service terms](https://ai.google.dev/gemini-api/terms) state that input
and output can be used for product improvement and human review, and tell users
not to submit sensitive/confidential/personal information. They also impose
regional/usage conditions, including paid-service requirements for API clients
made available in the EEA, Switzerland or UK. A synthetic developer demonstration
does not establish suitability for real grieving families or unrestricted public deployment.
The application discloses the unpaid provider's data use. Open weights do not
make this particular hosted service offline or provider-private.

## MongoDB Atlas and persistence

The application uses the official Node MongoDB driver. Provisioning evidence
identifies Atlas project ZEMNE, cluster `zemne-mvp` in AWS US_EAST_1, and a
`zemne_app` user with only `readWrite` on `zemne`, restricted to that cluster.
Render Virginia outbound ranges were allowlisted rather than opening access
globally; the backend enforces validated TLS for remote MongoDB connections.
These are historical provisioning facts, not a fresh P8 connector audit.

Collections: `memorials`, `guestbook_entries`, `tributes`, `story_drafts` and
`rate_limits`. `$jsonSchema` validators are attached when collections are first
created. The least-privilege app user does not apply `collMod` to existing
collections; future schema changes need an explicit migration process.

Indexes enforce unique slugs/token hashes and one published story per memorial,
support memorial/status reads, and expire rate-limit windows. Optimistic story
versions prevent stale edits; transactions handle publication superseding and
moderation side effects. Local production testing needs a replica set because
these transactions are real. There is no portrait upload dependency; original
neutral assets are shipped in the repository, not written to Render's ephemeral disk.

## Actual tests and measured failures

Consolidation evidence (`docs/MAIN_INTEGRATION_HANDOFF.md`, PR #8) records standard
lint, typecheck, `npm test` and build passing on tree `6a516a5`, followed by green
CI for main merge `fc7c6b5`: **207 passed, nine opt-in live tests skipped**. The
ordinary suite includes contract/security/route integration and frontend tests;
MongoDB integration uses an actual local MongoDB replica set. A skipped live
provider test is not proof of current provider availability.

| Saved real-provider batch | Observed result | Interpretation |
| --- | --- | --- |
| `gemma-4-31b-it`, 16:16:14Z evaluation | 2 of 6 scenarios succeeded; 4 upstream 500/503 failures | Earlier bounded-retry behavior was not reliable enough |
| `gemma-4-31b-it`, 19:31:53Z evaluation after P7 changes | 4 of 6 succeeded; 2 ended safely with `AI_UNAVAILABLE`/500 after 3 retries | Mitigated, not fixed |
| Successful wall time in that latest saved batch, n=4 | 37.297–216.930 s; median 109.885 s | Includes failed calls/backoff; not just successful-call latency |
| `gemma-4-26b-a4b-it`, earlier exploratory batch | 0 of 6 usable successes: 5 timeouts, 1 upstream 500 | Not selected as the runtime model |

Files are under `docs/evidence/p5/`. The same six scenario names exercise three
persona runs, prompt injection, sparse input and contradictory accounts, but
the batches ran at different times without randomized provider conditions.
The before/after counts are exploratory evidence, not a controlled causal
benchmark or production success-rate guarantee. The older aggregate in contract
§6.3 predates its added P7 batch and should not be presented as an aggregate of
all current saved runs. The successful-call `latency_ms` excludes failed upstream
attempts; use `wall_ms` when explaining user waiting time.

Historical P6 hosted evidence records creation, three approved synthetic
tributes, genuine Gemma generation, source inspection, edit/publish/unpublish
and persistence over redeploys on source `85a4f6a`. It is not evidence that the
later Garden of Light/P7 revision was deployed or independently retested.

The historical QA report's PASS also conflicts with its raw weave timeout and a
cross-memorial test stopped by create-rate limiting. Keep both failures visible.
`docs/P7_BACKEND_FIXES_HANDOFF.md` explains these gaps and exact live retests.
The cold route-import issue was fixed by preloading modules in a `beforeAll`
hook with 60 seconds of startup allowance; the standard integrated suite then passed.

## Open innovation and attribution

ZEMNE's owner-approved application license is MIT; model weights have their own
Apache-2.0 license and hosted inference has separate service terms. Open Gemma
weights make the synthesis component inspectable/rehostable in principle, while
this delivered demo uses Google's hosted endpoint and has not validated an
alternative local provider end to end. React, Next.js, R3F/Three.js, Tailwind,
TypeScript and the published source make the room and review workflow reproducible.
MongoDB Atlas and Render are managed services; using them is not a claim that
their hosted platforms are open-source software.

Dependencies retain their upstream licenses. The original Blender room uses
CC0 Poly Haven maps/HDR with checksummed provenance; Newsreader and DM Sans
include OFL notices. There are no copied architectural models or scraped obituaries.
No Sentry, .tech domain, avatars, voice cloning, livestreaming or additional
partner integration is implemented. Supported category claims must still be
backed by actual deployed evidence for Gemma, Render and MongoDB Atlas.
