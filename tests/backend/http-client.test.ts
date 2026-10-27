import { describe, expect, it } from "vitest";
import { ZemneApiError, createHttpClient, makeErrorBody } from "../../src/shared/api";
import { DEMO_SLUG, demoPublicMemorialResponse } from "../../src/shared/fixtures";

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
