import './globals.css';

export const metadata = {
    title: 'MCP Hub',
    description: 'A hub for Model Context Protocol integration',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="h-full">
            <body className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
                {children}
            </body>
        </html>
    );
}
