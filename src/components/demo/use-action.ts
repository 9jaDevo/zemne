"use client";
import { useRef, useState } from "react";
import { ZemneApiError, type FieldError } from "@/shared/api";

export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<FieldError[]>([]);
  const inFlight = useRef(false);
  async function run(action: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    setFields([]);
    try {
      await action();
    } catch (cause) {
      if (cause instanceof ZemneApiError) {
        const retry = cause.body.error.retry_after_seconds;
        setError(
          cause.message + (retry ? ` Try again in ${retry} seconds.` : ""),
        );
        setFields(cause.fields);
      } else setError("We couldn't complete that action. Please try again.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return { busy, error, fields, run };
}
