import type { Metadata } from "next";

const title = "MCP Hub | Crate Sharing & AI Tool Hand-off for Developers";
const description =
  "MCP Hub is a secure crate sharing service for developers. Seamlessly hand-off context between AI tools and services.";
const keywords = [
  "crate sharing",
  "AI tool hand-off",
  "secure file sharing",
  "developer tools",
  "context hand-off",
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
        alt: "MCP Hub | Crate Sharing & AI Tool Hand-off for Developers",
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
