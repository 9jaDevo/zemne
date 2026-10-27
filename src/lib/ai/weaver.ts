/**
 * Memory Weaver pipeline: approved tributes -> prompt -> Gemma -> validator
 * -> grounding flags. One repair retry on unverifiable output. Never returns
 * text that did not come from the model, and never publishes.
 */
import {
  prepareWeaveInput,
  validateWeaveOutput,
  type ValidatedWeaveDraft,
  type WeaveMemorialMetadata,
  type WeaveSourceTribute,
} from "../../shared/api";
import { GemmaError, type GemmaClient } from "./gemma-client";
import { groundingFlags } from "./grounding";
import { buildRepairPrompt, buildWeavePrompt } from "./prompt";

export interface WeaveResult {
  draft: ValidatedWeaveDraft;
  modelId: string;
  providerLabel: string;
  /** Model latency summed over attempts, in ms. */
  latencyMs: number;
  attempts: number;
  /** Upstream overload retries used (0–3). */
  overloadRetries: number;
}

/**
 * Whole-weave budget across attempts. Measured gemma-4-31b-it latency on
 * Google AI Studio was 61–152 s per call (tracker P5), and overload errors
 * (500/503) typically arrived after 5–58 s. 220 s leaves room for a retry
 * after an early overload. Weave runs as a background job, so no HTTP
 * request waits this long.
 */
export const WEAVE_BUDGET_MS = 220_000;
/** Upstream statuses worth retrying (overload, transient server errors). */
const TRANSIENT = new Set([429, 500, 502, 503]);
/** Backoff before each overload retry; its length is the retry limit. */
export const OVERLOAD_BACKOFF_MS = [3_000, 8_000, 15_000] as const;
/** Only retry if at least this much budget remains: a real call takes >= ~60 s. */
export const MIN_CALL_BUDGET_MS = 60_000;

export type WeaveFailure = "AI_INVALID_OUTPUT" | "AI_UNAVAILABLE" | "AI_TIMEOUT";

export class WeaveError extends Error {
  constructor(
    readonly code: WeaveFailure,
    readonly detail: string,
  ) {
    super(code);
    this.name = "WeaveError";
  }
}

export interface WeaveOptions {
  /** Whole-call budget across attempts. Default WEAVE_BUDGET_MS. */
  budgetMs?: number;
  /** Waits before overload retries. Default OVERLOAD_BACKOFF_MS. */
  backoffMs?: readonly number[];
  now?: () => number;
}

export async function weaveRemembrance(
  client: GemmaClient,
  memorial: WeaveMemorialMetadata,
  approvedTributes: readonly WeaveSourceTribute[],
  opts: WeaveOptions = {},
): Promise<WeaveResult> {
  const now = opts.now ?? (() => performance.now());
  const deadline = now() + (opts.budgetMs ?? WEAVE_BUDGET_MS);
  const { input, aliasToId } = prepareWeaveInput(memorial, approvedTributes);
  const prompt = buildWeavePrompt(input);
  const byId = new Map(approvedTributes.map((t) => [t.id, t.content]));

  let latencyMs = 0;
  let lastReason = "no attempt";
  const backoff = opts.backoffMs ?? OVERLOAD_BACKOFF_MS;
  let overloadRetries = 0;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const remaining = deadline - now();
    if (remaining < 2_000) {
      if (attempt === 1) throw new WeaveError("AI_TIMEOUT", "no time budget");
      break; // first answer was unverifiable and there is no time to retry
    }
    let completion;
    try {
      completion = await client.complete(attempt === 1 ? prompt : buildRepairPrompt(prompt, lastReason), { timeoutMs: Math.floor(remaining) });
    } catch (error) {
      if (error instanceof GemmaError) {
        if (error.kind === "invalid_output") {
          lastReason = "empty or malformed response envelope";
          continue;
        }
        const delay = backoff[overloadRetries];
        if (
          error.kind === "unavailable" &&
          TRANSIENT.has(error.upstreamStatus ?? 0) &&
          delay !== undefined &&
          deadline - now() - delay >= MIN_CALL_BUDGET_MS
        ) {
          overloadRetries++;
          await new Promise((r) => setTimeout(r, delay));
          attempt--; // an overload retry does not use up the repair attempt
          continue;
        }
        throw new WeaveError(
          error.kind === "timeout" ? "AI_TIMEOUT" : "AI_UNAVAILABLE",
          `${error.kind}:${error.upstreamStatus ?? "-"}; overload retries ${overloadRetries}`,
        );
      }
      throw error;
    }
    latencyMs += completion.latencyMs;
    const result = validateWeaveOutput(completion.text, aliasToId);
    if (result.ok) {
      const flags = [...result.draft.flags, ...groundingFlags(result.draft.paragraphs, byId, memorial)];
      return {
        draft: { ...result.draft, flags },
        modelId: completion.modelId,
        providerLabel: client.providerLabel,
        latencyMs,
        attempts: attempt,
        overloadRetries,
      };
    }
    lastReason = result.reason.replace(/[^\w ,.:'-]/g, "").slice(0, 160);
  }
  throw new WeaveError("AI_INVALID_OUTPUT", lastReason);
}
