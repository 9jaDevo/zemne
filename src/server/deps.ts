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
    };
  }
  return cached;
}
