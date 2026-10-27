import DemoExperience from "@/components/demo/demo-experience";
import { Brand } from "@/components/brand";
import Link from "next/link";

export default function DemoPage() {
  // P2 mock data must never become the production memorial experience.
  if (process.env.NODE_ENV === "production")
    return (
      <main className="page-message content-width">
        <Brand />
        <h1>
          The design preview
          <br />
          <em>is being prepared.</em>
        </h1>
        <p>
          The fictional preview is enabled in local development only. There is
          no production memorial service or real AI here yet.
        </p>
        <Link className="button primary" href="/">
          Return to ZEMNE
        </Link>
      </main>
    );
  return <DemoExperience />;
}
