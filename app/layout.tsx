import { Inter, JetBrains_Mono } from 'next/font/google';
import Layout from 'components/layout/Layout';
import { Toaster } from 'react-hot-toast';
import SupabaseProvider from './supabase-provider';
import './globals.css';

// Load fonts
const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});

const jetBrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-jetbrains-mono',
});

export const metadata = {
    metadataBase: new URL('https://mcph.io'),
    title: 'MCP Registry',
    description: 'Discover and publish Model Context Protocol (MCP) endpoints for AI tools',
    keywords: ['MCP', 'Model Context Protocol', 'AI tools', 'AI endpoints', 'API registry'],
    authors: [{ name: 'MCPHub Team' }],
    openGraph: {
        title: 'MCP Registry',
        description: 'Discover and publish Model Context Protocol (MCP) endpoints for AI tools',
        url: 'https://mcph.io',
        siteName: 'MCP Registry',
        images: [
            {
                url: '/icon-transparent.png',
                width: 800,
                height: 600,
                alt: 'MCP Registry Logo',
            }
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'MCP Registry',
        description: 'Discover and publish Model Context Protocol (MCP) endpoints for AI tools',
        images: ['/icon-transparent.png'],
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
    return (
        <html lang="en" className={`${inter.variable} ${jetBrainsMono.variable}`}>
            <body className="antialiased text-neutral-900 bg-neutral-50">
                <Toaster position="top-center" />
                <SupabaseProvider>
                    <Layout>{children}</Layout>
                </SupabaseProvider>
            </body>
        </html>
    );
}
