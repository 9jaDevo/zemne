/**
 * Collections, server-side $jsonSchema validators and indexes.
 *
 * ensureDatabase() is idempotent and runs once per Db handle. The app user has
 * only readWrite@zemne, which allows createCollection/createIndexes but not
 * collMod: validators are attached when a collection is first created.
 */
import type { Collection, Db, Document } from "mongodb";
import type { GuestbookEntryDoc, MemorialDoc, RateLimitDoc, StoryDraftDoc, TributeDoc } from "./types";

export const COLLECTIONS = {
  memorials: "memorials",
  guestbook: "guestbook_entries",
  tributes: "tributes",
  stories: "story_drafts",
  rateLimits: "rate_limits",
} as const;

export interface Collections {
  memorials: Collection<MemorialDoc>;
  guestbook: Collection<GuestbookEntryDoc>;
  tributes: Collection<TributeDoc>;
  stories: Collection<StoryDraftDoc>;
  rateLimits: Collection<RateLimitDoc>;
}

export function collections(db: Db): Collections {
  return {
    memorials: db.collection<MemorialDoc>(COLLECTIONS.memorials),
    guestbook: db.collection<GuestbookEntryDoc>(COLLECTIONS.guestbook),
    tributes: db.collection<TributeDoc>(COLLECTIONS.tributes),
    stories: db.collection<StoryDraftDoc>(COLLECTIONS.stories),
    rateLimits: db.collection<RateLimitDoc>(COLLECTIONS.rateLimits),
  };
}

const str = (maxLength: number, minLength = 1) => ({ bsonType: "string", minLength, maxLength });
const nullableYear = { bsonType: ["int", "long", "double", "null"] };
const status = { enum: ["pending", "approved", "rejected"] };
const date = { bsonType: "date" };
const nullableDate = { bsonType: ["date", "null"] };
const objectIdArray = { bsonType: "array", items: { bsonType: "objectId" } };

const contributionBase = {
  _id: { bsonType: "objectId" },
  memorial_id: { bsonType: "objectId" },
  status,
  consent: { enum: [true] },
  moderation_hints: { bsonType: "array", items: { bsonType: "string" } },
  ip_hash: str(128),
  content_hash: str(128),
  created_at: date,
  moderated_at: nullableDate,
};
const contributionRequired = ["memorial_id", "status", "consent", "moderation_hints", "ip_hash", "content_hash", "created_at", "moderated_at"];

const VALIDATORS: Record<string, Document> = {
  [COLLECTIONS.memorials]: {
    $jsonSchema: {
      bsonType: "object",
      required: ["slug", "name", "birth_year", "death_year", "description", "portrait_key", "owner_token_hash", "owner_token_version", "visibility", "created_at", "updated_at"],
      properties: {
        slug: str(80, 3),
        name: str(80),
        birth_year: nullableYear,
        death_year: nullableYear,
        description: str(500),
        portrait_key: { enum: ["neutral-1", "neutral-2", "neutral-3", null] },
        owner_token_hash: { bsonType: "string", pattern: "^[a-f0-9]{64}$" },
        owner_token_version: { bsonType: ["int", "long", "double"], minimum: 1 },
        visibility: { enum: ["unlisted"] },
        created_at: date,
        updated_at: date,
      },
    },
  },
  [COLLECTIONS.guestbook]: {
    $jsonSchema: {
      bsonType: "object",
      required: [...contributionRequired, "display_name", "message"],
      properties: { ...contributionBase, display_name: str(60), message: str(500) },
    },
  },
  [COLLECTIONS.tributes]: {
    $jsonSchema: {
      bsonType: "object",
      required: [...contributionRequired, "contributor_name", "relationship", "content"],
      properties: {
        ...contributionBase,
        contributor_name: str(60),
        relationship: { bsonType: ["string", "null"], maxLength: 60 },
        content: str(2000, 10),
      },
    },
  },
  [COLLECTIONS.stories]: {
    $jsonSchema: {
      bsonType: "object",
      required: ["memorial_id", "status", "version", "title", "paragraphs", "flags", "input_tribute_ids", "model_id", "provider_label", "edited_by_organizer", "created_at", "updated_at", "published_at"],
      properties: {
        memorial_id: { bsonType: "objectId" },
        status: { enum: ["draft", "published"] },
        version: { bsonType: ["int", "long", "double"], minimum: 1 },
        title: str(120),
        paragraphs: {
          bsonType: "array",
          minItems: 1,
          maxItems: 8,
          items: {
            bsonType: "object",
            required: ["text", "source_tribute_ids"],
            properties: { text: str(1200), source_tribute_ids: { ...objectIdArray, minItems: 1 } },
          },
        },
        flags: { bsonType: "array" },
        input_tribute_ids: { ...objectIdArray, minItems: 1 },
        model_id: str(120),
        provider_label: str(120),
        edited_by_organizer: { bsonType: "bool" },
        created_at: date,
        updated_at: date,
        published_at: nullableDate,
      },
    },
  },
};

async function createIfMissing(db: Db, name: string, existing: Set<string>) {
  if (existing.has(name)) return;
  const validator = VALIDATORS[name];
  try {
    await db.createCollection(name, validator ? { validator, validationLevel: "strict", validationAction: "error" } : {});
  } catch (error) {
    // 48 = NamespaceExists (another instance created it concurrently).
    if ((error as { code?: number }).code !== 48) throw error;
  }
}

async function setUp(db: Db): Promise<void> {
  const existing = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name));
  for (const name of Object.values(COLLECTIONS)) await createIfMissing(db, name, existing);

  const c = collections(db);
  await Promise.all([
    c.memorials.createIndexes([
      { key: { slug: 1 }, name: "slug_unique", unique: true },
      { key: { owner_token_hash: 1 }, name: "owner_token_hash_unique", unique: true },
    ]),
    c.guestbook.createIndexes([
      { key: { memorial_id: 1, status: 1, created_at: -1 }, name: "memorial_status_created" },
      { key: { memorial_id: 1, content_hash: 1, created_at: -1 }, name: "memorial_content_dup" },
    ]),
    c.tributes.createIndexes([
      { key: { memorial_id: 1, status: 1, created_at: -1 }, name: "memorial_status_created" },
      { key: { memorial_id: 1, content_hash: 1, created_at: -1 }, name: "memorial_content_dup" },
    ]),
    c.stories.createIndexes([
      { key: { memorial_id: 1, created_at: -1 }, name: "memorial_created" },
      {
        key: { memorial_id: 1 },
        name: "one_published_per_memorial",
        unique: true,
        partialFilterExpression: { status: "published" },
      },
    ]),
    c.rateLimits.createIndexes([{ key: { expires_at: 1 }, name: "expires_ttl", expireAfterSeconds: 0 }]),
  ]);
}

const ready = new WeakMap<Db, Promise<void>>();

/** Creates collections (with validators) and indexes once per Db handle. */
export function ensureDatabase(db: Db): Promise<void> {
  let p = ready.get(db);
  if (!p) {
    p = setUp(db).catch((error) => {
      ready.delete(db);
      throw error;
    });
    ready.set(db, p);
  }
  return p;
}
