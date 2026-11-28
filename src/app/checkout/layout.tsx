import type { Metadata } from "next";

// Client page — metadata lives here. Utility page: keep it out of the index
// (and stop it inheriting any canonical), but let crawlers follow its links.
export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
