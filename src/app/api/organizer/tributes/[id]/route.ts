import { moderateTribute } from "@/server/handlers/organizer";
import { route } from "@/server/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = route(moderateTribute, { write: true, name: "PATCH /api/organizer/tributes/:id" });
