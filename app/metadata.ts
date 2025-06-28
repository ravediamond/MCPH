import type { Metadata } from "next";

const title = "MCP Hub | AI Artifact Storage & Sharing System";
const description =
  "MCP Hub is an artifact storage and sharing system for AI-generated content. Package your AI outputs in crates for easy storage and sharing.";
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
    url: "https://mcphub.com",
    siteName: "MCP Hub",
    images: [
      {
        url: "https://mcphub.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "MCP Hub | AI Artifact Storage & Sharing System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["https://mcphub.com/twitter-image.png"],
  },
};
