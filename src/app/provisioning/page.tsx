import Link from "next/link";
import { Brand } from "@/components/brand";

export default function ProvisioningPage() {
  return (
    <main className="page-message content-width">
      <Brand />
      <span className="eyebrow" style={{ marginTop: 40 }}>
        Infrastructure preview
      </span>
      <h1>
        A place is taking shape.
        <br />
        <em>The final demo is not live yet.</em>
      </h1>
      <p>
        This page confirms only that the ZEMNE web application can serve a page.
        Memorial creation, persistent storage and AI processing are not
        available in this preview.
      </p>
      <p>
        A successful page load does not confirm database or AI connectivity.
        Please do not enter personal memorial information.
      </p>
      <Link href="/" className="button secondary">
        View the design preview
      </Link>
    </main>
  );
}
