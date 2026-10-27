/**
 * Typed API client interface plus the reference HTTP implementation.
 *
 * UI code depends on `ZemneApiClient` only. During P2 it gets the mock client
 * (src/shared/fixtures/mock-client.ts); in P6 it swaps to createHttpClient()
 * with no other changes. Both throw `ZemneApiError` for every failure.
 */
import type { z } from "zod";
import { ApiErrorBodySchema, ZemneApiError, makeErrorBody } from "./errors";
import { API_ROUTES } from "./routes";
import {
  CreateMemorialResponseSchema,
  HealthResponseSchema,
  ModerateGuestbookResponseSchema,
  ModerateTributeResponseSchema,
  OrganizerMemorialResponseSchema,
  OrganizerSessionResponseSchema,
  PublicMemorialResponseSchema,
  RotateTokenResponseSchema,
  StoryUpdateResponseSchema,
  SubmissionReceiptResponseSchema,
  WeaveResponseSchema,
  type CreateMemorialRequest,
  type CreateMemorialResponse,
  type GuestbookSubmissionRequest,
  type HealthResponse,
  type ModerateGuestbookResponse,
  type ModerateTributeResponse,
  type ModerationRequest,
  type OrganizerMemorialResponse,
  type OrganizerSessionRequest,
  type OrganizerSessionResponse,
  type PublicMemorialResponse,
  type RotateTokenResponse,
  type StoryUpdateRequest,
  type StoryUpdateResponse,
  type SubmissionReceiptResponse,
  type TributeSubmissionRequest,
  type WeaveResponse,
} from "./schemas";

export interface ZemneApiClient {
  /** True for the mock client. UI must show a visible "DEMO DATA" badge when set. */
  readonly isDemo: boolean;
  health(): Promise<HealthResponse>;
  createMemorial(input: CreateMemorialRequest): Promise<CreateMemorialResponse>;
  getPublicMemorial(slug: string): Promise<PublicMemorialResponse>;
  submitGuestbookEntry(slug: string, input: GuestbookSubmissionRequest): Promise<SubmissionReceiptResponse>;
  submitTribute(slug: string, input: TributeSubmissionRequest): Promise<SubmissionReceiptResponse>;
  exchangeOrganizerToken(input: OrganizerSessionRequest): Promise<OrganizerSessionResponse>;
  getOrganizerSession(): Promise<OrganizerSessionResponse>;
  endOrganizerSession(): Promise<void>;
  getOrganizerMemorial(memorialId: string): Promise<OrganizerMemorialResponse>;
  rotateOrganizerToken(memorialId: string): Promise<RotateTokenResponse>;
  moderateGuestbookEntry(entryId: string, input: ModerationRequest): Promise<ModerateGuestbookResponse>;
  moderateTribute(tributeId: string, input: ModerationRequest): Promise<ModerateTributeResponse>;
  weaveStory(memorialId: string): Promise<WeaveResponse>;
  updateStory(storyId: string, input: StoryUpdateRequest): Promise<StoryUpdateResponse>;
}

export interface HttpClientOptions {
  /** Defaults to "" (same origin). Organizer routes only work same-origin. */
  baseUrl?: string;
  fetch?: typeof fetch;
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

export function createHttpClient(options: HttpClientOptions = {}): ZemneApiClient {
  const baseUrl = options.baseUrl ?? "";
  const doFetch = options.fetch ?? globalThis.fetch.bind(globalThis);

  async function request<S extends z.ZodType>(method: Method, path: string, schema: S | null, body?: unknown) {
    let res: Response;
    try {
      res = await doFetch(baseUrl + path, {
        method,
        credentials: "same-origin",
        cache: "no-store",
        headers: body === undefined ? { Accept: "application/json" } : { Accept: "application/json", "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ZemneApiError(
        makeErrorBody("INTERNAL", { requestId: "network", message: "We couldn't reach ZEMNE. Check your connection and try again." }),
        0,
      );
    }
    const requestId = res.headers.get("x-request-id") ?? "unknown";
    const payload: unknown = res.status === 204 ? undefined : await res.json().catch(() => undefined);

    if (!res.ok) {
      const parsed = ApiErrorBodySchema.safeParse(payload);
      throw new ZemneApiError(parsed.success ? parsed.data : makeErrorBody("INTERNAL", { requestId }), res.status);
    }
    if (schema === null) return undefined as z.infer<S>;
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      throw new ZemneApiError(
        makeErrorBody("INTERNAL", { requestId, message: "The server sent an unexpected response." }),
        res.status,
      );
    }
    return parsed.data as z.infer<S>;
  }

  return {
    isDemo: false,
    health: () => request("GET", API_ROUTES.health(), HealthResponseSchema),
    createMemorial: (input) => request("POST", API_ROUTES.memorials(), CreateMemorialResponseSchema, input),
    getPublicMemorial: (slug) => request("GET", API_ROUTES.publicMemorial(slug), PublicMemorialResponseSchema),
    submitGuestbookEntry: (slug, input) => request("POST", API_ROUTES.guestbook(slug), SubmissionReceiptResponseSchema, input),
    submitTribute: (slug, input) => request("POST", API_ROUTES.tributes(slug), SubmissionReceiptResponseSchema, input),
    exchangeOrganizerToken: (input) => request("POST", API_ROUTES.organizerSession(), OrganizerSessionResponseSchema, input),
    getOrganizerSession: () => request("GET", API_ROUTES.organizerSession(), OrganizerSessionResponseSchema),
    endOrganizerSession: () => request("DELETE", API_ROUTES.organizerSession(), null).then(() => undefined),
    getOrganizerMemorial: (id) => request("GET", API_ROUTES.organizerMemorial(id), OrganizerMemorialResponseSchema),
    rotateOrganizerToken: (id) => request("POST", API_ROUTES.rotateToken(id), RotateTokenResponseSchema, {}),
    moderateGuestbookEntry: (id, input) => request("PATCH", API_ROUTES.moderateGuestbook(id), ModerateGuestbookResponseSchema, input),
    moderateTribute: (id, input) => request("PATCH", API_ROUTES.moderateTribute(id), ModerateTributeResponseSchema, input),
    weaveStory: (id) => request("POST", API_ROUTES.weave(id), WeaveResponseSchema, {}),
    updateStory: (id, input) => request("PATCH", API_ROUTES.story(id), StoryUpdateResponseSchema, input),
  };
}
