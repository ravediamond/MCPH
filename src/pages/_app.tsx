import { ChakraProvider } from '@chakra-ui/react'
import { AuthProvider } from '@/context/AuthContext';
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import theme from '@/theme';

export default function App({ Component, pageProps }: AppProps) {
    return (
        <ChakraProvider theme={theme}>
            <AuthProvider>
                <Component {...pageProps} />
            </AuthProvider>
        </ChakraProvider>
    )
}
