import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZEMNE — A place where memories live on",
  description:
    "A thoughtful place to gather, share memories and keep a life present. Design preview under development.",
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: "/brand/icon-180.png",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
