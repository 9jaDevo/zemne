/**
 * Deterministic post-checks on a validated draft. They never rewrite text;
 * they add `origin: "validator"` flags so the organizer reviews anything that
 * might be fabricated: numbers/years, proper names absent from the cited
 * tributes, and paragraphs that share little wording with their sources.
 */
import type { StoryParagraph, WeaveFlag, WeaveMemorialMetadata } from "../../shared/api";

const STOP_CAPS = new Set([
  "a", "an", "and", "as", "at", "but", "for", "from", "her", "his", "in", "it", "its", "of", "on", "or", "our",
  "she", "he", "they", "their", "the", "this", "that", "those", "these", "to", "we", "with", "when", "while",
  "whether", "who", "whose", "many", "some", "one", "every", "each", "both", "all", "friends", "family",
  "i", "remembering", "remembrance", "memories", "monday", "tuesday", "wednesday", "thursday", "friday",
  "saturday", "sunday", "january", "february", "march", "april", "may", "june", "july", "august",
  "september", "october", "november", "december", "christmas", "easter",
]);

const words = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").match(/[a-z0-9']+/g) ?? [];

function corpusFor(ids: string[], tributes: ReadonlyMap<string, string>, memorial: WeaveMemorialMetadata): string {
  return [
    memorial.name,
    memorial.description,
    String(memorial.birth_year ?? ""),
    String(memorial.death_year ?? ""),
    ...ids.map((id) => tributes.get(id) ?? ""),
  ].join("\n");
}

/** Capitalized words that are not sentence-initial. */
function properNouns(text: string): string[] {
  const out: string[] = [];
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    const tokens = sentence.match(/[\p{L}][\p{L}'’-]*/gu) ?? [];
    tokens.slice(1).forEach((tok) => {
      if (/^\p{Lu}/u.test(tok) && !STOP_CAPS.has(tok.toLowerCase())) out.push(tok.replace(/['’]s$/, ""));
    });
  }
  return [...new Set(out)];
}

export function groundingFlags(
  paragraphs: StoryParagraph[],
  tributesById: ReadonlyMap<string, string>,
  memorial: WeaveMemorialMetadata,
): WeaveFlag[] {
  const flags: WeaveFlag[] = [];
  paragraphs.forEach((p, i) => {
    const corpus = corpusFor(p.source_tribute_ids, tributesById, memorial);
    const corpusWords = new Set(words(corpus));

    const numbers = [...new Set(p.text.match(/\b\d[\d,.]*\b/g) ?? [])].filter((n) => !corpus.includes(n));
    if (numbers.length) {
      flags.push({
        code: "unsupported_claim",
        origin: "validator",
        paragraph_index: i,
        message: `Mentions ${numbers.slice(0, 3).map((n) => `"${n}"`).join(", ")}, which does not appear in the cited tributes. Check before publishing.`,
        source_tribute_ids: p.source_tribute_ids,
      });
    }

    const names = properNouns(p.text).filter((n) => !words(n).every((w) => corpusWords.has(w)));
    if (names.length) {
      flags.push({
        code: "uncertain_detail",
        origin: "validator",
        paragraph_index: i,
        message: `Mentions ${names.slice(0, 3).map((n) => `"${n}"`).join(", ")}, which does not appear in the cited tributes. Check before publishing.`,
        source_tribute_ids: p.source_tribute_ids,
      });
    }

    const content = words(p.text).filter((w) => w.length >= 5);
    if (content.length >= 8) {
      const shared = content.filter((w) => corpusWords.has(w)).length / content.length;
      if (shared < 0.2) {
        flags.push({
          code: "uncertain_detail",
          origin: "validator",
          paragraph_index: i,
          message: "This paragraph shares little wording with the tributes it cites. Compare it with the sources before publishing.",
          source_tribute_ids: p.source_tribute_ids,
        });
      }
    }
  });
  return flags;
}
