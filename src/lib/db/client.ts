/**
 * Process-wide MongoDB client. Reads MONGODB_URI from the backend runtime
 * environment only; never logs it or raw driver errors.
 */
import { MongoClient, type Db } from "mongodb";
import { ensureDatabase } from "./schema";

const DEFAULT_DB = "zemne";

interface Cache {
  uri: string;
  client: MongoClient;
  db: Promise<Db>;
}

// Survives Next.js dev hot reloads.
const globalCache = globalThis as unknown as { __zemneMongo?: Cache };

function isLocalHost(uri: string): boolean {
  return /^mongodb:\/\/(?:[^@/]*@)?(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?/i.test(uri);
}

/** Database name from the URI path, defaulting to `zemne`. */
export function databaseNameFromUri(uri: string): string {
  const match = /^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]*)/i.exec(uri);
  const name = match?.[1] ? decodeURIComponent(match[1]) : "";
  return name || DEFAULT_DB;
}

export function getDatabase(uri: string): Promise<Db> {
  const cached = globalCache.__zemneMongo;
  if (cached && cached.uri === uri) return cached.db;

  const client = new MongoClient(uri, {
    // Remote clusters must use validated TLS; local test servers do not.
    ...(isLocalHost(uri) ? {} : { tls: true, tlsAllowInvalidCertificates: false, tlsAllowInvalidHostnames: false }),
    serverSelectionTimeoutMS: 8_000,
    connectTimeoutMS: 8_000,
    maxPoolSize: 10,
    appName: "zemne-app",
  });
  const db = client
    .connect()
    .then(async (c) => {
      const database = c.db(databaseNameFromUri(uri));
      await ensureDatabase(database);
      return database;
    })
    .catch((error) => {
      if (globalCache.__zemneMongo?.client === client) delete globalCache.__zemneMongo;
      void client.close().catch(() => undefined);
      throw error;
    });
  globalCache.__zemneMongo = { uri, client, db };
  return db;
}
