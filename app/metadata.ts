import type { Metadata } from "next";

const title = "MCPH | AI Artifact Storage & Sharing System";
const description =
  "One link for every AI output—store, search & share crates with ChatGPT, Claude, and your own agents. Secure, fast, and permanent storage for AI artifacts.";
const keywords = [
  "AI artifact storage",
  "crate sharing",
  "AI tool integration",
  "artifact management",
  "context sharing",
  "LLM artifacts",
  "ChatGPT",
  "Claude",
  "model context protocol",
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
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["https://mcph.com/twitter-image.png"],
    creator: "@mcphub",
  },
  metadataBase: new URL("https://mcph.com"),
};
