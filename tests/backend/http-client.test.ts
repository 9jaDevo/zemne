import { describe, expect, it } from "vitest";
import { ZemneApiError, createHttpClient, makeErrorBody } from "../../src/shared/api";
import { DEMO_IDS, DEMO_SLUG, demoOrganizerMemorialResponse, demoPublicMemorialResponse } from "../../src/shared/fixtures";

type Call = { url: string; init: RequestInit };

function stubFetch(response: () => Response | Promise<Response>) {
  const calls: Call[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return response();
  }) as unknown as typeof fetch;
  return { calls, fetchImpl };
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "X-Request-Id": "req_1" } });

describe("reference HTTP client", () => {
  it("sends same-origin JSON requests to the frozen routes and validates responses", async () => {
    const { calls, fetchImpl } = stubFetch(() => json(202, { receipt: { id: "65d0000000000000000000a9", kind: "tribute", status: "pending", submitted_at: "2026-10-27T10:00:00.000Z" }, message: "Thanks" }));
    const client = createHttpClient({ fetch: fetchImpl });
    expect(client.isDemo).toBe(false);
    await client.submitTribute(DEMO_SLUG, { contributor_name: "G", content: "A memory that is long enough.", consent: true });
    expect(calls[0].url).toBe(`/api/memorials/${DEMO_SLUG}/tributes`);
    expect(calls[0].init.method).toBe("POST");
    expect(calls[0].init.credentials).toBe("same-origin");
    expect((calls[0].init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });

  it("sends {} for body-less writes so CSRF content-type checks apply", async () => {
    const { calls, fetchImpl } = stubFetch(() => json(500, makeErrorBody("INTERNAL", { requestId: "r" })));
    await createHttpClient({ fetch: fetchImpl }).weaveStory("65d000000000000000000001").catch(() => undefined);
    expect(calls[0].init.body).toBe("{}");
  });

  it("parses a valid public read", async () => {
    const { fetchImpl } = stubFetch(() => json(200, demoPublicMemorialResponse));
    const res = await createHttpClient({ fetch: fetchImpl }).getPublicMemorial(DEMO_SLUG);
    expect(res.memorial.slug).toBe(DEMO_SLUG);
  });

  it("throws ZemneApiError carrying the contract error body", async () => {
    const body = makeErrorBody("RATE_LIMITED", { requestId: "req_1", retryAfterSeconds: 42 });
    const { fetchImpl } = stubFetch(() => json(429, body));
    const err = await createHttpClient({ fetch: fetchImpl }).health().catch((e) => e);
    expect(err).toBeInstanceOf(ZemneApiError);
    expect(err.status).toBe(429);
    expect(err.code).toBe("RATE_LIMITED");
    expect(err.body.error.retry_after_seconds).toBe(42);
  });

  it("maps non-contract error bodies, schema violations and network failures to INTERNAL", async () => {
    const html = stubFetch(() => new Response("<html>Bad gateway</html>", { status: 502 }));
    const e1 = await createHttpClient({ fetch: html.fetchImpl }).health().catch((e) => e);
    expect(e1.code).toBe("INTERNAL");
    expect(e1.status).toBe(502);

    const leaky = stubFetch(() => json(200, { ...demoPublicMemorialResponse, owner_token_hash: "x" }));
    const e2 = await createHttpClient({ fetch: leaky.fetchImpl }).getPublicMemorial(DEMO_SLUG).catch((e) => e);
    expect(e2.code).toBe("INTERNAL");

    const offline = stubFetch(() => Promise.reject(new TypeError("Failed to fetch")));
    const e3 = await createHttpClient({ fetch: offline.fetchImpl }).health().catch((e) => e);
    expect(e3.code).toBe("INTERNAL");
    expect(e3.status).toBe(0);
  });

  it("handles 204 on session end", async () => {
    const { calls, fetchImpl } = stubFetch(() => new Response(null, { status: 204 }));
    await expect(createHttpClient({ fetch: fetchImpl }).endOrganizerSession()).resolves.toBeUndefined();
    expect(calls[0].init.method).toBe("DELETE");
  });
});

describe("reference HTTP client: weave job", () => {
  const story = { ...demoOrganizerMemorialResponse.stories[0], status: "draft" as const, published_at: null };
  const job = (status: "running" | "succeeded" | "failed", extra: object = {}) => ({
    id: "65d0000000000000000000e1",
    status,
    started_at: "2026-10-27T12:00:00.000Z",
    finished_at: status === "running" ? null : "2026-10-27T12:01:30.000Z",
    story_id: status === "succeeded" ? story.id : null,
    error: null,
    ...extra,
  });
  function sequence(responses: Response[]) {
    const calls: { url: string; method: string }[] = [];
    const fetchImpl = (async (url: string, init: RequestInit) => {
      calls.push({ url, method: init.method ?? "GET" });
      return responses.shift()!;
    }) as unknown as typeof fetch;
    return { calls, fetchImpl };
  }

  it("starts the job, polls the same path, and resolves with the draft", async () => {
    const { calls, fetchImpl } = sequence([
      json(202, { job: job("running") }),
      json(200, { job: job("running"), story: null }),
      json(200, { job: job("succeeded"), story }),
    ]);
    const res = await createHttpClient({ fetch: fetchImpl, weavePollMs: 1 }).weaveStory(DEMO_IDS.memorial);
    expect(res.story.id).toBe(story.id);
    const path = `/api/organizer/memorials/${DEMO_IDS.memorial}/weave`;
    expect(calls).toEqual([
      { url: path, method: "POST" },
      { url: path, method: "GET" },
      { url: path, method: "GET" },
    ]);
  });

  it("rejects with the job's AI error so the UI shows the same retry state", async () => {
    const failed = job("failed", { error: { code: "AI_TIMEOUT", message: "The AI took too long to respond. Nothing was saved. Please try again.", retryable: true } });
    const { fetchImpl } = sequence([json(202, { job: job("running") }), json(200, { job: failed, story: null })]);
    const err = await createHttpClient({ fetch: fetchImpl, weavePollMs: 1 }).weaveStory(DEMO_IDS.memorial).catch((e) => e);
    expect(err).toBeInstanceOf(ZemneApiError);
    expect(err.code).toBe("AI_TIMEOUT");
    expect(err.body.error.retryable).toBe(true);
  });

  it("surfaces synchronous start errors (e.g. WEAVE_IN_PROGRESS) directly", async () => {
    const { fetchImpl } = sequence([json(409, makeErrorBody("WEAVE_IN_PROGRESS", { requestId: "r" }))]);
    const err = await createHttpClient({ fetch: fetchImpl }).weaveStory(DEMO_IDS.memorial).catch((e) => e);
    expect(err.code).toBe("WEAVE_IN_PROGRESS");
  });

  it("gives up after weaveMaxWaitMs with AI_TIMEOUT", async () => {
    const { fetchImpl } = sequence([json(202, { job: job("running") }), ...Array.from({ length: 50 }, () => json(200, { job: job("running"), story: null }))]);
    const err = await createHttpClient({ fetch: fetchImpl, weavePollMs: 5, weaveMaxWaitMs: 20 }).weaveStory(DEMO_IDS.memorial).catch((e) => e);
    expect(err.code).toBe("AI_TIMEOUT");
  });
});
