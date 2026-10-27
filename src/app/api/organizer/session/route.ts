import { endSession, exchangeSession, getSession } from "@/server/handlers/organizer";
import { route } from "@/server/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = route(exchangeSession, { write: true, name: "POST /api/organizer/session" });
export const GET = route(getSession, { write: false, name: "GET /api/organizer/session" });
export const DELETE = route(endSession, { write: true, name: "DELETE /api/organizer/session" });
