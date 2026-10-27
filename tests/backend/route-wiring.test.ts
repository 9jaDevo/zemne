/**
 * Checks the real Next.js route modules: the frozen paths exist, export the
 * contract's methods, and every write method applies the origin/CSRF guard
 * before touching the database (no DB is configured here).
 */
import { existsSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";

const ROUTES: Record<string, { methods: string[]; load: () => Promise<Record<string, unknown>> }> = {
  "src/app/api/health/route.ts": { methods: ["GET"], load: () => import("@/app/api/health/route") },
  "src/app/api/memorials/route.ts": { methods: ["POST"], load: () => import("@/app/api/memorials/route") },
  "src/app/api/memorials/[slug]/route.ts": { methods: ["GET"], load: () => import("@/app/api/memorials/[slug]/route") },
  "src/app/api/memorials/[slug]/guestbook/route.ts": { methods: ["POST"], load: () => import("@/app/api/memorials/[slug]/guestbook/route") },
  "src/app/api/memorials/[slug]/tributes/route.ts": { methods: ["POST"], load: () => import("@/app/api/memorials/[slug]/tributes/route") },
  "src/app/api/organizer/session/route.ts": { methods: ["POST", "GET", "DELETE"], load: () => import("@/app/api/organizer/session/route") },
  "src/app/api/organizer/memorials/[id]/route.ts": { methods: ["GET"], load: () => import("@/app/api/organizer/memorials/[id]/route") },
  "src/app/api/organizer/memorials/[id]/rotate-token/route.ts": { methods: ["POST"], load: () => import("@/app/api/organizer/memorials/[id]/rotate-token/route") },
  "src/app/api/organizer/memorials/[id]/weave/route.ts": { methods: ["POST", "GET"], load: () => import("@/app/api/organizer/memorials/[id]/weave/route") },
  "src/app/api/organizer/guestbook/[id]/route.ts": { methods: ["PATCH"], load: () => import("@/app/api/organizer/guestbook/[id]/route") },
  "src/app/api/organizer/tributes/[id]/route.ts": { methods: ["PATCH"], load: () => import("@/app/api/organizer/tributes/[id]/route") },
  "src/app/api/organizer/stories/[id]/route.ts": { methods: ["PATCH"], load: () => import("@/app/api/organizer/stories/[id]/route") },
};

type RouteFn = (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>;
const ctx = { params: Promise.resolve({ slug: "elowen-marsh-k7q2xm", id: "65d000000000000000000001" }) };

/**
 * A cold first import pulls in the MongoDB driver, Zod and the server modules;
 * on Windows this measured ~10 s (QA BUG-P7-03), past Vitest's 5 s per-test
 * default. Load every route once here, with room to spare, so each test below
 * only inspects already-loaded modules.
 */
const COLD_IMPORT_TIMEOUT_MS = 60_000;
beforeAll(async () => {
  await Promise.all(Object.values(ROUTES).map((spec) => spec.load()));
}, COLD_IMPORT_TIMEOUT_MS);

describe("Next.js route wiring", () => {
  it.each(Object.entries(ROUTES))("%s exports exactly the contract methods, Node runtime, dynamic", async (file, spec) => {
    expect(existsSync(file)).toBe(true);
    const mod = await spec.load();
    const exported = ["GET", "POST", "PATCH", "PUT", "DELETE"].filter((m) => typeof mod[m] === "function");
    expect(exported.sort()).toEqual([...spec.methods].sort());
    expect(mod.runtime).toBe("nodejs");
    expect(mod.dynamic).toBe("force-dynamic");
  });

  it.each(
    Object.entries(ROUTES).flatMap(([file, spec]) => spec.methods.filter((m) => m !== "GET").map((m) => [`${m} ${file}`, spec, m] as const)),
  )("%s rejects cross-origin writes with 403 before any work", async (_label, spec, method) => {
    const mod = await spec.load();
    const res = await (mod[method] as RouteFn)(
      new Request("https://zemne.test/api/x", {
        method,
        headers: { host: "zemne.test", origin: "https://evil.example", "content-type": "application/json" },
        body: "{}",
      }),
      ctx,
    );
    expect(res.status).toBe(403);
    expect((await res.json()).error.code).toBe("ORIGIN_REJECTED");
  });
});
