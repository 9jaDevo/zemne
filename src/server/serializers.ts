/**
 * Allowlist serializers (contract §3.4). Every API body is built here field by
 * field; DB documents are never spread into responses.
 */
import type {
  OrganizerGuestbookEntry,
  OrganizerMemorial,
  OrganizerTribute,
  PublicGuestbookEntry,
  PublicMemorial,
  PublicStory,
  PublicTribute,
  StoryView,
} from "../shared/api";
import { APP_PATHS } from "../shared/api";
import type { GuestbookEntryDoc, MemorialDoc, StoryDraftDoc, TributeDoc } from "../lib/db/types";

const iso = (d: Date) => d.toISOString();
const isoOrNull = (d: Date | null) => (d ? d.toISOString() : null);

export function toPublicMemorial(m: MemorialDoc): PublicMemorial {
  return {
    slug: m.slug,
    name: m.name,
    birth_year: m.birth_year,
    death_year: m.death_year,
    description: m.description,
    portrait: m.portrait_key ? { kind: "placeholder", key: m.portrait_key } : null,
    created_at: iso(m.created_at),
  };
}

export function toOrganizerMemorial(m: MemorialDoc): OrganizerMemorial {
  return {
    id: m._id.toHexString(),
    slug: m.slug,
    guest_path: APP_PATHS.guest(m.slug),
    name: m.name,
    birth_year: m.birth_year,
    death_year: m.death_year,
    description: m.description,
    portrait: m.portrait_key ? { kind: "placeholder", key: m.portrait_key } : null,
    visibility: m.visibility,
    created_at: iso(m.created_at),
    updated_at: iso(m.updated_at),
  };
}

export function toPublicGuestbookEntry(g: GuestbookEntryDoc): PublicGuestbookEntry {
  return { id: g._id.toHexString(), display_name: g.display_name, message: g.message, created_at: iso(g.created_at) };
}

export function toPublicTribute(t: TributeDoc): PublicTribute {
  return {
    id: t._id.toHexString(),
    contributor_name: t.contributor_name,
    relationship: t.relationship,
    content: t.content,
    created_at: iso(t.created_at),
  };
}

export function toOrganizerGuestbookEntry(g: GuestbookEntryDoc): OrganizerGuestbookEntry {
  return {
    ...toPublicGuestbookEntry(g),
    status: g.status,
    moderation_hints: g.moderation_hints,
    moderated_at: isoOrNull(g.moderated_at),
  };
}

export function toOrganizerTribute(t: TributeDoc): OrganizerTribute {
  return {
    ...toPublicTribute(t),
    status: t.status,
    moderation_hints: t.moderation_hints,
    moderated_at: isoOrNull(t.moderated_at),
  };
}

export function toStoryView(s: StoryDraftDoc): StoryView {
  return {
    id: s._id.toHexString(),
    memorial_id: s.memorial_id.toHexString(),
    status: s.status,
    version: s.version,
    title: s.title,
    paragraphs: s.paragraphs.map((p) => ({ text: p.text, source_tribute_ids: p.source_tribute_ids.map((id) => id.toHexString()) })),
    flags: s.flags.map((f) => ({
      code: f.code,
      origin: f.origin,
      paragraph_index: f.paragraph_index,
      message: f.message,
      source_tribute_ids: f.source_tribute_ids.map((id) => id.toHexString()),
    })),
    input_tribute_ids: s.input_tribute_ids.map((id) => id.toHexString()),
    ai: { model_id: s.model_id, provider_label: s.provider_label },
    edited_by_organizer: s.edited_by_organizer,
    created_at: iso(s.created_at),
    updated_at: iso(s.updated_at),
    published_at: isoOrNull(s.published_at),
  };
}

/**
 * Public story. Defense in depth: citations to tributes not in the public list
 * are dropped, and a paragraph left uncited is omitted, so the wall can never
 * point at hidden content. (Rejecting a cited tribute already unpublishes.)
 */
export function toPublicStory(s: StoryDraftDoc, visibleTributeIds: ReadonlySet<string>): PublicStory | null {
  if (s.status !== "published" || !s.published_at) return null;
  const paragraphs = s.paragraphs
    .map((p) => ({ text: p.text, source_tribute_ids: p.source_tribute_ids.map((id) => id.toHexString()).filter((id) => visibleTributeIds.has(id)) }))
    .filter((p) => p.source_tribute_ids.length > 0);
  if (paragraphs.length === 0) return null;
  return {
    id: s._id.toHexString(),
    title: s.title,
    paragraphs,
    edited_by_organizer: s.edited_by_organizer,
    ai: { model_id: s.model_id, provider_label: s.provider_label },
    published_at: iso(s.published_at),
  };
}
