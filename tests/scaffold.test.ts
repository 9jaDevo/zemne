import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("public repository guardrails", () => {
  it("keeps the authoritative planning documents", () => {
    for (const name of ["01_ZEMNE_MASTER_BLUEPRINT.md", "02_ZEMNE_PHASE_TRACKER.md", "03_ZEMNE_AGENT_PHASE_PROMPTS.md"]) {
      expect(existsSync(name)).toBe(true);
    }
  });
  it("publishes environment variable names only", () => {
    const names = readFileSync(".env.example", "utf8").trim().split(/\r?\n/);
    expect(names).toEqual(["MONGODB_URI", "SESSION_SECRET", "GEMMA_API_BASE_URL", "GEMMA_MODEL_ID", "GEMMA_API_KEY"]);
    expect(names.every((name) => /^[A-Z][A-Z0-9_]*$/.test(name))).toBe(true);
  });
});
