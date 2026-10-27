/**
 * Fixed-window counters in MongoDB (`rate_limits`, TTL-indexed), so limits
 * survive restarts and multiple instances. Limits match contract §3.2.
 */
import type { Collection } from "mongodb";
import type { RateLimitDoc } from "../../lib/db/types";

export interface RateRule {
  name: string;
  limit: number;
  windowSeconds: number;
}

export const RATE_RULES = {
  createMemorialIp: { name: "create_ip", limit: 5, windowSeconds: 3600 },
  guestbookIp: { name: "guestbook_ip", limit: 5, windowSeconds: 600 },
  guestbookMemorial: { name: "guestbook_memorial", limit: 300, windowSeconds: 86_400 },
  tributeIp: { name: "tribute_ip", limit: 3, windowSeconds: 600 },
  tributeMemorial: { name: "tribute_memorial", limit: 150, windowSeconds: 86_400 },
  sessionIp: { name: "session_ip", limit: 10, windowSeconds: 900 },
  sessionMemorial: { name: "session_memorial", limit: 30, windowSeconds: 900 },
  weaveMemorial: { name: "weave_memorial", limit: 6, windowSeconds: 3600 },
  rotateMemorial: { name: "rotate_memorial", limit: 5, windowSeconds: 3600 },
  organizerSession: { name: "organizer_session", limit: 120, windowSeconds: 600 },
  publicReadIp: { name: "public_read_ip", limit: 120, windowSeconds: 60 },
} as const satisfies Record<string, RateRule>;

export type RateResult = { ok: true } | { ok: false; retryAfterSeconds: number };

/** Counts one hit against `rule` for `scope`. */
export async function consumeRate(
  coll: Collection<RateLimitDoc>,
  rule: RateRule,
  scope: string,
  now: Date,
): Promise<RateResult> {
  const windowMs = rule.windowSeconds * 1000;
  const start = Math.floor(now.getTime() / windowMs) * windowMs;
  const end = start + windowMs;
  const _id = `${rule.name}:${scope}:${start}`;
  const update = async () =>
    coll.findOneAndUpdate(
      { _id },
      { $inc: { count: 1 }, $setOnInsert: { expires_at: new Date(end) } },
      { upsert: true, returnDocument: "after" },
    );
  let doc: RateLimitDoc | null;
  try {
    doc = await update();
  } catch (error) {
    // Concurrent upserts on a new key can collide once; the retry updates.
    if ((error as { code?: number }).code !== 11000) throw error;
    doc = await update();
  }
  if (doc && doc.count > rule.limit) {
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((end - now.getTime()) / 1000)) };
  }
  return { ok: true };
}
