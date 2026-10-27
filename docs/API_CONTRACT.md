# ZEMNE — API Contract

**Contract version:** `1.2.1` (P7 fixes) · **Owner:** Claude (backend) · **Consumers:** Codex (frontend), Antigravity (QA)
**Authority:** `01_ZEMNE_MASTER_BLUEPRINT.md` §5–§8. This document turns that brief into exact routes, fields and rules.

**Source of truth for types:** `src/shared/api/` (Zod schemas + TypeScript types). This document and those schemas must agree. `tests/backend/docs-examples.test.ts` checks every JSON example tagged `<!-- schema: X -->` below against schema `X`.

> **Status (P5):** every route in §5 is implemented in `src/app/api` and backed by MongoDB. Memory Weaver calls a real Gemma model, measured in §6.3. §10 lists endpoint readiness and responses captured from the real handlers.
>
> **1.2.1 changes (P7):** no API shape changes. The weave job budget rose from 170 s to 220 s and the job deadline from 180 s to 230 s. Upstream overload is retried up to 3 times (3 s / 8 s / 15 s backoff) instead of once. The HTTP client waits up to 300 s instead of 240 s. These respond to the production QA weave that produced no draft within 240 s.
>
> **1.2.0 changes:** weave is now a **background job**. `POST …/weave` returns `202` with a job instead of `201` with a story, and the new `GET …/weave` reports the job (§5.13). `ZemneApiClient.weaveStory()` keeps its signature by polling, so existing UI code is unaffected. New client method `getWeaveStatus()`.
>
> **1.1.0 changes:** new error code `FORBIDDEN` (403) for a valid session used on another memorial's memorial-addressed routes (§2.4). The organizer view caps each contribution list at 500. Unsupported HTTP methods get the framework's empty-body `405` (§7). Nothing was renamed or removed.

---

## 1. Conventions

| Topic | Rule |
|---|---|
| Base path | Same origin as the web app. All routes start with `/api/`. |
| Bodies | `application/json; charset=utf-8` for every request with a body and every response with a body. Writes without `Content-Type: application/json` get `415 UNSUPPORTED_MEDIA_TYPE`. |
| Body size | Max **16 KiB** per request (`413 PAYLOAD_TOO_LARGE`). |
| IDs | MongoDB ObjectId as 24 lowercase hex chars (e.g. `65d0000000000000000000b1`). Opaque to the client. |
| Slugs | Server-generated, `^[a-z0-9]+(-[a-z0-9]+)*$`, 3–80 chars: a name part plus a random suffix (`elowen-marsh-k7q2xm`). The suffix makes guest links hard to guess. Clients never choose slugs. |
| Timestamps | ISO-8601 UTC with `Z`, e.g. `2026-10-27T10:05:00.000Z`. |
| Nulls | Optional output fields are present with `null`, never omitted. |
| Unknown fields | Requests: **rejected** (`400 VALIDATION_FAILED`), so a client can't inject `status`, `source_tribute_ids` on create, etc. Responses: never contain fields beyond this contract. |
| Text | All user text is **plain text**. The server trims it, normalizes to NFC, unifies newlines, strips control/zero-width/bidi-override characters and collapses runs of blank lines. It is stored and returned as plain text, never HTML. **The UI must render it as text** (React default escaping), never via `dangerouslySetInnerHTML`, Markdown or linkification. |
| Request id | Every response has an `X-Request-Id` header; errors repeat it as `error.request_id`. |
| Caching | Organizer routes and `POST /api/memorials`: `Cache-Control: no-store`. Public read: `Cache-Control: private, no-cache`. |
| Indexing | Every `/api/*` response sends `X-Robots-Tag: noindex, nofollow`. Pages `/m/*` and `/manage/*` must set `robots: { index: false, follow: false }` (Codex). |

### Length limits (`LIMITS` in `schemas.ts`)

| Field | Min–max chars |
|---|---|
| memorial `name` | 1–80 |
| memorial `description` | 1–500 |
| `display_name`, `contributor_name` | 1–60 |
| guestbook `message` | 1–500 |
| tribute `relationship` (optional) | 0–60 (blank → `null`) |
| tribute `content` | 10–2000 |
| story `title` | 1–120 |
| story paragraph `text` | 1–1200, 1–8 paragraphs, 1–20 sources each |
| years | 1800 – current year; `death_year ≥ birth_year` |

---

## 2. Roles and access (no login)

| Role | How they get access | Can do |
|---|---|---|
| **Guest** | The guest link `/m/<slug>` | Read public-safe memorial data; submit guestbook entries and tributes (always created `pending`). |
| **Organizer** | The private link `/manage/<memorial_id>#key=<token>`, exchanged for a session cookie | Everything on **their one memorial**: view all contributions, moderate, weave, edit, publish/unpublish, rotate the link. |

There are no accounts. A lost private link **cannot be recovered** in the MVP. The create screen must say so plainly and ask the organizer to confirm they saved it.

### 2.1 Organizer token

- Format: `zmn_ot_` followed by 43 base64url chars (32 bytes from a CSPRNG = 256 bits). Regex: `^zmn_ot_[A-Za-z0-9_-]{43}$`. The prefix makes leaked tokens easy to spot in secret scanners and logs.
- The server stores only `owner_token_hash = SHA-256(token)` as hex, plus an `owner_token_version` integer. A plain SHA-256 is enough because the token is high-entropy; a slow KDF adds nothing here. Comparison is constant-time.
- The raw token is returned **once**, in the create (and rotate) response. It never appears in the DB, logs, analytics, error messages, public pages or the repository.

### 2.2 Fragment delivery and session exchange

```
Organizer browser                                   ZEMNE server
──────────────────                                  ────────────
POST /api/memorials  ───────────────────────────▶  create memorial, token, hash
                     ◀───────────────────────────  201 { manage_path: "/manage/<id>#key=<token>", ... }
                                                     + Set-Cookie (organizer session for this memorial)
UI shows "SAVE THIS PRIVATE LINK" (absolute URL = location.origin + manage_path) + acknowledgment checkbox

…later, on any device…
open https://<host>/manage/<id>#key=<token>
  (the fragment is never sent to the server, never in Referer, never in access logs)
JS: token = parseManageFragment(location.hash)
JS: history.replaceState(null, "", location.pathname)       ← strip the secret from the address bar now
POST /api/organizer/session {memorial_id, token}  ──────▶  hash + constant-time compare + version check
                     ◀───────────────────────────  200 { session } + Set-Cookie
JS: drop the token from memory; never store it in state, localStorage or analytics
```

The `/manage/*` page should also send `Referrer-Policy: no-referrer` and load no third-party scripts.

### 2.3 Session cookie

```
Set-Cookie: __Host-zemne_org=<value>; Path=/; Max-Age=43200; HttpOnly; Secure; SameSite=Strict
```

| Property | Value | Why |
|---|---|---|
| Name | `__Host-zemne_org` in production. `zemne_org` when `NODE_ENV !== "production"` (plain-http dev). | `__Host-` forces Secure, `Path=/` and no `Domain`, so subdomains can't set or read it. |
| `HttpOnly` | yes | Page JavaScript (and XSS) can't read it. The UI learns session state from `GET /api/organizer/session`. |
| `Secure` | yes (production) | HTTPS only. |
| `SameSite` | `Strict` | Not sent on cross-site requests. This is the first CSRF layer. |
| Lifetime | **12 h absolute** (`Max-Age=43200`), no sliding renewal | To continue after it expires, the organizer opens the private link again. |
| Scope | One memorial per cookie. Exchanging a link for another memorial replaces it. | Simple per-memorial authorization. |

**Cookie value (server-internal, P4):** a stateless signed value `v1.<b64url(payload)>.<b64url(HMAC-SHA256(SESSION_SECRET, "v1."+payload))>`, where payload is `{"mid":"<memorial_id>","tv":<owner_token_version>,"iat":<unix>,"exp":<unix>}`. Every organizer request checks the signature, `exp`, and that `tv` equals the memorial's current `owner_token_version`.

