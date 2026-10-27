import Image from "next/image";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { Icon } from "@/components/ui/icon";

const places = [
  {
    key: "guestbook",
    number: "01",
    title: "A few words. A lasting presence.",
    label: "The guestbook",
    text: "Let the people who loved them know you were here. Every message is held for the organizer’s care.",
  },
  {
    key: "tribute",
    number: "02",
    title: "The stories only you can tell.",
    label: "The tribute lectern",
    text: "An ordinary afternoon. An unexpected kindness. Bring a memory into a place where it can be shared.",
  },
  {
    key: "wall",
    number: "03",
    title: "A life, seen through many eyes.",
    label: "The memory wall",
    text: "Approved memories become a shared remembrance, woven with Gemma and reviewed by a person, always.",
  },
];
export function Landing() {
  return (
    <div className="sanctuary-site">
      <header className="sanctuary-header">
        <Link href="/" aria-label="ZEMNE home">
          <Brand light />
        </Link>
        <nav aria-label="Main navigation">
          <Link className="sanctuary-header-link" href="/experience">
            Explore the experience
          </Link>
          <Link className="button sanctuary-header-cta" href="/create">
            Create a memorial <Icon name="arrow" size={16} />
          </Link>
        </nav>
      </header>
      <main>
        <section className="sanctuary-hero">
          <Image
            src="/3d/sanctuary-entrance-v1.webp"
            alt="The actual ZEMNE sanctuary: limestone, warm oak, soft daylight and a framed memorial at the end of a quiet aisle"
            fill
            priority
            sizes="100vw"
          />
          <div className="sanctuary-hero-shade" />
          <div className="sanctuary-hero-copy">
            <span className="eyebrow">A place for the people we carry</span>
            <h1>
              Some lives
              <br />
              stay <em>with us.</em>
            </h1>
            <p>
              A beautiful place to gather their stories.
              <br />
              And feel a little closer, wherever you are.
            </p>
            <div className="sanctuary-hero-actions">
              <Link className="button sanctuary-light-button" href="/create">
                Create a memorial <Icon name="arrow" />
              </Link>
              <Link className="sanctuary-explore-link" href="/experience">
                <span>↗</span> Explore the experience
              </Link>
            </div>
          </div>
          <div className="sanctuary-hero-caption">
            <span>THE GARDEN OF LIGHT</span>
            <span>
              An original ZEMNE sanctuary
              <br />
              Enter the real interactive room
            </span>
          </div>
        </section>
        <section className="sanctuary-intro content-width">
          <span className="eyebrow">Distance changes. Connection remains.</span>
          <div>
            <h2>
              A place to remember.
              <br />
              <em>A way to be together.</em>
            </h2>
            <p>
              Not every goodbye happens in the same room. ZEMNE brings the
              people who knew them into one thoughtful place—through a few
              words, a shared memory, and the story you hold together.
            </p>
            <div className="sanctuary-process">
              <span>
                <b>01</b> Create their space
              </span>
              <span>
                <b>02</b> Invite your people
              </span>
              <span>
                <b>03</b> Keep their stories close
              </span>
            </div>
          </div>
        </section>
        <section className="sanctuary-places">
          <div className="sanctuary-section-heading content-width">
            <span className="eyebrow">Three ways to be present</span>
            <h2>
              Small gestures.
              <br />
              <em>Something lasting.</em>
            </h2>
          </div>
          <div className="sanctuary-place-grid content-width">
            {places.map((p) => (
              <article key={p.key}>
                <Link
                  className="sanctuary-place-image"
                  href={`/experience?destination=${p.key}`}
                  aria-label={`Explore ${p.label}`}
                >
                  <Image
                    src={`/3d/sanctuary-${p.key}-v1.webp`}
                    alt={`A modeled view of ${p.label} inside ZEMNE’s sanctuary`}
                    fill
                    sizes="(max-width: 760px) 100vw, 33vw"
                  />
                  <span>
                    {p.number} / {p.label}
                  </span>
                </Link>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
                <Link
                  className="sanctuary-text-link"
                  href={`/experience?destination=${p.key}`}
                >
                  Step inside <Icon name="arrow" size={16} />
                </Link>
              </article>
            ))}
          </div>
        </section>
        <section className="sanctuary-final">
          <span className="eyebrow">Their story deserves a place</span>
          <h2>
            Begin with a name.
            <br />
            <em>The memories will follow.</em>
          </h2>
          <p>
            No guest accounts. No public directory.
            <br />
            Share an unlisted link. Publish only approved memories.
          </p>
          <Link href="/create" className="button sanctuary-light-button">
            Create a memorial <Icon name="arrow" />
          </Link>
          <small>
            Public demonstration · please use invented details only.
          </small>
        </section>
      </main>
      <footer className="site-footer sanctuary-footer">
        <Brand />
        <p>A place where memories live on.</p>
        <span>Made with care. Shared with permission.</span>
      </footer>
    </div>
  );
}
