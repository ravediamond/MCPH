import Document, { Html, Head, Main, NextScript } from 'next/document';
import { ColorModeScript } from '@chakra-ui/react';
import theme from '@/theme';

export default class MyDocument extends Document {
    render() {
        return (
            <Html>
                <Head />
                <body>
                    <ColorModeScript initialColorMode={theme.config?.initialColorMode || 'light'} />
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}