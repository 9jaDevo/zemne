import {
  cloneElement,
  isValidElement,
  type ReactNode,
  type ReactElement,
} from "react";
import type { FieldError } from "@/shared/api";

export function Field({
  label,
  name,
  fields = [],
  hint,
  children,
}: {
  label: string;
  name: string;
  fields?: FieldError[];
  hint?: string;
  children: ReactNode;
}) {
  const issue = fields.find((field) => field.path === name);
  const input = isValidElement(children)
    ? cloneElement(
        children as ReactElement<{
          "aria-invalid"?: boolean;
          "aria-describedby"?: string;
        }>,
        {
          "aria-invalid": Boolean(issue),
          "aria-describedby":
            [hint ? `${name}-hint` : "", issue ? `${name}-error` : ""]
              .filter(Boolean)
              .join(" ") || undefined,
        },
      )
    : children;
  return (
    <div className={`field ${issue ? "field-invalid" : ""}`}>
      <label htmlFor={name}>{label}</label>
      {hint && (
        <span id={`${name}-hint`} className="field-hint">
          {hint}
        </span>
      )}
      {input}
      {issue && (
        <span className="field-error" id={`${name}-error`}>
          {issue.message}
        </span>
      )}
    </div>
  );
}
export function ErrorNotice({
  message,
  fields = [],
}: {
  message: string;
  fields?: FieldError[];
}) {
  if (!message) return null;
  return (
    <div className="notice error" role="alert">
      <strong>Something needs your attention</strong>
      <p>{message}</p>
      {fields.length > 0 && (
        <ul>
          {fields.map((f, i) => (
            <li key={i}>
              {f.path.replaceAll("_", " ")}: {f.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
export function Honeypot() {
  return (
    <div className="honeypot" aria-hidden="true">
      <label htmlFor="website">Leave this blank</label>
      <input id="website" name="website" tabIndex={-1} autoComplete="off" />
    </div>
  );
}
