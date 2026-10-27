import { beforeEach, describe, expect, it } from "vitest";
import {
  CreateMemorialResponseSchema,
  ModerateTributeResponseSchema,
  OrganizerMemorialResponseSchema,
  PublicMemorialResponseSchema,
  StoryUpdateResponseSchema,
  SubmissionReceiptResponseSchema,
  WeaveResponseSchema,
  ZemneApiError,
  parseManageFragment,
  type ErrorCode,
} from "../../src/shared/api";
import { DEMO_IDS, DEMO_ORGANIZER_TOKEN, DEMO_SLUG, createMockClient, demoPersonas, type MockZemneClient } from "../../src/shared/fixtures";

async function expectCode(promise: Promise<unknown>, code: ErrorCode) {
  const err = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(ZemneApiError);
  expect((err as ZemneApiError).code).toBe(code);
}

const login = (client: MockZemneClient) =>
  client.exchangeOrganizerToken({ memorial_id: DEMO_IDS.memorial, token: DEMO_ORGANIZER_TOKEN });

describe("DEMO mock client follows the contract", () => {
  let client: MockZemneClient;
  beforeEach(() => {
    client = createMockClient({ now: () => new Date("2026-10-27T12:00:00.000Z") });
  });

  it("identifies itself as demo", () => {
    expect(client.isDemo).toBe(true);
  });

  it("runs the core acceptance journey end-to-end with contract-valid responses", async () => {
    // Organizer creates a memorial and receives links.
    const created = CreateMemorialResponseSchema.parse(
      await client.createMemorial({ name: "Test Person", description: "Fictional.", privacy_acknowledged: true }),
    );
    expect(parseManageFragment(created.manage_path.slice(created.manage_path.indexOf("#")))).toBe(created.organizer_token);
    const slug = created.memorial.slug;

    // Three guests submit; everything stays pending and private.
    for (const p of demoPersonas) {
      SubmissionReceiptResponseSchema.parse(await client.submitGuestbookEntry(slug, p.guestbook));
      SubmissionReceiptResponseSchema.parse(await client.submitTribute(slug, p.tribute));
    }
    const before = PublicMemorialResponseSchema.parse(await client.getPublicMemorial(slug));
    expect(before.guestbook).toHaveLength(0);
    expect(before.tributes).toHaveLength(0);

    // Organizer approves all tributes and weaves.
    const console1 = OrganizerMemorialResponseSchema.parse(await client.getOrganizerMemorial(created.memorial_id));
    expect(console1.counts.tributes.pending).toBe(3);
    for (const t of console1.tributes) await client.moderateTribute(t.id, { status: "approved" });
    const { story } = WeaveResponseSchema.parse(await client.weaveStory(created.memorial_id));
    const weaveState = await client.getWeaveStatus(created.memorial_id);
    expect(weaveState).toMatchObject({ job: { status: "succeeded", story_id: story.id }, story: { id: story.id } });
    expect(story.status).toBe("draft");
    expect(story.ai.model_id).toMatch(/DEMO/);
    expect(story.input_tribute_ids).toHaveLength(3);

    // Not public until published.
    expect((await client.getPublicMemorial(slug)).story).toBeNull();
    const published = StoryUpdateResponseSchema.parse(await client.updateStory(story.id, { action: "publish", version: story.version }));
    const after = PublicMemorialResponseSchema.parse(await client.getPublicMemorial(slug));
    expect(after.story?.id).toBe(published.story.id);
    expect(after.tributes).toHaveLength(3);
    expect(after.guestbook).toHaveLength(0); // guestbook still pending
  });

  it("hides pending fixture content publicly and reveals it only after approval", async () => {
    const pub = await client.getPublicMemorial(DEMO_SLUG);
    expect(pub.tributes.map((t) => t.id)).not.toContain(DEMO_IDS.tributes.guestC);
    await login(client);
    await client.moderateTribute(DEMO_IDS.tributes.guestC, { status: "approved" });
    const pub2 = await client.getPublicMemorial(DEMO_SLUG);
    expect(pub2.tributes.map((t) => t.id)).toContain(DEMO_IDS.tributes.guestC);
  });

  it("requires a session for organizer routes and rejects wrong tokens without an existence oracle", async () => {
    await expectCode(client.getOrganizerMemorial(DEMO_IDS.memorial), "UNAUTHENTICATED");
    await expectCode(client.getOrganizerSession(), "UNAUTHENTICATED");
    const wrong = "zmn_ot_" + "x".repeat(43);
    await expectCode(client.exchangeOrganizerToken({ memorial_id: DEMO_IDS.memorial, token: wrong }), "INVALID_ORGANIZER_TOKEN");
    await expectCode(client.exchangeOrganizerToken({ memorial_id: "65d0000000000000000000ee", token: DEMO_ORGANIZER_TOKEN }), "INVALID_ORGANIZER_TOKEN");
    await login(client);
    expect((await client.getOrganizerSession()).session.expires_at).toBe("2026-10-28T00:00:00.000Z");
    await client.endOrganizerSession();
    await expectCode(client.getOrganizerMemorial(DEMO_IDS.memorial), "UNAUTHENTICATED");
  });

  it("returns 403 for another memorial and 404 for its items", async () => {
    await client.createMemorial({ name: "Other", description: "Fictional.", privacy_acknowledged: true }); // session now for the new memorial
    await expectCode(client.getOrganizerMemorial(DEMO_IDS.memorial), "FORBIDDEN");
    await expectCode(client.moderateTribute(DEMO_IDS.tributes.guestA, { status: "rejected" }), "NOT_FOUND");
  });

  it("expires sessions after 12 hours", async () => {
    let now = new Date("2026-10-27T12:00:00.000Z");
    const c = createMockClient({ now: () => now });
    await login(c);
    now = new Date("2026-10-28T00:00:01.000Z");
    await expectCode(c.getOrganizerMemorial(DEMO_IDS.memorial), "UNAUTHENTICATED");
  });

  it("rejecting a cited tribute unpublishes the story", async () => {
    await login(client);
    const res = ModerateTributeResponseSchema.parse(await client.moderateTribute(DEMO_IDS.tributes.guestA, { status: "rejected" }));
    expect(res.side_effects.unpublished_story_id).toBe(DEMO_IDS.story);
    const pub = PublicMemorialResponseSchema.parse(await client.getPublicMemorial(DEMO_SLUG));
    expect(pub.story).toBeNull();
    expect(pub.tributes.map((t) => t.id)).not.toContain(DEMO_IDS.tributes.guestA);
    // Republishing is blocked until the citation is fixed.
    const org = await client.getOrganizerMemorial(DEMO_IDS.memorial);
    const story = org.stories.find((s) => s.id === DEMO_IDS.story)!;
    await expectCode(client.updateStory(story.id, { action: "publish", version: story.version }), "STORY_SOURCES_INVALID");
  });

  it("enforces versions, transitions and approved-only sources on story edits", async () => {
    await login(client);
    const org = await client.getOrganizerMemorial(DEMO_IDS.memorial);
    const story = org.stories[0];
    await expectCode(client.updateStory(story.id, { action: "unpublish", version: story.version - 1 }), "VERSION_CONFLICT");
    await expectCode(client.updateStory(story.id, { action: "publish", version: story.version }), "INVALID_STATE_TRANSITION");
    await expectCode(
      client.updateStory(story.id, { action: "edit", version: story.version, paragraphs: [{ text: "x", source_tribute_ids: [DEMO_IDS.tributes.guestC] }] }),
      "STORY_SOURCES_INVALID",
    );
    const edited = await client.updateStory(story.id, { action: "edit", version: story.version, title: "Remembering Elowen" });
    expect(edited.story.version).toBe(story.version + 1);
    expect(edited.story.edited_by_organizer).toBe(true);
  });

  it("publishing a new draft supersedes the previous published story", async () => {
    await login(client);
    const { story } = await client.weaveStory(DEMO_IDS.memorial);
    const res = await client.updateStory(story.id, { action: "publish", version: story.version });
    expect(res.side_effects.superseded_story_id).toBe(DEMO_IDS.story);
    const org = OrganizerMemorialResponseSchema.parse(await client.getOrganizerMemorial(DEMO_IDS.memorial));
    expect(org.stories.filter((s) => s.status === "published")).toHaveLength(1);
    expect(org.published_story_id).toBe(story.id);
  });

  it("weave refuses when nothing is approved", async () => {
    const created = await client.createMemorial({ name: "Empty", description: "Fictional.", privacy_acknowledged: true });
    await expectCode(client.weaveStory(created.memorial_id), "NO_APPROVED_TRIBUTES");
  });

  it("returns field errors for invalid input and silently drops honeypot submissions", async () => {
    const err = await client.submitTribute(DEMO_SLUG, { contributor_name: "", content: "short", consent: true }).catch((e) => e);
    expect(err).toBeInstanceOf(ZemneApiError);
    expect(err.code).toBe("VALIDATION_FAILED");
    expect((err as ZemneApiError).fields.map((f) => f.path).sort()).toEqual(["content", "contributor_name"]);
    const receipt = await client.submitGuestbookEntry(DEMO_SLUG, { display_name: "Bot", message: "buy now", consent: true, website: "x" });
    expect(receipt.receipt.status).toBe("pending");
    await login(client);
    const org = await client.getOrganizerMemorial(DEMO_IDS.memorial);
    expect(org.guestbook.map((g) => g.id)).not.toContain(receipt.receipt.id);
  });

  it("can simulate errors once for UI state work, and reset", async () => {
    client.simulateNextError("AI_UNAVAILABLE");
    await expectCode(client.getPublicMemorial(DEMO_SLUG), "AI_UNAVAILABLE");
    await expect(client.getPublicMemorial(DEMO_SLUG)).resolves.toBeTruthy();
    client.simulateNextError("RATE_LIMITED");
    const limited = await client.health().catch((e) => e);
    expect(limited).toBeInstanceOf(ZemneApiError);
    expect(limited.body.error.retry_after_seconds).toBe(30);
    await login(client);
    client.reset();
    await expectCode(client.getOrganizerSession(), "UNAUTHENTICATED");
  });

  it("returns copies, so UI mutation cannot corrupt the store", async () => {
    const a = await client.getPublicMemorial(DEMO_SLUG);
    a.tributes.length = 0;
    expect((await client.getPublicMemorial(DEMO_SLUG)).tributes.length).toBeGreaterThan(0);
  });
});
