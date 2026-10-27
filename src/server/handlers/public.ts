/**
 * Guest-facing handlers: health, create memorial, public read, submissions.
 */
import { ObjectId, type Collection } from "mongodb";
import {
  APP_PATHS,
  CreateMemorialRequestSchema,
  GuestbookSubmissionRequestSchema,
  LIMITS,
  SlugSchema,
  TributeSubmissionRequestSchema,
  buildManagePath,
  type CreateMemorialResponse,
  type HealthResponse,
  type PublicMemorialResponse,
  type SubmissionReceiptResponse,
} from "../../shared/api";
import { collections, type Collections } from "../../lib/db/schema";
import type { GuestbookEntryDoc, MemorialDoc, TributeDoc } from "../../lib/db/types";
import { enforceRate } from "../auth";
import { HttpError, parseBody, readJson, requireSecret, type Handler, type HandlerContext } from "../http";
import { makeSlug, moderationHints } from "../moderation";
import { toPublicGuestbookEntry, toPublicMemorial, toPublicStory, toPublicTribute } from "../serializers";
import { contentHash, generateOrganizerToken, hashOrganizerToken } from "../security/crypto";
import { RATE_RULES } from "../security/rate-limit";
import { clientIp, ipKey } from "../security/request-guards";
import { issueSession, sessionSetCookie } from "../security/session";

const DAY_MS = 86_400_000;

export const health: Handler = async ({ deps }) => {
  let database: HealthResponse["checks"]["database"];
  try {
    const db = await deps.db();
    await db.command({ ping: 1 });
    database = "ok";
  } catch (error) {
    database = (error as { name?: string }).name === "ConfigError" ? "unconfigured" : "error";
  }
  const body: HealthResponse = {
    status: database === "ok" && deps.config.sessionSecret ? "ok" : "degraded",
    checks: { database, ai: deps.config.gemmaConfigured ? "configured" : "unconfigured" },
  };
  return { status: 200, body };
};

async function findMemorialBySlug(c: Collections, slug: string | undefined): Promise<MemorialDoc> {
  if (!slug || !SlugSchema.safeParse(slug).success) throw new HttpError("NOT_FOUND");
  const memorial = await c.memorials.findOne({ slug });
  if (!memorial) throw new HttpError("NOT_FOUND");
  return memorial;
}

function isDuplicateKey(error: unknown, field: string): boolean {
  const e = error as { code?: number; keyPattern?: Record<string, unknown> };
  return e.code === 11000 && Boolean(e.keyPattern && field in e.keyPattern);
}

export const createMemorial: Handler = async ({ request, deps }) => {
  const input = parseBody(CreateMemorialRequestSchema, await readJson(request));
  const secret = requireSecret(deps);
  const c = collections(await deps.db());
  const now = deps.now();
  await enforceRate(c, RATE_RULES.createMemorialIp, ipKey(secret, clientIp(request)), now);

  const token = generateOrganizerToken();
  const doc: MemorialDoc = {
    _id: new ObjectId(),
    slug: makeSlug(input.name),
    name: input.name,
    birth_year: input.birth_year ?? null,
    death_year: input.death_year ?? null,
    description: input.description,
    portrait_key: input.portrait_key ?? null,
    owner_token_hash: hashOrganizerToken(token),
    owner_token_version: 1,
    visibility: "unlisted",
    created_at: now,
    updated_at: now,
  };

  // Honeypot: a normal-looking response, nothing stored, no cookie.
  if (input.website) {
    const fake = issueSession(secret, doc._id.toHexString(), 1, now).payload;
    return { status: 201, body: createdBody(doc, token, fake.exp) };
  }

  for (let attempt = 0; ; attempt++) {
    try {
      await c.memorials.insertOne(doc);
      break;
    } catch (error) {
      if (attempt < 3 && isDuplicateKey(error, "slug")) {
        doc.slug = makeSlug(input.name);
        continue;
      }
      throw error;
    }
  }

  const session = issueSession(secret, doc._id.toHexString(), doc.owner_token_version, now);
  return {
    status: 201,
    body: createdBody(doc, token, session.payload.exp),
    setCookie: sessionSetCookie(deps.config.production, session.value),
  };
};

function createdBody(doc: MemorialDoc, token: string, exp: number): CreateMemorialResponse {
  const id = doc._id.toHexString();
  return {
    memorial_id: id,
    memorial: toPublicMemorial(doc),
    guest_path: APP_PATHS.guest(doc.slug),
    manage_path: buildManagePath(id, token),
    organizer_token: token,
    session: { memorial_id: id, expires_at: new Date(exp * 1000).toISOString() },
  };
}

