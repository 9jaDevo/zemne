"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  parseManageFragment,
  type CreateMemorialResponse,
  type PublicMemorialResponse,
} from "@/shared/api";
import {
  createMockClient,
  DEMO_IDS,
  DEMO_ORGANIZER_TOKEN,
  DEMO_SLUG,
} from "@/shared/fixtures";
import type { Destination } from "@/3d/hall-scene";
import { Brand } from "@/components/brand";
import { Icon, type IconName } from "@/components/ui/icon";
import { ErrorNotice } from "@/components/ui/form";
import { CreateMemorial, ClaimLink } from "./create-memorial";
import { GuestPanel, MemoryWall } from "./guest-panels";
import { Organizer } from "./organizer";
import { useAction } from "./use-action";
import { useReducedMotion } from "@/components/ui/use-reduced-motion";

const HallScene = dynamic(() => import("@/3d/hall-scene"), {
  ssr: false,
  loading: () => (
    <div className="scene-loading" role="status">
      Preparing your visit…
    </div>
  ),
});
const destinations: {
  key: Destination;
  icon: IconName;
  label: string;
  caption: string;
}[] = [
  {
    key: "overview",
    icon: "home",
    label: "The hall",
    caption: "A place to be together",
  },
  {
    key: "guestbook",
    icon: "book",
    label: "Guestbook",
    caption: "Leave a few words",
  },
  { key: "tribute", icon: "pen", label: "Tribute", caption: "Share a memory" },
  {
    key: "wall",
    icon: "wall",
    label: "Memory wall",
    caption: "A life in many voices",
  },
];

