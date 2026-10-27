/**
 * Injectable dependencies so handlers run unchanged against Atlas in
 * production and an in-memory MongoDB in tests.
 */
import type { Db } from "mongodb";
import { createGemmaClient, type GemmaClient } from "../lib/ai/gemma-client";
import { getDatabase } from "../lib/db/client";
import { readConfig, type ServerConfig } from "./config";

export interface ServerDeps {
  config: ServerConfig;
  db: () => Promise<Db>;
  now: () => Date;
  /** Real Gemma endpoint client, or null when GEMMA_* is not configured. */
  gemma?: GemmaClient | null;
  /**
   * Runs work after the response is sent. The default fires and forgets, which
   * needs a long-lived Node server (Render web service), not a serverless runtime.
   */
  background?: (task: () => Promise<void>) => void;
}

export function runInBackground(task: () => Promise<void>): void {
  void task().catch((error) =>
    console.error(JSON.stringify({ level: "error", event: "background_task_failed", error: (error as { name?: string })?.name ?? "Error" })),
  );
}

let cached: ServerDeps | null = null;

export function serverDeps(): ServerDeps {
  if (!cached) {
    const config = readConfig();
    cached = {
      config,
      db: () => {
        if (!config.mongodbUri) return Promise.reject(Object.assign(new Error("MONGODB_URI not configured"), { name: "ConfigError" }));
        return getDatabase(config.mongodbUri);
      },
      now: () => new Date(),
      gemma: config.gemma ? createGemmaClient(config.gemma) : null,
      background: runInBackground,
    };
  }
  return cached;
}
