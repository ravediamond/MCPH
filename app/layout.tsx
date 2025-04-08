import { ChakraProvider } from '@chakra-ui/react';
import '../styles/globals.css';

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
        <html lang="en">
            <body>
                <ChakraProvider>
                    {children}
                </ChakraProvider>
            </body>
        </html>
    );
}
