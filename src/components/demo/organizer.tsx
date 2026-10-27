"use client";
import { useCallback, useEffect, useState } from "react";
import type {
  ContributionStatus,
  OrganizerMemorialResponse,
  StoryView,
  ZemneApiClient,
} from "@/shared/api";
import { ErrorNotice, Field } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { SourceDialog } from "./guest-panels";
import { useAction } from "./use-action";

function StoryEditor({
  story,
  data,
  api,
  onUpdated,
}: {
  story: StoryView;
  data: OrganizerMemorialResponse;
  api: ZemneApiClient;
  onUpdated: () => Promise<void>;
}) {
  const action = useAction();
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState("");
  const [source, setSource] = useState<string | null>(null);
  const approved = data.tributes.filter((t) => t.status === "approved");
  const tribute = approved.find((t) => t.id === source);
  return (
    <section className="editor-card">
      <div className="editor-heading">
        <span className={`badge ${story.status}`}>{story.status}</span>
        <span className="muted">Version {story.version}</span>
      </div>
      <h3>Give the words your care.</h3>
      <p className="muted">
        Review every paragraph against its sources. The fixture text is a draft,
        never a verified account.
      </p>
      <form
        onChange={() => {
          setDirty(true);
          setSaved("");
        }}
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void action.run(async () => {
            await api.updateStory(story.id, {
              action: "edit",
              version: story.version,
              title: String(form.get("title")),
              paragraphs: story.paragraphs.map((_, i) => ({
                text: String(form.get(`paragraph-${i}`)),
                source_tribute_ids: form.getAll(`sources-${i}`).map(String),
              })),
            });
            setDirty(false);
            setSaved("Your changes were saved in this demo.");
            await onUpdated();
          });
        }}
      >
        <Field label="Remembrance title" name="title" fields={action.fields}>
          <input
            id="title"
            name="title"
            maxLength={120}
            defaultValue={story.title}
            required
          />
        </Field>
        {story.paragraphs.map((paragraph, i) => (
          <div className="paragraph-editor" key={i}>
            <Field
              label={`Paragraph ${i + 1}`}
              name={`paragraph-${i}`}
              fields={action.fields}
            >
              <textarea
                id={`paragraph-${i}`}
                name={`paragraph-${i}`}
                rows={5}
                maxLength={1200}
                defaultValue={paragraph.text}
                required
              />
            </Field>
            <fieldset className="source-options">
              <legend>Contributing memories · choose at least one</legend>
              {approved.map((t) => (
                <div key={t.id}>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      name={`sources-${i}`}
                      value={t.id}
                      defaultChecked={paragraph.source_tribute_ids.includes(
                        t.id,
                      )}
                    />
                    <span>{t.contributor_name}</span>
                  </label>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => setSource(t.id)}
                  >
                    Read source
                    <Icon name="chevron" size={12} />
                  </button>
                </div>
              ))}
            </fieldset>
            {story.flags
              .filter(
                (flag) =>
                  flag.paragraph_index === i || flag.paragraph_index === null,
              )
              .map((flag, j) => (
                <p className="flag" key={j}>
                  Review note · {flag.message}
                </p>
              ))}
          </div>
        ))}
        <ErrorNotice message={action.error} fields={action.fields} />
        <p role="status" className="status-message">
          {saved}
        </p>
        <div className="button-row">
          <button className="button secondary" disabled={action.busy || !dirty}>
            {action.busy ? "Saving…" : "Save changes"}
          </button>
          <button
            className="button primary"
            type="button"
            disabled={action.busy || dirty}
            onClick={() =>
              void action.run(async () => {
                await api.updateStory(story.id, {
                  action:
                    story.status === "published" ? "unpublish" : "publish",
                  version: story.version,
                });
                await onUpdated();
              })
            }
          >
            {story.status === "published"
              ? "Unpublish remembrance"
              : "Publish to memory wall"}
            <Icon name="arrow" />
          </button>
        </div>
        {dirty && (
          <p className="fine-print">
            Save your edits before publishing. Changes to a published
            remembrance are live immediately in the demo.
          </p>
        )}
      </form>
      <div className="ai-disclosure">
        <Icon name="leaf" />
        <p>
          {story.ai.provider_label}
          <br />
          {story.ai.model_id} · No AI service called.
        </p>
      </div>
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

