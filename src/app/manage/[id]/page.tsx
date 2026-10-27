import LiveExperience from "@/components/live-experience";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LiveExperience memorialId={id} />;
}