export default function DemoExperience() {
  const [api] = useState(() =>
    createMockClient({ latencyMs: 240, weaveLatencyMs: 1200 }),
  );
  const [screen, setScreen] = useState<
    "hall" | "create" | "claim" | "organizer"
  >("hall");
  const [view, setView] = useState<Destination>("overview");
  const [data, setData] = useState<PublicMemorialResponse | null>(null);
  const [slug, setSlug] = useState(DEMO_SLUG);
  const [memorialId, setMemorialId] = useState<string>(DEMO_IDS.memorial);
  const [created, setCreated] = useState<CreateMemorialResponse | null>(null);
  const [twoD, setTwoD] = useState(false);
  const [notice, setNotice] = useState("");
  const [demoFeedback, setDemoFeedback] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const action = useAction();
  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const token = parseManageFragment(window.location.hash);
    if (window.location.hash)
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    async function load() {
      try {
        const initialSlug = params.get("slug") ?? DEMO_SLUG;
        const result = await api.getPublicMemorial(initialSlug);
        if (!active) return;
        setData(result);
        setSlug(initialSlug);
        setTwoD(params.get("mode") === "2d");
        const destination = params.get("destination");
        if (destinations.some((d) => d.key === destination))
          setView(destination as Destination);
        if (params.get("view") === "create") setScreen("create");
        if (params.has("manage") && token) {
          const id = params.get("manage")!;
          await api.exchangeOrganizerToken({ memorial_id: id, token });
          if (active) {
            setMemorialId(id);
            setScreen("organizer");
          }
        }
      } catch {
        if (active)
          setNotice(
            "This demo link is unavailable. Demo memorials reset on reload. Reopen the sample memorial below.",
          );
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [api]);
  async function visitHall() {
    await action.run(async () => {
      setData(await api.getPublicMemorial(slug));
      setScreen("hall");
      setView("overview");
    });
  }
  async function openOrganizer() {
    await action.run(async () => {
      if (memorialId === DEMO_IDS.memorial)
        await api.exchangeOrganizerToken({
          memorial_id: memorialId,
          token: DEMO_ORGANIZER_TOKEN,
        });
      else await api.getOrganizerSession();
      setScreen("organizer");
    });
  }
  function selectDestination(destination: Destination) {
    setView(destination);
    if (destination !== "overview")
      requestAnimationFrame(() => {
        panelRef.current?.focus({ preventScroll: true });
        if (window.innerWidth <= 760)
          panelRef.current?.scrollIntoView({
            behavior: reducedMotion ? "instant" : "smooth",
            block: "start",
          });
      });
  }
  return (
    <div className="demo-app">
      <div className="demo-banner">
        <span className="demo-indicator" />
        DESIGN PREVIEW
        <span className="demo-banner-detail">
          Fictional people · in-memory data · no real AI
        </span>
      </div>
      <header className="site-header">
        <Link href="/" aria-label="ZEMNE home">
          <Brand />
        </Link>
        <div className="header-actions">
          <button className="text-button" onClick={() => setScreen("create")}>
            Create a demo<span className="desktop-word"> memorial</span>
            <span className="plus">+</span>
          </button>
          {screen === "hall" && (
            <button
              className="button secondary small"
              onClick={() => void openOrganizer()}
              disabled={action.busy}
            >
              <Icon name="settings" size={16} />
              <span>Organizer</span>
            </button>
          )}
          {screen !== "hall" && (
            <button className="text-button" onClick={() => void visitHall()}>
              Return to hall
              <Icon name="arrow" size={16} />
            </button>
          )}
        </div>
      </header>
      <ErrorNotice message={action.error} fields={action.fields} />
      {notice ? (
        <main className="page-message content-width">
          <h1>A fresh beginning.</h1>
          <p>{notice}</p>
          <a className="button primary" href="/demo">
            Open sample memorial
            <Icon name="arrow" />
          </a>
        </main>
      ) : screen === "create" ? (
        <CreateMemorial
          api={api}
          onBack={() => void visitHall()}
          onCreated={(result) => {
            setCreated(result);
            setSlug(result.memorial.slug);
            setMemorialId(result.memorial_id);
            setScreen("claim");
          }}
        />
      ) : screen === "claim" && created ? (
        <ClaimLink
          created={created}
          onContinue={() => {
            setCreated(null);
            setScreen("organizer");
          }}
        />
      ) : screen === "organizer" ? (
        <Organizer
          api={api}
          memorialId={memorialId}
          onVisit={() => void visitHall()}
        />
      ) : data ? (
        <>
          <main className="hall-page">
            <div className="hall-heading">
              <div>
                <span className="eyebrow">
                  In loving remembrance / fictional demo
                </span>
                <h1>
                  {data.memorial.name}
                  <span>
                    {data.memorial.birth_year ?? ""}
                    {data.memorial.birth_year && data.memorial.death_year
                      ? " — "
                      : ""}
                    {data.memorial.death_year ?? ""}
                  </span>
                </h1>
              </div>
              <button
                className="view-switch"
                onClick={() => setTwoD(!twoD)}
                aria-pressed={twoD}
              >
                <Icon name={twoD ? "sun" : "wall"} size={16} />
                {twoD ? "Switch to 3D hall" : "Use the 2D view"}
              </button>
            </div>
            <div className={`hall-layout ${twoD ? "two-d" : ""}`}>
              <div className="hall-visual">
                {twoD ? (
                  <div className="two-d-art">
                    <Image
                      src={`/assets/${data.memorial.portrait?.key ?? "neutral-1"}.svg`}
                      alt="Original abstract memorial landscape"
                      width={240}
                      height={300}
                    />
                    <span className="eyebrow">A quiet place to remember</span>
                    <p>{data.memorial.description}</p>
                    <span className="fine-print">
                      All three destinations are available below.
                    </span>
                  </div>
                ) : (
                  <>
                    <HallScene
                      view={view}
                      onSelect={selectDestination}
                      reducedMotion={reducedMotion}
                    />
                    <div className="scene-caption">
                      <span className="scene-status">
                        <span className="status-dot" />A place to pause. A place
                        to remember.
                      </span>
                      <span>REAL-TIME 3D</span>
                    </div>
                    {view !== "overview" && (
                      <button
                        className="scene-home button secondary small"
                        onClick={() => setView("overview")}
                      >
                        <Icon name="home" size={16} />
                        Return to entrance
                      </button>
                    )}
                    <div className="scene-hint">
                      Tap the brass markers, or choose a destination below.
                    </div>
                  </>
                )}
                <nav
                  className="destination-nav"
                  aria-label="Memorial destinations"
                >
                  {destinations.map((destination) => (
                    <button
                      key={destination.key}
                      aria-pressed={view === destination.key}
                      onClick={() => selectDestination(destination.key)}
                    >
                      <span className="destination-icon">
                        <Icon name={destination.icon} />
                      </span>
                      <span>
                        {destination.label}
                        <small>{destination.caption}</small>
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
              <div
                className="hall-panel"
                key={view}
                ref={panelRef}
                tabIndex={-1}
                aria-label="Selected memorial destination"
              >
                {view === "overview" ? (
                  <section className="destination-panel welcome-panel">
                    <span className="eyebrow">You are welcome here</span>
                    <h2>
                      Distance fades.
                      <br />
                      <em>Memories stay.</em>
                    </h2>
                    <p>{data.memorial.description}</p>
                    <div className="welcome-divider" />
                    <p className="muted">
                      A thought, a story, a moment.
                      <br />
                      There is no right way to remember.
                    </p>
                    <div className="welcome-links">
                      {destinations.slice(1).map((destination, i) => (
                        <button
                          key={destination.key}
                          onClick={() => selectDestination(destination.key)}
                        >
                          <span className="number">0{i + 1}</span>
                          <span>
                            <strong>{destination.label}</strong>
                            <small>{destination.caption}</small>
                          </span>
                          <Icon name="arrow" size={18} />
                        </button>
                      ))}
                    </div>
                    <div className="hall-privacy">
                      <Icon name="leaf" size={17} />
                      <span>
                        A shared space, held with care.
                        <br />
                        Contributions are reviewed before appearing.
                      </span>
                    </div>
                  </section>
                ) : view === "wall" ? (
                  <MemoryWall data={data} />
                ) : (
                  <GuestPanel
                    key={view}
                    data={data}
                    kind={view}
                    api={api}
                    onSubmitted={async () =>
                      setData(await api.getPublicMemorial(slug))
                    }
                  />
                )}
              </div>
            </div>
          </main>
        </>
      ) : (
        <main className="page-message content-width" role="status">
          Opening the memorial…
        </main>
      )}
      <div className="demo-tools">
        <details>
          <summary>About this preview & test states</summary>
          <p role="status">{demoFeedback}</p>
          <p>
            All people and contributions are invented. Nothing is persisted or
            sent to an AI provider. Reloading restores the original fixture. A
            new demo memorial exists only in this tab.
          </p>
          <div className="button-row">
            <button
              className="button small secondary"
              onClick={() => {
                api.simulateNextError("AI_UNAVAILABLE");
                setDemoFeedback(
                  "The next demo action will show the AI-unavailable error. Reload to clear it.",
                );
              }}
            >
              Queue AI-unavailable error for the next action
            </button>
            <a className="button small secondary" href="/demo?mode=2d">
              Reload in 2D
            </a>
          </div>
        </details>
      </div>
      <footer className="site-footer">
        <Brand />
        <p>A place where memories live on.</p>
        <span>Original ZEMNE design · Fictional preview</span>
      </footer>
    </div>
  );
}
