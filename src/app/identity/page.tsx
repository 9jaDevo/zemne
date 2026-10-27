import Image from "next/image";
import Link from "next/link";
import { Brand } from "@/components/brand";
export default function IdentityPage() {
  return (
    <>
      <header className="site-header">
        <Link href="/">
          <Brand />
        </Link>
        <Link href="/" className="text-button">
          Return to ZEMNE →
        </Link>
      </header>
      <main className="identity-page content-width">
        <span className="eyebrow">Original identity exploration / P2</span>
        <h1>
          A space for
          <br />
          <em>what stays.</em>
        </h1>
        <p>Three directions. One quiet, enduring idea.</p>
        <div className="identity-grid">
          {[
            {
              name: "The Held Space",
              file: "held-space",
              description:
                "Two opposing corners protect a shared void. Selected for clarity at every scale.",
            },
            {
              name: "Folded Continuum",
              file: "folded-continuum",
              description:
                "An angular fold passes a story forward. The central crossing is less clear at small sizes.",
            },
            {
              name: "Resonance",
              file: "resonance",
              description:
                "Nested arches suggest a presence that carries outward. Softer, but less distinctive.",
            },
          ].map((concept, i) => (
            <article key={concept.file}>
              <Image
                src={`/brand/concept-${concept.file}.svg`}
                alt={concept.name}
                width={128}
                height={128}
              />
              <span className="eyebrow">
                0{i + 1} / {i === 0 ? "Selected" : "Exploration"}
              </span>
              <h2>{concept.name}</h2>
              <p>{concept.description}</p>
            </article>
          ))}
        </div>
        <h2>One form. Every context.</h2>
        <div className="identity-variants">
          <div>
            <Image
              src="/brand/zemne-logo-dark.svg"
              width={282}
              height={64}
              alt="ZEMNE dark mark on ivory"
            />
          </div>
          <div className="dark">
            <Image
              src="/brand/zemne-logo-light.svg"
              width={282}
              height={64}
              alt="ZEMNE ivory mark on dark green"
            />
          </div>
        </div>
        <div className="icon-proof">
          <span className="eyebrow">Actual size / 16 · 32 · 180</span>
          {[16, 32, 180].map((size) => (
            <div key={size}>
              <Image
                src={`/brand/icon-${size}.png`}
                alt={`${size} pixel app icon`}
                width={size}
                height={size}
                unoptimized
              />
              <small>{size}px</small>
            </div>
          ))}
        </div>
        <p className="fine-print">
          Original grid-built SVG artwork, not a stock mark. Owner approval and
          legal/trademark clearance remain separate gates.
        </p>
      </main>
    </>
  );
}
