import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { z } from "zod";
import * as api from "../../src/shared/api";

const doc = readFileSync("docs/API_CONTRACT.md", "utf8");

const SCHEMAS: Record<string, z.ZodType> = {
  ApiErrorBody: api.ApiErrorBodySchema,
  CreateMemorialRequest: api.CreateMemorialRequestSchema,
  CreateMemorialResponse: api.CreateMemorialResponseSchema,
  GuestbookSubmissionRequest: api.GuestbookSubmissionRequestSchema,
  HealthResponse: api.HealthResponseSchema,
  ModerateGuestbookResponse: api.ModerateGuestbookResponseSchema,
  ModerateTributeResponse: api.ModerateTributeResponseSchema,
  OrganizerMemorialResponse: api.OrganizerMemorialResponseSchema,
  RotateTokenResponse: api.RotateTokenResponseSchema,
  StoryUpdateResponse: api.StoryUpdateResponseSchema,
  ModerationRequest: api.ModerationRequestSchema,
  OrganizerSessionRequest: api.OrganizerSessionRequestSchema,
  OrganizerSessionResponse: api.OrganizerSessionResponseSchema,
  PublicMemorialResponse: api.PublicMemorialResponseSchema,
  StoryUpdateRequest: api.StoryUpdateRequestSchema,
  StoryView: api.StoryViewSchema,
  SubmissionReceiptResponse: api.SubmissionReceiptResponseSchema,
  TributeSubmissionRequest: api.TributeSubmissionRequestSchema,
};

const examples = [...doc.matchAll(/<!-- schema: (\w+) -->\s*```json\s*([\s\S]*?)```/g)].map((m) => ({ name: m[1], body: m[2] }));

describe("docs/API_CONTRACT.md", () => {
  it("contains tagged JSON examples", () => {
    expect(examples.length).toBeGreaterThanOrEqual(15);
  });

  it.each(examples.map((e, i) => [`${i}:${e.name}`, e] as const))("example %s matches its schema", (_label, e) => {
    const schema = SCHEMAS[e.name];
    expect(schema, `unknown schema tag ${e.name}`).toBeDefined();
    const result = schema.safeParse(JSON.parse(e.body));
    expect(result.success, result.success ? "" : JSON.stringify(result.error.issues)).toBe(true);
  });

  it("documents every route the client uses and every error code", () => {
    const routes = Object.values(api.API_ROUTES).map((build) => (build as (x: string) => string)("PARAM").replace("PARAM", ":x"));
    const normalized = doc.replace(/:(slug|id)\b/g, ":x");
    for (const r of routes) expect(normalized, r).toContain(r);
    for (const code of api.ERROR_CODES) expect(doc, code).toContain(`\`${code}\``);
  });

  it("documents the cookie attributes and token format exactly as implemented", () => {
    expect(doc).toContain(`${api.ORGANIZER_COOKIE.production}=<value>; Path=/; Max-Age=${api.ORGANIZER_COOKIE.maxAgeSeconds}; HttpOnly; Secure; SameSite=Strict`);
    expect(doc).toContain("^zmn_ot_[A-Za-z0-9_-]{43}$");
  });
});
