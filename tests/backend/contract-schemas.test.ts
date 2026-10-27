import { describe, expect, it } from "vitest";
import {
  API_ROUTES,
  ApiErrorBodySchema,
  CreateMemorialRequestSchema,
  ERROR_STATUS,
  GuestbookSubmissionRequestSchema,
  ModerationRequestSchema,
  OrganizerSessionRequestSchema,
  PublicMemorialResponseSchema,
  PublicTributeSchema,
  StoryUpdateRequestSchema,
  TributeSubmissionRequestSchema,
  WeaveRequestSchema,
  ZemneApiError,
  buildManagePath,
  canApplyStoryAction,
  canModerate,
  makeErrorBody,
  parseManageFragment,
  storyStatusAfter,
  zodIssuesToFields,
} from "../../src/shared/api";
import { DEMO_IDS, DEMO_ORGANIZER_TOKEN, demoPublicMemorialResponse } from "../../src/shared/fixtures";

const validCreate = {
  name: "  Elowen   Marsh ",
  birth_year: 1941,
  death_year: 2025,
  description: "A fictional memorial.",
  privacy_acknowledged: true,
};

describe("request schemas", () => {
  it("normalizes plain text: trims, collapses whitespace, strips control/bidi characters", () => {
    const out = CreateMemorialRequestSchema.parse({
      ...validCreate,
      description: "Line one‮\r\n\r\n\r\n\r\nLine\u0007 two​  ",
    });
    expect(out.name).toBe("Elowen Marsh");
    expect(out.description).toBe("Line one\n\nLine two");
  });

  it("keeps HTML-looking input as inert plain text (never interpreted)", () => {
    const out = GuestbookSubmissionRequestSchema.parse({
      display_name: "<img src=x onerror=alert(1)>",
      message: "<script>alert('x')</script>",
      consent: true,
    });
    expect(out.message).toBe("<script>alert('x')</script>");
  });

  it("rejects client-supplied status or other unknown fields", () => {
    const r = TributeSubmissionRequestSchema.safeParse({
      contributor_name: "Guest",
      content: "A memory that is long enough.",
      consent: true,
      status: "approved",
    });
    expect(r.success).toBe(false);
    expect(GuestbookSubmissionRequestSchema.safeParse({ display_name: "G", message: "m", consent: true, id: DEMO_IDS.memorial }).success).toBe(false);
  });

  it("requires affirmative consent and privacy acknowledgment", () => {
    expect(GuestbookSubmissionRequestSchema.safeParse({ display_name: "G", message: "m", consent: false }).success).toBe(false);
    expect(GuestbookSubmissionRequestSchema.safeParse({ display_name: "G", message: "m" }).success).toBe(false);
    expect(CreateMemorialRequestSchema.safeParse({ ...validCreate, privacy_acknowledged: false }).success).toBe(false);
  });

  it("enforces length limits after normalization", () => {
    expect(TributeSubmissionRequestSchema.safeParse({ contributor_name: "G", content: "   short   ", consent: true }).success).toBe(false);
    expect(TributeSubmissionRequestSchema.safeParse({ contributor_name: "G", content: "x".repeat(2001), consent: true }).success).toBe(false);
    expect(GuestbookSubmissionRequestSchema.safeParse({ display_name: "   ", message: "m", consent: true }).success).toBe(false);
  });

  it("turns a blank relationship into null", () => {
    const out = TributeSubmissionRequestSchema.parse({ contributor_name: "G", relationship: "   ", content: "A memory that is long enough.", consent: true });
    expect(out.relationship).toBeNull();
  });

  it("validates years", () => {
    expect(CreateMemorialRequestSchema.safeParse({ ...validCreate, birth_year: 2000, death_year: 1990 }).success).toBe(false);
    expect(CreateMemorialRequestSchema.safeParse({ ...validCreate, death_year: new Date().getUTCFullYear() + 1 }).success).toBe(false);
    expect(CreateMemorialRequestSchema.safeParse({ ...validCreate, birth_year: 1799 }).success).toBe(false);
    expect(CreateMemorialRequestSchema.safeParse({ ...validCreate, birth_year: null, death_year: undefined }).success).toBe(true);
  });

  it("accepts the honeypot field so bots get a normal-looking response", () => {
    expect(GuestbookSubmissionRequestSchema.parse({ display_name: "G", message: "m", consent: true, website: "spam.example" }).website).toBe("spam.example");
  });

  it("validates organizer token format", () => {
    expect(OrganizerSessionRequestSchema.safeParse({ memorial_id: DEMO_IDS.memorial, token: DEMO_ORGANIZER_TOKEN }).success).toBe(true);
    expect(OrganizerSessionRequestSchema.safeParse({ memorial_id: DEMO_IDS.memorial, token: "zmn_ot_short" }).success).toBe(false);
    expect(OrganizerSessionRequestSchema.safeParse({ memorial_id: "not-an-id", token: DEMO_ORGANIZER_TOKEN }).success).toBe(false);
  });

  it("only allows approved/rejected as moderation targets", () => {
    expect(ModerationRequestSchema.safeParse({ status: "approved" }).success).toBe(true);
    expect(ModerationRequestSchema.safeParse({ status: "pending" }).success).toBe(false);
  });

  it("weave takes no options (client cannot pick source ids)", () => {
    expect(WeaveRequestSchema.safeParse({}).success).toBe(true);
    expect(WeaveRequestSchema.safeParse({ tribute_ids: [DEMO_IDS.tributes.guestA] }).success).toBe(false);
  });

  it("story update is a discriminated union with version and source rules", () => {
    expect(StoryUpdateRequestSchema.safeParse({ action: "publish", version: 1 }).success).toBe(true);
    expect(StoryUpdateRequestSchema.safeParse({ action: "publish" }).success).toBe(false);
    expect(StoryUpdateRequestSchema.safeParse({ action: "edit", version: 1 }).success).toBe(false);
    expect(StoryUpdateRequestSchema.safeParse({ action: "edit", version: 1, paragraphs: [{ text: "t", source_tribute_ids: [] }] }).success).toBe(false);
    const dup = DEMO_IDS.tributes.guestA;
    expect(StoryUpdateRequestSchema.safeParse({ action: "edit", version: 1, paragraphs: [{ text: "t", source_tribute_ids: [dup, dup] }] }).success).toBe(false);
    expect(StoryUpdateRequestSchema.safeParse({ action: "delete", version: 1 }).success).toBe(false);
  });
});

