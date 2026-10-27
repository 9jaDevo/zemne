/**
 * Minimal client for an OpenAI-compatible chat-completions endpoint serving a
 * Gemma model (Google AI Studio's Gemini API compatibility layer, Hugging Face
 * router, OpenRouter, Ollama, ...).
 *
 * Gemma on the Gemini API rejects system instructions and JSON response mode,
 * so the whole prompt goes in one user message and JSON is enforced by our
 * own validator instead. Never logs prompts, outputs, keys or raw errors.
 */
import type { GemmaConfig } from "../../server/config";

export type GemmaFailure = "timeout" | "unavailable" | "invalid_output";

export class GemmaError extends Error {
  constructor(
    readonly kind: GemmaFailure,
    /** Upstream HTTP status, if any. Safe to log. */
    readonly upstreamStatus: number | null = null,
  ) {
    super(`gemma_${kind}`);
    this.name = "GemmaError";
  }
}

export interface Completion {
  text: string;
  /** Model id as reported by the endpoint (falls back to the configured id). */
  modelId: string;
  latencyMs: number;
}

export interface GemmaClient {
  readonly modelId: string;
  readonly providerLabel: string;
  complete(prompt: string, opts: { timeoutMs: number; maxTokens?: number }): Promise<Completion>;
}

/** Human-readable provider label for the AI disclosure, derived from the host. */
export function providerLabelFor(baseUrl: string): string {
  let host = "";
  try {
    host = new URL(baseUrl).host;
  } catch {
    return "Configured Gemma endpoint";
  }
  if (host === "generativelanguage.googleapis.com") return "Google AI Studio (Gemini API)";
  if (host.endsWith("huggingface.co")) return "Hugging Face Inference Providers";
  if (host.endsWith("openrouter.ai")) return "OpenRouter";
  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) return "Local Gemma server";
  return host;
}

export function createGemmaClient(config: GemmaConfig, fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis)): GemmaClient {
  const url = `${config.baseUrl}/chat/completions`;
  return {
    modelId: config.modelId,
    providerLabel: providerLabelFor(config.baseUrl),
    async complete(prompt, { timeoutMs, maxTokens = 1400 }) {
      const started = performance.now();
      let res: Response;
      try {
        res = await fetchImpl(url, {
          method: "POST",
          signal: AbortSignal.timeout(timeoutMs),
          headers: {
            "Content-Type": "application/json",
            ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
          },
          body: JSON.stringify({
            model: config.modelId,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: maxTokens,
          }),
        });
      } catch (error) {
        const name = (error as { name?: string })?.name;
        throw new GemmaError(name === "TimeoutError" || name === "AbortError" ? "timeout" : "unavailable");
      }
      if (!res.ok) {
        await res.body?.cancel().catch(() => undefined);
        throw new GemmaError(res.status === 408 || res.status === 504 ? "timeout" : "unavailable", res.status);
      }
      let payload: unknown;
      try {
        payload = await res.json();
      } catch (error) {
        const name = (error as { name?: string })?.name;
        throw new GemmaError(name === "TimeoutError" || name === "AbortError" ? "timeout" : "invalid_output", res.status);
      }
      const body = payload as { model?: unknown; choices?: { message?: { content?: unknown } }[] };
      const text = body.choices?.[0]?.message?.content;
      if (typeof text !== "string" || !text.trim()) throw new GemmaError("invalid_output", res.status);
      return {
        text,
        modelId: typeof body.model === "string" && body.model.trim() ? body.model.trim().replace(/^models\//, "") : config.modelId,
        latencyMs: Math.round(performance.now() - started),
      };
    },
  };
}
