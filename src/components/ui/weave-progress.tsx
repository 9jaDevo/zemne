"use client";

import { useEffect, useState } from "react";

/** Elapsed time is informational, never a completion estimate or invented stage. */
export function weaveElapsedSeconds(startedAt: string, now: number): number {
  const start = Date.parse(startedAt);
  return Number.isFinite(start)
    ? Math.max(0, Math.floor((now - start) / 1000))
    : 0;
}

export function weaveProgressMessage(elapsed: number): string {
  return elapsed >= 45
    ? "Still waiting for Gemma. Longer waits can happen; no draft is published automatically."
    : "Gemma is preparing a draft from approved tributes. This can take 1–3 minutes.";
}

export function WeaveProgress({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(() =>
    weaveElapsedSeconds(startedAt, Date.now()),
  );
  useEffect(() => {
    const update = () => setElapsed(weaveElapsedSeconds(startedAt, Date.now()));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [startedAt]);
  return (
    <div>
      <p role="status">{weaveProgressMessage(elapsed)}</p>
      <p className="fine-print">
        <span role="timer" aria-live="off">
          Elapsed: {elapsed} seconds
        </span>
        {" · "}You can return to this console to check progress.
      </p>
    </div>
  );
}
