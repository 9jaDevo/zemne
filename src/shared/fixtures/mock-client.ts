/**
 * DEMO mock adapter — in-memory ZemneApiClient for frontend work before the
 * real backend exists (P2). It enforces the same validation, state machine,
 * privacy and session rules as the contract so UI flows behave realistically,
 * but it calls NO AI: weave returns hand-written DEMO paragraphs labelled as such.
 *
 * Never use in production. `isDemo` is true; the UI must show a DEMO badge.
 */
import type { z } from "zod";
import {
  APP_PATHS,
  CreateMemorialRequestSchema,
  GuestbookSubmissionRequestSchema,
  LIMITS,
  ModerationRequestSchema,
  ORGANIZER_COOKIE,
  OrganizerSessionRequestSchema,
  StoryUpdateRequestSchema,
  TributeSubmissionRequestSchema,
  ZemneApiError,
  buildManagePath,
  canApplyStoryAction,
  canModerate,
  makeErrorBody,
  storyStatusAfter,
  zodIssuesToFields,
  type ErrorCode,
  type FieldError,
  type OrganizerSession,
  type StoryView,
  type WeaveFlag,
  type ZemneApiClient,
} from "../api";
import {
  DEMO_WEAVE_PARAGRAPHS,
  createDemoState,
  toOrganizerResponse,
  toPublicResponse,
  type DemoMemorialState,
} from "./demo-memorial";

export interface MockClientOptions {
  /** Artificial latency per call, to exercise loading states. Default 0. */
  latencyMs?: number;
  /** Extra latency for weave, to exercise the long AI loading state. Default = latencyMs. */
  weaveLatencyMs?: number;
  /** Clock override for tests. */
  now?: () => Date;
  /** Start as if the demo organizer already exchanged their link. Default false. */
  startWithDemoSession?: boolean;
}

export interface MockZemneClient extends ZemneApiClient {
  readonly isDemo: true;
  /** The next call (of any method) fails with this error code. */
  simulateNextError(code: ErrorCode): void;
  /** Restore the seeded fixture state and clear the session. */
  reset(): void;
}