export const getPublicMemorial: Handler = async ({ request, params, deps }) => {
  const c = collections(await deps.db());
  await enforceRate(c, RATE_RULES.publicReadIp, ipKey(requireSecret(deps), clientIp(request)), deps.now());
  const memorial = await findMemorialBySlug(c, params.slug);
  const approved = { memorial_id: memorial._id, status: "approved" as const };
  const sort = { created_at: -1, _id: -1 } as const;
  const [guestbook, tributes, story] = await Promise.all([
    c.guestbook.find(approved).sort(sort).limit(LIMITS.publicListCap).toArray(),
    c.tributes.find(approved).sort(sort).limit(LIMITS.publicListCap).toArray(),
    c.stories.findOne({ memorial_id: memorial._id, status: "published" }),
  ]);
  const publicTributes = tributes.map(toPublicTribute);
  const body: PublicMemorialResponse = {
    memorial: toPublicMemorial(memorial),
    guestbook: guestbook.map(toPublicGuestbookEntry),
    tributes: publicTributes,
    story: story ? toPublicStory(story, new Set(publicTributes.map((t) => t.id))) : null,
  };
  return { status: 200, body, headers: { "Cache-Control": "private, no-cache" } };
};

type ContributionDoc = GuestbookEntryDoc | TributeDoc;

async function submit<D extends ContributionDoc>(
  ctx: HandlerContext,
  kind: "guestbook" | "tribute",
  build: (base: Omit<ContributionDoc, "moderation_hints" | "content_hash">) => {
    doc: Omit<D, "moderation_hints" | "content_hash">;
    texts: string[];
    main: string;
    honeypot?: string;
  },
): Promise<{ status: number; body: SubmissionReceiptResponse }> {
  const { request, params, deps } = ctx;
  const secret = requireSecret(deps);
  const c = collections(await deps.db());
  const now = deps.now();
  const memorial = await findMemorialBySlug(c, params.slug);
  const ip = ipKey(secret, clientIp(request));
  const rules =
    kind === "tribute"
      ? [RATE_RULES.tributeIp, RATE_RULES.tributeMemorial]
      : [RATE_RULES.guestbookIp, RATE_RULES.guestbookMemorial];
  await enforceRate(c, rules[0], `${ip}:${memorial._id.toHexString()}`, now);
  await enforceRate(c, rules[1], memorial._id.toHexString(), now);

  const built = build({
    _id: new ObjectId(),
    memorial_id: memorial._id,
    status: "pending", // always server-assigned
    consent: true,
    ip_hash: ip,
    created_at: now,
    moderated_at: null,
  });
  const receipt: SubmissionReceiptResponse = {
    receipt: { id: built.doc._id.toHexString(), kind, status: "pending", submitted_at: now.toISOString() },
    message:
      kind === "tribute"
        ? "Thank you. Your tribute was received and will appear after the family approves it."
        : "Thank you for signing. Your message will appear after the family approves it.",
  };
  if (built.honeypot) return { status: 202, body: receipt };

  const coll = (kind === "tribute" ? c.tributes : c.guestbook) as unknown as Collection<ContributionDoc>;
  const hash = contentHash(built.main);
  const duplicate = await coll.findOne(
    { memorial_id: memorial._id, content_hash: hash, created_at: { $gte: new Date(now.getTime() - DAY_MS) } },
    { projection: { _id: 1 } },
  );
  const doc = { ...built.doc, content_hash: hash, moderation_hints: moderationHints(built.texts, Boolean(duplicate)) };
  await coll.insertOne(doc as unknown as ContributionDoc);
  return { status: 202, body: receipt };
}

export const submitGuestbookEntry: Handler = async (ctx) => {
  const input = parseBody(GuestbookSubmissionRequestSchema, await readJson(ctx.request));
  return submit<GuestbookEntryDoc>(ctx, "guestbook", (base) => ({
    doc: { ...base, display_name: input.display_name, message: input.message },
    texts: [input.display_name, input.message],
    main: input.message,
    honeypot: input.website,
  }));
};

export const submitTribute: Handler = async (ctx) => {
  const input = parseBody(TributeSubmissionRequestSchema, await readJson(ctx.request));
  return submit<TributeDoc>(ctx, "tribute", (base) => ({
    doc: { ...base, contributor_name: input.contributor_name, relationship: input.relationship ?? null, content: input.content },
    texts: [input.contributor_name, input.relationship ?? "", input.content],
    main: input.content,
    honeypot: input.website,
  }));
};
