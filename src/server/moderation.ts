/**
 * Organizer-only moderation hints and slug generation.
 * Hints are advisory badges; nothing here changes a submission's status.
 */
import { randomInt } from "node:crypto";
import type { ModerationHint } from "../shared/api";

const LINK = /\bhttps?:\/\/|\bwww\.|\b[a-z0-9-]{2,}\.(?:com|net|org|io|co|ng|uk|info|biz|xyz|app|dev|link|ly)\b/i;
const EMAIL = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;
const PHONE = /(?:\+?\d[\s().-]?){9,}/;
const PROFANITY = /\b(?:fuck\w*|shit\w*|cunt\w*|bitch\w*|bastard\w*|asshole\w*|dickhead\w*|wanker\w*|slut\w*|whore\w*)\b/i;
const INSTRUCTION =
  /\b(?:ignore|disregard|forget)\s+(?:all\s+|any\s+)?(?:previous|prior|above|earlier)\s+(?:instructions?|prompts?|rules)\b|\bsystem\s+prompt\b|\byou\s+are\s+now\b|\bas\s+an\s+ai\b|<\/?(?:system|assistant|instructions?)>/i;

export function moderationHints(texts: string[], duplicate: boolean): ModerationHint[] {
  const all = texts.join("\n");
  const hints: ModerationHint[] = [];
  if (LINK.test(all)) hints.push("contains_link");
  if (PROFANITY.test(all)) hints.push("possible_profanity");
  if (EMAIL.test(all) || PHONE.test(all)) hints.push("possible_personal_data");
  if (INSTRUCTION.test(all)) hints.push("possible_instruction_text");
  if (duplicate) hints.push("duplicate_submission");
  return hints;
}

const SUFFIX_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

/** `elowen-marsh-k7q2xm`: readable name part plus a 6-char random suffix (~30 bits). */
export function makeSlug(name: string): string {
  const base =
    name
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48)
      .replace(/-+$/g, "") || "memorial";
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += SUFFIX_ALPHABET[randomInt(SUFFIX_ALPHABET.length)];
  return `${base}-${suffix}`;
}