export function Organizer({
  api,
  memorialId,
  onVisit,
}: {
  api: ZemneApiClient;
  memorialId: string;
  onVisit: () => void;
}) {
  const [data, setData] = useState<OrganizerMemorialResponse | null>(null);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState<ContributionStatus>("pending");
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const action = useAction();
  const refresh = useCallback(async () => {
    setData(await api.getOrganizerMemorial(memorialId));
  }, [api, memorialId]);
  useEffect(() => {
    let active = true;
    api
      .getOrganizerMemorial(memorialId)
      .then((d) => {
        if (active) setData(d);
      })
      .catch(() => {
        if (active)
          setLoadError(
            "This organizer preview is unavailable. Return to the hall and reopen the demo organizer, or use the private demo link. Demo sessions reset on reload.",
          );
      });
    return () => {
      active = false;
    };
  }, [api, memorialId]);
  if (loadError)
    return (
      <main className="content-width page-message">
        <h1>Let’s reopen your space.</h1>
        <ErrorNotice message={loadError} />
        <button className="button secondary" onClick={onVisit}>
          Return to the hall
        </button>
      </main>
    );
  if (!data)
    return (
      <main className="content-width page-message" role="status">
        Opening the organizer preview…
      </main>
    );
  const pending =
    data.guestbook.filter((x) => x.status === "pending").length +
    data.tributes.filter((x) => x.status === "pending").length;
  const approved = data.tributes.filter((x) => x.status === "approved").length;
  const story = data.stories.find((s) => s.id === selected) ?? data.stories[0];
  const contributions = [
    ...data.guestbook.map((x) => ({
      ...x,
      kind: "guestbook" as const,
      text: x.message,
      name: x.display_name,
    })),
    ...data.tributes.map((x) => ({
      ...x,
      kind: "tribute" as const,
      text: x.content,
      name: x.contributor_name,
    })),
  ].filter((x) => x.status === tab);
  return (
    <main className="organizer content-width">
      <div className="organizer-intro">
        <div>
          <span className="eyebrow">The organizer’s space / DEMO</span>
          <h1>
            A little care.
            <br />
            <em>A lasting remembrance.</em>
          </h1>
          <p className="muted">
            For {data.memorial.name}. You decide what is shared.
          </p>
        </div>
        <button className="button secondary" onClick={onVisit}>
          Visit the hall
          <Icon name="arrow" />
        </button>
      </div>
      <div className="organizer-stats">
        <div>
          <span>{pending.toString().padStart(2, "0")}</span>
          <p>Awaiting your care</p>
        </div>
        <div>
          <span>{approved.toString().padStart(2, "0")}</span>
          <p>Approved tributes</p>
        </div>
        <div>
          <span>{data.published_story_id ? "Shared" : "Private"}</span>
          <p>Memory wall</p>
        </div>
      </div>
      <div className="organizer-columns">
        <section className="moderation-card">
          <span className="eyebrow">01 / Receive & review</span>
          <h2>
            Words from
            <br />
            <em>their people.</em>
          </h2>
          <p className="muted">
            Contributions are private until you approve them.
          </p>
          <div className="tabs" role="group" aria-label="Filter contributions">
            {(["pending", "approved", "rejected"] as const).map((status) => (
              <button
                key={status}
                aria-pressed={tab === status}
                onClick={() => setTab(status)}
              >
                {status[0].toUpperCase() + status.slice(1)}
                <span>
                  {
                    [...data.guestbook, ...data.tributes].filter(
                      (x) => x.status === status,
                    ).length
                  }
                </span>
              </button>
            ))}
          </div>
          <ErrorNotice message={action.error} fields={action.fields} />
          <p role="status" className="status-message">
            {message}
          </p>
          {!contributions.length && (
            <div className="empty-state">
              <Icon name="book" size={28} />
              <h3>A quiet moment.</h3>
              <p>
                No {tab} contributions. New words will appear here for your
                review.
              </p>
            </div>
          )}
          {contributions.map((entry) => (
            <article className="review-entry" key={entry.id}>
              <div className="review-entry-heading">
                <span className="avatar">{entry.name.slice(0, 1)}</span>
                <div>
                  <strong>{entry.name}</strong>
                  <small>
                    {entry.kind === "guestbook"
                      ? "Guestbook message"
                      : "Written tribute"}
                  </small>
                </div>
                <span className={`badge ${entry.status}`}>{entry.status}</span>
              </div>
              <p>{entry.text}</p>
              {entry.moderation_hints.length > 0 && (
                <p className="flag">
                  Review hints:{" "}
                  {entry.moderation_hints
                    .map((x) => x.replaceAll("_", " "))
                    .join(", ")}
                </p>
              )}
              <div className="button-row">
                {(["approved", "rejected"] as const).map((status) => (
                  <button
                    key={status}
                    className={`button small ${status === "approved" ? "secondary" : "quiet"}`}
                    disabled={action.busy || entry.status === status}
                    onClick={() =>
                      void action.run(async () => {
                        if (entry.kind === "guestbook")
                          await api.moderateGuestbookEntry(entry.id, {
                            status,
                          });
                        else {
                          const response = await api.moderateTribute(entry.id, {
                            status,
                          });
                          if (response.side_effects.unpublished_story_id)
                            setMessage(
                              "The remembrance was unpublished because one of its source tributes was rejected. Review its sources before republishing.",
                            );
                        }
                        await refresh();
                      })
                    }
                  >
                    {status === "approved" ? (
                      <>
                        <Icon name="check" size={16} />
                        Approve
                      </>
                    ) : (
                      "Reject"
                    )}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </section>
        <section className="weaver-column">
          <div className="weaver-intro">
            <div className="weaver-icon">
              <Icon name="leaf" size={30} />
            </div>
            <span className="eyebrow">02 / The memory weaver</span>
            <h2>
              Many memories.
              <br />
              <em>One thread.</em>
            </h2>
            <p>
              Gather approved tributes into a remembrance, then make it your
              own. You always have the final word.
            </p>
            <div className="notice">
              <strong>Simulated preview · no Gemma call</strong>
              <p>
                This preview uses clearly labeled, hand-written example text.
                No AI service has been called.
              </p>
            </div>
            <button
              className="button primary full"
              disabled={action.busy || approved === 0}
              onClick={() =>
                void action.run(async () => {
                  const result = await api.weaveStory(memorialId);
                  setSelected(result.story.id);
                  await refresh();
                })
              }
            >
              {action.busy
                ? "Preparing the demo draft…"
                : "Preview a demo weave"}
              <Icon name="arrow" />
            </button>
            <p className="fine-print">
              {approved === 0
                ? "Approve at least one tribute first."
                : `${approved} approved tributes · nothing is published automatically`}
            </p>
          </div>
          {data.stories.length > 1 && (
            <Field label="Choose a draft" name="draft">
              <select
                id="draft"
                value={story?.id ?? ""}
                onChange={(e) => setSelected(e.target.value)}
              >
                {data.stories.map((s, i) => (
                  <option value={s.id} key={s.id}>
                    {i === 0 ? "Latest · " : ""}
                    {s.title} ({s.status})
                  </option>
                ))}
              </select>
            </Field>
          )}
          {story ? (
            <StoryEditor
              key={`${story.id}-${story.version}`}
              story={story}
              data={data}
              api={api}
              onUpdated={refresh}
            />
          ) : (
            <div className="empty-state">
              Your first draft will appear here after a demo weave.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
