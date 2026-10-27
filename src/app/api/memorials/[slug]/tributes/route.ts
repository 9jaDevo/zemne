import { submitTribute } from "@/server/handlers/public";
import { route } from "@/server/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = route(submitTribute, { write: true, name: "POST /api/memorials/:slug/tributes" });
