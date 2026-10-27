import LiveExperience from "@/components/live-experience";
export const dynamic = "force-dynamic";
/** Fictional showcase served through the real public API and moderation rules. */
export default async function ExperiencePage({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string }>;
}) {
  const { destination } = await searchParams;
  const initialDestination =
    destination === "guestbook" ||
    destination === "tribute" ||
    destination === "wall"
      ? destination
      : "overview";
  return (
    <LiveExperience
      slug="mira-vale-synthetic-p6-rehearsal-kkr2i9"
      initialDestination={initialDestination}
    />
  );
}
