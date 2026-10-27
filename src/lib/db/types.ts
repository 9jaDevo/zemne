/**
 * MongoDB document shapes. Field names follow docs/API_CONTRACT.md §8.
 * These are server-only; API responses are built by src/server/serializers.ts.
 */
import type { ObjectId } from "mongodb";
import type {
  ContributionStatus,
  ModerationHint,
  PortraitKey,
  StoryStatus,
  WeaveFlagCode,
} from "../../shared/api";

export interface MemorialDoc {
  _id: ObjectId;
  slug: string;
  name: string;
  birth_year: number | null;
  death_year: number | null;
  description: string;
  portrait_key: PortraitKey | null;
  /** SHA-256 hex of the organizer token. The raw token is never stored. */
  owner_token_hash: string;
  /** Incremented on rotation; sessions carrying an older version are rejected. */
  owner_token_version: number;
  visibility: "unlisted";
  created_at: Date;
  updated_at: Date;
  /** Latest weave job. A `running` job whose deadline has not passed is the in-flight lock. */
  weave_job?: WeaveJobDoc | null;
}

export interface WeaveJobDoc {
  id: ObjectId;
  status: "running" | "succeeded" | "failed";
  started_at: Date;
  /** After this, a still-`running` job is treated as failed (AI_TIMEOUT), e.g. after a restart. */
  deadline: Date;
  finished_at: Date | null;
  story_id: ObjectId | null;
  error_code: "AI_INVALID_OUTPUT" | "AI_UNAVAILABLE" | "AI_TIMEOUT" | "INTERNAL" | null;
}

interface ContributionBase {
  _id: ObjectId;
  memorial_id: ObjectId;
  status: ContributionStatus;
  consent: true;
  moderation_hints: ModerationHint[];
  /** Keyed HMAC of the submitter IP (never the raw IP). */
  ip_hash: string;
  /** SHA-256 of the case-folded text, for duplicate hints. */
  content_hash: string;
  created_at: Date;
  moderated_at: Date | null;
}

export interface GuestbookEntryDoc extends ContributionBase {
  display_name: string;
  message: string;
}

export interface TributeDoc extends ContributionBase {
  contributor_name: string;
  relationship: string | null;
  content: string;
}

export interface StoryParagraphDoc {
  text: string;
  source_tribute_ids: ObjectId[];
}

export interface StoryFlagDoc {
  code: WeaveFlagCode;
  origin: "model" | "validator";
  paragraph_index: number | null;
  message: string;
  source_tribute_ids: ObjectId[];
}

export interface StoryDraftDoc {
  _id: ObjectId;
  memorial_id: ObjectId;
  status: StoryStatus;
  version: number;
  title: string;
  paragraphs: StoryParagraphDoc[];
  flags: StoryFlagDoc[];
  input_tribute_ids: ObjectId[];
  model_id: string;
  provider_label: string;
  edited_by_organizer: boolean;
  created_at: Date;
  updated_at: Date;
  published_at: Date | null;
}

export interface RateLimitDoc {
  /** `<rule>:<scope>:<window start>` */
  _id: string;
  count: number;
  expires_at: Date;
}
