/**
 * Memory Weaver (Gemma) model contract.
 *
 * Server -> model: memorial display metadata + approved tributes as `{id, text}`,
 * where `id` is a short per-request alias (`T1`, `T2`, ...) rather than the
 * database id. Short aliases are harder to mangle, and the server maps them
 * back, so a model can never cite a tribute it was not given.
 *
 * Model -> server: JSON `{title, paragraphs:[{text, source_tribute_ids}], flags}`.
 * validateWeaveOutput() is the single gate between raw model text and a
 * stored draft. Passing it means "citations point at provided tributes" — it
 * does NOT mean the claims are verified; the organizer still reviews.
 */
import { z } from "zod";
import {
  LIMITS,
  normalizeMultiline,
  normalizeSingleLine,
  type StoryParagraph,
  type WeaveFlag,
  type WeaveFlagCode,
} from "./schemas";

export const WEAVE_SCHEMA_VERSION = "zemne.weave.v1";

export interface WeaveSourceTribute {
  /** Database id (ObjectId). Never sent to the model. */
  id: string;
  content: string;
}

export interface WeaveMemorialMetadata {
  name: string;
  birth_year: number | null;
  death_year: number | null;
  description: string;
}

export interface WeaveModelInput {
  schema: typeof WEAVE_SCHEMA_VERSION;
  memorial: WeaveMemorialMetadata;
  /** Untrusted user content. The prompt must frame it as data, never instructions. */
  tributes: { id: string; text: string }[];
}

export interface PreparedWeaveInput {
  input: WeaveModelInput;
  /** alias (`T1`) -> database id */
  aliasToId: ReadonlyMap<string, string>;
}

/** Builds the model payload. Callers pass ONLY tributes whose status is `approved`. */
export function prepareWeaveInput(
  memorial: WeaveMemorialMetadata,
  approvedTributes: readonly WeaveSourceTribute[],
): PreparedWeaveInput {
  if (approvedTributes.length === 0) {
    throw new Error("prepareWeaveInput requires at least one approved tribute (NO_APPROVED_TRIBUTES)");
  }
  const aliasToId = new Map<string, string>();
  const tributes = approvedTributes.map((t, i) => {
    const alias = `T${i + 1}`;
    aliasToId.set(alias, t.id);
    return { id: alias, text: t.content };
  });
  return {
    input: {
      schema: WEAVE_SCHEMA_VERSION,
      memorial: {
        name: memorial.name,
        birth_year: memorial.birth_year,
        death_year: memorial.death_year,
        description: memorial.description,
      },
      tributes,
    },
    aliasToId,
  };
}

/** Flag codes the model itself may emit. Validator-only codes are excluded. */
export const ModelFlagCodeSchema = z.enum([
  "unsupported_claim",
  "uncertain_detail",
  "conflicting_accounts",
  "sensitive_content",
  "possible_instruction_ignored",
  "insufficient_material",
]);

/**
 * Raw model output. Lenient where safe (unknown flag codes degrade to
 * `uncertain_detail`, extra keys such as `"status":"published"` are stripped
 * and ignored), strict where it matters (shape, lengths, paragraph count).
 */
export const WeaveModelOutputSchema = z.object({
  title: z.string().max(LIMITS.storyTitle.max * 2),
  paragraphs: z
    .array(
      z.object({
        text: z.string().max(LIMITS.storyParagraph.max * 2),
        source_tribute_ids: z.array(z.string().max(40)).max(40),
      }),
    )
    .min(1)
    .max(LIMITS.storyParagraphs.max),
  flags: z
    .array(
      z.object({
        code: ModelFlagCodeSchema.catch("uncertain_detail"),
        paragraph_index: z.int().min(0).nullable().optional().catch(null),
        message: z.string().max(LIMITS.flagMessage.max * 2).catch(""),
        source_tribute_ids: z.array(z.string().max(40)).max(40).optional().catch([]),
      }),
    )
    .max(20)
    .optional()
    .default([]),
});

export type WeaveModelOutput = z.infer<typeof WeaveModelOutputSchema>;

/** JSON Schema-ish description to embed in the prompt / constrained decoding. */
export const WEAVE_OUTPUT_JSON_SHAPE = {
  title: "string (<=120 chars)",
  paragraphs: [{ text: "string (<=1200 chars)", source_tribute_ids: ["T1"] }],
  flags: [{ code: ModelFlagCodeSchema.options.join("|"), paragraph_index: "number|null", message: "string", source_tribute_ids: ["T2"] }],
} as const;

