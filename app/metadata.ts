import type { Metadata } from "next";

const title = "MCPH | AI Artifact Storage & Sharing System";
const description =
  "MCPH is an artifact storage and sharing system for AI-generated content. Package your AI outputs in crates for easy storage and sharing.";
const keywords = [
  "AI artifact storage",
  "crate sharing",
  "AI tool integration",
  "artifact management",
  "context sharing",
];

export const metadata: Metadata = {
  title,
  description,
  keywords,
  openGraph: {
    title,
    description,
    url: "https://mcph.com",
    siteName: "MCPH",
    images: [
      {
        url: "https://mcph.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "MCPH | AI Artifact Storage & Sharing System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["https://mcph.com/twitter-image.png"],
  },
};
