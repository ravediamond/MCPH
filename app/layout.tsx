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
  title: "MCPH | Secure, Simple Crate Sharing",
  description:
    "MCPH – the USB stick for AI tools. Store, share, and auto-expire prompts, files, & model outputs with a single chat command.",
  keywords: [
    "crate sharing",
    "temporary crates",
    "secure crate transfer",
    "crate upload",
    "auto-expiring",
  ],
  authors: [{ name: "MCPH Team" }],
  openGraph: {
    title: "MCPH | Secure, Simple Crate Sharing",
    description:
      "MCPH – the USB stick for AI tools. Store, share, and auto-expire prompts, files, & model outputs with a single chat command.",
    url: "https://mcph.io",
    siteName: "MCPH",
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
    title: "MCPH | Secure, Simple Crate Sharing",
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
