"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/brand";
import { Icon } from "@/components/ui/icon";
import { useReducedMotion } from "@/components/ui/use-reduced-motion";
const HallScene = dynamic(() => import("@/3d/hall-scene"), {
  ssr: false,
  loading: () => <div className="scene-loading">Opening the architecture…</div>,
});
export function Landing() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  return (
    <>
      <header className="site-header landing-header">
        <Link href="/" aria-label="ZEMNE home">
          <Brand />
        </Link>
        <nav aria-label="Main navigation">
          <a className="text-button about-link" href="#how-it-works">
            A place for remembering
          </a>
          <a className="button secondary small" href="/demo?view=create">
            Create a demo memorial
            <Icon name="arrow" size={16} />
          </a>
        </nav>
      </header>
      <main>
        <section className="landing-hero content-width">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="tiny-line" />
              Together, in remembrance
            </span>
            <h1>
              For the stories
              <br />
              that <em>stay.</em>
            </h1>
            <p>
              A quiet place to gather. To share the little things.
              <br className="desktop-break" /> And to keep a life present,
              wherever you are.
            </p>
            <a className="button primary" href="/demo">
              Enter the memorial
              <Icon name="arrow" />
            </a>
            <p className="hero-disclaimer">
              Explore a fictional memorial · local design preview
            </p>
            <div className="hero-note">
              <span className="note-line" />
              <p>
                Some people leave a place in us.
                <br />
                This is a place for them.
              </p>
            </div>
          </div>
          <div className="hero-scene">
            <div className="hero-scene-label">
              <span className="eyebrow">A first glimpse inside</span>
              <span className="pill">INTERACTIVE 3D</span>
            </div>
            <div className="hero-canvas">
              <HallScene
                reducedMotion={reducedMotion}
                view="overview"
                onSelect={(destination) =>
                  router.push(`/demo?destination=${destination}`)
                }
              />
            </div>
            <div className="hero-memorial">
              <div>
                <span className="eyebrow">In loving remembrance</span>
                <h2>
                  Elowen Marsh<span>1941 — 2025</span>
                </h2>
              </div>
              <a
                className="round-button"
                href="/demo"
                aria-label="Enter Elowen’s fictional memorial"
              >
                <Icon name="arrow" />
              </a>
            </div>
            <span className="hero-scene-footnote">
              FICTIONAL MEMORIAL · ORIGINAL ARCHITECTURE
            </span>
          </div>
        </section>
        <section id="how-it-works" className="how-section">
          <div className="content-width">
            <div className="how-heading">
              <span className="eyebrow">A remembrance, made together</span>
              <h2>
                Small gestures.
                <br />
                <em>Something lasting.</em>
              </h2>
              <p>
                No distance is too far for a memory.
                <br />
                Three simple ways to be present.
              </p>
            </div>
            <div className="how-grid">
              {[
                {
                  icon: "book" as const,
                  title: "Leave your presence.",
                  text: "A few thoughtful words in the guestbook. A reminder that you were here.",
                  number: "01",
                },
                {
                  icon: "pen" as const,
                  title: "Share your memory.",
                  text: "The ordinary moments that made them extraordinary. Told by the people who knew them.",
                  number: "02",
                },
                {
                  icon: "wall" as const,
                  title: "Keep their story close.",
                  text: "A shared remembrance, drawn from approved tributes and cared for by the organizer.",
                  number: "03",
                },
              ].map((item) => (
                <article key={item.number}>
                  <div className="how-top">
                    <Icon name={item.icon} size={28} />
                    <span>{item.number}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
            <div className="preview-disclosure">
              <span className="status-dot" />
              <p>
                Design preview. No real memorial records, persistent storage or
                AI inference.{" "}
                <a href="/demo">
                  Explore the local demo
                  <Icon name="arrow" size={14} />
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <Brand />
        <p>A place where memories live on.</p>
        <span>Thoughtfully made for the people we carry.</span>
      </footer>
    </>
  );
}
