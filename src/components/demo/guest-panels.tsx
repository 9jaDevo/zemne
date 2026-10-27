"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { PublicMemorialResponse, ZemneApiClient } from "@/shared/api";
import { ErrorNotice, Field, Honeypot } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { useAction } from "./use-action";

export function SourceDialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="source-dialog"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      aria-labelledby="source-title"
    >
      <div>
        <button
          className="icon-button dialog-close"
          aria-label="Close source"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
        <span className="eyebrow">The words behind the remembrance</span>
        <h2 id="source-title">{title}</h2>
        {children}
        <button className="button secondary" onClick={onClose}>
          Back to the memory wall
        </button>
      </div>
    </dialog>
  );
}

export function GuestPanel({
  data,
  kind,
  api,
  onSubmitted,
}: {
  data: PublicMemorialResponse;
  kind: "guestbook" | "tribute";
  api: ZemneApiClient;
  onSubmitted: () => Promise<void>;
}) {
  const action = useAction();
  const [receipt, setReceipt] = useState("");
  const [writing, setWriting] = useState(kind === "tribute");
  const isBook = kind === "guestbook";
  if (receipt)
    return (
      <section
        className="destination-panel receipt-panel"
        aria-labelledby="receipt-heading"
      >
        <span className="success-circle">
          <Icon name="check" size={28} />
        </span>
        <span className="eyebrow">Held with care</span>
        <h2 id="receipt-heading" tabIndex={-1}>
          Your words are
          <br />
          <em>in good hands.</em>
        </h2>
        <p role="status">{receipt}</p>
        <p className="fine-print">
          Demo only · stored in this tab, not sent to a family. Your
          contribution is pending and remains hidden from visitors.
        </p>
        <button
          className="button secondary"
          onClick={() => {
            setReceipt("");
            setWriting(false);
          }}
        >
          Return to {isBook ? "guestbook" : "tributes"}
          <Icon name="arrow" />
        </button>
      </section>
    );
  return (
    <section className="destination-panel" aria-labelledby="destination-title">
      <div className="panel-title">
        <span className="eyebrow">
          {isBook ? "01 / The guestbook" : "02 / The tribute lectern"}
        </span>
        <h2 id="destination-title">
          {isBook ? (
            <>
              Leave a little
              <br />
              <em>of your presence.</em>
            </>
          ) : (
            <>
              Some memories
              <br />
              <em>deserve a place.</em>
            </>
          )}
        </h2>
        <p>
          {isBook
            ? "A few words can mean more than you know."
            : "A small moment. An everyday kindness. Tell the story only you can tell."}
        </p>
      </div>
      {!writing ? (
        <>
          <button
            className="button primary full"
            onClick={() => setWriting(true)}
          >
            <Icon name={isBook ? "book" : "pen"} />
            {isBook ? "Sign the guestbook" : "Write a tribute"}
            <Icon name="arrow" />
          </button>
          <div className="section-label">
            <span>{isBook ? "Words left with love" : "Shared memories"}</span>
            <span>{isBook ? data.guestbook.length : data.tributes.length}</span>
          </div>
          {isBook ? (
            data.guestbook.length ? (
              data.guestbook.map((entry) => (
                <article className="contribution" key={entry.id}>
                  <p>“{entry.message}”</p>
                  <div className="author">
                    <span className="avatar">
                      {entry.display_name.slice(0, 1)}
                    </span>
                    <strong>{entry.display_name}</strong>
                  </div>
                </article>
              ))
            ) : (
              <p className="empty-state">
                The guestbook is waiting for its first words. Pending messages
                appear only after approval.
              </p>
            )
          ) : data.tributes.length ? (
            data.tributes.map((tribute) => (
              <article className="contribution" key={tribute.id}>
                <p>{tribute.content}</p>
                <strong>{tribute.contributor_name}</strong>
                <small>{tribute.relationship}</small>
              </article>
            ))
          ) : (
            <p className="empty-state">
              A remembrance begins with one shared memory. Approved tributes
              will appear here.
            </p>
          )}
        </>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const values = new FormData(form);
            void action.run(async () => {
              const common = {
                consent: (values.get("consent") === "on") as true,
                website: String(values.get("website") ?? ""),
              };
              const response = isBook
                ? await api.submitGuestbookEntry(data.memorial.slug, {
                    ...common,
                    display_name: String(values.get("display_name")),
                    message: String(values.get("message")),
                  })
                : await api.submitTribute(data.memorial.slug, {
                    ...common,
                    contributor_name: String(values.get("contributor_name")),
                    relationship: String(values.get("relationship") ?? ""),
                    content: String(values.get("content")),
                  });
              setReceipt(response.message);
              form.reset();
              await onSubmitted();
            });
          }}
        >
          <Field
            label="Your name"
            name={isBook ? "display_name" : "contributor_name"}
            fields={action.fields}
          >
            <input
              id={isBook ? "display_name" : "contributor_name"}
              name={isBook ? "display_name" : "contributor_name"}
              placeholder="How would you like to be known?"
              maxLength={60}
              required
              autoComplete="name"
            />
          </Field>
          {!isBook && (
            <Field
              label="Your connection"
              name="relationship"
              hint="Optional"
              fields={action.fields}
            >
              <input
                id="relationship"
                name="relationship"
                maxLength={60}
                placeholder="A friend, a neighbour, a student…"
              />
            </Field>
          )}
          <Field
            label={isBook ? "Your message" : "Your memory"}
            name={isBook ? "message" : "content"}
            fields={action.fields}
            hint={
              isBook
                ? "Up to 500 characters"
                : "10–2,000 characters. Please avoid private personal information."
            }
          >
            <textarea
              id={isBook ? "message" : "content"}
              name={isBook ? "message" : "content"}
              rows={isBook ? 4 : 7}
              minLength={isBook ? 1 : 10}
              maxLength={isBook ? 500 : 2000}
              placeholder={
                isBook ? "Thinking of you and your family…" : "I remember when…"
              }
              required
            />
          </Field>
          <label className="checkbox">
            <input type="checkbox" name="consent" required />
            <span>
              I agree that my words may be displayed to visitors after the
              organizer approves them.
            </span>
          </label>
          <Honeypot />
          <ErrorNotice message={action.error} fields={action.fields} />
          <button className="button primary full" disabled={action.busy}>
            {action.busy
              ? "Leaving your words…"
              : isBook
                ? "Leave my message"
                : "Submit my tribute"}
            <Icon name="arrow" />
          </button>
          <button
            className="text-button full"
            type="button"
            onClick={() => setWriting(false)}
          >
            Back to shared {isBook ? "messages" : "memories"}
          </button>
          <p className="fine-print">
            Every contribution is reviewed before it appears. This demo stores
            fictional content only in memory.
          </p>
        </form>
      )}
    </section>
  );
}

