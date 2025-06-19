import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCPH - One Link for Humans & AI Agents",
  description:
    "Share AI-generated content instantly with both humans and AI agents through a single link. No login required to view content.",
  keywords: [
    "AI content sharing",
    "file sharing",
    "AI tools",
    "model context protocol",
    "MCP",
    "file upload",
    "shareable links",
  ],
  openGraph: {
    title: "MCPH - One Link for Humans & AI Agents",
    description:
      "Share AI-generated content instantly with both humans and AI agents through a single link. No login required to view content.",
    url: "https://mcph.io",
    siteName: "MCPH",
    images: [
      {
        url: "https://mcph.io/og-image.png",
        width: 1200,
        height: 630,
        alt: "MCPH - Share AI content instantly",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MCPH - One Link for Humans & AI Agents",
    description:
      "Share AI-generated content instantly with both humans and AI agents through a single link. No login required to view content.",
    images: ["https://mcph.io/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "verification_token",
  },
  alternates: {
    canonical: "https://mcph.io",
  },
};
