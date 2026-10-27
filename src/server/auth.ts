/**
 * Organizer authorization (contract §2.4).
 *  - no/invalid/expired cookie or rotated token version -> 401 UNAUTHENTICATED
 *  - valid session for a different memorial            -> 403 FORBIDDEN (memorial-scoped routes)
 *  - item belonging to another memorial                 -> 404 NOT_FOUND (callers filter by memorial_id)
 */
import { ObjectId } from "mongodb";
import type { Collections } from "../lib/db/schema";
import type { MemorialDoc } from "../lib/db/types";
import { HttpError, requireSecret, type HandlerContext } from "./http";
import { RATE_RULES, consumeRate, type RateRule } from "./security/rate-limit";
import { cookieName, readCookie, verifySession, type SessionPayload } from "./security/session";

export interface OrganizerAuth {
  session: SessionPayload;
  memorial: MemorialDoc;
}

export async function enforceRate(c: Collections, rule: RateRule, scope: string, now: Date): Promise<void> {
  const result = await consumeRate(c.rateLimits, rule, scope, now);
  if (!result.ok) throw new HttpError("RATE_LIMITED", { retryAfterSeconds: result.retryAfterSeconds });
}

export async function requireOrganizer(ctx: HandlerContext, c: Collections, opts: { rateLimit?: boolean } = {}): Promise<OrganizerAuth> {
  const { request, deps } = ctx;
  const now = deps.now();
  const session = verifySession(requireSecret(deps), readCookie(request, cookieName(deps.config.production)), now);
  if (!session) throw new HttpError("UNAUTHENTICATED");
  const memorial = await c.memorials.findOne({ _id: new ObjectId(session.mid) });
  if (!memorial || memorial.owner_token_version !== session.tv) throw new HttpError("UNAUTHENTICATED");
  if (opts.rateLimit !== false) await enforceRate(c, RATE_RULES.organizerSession, `${session.mid}:${session.iat}`, now);
  return { session, memorial };
}

/** For routes addressed by memorial id: the session must belong to that memorial. */
export function assertMemorialScope(auth: OrganizerAuth, memorialIdParam: string | undefined): void {
  if (!memorialIdParam || !/^[a-f0-9]{24}$/.test(memorialIdParam)) throw new HttpError("NOT_FOUND");
  if (auth.memorial._id.toHexString() !== memorialIdParam) throw new HttpError("FORBIDDEN");
}
