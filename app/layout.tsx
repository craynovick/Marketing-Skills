import type { Metadata } from "next";
import "./globals.css";
import "./home.css";
import "./paths.css";
import "./cookbook.css";
import "./agent-strip.css";
import "./skill-list.css";
import { Header, Footer } from "@/components/chrome";

export const metadata: Metadata = { title: { default: "Marketing Skills", template: "%s · Marketing Skills" }, description: "Practical, deployable marketing workflows for lean teams.", metadataBase: new URL("https://marketing-skills.example.com") };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><Header />{children}<Footer /></body></html>; }