**Revocation:** `POST …/rotate-token` increments `owner_token_version`. That invalidates the old link and every existing session at once, and issues a fresh link and cookie. `DELETE /api/organizer/session` clears the cookie on this browser only. Because the cookie is stateless, a copied cookie stays valid until it expires or the link is rotated. Rotation is the kill switch.

### 2.4 Per-memorial authorization

Every organizer route resolves the target memorial (directly, or through the entry/tribute/story's `memorial_id`) and requires it to equal the session's `mid`.

- No cookie, bad signature, expired, or stale `tv` → `401 UNAUTHENTICATED`.
- A valid session for a **different** memorial on a route addressed by memorial id (`GET /api/organizer/memorials/:id`, `…/weave`, `…/rotate-token`) → `403 FORBIDDEN`.
- An **item** (guestbook entry, tribute, story) that belongs to another memorial → `404 NOT_FOUND`, the same as a missing item. Item ids are never confirmed to exist for non-owners.
- A wrong token and an unknown `memorial_id` on `POST /api/organizer/session` both return `401 INVALID_ORGANIZER_TOKEN`.

---

## 3. Request security

### 3.1 CSRF / origin checks (all non-GET routes, guest and organizer)

1. `Content-Type` must be `application/json`. Cross-site HTML forms can't send that without a CORS preflight, and the API grants no CORS.
2. The `Origin` header must be present and its host must equal the request host. Use `X-Forwarded-Host` when it's set by Render's proxy, otherwise `Host`. Missing or mismatched origin → `403 ORIGIN_REJECTED`.
3. If `Sec-Fetch-Site` is present it must be `same-origin` (or `none`), otherwise → `403 ORIGIN_REJECTED`.
4. The organizer cookie is `SameSite=Strict` (§2.3).
5. No `Access-Control-Allow-*` headers are ever sent.

Writes with an empty body still send `{}` with JSON content-type: weave, rotate. `DELETE /api/organizer/session` has no body, so it's checked by rules 2–3 only.

### 3.2 Rate limits

Counters are fixed-window and keyed by `HMAC-SHA256(SESSION_SECRET, client_ip)`, truncated. **Raw IPs are never stored.** P4 stores them in a MongoDB `rate_limits` collection with a TTL index, so limits survive restarts and multiple instances. Client IP is taken from `CF-Connecting-IP` if present. Otherwise it is the **right-most** `X-Forwarded-For` hop, the one appended by the nearest proxy; left-most hops are client-spoofable. This header behaviour still has to be confirmed on the deployed Render service (tracker P4 open item). The per-memorial daily caps bound abuse either way.

| Route | Limit |
|---|---|
| `POST /api/memorials` | 5 / hour / IP |
| `POST /api/memorials/:slug/guestbook` | 5 / 10 min / IP / memorial, and 300 / day / memorial |
| `POST /api/memorials/:slug/tributes` | 3 / 10 min / IP / memorial, and 150 / day / memorial |
| `POST /api/organizer/session` | 10 / 15 min / IP, and 30 / 15 min / memorial |
| `POST /api/organizer/memorials/:id/weave` | 6 / hour / memorial, **1 in flight** (`409 WEAVE_IN_PROGRESS`) |
| `POST …/rotate-token` | 5 / hour / memorial |
| Other organizer routes | 120 / 10 min / session |
| `GET` public read | 120 / min / IP |

Exceeded → `429 RATE_LIMITED`, with a `Retry-After: <seconds>` header and `error.retry_after_seconds`.

### 3.3 Abuse controls and moderation

- **Moderation is mandatory.** Every guestbook entry and tribute is created `pending`. Nothing is public until the organizer approves it, and no heuristic ever auto-approves.
- **Consent:** guest submissions require `consent: true`, meaning the contributor agrees their words may be shown publicly once approved. Memorial creation requires `privacy_acknowledged: true`, meaning the organizer accepts that anyone with the guest link sees approved content.
- **Honeypot:** forms include a visually hidden `website` input (`tabindex="-1"`, `autocomplete="off"`, `aria-hidden`). If it's non-empty, the server returns the normal success response and stores nothing.
- **`moderation_hints`** (organizer-only): `contains_link`, `possible_profanity`, `possible_personal_data`, `possible_instruction_text`, `duplicate_submission`. These are advisory badges. They never change status by themselves.
- **Log hygiene:** never log request bodies, tokens, cookies or full IPs. Log the route, status, request id and timing.

### 3.4 Public-safe serialization

Public responses are built by **allowlist** serializers, never by spreading DB documents. Public response schemas are strict, so a leaked key fails the contract tests.

| Data | Public read | Organizer view |
|---|---|---|
| memorial `slug, name, birth_year, death_year, description, portrait, created_at` | ✅ | ✅ (+ `id`, `guest_path`, `visibility`, `updated_at`) |
| `owner_token_hash`, `owner_token_version`, raw token | ❌ never | ❌ never (the raw token appears only in create/rotate responses) |
| guestbook / tributes with `status: approved` | ✅ (no `status`, hints or moderation times) | ✅ |
| `pending` / `rejected` contributions | ❌ never | ✅ |
| `consent`, `moderation_hints`, `moderated_at`, IP hashes | ❌ | hints/moderated_at ✅, consent and IP ❌ |
| story: published one only, `id, title, paragraphs, edited_by_organizer, ai, published_at` | ✅ | ✅ all drafts + `flags`, `version`, `input_tribute_ids` |
| weave `flags` | ❌ | ✅ |

**Invariant:** every `source_tribute_id` in the public story refers to a tribute present in the same response's `tributes` array, so it is approved. `PublicMemorialResponseSchema` enforces this. As a second layer, the server serializer drops any citation to a tribute that isn't publicly visible and omits a paragraph left uncited.

### 3.5 Safe rendering (frontend obligations)

The API escapes nothing and returns user text exactly as stored. It is plain text that has been normalized but not HTML-encoded. For example, `<script>alert(1)</script>` comes back as that literal string, and the tests check this. Safety therefore depends on how the UI renders it:

1. Render user text and AI text only as React text children (`{entry.message}`). These escape automatically.
2. Never pass API strings to `dangerouslySetInnerHTML`, `innerHTML`, Markdown or HTML renderers, `eval`, `href` or `src`. Never auto-link URLs.
3. Preserve line breaks with CSS (`white-space: pre-line`), not by inserting `<br>`.
4. Build links only from server-provided relative paths (`guest_path`, `manage_path`, `/m/<slug>`), combined with `location.origin`. Never build them from user text.
5. Treat `moderation_hints` as advisory badges. Never auto-hide or auto-approve on them.
6. API responses carry `X-Content-Type-Options: nosniff`, `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'` and `Referrer-Policy: no-referrer`, so a JSON response can't be sniffed or framed as HTML.

---

## 4. State machines

### 4.1 Guestbook entries and tributes

```
          submit (guest)
               │
               ▼
          ┌─────────┐   approve    ┌──────────┐
          │ pending │ ───────────▶ │ approved │ ◀─┐
          └─────────┘              └──────────┘   │ approve
               │ reject                 │ reject  │ (reconsider)
               ▼                        ▼         │
          ┌──────────┐ ◀────────────────┘         │
          │ rejected │ ───────────────────────────┘
          └──────────┘
```

- The client can request only `approved` or `rejected`. Nothing returns to `pending`.
- Requesting the current status is an idempotent `200`.
- **Rejecting a tribute cited by the published story automatically unpublishes that story** (it returns to `draft`, `version + 1`). The response reports this in `side_effects.unpublished_story_id`. The organizer then edits the story and republishes it.

### 4.2 Stories (`story_drafts`)

```
   weave ──▶ ┌───────┐  publish  ┌───────────┐
             │ draft │ ────────▶ │ published │
             └───────┘ ◀──────── └───────────┘
               edit ⟲  unpublish    edit ⟲ (live)
```

- Weave always creates a new `draft`. **The AI never publishes.**
- At most one story per memorial is `published`. Publishing another returns the previous one to `draft` (`side_effects.superseded_story_id`).
- `edit` is allowed in both states. Edits to a published story are live immediately, because the organizer is the reviewer.
- Every story PATCH must send the current `version`. A mismatch returns `409 VERSION_CONFLICT`, and each successful PATCH increments `version`.
- **Source rule:** every paragraph must cite ≥1 tribute that is **currently approved** and belongs to the same memorial. This is checked on `edit`, on `publish`, and on `edit` of a published story. Violation → `409 STORY_SOURCES_INVALID`, with `fields` pointing at the offending ids.

---

## 5. Endpoints

| # | Method & path | Auth | Success |
|---|---|---|---|
| 1 | `GET /api/health` | none | 200 |
| 2 | `POST /api/memorials` | none | 201 + organizer cookie |
| 3 | `GET /api/memorials/:slug` | none | 200 |
| 4 | `POST /api/memorials/:slug/guestbook` | none | 202 |
| 5 | `POST /api/memorials/:slug/tributes` | none | 202 |
| 6 | `POST /api/organizer/session` | token in body | 200 + cookie |
| 7 | `GET /api/organizer/session` | cookie | 200 |
| 8 | `DELETE /api/organizer/session` | none (clears cookie) | 204 |
| 9 | `GET /api/organizer/memorials/:id` | cookie | 200 |
| 10 | `POST /api/organizer/memorials/:id/rotate-token` | cookie | 200 + new cookie |
| 11 | `PATCH /api/organizer/guestbook/:id` | cookie | 200 |
| 12 | `PATCH /api/organizer/tributes/:id` | cookie | 200 |
| 13 | `POST /api/organizer/memorials/:id/weave` | cookie | 202 (job started) |
| 13b | `GET /api/organizer/memorials/:id/weave` | cookie | 200 (job status) |
| 14 | `PATCH /api/organizer/stories/:id` | cookie | 200 |

Path builders are in `API_ROUTES` (`src/shared/api/routes.ts`). Client methods are in `ZemneApiClient` (`src/shared/api/client.ts`). Every route can also return `400 INVALID_JSON`, `400 VALIDATION_FAILED`, `405`, `413`, `415`, `403 ORIGIN_REJECTED` (writes), `429` and `500`. Only additional errors are listed below.

### 5.1 `GET /api/health`
Safe liveness only. It never echoes config values, versions of secrets or connection strings.

<!-- schema: HealthResponse -->
```json
{ "status": "ok", "checks": { "database": "ok", "ai": "configured" } }
```

### 5.2 `POST /api/memorials` — create

Request (`CreateMemorialRequest`):

<!-- schema: CreateMemorialRequest -->
```json
{
  "name": "Elowen Marsh",
  "birth_year": 1941,
  "death_year": 2025,
  "description": "Gardener, choir alto and retired chemistry teacher. This hall gathers memories from the people who knew her.",
  "portrait_key": "neutral-1",
  "privacy_acknowledged": true,
  "website": ""
}
```

`birth_year`, `death_year` and `portrait_key` are optional and nullable. `portrait_key` is one of `neutral-1 | neutral-2 | neutral-3` (predefined placeholders; Codex supplies the art). Portrait upload is out of scope for the MVP contract.

Response `201` (`CreateMemorialResponse`). It also sets the organizer cookie, so the console works immediately:

<!-- schema: CreateMemorialResponse -->
```json
{
  "memorial_id": "65d000000000000000000001",
  "memorial": {
    "slug": "elowen-marsh-k7q2xm",
    "name": "Elowen Marsh",
    "birth_year": 1941,
    "death_year": 2025,
    "description": "Gardener, choir alto and retired chemistry teacher. This hall gathers memories from the people who knew her.",
    "portrait": { "kind": "placeholder", "key": "neutral-1" },
    "created_at": "2026-10-27T09:00:00.000Z"
  },
  "guest_path": "/m/elowen-marsh-k7q2xm",
  "manage_path": "/manage/65d000000000000000000001#key=zmn_ot_DEMO-ONLY-not-a-real-secret-000000000000000",
  "organizer_token": "zmn_ot_DEMO-ONLY-not-a-real-secret-000000000000000",
  "session": { "memorial_id": "65d000000000000000000001", "expires_at": "2026-10-27T21:00:00.000Z" }
}
```

Paths are **relative**. Build absolute links with `location.origin` so the server never trusts the `Host` header for link generation. The token shown above is the fixture's fake.

### 5.3 `GET /api/memorials/:slug` — public read

Returns only the public-safe projection (§3.4): approved guestbook entries and tributes, newest first, up to 200 each, plus the published story or `null`. An unknown slug returns `404 NOT_FOUND`.

<!-- schema: PublicMemorialResponse -->
```json
{
  "memorial": {
    "slug": "elowen-marsh-k7q2xm",
    "name": "Elowen Marsh",
    "birth_year": 1941,
    "death_year": 2025,
    "description": "Gardener, choir alto and retired chemistry teacher. This hall gathers memories from the people who knew her.",
    "portrait": { "kind": "placeholder", "key": "neutral-1" },
    "created_at": "2026-10-27T09:00:00.000Z"
  },
  "guestbook": [
    { "id": "65d0000000000000000000a1", "display_name": "Tomasz Reyes", "message": "Thinking of your family today. Thank you for all those after-school lab sessions.", "created_at": "2026-10-27T10:05:00.000Z" }
  ],
  "tributes": [
    { "id": "65d0000000000000000000b1", "contributor_name": "Tomasz Reyes", "relationship": "Former student", "content": "Mrs Marsh stayed after class every Thursday so anyone who was struggling could redo the experiments.", "created_at": "2026-10-27T10:08:00.000Z" }
  ],
  "story": {
    "id": "65d0000000000000000000c1",
    "title": "[DEMO] Remembering Elowen",
    "paragraphs": [
      { "text": "Those who learned from Elowen remember her patience.", "source_tribute_ids": ["65d0000000000000000000b1"] }
    ],
    "edited_by_organizer": true,
    "ai": { "model_id": "DEMO-FIXTURE (no model called)", "provider_label": "DEMO data — hand-written fixture, not Gemma output" },
    "published_at": "2026-10-27T11:45:00.000Z"
  }
}
```

Memory wall UI: each paragraph shows its source chips. Each chip links to the tribute with that id in `tributes`, so it opens the exact approved text. Next to the story, show the AI disclosure from `story.ai`: "Woven with {model_id} from approved tributes; reviewed by the family". Also show "edited by the family" when `edited_by_organizer` is true.

### 5.4 `POST /api/memorials/:slug/guestbook`

<!-- schema: GuestbookSubmissionRequest -->
```json
{ "display_name": "Priya Lindqvist", "message": "Singing the alto line tonight for you, Elowen.", "consent": true, "website": "" }
```

Response `202` (`SubmissionReceiptResponse`). The entry is stored `pending` and is not visible anywhere public:

<!-- schema: SubmissionReceiptResponse -->
```json
{
  "receipt": { "id": "65d0000000000000000000a3", "kind": "guestbook", "status": "pending", "submitted_at": "2026-10-27T10:40:00.000Z" },
  "message": "Thank you for signing. Your message will appear after the family approves it."
}
```

Additional errors: `404 NOT_FOUND` for an unknown slug.

### 5.5 `POST /api/memorials/:slug/tributes`

<!-- schema: TributeSubmissionRequest -->
```json
{
  "contributor_name": "Priya Lindqvist",
  "relationship": "Choir friend",
  "content": "Elowen sat next to me in the community choir for years. She was always the first to arrive and would hum while she set out the chairs.",
  "consent": true
}
```

Response `202` (`SubmissionReceiptResponse`) with `kind: "tribute"`. Show the friendly `message` as the moderation-status receipt.

### 5.6 `POST /api/organizer/session` — exchange the private link

<!-- schema: OrganizerSessionRequest -->
```json
{ "memorial_id": "65d000000000000000000001", "token": "zmn_ot_DEMO-ONLY-not-a-real-secret-000000000000000" }
```

Response `200` + `Set-Cookie` (`OrganizerSessionResponse`):

<!-- schema: OrganizerSessionResponse -->
```json
{ "session": { "memorial_id": "65d000000000000000000001", "expires_at": "2026-10-27T21:00:00.000Z" } }
```

Additional errors: `401 INVALID_ORGANIZER_TOKEN`, returned for both a wrong token and an unknown memorial. A malformed token or id gives `400 VALIDATION_FAILED`.

### 5.7 `GET /api/organizer/session`
Returns `200` with the same body as 5.6 when the cookie is valid, otherwise `401 UNAUTHENTICATED`. Use it on console load.

### 5.8 `DELETE /api/organizer/session`
Clears the cookie with `Max-Age=0` and returns `204`. It is idempotent.

### 5.9 `GET /api/organizer/memorials/:id` — owner view and moderation queue

Response `200` (`OrganizerMemorialResponse`):
- `memorial`: the public fields plus `id`, `guest_path`, `visibility: "unlisted"` and `updated_at`.
- `guestbook` / `tributes`: **all statuses**, newest first, each with `status`, `moderation_hints` and `moderated_at`. The UI groups them into Pending / Approved / Rejected tabs.
- `stories`: newest first, up to 10, as `StoryView`.
- `published_story_id`.
- `counts`: per-status counts for badges.

Each contribution list returns at most 500 items, newest first; `counts` are always exact. A complete fixture is `demoOrganizerMemorialResponse` in `src/shared/fixtures/demo-memorial.ts`, and a real captured response is in §10. Additional errors: `401 UNAUTHENTICATED`, `403 FORBIDDEN` (session for another memorial), and `404 NOT_FOUND` for a malformed id.

`StoryView`:

<!-- schema: StoryView -->
```json
{
  "id": "65d0000000000000000000c1",
  "memorial_id": "65d000000000000000000001",
  "status": "draft",
  "version": 1,
  "title": "[DEMO] Remembering Elowen",
  "paragraphs": [
    { "text": "Those who learned from Elowen remember her patience.", "source_tribute_ids": ["65d0000000000000000000b1"] },
    { "text": "Her garden reached past her own fence.", "source_tribute_ids": ["65d0000000000000000000b2"] }
  ],
  "flags": [
    { "code": "unknown_source_removed", "origin": "validator", "paragraph_index": 1, "message": "Removed 1 citation(s) to tributes that were not provided to the model. Review this paragraph.", "source_tribute_ids": [] }
  ],
  "input_tribute_ids": ["65d0000000000000000000b1", "65d0000000000000000000b2"],
  "ai": { "model_id": "DEMO-FIXTURE (no model called)", "provider_label": "DEMO data — hand-written fixture, not Gemma output" },
  "edited_by_organizer": false,
  "created_at": "2026-10-27T11:30:00.000Z",
  "updated_at": "2026-10-27T11:30:00.000Z",
  "published_at": null
}
```

### 5.10 `POST /api/organizer/memorials/:id/rotate-token`
Request body: `{}`. The response `200` (`RotateTokenResponse`) contains `manage_path`, `organizer_token` and `session`, and sets a new cookie. The old link and all old sessions stop working immediately. Show the same "SAVE THIS PRIVATE LINK" handoff as on create. Additional errors: `401`, `403 FORBIDDEN`, and `429` (5 per hour).

### 5.11 `PATCH /api/organizer/guestbook/:id` and 5.12 `PATCH /api/organizer/tributes/:id` — moderate

<!-- schema: ModerationRequest -->
```json
{ "status": "approved" }
```

- Guestbook response `200`: `{ "entry": OrganizerGuestbookEntry }`.
- Tribute response `200` (`ModerateTributeResponse`):

<!-- schema: ModerateTributeResponse -->
```json
{
  "tribute": {
    "id": "65d0000000000000000000b3",
    "contributor_name": "Priya Lindqvist",
    "relationship": "Choir friend",
    "content": "Elowen sat next to me in the community choir for years. She was always the first to arrive and would hum while she set out the chairs.",
    "status": "approved",
    "moderation_hints": [],
    "created_at": "2026-10-27T10:42:00.000Z",
    "moderated_at": "2026-10-27T12:00:00.000Z"
  },
  "side_effects": { "unpublished_story_id": null }
}
```

Additional errors: `401`, `404` (unknown id, or one belonging to another memorial). Requesting `status: "pending"` is a `400 VALIDATION_FAILED`.

### 5.13 `POST` and `GET /api/organizer/memorials/:id/weave` — Gemma Memory Weaver (background job)

Real Gemma 4 latency on the configured provider is about **1–3 minutes**, and up to about 4 minutes with overload retries (§6.3), so weave runs as a **background job** rather than inside one HTTP request. This changed in 1.2.0.

**`POST` — start a weave.** Request body: `{}` (`WeaveRequest`; no options).
- The server collects **every currently approved tribute** of this memorial, oldest first, up to 40 tributes or 40,000 characters. Client-supplied tribute ids are not accepted.
- It starts a job and returns **`202`** (`WeaveStartResponse`) immediately.
- The job runs the model and the validator (§6) and stores a new **`draft`**. It never publishes.

<!-- schema: WeaveStartResponse -->
```json
{
  "job": {
    "id": "65d0000000000000000000e1",
    "status": "running",
    "started_at": "2026-10-27T12:00:00.000Z",
    "finished_at": null,
    "story_id": null,
    "error": null
  }
}
```

Synchronous errors from `POST`, where no job is started:
- `401 UNAUTHENTICATED`, `403 FORBIDDEN` (session for another memorial), `403 ORIGIN_REJECTED`, `429 RATE_LIMITED` (6 per hour per memorial).
- `409 NO_APPROVED_TRIBUTES`.
- `409 WEAVE_IN_PROGRESS`: a job for this memorial is still running. Only one runs at a time.
- `503 AI_UNAVAILABLE`: no Gemma endpoint is configured on the server.

**`GET` — job status.** Returns `200` (`WeaveStatusResponse`) with the memorial's **latest** job, or `null` if none has run. `story` is the produced draft, present exactly when `job.status` is `succeeded`. Auth is the same as `POST`: `401`, or `403 FORBIDDEN` for another memorial.

<!-- schema: WeaveStatusResponse -->
```json
{
  "job": {
    "id": "65d0000000000000000000e1",
    "status": "failed",
    "started_at": "2026-10-27T12:00:00.000Z",
    "finished_at": "2026-10-27T12:02:50.000Z",
    "story_id": null,
    "error": {
      "code": "AI_TIMEOUT",
      "message": "The AI took too long to respond. Nothing was saved. Please try again.",
      "retryable": true
    }
  },
  "story": null
}
```

**Job outcomes:**
- `running`
- `succeeded`: `story_id` and `story` are set.
- `failed`, with `error.code` one of:
  - `AI_TIMEOUT`: the 220 s model budget ran out, or the job was orphaned by a server restart and passed its 230 s deadline.
  - `AI_UNAVAILABLE`: provider error, or still overloaded after up to 3 retries.
  - `AI_INVALID_OUTPUT`: unverifiable output after one repair attempt.
  - `INTERNAL`.

On every failure **nothing is stored and no fallback or fake text is produced**; all of these are `retryable: true`.

**Client behaviour:**
- `ZemneApiClient.weaveStory(memorialId)` keeps its 1.0 signature. The HTTP client POSTs, polls `GET` every 4 s (up to 300 s), and resolves `{ story }` or rejects with a `ZemneApiError` carrying the job's error code. **UI code written against the mock needs no change.**
- New `getWeaveStatus(memorialId)` lets the console resume a "Weaving…" state after a reload.
- The UI must show a long-running state, e.g. "Weaving approved tributes with Gemma. This can take 1–4 minutes." It must not double-submit; a second POST gets `409 WEAVE_IN_PROGRESS`.

<!-- schema: ApiErrorBody -->
```json
{
  "error": {
    "code": "AI_UNAVAILABLE",
    "message": "The AI service is unavailable right now. Nothing was saved. Please try again later.",
    "request_id": "req_01HZX3",
    "retryable": true
  }
}
```

### 5.14 `PATCH /api/organizer/stories/:id` — edit, publish, unpublish

The request is a discriminated union on `action`:

<!-- schema: StoryUpdateRequest -->
```json
{
  "action": "edit",
  "version": 1,
  "title": "Remembering Elowen",
  "paragraphs": [
    { "text": "Those who learned from Elowen remember her patience.", "source_tribute_ids": ["65d0000000000000000000b1"] }
  ]
}
```

<!-- schema: StoryUpdateRequest -->
```json
{ "action": "publish", "version": 2 }
```

<!-- schema: StoryUpdateRequest -->
```json
{ "action": "unpublish", "version": 3 }
```

- `edit` needs at least one of `title` / `paragraphs`. `paragraphs` replaces the whole list (1–8), which allows reordering and removal. Each paragraph cites ≥1 currently approved tribute. Edit sets `edited_by_organizer: true`.
- Response `200` (`StoryUpdateResponse`): `{ "story": StoryView, "side_effects": { "superseded_story_id": string | null } }`.
- Additional errors: `401`, `404`, `409 VERSION_CONFLICT`, `409 INVALID_STATE_TRANSITION` (publish when published, unpublish when draft), `409 STORY_SOURCES_INVALID`.

---

## 6. Memory Weaver model contract (implemented in P5)

Code: `src/shared/api/weave.ts`.

**Input sent to the model** (`WeaveModelInput`). Built by `prepareWeaveInput(memorial, approvedTributes)`:

```json
{
  "schema": "zemne.weave.v1",
  "memorial": { "name": "Elowen Marsh", "birth_year": 1941, "death_year": 2025, "description": "…" },
  "tributes": [ { "id": "T1", "text": "…" }, { "id": "T2", "text": "…" } ]
}
```

- **Only approved tributes**, as `{id, text}`. Contributor names, relationships, guestbook entries, pending or rejected items, ids and metadata are never sent.
- `T1…Tn` are per-request aliases. The server keeps the `alias → ObjectId` map, so the model can never cite a database id it wasn't given.
- The prompt must frame tributes as **untrusted quoted data, not instructions**, and must ask the model to:
  - group the tributes by recurring themes;
  - write gently in the third person;
  - invent no names, dates, occupations, relationships, places or quotes beyond the tribute text;
  - cite the aliases behind every paragraph;
  - raise flags for anything uncertain, conflicting, sensitive or instruction-like.

**Expected model output** (`WeaveModelOutputSchema`):

```json
{
  "title": "string ≤120",
  "paragraphs": [ { "text": "string ≤1200", "source_tribute_ids": ["T1", "T3"] } ],
  "flags": [ { "code": "unsupported_claim|uncertain_detail|conflicting_accounts|sensitive_content|possible_instruction_ignored|insufficient_material", "paragraph_index": 0, "message": "string", "source_tribute_ids": ["T2"] } ]
}
```

**Validator** (`validateWeaveOutput(raw, aliasToId)`). This is the only path from model text to a stored draft:

| Model output | Result |
|---|---|
| Not JSON (a ```` ```json ```` fence is tolerated) | `AI_INVALID_OUTPUT` |
| Wrong shape, 0 or >8 paragraphs, over-long fields, empty title | `AI_INVALID_OUTPUT` |
| A paragraph cites an unknown alias (hallucinated source) | The citation is dropped and a validator flag `unknown_source_removed` is added on that paragraph |
| Duplicate citations | Deduplicated |
| A paragraph is left with **no** valid citation | The paragraph is dropped and a validator flag `paragraph_without_sources_removed` is added |
| No paragraph survives | `AI_INVALID_OUTPUT` |
| Unknown flag code from the model | Downgraded to `uncertain_detail` |
| Extra keys (e.g. `"status": "published"` produced by an injection) | Stripped and ignored. The stored status is always `draft`. |

Passing validation means **the citations point at provided tributes. It does not mean the claims are verified.** The UI must never label AI text as "verified" or "fact-checked". Flags (`WeaveFlag`: `code`, `origin: model|validator`, `paragraph_index | null`, `message`, `source_tribute_ids`) are shown to the organizer only, beside the relevant paragraph.

`StoryView.ai` records the `model_id` **as reported by the endpoint's response** (for example `gemma-4-31b-it`) and a provider label derived from the endpoint host. Both are shown publicly next to a published story.

### 6.1 Implementation (P5)

- `src/lib/ai/gemma-client.ts`: an OpenAI-compatible `POST {GEMMA_API_BASE_URL}/chat/completions` client.
  - The whole prompt goes in one user message. Gemma on the Gemini API rejects system instructions, JSON response mode and thinking controls; each was tried against the live endpoint.
  - Gemma 4 returns its reasoning inline as `<thought>…</thought>`. The client strips it; an unterminated thought counts as no answer.
  - `max_tokens` is 6144 and `temperature` is 0.3.
- `src/lib/ai/prompt.ts`: rules come before the data and are repeated after it. Tributes are embedded as escaped JSON inside a per-request random boundary (`<<<DATA_<18 hex>` … `DATA_<18 hex>>>>`), so a tribute cannot close the block or pose as instructions. Contributor names are never sent.
- `src/lib/ai/weaver.ts`: runs the model, then `validateWeaveOutput`, then one repair attempt if the output is unverifiable. On upstream 429/500/502/503 overload it retries up to 3 times (3 s, 8 s, 15 s backoff), but only while at least 60 s of budget would remain for the call. Overload retries don't use up the repair attempt. The budget is 220 s. `weave_ok` and `weave_failed` logs record the number of overload retries.
- `src/lib/ai/grounding.ts`: deterministic validator flags (`origin: "validator"`). They mark numbers or years and capitalised names that don't appear in a paragraph's cited tributes or the memorial fields, and paragraphs that share under 20% of their content words with their sources. Text is never rewritten; the organizer decides.

### 6.2 Model and provider (verified facts, 2026-10-27)

| Item | Fact | How verified |
|---|---|---|
| Provider | Google AI Studio (Gemini API), OpenAI-compatible endpoint `https://generativelanguage.googleapis.com/v1beta/openai` | Live `GET /models` with the owner's key returned 200 |
| Gemma models served | `gemma-4-31b-it` and `gemma-4-26b-a4b-it`, both version `001`. **Gemma 3 is not served:** `gemma-3-27b-it` returned 404 | Live `/models` (OpenAI-compatible and native endpoints) |
| Model in use | `gemma-4-31b-it` (the dense Gemma 4 31B instruction-tuned model, 30.7B parameters) | `model` field of real responses |
| Open weights and licence | `google/gemma-4-31B-it` on Hugging Face: open weights, **licence `apache-2.0`**, no gating notice | Model card, read 2026-10-27 |
| Provider terms | The hosted API is subject to Google's Gemini API terms. **On the unpaid tier Google may use prompts and outputs to improve its products.** Evaluation used synthetic data only. Real memorials need a paid or billing-enabled key, or another host of the same open weights | Owner informed before the key was created |

### 6.3 Measured behaviour (synthetic data; nothing fabricated)

Evidence files are in `docs/evidence/p5/`. Every number below was observed on 2026-10-27 from this machine.

| Run | Result |
|---|---|
| Probe: "Reply with exactly the word OK." | 200 in 30.2 s. Reasoning consumed the 20-token limit, which is why the client now allows 6144 tokens |
| Live evaluation A (exploratory: 200 s budget, no overload retry). Its file was overwritten; numbers transcribed from that run's console output | Three personas: **61.0 s** OK, then 503, 503. Injection: **120.2 s** OK. Sparse: **66.9 s** OK. Conflicting: **152.1 s** OK |
| Live evaluation B, production settings (`…31b-it-2026-10-27T16-16-14-224Z.json`) | Three personas: 503, 500, 500 (each after one retry). Injection: **129.2 s** OK. Sparse: 500. Conflicting: **112.0 s** OK |
| End-to-end through the HTTP job API (`e2e-weave-…json`): production `next start`, local MongoDB, 3 synthetic contributors | `POST` 202 in 0.16 s. Job **succeeded at 64.7 s** (model 61.1 s, 1 attempt). The draft was not public; it was published by the organizer; all citations resolve |
| Live evaluation C, after the P7 overload fix: 220 s budget, up to 3 overload retries (`…31b-it-2026-10-27T19-31-53-929Z.json`) | Three personas: **173.6 s** (97.5 s in the successful call), **37.3 s**, **46.1 s**, all OK. Injection and sparse: 500 after 3 retries. Conflicting: **216.9 s** OK (183.1 s in the successful call). Two successes took longer than the old 170 s budget, so they would have failed before the fix. The gap between end-to-end time and successful-call time is time spent in failed calls and backoff; the retry count itself isn't recorded in this file |
| `gemma-4-26b-a4b-it` (`…26b-a4b-it-2026-10-27T16-01-44-661Z.json`) | 5 of 6 hit the 200 s timeout and 1 returned 500. Not usable today |

Across completed `gemma-4-31b-it` weaves (7), model latency was **61.0–152.1 s**, median 112.0 s.

Availability today was **7 successes out of 13** weave attempts. Every failure was an upstream 500/503 "high demand", and each failed safely as a retryable job error with nothing stored.

Quality checks on every completed weave:
- citations only to provided, approved tributes: 7/7;
- prompt injection ignored, with no "Nobel" or "1979" in the output and the tribute flagged `possible_instruction_ignored`: 2/2;
- conflicting accounts flagged and both accounts presented rather than resolved: 2/2;
- sparse input flagged `insufficient_material` and kept to 1 paragraph: 1/1.

Prose is accurate but plain. Organizer editing is expected.

---

## 7. Error model

Every non-2xx response body is `ApiErrorBody`:

<!-- schema: ApiErrorBody -->
```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Please check the highlighted fields.",
    "request_id": "req_01HZX4",
    "retryable": false,
    "fields": [ { "path": "content", "message": "Too small: expected string to have >=10 characters" } ]
  }
}
```

<!-- schema: ApiErrorBody -->
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many attempts. Please wait a little and try again.",
    "request_id": "req_01HZX5",
    "retryable": true,
    "retry_after_seconds": 60
  }
}
```

| Code | HTTP | Retryable | UI guidance |
|---|---|---|---|
| `INVALID_JSON` | 400 | no | Bug; generic error |
| `VALIDATION_FAILED` | 400 | no | Map `fields[].path` to form inputs (`fields` always present) |
| `UNAUTHENTICATED` | 401 | no | "Session expired: open your private link again" |
| `INVALID_ORGANIZER_TOKEN` | 401 | no | "This link isn't valid; check you copied all of it" |
| `FORBIDDEN` | 403 | no | "This session is for a different memorial; open this memorial's private link" (new in 1.1.0) |
| `ORIGIN_REJECTED` | 403 | no | Ask the user to reload |
| `NOT_FOUND` | 404 | no | Memorial or item not found (also returned for items of other memorials) |
| `METHOD_NOT_ALLOWED` | 405 | no | Bug. Unsupported methods are answered by Next.js with an **empty-body 405**, not this envelope |
| `INVALID_STATE_TRANSITION` | 409 | no | Refresh the console |
| `VERSION_CONFLICT` | 409 | no | "Changed in another tab", then reload the story |
| `NO_APPROVED_TRIBUTES` | 409 | no | Disable Weave until ≥1 tribute is approved |
| `STORY_SOURCES_INVALID` | 409 | no | Highlight paragraphs from `fields` |
| `WEAVE_IN_PROGRESS` | 409 | yes | Keep the loading state, retry shortly |
| `PAYLOAD_TOO_LARGE` | 413 | no | Show the length limit |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | no | Bug |
| `RATE_LIMITED` | 429 | yes | Use `retry_after_seconds` (always present) |
| `INTERNAL` | 500 | yes | Generic retry. The client also uses it for network failures (`status 0`) |
| `AI_INVALID_OUTPUT` | 502 | yes | "Couldn't verify the draft against the tributes; nothing saved; try again" |
| `AI_UNAVAILABLE` | 503 | yes | Retry later; **never show substitute text** |
| `AI_TIMEOUT` | 504 | yes | Retry |

`message` is always safe to display. Error responses never include stack traces, DB errors, tokens or model output.

---

## 8. Persistence mapping (implemented in P4)

Field names follow blueprint §6. API field names equal DB field names except `_id` → `id`.

| Collection | Fields | Indexes |
|---|---|---|
| `memorials` | `_id, slug, name, birth_year?, death_year?, description, portrait_key?, owner_token_hash, owner_token_version, visibility:"unlisted", created_at, updated_at` | `slug` unique; `owner_token_hash` unique |
| `guestbook_entries` | `_id, memorial_id, display_name, message, status, consent:true, moderation_hints[], ip_hash, content_hash, created_at, moderated_at?` | `{memorial_id, status, created_at:-1}`; `{memorial_id, content_hash, created_at:-1}` |
| `tributes` | `_id, memorial_id, contributor_name, relationship?, content, status, consent:true, moderation_hints[], ip_hash, content_hash, created_at, moderated_at?` | `{memorial_id, status, created_at:-1}`; `{memorial_id, content_hash, created_at:-1}` |
| `story_drafts` | `_id, memorial_id, status, version, title, paragraphs[{text, source_tribute_ids[]}], flags[], input_tribute_ids[], model_id, provider_label, edited_by_organizer, created_at, updated_at, published_at?` | `{memorial_id, created_at:-1}`; partial unique `{memorial_id}` where `status:"published"` |
| `rate_limits` | `_id (key), count, expires_at` | TTL on `expires_at` |

The published story is found by querying `story_drafts` for `{memorial_id, status:"published"}`. The blueprint's `memorials.published_story?` is represented by that partial-unique query, not by a copied field. All writes validate with the request schemas, and status and source ids always come from the server.

Implementation notes:
- Code: `src/lib/db/{types,schema,client}.ts`.
- When a collection is first created, it gets a MongoDB `$jsonSchema` validator (`validationLevel: strict`), so malformed documents are rejected even if application code is bypassed. Indexes are created idempotently on first connection. The app user's `readWrite@zemne` role is sufficient; no `collMod` is needed.
- `ip_hash` is a keyed HMAC, truncated, never a raw IP. `content_hash` is the SHA-256 of case-folded text and powers the `duplicate_submission` hint over a 24 h window.
- Tribute rejection with its story auto-unpublish, and publish with its supersede, each run in one transaction. Atlas supports this; the tests use a single-node replica set.
- Remote URIs require validated TLS. The database name comes from the URI path and defaults to `zemne`.

---

## 9. Fixtures and DEMO mock client

**All fixture content is synthetic test data**: the fictional "Elowen Marsh" (1941–2025) and three fictional guest personas. They are not real testimonials.

| Export (`@/shared/fixtures`) | Use |
|---|---|
| `FIXTURE_NOTICE` | Text for a DEMO badge or tooltip |
| `demoPersonas` | Guest A (Tomasz Reyes, former student), Guest B (Ngozi Achterberg, neighbour), Guest C (Priya Lindqvist, choir friend), each with a guestbook entry and a tribute request body |
| `demoPublicMemorialResponse` | The guest hall: 2 approved entries, 2 approved tributes, published DEMO story citing both |
| `demoEmptyPublicMemorialResponse` | A brand-new memorial (empty states) |
| `demoOrganizerMemorialResponse` | The console: C's guestbook entry and tribute pending, one rejected duplicate, one published story with flags |
| `demoCreateMemorialResponse` | The create-handoff screen |
| `demoErrorExamples[code]` | One `ApiErrorBody` per error code, for error states |
| `DEMO_IDS`, `DEMO_SLUG`, `DEMO_ORGANIZER_TOKEN`, `DEMO_MANAGE_PATH` | Fixed ids. The token is **fake** and is accepted only by the mock |
| `createMockClient(opts)` | In-memory `ZemneApiClient` (`isDemo: true`) |

`createMockClient` behaves like the contract:
- validation errors with `fields`;
- pending items hidden from the public read;
- moderation transitions;
- the cited-tribute auto-unpublish;
- a single published story;
- version conflicts;
- 401/403/404 session rules;
- the honeypot.

Its `weaveStory` calls **no AI**. It returns hand-written paragraphs and placeholders labeled `[DEMO]`, with `ai.model_id: "DEMO-MOCK (no model called)"`. Options: `latencyMs`, `weaveLatencyMs`, `startWithDemoSession`, `now`. Helpers: `simulateNextError(code)` and `reset()`.

---

## 10. P4 implementation status and live response examples

### 10.1 Endpoint readiness

| Route | P4 status |
|---|---|
| `GET /api/health` | ✅ Real: DB ping plus config presence; secret values are never shown |
| `POST /api/memorials` | ✅ MongoDB, hashed token, unique slug, cookie |
| `GET /api/memorials/:slug` | ✅ Approved-only allowlist serializer |
| `POST /api/memorials/:slug/guestbook`, `…/tributes` | ✅ Always `pending`, rate-limited, hints, honeypot |
| `POST/GET/DELETE /api/organizer/session` | ✅ Fragment-token exchange → `__Host-zemne_org` cookie |
| `GET /api/organizer/memorials/:id` | ✅ Owner view, counts, stories |
| `POST /api/organizer/memorials/:id/rotate-token` | ✅ Revokes the old link and sessions |
| `PATCH /api/organizer/guestbook/:id`, `…/tributes/:id` | ✅ Including the cited-tribute auto-unpublish |
| `PATCH /api/organizer/stories/:id` | ✅ Edit, publish, unpublish, versioning, source checks. Before P5, stories only exist if inserted directly |
| `POST`/`GET /api/organizer/memorials/:id/weave` | ✅ (P5) Background job on real `gemma-4-31b-it`; drafts only |

Code layout:
- `src/app/api/**/route.ts`: thin Node-runtime wrappers.
- `src/server/handlers/{public,organizer}.ts`: request logic.
- `src/server/security/*`: tokens, session, origin, IP, rate limits.
- `src/server/serializers.ts`: public-safe output.
- `src/server/auth.ts`: organizer authorization.

Required env, backend only: `MONGODB_URI` and `SESSION_SECRET` (≥ 32 chars). If either is missing, routes return `500 INTERNAL` and `/api/health` reports `degraded`.

### 10.2 Responses captured from the real handlers

These were captured from the real handlers running against MongoDB (an in-memory replica set) with the synthetic personas. Ids and timestamps are what that run produced. Tokens are replaced with the fixture's fake token, and the cookie value is elided.

`POST /api/memorials` → `201`, with header:

```
__Host-zemne_org=v1.<payload>.<signature>; Path=/; Max-Age=43200; HttpOnly; Secure; SameSite=Strict
```

<!-- schema: CreateMemorialResponse -->
```json
{
  "memorial_id": "6ae0bb690d12c79223ec5c3e",
  "memorial": {
    "slug": "elowen-marsh-aprmkq",
    "name": "Elowen Marsh",
    "birth_year": 1941,
    "death_year": 2025,
    "description": "Gardener, choir alto and retired chemistry teacher.",
    "portrait": {
      "kind": "placeholder",
      "key": "neutral-1"
    },
    "created_at": "2026-10-27T12:00:00.000Z"
  },
  "guest_path": "/m/elowen-marsh-aprmkq",
  "manage_path": "/manage/6ae0bb690d12c79223ec5c3e#key=zmn_ot_DEMO-ONLY-not-a-real-secret-000000000000000",
  "organizer_token": "zmn_ot_DEMO-ONLY-not-a-real-secret-000000000000000",
  "session": {
    "memorial_id": "6ae0bb690d12c79223ec5c3e",
    "expires_at": "2026-10-28T00:00:00.000Z"
  }
}
```

`POST /api/memorials/:slug/tributes` → `202`:

<!-- schema: SubmissionReceiptResponse -->
```json
{
  "receipt": {
    "id": "6ae0bb690d12c79223ec5c40",
    "kind": "tribute",
    "status": "pending",
    "submitted_at": "2026-10-27T12:02:00.000Z"
  },
  "message": "Thank you. Your tribute was received and will appear after the family approves it."
}
```

`POST /api/organizer/session` → `200` + `Set-Cookie`:

<!-- schema: OrganizerSessionResponse -->
```json
{
  "session": {
    "memorial_id": "6ae0bb690d12c79223ec5c3e",
    "expires_at": "2026-10-28T00:21:00.000Z"
  }
}
```

`PATCH /api/organizer/guestbook/:id` `{"status":"approved"}` → `200`:

<!-- schema: ModerateGuestbookResponse -->
```json
{
  "entry": {
    "id": "6ae0bb690d12c79223ec5c3f",
    "display_name": "Tomasz Reyes",
    "message": "Thinking of your family today. Thank you for all those after-school lab sessions.",
    "created_at": "2026-10-27T12:01:00.000Z",
    "status": "approved",
    "moderation_hints": [],
    "moderated_at": "2026-10-27T12:16:00.000Z"
  }
}
```

`PATCH /api/organizer/stories/:id` `{"action":"publish","version":1}` → `200` (this story was seeded directly, because weave arrives in P5):

<!-- schema: StoryUpdateResponse -->
```json
{
  "story": {
    "id": "6ae0bb690d12c79223ec5c45",
    "memorial_id": "6ae0bb690d12c79223ec5c3e",
    "status": "published",
    "version": 2,
    "title": "Remembering Elowen",
    "paragraphs": [
      {
        "text": "Those who learned from Elowen remember her patience after class.",
        "source_tribute_ids": [
          "6ae0bb690d12c79223ec5c40"
        ]
      },
      {
        "text": "Her garden reached past her own fence, into her neighbours' kitchens.",
        "source_tribute_ids": [
          "6ae0bb690d12c79223ec5c42"
        ]
      }
    ],
    "flags": [],
    "input_tribute_ids": [
      "6ae0bb690d12c79223ec5c40",
      "6ae0bb690d12c79223ec5c42"
    ],
    "ai": {
      "model_id": "test-fixture (no model called)",
      "provider_label": "Seeded test draft, not Gemma output"
    },
    "edited_by_organizer": false,
    "created_at": "2026-10-27T12:15:00.000Z",
    "updated_at": "2026-10-27T12:21:00.000Z",
    "published_at": "2026-10-27T12:21:00.000Z"
  },
  "side_effects": {
    "superseded_story_id": null
  }
}
```

`GET /api/organizer/memorials/:id` → `200` (one guest's entry is pending, one is rejected; tribute C is pending):

<!-- schema: OrganizerMemorialResponse -->
```json
{
  "memorial": {
    "id": "6ae0bb690d12c79223ec5c3e",
    "slug": "elowen-marsh-aprmkq",
    "guest_path": "/m/elowen-marsh-aprmkq",
    "name": "Elowen Marsh",
    "birth_year": 1941,
    "death_year": 2025,
    "description": "Gardener, choir alto and retired chemistry teacher.",
    "portrait": {
      "kind": "placeholder",
      "key": "neutral-1"
    },
    "visibility": "unlisted",
    "created_at": "2026-10-27T12:00:00.000Z",
    "updated_at": "2026-10-27T12:00:00.000Z"
  },
  "guestbook": [
    {
      "id": "6ae0bb690d12c79223ec5c43",
      "display_name": "Priya Lindqvist",
      "message": "Singing the alto line tonight for you, Elowen.",
      "created_at": "2026-10-27T12:05:00.000Z",
      "status": "pending",
      "moderation_hints": [],
      "moderated_at": null
    },
    {
      "id": "6ae0bb690d12c79223ec5c41",
      "display_name": "Ngozi Achterberg",
      "message": "Your tomatoes are still growing on our windowsill. We miss you.",
      "created_at": "2026-10-27T12:03:00.000Z",
      "status": "rejected",
      "moderation_hints": [],
      "moderated_at": "2026-10-27T12:16:00.000Z"
    },
    {
      "id": "6ae0bb690d12c79223ec5c3f",
      "display_name": "Tomasz Reyes",
      "message": "Thinking of your family today. Thank you for all those after-school lab sessions.",
      "created_at": "2026-10-27T12:01:00.000Z",
      "status": "approved",
      "moderation_hints": [],
      "moderated_at": "2026-10-27T12:16:00.000Z"
    }
  ],
  "tributes": [
    {
      "id": "6ae0bb690d12c79223ec5c44",
      "contributor_name": "Priya Lindqvist",
      "relationship": "Choir friend",
      "content": "Elowen sat next to me in the community choir for years. She was always the first to arrive and would hum while she set out the chairs. When I lost my nerve before my first solo, she squeezed my hand and told me to sing to one person I loved. I still do.",
      "created_at": "2026-10-27T12:06:00.000Z",
      "status": "pending",
      "moderation_hints": [],
      "moderated_at": null
    },
    {
      "id": "6ae0bb690d12c79223ec5c42",
      "contributor_name": "Ngozi Achterberg",
      "relationship": "Neighbour",
      "content": "Every August Elowen left bags of tomatoes from her garden on the doorsteps along our street, with handwritten notes about which ones were best for soup. When my son was small she let him help water the beans and gave him his own little row to look after.",
      "created_at": "2026-10-27T12:04:00.000Z",
      "status": "approved",
      "moderation_hints": [],
      "moderated_at": "2026-10-27T12:16:00.000Z"
    },
    {
      "id": "6ae0bb690d12c79223ec5c40",
      "contributor_name": "Tomasz Reyes",
      "relationship": "Former student",
      "content": "Mrs Marsh stayed after class every Thursday so anyone who was struggling could redo the experiments. She never made me feel slow. She used to say a mistake was just an experiment that wasn't finished yet. I became a pharmacist partly because of her patience.",
      "created_at": "2026-10-27T12:02:00.000Z",
      "status": "approved",
      "moderation_hints": [],
      "moderated_at": "2026-10-27T12:16:00.000Z"
    }
  ],
  "stories": [
    {
      "id": "6ae0bb690d12c79223ec5c45",
      "memorial_id": "6ae0bb690d12c79223ec5c3e",
      "status": "published",
      "version": 2,
      "title": "Remembering Elowen",
      "paragraphs": [
        {
          "text": "Those who learned from Elowen remember her patience after class.",
          "source_tribute_ids": [
            "6ae0bb690d12c79223ec5c40"
          ]
        },
        {
          "text": "Her garden reached past her own fence, into her neighbours' kitchens.",
          "source_tribute_ids": [
            "6ae0bb690d12c79223ec5c42"
          ]
        }
      ],
      "flags": [],
      "input_tribute_ids": [
        "6ae0bb690d12c79223ec5c40",
        "6ae0bb690d12c79223ec5c42"
      ],
      "ai": {
        "model_id": "test-fixture (no model called)",
        "provider_label": "Seeded test draft, not Gemma output"
      },
      "edited_by_organizer": false,
      "created_at": "2026-10-27T12:15:00.000Z",
      "updated_at": "2026-10-27T12:21:00.000Z",
      "published_at": "2026-10-27T12:21:00.000Z"
    }
  ],
  "published_story_id": "6ae0bb690d12c79223ec5c45",
  "counts": {
    "guestbook": {
      "pending": 1,
      "approved": 1,
      "rejected": 1
    },
    "tributes": {
      "pending": 1,
      "approved": 2,
      "rejected": 0
    }
  }
}
```

`GET /api/memorials/:slug` → `200`, `Cache-Control: private, no-cache`. Only approved items and the published story appear:

<!-- schema: PublicMemorialResponse -->
```json
{
  "memorial": {
    "slug": "elowen-marsh-aprmkq",
    "name": "Elowen Marsh",
    "birth_year": 1941,
    "death_year": 2025,
    "description": "Gardener, choir alto and retired chemistry teacher.",
    "portrait": {
      "kind": "placeholder",
      "key": "neutral-1"
    },
    "created_at": "2026-10-27T12:00:00.000Z"
  },
  "guestbook": [
    {
      "id": "6ae0bb690d12c79223ec5c3f",
      "display_name": "Tomasz Reyes",
      "message": "Thinking of your family today. Thank you for all those after-school lab sessions.",
      "created_at": "2026-10-27T12:01:00.000Z"
    }
  ],
  "tributes": [
    {
      "id": "6ae0bb690d12c79223ec5c42",
      "contributor_name": "Ngozi Achterberg",
      "relationship": "Neighbour",
      "content": "Every August Elowen left bags of tomatoes from her garden on the doorsteps along our street, with handwritten notes about which ones were best for soup. When my son was small she let him help water the beans and gave him his own little row to look after.",
      "created_at": "2026-10-27T12:04:00.000Z"
    },
    {
      "id": "6ae0bb690d12c79223ec5c40",
      "contributor_name": "Tomasz Reyes",
      "relationship": "Former student",
      "content": "Mrs Marsh stayed after class every Thursday so anyone who was struggling could redo the experiments. She never made me feel slow. She used to say a mistake was just an experiment that wasn't finished yet. I became a pharmacist partly because of her patience.",
      "created_at": "2026-10-27T12:02:00.000Z"
    }
  ],
  "story": {
    "id": "6ae0bb690d12c79223ec5c45",
    "title": "Remembering Elowen",
    "paragraphs": [
      {
        "text": "Those who learned from Elowen remember her patience after class.",
        "source_tribute_ids": [
          "6ae0bb690d12c79223ec5c40"
        ]
      },
      {
        "text": "Her garden reached past her own fence, into her neighbours' kitchens.",
        "source_tribute_ids": [
          "6ae0bb690d12c79223ec5c42"
        ]
      }
    ],
    "edited_by_organizer": false,
    "ai": {
      "model_id": "test-fixture (no model called)",
      "provider_label": "Seeded test draft, not Gemma output"
    },
    "published_at": "2026-10-27T12:21:00.000Z"
  }
}
```

`POST /api/organizer/memorials/:id/rotate-token` → `200`:

<!-- schema: RotateTokenResponse -->
```json
{
  "manage_path": "/manage/6ae0bb690d12c79223ec5c3e#key=zmn_ot_DEMO-ONLY-not-a-real-secret-000000000000000",
  "organizer_token": "zmn_ot_DEMO-ONLY-not-a-real-secret-000000000000000",
  "session": {
    "memorial_id": "6ae0bb690d12c79223ec5c3e",
    "expires_at": "2026-10-28T00:21:00.000Z"
  }
}
```

Errors returned by the real handlers:

<!-- schema: ApiErrorBody -->
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Your organizer session is for a different memorial. Open this memorial's private link.",
    "request_id": "req_n_nlCfkVL5Kd",
    "retryable": false
  }
}
```

<!-- schema: ApiErrorBody -->
```json
{
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Your organizer session has expired. Open your private organizer link again.",
    "request_id": "req_b5jxXLb61wzD",
    "retryable": false
  }
}
```

<!-- schema: ApiErrorBody -->
```json
{
  "error": {
    "code": "AI_UNAVAILABLE",
    "message": "The AI service is unavailable right now. Nothing was saved. Please try again later.",
    "request_id": "req_v5wiE5uX-2pq",
    "retryable": true
  }
}
```

`GET /api/health` → `200`:

<!-- schema: HealthResponse -->
```json
{
  "status": "ok",
  "checks": {
    "database": "ok",
    "ai": "unconfigured"
  }
}
```

---

## 11. Change control

Changes to routes, field names, enums or status codes need a contract revision:
1. Bump the contract version.
2. Update `src/shared/api` and this file together, and keep the tests green.
3. Note the change in the tracker handoff.

Additive optional response fields are minor changes. Anything else is breaking and must be coordinated with Codex before merge.
