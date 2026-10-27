import { weave, weaveStatus } from "@/server/handlers/organizer";
import { route } from "@/server/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = route(weave, { write: true, name: "POST /api/organizer/memorials/:id/weave" });
export const GET = route(weaveStatus, { write: false, name: "GET /api/organizer/memorials/:id/weave" });
