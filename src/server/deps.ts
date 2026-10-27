/**
 * Injectable dependencies so handlers run unchanged against Atlas in
 * production and an in-memory MongoDB in tests.
 */
import type { Db } from "mongodb";
import { getDatabase } from "../lib/db/client";
import { readConfig, type ServerConfig } from "./config";

export interface ServerDeps {
  config: ServerConfig;
  db: () => Promise<Db>;
  now: () => Date;
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
    };
  }
  return cached;
}
