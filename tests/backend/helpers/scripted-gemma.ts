/**
 * TEST DOUBLE ONLY. Plays back scripted model replies so the pipeline's
 * validation, persistence and failure paths can be tested deterministically.
 * It is never wired into src/ and never represents real Gemma output.
 */
import { GemmaError, type Completion, type GemmaClient } from "../../../src/lib/ai/gemma-client";

export type Step = string | object | GemmaError | ((prompt: string) => string | object | Promise<string | object>);

export interface ScriptedGemma extends GemmaClient {
  prompts: string[];
}

export function scriptedGemma(steps: Step[], modelId = "test-double-not-a-model"): ScriptedGemma {
  const queue = [...steps];
  const prompts: string[] = [];
  return {
    modelId,
    providerLabel: "Test double (no model called)",
    prompts,
    async complete(prompt): Promise<Completion> {
      prompts.push(prompt);
      const step = queue.shift();
      if (step === undefined) throw new Error("scriptedGemma: no more steps");
      if (step instanceof GemmaError) throw step;
      const value = typeof step === "function" ? await step(prompt) : step;
      return { text: typeof value === "string" ? value : JSON.stringify(value), modelId, latencyMs: 1 };
    },
  };
}
