import Link from "next/link";
import { Brand } from "@/components/brand";

export default function ProvisioningPage() {
  return (
    <main className="page-message content-width">
      <Brand />
      <span className="eyebrow" style={{ marginTop: 40 }}>
        Infrastructure checkpoint
      </span>
      <h1>
        A place to begin.
        <br />
        <em>The demonstration has moved.</em>
      </h1>
      <p>
        Open ZEMNE to create a synthetic memorial, invite contributions and
        review a remembrance woven from approved tributes.
      </p>
      <p>
        A successful page load does not confirm database or AI connectivity.
        Please do not enter personal memorial information.
      </p>
      <Link href="/" className="button secondary">
        Open ZEMNE
      </Link>
    </main>
  );
}
