"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  parseManageFragment,
  createHttpClient,
  type CreateMemorialResponse,
  type PublicMemorialResponse,
} from "@/shared/api";
import type { Destination } from "@/3d/hall-scene";
import { Brand } from "@/components/brand";
import { Icon, type IconName } from "@/components/ui/icon";
import { ErrorNotice } from "@/components/ui/form";
import { CreateMemorial, ClaimLink } from "./demo/create-memorial";
import { GuestPanel, MemoryWall } from "./demo/guest-panels";
import { Organizer } from "./demo/organizer";
import { useAction } from "./demo/use-action";
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

export default function LiveExperience({
  slug: initialSlug,
  memorialId: initialId,
}: {
  slug?: string;
  memorialId?: string;
}) {
  const [api] = useState(() => createHttpClient());
  const router = useRouter();
  const [screen, setScreen] = useState<
    "hall" | "create" | "claim" | "organizer"
  >(initialId ? "organizer" : initialSlug ? "hall" : "create");
  const [view, setView] = useState<Destination>("overview");
  const [data, setData] = useState<PublicMemorialResponse | null>(null);
  const [slug, setSlug] = useState(initialSlug ?? "");
  const [memorialId, setMemorialId] = useState(initialId ?? "");
  const [created, setCreated] = useState<CreateMemorialResponse | null>(null);
  const [twoD, setTwoD] = useState(false);
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(!initialSlug && !initialId);
  const [sessionEpoch, setSessionEpoch] = useState(0);
  const loadRef = useRef<Promise<void> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const action = useAction();
  useEffect(() => {
    let active = true;
    if (!loadRef.current) {
      let token = parseManageFragment(window.location.hash);
      if (window.location.hash)
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
      setTwoD(new URLSearchParams(window.location.search).get("mode") === "2d");
      loadRef.current = (async () => {
        if (initialId) {
          if (token) {
            const exchange = api.exchangeOrganizerToken({
              memorial_id: initialId,
              token,
            });
            token = null;
            await exchange;
          } else await api.getOrganizerSession();
        }
        if (initialSlug) setData(await api.getPublicMemorial(initialSlug));
      })();
    }
    loadRef.current
      .then(() => {
        if (active) setReady(true);
      })
      .catch(() => {
        if (active)
          setNotice(
            initialId
              ? "Your organizer session could not be opened. Reopen the saved private link, or try again when your connection returns."
              : "This memorial could not be opened. Check the invitation link and your connection.",
          );
      });
    return () => {
      active = false;
    };
  }, [api, initialId, initialSlug]);
  useEffect(() => {
    let active = true;
    async function recoverFromFragment() {
      let token = parseManageFragment(window.location.hash);
      if (window.location.hash)
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
      if (!initialId || !token) return;
      setReady(false);
      setNotice("");
      try {
        const exchange = api.exchangeOrganizerToken({
          memorial_id: initialId,
          token,
        });
        token = null;
        await exchange;
        if (active) {
          setSessionEpoch((value) => value + 1);
          setReady(true);
        }
      } catch {
        if (active)
          setNotice(
            "Your private link could not be exchanged. Check your connection and reopen the saved link.",
          );
      }
    }
    window.addEventListener("hashchange", recoverFromFragment);
    return () => {
      active = false;
      window.removeEventListener("hashchange", recoverFromFragment);
    };
  }, [api, initialId]);
  async function visitHall() {
    if (!slug && memorialId) {
      await action.run(async () => {
        const result = await api.getOrganizerMemorial(memorialId);
        router.push(result.memorial.guest_path);
      });
    } else if (slug) router.push(`/m/${encodeURIComponent(slug)}`);
    else router.push("/");
  }
  async function openOrganizer() {
    if (memorialId) router.push(`/manage/${memorialId}`);
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
        SYNTHETIC DEMONSTRATION · Real storage and Gemma · Use invented details
        only
      </div>
      <header className="site-header">
        <Link href="/" aria-label="ZEMNE home">
          <Brand />
        </Link>
        <div className="header-actions">
          <button
            className="text-button"
            onClick={() => router.push("/create")}
          >
            Create a<span className="desktop-word"> memorial</span>
            <span className="plus">+</span>
          </button>
          {screen === "hall" && memorialId && (
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
          <h1>Let’s reopen this space.</h1>
          <p role="alert">{notice}</p>
          <button
            className="button primary"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
          <Link className="button secondary" href="/">
            Return home
          </Link>
        </main>
      ) : !ready ? (
        <main className="page-message content-width" role="status">
          Opening your space…
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
          isDemo={false}
          onContinue={() => {
            const path = created.manage_path.split("#")[0];
            setCreated(null);
            router.replace(path);
          }}
        />
      ) : screen === "organizer" ? (
        <Organizer
          key={sessionEpoch}
          api={api}
          memorialId={memorialId}
          onVisit={() => void visitHall()}
        />
      ) : data ? (
        <>
          <main className="hall-page">
            <div className="hall-heading">
              <div>
                <span className="eyebrow">In loving remembrance</span>
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
                  <MemoryWall data={data} isDemo={false} />
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
      <footer className="site-footer">
        <Brand />
        <p>A place where memories live on.</p>
        <span>Synthetic demonstration · Human review before publication</span>
      </footer>
    </div>
  );
}
