/**
 * Stable route names. Paths here are frozen by docs/API_CONTRACT.md; change
 * them only through a contract revision.
 */

const seg = (value: string) => encodeURIComponent(value);

export const API_ROUTES = {
  health: () => "/api/health",
  memorials: () => "/api/memorials",
  publicMemorial: (slug: string) => `/api/memorials/${seg(slug)}`,
  guestbook: (slug: string) => `/api/memorials/${seg(slug)}/guestbook`,
  tributes: (slug: string) => `/api/memorials/${seg(slug)}/tributes`,
  organizerSession: () => "/api/organizer/session",
  organizerMemorial: (memorialId: string) => `/api/organizer/memorials/${seg(memorialId)}`,
  rotateToken: (memorialId: string) => `/api/organizer/memorials/${seg(memorialId)}/rotate-token`,
  weave: (memorialId: string) => `/api/organizer/memorials/${seg(memorialId)}/weave`,
  moderateGuestbook: (entryId: string) => `/api/organizer/guestbook/${seg(entryId)}`,
  moderateTribute: (tributeId: string) => `/api/organizer/tributes/${seg(tributeId)}`,
  story: (storyId: string) => `/api/organizer/stories/${seg(storyId)}`,
} as const;

/** Frontend page paths the API hands out. Pages themselves are Codex-owned. */
export const APP_PATHS = {
  guest: (slug: string) => `/m/${seg(slug)}`,
  manage: (memorialId: string) => `/manage/${seg(memorialId)}`,
} as const;

/** Cookie names. The cookie is HttpOnly: frontend code can never read it. */
export const ORGANIZER_COOKIE = {
  production: "__Host-zemne_org",
  development: "zemne_org",
  maxAgeSeconds: 12 * 60 * 60,
} as const;
