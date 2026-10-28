---
title: "ZEMNE: Distance shouldn't erase participation in remembrance"
published: true
tags: devchallenge, hf26challenge
published_at: 2026-10-28T07:25:43Z
url: https://dev.to/9jadevo/zemne-distance-shouldnt-erase-participation-in-remembrance-5699
---

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 4: Ghost in the Machine](https://dev.to/challenges/hacktoberfest-week4-2026-10-26).*

## What I Built

Not everyone who knew a person can be in the room when that person is remembered. Distance, work, visas, cost and caring responsibilities can all get in the way. Being absent does not mean having nothing to contribute.

I built **ZEMNE**, a mobile-first virtual memorial hall where an organizer can invite people to leave a guestbook message or a written memory. Approved tributes become the source material for a shared remembrance, synthesized by **Gemma**, checked by the organizer and published with links back to the people’s actual words.

The Week 4 theme gave me a reason to think about what presence means after someone has gone. My interpretation is a place for the memories that remain with other people. The model helps organize those contributions. The contributors and organizer decide what belongs in the story.

There are three real destinations inside the WebGL room: a guestbook at the entrance, a tribute lectern and a memory wall. Selecting an object moves the camera and opens its complete action. Equivalent labeled controls and a 2D view keep those actions available without reliable WebGL.

**Every person, tribute and memorial in this demonstration is fictional.** No real family records or scraped obituaries were used.

## Demo

- **Live app:** [zemne-preview.onrender.com](https://zemne-preview.onrender.com)
- **Submission memorial:** [Mira Vale — fictional demonstration](https://zemne-preview.onrender.com/m/mira-vale-fictional-submission-65cutb)
- **2 minute 50 second walkthrough:** [Watch/download the MP4](https://github.com/9jaDevo/zemne/raw/refs/heads/main/docs/evidence/p8/zemne-walkthrough.mp4). Actual live UI captures, edited into a narrated sequence; not a continuous screen recording. Waiting and navigation are compressed. Narration is locally synthesized, and a single AI-assisted tester supplies all fictional guest voices.
- **Evidence and exact limits:** [P8 live verification](https://github.com/9jaDevo/zemne/blob/main/docs/evidence/p8/README.md), including source-linked publication, permission responses and the original Gemma job record.

![The real WebGL sanctuary on the live Render application](https://raw.githubusercontent.com/9jaDevo/zemne/main/docs/evidence/p8/hall-live-desktop-full.png)

![The actual mobile hall at 390 pixels](https://raw.githubusercontent.com/9jaDevo/zemne/main/docs/evidence/p8/hall-live-mobile390.png)

Judges can explore the public hall without an account. To test the organizer workflow, create a memorial using invented details, save the one-time private link securely, and use the public invitation in a separate guest session. Guests need no registration. Public invitation links are unlisted rather than authenticated private spaces: anyone holding a link can see approved content.

The demonstration uses a free Render service and Google’s unpaid hosted inference. Render may need to wake up; Gemma can be slow or unavailable. An explicit error and retry are part of the real behavior. Nothing substitutes a hand-written story when inference fails. Please use fictional details only: the provider’s unpaid terms permit processing for product improvement and human review.

## Code

**Repository:** [github.com/9jaDevo/zemne](https://github.com/9jaDevo/zemne), MIT licensed.

The public repository was created on October 27, 2026, during the Week 4 window. It contains the application, original modeling script, asset provenance, API contract, tests, measured provider failures and phase handoffs. The README describes setup and the five backend environment variable names. Secret values and private organizer links are excluded.

## How I Built It

The app uses Next.js, React, TypeScript and Tailwind; React Three Fiber and Three.js render the sanctuary. MongoDB Atlas stores memorials, contributions, drafts, moderation states and rate-limit records. Render hosts the web application and its Node backend. **Google AI Studio serves `gemma-4-31b-it` through the Gemini API’s OpenAI-compatible interface.** The application does not self-host or fine-tune the weights.

### How It Works

1. **Create and invite.** A memorial gets a public invitation and a private organizer capability. The private link is shown once. Its fragment is cleared before exchange for a scoped secure session; only a hash of the capability is stored.
2. **Contribute separately.** Guests submit a name, optional relationship and memory, with publication consent. New contributions are pending and absent from public responses.
3. **Moderate.** The organizer approves or rejects each contribution. There is no automatic public posting.
4. **Weave with Gemma.** Only approved tributes are selected. Their database IDs become request-local source aliases; structured contributor-name fields are omitted. Text inside a tribute can still contain personal details, so this is not automatic anonymization.
5. **Validate and review.** The model returns structured paragraphs and source aliases. Runtime schemas and source checks remove or reject invalid references, and heuristic flags surface potentially unsupported details. The organizer can read the cited original text and edit the draft.
6. **Publish deliberately.** Review acknowledgment and an explicit publish action put the remembrance on the memory wall. Public source buttons open genuinely approved tributes. A source link provides traceability, not proof that every sentence is true.

Generation runs as a background job so the web request can return immediately. The current inference budget is 220 seconds, with bounded overload retries and a 300-second client wait cap. The worker remains in the app process; it is not a durable external queue, and a restart can interrupt an unfinished job.

### The room is part of the workflow

I modeled the **Garden of Light** in Blender: an enclosed stone sanctuary with a timber-lined ceiling, rooflight, glazed light court, custom seating and engraved destinations. Its 877 KB GLB contains real geometry and embedded PBR maps. The matching marketing stills come from the same model; the hall itself renders WebGL rather than displaying a substitute room image.

The model has 60,449 triangles across 22 mesh primitives. Its HDR adds roughly 1.62 MB, making the combined asset bodies about 2.49 MB. Those are file-size measurements, not phone frame-rate results. Rendering uses demand frames, a capped pixel ratio and restrained lighting. Physical-device thermal and GPU performance remain an acceptance task.

The ZEMNE mark began as three original vector directions, then one selected negative-space form. SVG lockups, PNG app icons and a favicon share that geometry. The source includes the design reasoning and actual-size icon proof.

## Why Does Open Innovation Matter?

The synthesis layer is built around **Gemma 4’s open weights**, released under Apache-2.0. That gives maintainers an inspectable model family and the possibility of rehosting inference, changing the model or evaluating another compatible endpoint. It matters for a product whose material is people’s memories: future maintainers should have choices about where those words are processed.

This particular build still uses Google’s hosted endpoint. It does not run offline, and an open-weight license does not remove the provider’s data-use conditions. I have not verified an alternative local provider end to end. Keeping that distinction explicit is part of making the project reproducible rather than overstating its privacy.

The application source is MIT licensed. The room, review flow and validation code can be inspected and adapted. Managed Atlas and Render services are useful infrastructure here; using them is not a claim that their hosted platforms are open source.

### Challenges and Test Results

The hardest problem was making failure visible without pretending it had disappeared. Earlier genuine inference runs hit upstream overload responses. A later saved six-scenario batch completed four weaves and failed two safely after bounded retries. Its four successful wall times ranged from **37.3 to 216.9 seconds**, with a median of **109.9 seconds**. That small batch is exploratory evidence, not a promised production success rate or a controlled benchmark.

The audit logs also mattered more than a green headline. A historical live weave exceeded its waiting window; another permission check stopped at a create-rate limit. Both outcomes remain recorded. Backend changes widened the bounded job/client budget and added overload backoff. The frontend shows elapsed time and reassurance without inventing stages or completion percentages.

The consolidated standard test suite passed **207 tests**, with **nine opt-in live tests skipped**, alongside lint, typecheck and a production build. A skipped provider test is not a current inference success. Contract, permission and database integration tests run against actual local MongoDB; current hosted UI and provider checks must be recorded separately.

On October 28 I tested deployed commit **`95992fc`** on Render. Creating the fictional submission memorial, entering one guestbook message and three separate tributes, approving them, weaving, editing and publishing all completed through the real interface. The job record identifies `gemma-4-31b-it` and reports **51.36 seconds** from start to completion. One successful smoke run is not a new reliability benchmark.

I checked each original tribute before publishing. The model had added quotation marks around a paraphrase; I removed that implied direct quotation, saved the draft as version two, and published version three. The public source button opened Jun's exact approved text. The API contained three approved tributes and a published story with all source IDs resolving. Before approval it returned zero guestbook messages and zero tributes. Organizer access returned **200** for the owning session, **403** for another memorial and **401** anonymously. Public responses used `no-store` headers; a scan of ten initial browser scripts found no credential patterns. That bounded scan is not a complete security audit.

The live hall and fallback had no horizontal overflow at the checked 390px and 375px widths. A warm-cache automation observation saw the canvas ready within a **0.742–9.151 second observation interval**; tool scheduling is included, so this is not a precise cold-load benchmark. A timing-tool wait itself failed and is retained in the evidence. Physical-phone GPU/thermal and endurance testing remain open. Fresh lint and typecheck passed; Render built the reviewed revision and its backend startup probe confirmed database access. The earlier synthetic P6 memorial also survived the redeployment.

![A public source link opens the genuinely approved original contribution](https://raw.githubusercontent.com/9jaDevo/zemne/main/docs/evidence/p8/public-source-approved.png)

![Original logo and actual-size favicon preview on light and dark](https://raw.githubusercontent.com/9jaDevo/zemne/main/docs/evidence/p8/favicon-live-detail.png)

Source validation also has limits. A plausible paragraph can cite a valid tribute while still making an unsupported inference. The checks flag suspicious details and enforce allowed sources, but human review is essential. This is a synthetic developer demonstration, not a security-certified or privacy-certified service for real grieving families.

### Attribution and AI assistance

The architectural model, neutral relief artwork and identity are original ZEMNE work. Material maps and HDR lighting are CC0 assets from Poly Haven, with exact URLs and checksums in the repository. Locally hosted Newsreader and DM Sans retain their OFL notices. Next.js, React, Three.js/R3F, Tailwind, TypeScript, Zod, the MongoDB driver and other dependencies retain their upstream licenses.

Codex assisted with frontend, modeling, infrastructure and integration; Claude assisted with the backend, AI and security implementation; Antigravity assisted with browser QA. This write-up was prepared with AI assistance. Human product direction, moderation and publication decisions remain explicit.

Technical sources: [Gemma 4 model card](https://huggingface.co/google/gemma-4-31B-it), [provider terms](https://ai.google.dev/gemini-api/terms), [asset provenance and design](https://github.com/9jaDevo/zemne/blob/main/docs/SANCTUARY_REDESIGN.md), and [recorded technical evidence](https://github.com/9jaDevo/zemne/blob/main/docs/P8_TECHNICAL_EVIDENCE.md).

## Prize Categories

- **Best Use of Gemma:** real source-linked remembrance synthesis from organizer-approved tributes, using hosted `gemma-4-31b-it`.
- **Best Use of Render:** the deployed Next.js interface, Node APIs and in-process inference job runtime.
- **Best Use of MongoDB Atlas:** persistent memorials, pending/approved contributions, drafts, publication state and abuse-control records behind the open-weight AI app.

These claims depend on the working deployment and recorded evidence. No other partner category is claimed. I understand that one submission can qualify for several categories but win only one prize.