export function createMockClient(options: MockClientOptions = {}): MockZemneClient {
  const now = options.now ?? (() => new Date());
  const latency = options.latencyMs ?? 0;
  const weaveLatency = options.weaveLatencyMs ?? latency;

  let memorials = new Map<string, DemoMemorialState>();
  let session: OrganizerSession | null = null;
  let pendingError: ErrorCode | null = null;
  let counter = 0;

  const iso = () => now().toISOString();
  const newId = () => "6de0" + (++counter).toString(16).padStart(20, "0");
  const newToken = () => {
    const n = String(++counter);
    return "zmn_ot_" + "DEMO-ONLY-not-a-real-secret-".padEnd(43 - n.length, "0") + n;
  };
  const newSession = (memorialId: string): OrganizerSession => ({
    memorial_id: memorialId,
    expires_at: new Date(now().getTime() + ORGANIZER_COOKIE.maxAgeSeconds * 1000).toISOString(),
  });

  function seed() {
    const demo = createDemoState();
    memorials = new Map([[demo.memorial.id, demo]]);
    session = options.startWithDemoSession ? newSession(demo.memorial.id) : null;
    pendingError = null;
  }
  seed();

  const fail = (code: ErrorCode, extra: { message?: string; fields?: FieldError[]; retryAfterSeconds?: number } = {}): never => {
    throw new ZemneApiError(makeErrorBody(code, { requestId: `demo-${++counter}`, ...extra }));
  };

  function parse<S extends z.ZodType>(schema: S, input: unknown): z.infer<S> {
    const result = schema.safeParse(input);
    if (!result.success) fail("VALIDATION_FAILED", { fields: zodIssuesToFields(result.error) });
    return result.data as z.infer<S>;
  }

  async function call<T>(fn: () => T, delay = latency): Promise<T> {
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));
    if (pendingError) {
      const code = pendingError;
      pendingError = null;
      fail(code, code === "RATE_LIMITED" ? { retryAfterSeconds: 30 } : code === "VALIDATION_FAILED" ? { fields: [{ path: "", message: "Simulated validation error" }] } : {});
    }
    return structuredClone(fn());
  }

  const bySlug = (slug: string) => [...memorials.values()].find((m) => m.memorial.slug === slug) ?? fail("NOT_FOUND");

  /** Mirrors server authorization: no session -> 401; other memorial -> 404 (no existence oracle). */
  function owned(memorialId: string): DemoMemorialState {
    if (!session || new Date(session.expires_at) <= now()) fail("UNAUTHENTICATED");
    if (session!.memorial_id !== memorialId) fail("NOT_FOUND");
    return memorials.get(memorialId) ?? fail("NOT_FOUND");
  }
  const sessionState = () => owned(session?.memorial_id ?? "");

  const approvedIds = (state: DemoMemorialState) => new Set(state.tributes.filter((t) => t.status === "approved").map((t) => t.id));

  function checkSources(state: DemoMemorialState, paragraphs: { source_tribute_ids: string[] }[]) {
    const approved = approvedIds(state);
    const fields: FieldError[] = [];
    paragraphs.forEach((p, i) =>
      p.source_tribute_ids.forEach((id, j) => {
        if (!approved.has(id)) fields.push({ path: `paragraphs.${i}.source_tribute_ids.${j}`, message: "Not an approved tribute of this memorial" });
      }),
    );
    if (fields.length) fail("STORY_SOURCES_INVALID", { fields });
  }

  const receipt = (kind: "guestbook" | "tribute", id: string, submitted_at: string) => ({
    receipt: { id, kind, status: "pending" as const, submitted_at },
    message:
      kind === "tribute"
        ? "Thank you. Your tribute was received and will appear after the family approves it."
        : "Thank you for signing. Your message will appear after the family approves it.",
  });

  return {
    isDemo: true,

    simulateNextError(code) {
      pendingError = code;
    },

    reset: seed,

    health: () => call(() => ({ status: "ok" as const, checks: { database: "ok" as const, ai: "unconfigured" as const } })),

    createMemorial: (input) =>
      call(() => {
        const data = parse(CreateMemorialRequestSchema, input);
        const id = newId();
        const base = data.name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "memorial";
        const slug = `${base}-${id.slice(-6)}`;
        const token = newToken();
        const ts = iso();
        const state: DemoMemorialState = {
          memorial: {
            id,
            slug,
            guest_path: APP_PATHS.guest(slug),
            name: data.name,
            birth_year: data.birth_year ?? null,
            death_year: data.death_year ?? null,
            description: data.description,
            portrait: data.portrait_key ? { kind: "placeholder", key: data.portrait_key } : null,
            visibility: "unlisted",
            created_at: ts,
            updated_at: ts,
          },
          token,
          guestbook: [],
          tributes: [],
          stories: [],
        };
        memorials.set(id, state);
        session = newSession(id);
        return {
          memorial_id: id,
          memorial: toPublicResponse(state).memorial,
          guest_path: state.memorial.guest_path,
          manage_path: buildManagePath(id, token),
          organizer_token: token,
          session,
        };
      }),

    getPublicMemorial: (slug) => call(() => toPublicResponse(bySlug(slug))),

    submitGuestbookEntry: (slug, input) =>
      call(() => {
        const state = bySlug(slug);
        const data = parse(GuestbookSubmissionRequestSchema, input);
        const id = newId();
        const ts = iso();
        if (data.website) return receipt("guestbook", id, ts); // honeypot: pretend, store nothing
        state.guestbook.unshift({
          id,
          display_name: data.display_name,
          message: data.message,
          status: "pending",
          moderation_hints: /https?:\/\/|www\./i.test(data.message) ? ["contains_link"] : [],
          created_at: ts,
          moderated_at: null,
        });
        return receipt("guestbook", id, ts);
      }),

    submitTribute: (slug, input) =>
      call(() => {
        const state = bySlug(slug);
        const data = parse(TributeSubmissionRequestSchema, input);
        const id = newId();
        const ts = iso();
        if (data.website) return receipt("tribute", id, ts);
        state.tributes.unshift({
          id,
          contributor_name: data.contributor_name,
          relationship: data.relationship ?? null,
          content: data.content,
          status: "pending",
          moderation_hints: /https?:\/\/|www\./i.test(data.content) ? ["contains_link"] : [],
          created_at: ts,
          moderated_at: null,
        });
        return receipt("tribute", id, ts);
      }),

    exchangeOrganizerToken: (input) =>
      call(() => {
        const data = parse(OrganizerSessionRequestSchema, input);
        const state = memorials.get(data.memorial_id);
        // Same error for unknown memorial and wrong token.
        if (!state || state.token !== data.token) fail("INVALID_ORGANIZER_TOKEN");
        session = newSession(data.memorial_id);
        return { session };
      }),

    getOrganizerSession: () =>
      call(() => {
        if (!session || new Date(session.expires_at) <= now()) fail("UNAUTHENTICATED");
        return { session: session! };
      }),

    endOrganizerSession: () =>
      call(() => {
        session = null;
      }),

    getOrganizerMemorial: (memorialId) => call(() => toOrganizerResponse(owned(memorialId))),

    rotateOrganizerToken: (memorialId) =>
      call(() => {
        const state = owned(memorialId);
        state.token = newToken();
        session = newSession(memorialId);
        return { manage_path: buildManagePath(memorialId, state.token), organizer_token: state.token, session };
      }),

    moderateGuestbookEntry: (entryId, input) =>
      call(() => {
        const { status } = parse(ModerationRequestSchema, input);
        const state = sessionState();
        const entry = state.guestbook.find((g) => g.id === entryId) ?? fail("NOT_FOUND");
        if (!canModerate(entry.status, status)) fail("INVALID_STATE_TRANSITION");
        if (entry.status !== status) {
          entry.status = status;
          entry.moderated_at = iso();
        }
        return { entry };
      }),

    moderateTribute: (tributeId, input) =>
      call(() => {
        const { status } = parse(ModerationRequestSchema, input);
        const state = sessionState();
        const tribute = state.tributes.find((t) => t.id === tributeId) ?? fail("NOT_FOUND");
        if (!canModerate(tribute.status, status)) fail("INVALID_STATE_TRANSITION");
        let unpublished_story_id: string | null = null;
        if (tribute.status !== status) {
          const ts = iso();
          tribute.status = status;
          tribute.moderated_at = ts;
          if (status === "rejected") {
            // Withdrawing a cited tribute withdraws the published story that cites it.
            const story = state.stories.find(
              (s) => s.status === "published" && s.paragraphs.some((p) => p.source_tribute_ids.includes(tributeId)),
            );
            if (story) {
              story.status = "draft";
              story.published_at = null;
              story.version += 1;
              story.updated_at = ts;
              unpublished_story_id = story.id;
            }
          }
        }
        return { tribute, side_effects: { unpublished_story_id } };
      }),

    weaveStory: (memorialId) =>
      call(() => {
        const state = owned(memorialId);
        const approved = state.tributes.filter((t) => t.status === "approved").reverse(); // oldest first
        if (approved.length === 0) fail("NO_APPROVED_TRIBUTES");
        const used = approved.slice(0, LIMITS.storyParagraphs.max);
        const flags: WeaveFlag[] =
          used.length < 3
            ? [{ code: "insufficient_material", origin: "model", paragraph_index: null, message: "[DEMO] Fewer than three approved tributes; the remembrance may feel thin.", source_tribute_ids: [] }]
            : [];
        const ts = iso();
        const story: StoryView = {
          id: newId(),
          memorial_id: memorialId,
          status: "draft",
          version: 1,
          title: `[DEMO] Remembering ${state.memorial.name.split(" ")[0]}`,
          paragraphs: used.map((t) => ({
            text:
              DEMO_WEAVE_PARAGRAPHS[t.id] ??
              `[DEMO placeholder — no AI was called] Gemma would weave the tribute from ${t.contributor_name} into this paragraph.`,
            source_tribute_ids: [t.id],
          })),
          flags,
          input_tribute_ids: approved.map((t) => t.id),
          ai: { model_id: "DEMO-MOCK (no model called)", provider_label: "DEMO mock adapter — not Gemma output" },
          edited_by_organizer: false,
          created_at: ts,
          updated_at: ts,
          published_at: null,
        };
        state.stories.unshift(story);
        state.stories = state.stories.slice(0, LIMITS.organizerStoryCap);
        return { story };
      }, weaveLatency),

    updateStory: (storyId, input) =>
      call(() => {
        const req = parse(StoryUpdateRequestSchema, input);
        const state = sessionState();
        const story = state.stories.find((s) => s.id === storyId) ?? fail("NOT_FOUND");
        if (req.version !== story.version) fail("VERSION_CONFLICT");
        if (!canApplyStoryAction(story.status, req.action)) fail("INVALID_STATE_TRANSITION");
        const ts = iso();
        let superseded_story_id: string | null = null;

        if (req.action === "edit") {
          if (req.paragraphs) checkSources(state, req.paragraphs);
          if (story.status === "published" && !req.paragraphs) checkSources(state, story.paragraphs);
          if (req.title !== undefined) story.title = req.title;
          if (req.paragraphs) story.paragraphs = req.paragraphs;
          story.edited_by_organizer = true;
        } else if (req.action === "publish") {
          checkSources(state, story.paragraphs);
          const previous = state.stories.find((s) => s.status === "published");
          if (previous) {
            previous.status = "draft";
            previous.published_at = null;
            previous.version += 1;
            previous.updated_at = ts;
            superseded_story_id = previous.id;
          }
          story.published_at = ts;
        } else {
          story.published_at = null;
        }
        story.status = storyStatusAfter(story.status, req.action);
        story.version += 1;
        story.updated_at = ts;
        return { story, side_effects: { superseded_story_id } };
      }),
  };
}
