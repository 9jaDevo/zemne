import { getOrganizerMemorial } from "@/server/handlers/organizer";
import { route } from "@/server/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(getOrganizerMemorial, { write: false, name: "GET /api/organizer/memorials/:id" });
