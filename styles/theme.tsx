import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
    colors: {
        brand: {
            100: '#f7fafc',
            500: '#3182ce', // primary brand color
            900: '#1a202c',
        },
    },
    fonts: {
        heading: `'Segoe UI', sans-serif`,
        body: `'Open Sans', sans-serif`,
    },
    styles: {
        global: {
            body: {
                bg: 'gray.50',
                color: 'gray.800',
            },
        },
    },
});

export default theme;