export interface ValidatedWeaveDraft {
  title: string;
  paragraphs: StoryParagraph[];
  flags: WeaveFlag[];
}

export type WeaveValidationResult =
  | { ok: true; draft: ValidatedWeaveDraft }
  | { ok: false; code: "AI_INVALID_OUTPUT"; reason: string };

const fail = (reason: string): WeaveValidationResult => ({ ok: false, code: "AI_INVALID_OUTPUT", reason });

function parseRaw(raw: unknown): unknown {
  if (typeof raw !== "string") return raw;
  const unfenced = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(unfenced);
}

const clip = (s: string, max: number) => (s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s);

/**
 * Validates raw model output against the aliases the model was given.
 * - malformed JSON / wrong shape / empty title -> AI_INVALID_OUTPUT
 * - unknown or duplicate citations are dropped (flag `unknown_source_removed`)
 * - paragraphs left with no valid citation are dropped (flag `paragraph_without_sources_removed`)
 * - nothing left -> AI_INVALID_OUTPUT
 * The resulting draft is always stored as status `draft`; nothing here can publish.
 */
export function validateWeaveOutput(raw: unknown, aliasToId: ReadonlyMap<string, string>): WeaveValidationResult {
  let json: unknown;
  try {
    json = parseRaw(raw);
  } catch {
    return fail("Model output is not valid JSON");
  }
  const parsed = WeaveModelOutputSchema.safeParse(json);
  if (!parsed.success) {
    return fail(`Model output does not match schema: ${parsed.error.issues[0]?.message ?? "invalid"}`);
  }
  const out = parsed.data;

  const title = clip(normalizeSingleLine(out.title), LIMITS.storyTitle.max);
  if (!title) return fail("Model output has an empty title");

  const resolve = (alias: string) => aliasToId.get(alias.trim().toUpperCase());
  const flags: WeaveFlag[] = [];
  const paragraphs: StoryParagraph[] = [];
  const indexMap = new Map<number, number>();

  out.paragraphs.forEach((p, originalIndex) => {
    const text = normalizeMultiline(p.text);
    const ids: string[] = [];
    let unknown = 0;
    for (const alias of p.source_tribute_ids) {
      const id = resolve(alias);
      if (!id) unknown++;
      else if (!ids.includes(id)) ids.push(id);
    }
    if (!text || text.length > LIMITS.storyParagraph.max) {
      flags.push({
        code: "paragraph_without_sources_removed",
        origin: "validator",
        paragraph_index: null,
        message: "A generated paragraph was removed because it was empty or too long.",
        source_tribute_ids: ids,
      });
      return;
    }
    if (ids.length === 0) {
      flags.push({
        code: "paragraph_without_sources_removed",
        origin: "validator",
        paragraph_index: null,
        message: "A generated paragraph was removed because it did not cite any provided tribute.",
        source_tribute_ids: [],
      });
      return;
    }
    const newIndex = paragraphs.length;
    indexMap.set(originalIndex, newIndex);
    paragraphs.push({ text, source_tribute_ids: ids.slice(0, LIMITS.sourcesPerParagraph.max) });
    if (unknown > 0) {
      flags.push({
        code: "unknown_source_removed",
        origin: "validator",
        paragraph_index: newIndex,
        message: `Removed ${unknown} citation(s) to tributes that were not provided to the model. Review this paragraph.`,
        source_tribute_ids: [],
      });
    }
  });

  if (paragraphs.length === 0) return fail("No paragraph cited a provided tribute");

  for (const f of out.flags) {
    const message = clip(normalizeSingleLine(f.message), LIMITS.flagMessage.max) || "The model flagged this for review.";
    const ids = (f.source_tribute_ids ?? []).map(resolve).filter((id): id is string => Boolean(id));
    const paragraph_index = f.paragraph_index == null ? null : (indexMap.get(f.paragraph_index) ?? null);
    flags.push({ code: f.code as WeaveFlagCode, origin: "model", paragraph_index, message, source_tribute_ids: [...new Set(ids)] });
  }

  return { ok: true, draft: { title, paragraphs, flags } };
}
