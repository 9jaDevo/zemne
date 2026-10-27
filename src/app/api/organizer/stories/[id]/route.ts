import { updateStory } from "@/server/handlers/organizer";
import { route } from "@/server/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = route(updateStory, { write: true, name: "PATCH /api/organizer/stories/:id" });
