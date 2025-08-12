import { Inter, JetBrains_Mono } from "next/font/google";
import Layout from "components/layout/Layout";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../contexts/AuthContext";
import "./globals.css";

// Load fonts
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export const metadata = {
  metadataBase: new URL("https://mcph.io"),
  title: "Enterprise AI Artifact Management Platform",
  description:
    "Enterprise-grade platform for managing, storing, and collaborating on AI-generated artifacts within your organization. Built with security, compliance, and scalability as core principles.",
  keywords: [
    "enterprise AI management",
    "artifact storage",
    "team collaboration",
    "compliance",
    "AI governance",
  ],
  authors: [{ name: "Enterprise AI Platform Team" }],
  openGraph: {
    title: "Enterprise AI Artifact Management Platform",
    description:
      "Enterprise-grade platform for managing, storing, and collaborating on AI-generated artifacts within your organization. Built with security, compliance, and scalability as core principles.",
    url: "https://mcph.io",
    siteName: "Enterprise AI Platform",
    images: [
      {
        url: "/icon-transparent.png",
        width: 800,
        height: 600,
        alt: "MCPH Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Enterprise AI Artifact Management Platform",
    description:
      "Upload and share crates that automatically expire. No account required.",
    images: ["/icon-transparent.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Dynamically set canonical URL based on current path
  // This works for static export and SSR
  const canonical =
    typeof window !== "undefined"
      ? `https://mcph.io${window.location.pathname}`
      : undefined;

  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetBrainsMono.variable} dark`}
    >
      <head>{canonical && <link rel="canonical" href={canonical} />}</head>
      <body className="antialiased text-gray-200 bg-gray-900 min-h-screen">
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#1f2937",
              color: "#e5e7eb",
              border: "1px solid #374151",
            },
          }}
        />
        <AuthProvider>
          <Layout>{children}</Layout>
        </AuthProvider>
      </body>
    </html>
  );
}