describe("response schemas guard public serialization", () => {
  it("reject leaked internal fields", () => {
    const leaked = structuredClone(demoPublicMemorialResponse) as Record<string, unknown> & { memorial: Record<string, unknown> };
    leaked.memorial.owner_token_hash = "abc";
    expect(PublicMemorialResponseSchema.safeParse(leaked).success).toBe(false);
    const tribute = { ...demoPublicMemorialResponse.tributes[0], status: "pending" };
    expect(PublicTributeSchema.safeParse(tribute).success).toBe(false);
  });

  it("reject a public story that cites a non-visible tribute", () => {
    const bad = structuredClone(demoPublicMemorialResponse);
    bad.tributes = bad.tributes.filter((t) => t.id !== DEMO_IDS.tributes.guestA);
    const r = PublicMemorialResponseSchema.safeParse(bad);
    expect(r.success).toBe(false);
  });
});

describe("error envelope", () => {
  it("maps every code to an HTTP status and builds valid bodies", () => {
    for (const code of Object.keys(ERROR_STATUS) as (keyof typeof ERROR_STATUS)[]) {
      const body = makeErrorBody(code, {
        requestId: "r1",
        retryAfterSeconds: code === "RATE_LIMITED" ? 5 : undefined,
        fields: code === "VALIDATION_FAILED" ? [{ path: "x", message: "bad" }] : undefined,
      });
      expect(ApiErrorBodySchema.safeParse(body).success, code).toBe(true);
      expect(new ZemneApiError(body).status).toBe(ERROR_STATUS[code]);
    }
  });

  it("requires retry_after_seconds on RATE_LIMITED and fields on VALIDATION_FAILED", () => {
    expect(ApiErrorBodySchema.safeParse(makeErrorBody("RATE_LIMITED", { requestId: "r" })).success).toBe(false);
    expect(ApiErrorBodySchema.safeParse(makeErrorBody("VALIDATION_FAILED", { requestId: "r" })).success).toBe(false);
  });

  it("marks AI failures retryable and auth failures not", () => {
    expect(makeErrorBody("AI_UNAVAILABLE", { requestId: "r" }).error.retryable).toBe(true);
    expect(makeErrorBody("UNAUTHENTICATED", { requestId: "r" }).error.retryable).toBe(false);
  });

  it("converts zod issues to dotted field paths", () => {
    const r = StoryUpdateRequestSchema.safeParse({ action: "edit", version: 1, paragraphs: [{ text: "", source_tribute_ids: ["x"] }] });
    expect(r.success).toBe(false);
    const paths = zodIssuesToFields(r.error!).map((f) => f.path);
    expect(paths).toContain("paragraphs.0.source_tribute_ids.0");
  });
});

describe("routes and organizer link", () => {
  it("builds the frozen route names and encodes segments", () => {
    expect(API_ROUTES.publicMemorial("a-b")).toBe("/api/memorials/a-b");
    expect(API_ROUTES.weave(DEMO_IDS.memorial)).toBe(`/api/organizer/memorials/${DEMO_IDS.memorial}/weave`);
    expect(API_ROUTES.guestbook("../x")).toBe("/api/memorials/..%2Fx/guestbook");
  });

  it("round-trips the fragment-delivered secret and rejects malformed keys", () => {
    const path = buildManagePath(DEMO_IDS.memorial, DEMO_ORGANIZER_TOKEN);
    expect(path).toBe(`/manage/${DEMO_IDS.memorial}#key=${DEMO_ORGANIZER_TOKEN}`);
    expect(parseManageFragment(path.slice(path.indexOf("#")))).toBe(DEMO_ORGANIZER_TOKEN);
    expect(parseManageFragment("")).toBeNull();
    expect(parseManageFragment("#key=nope")).toBeNull();
    expect(parseManageFragment("#other=1")).toBeNull();
  });
});

describe("state machines", () => {
  it("contribution moderation never returns to pending; same-state is idempotent", () => {
    expect(canModerate("pending", "approved")).toBe(true);
    expect(canModerate("approved", "rejected")).toBe(true);
    expect(canModerate("rejected", "approved")).toBe(true);
    expect(canModerate("approved", "approved")).toBe(true);
  });

  it("story actions follow draft <-> published", () => {
    expect(canApplyStoryAction("draft", "publish")).toBe(true);
    expect(canApplyStoryAction("draft", "unpublish")).toBe(false);
    expect(canApplyStoryAction("published", "publish")).toBe(false);
    expect(storyStatusAfter("draft", "publish")).toBe("published");
    expect(storyStatusAfter("published", "unpublish")).toBe("draft");
    expect(storyStatusAfter("published", "edit")).toBe("published");
    expect(() => storyStatusAfter("draft", "unpublish")).toThrow();
  });
});
