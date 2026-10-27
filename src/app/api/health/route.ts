import { health } from "@/server/handlers/public";
import { route } from "@/server/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(health, { write: false, name: "GET /api/health" });
