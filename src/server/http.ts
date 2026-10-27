/**
 * Response helpers, error mapping and the request wrapper shared by every route.
 * Never logs request bodies, cookies, tokens, IPs or raw driver messages.
 */
import { ObjectId } from "mongodb";
import type { z } from "zod";
import {
  ERROR_STATUS,
  LIMITS,
  makeErrorBody,
  zodIssuesToFields,
  type ErrorCode,
  type FieldError,
} from "../shared/api";
import { newRequestId } from "./security/crypto";
import { isSameOriginWrite } from "./security/request-guards";
import type { ServerDeps } from "./deps";

export class HttpError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly opts: { message?: string; fields?: FieldError[]; retryAfterSeconds?: number } = {},
  ) {
    super(code);
    this.name = "HttpError";
  }
}

export interface HandlerContext {
  request: Request;
  params: Record<string, string>;
  deps: ServerDeps;
  requestId: string;
}

export interface HandlerResult {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
  setCookie?: string;
}

export type Handler = (ctx: HandlerContext) => Promise<HandlerResult>;

function baseHeaders(requestId: string): Headers {
  return new Headers({
    "X-Request-Id": requestId,
    "X-Robots-Tag": "noindex, nofollow",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "Referrer-Policy": "no-referrer",
    // Handlers may override (the public read uses `private, no-cache`).
    "Cache-Control": "no-store",
  });
}

function toResponse(result: HandlerResult, requestId: string): Response {
  const headers = baseHeaders(requestId);
  for (const [k, v] of Object.entries(result.headers ?? {})) headers.set(k, v);
  if (result.setCookie) headers.append("Set-Cookie", result.setCookie);
  if (result.body === undefined) return new Response(null, { status: result.status, headers });
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(result.body), { status: result.status, headers });
}

export function errorResult(error: HttpError, requestId: string): HandlerResult {
  const body = makeErrorBody(error.code, { requestId, ...error.opts });
  return {
    status: ERROR_STATUS[error.code],
    body,
    headers: error.opts.retryAfterSeconds ? { "Retry-After": String(error.opts.retryAfterSeconds) } : undefined,
  };
}

/**
 * Runs a handler: request id, write-origin check, typed errors, safe logging.
 * `write: true` applies the contract §3.1 origin/CSRF rules.
 */
export async function run(
  handler: Handler,
  request: Request,
  params: Record<string, string>,
  deps: ServerDeps,
  opts: { write: boolean; route: string },
): Promise<Response> {
  const requestId = newRequestId();
  try {
    if (opts.write && !isSameOriginWrite(request)) throw new HttpError("ORIGIN_REJECTED");
    return toResponse(await handler({ request, params, deps, requestId }), requestId);
  } catch (error) {
    if (error instanceof HttpError) return toResponse(errorResult(error, requestId), requestId);
    // Safe structured log: no message text (driver messages can contain hosts/values).
    console.error(
      JSON.stringify({
        level: "error",
        route: opts.route,
        request_id: requestId,
        error: (error as { name?: string })?.name ?? "Error",
        code: (error as { code?: unknown })?.code ?? null,
      }),
    );
    return toResponse(errorResult(new HttpError("INTERNAL"), requestId), requestId);
  }
}

/** Reads a JSON body with content-type and size checks (contract §1). */
export async function readJson(request: Request): Promise<unknown> {
  const type = request.headers.get("content-type") ?? "";
  if (!/^application\/json\s*(;|$)/i.test(type)) throw new HttpError("UNSUPPORTED_MEDIA_TYPE");
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > LIMITS.maxBodyBytes) throw new HttpError("PAYLOAD_TOO_LARGE");
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > LIMITS.maxBodyBytes) throw new HttpError("PAYLOAD_TOO_LARGE");
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError("INVALID_JSON");
  }
}

export function parseBody<S extends z.ZodType>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) throw new HttpError("VALIDATION_FAILED", { fields: zodIssuesToFields(result.error) });
  return result.data as z.infer<S>;
}

/** Malformed ids are indistinguishable from missing ones. */
export function objectIdParam(value: string | undefined): ObjectId {
  if (!value || !/^[a-f0-9]{24}$/.test(value)) throw new HttpError("NOT_FOUND");
  return new ObjectId(value);
}

export function requireSecret(deps: ServerDeps): string {
  const secret = deps.config.sessionSecret;
  if (!secret) throw new Error("SESSION_SECRET missing or too short");
  return secret;
}
