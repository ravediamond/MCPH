import { Inter, JetBrains_Mono } from 'next/font/google';
import Layout from 'components/layout/Layout';
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
    title: 'MCP Registry',
    description: 'Discover and publish Model Context Protocol (MCP) endpoints for AI tools',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${inter.variable} ${jetBrainsMono.variable}`}>
            <body className="antialiased text-neutral-900 bg-neutral-50">
                <Layout>{children}</Layout>
            </body>
        </html>
    );
}
