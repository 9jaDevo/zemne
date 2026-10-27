/**
 * CSRF/origin checks and client IP derivation (contract §3.1, §3.2).
 */
import { deriveKey, hmacHex } from "./crypto";

/** Host the browser addressed: Render's proxy sets X-Forwarded-Host, else Host. */
function requestHost(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  return (forwarded || request.headers.get("host") || "").toLowerCase() || null;
}

/**
 * Every non-GET route: Origin must be present and match the request host, and
 * Sec-Fetch-Site (when sent) must be same-origin or none.
 */
export function isSameOriginWrite(request: Request): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return false;
  const origin = request.headers.get("origin");
  const host = requestHost(request);
  if (!origin || !host || origin === "null") return false;
  try {
    return new URL(origin).host.toLowerCase() === host;
  } catch {
    return false;
  }
}

/**
 * Client IP for rate limiting. Prefers CF-Connecting-IP (set by the Cloudflare
 * edge in front of Render, not client-controllable through it), then the
 * right-most X-Forwarded-For hop (appended by the nearest proxy; left-most
 * hops are client-spoofable). Verify on the deployed service (tracker P4).
 */
export function clientIp(request: Request): string {
  const cf = request.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const hops = xff.split(",").map((h) => h.trim()).filter(Boolean);
    if (hops.length) return hops[hops.length - 1];
  }
  return "unknown";
}

/** Keyed, truncated hash: raw IPs are never stored. */
export function ipKey(secret: string, ip: string): string {
  return hmacHex(deriveKey(secret, "ip-v1"), ip).slice(0, 32);
}
