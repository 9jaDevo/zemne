import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GuestPanel } from "../../src/components/demo/guest-panels";
import {
  WeaveProgress,
  weaveElapsedSeconds,
} from "../../src/components/ui/weave-progress";
import {
  createMockClient,
  demoPublicMemorialResponse,
  demoEmptyPublicMemorialResponse,
} from "../../src/shared/fixtures";

afterEach(() => vi.useRealTimers());

describe("BUG-P7-02: tribute navigation", () => {
  function render(
    data: typeof demoPublicMemorialResponse,
    kind: "tribute" | "guestbook",
  ) {
    return renderToStaticMarkup(
      createElement(GuestPanel, {
        data,
        kind,
        api: createMockClient(),
        onSubmitted: async () => {},
      }),
    );
  }
  it("opens existing approved tributes for reading before composing", () => {
    const html = render(demoPublicMemorialResponse, "tribute");
    expect(html).toContain("Write a tribute");
    expect(html).toContain(
      demoPublicMemorialResponse.tributes[0].contributor_name,
    );
    expect(html).not.toContain('id="content"');
  });
  it("keeps the direct compose flow for an empty tribute wall", () => {
    const html = render(demoEmptyPublicMemorialResponse, "tribute");
    expect(html).toContain('id="content"');
    expect(html).toContain("Submit my tribute");
  });
  it("keeps guestbook list-first behavior", () => {
    expect(render(demoPublicMemorialResponse, "guestbook")).toContain(
      "Sign the guestbook",
    );
  });
});

describe("BUG-P7-01: truthful elapsed weave progress", () => {
  it("resumes from the job timestamp rather than restarting at zero", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-27T18:01:30Z"));
    const html = renderToStaticMarkup(
      createElement(WeaveProgress, { startedAt: "2026-10-27T18:00:00Z" }),
    );
    expect(html).toContain("90 seconds");
    expect(html).toContain("Still waiting for Gemma");
    expect(html).toContain('role="timer" aria-live="off"');
    expect(html).not.toMatch(/\d+%/);
  });
  it("shows reassurance at 45 seconds and an honest wait before then", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-27T18:00:44Z"));
    const render = () =>
      renderToStaticMarkup(
        createElement(WeaveProgress, { startedAt: "2026-10-27T18:00:00Z" }),
      );
    expect(render()).toContain("preparing a draft");
    vi.setSystemTime(new Date("2026-10-27T18:00:45Z"));
    expect(render()).toContain("Still waiting for Gemma");
  });
  it("does not display negative or invalid elapsed durations", () => {
    expect(
      weaveElapsedSeconds(
        "2026-10-27T18:00:00Z",
        Date.parse("2026-10-27T17:59:59Z"),
      ),
    ).toBe(0);
    expect(weaveElapsedSeconds("invalid", Date.now())).toBe(0);
  });
});
