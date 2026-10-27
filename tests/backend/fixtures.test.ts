import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ApiErrorBodySchema,
  CreateMemorialResponseSchema,
  ERROR_CODES,
  ERROR_STATUS,
  GuestbookSubmissionRequestSchema,
  OrganizerMemorialResponseSchema,
  PublicMemorialResponseSchema,
  TributeSubmissionRequestSchema,
} from "../../src/shared/api";
import {
  DEMO_IDS,
  DEMO_ORGANIZER_TOKEN,
  FIXTURE_NOTICE,
  createDemoState,
  demoCreateMemorialResponse,
  demoEmptyPublicMemorialResponse,
  demoErrorExamples,
  demoOrganizerMemorialResponse,
  demoPersonas,
  demoPublicMemorialResponse,
} from "../../src/shared/fixtures";

const FORBIDDEN_PUBLIC_KEYS = [
  "owner_token_hash",
  "owner_token_version",
  "organizer_token",
  "token",
  "status",
  "consent",
  "moderation_hints",
  "moderated_at",
  "flags",
  "ip_hash",
  "version",
  "input_tribute_ids",
];

function allKeys(value: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((v) => allKeys(v, out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      out.add(k);
      allKeys(v, out);
    }
  }
  return out;
}

describe("synthetic fixture", () => {
  it("is clearly labelled as synthetic test data", () => {
    expect(FIXTURE_NOTICE).toMatch(/SYNTHETIC TEST DATA/);
    const source = readFileSync("src/shared/fixtures/demo-memorial.ts", "utf8");
    expect(source).toMatch(/SYNTHETIC TEST DATA — NOT REAL PEOPLE, NOT REAL TESTIMONIALS/);
    expect(demoPublicMemorialResponse.story?.title).toMatch(/^\[DEMO\]/);
    expect(demoPublicMemorialResponse.story?.ai.model_id).toMatch(/DEMO/);
  });

  it("has one memorial and exactly three distinct fictional guest personas with valid submissions", () => {
    expect(demoPersonas).toHaveLength(3);
    expect(new Set(demoPersonas.map((p) => p.guestbook.display_name)).size).toBe(3);
    for (const p of demoPersonas) {
      expect(GuestbookSubmissionRequestSchema.safeParse(p.guestbook).success).toBe(true);
      expect(TributeSubmissionRequestSchema.safeParse(p.tribute).success).toBe(true);
    }
  });

  it("uses a fake organizer token that is obviously not a secret", () => {
    expect(DEMO_ORGANIZER_TOKEN).toMatch(/^zmn_ot_DEMO-ONLY-not-a-real-secret-0+$/);
  });

  it("validates every response fixture against its schema", () => {
    expect(PublicMemorialResponseSchema.parse(demoPublicMemorialResponse)).toBeTruthy();
    expect(PublicMemorialResponseSchema.parse(demoEmptyPublicMemorialResponse)).toBeTruthy();
    expect(OrganizerMemorialResponseSchema.parse(demoOrganizerMemorialResponse)).toBeTruthy();
    expect(CreateMemorialResponseSchema.parse(demoCreateMemorialResponse)).toBeTruthy();
  });

  it("provides a valid error example for every error code", () => {
    for (const code of ERROR_CODES) {
      const body = demoErrorExamples[code];
      expect(ApiErrorBodySchema.safeParse(body).success, code).toBe(true);
      expect(body.error.code).toBe(code);
      expect(ERROR_STATUS[code]).toBeGreaterThanOrEqual(400);
    }
  });
});

describe("fixture privacy invariants", () => {
  it("public view contains only approved contributions", () => {
    const state = createDemoState();
    const approvedTributes = state.tributes.filter((t) => t.status === "approved").map((t) => t.id);
    const approvedEntries = state.guestbook.filter((g) => g.status === "approved").map((g) => g.id);
    expect(demoPublicMemorialResponse.tributes.map((t) => t.id).sort()).toEqual(approvedTributes.sort());
    expect(demoPublicMemorialResponse.guestbook.map((g) => g.id).sort()).toEqual(approvedEntries.sort());
    const publicJson = JSON.stringify(demoPublicMemorialResponse);
    expect(publicJson).not.toContain(DEMO_IDS.tributes.guestC);
    expect(publicJson).not.toContain(DEMO_IDS.guestbook.guestC);
    expect(publicJson).not.toContain(DEMO_IDS.guestbook.guestBDuplicate);
    expect(publicJson).not.toContain("sing to one person I loved"); // pending tribute text
  });

  it("public view exposes no internal or secret keys", () => {
    const keys = allKeys(demoPublicMemorialResponse);
    for (const k of FORBIDDEN_PUBLIC_KEYS) expect(keys.has(k), k).toBe(false);
    expect(JSON.stringify(demoPublicMemorialResponse)).not.toContain(DEMO_ORGANIZER_TOKEN);
  });

  it("organizer view exposes contribution status but never the token or its hash", () => {
    const keys = allKeys(demoOrganizerMemorialResponse);
    expect(keys.has("status")).toBe(true);
    expect(keys.has("owner_token_hash")).toBe(false);
    expect(JSON.stringify(demoOrganizerMemorialResponse)).not.toContain(DEMO_ORGANIZER_TOKEN);
  });

  it("published story cites only approved tributes, and organizer counts match", () => {
    const approved = new Set(demoOrganizerMemorialResponse.tributes.filter((t) => t.status === "approved").map((t) => t.id));
    for (const p of demoPublicMemorialResponse.story!.paragraphs) {
      for (const id of p.source_tribute_ids) expect(approved.has(id)).toBe(true);
    }
    expect(demoOrganizerMemorialResponse.counts).toEqual({
      guestbook: { pending: 1, approved: 2, rejected: 1 },
      tributes: { pending: 1, approved: 2, rejected: 0 },
    });
    expect(demoOrganizerMemorialResponse.published_story_id).toBe(DEMO_IDS.story);
  });
});
