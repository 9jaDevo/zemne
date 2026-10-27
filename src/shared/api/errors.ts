/**
 * ZEMNE error envelope. Every non-2xx response has this body:
 *   { "error": { code, message, request_id, retryable, retry_after_seconds?, fields? } }
 * The UI should branch on `code` (stable), and may display `message` (safe, human-readable).
 */
import { z } from "zod";

export const ERROR_STATUS = {
  INVALID_JSON: 400,
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  INVALID_ORGANIZER_TOKEN: 401,
  FORBIDDEN: 403,
  ORIGIN_REJECTED: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  INVALID_STATE_TRANSITION: 409,
  VERSION_CONFLICT: 409,
  NO_APPROVED_TRIBUTES: 409,
  STORY_SOURCES_INVALID: 409,
  WEAVE_IN_PROGRESS: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RATE_LIMITED: 429,
  INTERNAL: 500,
  AI_INVALID_OUTPUT: 502,
  AI_UNAVAILABLE: 503,
  AI_TIMEOUT: 504,
} as const;

export type ErrorCode = keyof typeof ERROR_STATUS;
export const ERROR_CODES = Object.keys(ERROR_STATUS) as [ErrorCode, ...ErrorCode[]];
export const ErrorCodeSchema = z.enum(ERROR_CODES);

/** Codes where retrying the same request later can succeed. */
export const RETRYABLE_CODES: ReadonlySet<ErrorCode> = new Set<ErrorCode>([
  "RATE_LIMITED",
  "WEAVE_IN_PROGRESS",
  "INTERNAL",
  "AI_INVALID_OUTPUT",
  "AI_UNAVAILABLE",
  "AI_TIMEOUT",
]);

export const FieldErrorSchema = z.strictObject({
  /** Dot path into the request body, e.g. `paragraphs.0.text`. */
  path: z.string(),
  message: z.string().min(1).max(300),
});

export const ApiErrorBodySchema = z
  .strictObject({
    error: z.strictObject({
      code: ErrorCodeSchema,
      message: z.string().min(1).max(300),
      request_id: z.string().min(1).max(64),
      retryable: z.boolean(),
      retry_after_seconds: z.int().min(1).optional(),
      fields: z.array(FieldErrorSchema).optional(),
    }),
  })
  .refine((b) => b.error.code !== "RATE_LIMITED" || b.error.retry_after_seconds !== undefined, {
    message: "RATE_LIMITED errors must include retry_after_seconds",
    path: ["error", "retry_after_seconds"],
  })
  .refine((b) => b.error.code !== "VALIDATION_FAILED" || (b.error.fields?.length ?? 0) > 0, {
    message: "VALIDATION_FAILED errors must include fields",
    path: ["error", "fields"],
  });

export type FieldError = z.infer<typeof FieldErrorSchema>;
export type ApiErrorBody = z.infer<typeof ApiErrorBodySchema>;

/** Default safe messages. Servers may substitute more specific, still non-sensitive text. */
export const DEFAULT_ERROR_MESSAGES: Record<ErrorCode, string> = {
  INVALID_JSON: "The request body is not valid JSON.",
  VALIDATION_FAILED: "Please check the highlighted fields.",
  UNAUTHENTICATED: "Your organizer session has expired. Open your private organizer link again.",
  INVALID_ORGANIZER_TOKEN: "This organizer link is not valid. Check that you copied the whole link.",
  FORBIDDEN: "Your organizer session is for a different memorial. Open this memorial's private link.",
  ORIGIN_REJECTED: "This request was blocked for your security. Reload the page and try again.",
  NOT_FOUND: "We couldn't find that.",
  METHOD_NOT_ALLOWED: "That action isn't supported here.",
  INVALID_STATE_TRANSITION: "That change isn't allowed in the current state.",
  VERSION_CONFLICT: "This story changed in another tab. Reload to see the latest version.",
  NO_APPROVED_TRIBUTES: "Approve at least one tribute before weaving a remembrance.",
  STORY_SOURCES_INVALID: "This story cites tributes that are no longer approved. Edit it before publishing.",
  WEAVE_IN_PROGRESS: "A remembrance is already being woven. Please wait a moment.",
  PAYLOAD_TOO_LARGE: "That submission is too long.",
  UNSUPPORTED_MEDIA_TYPE: "Requests must be sent as JSON.",
  RATE_LIMITED: "Too many attempts. Please wait a little and try again.",
  INTERNAL: "Something went wrong on our side. Please try again.",
  AI_INVALID_OUTPUT: "The AI returned a draft we couldn't verify against the tributes. Nothing was saved. Please try again.",
  AI_UNAVAILABLE: "The AI service is unavailable right now. Nothing was saved. Please try again later.",
  AI_TIMEOUT: "The AI took too long to respond. Nothing was saved. Please try again.",
};

/** Thrown by both the HTTP client and the mock client so UI code handles one error type. */
export class ZemneApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody;

  constructor(body: ApiErrorBody, status: number = ERROR_STATUS[body.error.code]) {
    super(body.error.message);
    this.name = "ZemneApiError";
    this.status = status;
    this.body = body;
  }

  get code(): ErrorCode {
    return this.body.error.code;
  }

  get fields(): FieldError[] {
    return this.body.error.fields ?? [];
  }
}

/** Builds a contract-conformant error body. */
export function makeErrorBody(
  code: ErrorCode,
  opts: { requestId: string; message?: string; retryAfterSeconds?: number; fields?: FieldError[] },
): ApiErrorBody {
  return {
    error: {
      code,
      message: opts.message ?? DEFAULT_ERROR_MESSAGES[code],
      request_id: opts.requestId,
      retryable: RETRYABLE_CODES.has(code),
      ...(opts.retryAfterSeconds !== undefined ? { retry_after_seconds: opts.retryAfterSeconds } : {}),
      ...(opts.fields ? { fields: opts.fields } : {}),
    },
  };
}

/** Maps Zod issues to the contract's `fields` array. */
export function zodIssuesToFields(error: z.ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    path: issue.path.map(String).join("."),
    message: issue.message.slice(0, 300) || "Invalid value",
  }));
}
