import { getPublicMemorial } from "@/server/handlers/public";
import { route } from "@/server/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(getPublicMemorial, { write: false, name: "GET /api/memorials/:slug" });
