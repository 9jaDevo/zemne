/**
 * Organizer handlers: session exchange, owner view, rotation, moderation,
 * weave (P5 placeholder that fails safely) and story edit/publish.
 */
import { ObjectId } from "mongodb";
import {
  ModerationRequestSchema,
  OrganizerSessionRequestSchema,
  StoryUpdateRequestSchema,
  WeaveRequestSchema,
  buildManagePath,
  canApplyStoryAction,
  canModerate,
  storyStatusAfter,
  type ContributionStatus,
  type FieldError,
  type ModerateGuestbookResponse,
  type ModerateTributeResponse,
  type OrganizerMemorialResponse,
  type OrganizerSessionResponse,
  type RotateTokenResponse,
  type StoryUpdateResponse,
} from "../../shared/api";
import { collections, type Collections } from "../../lib/db/schema";
import type { StoryDraftDoc, StoryParagraphDoc } from "../../lib/db/types";
import { assertMemorialScope, enforceRate, requireOrganizer } from "../auth";
import { HttpError, objectIdParam, parseBody, readJson, requireSecret, type Handler } from "../http";
import {
  toOrganizerGuestbookEntry,
  toOrganizerMemorial,
  toOrganizerTribute,
  toStoryView,
} from "../serializers";
import { generateOrganizerToken, hashOrganizerToken, safeEqual } from "../security/crypto";
import { RATE_RULES } from "../security/rate-limit";
import { clientIp, ipKey } from "../security/request-guards";
import { issueSession, sessionClearCookie, sessionSetCookie } from "../security/session";

/** Max contributions of each kind returned in the owner view (newest first). */
export const ORGANIZER_LIST_CAP = 500;

const expiresAt = (exp: number) => new Date(exp * 1000).toISOString();

export const exchangeSession: Handler = async ({ request, deps }) => {
  const input = parseBody(OrganizerSessionRequestSchema, await readJson(request));
  const secret = requireSecret(deps);
  const c = collections(await deps.db());
  const now = deps.now();
  await enforceRate(c, RATE_RULES.sessionIp, ipKey(secret, clientIp(request)), now);
  await enforceRate(c, RATE_RULES.sessionMemorial, input.memorial_id, now);

  const memorial = await c.memorials.findOne({ _id: new ObjectId(input.memorial_id) });
  const presented = hashOrganizerToken(input.token);
  // Same error for unknown memorial and wrong token; compare in constant time.
  if (!memorial || !safeEqual(presented, memorial.owner_token_hash)) throw new HttpError("INVALID_ORGANIZER_TOKEN");

  const session = issueSession(secret, input.memorial_id, memorial.owner_token_version, now);
  const body: OrganizerSessionResponse = { session: { memorial_id: input.memorial_id, expires_at: expiresAt(session.payload.exp) } };
  return { status: 200, body, setCookie: sessionSetCookie(deps.config.production, session.value) };
};

export const getSession: Handler = async (ctx) => {
  const auth = await requireOrganizer(ctx, collections(await ctx.deps.db()), { rateLimit: false });
  const body: OrganizerSessionResponse = { session: { memorial_id: auth.session.mid, expires_at: expiresAt(auth.session.exp) } };
  return { status: 200, body };
};

export const endSession: Handler = async ({ deps }) => ({ status: 204, setCookie: sessionClearCookie(deps.config.production) });

async function statusCounts(c: Collections, kind: "guestbook" | "tributes", memorialId: ObjectId) {
  const counts = { pending: 0, approved: 0, rejected: 0 };
  const rows = await (c[kind] as unknown as Collections["tributes"])
    .aggregate<{ _id: ContributionStatus; n: number }>([{ $match: { memorial_id: memorialId } }, { $group: { _id: "$status", n: { $sum: 1 } } }])
    .toArray();
  for (const r of rows) counts[r._id] = r.n;
  return counts;
}

export const getOrganizerMemorial: Handler = async (ctx) => {
  const c = collections(await ctx.deps.db());
  const auth = await requireOrganizer(ctx, c);
  assertMemorialScope(auth, ctx.params.id);
  const mid = auth.memorial._id;
  const sort = { created_at: -1, _id: -1 } as const;
  const [guestbook, tributes, stories, published, gbCounts, trCounts] = await Promise.all([
    c.guestbook.find({ memorial_id: mid }).sort(sort).limit(ORGANIZER_LIST_CAP).toArray(),
    c.tributes.find({ memorial_id: mid }).sort(sort).limit(ORGANIZER_LIST_CAP).toArray(),
    c.stories.find({ memorial_id: mid }).sort(sort).limit(10).toArray(),
    c.stories.findOne({ memorial_id: mid, status: "published" }, { projection: { _id: 1 } }),
    statusCounts(c, "guestbook", mid),
    statusCounts(c, "tributes", mid),
  ]);
  const body: OrganizerMemorialResponse = {
    memorial: toOrganizerMemorial(auth.memorial),
    guestbook: guestbook.map(toOrganizerGuestbookEntry),
    tributes: tributes.map(toOrganizerTribute),
    stories: stories.map(toStoryView),
    published_story_id: published?._id.toHexString() ?? null,
    counts: { guestbook: gbCounts, tributes: trCounts },
  };
  return { status: 200, body };
};

