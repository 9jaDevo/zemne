import type { CSSProperties } from "react";

export type IconName =
  | "arrow"
  | "book"
  | "pen"
  | "wall"
  | "home"
  | "close"
  | "check"
  | "copy"
  | "settings"
  | "chevron"
  | "leaf"
  | "sun";
const paths: Record<IconName, string> = {
  arrow: "M4 12h15m-6-6 6 6-6 6",
  book: "M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15",
  pen: "m4 20 4-1L20 7l-3-3L5 16l-1 4Zm10-13 3 3M4 22h16",
  wall: "M4 3h16v18H4ZM8 8h8M8 12h8M8 16h5",
  home: "m3 10 9-7 9 7M5 9v12h14V9M10 21v-7h4v7",
  close: "m6 6 12 12M18 6 6 18",
  check: "m5 12 4 4L19 6",
  copy: "M9 8h11v13H9ZM15 8V3H4v13h5",
  settings: "M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6M9 15v6",
  chevron: "m9 5 7 7-7 7",
  leaf: "M5 19C0 8 8 2 21 3c0 13-6 21-16 16Zm0 0L16 8",
  sun: "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
};
export function Icon({
  name,
  size = 20,
  style,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.45"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={paths[name]} />
    </svg>
  );
}
