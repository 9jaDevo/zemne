/**
 * Organizer session cookie (contract §2.3).
 *
 * Value: `v1.<b64url(payload)>.<b64url(HMAC-SHA256(k_session, "v1." + payload))>`
 * where payload = {"mid","tv","iat","exp"} (unix seconds). Stateless; revocation
 * is by bumping the memorial's owner_token_version (rotate-token).
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { ORGANIZER_COOKIE } from "../../shared/api";
import { deriveKey } from "./crypto";

export interface SessionPayload {
  /** memorial id (hex) */
  mid: string;
  /** owner_token_version at issue time */
  tv: number;
  iat: number;
  exp: number;
}

const PayloadSchema = z.strictObject({
  mid: z.string().regex(/^[a-f0-9]{24}$/),
  tv: z.int().min(1),
  iat: z.int().min(0),
  exp: z.int().min(0),
});

const PREFIX = "v1.";

function sign(secret: string, body: string): Buffer {
  return createHmac("sha256", deriveKey(secret, "session-v1")).update(PREFIX + body).digest();
}

export function issueSession(secret: string, memorialId: string, tokenVersion: number, now: Date): { value: string; payload: SessionPayload } {
  const iat = Math.floor(now.getTime() / 1000);
  const payload: SessionPayload = { mid: memorialId, tv: tokenVersion, iat, exp: iat + ORGANIZER_COOKIE.maxAgeSeconds };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { value: `${PREFIX}${body}.${sign(secret, body).toString("base64url")}`, payload };
}

/** Returns the payload only for an authentic, unexpired cookie value. */
export function verifySession(secret: string, value: string | null | undefined, now: Date): SessionPayload | null {
  if (!value || !value.startsWith(PREFIX) || value.length > 512) return null;
  const parts = value.slice(PREFIX.length).split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = sign(secret, body);
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  const result = PayloadSchema.safeParse(parsed);
  if (!result.success) return null;
  return result.data.exp > Math.floor(now.getTime() / 1000) ? result.data : null;
}

export function cookieName(production: boolean): string {
  return production ? ORGANIZER_COOKIE.production : ORGANIZER_COOKIE.development;
}

function attributes(production: boolean, maxAge: number): string {
  return `Path=/; Max-Age=${maxAge}; HttpOnly;${production ? " Secure;" : ""} SameSite=Strict`;
}

export function sessionSetCookie(production: boolean, value: string): string {
  return `${cookieName(production)}=${value}; ${attributes(production, ORGANIZER_COOKIE.maxAgeSeconds)}`;
}

export function sessionClearCookie(production: boolean): string {
  return `${cookieName(production)}=; ${attributes(production, 0)}`;
}

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}