export const rotateToken: Handler = async (ctx) => {
  parseBody(WeaveRequestSchema, await readJson(ctx.request)); // body must be {}
  const c = collections(await ctx.deps.db());
  const auth = await requireOrganizer(ctx, c);
  assertMemorialScope(auth, ctx.params.id);
  const now = ctx.deps.now();
  await enforceRate(c, RATE_RULES.rotateMemorial, auth.session.mid, now);

  const token = generateOrganizerToken();
  const updated = await c.memorials.findOneAndUpdate(
    { _id: auth.memorial._id, owner_token_version: auth.memorial.owner_token_version },
    { $set: { owner_token_hash: hashOrganizerToken(token), updated_at: now }, $inc: { owner_token_version: 1 } },
    { returnDocument: "after" },
  );
  if (!updated) throw new HttpError("UNAUTHENTICATED"); // rotated concurrently; this session is now stale
  const session = issueSession(requireSecret(ctx.deps), auth.session.mid, updated.owner_token_version, now);
  const body: RotateTokenResponse = {
    manage_path: buildManagePath(auth.session.mid, token),
    organizer_token: token,
    session: { memorial_id: auth.session.mid, expires_at: expiresAt(session.payload.exp) },
  };
  return { status: 200, body, setCookie: sessionSetCookie(ctx.deps.config.production, session.value) };
};

export const moderateGuestbookEntry: Handler = async (ctx) => {
  const { status } = parseBody(ModerationRequestSchema, await readJson(ctx.request));
  const c = collections(await ctx.deps.db());
  const auth = await requireOrganizer(ctx, c);
  const filter = { _id: objectIdParam(ctx.params.id), memorial_id: auth.memorial._id };
  const entry = await c.guestbook.findOne(filter);
  if (!entry) throw new HttpError("NOT_FOUND");
  if (!canModerate(entry.status, status)) throw new HttpError("INVALID_STATE_TRANSITION");
  const updated =
    entry.status === status
      ? entry
      : await c.guestbook.findOneAndUpdate(filter, { $set: { status, moderated_at: ctx.deps.now() } }, { returnDocument: "after" });
  if (!updated) throw new HttpError("NOT_FOUND");
  const body: ModerateGuestbookResponse = { entry: toOrganizerGuestbookEntry(updated) };
  return { status: 200, body };
};

export const moderateTribute: Handler = async (ctx) => {
  const { status } = parseBody(ModerationRequestSchema, await readJson(ctx.request));
  const db = await ctx.deps.db();
  const c = collections(db);
  const auth = await requireOrganizer(ctx, c);
  const filter = { _id: objectIdParam(ctx.params.id), memorial_id: auth.memorial._id };
  const tribute = await c.tributes.findOne(filter);
  if (!tribute) throw new HttpError("NOT_FOUND");
  if (!canModerate(tribute.status, status)) throw new HttpError("INVALID_STATE_TRANSITION");
  if (tribute.status === status) {
    const body: ModerateTributeResponse = { tribute: toOrganizerTribute(tribute), side_effects: { unpublished_story_id: null } };
    return { status: 200, body };
  }

  const now = ctx.deps.now();
  const session = db.client.startSession();
  let body: ModerateTributeResponse | null = null;
  try {
    await session.withTransaction(async () => {
      const updated = await c.tributes.findOneAndUpdate(filter, { $set: { status, moderated_at: now } }, { returnDocument: "after", session });
      if (!updated) throw new HttpError("NOT_FOUND");
      let unpublished: StoryDraftDoc | null = null;
      if (status === "rejected") {
        // Withdrawing a cited tribute withdraws the published story that cites it.
        unpublished = await c.stories.findOneAndUpdate(
          { memorial_id: auth.memorial._id, status: "published", "paragraphs.source_tribute_ids": updated._id },
          { $set: { status: "draft", published_at: null, updated_at: now }, $inc: { version: 1 } },
          { returnDocument: "after", session },
        );
      }
      body = { tribute: toOrganizerTribute(updated), side_effects: { unpublished_story_id: unpublished?._id.toHexString() ?? null } };
    });
  } finally {
    await session.endSession();
  }
  return { status: 200, body };
};

