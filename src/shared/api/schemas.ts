/**
 * ZEMNE HTTP contract — request/response schemas (P1, Claude-owned).
 *
 * Every API body is validated with these schemas on the server, and the
 * frontend may use them to validate forms before sending. Response schemas
 * are *strict*: an unexpected key (e.g. an accidentally serialized
 * `owner_token_hash`) fails validation, which is how the contract tests catch
 * public-serialization leaks.
 *
 * Human-facing documentation lives in docs/API_CONTRACT.md. Change both
 * together; the docs-examples test keeps them in sync.
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// Limits (shared with the UI for maxLength / counters)
// ---------------------------------------------------------------------------

export const LIMITS = {
  memorialName: { min: 1, max: 80 },
  memorialDescription: { min: 1, max: 500 },
  displayName: { min: 1, max: 60 },
  guestbookMessage: { min: 1, max: 500 },
  relationship: { min: 0, max: 60 },
  tributeContent: { min: 10, max: 2000 },
  storyTitle: { min: 1, max: 120 },
  storyParagraph: { min: 1, max: 1200 },
  storyParagraphs: { min: 1, max: 8 },
  sourcesPerParagraph: { min: 1, max: 20 },
  flagMessage: { max: 300 },
  honeypot: { max: 200 },
  minYear: 1800,
  /** Max request body accepted by any endpoint (bytes). */
  maxBodyBytes: 16_384,
  /** Max approved items returned per list on the public read. */
  publicListCap: 200,
  /** Max story drafts returned in the organizer view (newest first). */
  organizerStoryCap: 10,
} as const;

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** MongoDB ObjectId, lowercase hex. All entity ids in the API use this form. */
export const ObjectIdSchema = z.string().regex(/^[a-f0-9]{24}$/, "Invalid id");

/** Server-generated, unguessable slug, e.g. `elowen-marsh-k7q2xm`. */
export const SlugSchema = z
  .string()
  .min(3)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug");

/** Organizer secret: `zmn_ot_` + 43 base64url chars (32 random bytes). */
export const ORGANIZER_TOKEN_PATTERN = /^zmn_ot_[A-Za-z0-9_-]{43}$/;
export const OrganizerTokenSchema = z.string().regex(ORGANIZER_TOKEN_PATTERN, "Invalid organizer link");

/** ISO-8601 UTC timestamp with `Z`, e.g. `2026-10-27T14:03:11.000Z`. */
export const TimestampSchema = z.iso.datetime();

/** Predefined neutral portrait placeholders; Codex maps keys to artwork. */
export const PortraitKeySchema = z.enum(["neutral-1", "neutral-2", "neutral-3"]);

export const ContributionStatusSchema = z.enum(["pending", "approved", "rejected"]);
export const ModerationDecisionSchema = z.enum(["approved", "rejected"]);
export const StoryStatusSchema = z.enum(["draft", "published"]);

/** Organizer-only hints from server-side heuristics. Never auto-approve or auto-reject. */
export const ModerationHintSchema = z.enum([
  "contains_link",
  "possible_profanity",
  "possible_personal_data",
  "possible_instruction_text",
  "duplicate_submission",
]);

// ---------------------------------------------------------------------------
// Plain-text input normalization
// ---------------------------------------------------------------------------

// C0 controls except \t and \n, DEL, zero-width and bidi override characters.
const UNSAFE_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩﻿]/g;

