import { weave } from "@/server/handlers/organizer";
import { route } from "@/server/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = route(weave, { write: true, name: "POST /api/organizer/memorials/:id/weave" });