/**
 * Weave (P5 implements generation). Until a real Gemma provider is wired in,
 * this fails safely with AI_UNAVAILABLE after the auth and precondition checks;
 * it never stores or returns placeholder text.
 */
export const weave: Handler = async (ctx) => {
  parseBody(WeaveRequestSchema, await readJson(ctx.request));
  const c = collections(await ctx.deps.db());
  const auth = await requireOrganizer(ctx, c);
  assertMemorialScope(auth, ctx.params.id);
  await enforceRate(c, RATE_RULES.weaveMemorial, auth.session.mid, ctx.deps.now());
  const approved = await c.tributes.countDocuments({ memorial_id: auth.memorial._id, status: "approved" }, { limit: 1 });
  if (approved === 0) throw new HttpError("NO_APPROVED_TRIBUTES");
  throw new HttpError("AI_UNAVAILABLE");
};

/** Every cited id must be a currently approved tribute of this memorial. */
async function assertSourcesApproved(c: Collections, memorialId: ObjectId, paragraphs: StoryParagraphDoc[]): Promise<void> {
  const ids = [...new Set(paragraphs.flatMap((p) => p.source_tribute_ids.map((id) => id.toHexString())))];
  const approved = new Set(
    (
      await c.tributes
        .find({ _id: { $in: ids.map((id) => new ObjectId(id)) }, memorial_id: memorialId, status: "approved" }, { projection: { _id: 1 } })
        .toArray()
    ).map((t) => t._id.toHexString()),
  );
  const fields: FieldError[] = [];
  paragraphs.forEach((p, i) =>
    p.source_tribute_ids.forEach((id, j) => {
      if (!approved.has(id.toHexString())) fields.push({ path: `paragraphs.${i}.source_tribute_ids.${j}`, message: "Not an approved tribute of this memorial" });
    }),
  );
  if (fields.length) throw new HttpError("STORY_SOURCES_INVALID", { fields });
}

export const updateStory: Handler = async (ctx) => {
  const req = parseBody(StoryUpdateRequestSchema, await readJson(ctx.request));
  const db = await ctx.deps.db();
  const c = collections(db);
  const auth = await requireOrganizer(ctx, c);
  const mid = auth.memorial._id;
  const story = await c.stories.findOne({ _id: objectIdParam(ctx.params.id), memorial_id: mid });
  if (!story) throw new HttpError("NOT_FOUND");
  if (req.version !== story.version) throw new HttpError("VERSION_CONFLICT");
  if (!canApplyStoryAction(story.status, req.action)) throw new HttpError("INVALID_STATE_TRANSITION");

  const now = ctx.deps.now();
  const nextStatus = storyStatusAfter(story.status, req.action);
  const set: Partial<StoryDraftDoc> = { status: nextStatus, updated_at: now };

  if (req.action === "edit") {
    const paragraphs = req.paragraphs?.map((p) => ({ text: p.text, source_tribute_ids: p.source_tribute_ids.map((id) => new ObjectId(id)) }));
    if (paragraphs) set.paragraphs = paragraphs;
    if (req.title !== undefined) set.title = req.title;
    set.edited_by_organizer = true;
    if (paragraphs || story.status === "published") await assertSourcesApproved(c, mid, paragraphs ?? story.paragraphs);
  } else if (req.action === "publish") {
    await assertSourcesApproved(c, mid, story.paragraphs);
    set.published_at = now;
  } else {
    set.published_at = null;
  }

  let superseded: StoryDraftDoc | null = null;
  let updated: StoryDraftDoc | null = null;
  const session = db.client.startSession();
  try {
    await session.withTransaction(async () => {
      superseded = null;
      if (req.action === "publish") {
        superseded = await c.stories.findOneAndUpdate(
          { memorial_id: mid, status: "published", _id: { $ne: story._id } },
          { $set: { status: "draft", published_at: null, updated_at: now }, $inc: { version: 1 } },
          { returnDocument: "after", session },
        );
      }
      updated = await c.stories.findOneAndUpdate(
        { _id: story._id, memorial_id: mid, version: story.version },
        { $set: set, $inc: { version: 1 } },
        { returnDocument: "after", session },
      );
      if (!updated) throw new HttpError("VERSION_CONFLICT"); // aborts, restoring any superseded story
    });
  } finally {
    await session.endSession();
  }
  const body: StoryUpdateResponse = {
    story: toStoryView(updated!),
    side_effects: { superseded_story_id: (superseded as StoryDraftDoc | null)?._id.toHexString() ?? null },
  };
  return { status: 200, body };
};