/** Multi-line text: NFC, unified newlines, unsafe chars stripped, max one blank line. */
export function normalizeMultiline(value: string): string {
  return value
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(UNSAFE_CHARS, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Single-line text: as multi-line, then all whitespace runs collapse to one space. */
export function normalizeSingleLine(value: string): string {
  return normalizeMultiline(value).replace(/\s+/g, " ");
}

/**
 * User text is stored and returned as plain text, never HTML. The frontend
 * must render it as text (React's default escaping) — never via
 * dangerouslySetInnerHTML or a Markdown renderer.
 */
const singleLine = (min: number, max: number) =>
  z.string().max(max * 4).transform(normalizeSingleLine).pipe(z.string().min(min).max(max));
const multiLine = (min: number, max: number) =>
  z.string().max(max * 4).transform(normalizeMultiline).pipe(z.string().min(min).max(max));

/** Hidden form field. Must stay empty; bots that fill it get a fake success and nothing is stored. */
const honeypot = z.string().max(LIMITS.honeypot.max).optional();

const currentYear = () => new Date().getUTCFullYear();
const yearSchema = z.int().min(LIMITS.minYear).refine((y) => y <= currentYear(), "Year cannot be in the future");

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export const CreateMemorialRequestSchema = z
  .strictObject({
    name: singleLine(LIMITS.memorialName.min, LIMITS.memorialName.max),
    birth_year: yearSchema.nullable().optional(),
    death_year: yearSchema.nullable().optional(),
    description: multiLine(LIMITS.memorialDescription.min, LIMITS.memorialDescription.max),
    portrait_key: PortraitKeySchema.nullable().optional(),
    /** Organizer confirms: anyone with the invite link can see approved content. */
    privacy_acknowledged: z.literal(true),
    website: honeypot,
  })
  .refine((v) => v.birth_year == null || v.death_year == null || v.death_year >= v.birth_year, {
    message: "Year of passing cannot be before year of birth",
    path: ["death_year"],
  });

export const GuestbookSubmissionRequestSchema = z.strictObject({
  display_name: singleLine(LIMITS.displayName.min, LIMITS.displayName.max),
  message: multiLine(LIMITS.guestbookMessage.min, LIMITS.guestbookMessage.max),
  /** Contributor agrees the message may be shown publicly once the organizer approves it. */
  consent: z.literal(true),
  website: honeypot,
});

export const TributeSubmissionRequestSchema = z.strictObject({
  contributor_name: singleLine(LIMITS.displayName.min, LIMITS.displayName.max),
  /** Optional; blank strings become null. */
  relationship: singleLine(LIMITS.relationship.min, LIMITS.relationship.max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  content: multiLine(LIMITS.tributeContent.min, LIMITS.tributeContent.max),
  consent: z.literal(true),
  website: honeypot,
});

export const OrganizerSessionRequestSchema = z.strictObject({
  memorial_id: ObjectIdSchema,
  token: OrganizerTokenSchema,
});

export const ModerationRequestSchema = z.strictObject({
  status: ModerationDecisionSchema,
});

/** Weave takes no options: the server always uses every currently approved tribute. */
export const WeaveRequestSchema = z.strictObject({});

const uniqueIds = (ids: string[]) => new Set(ids).size === ids.length;

export const StoryParagraphInputSchema = z.strictObject({
  text: multiLine(LIMITS.storyParagraph.min, LIMITS.storyParagraph.max),
  source_tribute_ids: z
    .array(ObjectIdSchema)
    .min(LIMITS.sourcesPerParagraph.min, "Every paragraph must cite at least one approved tribute")
    .max(LIMITS.sourcesPerParagraph.max)
    .refine(uniqueIds, "Duplicate source id"),
});

const versionField = z.int().min(1);

export const StoryUpdateRequestSchema = z.discriminatedUnion("action", [
  z
    .strictObject({
      action: z.literal("edit"),
      version: versionField,
      title: singleLine(LIMITS.storyTitle.min, LIMITS.storyTitle.max).optional(),
      paragraphs: z
        .array(StoryParagraphInputSchema)
        .min(LIMITS.storyParagraphs.min)
        .max(LIMITS.storyParagraphs.max)
        .optional(),
    })
    .refine((v) => v.title !== undefined || v.paragraphs !== undefined, "Nothing to edit"),
  z.strictObject({ action: z.literal("publish"), version: versionField }),
  z.strictObject({ action: z.literal("unpublish"), version: versionField }),
]);

// ---------------------------------------------------------------------------
// Response building blocks
// ---------------------------------------------------------------------------

const outText = (max: number) => z.string().min(1).max(max);

export const PortraitSchema = z.strictObject({
  kind: z.literal("placeholder"),
  key: PortraitKeySchema,
});

export const PublicMemorialSchema = z.strictObject({
  slug: SlugSchema,
  name: outText(LIMITS.memorialName.max),
  birth_year: z.int().nullable(),
  death_year: z.int().nullable(),
  description: outText(LIMITS.memorialDescription.max),
  portrait: PortraitSchema.nullable(),
  created_at: TimestampSchema,
});

export const PublicGuestbookEntrySchema = z.strictObject({
  id: ObjectIdSchema,
  display_name: outText(LIMITS.displayName.max),
  message: outText(LIMITS.guestbookMessage.max),
  created_at: TimestampSchema,
});

export const PublicTributeSchema = z.strictObject({
  id: ObjectIdSchema,
  contributor_name: outText(LIMITS.displayName.max),
  relationship: outText(LIMITS.relationship.max).nullable(),
  content: outText(LIMITS.tributeContent.max),
  created_at: TimestampSchema,
});

export const StoryParagraphSchema = z.strictObject({
  text: outText(LIMITS.storyParagraph.max),
  source_tribute_ids: z
    .array(ObjectIdSchema)
    .min(LIMITS.sourcesPerParagraph.min)
    .max(LIMITS.sourcesPerParagraph.max)
    .refine(uniqueIds, "Duplicate source id"),
});

/** Shown next to every AI-woven story (public and organizer). */
export const AiDisclosureSchema = z.strictObject({
  model_id: z.string().min(1).max(120),
  provider_label: z.string().min(1).max(120),
});

export const PublicStorySchema = z.strictObject({
  id: ObjectIdSchema,
  title: outText(LIMITS.storyTitle.max),
  paragraphs: z.array(StoryParagraphSchema).min(1).max(LIMITS.storyParagraphs.max),
  edited_by_organizer: z.boolean(),
  ai: AiDisclosureSchema,
  published_at: TimestampSchema,
});

export const WeaveFlagCodeSchema = z.enum([
  // Raised by the model (and preserved by the validator):
  "unsupported_claim",
  "uncertain_detail",
  "conflicting_accounts",
  "sensitive_content",
  "possible_instruction_ignored",
  "insufficient_material",
  // Raised only by the server-side validator:
  "unknown_source_removed",
  "paragraph_without_sources_removed",
]);

export const WeaveFlagSchema = z.strictObject({
  code: WeaveFlagCodeSchema,
  origin: z.enum(["model", "validator"]),
  /** Index into the story's `paragraphs`, or null for story-wide flags. */
  paragraph_index: z.int().min(0).nullable(),
  message: outText(LIMITS.flagMessage.max),
  source_tribute_ids: z.array(ObjectIdSchema),
});

export const OrganizerSessionSchema = z.strictObject({
  memorial_id: ObjectIdSchema,
  expires_at: TimestampSchema,
});

const ModerationHintsField = z.array(ModerationHintSchema);

export const OrganizerGuestbookEntrySchema = z.strictObject({
  id: ObjectIdSchema,
  display_name: outText(LIMITS.displayName.max),
  message: outText(LIMITS.guestbookMessage.max),
  status: ContributionStatusSchema,
  moderation_hints: ModerationHintsField,
  created_at: TimestampSchema,
  moderated_at: TimestampSchema.nullable(),
});

export const OrganizerTributeSchema = z.strictObject({
  id: ObjectIdSchema,
  contributor_name: outText(LIMITS.displayName.max),
  relationship: outText(LIMITS.relationship.max).nullable(),
  content: outText(LIMITS.tributeContent.max),
  status: ContributionStatusSchema,
  moderation_hints: ModerationHintsField,
  created_at: TimestampSchema,
  moderated_at: TimestampSchema.nullable(),
});

export const StoryViewSchema = z.strictObject({
  id: ObjectIdSchema,
  memorial_id: ObjectIdSchema,
  status: StoryStatusSchema,
  /** Optimistic-concurrency version; send it back on every PATCH. */
  version: z.int().min(1),
  title: outText(LIMITS.storyTitle.max),
  paragraphs: z.array(StoryParagraphSchema).min(1).max(LIMITS.storyParagraphs.max),
  flags: z.array(WeaveFlagSchema),
  /** The approved tributes that were sent to the model for this draft. */
  input_tribute_ids: z.array(ObjectIdSchema).min(1),
  ai: AiDisclosureSchema,
  edited_by_organizer: z.boolean(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
  published_at: TimestampSchema.nullable(),
});

export const OrganizerMemorialSchema = z.strictObject({
  id: ObjectIdSchema,
  slug: SlugSchema,
  guest_path: z.string().startsWith("/m/"),
  name: outText(LIMITS.memorialName.max),
  birth_year: z.int().nullable(),
  death_year: z.int().nullable(),
  description: outText(LIMITS.memorialDescription.max),
  portrait: PortraitSchema.nullable(),
  visibility: z.literal("unlisted"),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
});

const StatusCountsSchema = z.strictObject({
  pending: z.int().min(0),
  approved: z.int().min(0),
  rejected: z.int().min(0),
});

// ---------------------------------------------------------------------------
// Responses (one per endpoint)
// ---------------------------------------------------------------------------

export const CreateMemorialResponseSchema = z.strictObject({
  memorial_id: ObjectIdSchema,
  memorial: PublicMemorialSchema,
  /** Relative; build the share URL with `location.origin`. */
  guest_path: z.string().startsWith("/m/"),
  /** Relative, contains the secret in the fragment: `/manage/<id>#key=<token>`. Shown ONCE. */
  manage_path: z.string().startsWith("/manage/"),
  /** The raw secret, returned exactly once and never stored server-side. */
  organizer_token: OrganizerTokenSchema,
  /** Create also sets the organizer session cookie, so the console works immediately. */
  session: OrganizerSessionSchema,
});

export const PublicMemorialResponseSchema = z
  .strictObject({
    memorial: PublicMemorialSchema,
    guestbook: z.array(PublicGuestbookEntrySchema).max(LIMITS.publicListCap),
    tributes: z.array(PublicTributeSchema).max(LIMITS.publicListCap),
    story: PublicStorySchema.nullable(),
  })
  .superRefine((v, ctx) => {
    // Every citation on the public wall must resolve to an approved, visible tribute.
    const visible = new Set(v.tributes.map((t) => t.id));
    v.story?.paragraphs.forEach((p, i) =>
      p.source_tribute_ids.forEach((id, j) => {
        if (!visible.has(id)) {
          ctx.addIssue({
            code: "custom",
            message: "Story cites a tribute that is not publicly visible",
            path: ["story", "paragraphs", i, "source_tribute_ids", j],
          });
        }
      }),
    );
  });

export const SubmissionReceiptResponseSchema = z.strictObject({
  receipt: z.strictObject({
    id: ObjectIdSchema,
    kind: z.enum(["guestbook", "tribute"]),
    status: z.literal("pending"),
    submitted_at: TimestampSchema,
  }),
  /** Friendly, display-ready moderation notice. */
  message: z.string().min(1).max(300),
});

export const OrganizerSessionResponseSchema = z.strictObject({
  session: OrganizerSessionSchema,
});

export const OrganizerMemorialResponseSchema = z.strictObject({
  memorial: OrganizerMemorialSchema,
  /** All statuses, newest first. */
  guestbook: z.array(OrganizerGuestbookEntrySchema),
  /** All statuses, newest first. */
  tributes: z.array(OrganizerTributeSchema),
  /** Newest first, at most LIMITS.organizerStoryCap. */
  stories: z.array(StoryViewSchema).max(LIMITS.organizerStoryCap),
  published_story_id: ObjectIdSchema.nullable(),
  counts: z.strictObject({ guestbook: StatusCountsSchema, tributes: StatusCountsSchema }),
});

export const ModerateGuestbookResponseSchema = z.strictObject({
  entry: OrganizerGuestbookEntrySchema,
});

export const ModerateTributeResponseSchema = z.strictObject({
  tribute: OrganizerTributeSchema,
  side_effects: z.strictObject({
    /** Set when rejecting this tribute withdrew the published story that cited it. */
    unpublished_story_id: ObjectIdSchema.nullable(),
  }),
});

export const WeaveResponseSchema = z.strictObject({
  story: StoryViewSchema,
});

export const StoryUpdateResponseSchema = z.strictObject({
  story: StoryViewSchema,
  side_effects: z.strictObject({
    /** Set when publishing this story returned the previously published one to draft. */
    superseded_story_id: ObjectIdSchema.nullable(),
  }),
});

export const RotateTokenResponseSchema = z.strictObject({
  manage_path: z.string().startsWith("/manage/"),
  organizer_token: OrganizerTokenSchema,
  session: OrganizerSessionSchema,
});

export const HealthResponseSchema = z.strictObject({
  status: z.enum(["ok", "degraded"]),
  checks: z.strictObject({
    database: z.enum(["ok", "error", "unconfigured"]),
    ai: z.enum(["configured", "unconfigured"]),
  }),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Form-side (pre-normalization) shapes. */
export type CreateMemorialRequest = z.input<typeof CreateMemorialRequestSchema>;
export type GuestbookSubmissionRequest = z.input<typeof GuestbookSubmissionRequestSchema>;
export type TributeSubmissionRequest = z.input<typeof TributeSubmissionRequestSchema>;
export type OrganizerSessionRequest = z.input<typeof OrganizerSessionRequestSchema>;
export type ModerationRequest = z.input<typeof ModerationRequestSchema>;
export type StoryParagraphInput = z.input<typeof StoryParagraphInputSchema>;
export type StoryUpdateRequest = z.input<typeof StoryUpdateRequestSchema>;

export type ContributionStatus = z.infer<typeof ContributionStatusSchema>;
export type ModerationDecision = z.infer<typeof ModerationDecisionSchema>;
export type StoryStatus = z.infer<typeof StoryStatusSchema>;
export type ModerationHint = z.infer<typeof ModerationHintSchema>;
export type PortraitKey = z.infer<typeof PortraitKeySchema>;
export type Portrait = z.infer<typeof PortraitSchema>;
export type PublicMemorial = z.infer<typeof PublicMemorialSchema>;
export type PublicGuestbookEntry = z.infer<typeof PublicGuestbookEntrySchema>;
export type PublicTribute = z.infer<typeof PublicTributeSchema>;
export type StoryParagraph = z.infer<typeof StoryParagraphSchema>;
export type AiDisclosure = z.infer<typeof AiDisclosureSchema>;
export type PublicStory = z.infer<typeof PublicStorySchema>;
export type WeaveFlagCode = z.infer<typeof WeaveFlagCodeSchema>;
export type WeaveFlag = z.infer<typeof WeaveFlagSchema>;
export type OrganizerSession = z.infer<typeof OrganizerSessionSchema>;
export type OrganizerGuestbookEntry = z.infer<typeof OrganizerGuestbookEntrySchema>;
export type OrganizerTribute = z.infer<typeof OrganizerTributeSchema>;
export type StoryView = z.infer<typeof StoryViewSchema>;
export type OrganizerMemorial = z.infer<typeof OrganizerMemorialSchema>;

export type CreateMemorialResponse = z.infer<typeof CreateMemorialResponseSchema>;
export type PublicMemorialResponse = z.infer<typeof PublicMemorialResponseSchema>;
export type SubmissionReceiptResponse = z.infer<typeof SubmissionReceiptResponseSchema>;
export type OrganizerSessionResponse = z.infer<typeof OrganizerSessionResponseSchema>;
export type OrganizerMemorialResponse = z.infer<typeof OrganizerMemorialResponseSchema>;
export type ModerateGuestbookResponse = z.infer<typeof ModerateGuestbookResponseSchema>;
export type ModerateTributeResponse = z.infer<typeof ModerateTributeResponseSchema>;
export type WeaveResponse = z.infer<typeof WeaveResponseSchema>;
export type StoryUpdateResponse = z.infer<typeof StoryUpdateResponseSchema>;
export type RotateTokenResponse = z.infer<typeof RotateTokenResponseSchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