export function MemoryWall({ data }: { data: PublicMemorialResponse }) {
  const [source, setSource] = useState<string | null>(null);
  const tribute = data.tributes.find((item) => item.id === source);
  return (
    <section className="destination-panel memory-wall">
      <span className="eyebrow">03 / The memory wall</span>
      <h2>
        A life, remembered
        <br />
        <em>in many voices.</em>
      </h2>
      {data.story ? (
        <>
          <div className="story-meta">
            <span className="status-dot" />
            Shared by the organizer · DEMO
          </div>
          <h3>{data.story.title.replace("[DEMO] ", "")}</h3>
          {data.story.paragraphs.map((paragraph, i) => (
            <article className="story-paragraph" key={i}>
              <p>{paragraph.text}</p>
              <div className="source-chips">
                {paragraph.source_tribute_ids.map((id) => {
                  const t = data.tributes.find((t) => t.id === id);
                  return t ? (
                    <button key={id} onClick={() => setSource(id)}>
                      <Icon name="book" size={13} />
                      {t.contributor_name}
                      <Icon name="chevron" size={12} />
                    </button>
                  ) : null;
                })}
              </div>
            </article>
          ))}
          <div className="ai-disclosure">
            <Icon name="leaf" />
            <p>
              <strong>Words gathered. Human care, always.</strong>
              <br />
              {data.story.ai.provider_label}. Model label:{" "}
              {data.story.ai.model_id}.{" "}
              {data.story.edited_by_organizer
                ? "Edited and published by the demo organizer."
                : "Published by the demo organizer."}{" "}
              No AI has been called in this preview.
            </p>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <Icon name="wall" size={30} />
          <h3>A story is still taking shape.</h3>
          <p>
            When the organizer publishes a remembrance, it will appear here
            alongside the memories that inspired it.
          </p>
        </div>
      )}
      {tribute && (
        <SourceDialog
          title={tribute.contributor_name}
          onClose={() => setSource(null)}
        >
          <p className="muted">
            {tribute.relationship} · Approved fictional tribute
          </p>
          <blockquote>{tribute.content}</blockquote>
        </SourceDialog>
      )}
    </section>
  );
}
