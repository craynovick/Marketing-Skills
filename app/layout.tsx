import type { Metadata } from "next";
import "./globals.css";
import "./home.css";
import "./hero.css";
import "./paths.css";
import "./cookbook.css";
import "./codex-workspace.css";
import "./agent-strip.css";
import "./auth.css";
import "./skill-list.css";
import "./billing.css";
import "./navigation.css";
import "./saved-cookbook.css";
import { Header, Footer } from "@/components/chrome";

const description = "On-brand marketing workflows for strategy, messaging, and content.";
export const metadata: Metadata = {
  title: { default: "Cook Book", template: "%s · Cook Book" },
  description,
  metadataBase: new URL("https://www.cookbook.to"),
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }, { url: "/favicon.png", type: "image/png", sizes: "32x32" }], apple: "/apple-touch-icon.png" },
  openGraph: { type: "website", siteName: "Cook Book", title: "Cook Book", description, images: [{ url: "/social-preview.png", width: 1200, height: 630, alt: "Cook Book — On-brand marketing workflows for strategy, messaging, and content." }] },
  twitter: { card: "summary_large_image", title: "Cook Book", description, images: ["/social-preview.png"] },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><Header />{children}<Footer /></body></html>; }
