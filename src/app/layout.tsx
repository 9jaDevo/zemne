import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZEMNE | Project foundation",
  description: "A place where memories live on. Application under development.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
