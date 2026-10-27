import { createMemorial } from "@/server/handlers/public";
import { route } from "@/server/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = route(createMemorial, { write: true, name: "POST /api/memorials" });
