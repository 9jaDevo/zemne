import { moderateGuestbookEntry } from "@/server/handlers/organizer";
import { route } from "@/server/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = route(moderateGuestbookEntry, { write: true, name: "PATCH /api/organizer/guestbook/:id" });
