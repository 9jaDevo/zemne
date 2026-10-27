/**
 * Organizer private link helpers: `/manage/<memorialId>#key=<token>`.
 *
 * The secret lives in the URL fragment, which browsers never send to the
 * server, never include in Referer, and which does not reach access logs.
 * The manage page must:
 *   1. read the fragment with parseManageFragment(location.hash),
 *   2. immediately strip it: history.replaceState(null, "", location.pathname),
 *   3. POST { memorial_id, token } to /api/organizer/session,
 *   4. forget the token (do not store it in state, storage or analytics).
 */
import { APP_PATHS } from "./routes";
import { ORGANIZER_TOKEN_PATTERN } from "./schemas";

export function buildManagePath(memorialId: string, token: string): string {
  return `${APP_PATHS.manage(memorialId)}#key=${token}`;
}

/** Returns the token from a `#key=...` fragment, or null if absent/malformed. */
export function parseManageFragment(hash: string): string | null {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const token = params.get("key");
  return token && ORGANIZER_TOKEN_PATTERN.test(token) ? token : null;
}
