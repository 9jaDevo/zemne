/**
 * Integration harness: real handlers + real MongoDB (in-memory single-node
 * replica set, so transactions behave as on Atlas) + a controllable clock.
 */
import { MongoClient, type Db } from "mongodb";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { COLLECTIONS, ensureDatabase } from "../../../src/lib/db/schema";
import type { ServerDeps } from "../../../src/server/deps";
import { run, type Handler } from "../../../src/server/http";

export const HOST = "zemne.test";
export const ORIGIN = `https://${HOST}`;
export const TEST_SECRET = "test-only-session-secret-0123456789abcdefghij";
export const START = new Date("2026-10-27T12:00:00.000Z");

export interface CallOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  params?: Record<string, string>;
  body?: unknown;
  rawBody?: string;
  cookie?: string | null;
  /** `null` omits the Origin header. Defaults to the same origin for writes. */
  origin?: string | null;
  ip?: string;
  headers?: Record<string, string>;
}

export interface CallResult {
  status: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any;
  headers: Headers;
  setCookie: string | null;
  /** `name=value` from Set-Cookie, ready to send back. */
  cookie: string | null;
}

export async function startTestServer() {
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const client = new MongoClient(replSet.getUri());
  await client.connect();
  const db: Db = client.db("zemne_test");
  await ensureDatabase(db);
  let now = new Date(START);

  const deps: ServerDeps = {
    config: { mongodbUri: "mongodb://test", sessionSecret: TEST_SECRET, production: true, gemmaConfigured: false },
    db: async () => db,
    now: () => new Date(now),
  };

  async function call(handler: Handler, opts: CallOptions = {}): Promise<CallResult> {
    const method = opts.method ?? (opts.body !== undefined || opts.rawBody !== undefined ? "POST" : "GET");
    const write = method !== "GET";
    const headers = new Headers({ host: HOST, "x-forwarded-for": opts.ip ?? "203.0.113.10", ...opts.headers });
    const origin = opts.origin === undefined ? (write ? ORIGIN : null) : opts.origin;
    if (origin) headers.set("origin", origin);
    if (opts.cookie) headers.set("cookie", opts.cookie);
    let body: string | undefined;
    if (opts.rawBody !== undefined) body = opts.rawBody;
    else if (opts.body !== undefined) {
      body = JSON.stringify(opts.body);
      if (!headers.has("content-type")) headers.set("content-type", "application/json");
    }
    const request = new Request(`${ORIGIN}/api/test`, { method, headers, body });
    const res = await run(handler, request, opts.params ?? {}, deps, { write, route: "test" });
    const text = await res.text();
    const setCookie = res.headers.get("set-cookie");
    return {
      status: res.status,
      json: text ? JSON.parse(text) : undefined,
      headers: res.headers,
      setCookie,
      cookie: setCookie ? setCookie.split(";")[0] : null,
    };
  }

  return {
    /** Connection string, for tests that need an independent client. */
    uri: replSet.getUri(),
    db,
    deps,
    call,
    setNow: (d: Date) => {
      now = new Date(d);
    },
    advance: (ms: number) => {
      now = new Date(now.getTime() + ms);
    },
    async reset() {
      now = new Date(START);
      await Promise.all(Object.values(COLLECTIONS).map((name) => db.collection(name).deleteMany({})));
    },
    async stop() {
      await client.close();
      await replSet.stop();
    },
  };
}

export type TestServer = Awaited<ReturnType<typeof startTestServer>>;
