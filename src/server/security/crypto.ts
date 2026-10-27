/**
 * Organizer tokens, keyed hashes and constant-time comparison.
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const TOKEN_PREFIX = "zmn_ot_";

/** 32 bytes from the CSPRNG (256 bits), base64url → 43 chars. */
export function generateOrganizerToken(): string {
  return TOKEN_PREFIX + randomBytes(32).toString("base64url");
}

/** Stored at rest instead of the token. A fast hash is fine for a 256-bit random secret. */
export function hashOrganizerToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Purpose-separated subkey of SESSION_SECRET (sessions vs IP hashing). */
export function deriveKey(secret: string, purpose: "session-v1" | "ip-v1"): Buffer {
  return createHmac("sha256", secret).update(`zemne:${purpose}`).digest();
}

export function hmacHex(key: Buffer, value: string): string {
  return createHmac("sha256", key).update(value, "utf8").digest("hex");
}

/** Hash of case-folded, whitespace-collapsed text, for duplicate detection. */
export function contentHash(text: string): string {
  return createHash("sha256").update(text.toLowerCase().replace(/\s+/g, " ").trim(), "utf8").digest("hex");
}

export function newRequestId(): string {
  return "req_" + randomBytes(9).toString("base64url");
}
