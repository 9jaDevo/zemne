"use client";
import Image from "next/image";
import { useState } from "react";
import type { CreateMemorialResponse, ZemneApiClient } from "@/shared/api";
import { ErrorNotice, Field, Honeypot } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { useAction } from "./use-action";

export function CreateMemorial({
  api,
  onCreated,
  onBack,
}: {
  api: ZemneApiClient;
  onCreated: (result: CreateMemorialResponse) => void;
  onBack: () => void;
}) {
  const action = useAction();
  const [portrait, setPortrait] = useState<
    "neutral-1" | "neutral-2" | "neutral-3"
  >("neutral-1");
  return (
    <main className="create-layout content-width">
      <aside className="create-aside">
        <span className="eyebrow">A space of their own</span>
        <h1>
          Every life leaves
          <br />
          <em>a story.</em>
        </h1>
        <p>
          Bring the people who knew them into one thoughtful place. Start with a
          name. The memories will follow.
        </p>
        <div className="aside-note">
          <Icon name="leaf" />
          <p>
            No accounts. No public directory.
            <br />
            Only the people you invite.
          </p>
        </div>
        <Image
          className="create-art"
          src={`/assets/${portrait}.svg`}
          alt="Abstract landscape in an arch, a neutral memorial illustration"
          width={320}
          height={400}
        />
      </aside>
      <section className="form-card">
        <button className="text-button back" onClick={onBack}>
          ← Back to the hall
        </button>
        <span className="eyebrow">01 / Create a demo memorial</span>
        <h2>Begin with their name.</h2>
        <p className="muted">
          This is a fictional design preview. Please use invented details only.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            void action.run(async () => {
              const response = await api.createMemorial({
                name: String(data.get("name")),
                description: String(data.get("description")),
                birth_year: data.get("birth_year")
                  ? Number(data.get("birth_year"))
                  : null,
                death_year: data.get("death_year")
                  ? Number(data.get("death_year"))
                  : null,
                portrait_key: portrait,
                privacy_acknowledged: (data.get("privacy_acknowledged") ===
                  "on") as true,
                website: String(data.get("website") ?? ""),
              });
              onCreated(response);
            });
          }}
        >
          <Field label="Full name" name="name" fields={action.fields}>
            <input
              id="name"
              name="name"
              placeholder="The name they were known by"
              maxLength={80}
              required
              autoComplete="off"
              aria-describedby="name-error"
              aria-invalid={action.fields.some((f) => f.path === "name")}
            />
          </Field>
          <div className="form-row">
            <Field
              label="Year of birth"
              name="birth_year"
              hint="Optional"
              fields={action.fields}
            >
              <input
                id="birth_year"
                name="birth_year"
                type="number"
                min={1800}
                max={new Date().getFullYear()}
                placeholder="1941"
              />
            </Field>
            <Field
              label="Year of passing"
              name="death_year"
              hint="Optional"
              fields={action.fields}
            >
              <input
                id="death_year"
                name="death_year"
                type="number"
                min={1800}
                max={new Date().getFullYear()}
                placeholder="2025"
              />
            </Field>
          </div>
          <Field
            label="A few words about them"
            name="description"
            fields={action.fields}
          >
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="What would you like visitors to know?"
              maxLength={500}
              required
            />
          </Field>
          <fieldset className="portrait-picker">
            <legend>Choose an illustration</legend>
            <p className="field-hint">
              Original abstract artwork. No portrait upload needed.
            </p>
            <div>
              {(["neutral-1", "neutral-2", "neutral-3"] as const).map(
                (key, i) => (
                  <label
                    key={key}
                    className={portrait === key ? "selected" : ""}
                  >
                    <input
                      type="radio"
                      name="portrait"
                      value={key}
                      checked={portrait === key}
                      onChange={() => setPortrait(key)}
                    />
                    <Image
                      src={`/assets/${key}.svg`}
                      alt={["Garden", "Still water", "Warm earth"][i]}
                      width={66}
                      height={82}
                    />
                    <span>{["Garden", "Still water", "Earth"][i]}</span>
                  </label>
                ),
              )}
            </div>
          </fieldset>
          <label className="checkbox">
            <input type="checkbox" name="privacy_acknowledged" required />
            <span>
              I understand that anyone with the invitation link can see approved
              content. I am using fictional details in this demo.
            </span>
          </label>
          <Honeypot />
          <ErrorNotice message={action.error} fields={action.fields} />
          <button className="button primary full" disabled={action.busy}>
            {action.busy
              ? "Creating your demo space…"
              : "Create a demo memorial"}
            <Icon name="arrow" />
          </button>
          <p className="fine-print">
            You’ll receive a private organizer link. Save it carefully: lost
            links cannot be recovered. Demo data resets when the page reloads.
          </p>
        </form>
      </section>
    </main>
  );
}

export function ClaimLink({
  created,
  onContinue,
}: {
  created: CreateMemorialResponse;
  onContinue: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const guest = `/demo?slug=${created.memorial.slug}`;
  const privatePath = `/demo?manage=${created.memorial_id}#key=${created.organizer_token}`;
  async function copy(path: string, label: string) {
    try {
      await navigator.clipboard.writeText(window.location.origin + path);
      setMessage(`${label} copied.`);
    } catch {
      setMessage(
        "Copy unavailable. Select the link text below and copy it manually.",
      );
    }
  }
  return (
    <main className="claim-wrap">
      <span className="success-circle">
        <Icon name="check" size={30} />
      </span>
      <span className="eyebrow">02 / Your demo space is ready</span>
      <h1>
        A place for
        <br />
        <em>{created.memorial.name}.</em>
      </h1>
      <p className="muted">Two links. Two different purposes.</p>
      <div className="link-card private">
        <span className="eyebrow">Keep this one to yourself</span>
        <h2>SAVE THIS PRIVATE LINK</h2>
        <p>
          It gives access to moderation, drafts and publication. A lost link
          cannot be recovered.
        </p>
        <code>{privatePath}</code>
        <button
          className="button primary"
          onClick={() => void copy(privatePath, "Private demo link")}
        >
          <Icon name="copy" />
          Copy private demo link
        </button>
      </div>
      <div className="link-card">
        <span className="eyebrow">Share with your people</span>
        <h2>The invitation link</h2>
        <p>
          Anyone with this link can read approved memories and leave a
          contribution.
        </p>
        <code>{guest}</code>
        <button
          className="button secondary"
          onClick={() => void copy(guest, "Invitation")}
        >
          <Icon name="copy" />
          Copy demo invitation
        </button>
      </div>
      <p className="notice">
        DEMO ONLY: these links are not secure access credentials. New memorials
        exist only in this tab until reload.
      </p>
      <p role="status" className="status-message">
        {message}
      </p>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={saved}
          onChange={(e) => setSaved(e.target.checked)}
        />
        <span>
          I have saved the private link and understand it must not be shared.
        </span>
      </label>
      <button
        className="button primary full"
        disabled={!saved}
        onClick={onContinue}
      >
        Open organizer preview
        <Icon name="arrow" />
      </button>
    </main>
  );
}
